# main.py
import os
import sys
import yaml
import importlib
import time
import shutil
from tool_registry import ToolRegistry
from langchain_core.tools import StructuredTool

# Add project root to sys.path
project_root = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, project_root)

def write_tool_file():
    """Write tools/math_tools.py programmatically."""
    code = """
from tool_registry import ToolRegistry
from langchain_core.tools import tool

@ToolRegistry.register
@tool
def subtract(input: str) -> float:
    \"""Subtract two numbers from string 'a,b'.\"""
    a, b = map(float, input.split(","))
    return a - b

@ToolRegistry.register
@tool
def addition(input: str) -> float:
    \"""Add two numbers from string 'a,b'.\"""
    a, b = map(float, input.split(","))
    return a + b
"""

#     code= """
# \nfrom langchain_core.tools import tool\n\n@tool\ndef get(input: str) -> float:\n    """\n    Calculates the get summation of 2 numbers.\n\n    The input is a string containing two numbers separated by a comma, e.g., \'4.0,5\'.\n    The function parses these numbers, performs the operation, and returns the result as a float.\n\n    Args:\n        input (str): A string containing two numbers separated by a comma.\n\n    Returns:\n        float: The result of the operation.\n    """\n    try:\n        num1_str, num2_str = input.split(\',\')\n        num1 = float(num1_str.strip())\n        num2 = float(num2_str.strip())\n        return num1 + num2  # Modify this based on the operation in description\n    except ValueError:\n        raise ValueError("Invalid input format. Please provide two numbers separated by a comma, e.g., \'4.0,5\'")\n
# """
    os.makedirs("tools", exist_ok=True)
    tool_file = os.path.join(project_root, "tools/math_tools.py")
    with open(tool_file, "w") as f:
        f.write(code)
        f.flush()
        os.fsync(f.fileno())
    time.sleep(0.1)  # Ensure file system settles
    if not os.path.exists(tool_file):
        raise FileNotFoundError("Failed to create tools/math_tools.py")

def write_config_file(config_path: str):
    """Write or update tools.yaml with tool configurations."""
    config = {
        "tools": [
            {
                "name": "subtract",
                "module": "tools.math_tools",
                "description": "Subtract two numbers from string 'a,b'"
            },
            {
                "name": "addition",
                "module": "tools.math_tools",
                "description": "Add two numbers from string 'a,b'"
            }
        ]
    }
    with open(config_path, "w") as f:
        yaml.safe_dump(config, f, default_flow_style=False)
        f.flush()
        os.fsync(f.fileno())
    time.sleep(0.1)  # Ensure file system settles
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Failed to create {config_path}")

def clear_pycache():
    """Clear stale .pyc files."""
    pycache_dir = os.path.join(project_root, "tools/__pycache__")
    if os.path.exists(pycache_dir):
        shutil.rmtree(pycache_dir)

def load_tools_from_yaml(config_path: str) -> list:
    """Load tools from YAML config using ToolRegistry."""
    clear_pycache()  # Clear stale .pyc files
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file {config_path} not found")
    time.sleep(0.1)  # File system delay

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    if not config or 'tools' not in config:
        raise ValueError("Invalid YAML config: 'tools' key missing")

    tools = []
    for tool_config in config['tools']:
        module_name = tool_config.get('module')
        try:
            if module_name in sys.modules:
                importlib.reload(sys.modules[module_name])
            importlib.import_module(module_name)
        except ImportError as e:
            print(f"Error importing module {module_name}: {e}")
            continue

        tool_name = tool_config.get('name')
        func = ToolRegistry.get_tool(tool_name)
        if func is None:
            print(f"Tool '{tool_name}' not found in registry")
            continue
        tools.append(func)

    return tools

def tool_testing(tools):
    for tool_func in tools:
        try:
            result = tool_func.invoke({"input":"1,2"})
            print(f"{tool_func.name}('5,3') => {result}")
        except Exception as e:
            print(f"Error calling {tool_func.name}: {e}")

# Example usage
if __name__ == "__main__":
    config_path = os.path.join(project_root, "tools.yaml")
    write_tool_file()  # Generate tools/math_tools.py
    write_config_file(config_path)  # Generate tools.yaml
    tools = load_tools_from_yaml(config_path)
    print(f"Loaded tools: {[t.name if hasattr(t, 'name') else t.__name__ for t in tools]}")

    print("==========testing==============")
    tool_testing(tools=tools)
