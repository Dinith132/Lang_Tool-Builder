# 🧠 Tool-Enhanced AI Agent using LangGraph + LLMs

This project demonstrates an intelligent AI agent built with **LangGraph** that extends the capabilities of large language models by integrating **external tools** such as symbolic math solvers, web search utilities, and expression evaluators. The agent can **reason**, **decide when to use a tool**, and **handle multi-step tool calls** to solve complex problems accurately and autonomously.

---

## 🚀 Features

- 🧩 **Tool-Augmented Reasoning**: Combines LLM reasoning with tool execution for accurate results.
- 📐 **Symbolic Math Capabilities**: Solves equations, integrates expressions, simplifies rational expressions, and more.
- 🔎 **Web Search Integration**: Uses DuckDuckGo search to retrieve real-time information.
- 🤖 **Multi-step Agent Workflows**: Dynamically decides when and how to invoke tools.
- 🪄 **Modular Tool Design**: Easily extendable with your own custom tools.

---

## 🧠 How It Works

The agent is structured as a **LangGraph**, where:

- The `llm_call` node evaluates user prompts and decides whether tools are needed.
- A `ToolNode` executes selected tools.
- The graph uses conditional routing (`continue` vs `end`) based on whether tool calls are returned.
- Messages are streamed, showing step-by-step reasoning and results.

---

## 🛠️ Tools Included

> Tools are defined as LangChain-compatible functions with minimal inputs and clear outputs.

- `addition`, `subtraction`, `multiplication`, `division`, etc
- `solve_quadratic_equation`
- `multiply_polynomials`
- `divide_rational_expressions`
- `integrate_expression`
- `search_duckduckgo`

You can easily add or remove tools depending on your needs.

---

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/Dinith132/Lang_Tool-Builder.git
cd Lang_Tool-Builder
