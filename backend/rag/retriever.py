from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from config.settings import settings


_retriever = None


def get_retriever():
    global _retriever
    if _retriever is None:
        embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )
        vector_store = Chroma(
            persist_directory=settings.CHROMA_PATH,
            embedding_function=embeddings
        )
        _retriever = vector_store.as_retriever(
            search_kwargs={"k": 4}
        )
    return _retriever


async def rag_search(question: str):

    retriever = get_retriever()
    docs = retriever.invoke(question)

    results = []

    for doc in docs:

        results.append(
            {
                "content": doc.page_content,
                "source": doc.metadata.get("source", ""),
                "page": doc.metadata.get("page", 0)
            }
        )

    return {
        "success": True,
        "documents": results,
        "error": None
    }