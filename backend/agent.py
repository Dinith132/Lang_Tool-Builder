import logging
import json
import os
import yaml
import importlib.util
import uuid
from typing import Annotated, Sequence, Callable, Dict, Any, List, Optional
from functools import wraps
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.agents import initialize_agent, AgentType
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Configure logger
logger = logging.getLogger("agent")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Verbose mode toggle
VERBOSE = os.getenv("AGENT_VERBOSE", "true").lower() == "true"

# Helper function to serialize AgentState
def serialize_agent_state(state: Any) -> Dict[str, Any]:
    # Convert AddableValuesDict to AgentState if necessary
    if not isinstance(state, AgentState):
        state = AgentState(**state)
    state_dict = state.dict()
    # Convert messages to a serializable format
    state_dict["messages"] = [
        {
            "type": msg.get("type", msg.__class__.__name__) if isinstance(msg, dict) else msg.__class__.__name__,
            "content": msg.get("content", "") if isinstance(msg, dict) else msg.content,
            "additional_kwargs": msg.get("additional_kwargs", {}) if isinstance(msg, dict) else msg.additional_kwargs,
            "response_metadata": msg.get("response_metadata", {}) if isinstance(msg, dict) else msg.response_metadata,
            "id": msg.get("id", getattr(msg, "id", None)) if isinstance(msg, dict) else getattr(msg, "id", None)
        }
        for msg in state_dict["messages"]
    ]
    return state_dict

# Node logging decorator with streaming support
def log_node(func):
    @wraps(func)
    async def wrapper(state: "AgentState", stream_callback: Optional[Callable[[Dict], None]] = None) -> "AgentState":
        if not VERBOSE:
            return await func(state, stream_callback)
        node_name = func.__name__
        log_data = {
            "node": node_name,
            "input_state": {k: str(v)[:100] for k, v in serialize_agent_state(state).items()},
            "timestamp": logging.Formatter().formatTime(logging.makeLogRecord({}))
        }
        logger.debug(json.dumps({"event": "node_entry", **log_data}))
        if stream_callback:
            await stream_callback({"event": "node_entry", **log_data})
        try:
            result = await func(state, stream_callback)
            log_data["output_state"] = {k: str(v)[:100] for k, v in serialize_agent_state(result).items()}
            logger.debug(json.dumps({"event": "node_exit", **log_data}))
            if stream_callback:
                await stream_callback({"event": "node_exit", **log_data})
            return result
        except Exception as e:
            log_data["error"] = str(e)
            logger.error(json.dumps({"event": "node_error", **log_data}))
            if stream_callback:
                await stream_callback({"event": "node_error", **log_data})
            raise
    return wrapper

# Define AgentState with Pydantic
class AgentState(BaseModel):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    tool_needed: Optional[str] = None
    tool_found: Optional[str] = None
    tool_lookup_result: Optional[str] = None
    tool_gen_result: Optional[str] = None
    result: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

# Initialize LLM and embeddings
def initialize_llm_and_embeddings():
    os.environ["GOOGLE_API_KEY"] = "AIzaSyA35dFqaffbE1bGiVDgs3joLRQI1bMetV0"
    llm = GoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)
    embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    return llm, embedding

# Load system prompt
def load_system_prompt(prompt_path: str = "system_prompt.yaml") -> str:
    try:
        if not os.path.exists(prompt_path):
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
        with open(prompt_path) as f:
            config = yaml.safe_load(f)
        prompt = config.get("system_prompt", "")
        if not prompt:
            raise ValueError("System prompt is empty or missing in YAML")
        logger.info(json.dumps({"event": "prompt_loaded", "path": prompt_path}))
        return prompt
    except Exception as e:
        logger.error(json.dumps({"event": "prompt_load_error", "error": str(e)}))
        raise

