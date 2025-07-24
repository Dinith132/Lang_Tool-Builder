# tool_registry.py
from typing import Callable, Dict, List
from langchain_core.tools import StructuredTool

class ToolRegistry:
    _tools: Dict[str, Callable] = {}

    @classmethod
    def register(cls, func: Callable) -> Callable:
        """Register a function or StructuredTool as a tool."""
        # Handle StructuredTool (from @tool decorator) or raw function
        if isinstance(func, StructuredTool):
            tool_name = func.name  # Use StructuredTool.name
        else:
            tool_name = func.__name__  # Use function name for raw functions
        cls._tools[tool_name] = func
        return func

    @classmethod
    def get_tools(cls) -> List[Callable]:
        """Return all registered tools."""
        return list(cls._tools.values())

    @classmethod
    def get_tool(cls, name: str) -> Callable:
        """Get a tool by name."""
        return cls._tools.get(name)