'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';

// Icons as SVG components for professional look
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Docs: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Sync: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  PDF: () => <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
  Word: () => <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">

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

      <div className="flex flex-1">
        {/* 2. Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden lg:block sticky top-20 h-[calc(100vh-5rem)] z-30">
          <nav className="p-6 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>

            <NavItem href="#" active icon={<Icons.Dashboard />} label="Dashboard" />
            <NavItem href="/search" icon={<Icons.Search />} label="Search Archive" />
            <NavItem href="/documents" icon={<Icons.Docs />} label="My Documents" />

            <div className="pt-6 mt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Workspace</p>
              {isAdmin && (
                <>
                  <button onClick={handleUploadClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all group">
                    <span className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600"><Icons.Upload /></span>
                    Upload File
                  </button>
                  {/* Hidden Input */}
                  <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />

                  <Link href="/setup" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all group">
                    <span className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600"><Icons.Sync /></span>
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
            <div className="absolute inset-0 bg-[url('/horizon_campus.png')] bg-cover bg-center opacity-60 group-hover:opacity-70 transition-opacity duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>

            <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-0">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">HUC Dashboard</h2>
              <p className="text-blue-100 mb-6 max-w-2xl text-sm font-medium">Manage student records, faculty documents, and research archives in a single secure environment.</p>

              {/* Tabs Matching Background */}
              <div className="flex gap-1">
                <button className="px-6 py-3 bg-white text-blue-900 text-sm font-bold rounded-t-lg shadow-lg translate-y-1">Analytics</button>
                <button className="px-6 py-3 bg-white/10 text-white backdrop-blur-md text-sm font-medium rounded-t-lg hover:bg-white/20 transition-colors border border-white/10">Accreditation</button>
                <button className="px-6 py-3 bg-white/10 text-white backdrop-blur-md text-sm font-medium rounded-t-lg hover:bg-white/20 transition-colors border border-white/10">OBEF/Strategic Goal</button>
                <button className="px-6 py-3 bg-white/10 text-white backdrop-blur-md text-sm font-medium rounded-t-lg hover:bg-white/20 transition-colors border border-white/10">Reports</button>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Documents"
                value={stats.total_documents}
                icon={<span className="text-2xl">📚</span>}
                trend="+12%"
                color="blue"
              />
              <StatCard
                title="PDF Reports"
                value={stats.document_counts.pdf}
                icon={<span className="text-2xl">📕</span>}
                color="rose"
              />
              <StatCard
                title="Word Documents"
                value={stats.document_counts.word}
                icon={<span className="text-2xl">📘</span>}
                color="indigo"
              />
              <StatCard
                title="Excel Sheets"
                value={stats.document_counts.excel}
                icon={<span className="text-2xl">📗</span>}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Documents Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Recently Accessed
                    </h2>
                    <Link href="/search" className="text-sm font-medium text-blue-600 hover:text-blue-800">View All &rarr;</Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4">Document Name</th>
                          <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                          <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.recent_documents.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                              No recent documents found. Start by uploading a file.
                            </td>
                          </tr>
                        ) : (
                          stats.recent_documents.map((doc, idx) => (
                            <tr key={idx} className="group hover:bg-blue-50/50 transition-colors">
                              <td className="py-4 pl-4">
                                <div className="flex items-center gap-3">
                                  <span className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-slate-100">
                                    {doc.type === 'pdf' ? <Icons.PDF /> : <Icons.Word />}
                                  </span>
                                  <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{doc.name}</span>
                                </div>
                              </td>
                              <td className="py-4 text-sm text-slate-500 capitalize">{doc.type}</td>
                              <td className="py-4 text-sm text-slate-500">{doc.date}</td>
                              <td className="py-4 text-right pr-4">
                                <Link href={`/documents/${doc.id}`} className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Stats / Calendar / Messages */}
              <div className="space-y-6">

                {/* Welcome Card */}
                <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20 border-none relative overflow-hidden">
                  {/* Abstract shapes */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                  <h3 className="text-lg font-bold relative z-10">Welcome back, {role === 'admin' ? 'Administrator' : 'Student'}!</h3>
                  <p className="text-blue-100 text-sm mt-2 relative z-10">You have {stats.total_documents} documents in your cloud archive.</p>

                  <div className="mt-6 flex gap-3 relative z-10">
                    <Link href="/search" className="flex-1 bg-white text-blue-700 text-center py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-50 transition-colors">
                      Search
                    </Link>
                    {isAdmin && (
                      <button onClick={handleUploadClick} className="flex-1 bg-blue-500/30 text-white border border-white/20 text-center py-2 rounded-lg text-sm font-bold hover:bg-blue-500/50 transition-colors">
                        Upload
                      </button>
                    )}
                  </div>
                </div>

                {/* Department Quick Links */}
                <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">University Departments</h3>
                  <div className="space-y-3">
                    <DepartmentLink name="Faculty of Engineering" icon="🏗️" />
                    <DepartmentLink name="Business School" icon="💼" />
                    <DepartmentLink name="Student Affairs" icon="🎓" />
                    <DepartmentLink name="Library Services" icon="📚" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-components

function NavItem({ href, active = false, icon, label }: { href: string, active?: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group
            ${active
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
        `}>
      <span className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

const COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  rose: "bg-rose-50 text-rose-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600"
};

function StatCard({ title, value, icon, trend, color }: any) {
  const colorClass = COLORS[color] || COLORS.blue;

  return (
    <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(30,58,138,0.08)] transition-all cursor-default group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
          <span className="bg-emerald-50 px-1.5 py-0.5 rounded mr-2">↗ {trend}</span>
          <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}

function DepartmentLink({ name, icon }: any) {
  return (
    <Link href="#" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{name}</span>
      </div>
      <span className="text-slate-300 group-hover:text-blue-400">→</span>
    </Link>
  )
}
