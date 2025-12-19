import { useState } from 'react';
import SourceSelector from './SourceSelector';
import ChatInterface from './ChatInterface';
import ReactMarkdown from 'react-markdown';

export default function NotebookView() {
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    const [mode, setMode] = useState<'chat' | 'report'>('chat');

    return (
        <div className="flex h-[calc(100vh-6rem)] border-t border-slate-800">
            {/* Left: Source Selector */}
            <SourceSelector onSelectionChange={setSelectedSourceIds} />

            {/* Right: Work Surface */}
            <div className="flex-1 flex flex-col bg-slate-950">
                {/* Notebook Toolbar */}
                <div className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/30">
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setMode('chat')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Chat & Explore
                        </button>
                        <button
                            onClick={() => setMode('report')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Deep Report
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                            {selectedSourceIds.length > 0 ? `${selectedSourceIds.length} Sources Active` : 'All Sources'}
                        </span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {mode === 'chat' && (
                        <div className="h-full">
                            {/* Reuse ChatInterface but maybe pass context filter later */}
                            <ChatInterface />
                        </div>
                    )}

                    {mode === 'report' && (
                        <DeepReportGenerator selectedSourceIds={selectedSourceIds} />
                    )}
                </div>
            </div>
        </div>
    );
}

function DeepReportGenerator({ selectedSourceIds }: { selectedSourceIds: string[] }) {
    const [topic, setTopic] = useState('');
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setReport(null);
        try {
            const response = await fetch('http://localhost:8000/api/v1/notebook/deep_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, source_ids: selectedSourceIds }),
            });
            const data = await response.json();
            setReport(data.report_markdown);
        } catch (error) {
            console.error(error);
            setReport('# Error\nFailed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto bg-white/5">
            {!report ? (
                <div className="max-w-2xl mx-auto w-full mt-20">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Generate Deep Report</h2>
                    <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-slate-900/50">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Report Topic or Query</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Strategic Impact of AI on Future Curriculum..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />

                        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                            <span>Analysis Scope:</span>
                            <span className="text-blue-400 font-medium">
                                {selectedSourceIds.length > 0 ? `${selectedSourceIds.length} Specific Sources` : 'Entire Knowledge Archive'}
                            </span>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Analyzing & Synthesizing...
                                </>
                            ) : (
                                <>
                                    <span>✨ Generate Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto w-full pb-20">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setReport(null)} className="text-slate-400 hover:text-white flex items-center gap-2">
                            ← Back to Generator
                        </button>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            ⬇ Export PDF
                        </button>
                    </div>
                    <div className="prose prose-invert prose-lg max-w-none bg-slate-900/50 p-12 rounded-3xl border border-white/10 shadow-2xl">
                        <MarkdownRenderer content={report} />
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Markdown Renderer Wrapper
function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-6 border-b border-white/10 pb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-blue-100 mt-8 mb-4" {...props} />,
                p: ({ node, ...props }) => <p className="text-slate-300 leading-relaxed mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 text-slate-300" {...props} />,
                li: ({ node, ...props }) => <li className="mb-2" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
