@tool
def subtract(input: str) -> float:
    """
    Subtracts two numbers.

    The input should be a string containing two numbers separated by a comma (e.g., "5,3").
    Returns the result of subtracting the second number from the first.
    """
    a, b = map(float, input.split(","))
    return a - b