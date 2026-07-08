from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class Task(BaseModel):
    id: int = Field(description="Unique task id")
    question: str = Field(description="Single atomic question")
    tool: Literal["rag", "database", "ocr"] = Field(
        description="Tool required to answer this task"
    )
    parallel: bool = Field(
        description="Can this task execute in parallel?"
    )
    depends_on: Optional[int] = Field(
        default=None,
        description="Task id this task depends on"
    )


class PlannerOutput(BaseModel):
    tasks: List[Task]