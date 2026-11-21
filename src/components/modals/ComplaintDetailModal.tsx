import React from 'react';
import { useApp } from '../../context/AppContext';
import { TicketStatus, Severity } from '../../types';
import { 
  X, 
  MapPin, 
  Clock, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  ShieldCheck, 
  Flame, 
  Navigation,
  CheckCircle
} from 'lucide-react';

export const ComplaintDetailModal: React.FC = () => {
  const { 
    selectedComplaintForDetails, 
    setSelectedComplaintForDetails, 
    updateComplaintStatus,
    setActiveTab
  } = useApp();

  if (!selectedComplaintForDetails) return null;

  const c = selectedComplaintForDetails;

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateComplaintStatus(c.id, newStatus);
    setSelectedComplaintForDetails({
      ...c,
      status: newStatus
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#121A2B] border border-[#2C416A] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#223252] flex items-start justify-between bg-gradient-to-r from-[#141E34] to-[#121A2B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold font-mono text-[#43D9FF]">
                {c.id}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-white">
                <span>{c.sectorIcon}</span>
                <span>{c.sectorName}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-[#C6FF5F]">
                {c.ward}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {c.title}
            </h2>
          </div>

          <button
            onClick={() => setSelectedComplaintForDetails(null)}
            className="p-2 rounded-xl bg-[#0B1020] text-slate-400 hover:text-white border border-[#223252] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">SEVERITY</div>
              <div className="text-xs font-mono font-bold mt-1">
                {c.severity === 'CRITICAL' && <span className="text-[#FF4D5E]">🔴 CRITICAL</span>}
                {c.severity === 'HIGH' && <span className="text-[#FF9B42]">🟠 HIGH</span>}
                {c.severity === 'MEDIUM' && <span className="text-[#FFD166]">🟡 MEDIUM</span>}
                {c.severity === 'LOW' && <span className="text-[#47D18C]">🟢 LOW</span>}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">PRIORITY SCORE</div>
              <div className="text-sm font-mono font-extrabold text-[#C6FF5F] mt-1">
                {c.priorityScore} / 100
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">CURRENT STATUS</div>
              <div className="text-xs font-mono font-bold text-white mt-1">
                {c.status}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">TARGET SLA</div>
              <div className="text-xs font-mono font-bold text-[#43D9FF] mt-1">
                {c.slaHours} Hours
              </div>
            </div>
          </div>

          {/* Citizen Description & Image */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider">
              Citizen Incident Report
            </h3>
            <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200 leading-relaxed space-y-2">
              <p>"{c.description}"</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#8E9EB8] pt-2 border-t border-[#223252]">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#43D9FF]" />
                  <span>Citizen: {c.citizenName || 'Anonymous Citizen'}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported: {c.reportedAt}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF9B42]" />
                  <span>{c.locationName}</span>
                </span>
              </div>
            </div>

            {c.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[#223252] h-48 bg-[#0B1020]">
                <img
                  src={c.imageUrl}
                  alt="Incident Visual Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* AI Intelligence Assessment */}
          <div className="p-4 rounded-xl bg-[#162035] border border-[#243354] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C6FF5F] uppercase">
              <Sparkles className="w-4 h-4" />
              <span>CivicLens AI Triage Assessment</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-mono text-[10px] text-slate-400 uppercase">AI Reasoning</div>
              <p className="text-slate-200 italic leading-relaxed">
                "{c.aiReasoning}"
              </p>
            </div>

            <div className="space-y-1 text-xs pt-1">
              <div className="font-mono text-[10px] text-emerald-400 uppercase">Recommended Municipal Action</div>
              <p className="text-emerald-300 leading-relaxed font-medium">
                {c.recommendedAction}
              </p>
            </div>
          </div>

          {/* Routing & Department */}
          <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-slate-400">Responsible Agency</span>
              <span className="font-mono text-[10px] text-[#43D9FF]">Automated Dispatch</span>
            </div>
            <div className="font-bold text-white text-sm">
              {c.department}
            </div>
            <div className="text-[#8E9EB8]">
              Assigned Field Crew: <span className="text-slate-200 font-mono font-semibold">{c.assignedTeam || 'Rapid Response Unit 1'}</span>
            </div>
          </div>

          {/* Lifecycle Status Controller */}
          <div className="space-y-2 pt-2 border-t border-[#223252]">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold">
              Update Incident Lifecycle State
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['New', 'Assigned', 'In Progress', 'Resolved'] as TicketStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                    c.status === st
                      ? st === 'Resolved' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' 
                        : 'bg-[#43D9FF]/20 text-[#43D9FF] border-[#43D9FF]'
                      : 'bg-[#0B1020] text-slate-400 border-[#223252] hover:text-white'
                  }`}
                >
                  {st === 'Resolved' ? '✓ Resolved' : st}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B1020] border-t border-[#223252] flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedComplaintForDetails(null);
              setActiveTab('map');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18233B] hover:bg-[#203154] text-xs font-mono text-[#43D9FF] border border-[#2C416A]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Locate on Map</span>
          </button>

          <button
            onClick={() => setSelectedComplaintForDetails(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold text-xs font-mono uppercase tracking-wider"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
