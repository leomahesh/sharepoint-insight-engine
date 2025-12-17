import json
import os
from typing import List, Dict, Optional
from datetime import datetime

DATA_STORE_PATH = "data_store.json"

class DataStore:
    def __init__(self):
        self.file_path = DATA_STORE_PATH
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path):
            self._save_data({"documents": []})

    def _load_data(self) -> Dict:
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except Exception:
            return {"documents": []}

    def _save_data(self, data: Dict):
        with open(self.file_path, "w") as f:
            json.dump(data, f, indent=2)

    def add_document(self, name: str, doc_type: str, source: str = "upload"):
        data = self._load_data()
        
        # Simple ID generation
        import uuid
        doc_id = str(uuid.uuid4())
        
        # Determine type if not provided nicely
        if not doc_type:
            ext = name.split('.')[-1].lower() if '.' in name else 'unknown'
            if ext in ['pdf']: doc_type = 'pdf'
            elif ext in ['doc', 'docx']: doc_type = 'word'
            elif ext in ['xls', 'xlsx']: doc_type = 'excel'
            elif ext in ['ppt', 'pptx']: doc_type = 'ppt'
            else: doc_type = 'other'

        new_doc = {
            "id": doc_id,
            "name": name,
            "type": doc_type,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"), # Formatting for display
            "source": source,
            "timestamp": datetime.now().timestamp() # For sorting
        }
        
        data["documents"].append(new_doc)
        self._save_data(data)
        return new_doc

    def get_all_documents(self) -> List[Dict]:
        data = self._load_data()
        # Sort by timestamp descending (newest first)
        docs = data.get("documents", [])
        return sorted(docs, key=lambda x: x.get("timestamp", 0), reverse=True)

    def get_stats(self) -> Dict:
        docs = self.get_all_documents()
        total = len(docs)
        counts = {"pdf": 0, "word": 0, "excel": 0, "ppt": 0, "other": 0}
        
        for doc in docs:
            dt = doc.get("type", "other")
            if dt in counts:
                counts[dt] += 1
            else:
                counts["other"] += 1
                
        return {
            "total_documents": total,
            "document_counts": counts,
            "recent_documents": docs[:5] # Top 5 recent
        }

    def search(self, query: str) -> List[Dict]:
        docs = self.get_all_documents()
        query = query.lower()
        return [d for d in docs if query in d["name"].lower()]

# Global instance
data_store = DataStore()
