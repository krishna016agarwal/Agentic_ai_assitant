from tools.registry import register

from tools.database_tool import database_tool
from tools.rag_tool import rag_tool
from tools.ocr_tool import ocr_tool


register(database_tool)
register(rag_tool)
register(ocr_tool)