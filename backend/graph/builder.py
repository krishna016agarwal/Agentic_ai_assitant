from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from graph.state import AgentState
from graph.nodes import (
    planner_node,
    executor_node,
    responder_node,
)

builder = StateGraph(AgentState)

builder.add_node("planner", planner_node)
builder.add_node("executor", executor_node)
builder.add_node("responder", responder_node)

builder.add_edge(START, "planner")
builder.add_edge("planner", "executor")
builder.add_edge("executor", "responder")
builder.add_edge("responder", END)

memory = MemorySaver()

graph = builder.compile(
    checkpointer=memory
)