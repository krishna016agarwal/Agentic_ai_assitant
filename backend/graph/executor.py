import asyncio

import tools

from tools.registry import get_tool


async def execute_task(task, uploaded_file=None):

    tool = get_tool(task["tool"])

    result = await tool.run(
        question=task["question"],
        uploaded_file=uploaded_file,
    )

    return {
        "task_id": task["id"],
        "question": task["question"],
        "tool": task["tool"],
        **result,
    }


async def execute_tasks(tasks, uploaded_file=None):

    parallel_tasks = [t for t in tasks if t["parallel"]]
    sequential_tasks = [t for t in tasks if not t["parallel"]]

    results = []

    if parallel_tasks:

        parallel_results = await asyncio.gather(
            *[
                execute_task(task, uploaded_file)
                for task in parallel_tasks
            ]
        )

        results.extend(parallel_results)

    for task in sequential_tasks:

        result = await execute_task(task, uploaded_file)

        results.append(result)

    return results