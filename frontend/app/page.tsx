'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import Flasher from './components/Flasher';
import ChatInterface from './components/ChatInterface';
import StatusIndicator from './components/StatusIndicator';
import NotebookView from './components/NotebookView';
import GoogleDriveView from './components/GoogleDriveView';
import { ChatBot } from './components/ChatBot';

// Icons as SVG components for professional look
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Docs: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Sync: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  PDF: () => <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  Word: () => <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  Notebook: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Drive: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
}

// Define interface for Dashboard Data (Same as before)
interface DashboardStats {
  recent_documents: { id: string; name: string; type: string; date: string }[];
  document_counts: { pdf: number; word: number; excel: number; ppt: number };
  total_documents: number;
}

export default function Dashboard() {
  const { isAdmin, role, setRole } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use state with initial mock values to look good immediately
  // Dashboard state
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'Analytics' | 'Accreditation' | 'OBEF' | 'Reports' | 'Chat' | 'Ministry' | 'Notebook' | 'Drive'>('Analytics');
  const [activeAccreditationTab, setActiveAccreditationTab] = useState<'ABET' | 'CAA' | 'AACSB' | 'QAA'>('ABET');
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'Accreditation') {
      fetchFolders(activeAccreditationTab);
    }
  }, [activeTab, activeAccreditationTab]);

  const fetchFolders = async (category: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/folders/${category}`);
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Failed to fetch folders", err);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;

    try {
      const res = await fetch('http://localhost:8000/api/v1/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: activeAccreditationTab })
      });
      if (res.ok) {
        fetchFolders(activeAccreditationTab);
      }
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const [stats, setStats] = useState<DashboardStats>({
    recent_documents: [],
    document_counts: { pdf: 0, word: 0, excel: 0, ppt: 0 },
    total_documents: 0
  });

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => formData.append('files', file));
    try {
      const res = await fetch('http://localhost:8000/api/v1/config/upload', { method: 'POST', body: formData });
      if (res.ok) { alert("Upload Successful!"); window.location.reload(); }
      else { alert("Upload Failed"); }
    } catch (err) { console.error(err); alert("Error uploading files"); }
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          recent_documents: data.recent_documents || [],
          document_counts: { ...{ pdf: 0, word: 0, excel: 0, ppt: 0 }, ...data.document_counts },
          total_documents: data.total_documents || 0
        });
      })
      .catch(err => console.error("Failed to fetch dashboard stats", err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-300 font-sans text-slate-900">

      {/* 1. Header Bar - Horizon Blue Gradient */}
      <header className="glass-header h-20 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide uppercase text-white drop-shadow-sm">Horizon University College</h1>
            <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold opacity-80">Document Management System</p>
          </div>
        </div>

        {/* User Profile / Role Switcher */}
        <div className="flex items-center gap-4">
          <StatusIndicator />
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm font-medium text-white">System Online</span>
          </div>

          {/* Role Selector styled as glass component */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="bg-black/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:bg-black/30 transition-colors cursor-pointer"
          >
            <option value="admin" className="text-black">Admin View</option>
            <option value="user" className="text-black">Student View</option>
          </select>
        </div>
      </header>

      {/* Flasher Section */}
      <Flasher />

      <div className="flex flex-1">
        {/* 2. Sidebar Navigation */}
        <aside className="w-64 bg-slate-200 border-r border-slate-300 hidden lg:block sticky top-20 h-[calc(100vh-5rem)] z-30">
          <nav className="p-6 space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Main Menu</p>

            <div onClick={() => setActiveTab('Dashboard' as any)} className="cursor-pointer">
              <NavItem href="#" active={activeTab === 'Dashboard' as any} icon={<Icons.Dashboard />} label="Dashboard" />
            </div>

            <div onClick={() => setActiveTab('Notebook')} className="cursor-pointer">
              <NavItem href="#" active={activeTab === 'Notebook'} icon={<Icons.Notebook />} label="Notebook AI" />
            </div>
            <NavItem href="/search" icon={<Icons.Search />} label="Search Archive" />
            <NavItem href="/documents" icon={<Icons.Docs />} label="My Documents" />

            <div className="pt-6 mt-6 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Workspace</p>

              <div onClick={() => setActiveTab('Drive')} className="cursor-pointer mb-2">
                <NavItem href="#" active={activeTab === 'Drive'} icon={<Icons.Drive />} label="Google Drive" />
              </div>

              {isAdmin && (
                <>
                  <button onClick={handleUploadClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-xl transition-all group">
                    <span className="group-hover:scale-110 transition-transform text-slate-500 group-hover:text-blue-400"><Icons.Upload /></span>
                    Upload File
                  </button>
                  {/* Hidden Input */}
                  <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />

                  <Link href="/setup" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-xl transition-all group">
                    <span className="group-hover:scale-110 transition-transform text-slate-500 group-hover:text-blue-400"><Icons.Sync /></span>
                    Sync SharePoint
                  </Link>
                </>
              )}
            </div>
          </nav>
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 overflow-y-auto">

          {/* Hero Section with College Image */}
          <div className="relative h-48 w-full bg-slate-900 overflow-hidden mb-8 group">
            <div className="absolute inset-0 bg-[url('/horizon_campus.png')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-200/90 via-slate-100/40 to-transparent"></div>

            <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-0">
              <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">HUC Dashboard</h2>
              <p className="text-slate-600 mb-6 max-w-2xl text-sm font-medium">Manage student records, faculty documents, and research archives in a single secure environment.</p>

              {/* Tabs Matching Background */}
              <div className="flex gap-1 overflow-x-auto">
                <TabButton label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
                <TabButton label="Accreditation" active={activeTab === 'Accreditation'} onClick={() => setActiveTab('Accreditation')} />
                <TabButton label="Ministry Submission" active={activeTab === 'Ministry'} onClick={() => setActiveTab('Ministry')} />
                <TabButton label="OBEF/Strategic Goal" active={activeTab === 'OBEF'} onClick={() => setActiveTab('OBEF')} />
                <TabButton label="Chat" active={activeTab === 'Chat'} onClick={() => setActiveTab('Chat')} />
                <TabButton label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
              </div>
            </div>
          </div>

          <div className="px-8 pb-8">

            {/* Tab Content */}
            {activeTab === 'Analytics' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Documents Table Removed */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Placeholder or Empty */}
                  </div>

                  {/* Right Column Removed */}
                  <div>
                    {/* Placeholder or Empty */}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Notebook' && (
              <NotebookView />
            )}

            {activeTab === 'Drive' && (
              <div className="px-8 pb-8">
                <GoogleDriveView />
              </div>
            )}


            {activeTab === 'Chat' && (
              <div className="max-w-4xl mx-auto px-8 pb-8">
                <ChatBot />
              </div>
            )}

            {activeTab === 'Accreditation' && (
              <div className="max-w-6xl mx-auto">
                {/* Sub-tabs Navigation */}
                <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto">
                  {['ABET', 'CAA', 'AACSB', 'QAA'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveAccreditationTab(tab as any)}
                      className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeAccreditationTab === tab
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{activeAccreditationTab} Accreditation Workspace</h3>
                        <p className="text-slate-500 mt-1">Manage compliance documents, self-study reports, and evidence for {activeAccreditationTab}.</p>
                      </div>
                      <button onClick={handleCreateFolder} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                        <span className="text-lg">+</span> New Folder
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Dynamic Folders */}
                      {folders.map(folder => (
                        <div key={folder.id} className="group p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl text-yellow-500/80 drop-shadow-sm">📁</span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{folder.name}</h4>
                              <p className="text-xs text-slate-400">0 items</p>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-blue-600 transition-all">→</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity in this Tab */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent {activeAccreditationTab} Activity</h4>
                    <div className="text-sm text-slate-500 italic">No recent updates in this workspace.</div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab !== 'Analytics' && activeTab !== 'Chat' && activeTab !== 'Accreditation' && activeTab !== 'Ministry' && activeTab !== 'OBEF') && (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <span className="text-4xl mb-4">🚧</span>
                <p className="font-medium">The {activeTab} module is currently under development.</p>
              </div>
            )}

            {activeTab === 'Ministry' && (
              <div className="max-w-5xl mx-auto py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-8 flex flex-col items-center text-center">
                    <img src="/ministry_logo.png" alt="Ministry of Higher Education" className="h-32 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800">Ministry Requirements & Submissions</h2>
                    <p className="text-slate-500 mt-2 max-w-2xl">Central repository for all compliance documents and official submissions to the Ministry of Higher Education & Scientific Research.</p>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">📄</span>
                        <div>
                          <h3 className="font-bold text-slate-700">New Submission</h3>
                          <p className="text-xs text-slate-400">Start a new compliance filing</p>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 group-hover:border-blue-300 group-hover:text-blue-600">Start Process</button>
                    </div>

                    <div className="p-6 border border-slate-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">📊</span>
                        <div>
                          <h3 className="font-bold text-slate-700">Submission Status</h3>
                          <p className="text-xs text-slate-400">Track pending approvals</p>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 group-hover:border-emerald-300 group-hover:text-emerald-600">View Status</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Ministry' && (
              <div className="max-w-5xl mx-auto py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-8 flex flex-col items-center text-center">
                    <img src="/ministry_logo.png" alt="Ministry of Higher Education" className="h-32 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800">Ministry Requirements & Submissions</h2>
                    <p className="text-slate-500 mt-2 max-w-2xl">Central repository for all compliance documents and official submissions to the Ministry of Higher Education & Scientific Research.</p>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">📄</span>
                        <div>
                          <h3 className="font-bold text-slate-700">New Submission</h3>
                          <p className="text-xs text-slate-400">Start a new compliance filing</p>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 group-hover:border-blue-300 group-hover:text-blue-600">Start Process</button>
                    </div>

                    <div className="p-6 border border-slate-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">📊</span>
                        <div>
                          <h3 className="font-bold text-slate-700">Submission Status</h3>
                          <p className="text-xs text-slate-400">Track pending approvals</p>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 group-hover:border-emerald-300 group-hover:text-emerald-600">View Status</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'OBEF' && (
              <div className="w-full h-full min-h-[85vh] p-8 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 transform transition-all hover:scale-[1.02]">
                  <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📊</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 mb-2">OBEF/Strategic Goal Dashboard</h2>
                  <p className="text-slate-500 mb-8">
                    This advanced report is hosted on Google AI Studio for enhanced security and performance.
                  </p>

                  <a
                    href="https://aistudio.google.com/apps/drive/1H0Ed3rmTNVMwpji5ZvKdngzHSqG2vBf5?showPreview=true&showAssistant=true&fullscreenApplet=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Launch Dashboard</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>

                  <p className="text-xs text-slate-400 mt-4">
                    Opens in a new secure window
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-components

// Sub-components
function TabButton({ label, active, onClick, highlight }: { label: string, active: boolean, onClick: () => void, highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 text-sm font-medium rounded-t-lg transition-all border border-white/10
        ${active
          ? 'bg-white text-blue-800 font-bold shadow-sm translate-y-1'
          : 'bg-white/40 text-slate-600 backdrop-blur-md hover:bg-white/60'}
        ${highlight && !active ? 'bg-indigo-500/40 border-indigo-300/30' : ''}
      `}
    >
      {label} {highlight && <span className="ml-1 text-xs">✨</span>}
    </button>
  );
}

