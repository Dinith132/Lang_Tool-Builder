from datetime import datetime
from langchain_core.tools import tool


@tool
def divide_two_numbers(input: str) -> float:
    """
    Divides the first number by the second number. Input: a string containing two comma-separated floats (e.g., "10.0,2.0")
    """
    parts = input.split(','); return float(parts[0]) / float(parts[1])

@tool
def divide_numbers(input: str) -> float:
    """
    Divides two numbers. Input: two comma-separated floats (e.g., "339,77")
    """
    return float(input.split(',')[0]) / float(input.split(',')[1]) if float(input.split(',')[1]) != 0 else float('nan')

@tool
def custom_divide(input: str) -> float:
    """
    Divides the first number by the second number. Input: a string containing two comma-separated floats (e.g., "10.0,2.0")
    """
    return float(input.split(',')[0]) / float(input.split(',')[1])