# Load tools
def load_tool(registry_path: str, tool_name: str = None) -> List[Callable]:
    logger.debug(json.dumps({"event": "load_tool_start", "registry_path": registry_path, "tool_name": tool_name}))
    if not os.path.exists(registry_path):
        raise FileNotFoundError(f"Registry not found at {registry_path}")
    with open(registry_path) as f:
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
        if not os.path.exists(t_file):
            logger.error(json.dumps({"event": "tool_file_missing", "file": t_file}))
            continue
        module_name = os.path.splitext(os.path.basename(t_file))[0]
        try:
            spec = importlib.util.spec_from_file_location(module_name, t_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            tool_fn = getattr(module, t_name)
            tools.append(tool_fn)
            logger.info(json.dumps({"event": "tool_loaded", "tool_name": t_name}))
        except Exception as e:
            logger.error(json.dumps({"event": "tool_load_error", "tool_name": t_name, "file": t_file, "error": str(e)}))
    if tool_name and not tools:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return tools

# Nodes
@log_node
async def input_node(state: AgentState, stream_callback: Optional[Callable[[Dict], None]] = None) -> AgentState:
    return state

def parse_tool_output(text: str) -> Dict[str, str]:
    logger.debug(json.dumps({"event": "parse_tool_output_start", "text": text[:100]}))
    try:
        parts = [p.strip() for p in text.split("|")]
        fields = {}
        for part in parts:
            if ":" in part:
                key, val = part.split(":", 1)
                fields[key.strip().lower()] = val.strip()
        required = {"name", "description", "body"}
        if not required.issubset(fields):
            raise ValueError(f"Missing required fields: {required - set(fields)}")
        logger.debug(json.dumps({"event": "parse_tool_output_success", "fields": fields}))
        return fields
    except Exception as e:
        logger.error(json.dumps({"event": "parse_tool_output_error", "error": str(e)}))
        raise ValueError(f"Invalid tool format: {e}")

@log_node
async def load_and_use_tool(state: AgentState, stream_callback: Optional[Callable[[Dict], None]] = None) -> AgentState:
    try:
        tools = load_tool(registry_path="tools/tool_registry.yaml")
        tool_agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            handle_parsing_errors=True,
            verbose=VERBOSE
        )
        response = tool_agent.invoke(state.messages)
        # Extract the output field if available, else use the full response as a string
        response_text = response.get("output", str(response)) if isinstance(response, dict) else str(response)
        state.messages = state.messages + [AIMessage(content=response_text)]
        state.result = response_text
        logger.info(json.dumps({"event": "tool_execution", "response": response_text[:100]}))
        if stream_callback:
            await stream_callback({"event": "tool_execution", "response": response_text})
    except ValueError as e:
        state.messages = state.messages + [AIMessage(content=f"Tool error: {e}")]
        state.result = f"Error: {e}"
        logger.error(json.dumps({"event": "tool_execution_error", "error": str(e)}))
        if stream_callback:
            await stream_callback({"event": "tool_execution_error", "error": str(e)})
    except Exception as e:
        state.messages = state.messages + [AIMessage(content=f"Unexpected error: {e}")]
        state.result = f"Error: {e}"
        logger.error(json.dumps({"event": "unexpected_tool_error", "error": str(e)}))
        if stream_callback:
            await stream_callback({"event": "unexpected_tool_error", "error": str(e)})
    return state

@log_node
async def final_llm_response(state: AgentState, stream_callback: Optional[Callable[[Dict], None]] = None) -> AgentState:
    result = state.result or "No result available"
    logger.info(json.dumps({"event": "final_response", "result": result[:100]}))
    if stream_callback:
        await stream_callback({"event": "final_response", "result": result})
    return state

# Build and compile graph
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("input", input_node)
    graph.add_node("load_use_tool", load_and_use_tool)
    graph.add_node("final", final_llm_response)
    graph.set_entry_point("input")
    graph.add_edge("input", "load_use_tool")
    graph.add_edge("load_use_tool", "final")
    graph.add_edge("final", END)
    return graph.compile()

# Initialize global dependencies
llm, embedding = initialize_llm_and_embeddings()
graph = build_graph()

# Run agent with streaming support
async def run_agent(message: str, stream_callback: Optional[Callable[[Dict], None]] = None) -> Dict[str, Any]:
    execution_id = str(uuid.uuid4())
    logger.debug(json.dumps({"event": "run_agent_start", "execution_id": execution_id, "message": message[:100]}))
    inputs = AgentState(messages=[HumanMessage(content=message)])
    state = inputs
    async for event in graph.astream(inputs, stream_mode="values"):
        # Convert event to AgentState
        state = AgentState(**event) if isinstance(event, dict) else event
        if stream_callback:
            await stream_callback({"event": "state_update", "state": serialize_agent_state(state)})
    logger.debug(json.dumps({"event": "run_agent_end", "execution_id": execution_id, "response": str(state.messages)[:100]}))
    return {"response": serialize_agent_state(state)}

