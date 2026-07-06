from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from config.settings import settings


def ingest_documents():

    docs_path = Path(settings.COMPANY_DOCS)

    pdf_files = list(docs_path.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found.")
        return

    documents = []

    for pdf in pdf_files:

        print(f"Loading: {pdf.name}")

        loader = PyPDFLoader(str(pdf))

        documents.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    chunks = splitter.split_documents(documents)

    print(f"Total Chunks: {len(chunks)}")

    embeddings = HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL
    )

    vector_store = Chroma(
        persist_directory=settings.CHROMA_PATH,
        embedding_function=embeddings,
    )

    vector_store.add_documents(chunks)

    print("Vector Database Created Successfully!")


if __name__ == "__main__":
    ingest_documents()