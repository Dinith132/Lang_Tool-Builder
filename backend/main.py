from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage
from test_resoning import app as langgraph_app  # Your compiled LangGraph agent
import traceback
from asyncio import sleep
from fastapi import WebSocket
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage


# Initialize FastAPI app
app = FastAPI(title="LangGraph Tool Agent API")

# Request model for REST
class QueryRequest(BaseModel):
    query: str

# POST endpoint (non-streaming)
@app.post("/api/query")
async def query_agent(request: QueryRequest):
    try:
        inputs = {"messages": [HumanMessage(content=request.query)]}
        result = list(langgraph_app.stream(inputs, stream_mode="values"))
        messages = [s["messages"][-1].content for s in result if hasattr(s["messages"][-1], "content")]
        return JSONResponse(content={"status": "success", "data": messages})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

# WebSocket endpoint (streaming)

@app.websocket("/ws/query")
async def websocket_query(websocket: WebSocket):
    await websocket.accept()
    try:
        query = await websocket.receive_text()
        inputs = {"messages": [HumanMessage(content=query)]}

        # Iterate over the async generator
        async for step in langgraph_app.astream(inputs, stream_mode="values"):
            if "messages" in step and step["messages"]:
                message = step["messages"][-1]
                
                # For AI responses
                if isinstance(message, AIMessage):
                    await websocket.send_json({
                        "type": "ai",
                        "content": message.content
                    })
                
                # For tool results
                elif isinstance(message, ToolMessage):
                    await websocket.send_json({
                        "type": "tool_result",
                        "content": message.content
                    })

                # For anything else (e.g., SystemMessage, etc.)
                else:
                    await websocket.send_json({
                        "type": "other",
                        "content": getattr(message, "content", str(message))
                    })

        await websocket.send_json({"type": "end"})
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "detail": str(e),
            "trace": traceback.format_exc()
        })
    finally:
        await websocket.close()
