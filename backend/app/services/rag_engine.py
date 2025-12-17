import os
import logging
import uuid
from typing import List, Dict, Optional
from datetime import datetime

# LangChain / AI
from langchain_core.documents import Document as LCDocument
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain.chains import RetrievalQA # caused error

# Database
from app.core.config import settings
from app.db.database import SessionLocal, engine, Base
from app.db.models import Document as DBDocument
from app.services.ingestion_utils import extract_text_from_file

logger = logging.getLogger(__name__)

# Persist vector store in a local folder
PERSIST_DIRECTORY = "./chroma_db"

class RAGEngine:
    def __init__(self):
        self.use_mock = False
        
        # 1. Initialize Database
        # ensure tables exist
        Base.metadata.create_all(bind=engine)
        
        # 2. Check for Gemini Key
        if not settings.GEMINI_API_KEY:
             logger.warning("No GEMINI_API_KEY found. Falling back to MOCK mode (limited functionality).")
             self.use_mock = True
             return

        logger.info("Initializing Gemini AI & ChromaDB...")
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY)
            self.vector_store = Chroma(
                persist_directory=PERSIST_DIRECTORY, 
                embedding_function=self.embeddings
            )
            self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=settings.GEMINI_API_KEY, convert_system_message_to_human=True)
            # Manual RAG, no chain needed
        except Exception as e:
            logger.error(f"Failed to init AI components: {e}")
            self.use_mock = True

    def ingest_file(self, file_path: str, original_filename: str, source: str = "upload", category: str = "General") -> DBDocument:
        """
        Full ingestion pipeline:
        1. Extract Text
        2. Create DB Record
        3. Create Vector Embeddings
        4. Save to DB & Chroma
        """
        if self.use_mock:
            logger.warning("Mock ingestion - not saving to real DB.")
            return None

        # 1. Extract Text
        file_ext = original_filename.split('.')[-1].lower() if '.' in original_filename else "txt"
        text_content = extract_text_from_file(file_path, file_ext)
        
        if not text_content:
            logger.warning(f"No text extracted from {original_filename}")
            return None

        # 2. Prepare Vector Document
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        chunks = text_splitter.split_text(text_content)
        
        # Generate a unique Vector ID (to link DB to Chroma if needed)
        vector_ids = [str(uuid.uuid4()) for _ in chunks]
        
        metadatas = []
        for _ in chunks:
            metadatas.append({
                "source": source,
                "filename": original_filename,
                "category": category,
                "created_at": str(datetime.utcnow())
            })
            
        # 3. Add to Chroma
        self.vector_store.add_texts(chunks, metadatas=metadatas, ids=vector_ids)
        self.vector_store.persist()
        
        # 4. Save to SQLite
        db = SessionLocal()
        try:
            db_doc = DBDocument(
                filename=original_filename,
                file_path=file_path,
                file_type=file_ext,
                source=source,
                category=category,
                vector_id=vector_ids[0] if vector_ids else None, # Link to first chunk
                summary="Pending AI Summary..." 
            )
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            
            # 5. Trigger Async Summary (Sync for now)
            try:
                summary = self.summarize(text_content)
                db_doc.summary = summary
                db.commit()
            except Exception as e:
                logger.error(f"Summary generation failed: {e}")

            return db_doc
        except Exception as e:
            logger.error(f"DB Error: {e}")
            db.rollback()
            return None
        finally:
            db.close()

    def search(self, query: str, k: int = 4) -> List[Dict]:
        """
        Semantic search + DB lookup
        """
        if self.use_mock:
            return [{"name": "Mock Result.pdf", "snippet": "Mock content for check."}]
            
        results = self.vector_store.similarity_search(query, k=k)
        processed_results = []
        
        for res in results:
            processed_results.append({
                "filename": res.metadata.get("filename", "Unknown"),
                "snippet": res.page_content[:300] + "...",
                "metadata": res.metadata
            })
            
        return processed_results

    def query_with_rag(self, query_text: str) -> str:
        """
        Manual RAG: Retrieve -> Generate
        """
        if self.use_mock:
            return "Mock AI Answer."
            
        docs = self.vector_store.similarity_search(query_text, k=4)
        context = "\n\n".join([d.page_content for d in docs])
        
        from langchain_core.messages import HumanMessage
        prompt = f"""
        Answer the user question using the following context:
        
        Context:
        {context[:5000]}
        
        Question: {query_text}
        """
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content

    def get_dashboard_stats(self) -> Dict:
        """
        Get real stats from SQLite
        """
        if self.use_mock:
             return {"total_documents": 0, "document_counts": {}}

        db = SessionLocal()
        try:
            total = db.query(DBDocument).count()
            
            # Simple aggregation
            pdf_count = db.query(DBDocument).filter(DBDocument.file_type == 'pdf').count()
            word_count = db.query(DBDocument).filter(DBDocument.file_type.in_(['docx', 'doc'])).count()
            excel_count = db.query(DBDocument).filter(DBDocument.file_type.in_(['xlsx', 'xls', 'csv'])).count()
            ppt_count = db.query(DBDocument).filter(DBDocument.file_type.in_(['pptx', 'ppt'])).count()
            
            # Recent docs
            recent = db.query(DBDocument).order_by(DBDocument.upload_date.desc()).limit(5).all()
            recent_formatted = [
                {
                    "id": str(d.id),
                    "name": d.filename,
                    "type": d.file_type,
                    "date": d.upload_date.strftime("%Y-%m-%d")
                }
                for d in recent
            ]
            
            return {
                "total_documents": total,
                "document_counts": {
                    "pdf": pdf_count,
                    "word": word_count,
                    "excel": excel_count,
                    "ppt": ppt_count
                },
                "recent_documents": recent_formatted
            }
        except Exception as e:
            logger.error(f"Stats Error: {e}")
            return {"total_documents": 0, "error": str(e)}
        finally:
            db.close()

    def summarize(self, content: str) -> str:
        if self.use_mock or not content:
            return "Summary unavailable."
            
        from langchain_core.messages import HumanMessage
        prompt = f"Summarize this document in 3 sentences: {content[:3000]}"
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            return res.content
        except Exception as e:
            return "Summary generation failed."

# Singleton Instance
rag_engine = RAGEngine()
