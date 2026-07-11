from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):

    messages: List[BaseMessage]

    action: str

    plan: List[Dict]

    tool_results: List[Dict]

    answer: str