from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage, ToolMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from ddgs import DDGS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
from langchain_google_genai import GoogleGenerativeAI
from langchain.tools import DuckDuckGoSearchRun
from langchain.agents import Tool
from langchain_core.messages import AIMessage, ToolCall
import json
import re


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

os.environ["GOOGLE_API_KEY"] = "AIzaSyBcUsfH8V9z9ES0SVlYRAZAY_Lp2AdO800"

llm=GoogleGenerativeAI(
    model="gemini-2.5-flash", temperature=0.1
)

embedding=GoogleGenerativeAIEmbeddings(model="models/embedding-001")


from langchain_core.tools import tool
from sympy import symbols, Eq, solve

from langchain_core.tools import tool
from sympy import symbols, Eq, solve

@tool
def solve_quadratic_equation(input: str) -> str:
    """
    Solve a quadratic equation in the form ax^2 + bx + c = 0.
    Input: 'a,b,c' — coefficients as comma-separated values.
    Example: '1,-3,2' means x^2 - 3x + 2 = 0
    """
    try:
        a_str, b_str, c_str = input.split(",")
        a = float(a_str.strip())
        b = float(b_str.strip())
        c = float(c_str.strip())

        x = symbols('x')
        equation = Eq(a*x**2 + b*x + c, 0)
        roots = solve(equation, x)

        return f"Roots: {', '.join(str(root) for root in roots)}"
    except Exception as e:
        return f"Error: {str(e)}"
    
from sympy import symbols, diff, sympify

@tool
def differentiate_expression(input: str) -> str:
    """
    Differentiate a mathematical expression with respect to a variable.
    Input: 'expression,variable' — e.g., 'x**2 + 3*x, x'
    """
    try:
        expr_str, var_str = input.split(",")
        var = symbols(var_str.strip())
        expr = sympify(expr_str.strip())
        derivative = diff(expr, var)
        return f"Derivative: {derivative}"
    except Exception as e:
        return f"Error: {str(e)}"


from sympy import symbols, integrate, sympify

@tool
def integrate_expression(input: str) -> str:
    """
    Integrate a mathematical expression with respect to a variable.
    Input: 'expression,variable' — e.g., 'x**2 + 3*x, x'
    """
    try:
        expr_str, var_str = input.split(",")
        var = symbols(var_str.strip())
        expr = sympify(expr_str.strip())
        result = integrate(expr, var)
        return f"Integral: {result} + C"
    except Exception as e:
        return f"Error: {str(e)}"



@tool
def addition(input: str) -> float:
    """Add two numbers. Input: 'a,b' (e.g., '4.0,5')"""
    a_str, b_str = input.split(",")
    return float(a_str.strip()) + float(b_str.strip())

@tool
def subtraction(input: str) -> float:
    """Subtract second number from first. Input: 'a,b'"""
    a_str, b_str = input.split(",")
    return float(a_str.strip()) - float(b_str.strip())

@tool
def multiplication(input: str) -> float:
    """Multiply two numbers. Input: 'a,b'"""
    a_str, b_str = input.split(",")
    return float(a_str.strip()) * float(b_str.strip())

@tool
def division(input: str) -> float:
    """Divide first number by second. Input: 'a,b'"""
    a_str, b_str = input.split(",")
    b = float(b_str.strip())
    return float(a_str.strip()) / b if b != 0 else float("inf")

@tool
def search_duckduckgo(query: str) -> str:
    """Search the web for current or general knowledge using DuckDuckGo."""
    with DDGS() as ddgs:
        results = ddgs.text(query)
        top_results = [r["body"] for r in results][:3]
        return "\n".join(top_results)
    

tools = [
    addition,
    subtraction,
    multiplication,
    division,
    search_duckduckgo,
    solve_quadratic_equation,
    integrate_expression,
    differentiate_expression

]


from langchain.agents import initialize_agent, AgentType



def generate_tool_prompt(tools):
    tool_descriptions = []
    for t in tools:
        doc = t.__doc__ or ""
        tool_descriptions.append(
            f"{t.name}(input: str) -> {t.__annotations__.get('return', 'Any')}\n  {doc.strip()}"
        )
    tool_list = "\n\n".join(tool_descriptions)
    return (
        f"{tool_list}\n\n"
    )



def get_tool_call(message):
    json_block = re.search(r"```json\s*(.*?)\s*```", message, re.DOTALL)
    
    if not json_block:
        return []

    json_str = json_block.group(1)
    tool_data = json.loads(json_str)

    tool_calls = [
        ToolCall(
            name=tool["name"],
            args=tool["args"],
            id=tool["id"]
        )
        for tool in tool_data
    ]
    return tool_calls



import pprint
def llm_call(state: AgentState) -> AgentState:
    # print('===================================LLM_CALL===================================')
    tools_string = generate_tool_prompt(tools)
    system_prompt = SystemMessage(content=f"You are an intelligent AI assistant. and i have some tools like {tools_string}. if you can use tool you can simply say want to use a tool or tools. and remember if tool available for solve the problem you definetly sould tell me to want to use em, if you want to use a use too you have to give me this details in json format with triple ``` makes, (name,args,id) ex- [name='addition',args={{'input': '4,5'}},id='tool_add_1'], and also have a last msg when you calling tools you have to it one by one. after recive a response from one request for next and have to mention why choose that tool before give json")
    response = llm.invoke([system_prompt] + state["messages"])    
    # print("==================================LLM response================================")
    # pprint.pprint(response)
    tool_calls=get_tool_call(response)
    # print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    # print(tool_calls)
    # print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    if len(tool_calls)>0:
        # print("=================================tool calls found======================================")
        return {
            "messages": [
                AIMessage(
                    content=response,
                    tool_calls=[
                        ToolCall(
                                    name=tool["name"],
                                    args=tool["args"],
                                    id=tool["id"]
                                )
                                for tool in tool_calls
                    ]
                )
            ]
        }
    
    # print("=================================tool calls not found======================================")
    return {
            "messages": [
                AIMessage(
                    content=response
                )
            ]
        }

def decision(state: AgentState):
    # print("=================================Decision======================================")
    system_prompt = SystemMessage(content="you have to identify where the given responce is asking to use tool or it given a answer, if it ask for use to ")
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:

        return "end"
    else:
        # print("============================tool call======================================")
        return "continue"
    
graph = StateGraph(AgentState)

graph.add_node("agent", llm_call)
tool_node = ToolNode(tools=tools)
graph.add_node("tools", tool_node)

graph.set_entry_point("agent")
graph.add_conditional_edges(
    "agent",
    decision,
    {
        "continue": "tools",
        "end": END,
    },
)
graph.add_edge("tools", "agent")
graph.add_edge("tools", END)


app = graph.compile()

def print_stream(stream):
    for s in stream:
        # print("-------------------------------------------------------------------")
        # print(s)
        # print("-------------------------------------------------------------------")
        message = s["messages"][-1]
        if isinstance(message, tuple):
            # print("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            # print(message)
            # print("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            continue
        else:
            # print("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            message.pretty_print()
            # print("*****************************************************************")






# from langchain_core.messages import HumanMessage

# inputs = {
#     # "messages": [HumanMessage(content="what is the value of 23424+2322, then find 1231-3232, then find 2323*32 then find 32323/32"
#     "messages": [HumanMessage(content="what is 5325232+32423? then find who is the president of Sri Lanka? then find 1231-3232, then find 2323*32 then find 32323/32"

# )]
# }

# print_stream(app.stream(inputs, stream_mode="values"))
