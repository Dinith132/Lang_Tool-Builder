from langchain_core.tools import tool
@tool
def compound_interest_calculator(input: str) -> float:
    """
    Calculates the future value of an investment with compound interest given principal, annual interest rate (as a decimal), number of years, and number of times compounded per year as comma-separated input.
    """
    parts = input.split(','); P = float(parts[0].strip()); r = float(parts[1].strip()); t = float(parts[2].strip()); n = float(parts[3].strip()); A = P * (1 + r / n)**(n * t); return A

@tool
def calculate_bmi(input: str) -> float:
    """
    Calculates Body Mass Index (BMI) given weight in kilograms and height in meters as comma-separated input (e.g., "70,1.75").
    """
    weight_str, height_str = input.split(','); weight = float(weight_str); height = float(height_str); return weight / (height ** 2)

