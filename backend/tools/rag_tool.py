from tools.base import BaseTool


class RagTool(BaseTool):

    name = "rag"

    async def run(self, question: str, **kwargs):

        return {
            "success": True,
            "data": f"RAG Answer for: {question}",
            "error": None,
        }


rag_tool = RagTool()