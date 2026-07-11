import asyncio

from graph.state import AgentState

from agents.planner import create_plan

from rag.retriever import rag_search

from database.db import database_tool

from agents.responder import generate_response


async def planner_node(state: AgentState):

    result = await create_plan(state["messages"])

    return {
    "action": result["action"],
    "plan": result["tasks"]
}


async def executor_node(state: AgentState):

    tasks = []

    task_info = []

    for task in state["plan"]:

        tool = task["tool"]

        question = task["question"]

        if tool == "database":

            tasks.append(
                database_tool(
    entity=task["entity"],
    operation=task["operation"],
    question=task["question"]
)
            )

            task_info.append(task)

        elif tool == "rag":

            tasks.append(
                rag_search(question)
            )

            task_info.append(task)
        elif state["action"] == "chat":

          return {
        "tool_results": []
    }    

    results = await asyncio.gather(*tasks)

    tool_results = []

    for task, result in zip(task_info, results):

        tool_results.append(
            {
                "tool": task["tool"],
                "question": task["question"],
                "result": result
            }
        )

    return {
        "tool_results": tool_results
    }


async def responder_node(state: AgentState):

    answer = await generate_response(
    messages=state["messages"],
    tool_results=state["tool_results"]
)

    return {
        "answer": answer
    }