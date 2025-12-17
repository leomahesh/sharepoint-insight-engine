'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';

// Define interface for Dashboard Data
interface DashboardStats {
  recent_documents: { id: string; name: string; type: string; date: string }[];
  document_counts: { pdf: number; word: number; excel: number; ppt: number };
  total_documents: number;
}

export default function Dashboard() {
  const { isAdmin, role, setRole } = useAuth();

  // Initial state with valid structure but empty values to avoid runtime errors before fetch
  const [stats, setStats] = useState<DashboardStats>({
    recent_documents: [],
    document_counts: { pdf: 0, word: 0, excel: 0, ppt: 0 },
    total_documents: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('http://localhost:8000/api/v1/config/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert("Upload Successful!");
        // Refresh stats
        window.location.reload();
      } else {
        alert("Upload Failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading files");
    }
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        // Merge with default structure to ensure safe access
        setStats({
          recent_documents: data.recent_documents || [],
          document_counts: { ...{ pdf: 0, word: 0, excel: 0, ppt: 0 }, ...data.document_counts },
          total_documents: data.total_documents || 0
        });
      })
      .catch(err => console.error("Failed to fetch dashboard stats", err));
  }, []);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your SharePoint workspace</p>
        </div>

        {/* Role Switcher for Demo */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-600">Current Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="bg-gray-100 border-none rounded px-3 py-1 text-sm font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Documents" value={stats.total_documents} icon="📄" />
        <StatCard title="PDFs" value={stats.document_counts.pdf} icon="📕" />
        <StatCard title="Word Docs" value={stats.document_counts.word} icon="📘" />
        <StatCard title="Excel Sheets" value={stats.document_counts.excel} icon="📗" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recently Accessed</h2>
          <div className="space-y-4">
            {stats.recent_documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(doc.type)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500">Accessed {doc.date}</p>
                  </div>
                </div>
                <Link href={`/documents/${doc.id}`} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/search" className="block w-full p-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              🔍 Search Documents
            </Link>

            {isAdmin ? (
              <>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={handleUploadClick}
                  className="block w-full p-3 text-center bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  📤 Upload File
                </button>
                <Link href="/setup" className="block w-full p-3 text-center bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  🔄 Sync SharePoint
                </Link>
              </>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
                Admin access required for Sync/Upload.
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Folders</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="flex items-center text-gray-600 hover:text-blue-600"><span className="mr-2">📁</span> General</Link></li>
              <li><Link href="#" className="flex items-center text-gray-600 hover:text-blue-600"><span className="mr-2">📁</span> Projects</Link></li>
              <li><Link href="#" className="flex items-center text-gray-600 hover:text-blue-600"><span className="mr-2">📁</span> Finance</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return '📕';
    case 'word': return '📘';
    case 'excel': return '📗';
    case 'ppt': return '📙';
    default: return '📄';
  }
}
