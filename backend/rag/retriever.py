from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from config.settings import settings


embeddings = HuggingFaceEmbeddings(
    model_name=settings.EMBEDDING_MODEL
)

vector_store = Chroma(
    persist_directory=settings.CHROMA_PATH,
    embedding_function=embeddings
)


retriever = vector_store.as_retriever(
    search_kwargs={"k": 4}
)


async def rag_search(question: str):

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