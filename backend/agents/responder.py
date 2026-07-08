import json

from langchain_core.messages import HumanMessage, SystemMessage

from models.llm import llm


SYSTEM_PROMPT = """
You are the AI assistant of ABC Bank.

You can help users with:
- Employee information
- Company policies
- Banking procedures
- RBI guidelines
- Company FAQs

You receive:
1. Conversation history
2. Tool results (may be empty)

Rules:

1. If tool_results are provided:
   - Use them to answer the user's question.
   - Never invent information.

2. If tool_results are empty:
   - If the user is greeting (Hi, Hello, Good Morning), greet them naturally.
   - If the user is thanking you, respond politely.
   - If the user is ending the conversation, say goodbye politely.
   - If the user asks something outside your domain (general knowledge, math, history, animals, celebrities, etc.), politely explain that you are the company's AI assistant and can only answer company-related questions.
   - If the user asks a company-related question but no information is available, politely say you couldn't find the required information.

Always answer naturally.
Never mention tools, RAG, or databases.
"""


async def generate_response(messages, tool_results):

    tool_context = json.dumps(tool_results, indent=2)

    llm_messages = [
        SystemMessage(content=SYSTEM_PROMPT)
    ]

    # Previous conversation
    llm_messages.extend(messages)

    # Tool outputs
    llm_messages.append(
        HumanMessage(
            content=f"""
Tool Results:

{tool_context}

Answer the latest user question using the conversation history and tool results.
"""
        )
    )

    response = llm.invoke(llm_messages)

    return response.content