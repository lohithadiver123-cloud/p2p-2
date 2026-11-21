import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  ThumbsUp, 
  Building2, 
  Eye, 
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const CitizenDashboardView: React.FC = () => {
  const { 
    currentUser, 
    complaints, 
    setActiveTab, 
    setSelectedComplaintForDetails,
    upvoteComplaint,
    upvotedIds
  } = useApp();

  const citizenName = currentUser.name || 'Rahul Sharma';
  const citizenWard = currentUser.ward || 'Ward 8';

  // Filter complaints associated with this citizen or their ward
  const myComplaints = complaints.filter(c => 
    (currentUser.uid && c.reporterUid === currentUser.uid) ||
    c.citizenName?.toLowerCase().includes(citizenName.toLowerCase()) || 
    c.ward === citizenWard
  ).slice(0, 6);

  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved').length;
  const inProgressCount = myComplaints.length - resolvedCount;

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void upvoteComplaint(id);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Citizen Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#1A2640] to-[#121A2B] border border-[#2C416A] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2C4A] to-[#121A2B] border border-[#2C416A] flex items-center justify-center text-[#C6FF5F] text-xl font-bold shadow-inner">
              <User className="w-6 h-6 text-[#C6FF5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C6FF5F]/20 text-[#C6FF5F] border border-[#C6FF5F]/30">
                  CITIZEN ACCESS PORTAL
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {citizenWard} · Residential Zone
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Welcome back, {citizenName}
              </h1>
              <p className="text-xs text-[#8E9EB8] mt-0.5">
                Track your submitted civic issues, monitor AI routing progress, and report local hazards.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai-triage')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C6FF5F]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#0B1020]" />
            <span>+ REPORT NEW CIVIC ISSUE</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-[#223252] text-center sm:text-left">
            <div className="text-[10px] font-mono text-[#8E9EB8] uppercase">YOUR REPORTS</div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">{myComplaints.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Logged in system</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-[#FF9B42]/40 text-center sm:text-left">
            <div className="text-[10px] font-mono text-[#FF9B42] uppercase font-bold">ACTIVE UNDER ACTION</div>
            <div className="text-2xl font-extrabold font-mono text-[#FF9B42] mt-1">{inProgressCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Crew dispatched</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-emerald-500/40 text-center sm:text-left">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">RESOLVED ISSUES</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{resolvedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Verified closed</div>
          </div>
        </div>
      </div>

      {/* My Submitted Reports & Live Lifecycle Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
            <span>Your Neighborhood Incidents & Live Tracking</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {myComplaints.length} Active Records
          </span>
        </div>

        <div className="space-y-4">
          {myComplaints.map((item) => {
            const isResolved = item.status === 'Resolved';
            const isAssigned = item.status === 'Assigned' || item.status === 'In Progress';
            const currentStep = isResolved ? 4 : isAssigned ? 3 : 2;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedComplaintForDetails(item)}
                className="glass-panel p-5 rounded-2xl border border-[#223252] hover:border-[#43D9FF]/50 transition-all cursor-pointer space-y-4 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-1">{item.sectorIcon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#43D9FF]">
                          {item.id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-slate-300">
                          {item.sectorName}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.reportedAt}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#C6FF5F] transition-colors mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        📍 {item.locationName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {item.status === 'Resolved' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ✓ RESOLVED
                      </span>
                    ) : item.severity === 'CRITICAL' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40">
                        🔴 CRITICAL (Score: {item.priorityScore})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF9B42]/20 text-[#FF9B42] border border-[#FF9B42]/40">
                        🟠 IN PROGRESS
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Step Visual Progress Tracker */}
                <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className={currentStep >= 1 ? 'text-[#C6FF5F] font-bold' : ''}>
                      1. Citizen Logged
                    </span>
                    <span className={currentStep >= 2 ? 'text-[#43D9FF] font-bold' : ''}>
                      2. AI Triage & Prioritized
                    </span>
                    <span className={currentStep >= 3 ? 'text-[#FF9B42] font-bold' : ''}>
                      3. Routed to Department
                    </span>
                    <span className={currentStep >= 4 ? 'text-emerald-400 font-bold' : ''}>
                      4. Resolved
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-[#162035] h-2 rounded-full overflow-hidden flex">
                    <div className="w-1/4 bg-[#C6FF5F] h-full" />
                    <div className={`w-1/4 h-full ${currentStep >= 2 ? 'bg-[#43D9FF]' : 'bg-transparent'}`} />
                    <div className={`w-1/4 h-full ${currentStep >= 3 ? 'bg-[#FF9B42]' : 'bg-transparent'}`} />
                    <div className={`w-1/4 h-full ${currentStep >= 4 ? 'bg-emerald-400' : 'bg-transparent'}`} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8E9EB8] pt-1">
                    <span>Assigned Department: <strong className="text-slate-200">{item.department}</strong></span>
                    <span className="font-mono text-[10px] text-[#43D9FF]">SLA: {item.slaHours}h target</span>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={(e) => handleUpvote(item.id, e)}
                    disabled={Boolean(upvotedIds[item.id])}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-[11px] transition-all ${
                      upvotedIds[item.id]
                        ? 'bg-[#C6FF5F]/20 border-[#C6FF5F]/50 text-[#C6FF5F]'
                        : 'bg-[#18233B] hover:bg-[#203154] border-[#2C416A] text-slate-300 hover:text-[#C6FF5F]'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>
                      {upvotedIds[item.id] ? 'Confirmed' : 'Confirm / Upvote'} ({item.upvoteCount ?? 0})
                    </span>
                  </button>

                  <span className="text-[#43D9FF] font-mono text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View Ticket Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
