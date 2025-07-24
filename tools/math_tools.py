
from tool_registry import ToolRegistry
from langchain_core.tools import tool

@ToolRegistry.register
@tool
def subtract(input: str) -> float:
    """Subtract two numbers from string 'a,b'."""
    a, b = map(float, input.split(","))
    return a - b

@ToolRegistry.register
@tool
def addition(input: str) -> float:
    """Add two numbers from string 'a,b'."""
    a, b = map(float, input.split(","))
    return a + b
