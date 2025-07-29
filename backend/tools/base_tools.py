from langchain_core.tools import tool
from ddgs import DDGS
from datetime import datetime
import os
import yaml

REGISTRY_PATH = "tools/tool_registry.yaml"
TOOLS_FILE = "tools/generated_tools.py"

@tool
def search_duckduckgo(query: str) -> str:
    """Search the web for current or general knowledge using DuckDuckGo."""
    with DDGS() as ddgs:
        results = ddgs.text(query)
        top_results = [r["body"] for r in results][:3]
        return "\n".join(top_results)


@tool
def tool_generator(input: str) -> str:
    """
    Creates a new LangChain tool and appends it to tools/generated_tools.py.

    Input format (must be one line, pipe-separated):
    name: TOOL_NAME | description: TOOL_DESCRIPTION | return_type: TYPE | body: PYTHON_LOGIC

    Example:
    name: square_root | description: Returns the square root of a number. Input: float (e.g., "9") | return_type: float | body: return float(input) ** 0.5

    Notes:
    - `TOOL_NAME`: lowercase, underscores only, no spaces
    - `TOOL_DESCRIPTION`: what it does + how to provide input
    - `return_type`: float, str, bool, or int
    - `PYTHON_LOGIC`: one-liner using the 'input' variable
    """



    try:
        # --- Parse input ---
        parts = [p.strip() for p in input.split("|")]
        params = {}
        for part in parts:
            if ":" in part:
                key, val = part.split(":", 1)
                params[key.strip().lower()] = val.strip()

        name = params["name"].replace(" ", "_").lower()
        description = params["description"]
        function_body = params["body"]

        if os.path.exists(REGISTRY_PATH):
            with open(REGISTRY_PATH) as f:
                registry = yaml.safe_load(f) or []
        else:
            registry = []

        if any(t["name"] == name for t in registry):
            return f"❌ Tool '{name}' already exists. Choose a different name."


        # --- Code generation ---
        tool_code = f'''
@tool
def {name}(input: str) -> float:
    """
    {description}
    """
    {function_body}
'''.lstrip()

        os.makedirs(os.path.dirname(TOOLS_FILE), exist_ok=True)

        # --- Save tool code ---
        with open(TOOLS_FILE, "a") as f:
            f.write(tool_code + "\n")

        # --- Log metadata ---
        tool_entry = {
            "name": name,
            "description": description,
            "saved_in": TOOLS_FILE,
            "created_at": datetime.now().isoformat(),
        }

        if os.path.exists(REGISTRY_PATH):
            with open(REGISTRY_PATH) as f:
                registry = yaml.safe_load(f) or []
        else:
            registry = []

        registry.append(tool_entry)

        with open(REGISTRY_PATH, "w") as f:
            yaml.dump(registry, f)

        return f"✅ Tool '{name}' created and metadata saved."

    except Exception as e:
        return f"❌ Failed: {e}"


@tool
def tool_lookup(input: str) -> str:
    """
    Searches for existing tools in the registry that match the given keyword or phrase.

    Example input:
    "square root"
    
    Returns a list of matching tools with their name and description.
    """
    keyword = input.strip().lower()

    if not os.path.exists(REGISTRY_PATH):
        return f"⚠️ Tool registry not found at {REGISTRY_PATH}"

    with open(REGISTRY_PATH) as f:
        registry = yaml.safe_load(f) or []

    matches = []
    for tool in registry:
        name = tool.get("name", "").lower()
        desc = tool.get("description", "").lower()

        if keyword in name or keyword in desc:
            matches.append(f"- {tool['name']}: {tool['description']}")

    if matches:
        return f"🔍 Matching tools:\n" + "\n".join(matches)
    else:
        return f"❌ No tools found matching: '{keyword}'"
