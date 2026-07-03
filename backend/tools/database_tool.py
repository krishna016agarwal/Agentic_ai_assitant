from tools.base import BaseTool


class DatabaseTool(BaseTool):

    name = "database"

    async def run(self, question: str, **kwargs):

        return {
            "success": True,
            "data": f"Database Answer for: {question}",
            "error": None,
        }


database_tool = DatabaseTool()