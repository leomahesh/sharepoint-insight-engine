import os
from typing import List, Dict
from langchain_core.documents import Document
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Persist vector store in a local folder
PERSIST_DIRECTORY = "./chroma_db"

class RAGEngine:
    def __init__(self):
        self.use_mock = False
        
        # Check for Gemini Key first
        if settings.GEMINI_API_KEY:
             from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
             from langchain_community.vectorstores import Chroma
             from langchain.chains import RetrievalQA
             
             logger.info("Using Google Gemini AI.")
             self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY)
             self.vector_store = Chroma(
                persist_directory=PERSIST_DIRECTORY, 
                embedding_function=self.embeddings
             )
             self.llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=settings.GEMINI_API_KEY, convert_system_message_to_human=True)
             self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm, 
                chain_type="stuff", 
                retriever=self.vector_store.as_retriever()
             )
             return

        # Fallback to OpenAI if Gemini not present but OpenAI is
        if settings.OPENAI_API_KEY:
             from langchain_openai import OpenAIEmbeddings, ChatOpenAI
             from langchain_community.vectorstores import Chroma
             from langchain.chains import RetrievalQA
             
             logger.info("Using OpenAI.")
             self.embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
             self.vector_store = Chroma(
                persist_directory=PERSIST_DIRECTORY, 
                embedding_function=self.embeddings
             )
             self.llm = ChatOpenAI(temperature=0, openai_api_key=settings.OPENAI_API_KEY, model_name="gpt-3.5-turbo")
             self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm, 
                chain_type="stuff", 
                retriever=self.vector_store.as_retriever()
             )
             return

        # Mock Fallback
        logger.warning("No API Key found (GEMINI or OPENAI). Using MOCK RAG Engine.")
        self.use_mock = True

    def ingest_documents(self, documents: List[Dict]):
        if self.use_mock:
            return len(documents)

        # Import here to avoid import errors if dependencies are missing during mock mode
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        
        docs_to_ingest = []
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        for doc_data in documents:
            content = doc_data.get("content", "")
            if not content:
                continue
            
            metadata = doc_data.get("metadata", {})
            clean_metadata = {k: str(v) for k, v in metadata.items()}
            
            raw_doc = Document(page_content=content, metadata=clean_metadata)
            chunks = text_splitter.split_documents([raw_doc])
            docs_to_ingest.extend(chunks)

        if docs_to_ingest:
            self.vector_store.add_documents(docs_to_ingest)
            self.vector_store.persist()
            return len(docs_to_ingest)
        return 0

    def query(self, query_text: str) -> str:
        if self.use_mock:
            return f"This is a MOCK answer for '{query_text}'. Please provide an OPENAI_API_KEY to get real AI answers."
        return self.qa_chain.run(query_text)

    def search_similar(self, query_text: str, k: int = 3, use_web: bool = False):
        if self.use_mock:
            results = []
        else:
            results = self.vector_store.similarity_search(query_text, k=k)

        # If Public Web Search is requested (conceptually)
        if use_web:
            # In a real scenario, we would use:
            # from langchain_community.utilities import GoogleSearchAPIWrapper
            # search = GoogleSearchAPIWrapper()
            # web_results = search.run(query_text)
            
            # For this demo, we append a placeholder to show the architecture works
            mock_web_result = Document(
                page_content=f"**[WEB RESULT]**: Found external info about '{query_text}'. (Configure GoogleSearchAPIWrapper for live results).",
                metadata={"source": "Public Web", "title": "Web Search Result"}
            )
            results.append(mock_web_result)
            
        return results

    def summarize(self, content: str) -> str:
        """
        Generates a summary/report of the provided content using the LLM.
        """
        if self.use_mock:
            return "This is a MOCK AI summary. Please provide a GEMINI_API_KEY to get real summaries."
        
        from langchain_core.messages import HumanMessage
        
        prompt = f"""
        You are an intelligent assistant helping to review SharePoint documents.
        Please provide a comprehensive summary of the following document content. 
        Include key takeaways, action items, and any deadlines mentioned.
        
        Document Content:
        {content[:4000]}... (truncated if too long)
        """
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content

    def get_stats(self) -> Dict:
        """
        Returns statistics about the vector store.
        """
        if self.use_mock:
            return {
                "total_documents": 596,
                "document_counts": {"pdf": 145, "word": 320, "excel": 89, "ppt": 42}
            }
        
        # ChromaDB specific stats
        try:
            # This is a bit of a hack for Chroma, getting the count
            count = self.vector_store._collection.count()
            return {
                "total_documents": count,
                # In a real app we'd aggregate by type, but for now just returning total
                "document_counts": {"all": count} 
            }
        except Exception as e:
            logging.error(f"Error getting stats: {e}")
            return {"total_documents": 0, "document_counts": {}}
