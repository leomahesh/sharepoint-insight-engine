'use client';

import { useState } from 'react';

export default function SetupPage() {
    const [status, setStatus] = useState<string>('idle');
    const [logs, setLogs] = useState<string[]>([]);

    const handleSync = async () => {
        setStatus('running');
        setLogs(prev => [...prev, 'Requesting sync start...']);

        try {
            const startRes = await fetch('http://localhost:8000/api/v1/sync/start', { method: 'POST' });
            if (!startRes.ok) throw new Error('Failed to start sync');

            setLogs(prev => [...prev, 'Sync started. Polling status...']);

            // Poll status every 2 seconds
            const interval = setInterval(async () => {
                try {
                    const statusRes = await fetch('http://localhost:8000/api/v1/sync/status');
                    const data = await statusRes.json();

                    if (data.message && logs[logs.length - 1] !== data.message) {
                        setLogs(prev => {
                            // Avoid duplicate logs if polling returns same message
                            if (prev[prev.length - 1] === data.message) return prev;
                            return [...prev, data.message];
                        });
                    }

                    if (data.status === 'complete') {
                        clearInterval(interval);
                        setStatus('complete');
                        setLogs(prev => [...prev, `Sync finished! Documents processed: ${data.docs_count}`]);
                    } else if (data.status === 'error') {
                        clearInterval(interval);
                        setStatus('error');
                        setLogs(prev => [...prev, 'Error occurred during sync.']);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setLogs(prev => [...prev, 'Error: Failed to connect to backend.']);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Connect SharePoint</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-600 mb-6">
                    To access your documents, we need to sync with SharePoint.
                    When you click "Start Sync", a browser window will open.
                    Please log in to your Microsoft account in that window.
                </p>

                <div className="flex justify-center mb-8">
                    <button
                        onClick={handleSync}
                        disabled={status === 'running'}
                        className={`
                px-8 py-3 rounded-lg font-semibold text-white transition-all
                ${status === 'running' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}
              `}
                    >
                        {status === 'running' ? 'Syncing...' : 'Start Sync & Login'}
                    </button>
                </div>

                {logs.length > 0 && (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">
                                <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                        {status === 'running' && <div className="animate-pulse">_</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
