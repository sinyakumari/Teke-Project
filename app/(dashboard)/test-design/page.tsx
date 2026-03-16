'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SegmentedControl from '@/components/ui/SegmentedControl'

export default function DesignPreviewPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'Overview' | 'Tasks' | 'Materials'>('Overview')

    // Mock Data for Preview
    const progress = 75
    const tasks = [
        { id: '1', name: 'Layout Foundation', status: 'Complete', desc: 'Designing the grid and container strategy.' },
        { id: '2', name: 'Glassmorphism Effects', status: 'In Progress', desc: 'Implementing blurs and transparency safely.' },
        { id: '3', name: 'Performance Optimization', status: 'Pending', desc: 'Ensuring smooth animations and fast loads.' },
    ]

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
            {/* 1. Immersive Hero Section */}
            <div className="relative bg-[#1a1f2e] pt-12 pb-24 px-8 overflow-hidden">
                {/* Visual Backdrop Effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10 text-center lg:text-left">
                    <button 
                        onClick={() => router.back()}
                        className="mb-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all backdrop-blur-md"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/20 rounded-full mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Active Training</span>
                    </div>
                    
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">Mastering Modern UI:<br/><span className="text-blue-400">High-Fidelity Dashboards</span></h1>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Elevate your design skills with this comprehensive deep-dive into high-fidelity web interfaces using React and Tailwind.
                    </p>
                </div>
            </div>

            {/* 2. Main Dashboard Layout */}
            <div className="flex-1 px-4 md:px-8 -mt-16 pb-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Column: Content Area */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Tab Navigation (Glassmosphere Style) */}
                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-2 shadow-xl shadow-slate-200/50 sticky top-4 z-40">
                            <SegmentedControl
                                options={[
                                    { label: 'Syllabus Overview', value: 'Overview' },
                                    { label: 'Interactive Tasks', value: 'Tasks' },
                                    { label: 'Resources', value: 'Materials' }
                                ]}
                                value={activeTab}
                                onChange={(tab) => setActiveTab(tab as any)}
                            />
                        </div>

                        {/* Content Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 min-h-[400px]">
                            {activeTab === 'Overview' && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-[#1a1f2e] flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-500">auto_awesome</span>
                                            Course Description
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-lg">
                                            This course covers advanced layout techniques, glassmorphism, and responsive dashboard design. We focus on real-world production level code that wows the user by blending aesthetics with performance.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center mb-4 text-blue-500">
                                                <span className="material-symbols-outlined">schedule</span>
                                            </div>
                                            <h4 className="font-bold text-[#1a1f2e] mb-1">Duration</h4>
                                            <p className="text-sm text-slate-500 font-medium italic">Estimated 12 hours of material</p>
                                        </div>
                                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center mb-4 text-emerald-500">
                                                <span className="material-symbols-outlined">rocket_launch</span>
                                            </div>
                                            <h4 className="font-bold text-[#1a1f2e] mb-1">Complexity</h4>
                                            <p className="text-sm text-slate-500 font-medium italic">Intermediate to Advanced</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Tasks' && (
                                <div className="space-y-4">
                                    {tasks.map(task => (
                                        <div key={task.id} className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/5 transition-all cursor-pointer">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                                                    task.status === 'Complete' ? 'bg-emerald-50 text-emerald-500' : 
                                                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                    <span className="material-symbols-outlined">
                                                        {task.status === 'Complete' ? 'check_circle' : 
                                                         task.status === 'In Progress' ? 'pending' : 'lock'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#1a1f2e]">{task.name}</h4>
                                                    <p className="text-xs text-slate-400 font-medium italic">{task.desc}</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Learning Hub (Sticky Sidebar) */}
                    <div className="lg:w-[360px] shrink-0">
                        <div className="bg-[#1a1f2e] rounded-[2.5rem] p-8 shadow-2xl sticky top-4 overflow-hidden group">
                            {/* Backdrop glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/40 transition-all duration-700" />
                            
                            <div className="relative z-10 flex flex-col items-center">
                                {/* Circular Progress Gauge */}
                                <div className="relative w-40 h-40 mb-8">
                                    <svg className="w-full h-full -rotate-90 transform">
                                        <circle
                                            cx="80" cy="80" r="72"
                                            className="stroke-slate-800" strokeWidth="12" fill="none"
                                        />
                                        <circle
                                            cx="80" cy="80" r="72"
                                            className="stroke-blue-500 transition-all duration-1000 ease-out"
                                            strokeWidth="12" fill="none"
                                            strokeDasharray={2 * Math.PI * 72}
                                            strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white tracking-tighter">{progress}%</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] -mt-1">Complete</span>
                                    </div>
                                </div>

                                <button className="w-full bg-white text-[#1a1f2e] py-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-lg mb-8 uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                    Resume Lesson
                                </button>

                                <div className="w-full pt-8 border-t border-white/5 flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white overflow-hidden border border-white/10 p-0.5">
                                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[14px] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-2xl">face</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">Design System Bot</h5>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lead Instructor</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
