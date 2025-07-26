from datetime import datetime
from langchain_core.tools import tool
@tool
def multiply_numbers(input: str) -> float:
    """
    Multiplies two numbers and returns the product. Input: two comma-separated floats (e.g., "339, 77")
    """
    parts = input.split(','); return float(parts[0]) * float(parts[1])

@tool
def calculator(input: str) -> float:
    """
    Performs a mathematical calculation (multiplication) based on the given expression. Input: string in the format 'number * number' (e.g., '36 * 993')
    """
    return float(input.split(' * ')[0]) * float(input.split(' * ')[1])

@tool
def multiply(input: str) -> float:
    """
    Multiplies two integers. Input: two comma-separated integers (e.g., "36, 993")
    """
    return int(input.split(',')[0].strip()) * int(input.split(',')[1].strip())