function NavItem({ href, active = false, icon, label }: { href: string, active?: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group
            ${active
        ? 'bg-blue-50 text-blue-600 font-bold shadow-sm border border-blue-100'
        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}
        `}>
      <span className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

const COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  rose: "bg-rose-100 text-rose-600",
  indigo: "bg-indigo-100 text-indigo-600",
  emerald: "bg-emerald-100 text-emerald-600"
};

function StatCard({ title, value, icon, trend, color }: any) {
  const colorClass = COLORS[color] || COLORS.blue;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 bg-')} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
          <span className="bg-emerald-100 px-1.5 py-0.5 rounded mr-2">↗ {trend}</span>
          <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}

function DepartmentLink({ name, icon }: any) {
  return (
    <Link href="#" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">{name}</span>
      </div>
      <span className="text-slate-300 group-hover:text-blue-500">→</span>
    </Link>
  )
}

function WeeklyReportCard() {
  const [weeklyStats, setWeeklyStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/dashboard/weekly')
      .then(res => res.json())
      .then(data => setWeeklyStats(data))
      .catch(err => console.error("Weekly stats error", err));
  }, []);

  if (!weeklyStats) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex justify-between">
        <span>Weekly Uploads</span>
        <span className="text-xs text-slate-500 normal-case bg-slate-100 px-2 py-0.5 rounded">Last 7 Days</span>
      </h3>

      <div className="space-y-4">
        <WeeklyStatRow label="PDF Documents" count={weeklyStats.pdf} color="bg-red-500" />
        <WeeklyStatRow label="Excel Sheets" count={weeklyStats.excel} color="bg-emerald-500" />
        <WeeklyStatRow label="Word Documents" count={weeklyStats.word} color="bg-blue-500" />
        <WeeklyStatRow label="Presentations" count={weeklyStats.ppt} color="bg-orange-500" />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400">Total processed this week: <span className="font-bold text-slate-700">{(weeklyStats.pdf + weeklyStats.excel + weeklyStats.word + weeklyStats.ppt + (weeklyStats.other || 0))}</span></p>
      </div>
    </div>
  );
}

function WeeklyStatRow({ label, count, color }: any) {
  if (!count) return null; // Hide if 0
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
    </div>
  );
}
