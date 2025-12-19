import { useState, useEffect } from 'react';

interface Document {
    id: string;
    name: string;
    type: string;
    date: string;
    category?: string;
}

interface SourceSelectorProps {
    onSelectionChange: (selectedIds: string[]) => void;
}

export default function SourceSelector({ onSelectionChange }: SourceSelectorProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('');

    useEffect(() => {
        // Ideally use a dedicated full-list endpoint, reusing stats for now or adding pagination later
        fetch('http://localhost:8000/api/v1/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                if (data.recent_documents) {
                    // Mocking full list for now if partial
                    setDocuments(data.recent_documents);
                }
            })
            .catch(err => console.error("Docs fetch error", err));
    }, []);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
        onSelectionChange(Array.from(next));
    };

    const filteredDocs = documents.filter(d =>
        d.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="bg-slate-900 border-r border-slate-800 w-80 h-full flex flex-col">
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-slate-200 font-bold mb-2 flex items-center gap-2">
                    <span>📚</span> Sources
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{selectedIds.size} pinned</span>
                </h2>
                <input
                    type="text"
                    placeholder="Filter sources..."
                    className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredDocs.map(doc => (
                    <div
                        key={doc.id}
                        onClick={() => toggleSelection(doc.id)}
                        className={`
              p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between group
              ${selectedIds.has(doc.id)
                                ? 'bg-blue-900/20 border-blue-500/30'
                                : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700'}
            `}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-lg opacity-80 flex-shrink-0">
                                {doc.type === 'pdf' ? '📕' : doc.type.includes('xls') ? '📗' : doc.type.includes('doc') ? '📘' : '📄'}
                            </span>
                            <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${selectedIds.has(doc.id) ? 'text-blue-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {doc.name}
                                </p>
                                <p className="text-xs text-slate-600 truncate">{doc.date}</p>
                            </div>
                        </div>
                        {selectedIds.has(doc.id) && <span className="text-blue-400 text-xs">●</span>}
                    </div>
                ))}
                {filteredDocs.length === 0 && (
                    <div className="text-center p-8 text-slate-600 text-sm">
                        No sources found.
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                    + Add Source
                </button>
            </div>
        </div>
    );
}
