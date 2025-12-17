'use client';

// In Next.js App Router, params are passed to the page component
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DocumentPage({ params }: { params: { id: string } }) {
    const [doc, setDoc] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetch(`http://localhost:8000/api/v1/documents/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setDoc(data);
                setComments(data.comments || []);
            })
            .catch(err => console.error("Failed to fetch doc", err));
    }, [params.id]);

    const handleAddComment = () => {
        if (!comment.trim()) return;
        setComments([...comments, { user: "Me", text: comment, date: "Just now" }]);
        setComment('');
    };

    if (!doc) return <div className="p-10 text-center">Loading document info...</div>;

    return (
        <div className="p-8 min-h-screen bg-gray-50 flex flex-col h-screen">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <Link href="/" className="text-blue-600 hover:underline mb-1 inline-block text-sm">← Back to Dashboard</Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-3xl">📕</span> {doc.name}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Download</button>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Share</button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Main Content / Preview */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8 overflow-y-auto">

                    {/* AI Report Section */}
                    <div className="mb-8 bg-purple-50 p-6 rounded-xl border border-purple-100">
                        <h2 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                            ✨ AI Analysis (Gemini)
                        </h2>
                        <div className="prose prose-purple max-w-none text-gray-800 text-sm">
                            <p className="whitespace-pre-line">{doc.ai_report || "Generating report..."}</p>
                        </div>
                    </div>

                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Document Preview</h2>
                    <div className="prose max-w-none text-gray-800">
                        <p>{doc.content_preview}</p>
                        <p className="mt-4 text-gray-400 italic">[Full document content would be rendered here, e.g. PDF viewer or text extraction]</p>
                        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center mt-8">
                            <span className="text-gray-400">PDF Viewer Placeholder</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Metadata & Comments */}
                <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Metadata */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Metadata</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-500">Author</dt><dd className="font-medium text-gray-900">{doc.metadata.author}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Modified</dt><dd className="font-medium text-gray-900">{doc.metadata.modified}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Size</dt><dd className="font-medium text-gray-900">{doc.metadata.size}</dd></div>
                            <div className="pt-2 border-t mt-2">
                                <dt className="text-gray-500 block mb-1">Path</dt>
                                <dd className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-1 rounded">{doc.metadata.path}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <h3 className="font-semibold text-gray-900 mb-4">Comments & Notes</h3>
                        <div className="flex-1 space-y-4 mb-4 min-h-[200px] overflow-y-auto">
                            {comments.map((c, i) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-gray-900">{c.user}</span>
                                        <span className="text-gray-400 text-xs">{c.date}</span>
                                    </div>
                                    <p className="text-gray-700">{c.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <textarea
                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={3}
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                            />
                            <button
                                onClick={handleAddComment}
                                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Post Comment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
