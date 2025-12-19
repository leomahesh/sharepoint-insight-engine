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
        
        db = SessionLocal()
        try:
            for res in results:
                filename = res.metadata.get("filename", "Unknown")
                # Find the document in SQLite to get the proper ID
                db_doc = db.query(DBDocument).filter(DBDocument.filename == filename).first()
                doc_id = str(db_doc.id) if db_doc else "0"
                
                processed_results.append({
                    "id": doc_id,
                    "filename": filename,
                    "snippet": res.page_content[:300] + "...",
                    "metadata": res.metadata
                })
        finally:
            db.close()
            
        return processed_results

    def query_with_rag(self, query_text: str) -> str:
        """
        Manual RAG: Retrieve -> Generate
        """
        if self.use_mock:
            return "Mock AI Answer."
            
        # 1. Expand Query
        expanded_queries = self.expand_query(query_text)
        logger.info(f"Expanded Queries: {expanded_queries}")
        
        # 2. Retrieve Documents (Multi-query)
        all_docs = []
        seen_ids = set()
        
        # Search original + expanded
        queries_to_run = [query_text] + expanded_queries[:2] # Limit to top 2 expansions
        
        for q in queries_to_run:
            docs = self.vector_store.similarity_search(q, k=3)
            for d in docs:
                # Deduplicate based on page content hash or metadata
                doc_hash = hash(d.page_content) 
                if doc_hash not in seen_ids:
                    all_docs.append(d)
                    seen_ids.add(doc_hash)
        
        # Limit context window
        context = "\n\n".join([d.page_content for d in all_docs[:6]]) 
        
        from langchain_core.messages import HumanMessage
        prioritize_sources = "Answer STRICTLY based on the context below. If not found, say 'I cannot find this information in the internal documents.' Cite the source filename for every claim."
        
        prompt = f"""
        You are an internal Knowledge Assistant for Horizon University College.
        {prioritize_sources}
        
        Context:
        {context[:6000]}
        
        Question: {query_text}
        """
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content
        
    def expand_query(self, query: str) -> List[str]:
        """
        Generate variations of the query to improve retrieval.
        """
        if self.use_mock: return []
        
        from langchain_core.messages import HumanMessage
        prompt = f"""
        Generate 3 search queries to help retrieve information for the following user question. 
        Focus on technical terms, synonyms, and document types.
        Return ONLY the queries separated by newlines.
        
        User Question: {query}
        """
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            return [line.strip() for line in res.content.split('\n') if line.strip()]
        except Exception as e:
            logger.error(f"Query expansion failed: {e}")
            return []

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

    def get_weekly_stats(self) -> Dict:
        """
        Get upload counts for the last 7 days grouped by type.
        """
        if self.use_mock:
             return {"pdf": 2, "word": 1, "excel": 0, "ppt": 0, "other": 0}

        db = SessionLocal()
        try:
            from datetime import timedelta
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            
            # Query docs created >= 7 days ago
            recent_docs = db.query(DBDocument).filter(DBDocument.upload_date >= seven_days_ago).all()
            
            stats = {"pdf": 0, "word": 0, "excel": 0, "ppt": 0, "other": 0}
            
            for doc in recent_docs:
                ft = doc.file_type.lower() if doc.file_type else ""
                if ft == 'pdf':
                    stats['pdf'] += 1
                elif ft in ['docx', 'doc']:
                    stats['word'] += 1
                elif ft in ['xlsx', 'xls', 'csv']:
                    stats['excel'] += 1
                elif ft in ['pptx', 'ppt']:
                    stats['ppt'] += 1
                else:
                    stats['other'] += 1
            
            return stats
        except Exception as e:
            logger.error(f"Weekly Stats Error: {e}")
            return {"error": str(e)}
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

    def generate_podcast_script(self, content: str) -> str:
        """
        Generate a dialogue script between two hosts discussing the content.
        """
        if self.use_mock or not content:
            return "Podcast script unavailable in mock mode."

        from langchain_core.messages import HumanMessage
        prompt = f"""
        You are a scriptwriter for a tech podcast.
        Convert the following content into a engaging dialogue between two hosts, 'Alex' and 'Jamie'.
        They should discuss the key points in a lively, conversational tone.
        Keep it under 500 words.

        Content:
        {content[:4000]}
        """
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            return res.content
        except Exception as e:
            logger.error(f"Podcast generation failed: {e}")
            return "Podcast generation failed."

    def generate_mind_map(self, content: str) -> str:
        """
        Generate Mermaid.js syntax for a mind map.
        """
        if self.use_mock or not content:
             return "graph TD;\nA[Mock] --> B[Mind Map];"

        from langchain_core.messages import HumanMessage
        prompt = f"""
        Create a Mind Map using Mermaid.js syntax based on the following content.
        Return ONLY the Mermaid code block starting with `graph TD` or `mindmap`.
        Do not include markdown code block backticks (```mermaid). 
        Just the raw syntax.

        Content:
        {content[:4000]}
        """
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            # Clean up if model adds backticks
            clean_content = res.content.replace("```mermaid", "").replace("```", "").strip()
            return clean_content
        except Exception as e:
             logger.error(f"Mind Map generation failed: {e}")
             return "graph TD;\nError[Generation Failed];"

    def generate_quiz(self, content: str) -> List[Dict]:
        """
        Generate a list of quiz questions (JSON format).
        """
        if self.use_mock or not content:
            return [{"question": "Is this a mock quiz?", "options": ["Yes", "No"], "answer": "Yes"}]

        from langchain_core.messages import HumanMessage
        import json
        
        prompt = f"""
        Generate 3 multiple-choice quiz questions based on the content.
        Return the result as a STRICT JSON array.
        Each object should have:
        - "question": string
        - "options": list of 4 strings
        - "answer": string (the correct option)

        Content:
        {content[:4000]}
        """
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            # Basic cleanup to ensure we get just the JSON part if the model chats
            text = res.content
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)
            return []
        except Exception as e:
            logger.error(f"Quiz generation failed: {e}")
            return []
    def generate_deep_report(self, topic: str, source_ids: List[str] = []) -> str:
        """
        Generate a comprehensive markdown report on a topic using specific sources.
        """
        if self.use_mock:
            return "# Mock Deep Report\n\n- Executive Summary\n- Detailed Findings\n- Recommendations"

        search_filter = None
        
        # 1. Resolve Source IDs to Filenames if provided
        if source_ids:
            db = SessionLocal()
            try:
                # Filter documents by the provided IDs
                docs = db.query(DBDocument).filter(DBDocument.id.in_(source_ids)).all()
                filenames = [d.filename for d in docs]
                
                if filenames:
                    # ChromaDB filter format: {'key': {'$in': ['val1', 'val2']}}
                    # Check if single or multiple for simpler filtering query if needed, but $in is standard.
                    if len(filenames) == 1:
                        search_filter = {"filename": filenames[0]}
                    else:
                        search_filter = {"filename": {"$in": filenames}}
            except Exception as e:
                logger.error(f"Error resolving source IDs: {e}")
            finally:
                db.close()
        
        # 2. Search specifically for the topic with filter
        try:
            results = self.vector_store.similarity_search(topic, k=25, filter=search_filter)
        except Exception as e:
            logger.warning(f"Filtered search failed, falling back to unfiltered: {e}")
            results = self.vector_store.similarity_search(topic, k=20)

        context_text = "\n\n".join([d.page_content for d in results])

        if not context_text:
            return f"# No Data Found\n\nI could not find any relevant information on '{topic}' in the selected sources."

        from langchain_core.messages import HumanMessage
        prompt = f"""
        You are a Senior Strategic Analyst for Horizon University College.
        Create a "Deep Report" on the following topic based strictly on the provided context.
        
        Topic: {topic}
        
        Format the output in clean Markdown with the following sections:
        # [Report Title] (Make it professional)
        
        ## Executive Summary
        (A concise 3-bullet summary of the critical findings)
        
        ## Key Findings
        (Detailed analysis of the facts from the documents. Cite sources where possible like [Filename])
        
        ## Strategic Implications
        (What this means for the university's goals or compliance)
        
        ## Recommendations
        (Actionable next steps based on the data)
        
        Context Data:
        {context_text[:20000]} 
        """
        
        try:
            res = self.llm.invoke([HumanMessage(content=prompt)])
            return res.content
        except Exception as e:
            logger.error(f"Deep Report generation failed: {e}")
            return f"# Error Generating Report\n\nAn error occurred: {str(e)}"

# Singleton Instance
rag_engine = RAGEngine()
