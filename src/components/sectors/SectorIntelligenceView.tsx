import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicSector } from '../../types';
import { 
  Grid3X3, 
  Search, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  ArrowRight, 
  Plus, 
  X,
  Filter,
  BarChart2,
  ExternalLink
} from 'lucide-react';

export const SectorIntelligenceView: React.FC = () => {
  const { 
    sectors, 
    complaints, 
    selectedSectorForDrilldown, 
    setSelectedSectorForDrilldown,
    setSelectedComplaintForDetails,
    setActiveTab,
    setFilterSector
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT' | 'HIGH_VOLUME'>('ALL');

  const filteredSectors = sectors.filter(sec => {
    const matchesSearch = sec.name.toLowerCase().includes(search.toLowerCase()) || 
                          sec.description.toLowerCase().includes(search.toLowerCase()) ||
                          sec.responsibleDepartment.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'URGENT') return sec.criticalComplaints > 0;
    if (filterType === 'HIGH_VOLUME') return sec.totalComplaints >= 15;
    return true;
  });

  const activeSectorModal = selectedSectorForDrilldown;
  const sectorComplaints = activeSectorModal 
    ? complaints.filter(c => c.sectorId === activeSectorModal.id)
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#43D9FF]/20 text-[#43D9FF] text-xs font-mono font-bold flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              18 CIVIC SECTORS MATRIX
            </span>
            <span className="text-xs font-mono text-slate-400">Complete Municipal Classification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sector Intelligence Center
          </h1>
          <p className="text-sm text-[#8E9EB8] max-w-2xl mt-1">
            Real-time telemetry, backlog analysis, and incident distribution across all 18 civic domains. Click any sector card to inspect field tickets.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter 18 sectors..."
              className="pl-9 pr-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] focus:border-[#43D9FF] text-xs text-white placeholder-slate-500 w-full sm:w-56"
            />
          </div>

          {/* Quick Filter */}
          <div className="flex items-center bg-[#0B1020] p-1 rounded-xl border border-[#223252] text-xs font-mono">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'ALL' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All (18)
            </button>
            <button
              onClick={() => setFilterType('URGENT')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'URGENT' ? 'bg-[#18233B] text-[#FF4D5E] font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Urgent Only
            </button>
            <button
              onClick={() => setFilterType('HIGH_VOLUME')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'HIGH_VOLUME' ? 'bg-[#18233B] text-[#43D9FF] font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Top Load
            </button>
          </div>
        </div>
      </div>

      {/* Complete 18-Sector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {filteredSectors.map((sector) => {
          const maxVal = Math.max(...sector.trend, 1);
          return (
            <div
              key={sector.id}
              onClick={() => setSelectedSectorForDrilldown(sector)}
              className="glass-panel p-5 rounded-2xl border border-[#223252] hover:border-[#43D9FF]/60 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-2xl group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent bar based on Sector's Color Identity */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: sector.color }}
              />

              <div className="space-y-4">
                
                {/* Header: Icon, Number, Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-[#0B1020] border border-[#223252] shadow-inner group-hover:scale-110 transition-transform">
                      {sector.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: sector.badgeBg, color: sector.textColor, border: `1px solid ${sector.badgeBorder}` }}
                        >
                          #{sector.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {sector.code}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#C6FF5F] transition-colors mt-0.5">
                        {sector.name}
                      </h3>
                    </div>
                  </div>

                  {/* Urgent indicator */}
                  {sector.criticalComplaints > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40 animate-pulse flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5E]" />
                      {sector.criticalComplaints} urgent
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Stable
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[#8E9EB8] line-clamp-2 leading-relaxed">
                  {sector.description}
                </p>

                {/* Metrics Stats Row */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#223252]/60 text-center">
                  <div className="p-1.5 rounded-lg bg-[#0B1020]/70">
                    <div className="text-[10px] font-mono text-[#8E9EB8]">TOTAL</div>
                    <div className="text-sm font-bold font-mono text-white">{sector.totalComplaints}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0B1020]/70">
                    <div className="text-[10px] font-mono text-[#8E9EB8]">ACTIVE</div>
                    <div className="text-sm font-bold font-mono text-[#FF9B42]">{sector.activeComplaints}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0B1020]/70">
                    <div className="text-[10px] font-mono text-[#8E9EB8]">RESOLVED</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">{sector.resolvedComplaints}</div>
                  </div>
                </div>

                {/* Mini Trend Sparkline & Resolution Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Resolution Rate</span>
                    <span className="text-[#C6FF5F] font-bold">{sector.resolutionRate}%</span>
                  </div>
                  <div className="w-full bg-[#0B1020] h-1.5 rounded-full overflow-hidden border border-[#223252]">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${sector.resolutionRate}%`, 
                        backgroundColor: sector.color 
                      }}
                    />
                  </div>
                </div>

                {/* Sparkline Visualizer */}
                <div className="pt-1 flex items-end justify-between gap-1 h-6 px-1">
                  {sector.trend.map((val, idx) => {
                    const heightPercent = Math.max(15, Math.round((val / maxVal) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-t transition-all group-hover:brightness-125"
                        style={{ 
                          height: `${heightPercent}%`, 
                          backgroundColor: sector.color,
                          opacity: 0.35 + (idx * 0.1)
                        }}
                        title={`Day ${idx + 1}: ${val} incidents`}
                      />
                    );
                  })}
                </div>

              </div>

              {/* Card Footer: Department */}
              <div className="mt-4 pt-3 border-t border-[#223252]/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 truncate max-w-[190px]">
                  {sector.responsibleDepartment.split('/')[0]}
                </span>
                <span className="text-[#43D9FF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Detail Drawer / Modal (Blueprint Section 8) */}
      {activeSectorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121A2B] border border-[#2C416A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div 
              className="p-6 border-b border-[#223252] flex items-start justify-between relative overflow-hidden"
              style={{ borderTop: `4px solid ${activeSectorModal.color}` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl p-2.5 rounded-2xl bg-[#0B1020] border border-[#223252]">
                  {activeSectorModal.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#18233B] text-slate-300 border border-[#243354]">
                      SECTOR #{activeSectorModal.id}
                    </span>
                    <span className="text-xs font-mono text-[#C6FF5F]">
                      {activeSectorModal.code}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mt-1">
                    {activeSectorModal.name}
                  </h2>
                  <p className="text-xs text-[#8E9EB8] mt-0.5">
                    {activeSectorModal.totalComplaints} total reported incidents across city wards
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSectorForDrilldown(null)}
                className="p-2 rounded-lg bg-[#0B1020] text-slate-400 hover:text-white border border-[#223252] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* 3 Metric Cards as shown in Blueprint Section 8 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0B1020] border border-[#FF4D5E]/30 text-center">
                  <div className="text-[11px] font-mono uppercase text-[#FF4D5E] font-bold">
                    CRITICAL
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-[#FF4D5E] mt-1">
                    {activeSectorModal.criticalComplaints}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Immediate dispatch</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B1020] border border-[#FF9B42]/30 text-center">
                  <div className="text-[11px] font-mono uppercase text-[#FF9B42] font-bold">
                    ACTIVE
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-white mt-1">
                    {activeSectorModal.activeComplaints}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">In progress teams</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B1020] border border-emerald-500/30 text-center">
                  <div className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
                    RESOLVED
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                    {activeSectorModal.resolvedComplaints}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {activeSectorModal.resolutionRate}% closed
                  </div>
                </div>
              </div>

              {/* Responsible Department Box */}
              <div className="p-4 rounded-xl bg-[#162035] border border-[#243354] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#43D9FF]" />
                    RESPONSIBLE DEPARTMENT
                  </span>
                  <span className="text-[#C6FF5F]">Automated Routing Active</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activeSectorModal.responsibleDepartment}
                </div>
                <p className="text-xs text-[#8E9EB8]">
                  {activeSectorModal.description}
                </p>
              </div>

              {/* Recent Sector Incidents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-slate-200">
                    Recent {activeSectorModal.name} Incidents
                  </h4>
                  <button
                    onClick={() => {
                      setFilterSector(activeSectorModal.id);
                      setSelectedSectorForDrilldown(null);
                      setActiveTab('complaints');
                    }}
                    className="text-xs font-mono text-[#C6FF5F] hover:underline"
                  >
                    View in Queue ({sectorComplaints.length}) →
                  </button>
                </div>

                {sectorComplaints.length === 0 ? (
                  <div className="text-center py-6 bg-[#0B1020] rounded-xl border border-[#223252] text-xs text-slate-400">
                    No active incidents currently queued for this sector.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sectorComplaints.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedSectorForDrilldown(null);
                          setSelectedComplaintForDetails(item);
                        }}
                        className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] hover:border-[#43D9FF] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {item.id}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-100 group-hover:text-[#C6FF5F]">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.locationName} · {item.reportedAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.severity === 'CRITICAL' ? (
                            <span className="text-[10px] font-mono font-bold text-[#FF4D5E] px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30">
                              CRITICAL
                            </span>
                          ) : item.severity === 'HIGH' ? (
                            <span className="text-[10px] font-mono font-bold text-[#FF9B42] px-2 py-0.5 rounded bg-orange-950/40 border border-orange-500/30">
                              HIGH
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-[#FFD166] px-2 py-0.5 rounded bg-yellow-950/40 border border-yellow-500/30">
                              MEDIUM
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400">
                            {item.priorityScore} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0B1020] border-t border-[#223252] flex items-center justify-between">
              <button
                onClick={() => setSelectedSectorForDrilldown(null)}
                className="px-4 py-2 rounded-xl bg-[#121A2B] text-slate-300 hover:text-white border border-[#223252] text-xs font-mono"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedSectorForDrilldown(null);
                  setActiveTab('ai-triage');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold text-xs font-mono uppercase tracking-wider"
              >
                + Report Incident for {activeSectorModal.name}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
