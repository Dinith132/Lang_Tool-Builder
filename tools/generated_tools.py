@tool
def multiply_numbers(input: str) -> float:
    """
    Returns the product of two numbers. Input should be a comma-separated string of two numbers (e.g., '5,10').
    """
    nums = input.split(','); num1 = float(nums[0]); num2 = float(nums[1]); return num1 * num2

@tool
def multiply_numbers(input: str) -> float:
    """
    Returns the product of two numbers. Input should be a comma-separated string of two numbers (e.g., "5,10").
    """
    nums = input.split(','); return float(nums[0]) * float(nums[1])

@tool
def divide_numbers(input: str) -> float:
    """
    Divides two numbers. Input should be a comma-separated string of two numbers (e.g., "10,2"). Returns "Error: Division by zero" if the denominator is zero.
    """
    parts = input.split(','); num = float(parts[0]); den = float(parts[1]); return num / den if den != 0 else "Error: Division by zero"

@tool
def celsius_to_fahrenheit(input: str) -> float:
    """
    Converts a temperature from Celsius to Fahrenheit.
    """
    return (float(input) * 9/5) + 32

@tool
def calculate_bmi(input: str) -> float:
    """
    Calculates Body Mass Index (BMI) given weight in kilograms and height in meters as comma-separated input (e.g., '70,1.75').
    """
    weight_str, height_str = input.split(','); weight = float(weight_str); height = float(height_str); bmi = weight / (height ** 2); return bmi

@tool
def calculate_compound_interest(input: str) -> float:
    """
    Calculates the total amount after compound interest given principal, annual rate (as a decimal), time in years, and number of times compounded per year. Input should be comma-separated: principal,rate,time,compounding_frequency.
    """
    parts = input.split(','); P = float(parts[0]); r = float(parts[1]); t = float(parts[2]); n = int(parts[3]); A = P * (1 + r / n)**(n * t); return A

