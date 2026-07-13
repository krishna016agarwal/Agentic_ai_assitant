from fastapi import APIRouter
from pydantic import BaseModel

from graph.builder import graph
from langchain_core.messages import HumanMessage


router = APIRouter()

class ChatRequest(BaseModel):
    thread_id: str
    query: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    state = {
    "messages": [
        HumanMessage(content=request.query)
    ],
    "plan": [],
    "tool_results": [],
    "answer": ""
}

    result = await graph.ainvoke(
    state,
    config={
        "configurable": {
            "thread_id": request.thread_id
        }
    }
)

    return ChatResponse(
        answer=result["answer"]
    )