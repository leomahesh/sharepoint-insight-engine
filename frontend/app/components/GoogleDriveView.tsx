'use client';

import { useState, useEffect } from 'react';
import { Folder, File, HardDrive, Download, ChevronRight, Home, LogIn } from 'lucide-react';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    size?: string;
}

export default function GoogleDriveView() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderHistory, setFolderHistory] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'My Drive' }]);
    const [ingestingFiles, setIngestingFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadFiles(currentFolderId);
        }
    }, [isAuthenticated, currentFolderId]);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/drive/auth/status');
            const data = await res.json();
            setIsAuthenticated(data.authenticated);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('http://localhost:8000/api/v1/drive/auth/login', { method: 'POST' });
            const data = await res.json();
            if (data.authenticated) {
                setIsAuthenticated(true);
            }
        } catch (err) {
            console.error(err);
            alert("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const loadFiles = async (folderId: string | null) => {
        try {
            const url = folderId
                ? `http://localhost:8000/api/v1/drive/files?folder_id=${folderId}`
                : `http://localhost:8000/api/v1/drive/files`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setFiles(data);
            } else {
                setFiles([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFolderClick = (file: DriveFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            setFolderHistory([...folderHistory, { id: file.id, name: file.name }]);
            setCurrentFolderId(file.id);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        const newHistory = folderHistory.slice(0, index + 1);
        setFolderHistory(newHistory);
        setCurrentFolderId(newHistory[newHistory.length - 1].id);
    };

    const ingestFile = async (file: DriveFile) => {
        try {
            setIngestingFiles(prev => new Set(prev).add(file.id));
            const res = await fetch('http://localhost:8000/api/v1/drive/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: file.id, file_name: file.name })
            });
            if (res.ok) {
                alert("File ingestion started");
            } else {
                alert("Ingestion failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error ingesting file");
        } finally {
            setIngestingFiles(prev => {
                const next = new Set(prev);
                next.delete(file.id);
                return next;
            });
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl p-8 border border-slate-200">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <HardDrive className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Google Drive</h2>
                <p className="text-slate-500 mb-6 text-center max-w-md">
                    Link your Google Drive account to import documents directly into the Insight Engine.
                </p>
                <button
                    onClick={login}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                    <LogIn className="w-5 h-5" />
                    Connect Account
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[70vh]">
            {/* Header / Breadcrumbs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 overflow-x-auto">
                {folderHistory.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 shrink-0">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-medium transition ${index === folderHistory.length - 1
                                    ? 'text-slate-900 bg-white shadow-sm'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200/50'
                                }`}
                        >
                            {index === 0 && <Home className="w-4 h-4" />}
                            {item.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* File List */}
            <div className="p-4">
                {files.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">This folder is empty</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {files.map(file => {
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            return (
                                <div
                                    key={file.id}
                                    className={`
                    group relative p-4 rounded-xl border transition-all cursor-pointer
                    ${isFolder
                                            ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50 hover:border-blue-300'
                                            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
                  `}
                                    onClick={() => isFolder && handleFolderClick(file)}
                                >
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${isFolder ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {isFolder ? <Folder className="w-6 h-6" /> : <File className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-700 truncate text-sm" title={file.name}>{file.name}</h4>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {isFolder ? 'Folder' : 'File'}
                                            </p>
                                        </div>
                                    </div>

                                    {!isFolder && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                ingestFile(file);
                                            }}
                                            disabled={ingestingFiles.has(file.id)}
                                            className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-slate-200 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {ingestingFiles.has(file.id) ? (
                                                <span>Ingesting...</span>
                                            ) : (
                                                <>
                                                    <Download className="w-3 h-3" />
                                                    Ingest
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
