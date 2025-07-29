import os
import uuid
import logging
import json
from typing import Dict, Any, AsyncGenerator
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.agents import initialize_agent, AgentType
import yaml
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logger
logger = logging.getLogger("agent_backend")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"))
if not logger.handlers:
    logger.addHandler(handler)

# FastAPI app
app = FastAPI(title="LangChain Agent Backend")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Config:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    VERBOSE = os.getenv("AGENT_VERBOSE", "true").lower() == "true"
    TOOL_REGISTRY_PATH = os.getenv("TOOL_REGISTRY_PATH", "tools/tool_registry.yaml")
    SYSTEM_PROMPT_PATH = os.getenv("SYSTEM_PROMPT_PATH", "system_prompt.yaml")

# Pydantic models
class AgentState(BaseModel):
    messages: list = []
    tool_needed: str | None = None
    tool_found: str | None = None
    tool_lookup_result: str | None = None
    tool_gen_result: str | None = None
    result: str | None = None

    class Config:
        arbitrary_types_allowed = True

class QueryRequest(BaseModel):
    message: str

# Initialize LLM and embeddings
os.environ["GOOGLE_API_KEY"] = "AIzaSyA35dFqaffbE1bGiVDgs3joLRQI1bMetV0"
llm = GoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)
embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Load system prompt
def load_system_prompt() -> str:
    try:
        with open(Config.SYSTEM_PROMPT_PATH) as f:
            config = yaml.safe_load(f)
        prompt = config.get("system_prompt", "")
        if not prompt:
            raise ValueError("System prompt is empty or missing")
        logger.info(json.dumps({"event": "prompt_loaded", "path": Config.SYSTEM_PROMPT_PATH}))
        return prompt
    except Exception as e:
        logger.error(json.dumps({"event": "prompt_load_error", "error": str(e)}))
        raise

# Load tools
def load_tool(tool_name: str = None) -> list:
    logger.debug(json.dumps({"event": "load_tool_start", "tool_name": tool_name}))
    if not os.path.exists(Config.TOOL_REGISTRY_PATH):
        raise FileNotFoundError(f"Registry not found at {Config.TOOL_REGISTRY_PATH}")
    with open(Config.TOOL_REGISTRY_PATH) as f:
        registry = yaml.safe_load(f) or []
    tools = []
    for entry in registry:
        if tool_name and entry.get("name") != tool_name:
            continue
        t_name = entry.get("name")
        t_file = entry.get("saved_in")
        if not t_name or not t_file:
            logger.error(json.dumps({"event": "invalid_registry_entry", "entry": str(entry)}))
            continue
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(t_name, t_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            tool_fn = getattr(module, t_name)
            tools.append(tool_fn)
            logger.info(json.dumps({"event": "tool_loaded", "tool_name": t_name}))
        except Exception as e:
            logger.error(json.dumps({"event": "tool_load_error", "tool_name": t_name, "error": str(e)}))
    return tools

# Nodes
async def input_node(state: AgentState, send: callable) -> AgentState:
    await send({"node": "input", "state": state.dict()})
    return state

async def load_and_use_tool(state: AgentState, send: callable) -> AgentState:
    try:
        tools = load_tool()
        tool_agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            handle_parsing_errors=True,
            verbose=Config.VERBOSE
        )
        response = tool_agent.invoke(state.messages)
        state.messages.append(AIMessage(content=str(response)))
        state.result = str(response)
        await send({"node": "load_use_tool", "state": state.dict(), "response": state.result})
    except Exception as e:
        state.messages.append(AIMessage(content=f"Error: {e}"))
        state.result = f"Error: {e}"
        await send({"node": "load_use_tool", "state": state.dict(), "error": str(e)})
    return state

async def final_llm_response(state: AgentState, send: callable) -> AgentState:
    result = state.result or "No result available"
    await send({"node": "final", "state": state.dict(), "result": result})
    return state

# Build graph with streaming support
async def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("input", lambda state: input_node(state, send))
    graph.add_node("load_use_tool", lambda state: load_and_use_tool(state, send))
    graph.add_node("final", lambda state: final_llm_response(state, send))
    graph.set_entry_point("input")
    graph.add_edge("input", "load_use_tool")
    graph.add_edge("load_use_tool", "final")
    graph.add_edge("final", END)
    return graph.compile()

# REST endpoint
@app.post("/api/run")
async def run_agent_endpoint(request: QueryRequest) -> Dict[str, Any]:
    execution_id = str(uuid.uuid4())
    logger.debug(json.dumps({"event": "run_agent_start", "execution_id": execution_id, "message": request.message}))
    try:
        graph = await build_graph()
        state = AgentState(messages=[HumanMessage(content=request.message)])
        final_state = await graph.ainvoke(state)
        logger.debug(json.dumps({"event": "run_agent_end", "execution_id": execution_id}))
        return {"response": final_state.result, "messages": [msg.dict() for msg in final_state.messages]}
    except Exception as e:
        logger.error(json.dumps({"event": "run_agent_error", "execution_id": execution_id, "error": str(e)}))
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint
@app.websocket("/ws/run")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        query = data.get("message")
        if not query:
            await websocket.send_json({"error": "No message provided"})
            await websocket.close()
            return

        execution_id = str(uuid.uuid4())
        logger.debug(json.dumps({"event": "ws_run_start", "execution_id": execution_id, "message": query}))

        async def send(data: Dict[str, Any]):
            await websocket.send_json(data)

        graph = await build_graph()
        state = AgentState(messages=[HumanMessage(content=query)])
        async for event in graph.astream(state):
            await send({"event": "stream", "data": event})
        
        await websocket.send_json({"event": "complete", "result": state.result})
        logger.debug(json.dumps({"event": "ws_run_end", "execution_id": execution_id}))
    except Exception as e:
        logger.error(json.dumps({"event": "ws_run_error", "execution_id": execution_id, "error": str(e)}))
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)