import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  Flame, 
  TrendingUp, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Sparkles,
  ShieldAlert,
  Radio,
  ExternalLink
} from 'lucide-react';

export const CommandCenterView: React.FC = () => {
  const { 
    complaints, 
    sectors, 
    stats, 
    setActiveTab, 
    setSelectedComplaintForDetails,
    setSelectedSectorForDrilldown 
  } = useApp();

  // Sort complaints by priority score descending for AI Priority Queue
  const priorityQueue = [...complaints]
    .filter(c => c.status !== 'Resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  const criticalCount = stats.criticalCount;
  const inProgressCount = stats.inProgressCount;
  const resolvedCount = stats.resolvedCount;
  const totalReports = stats.totalReports;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#223252]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest text-[#C6FF5F] font-bold uppercase">
              CIVICLENS AI CIVIC INTELLIGENCE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-[#C6FF5F] border border-[#C6FF5F]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF5F] animate-ping" />
              LIVE SYSTEM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            City Operations Command Center
          </h1>
          <p className="text-sm text-[#8E9EB8] mt-0.5">
            Monitoring citizen reports, automated AI dispatch, and tactical operations across all 18 civic sectors.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('ai-triage')}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C6FF5F]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#0B1020]" />
          <span>+ REPORT INCIDENT</span>
        </button>
      </div>

      {/* 2. Top Metrics Grid (4 Cards from Blueprint) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL REPORTS */}
        <div className="glass-card p-5 rounded-2xl border border-[#223252] hover:border-[#2C416A] transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E9EB8] uppercase tracking-wider">
            <span>TOTAL REPORTS</span>
            <span className="p-1.5 rounded-lg bg-[#18233B] text-slate-300">
              <Layers className="w-4 h-4 text-[#43D9FF]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {totalReports + 230}
            </span>
            <span className="text-xs font-mono font-semibold text-[#47D18C] flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +18 today
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8E9EB8] flex items-center justify-between">
            <span>Aggregated 18 sectors</span>
            <span className="font-mono text-[11px] text-[#43D9FF]">Real-time ingest</span>
          </div>
        </div>

        {/* CRITICAL */}
        <div className="glass-card p-5 rounded-2xl border border-[#FF4D5E]/30 hover:border-[#FF4D5E]/60 transition-all relative overflow-hidden group bg-gradient-to-br from-[#1A121D] to-[#121A2B]">
          <div className="flex items-center justify-between text-xs font-mono text-[#FF4D5E] uppercase tracking-wider font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF4D5E] animate-ping" />
              CRITICAL
            </span>
            <span className="p-1.5 rounded-lg bg-[#FF4D5E]/10 text-[#FF4D5E]">
              <Flame className="w-4 h-4 text-[#FF4D5E]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#FF4D5E]">
              {criticalCount}
            </span>
            <span className="text-xs font-mono font-semibold text-[#FF4D5E]">
              Needs action
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8E9EB8] flex items-center justify-between">
            <span>SLA breach window &lt; 2h</span>
            <button 
              onClick={() => setActiveTab('complaints')}
              className="text-[11px] text-[#FF4D5E] hover:underline font-mono"
            >
              Triage now →
            </button>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="glass-card p-5 rounded-2xl border border-[#FF9B42]/30 hover:border-[#FF9B42]/60 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-[#FF9B42] uppercase tracking-wider">
            <span>IN PROGRESS</span>
            <span className="p-1.5 rounded-lg bg-[#FF9B42]/10 text-[#FF9B42]">
              <Activity className="w-4 h-4 text-[#FF9B42]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {inProgressCount + 50}
            </span>
            <span className="text-xs font-mono font-semibold text-[#FF9B42]">
              Active teams
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8E9EB8] flex items-center justify-between">
            <span>Dispatched on ground</span>
            <span className="font-mono text-[11px] text-slate-300">14 Depts</span>
          </div>
        </div>

        {/* RESOLVED */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 uppercase tracking-wider">
            <span>RESOLVED</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {resolvedCount + 155}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              69.3% rate
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8E9EB8] flex items-center justify-between">
            <span>Avg time 3.4 hours</span>
            <span className="font-mono text-[11px] text-[#C6FF5F]">High SLA</span>
          </div>
        </div>

      </div>

      {/* 3. Main Dashboard Layout (Left: AI Priority Queue, Right: City Map Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: AI PRIORITY QUEUE (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D5E] animate-ping" />
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <span>AI PRIORITY QUEUE</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-Ranked by Threat & SLA</span>
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('complaints')}
              className="text-xs font-mono text-[#C6FF5F] hover:underline flex items-center gap-1 group"
            >
              <span>VIEW ALL</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {priorityQueue.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedComplaintForDetails(item)}
                className="glass-panel p-4 rounded-xl border border-[#223252] hover:border-[#43D9FF]/50 transition-all cursor-pointer group hover:bg-[#152037]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-0.5">{item.sectorIcon}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.severity === 'CRITICAL' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40">
                            🔴 CRITICAL
                          </span>
                        ) : item.severity === 'HIGH' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF9B42]/20 text-[#FF9B42] border border-[#FF9B42]/40">
                            🟠 HIGH
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/40">
                            🟡 MEDIUM
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          {item.id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {item.sectorName}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-mono text-slate-300 font-semibold">
                          {item.ward}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#C6FF5F] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {item.locationName}
                      </p>
                    </div>
                  </div>

                  {/* Priority Score badge */}
                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-lg bg-[#0B1020] border border-[#243354] group-hover:border-[#C6FF5F]/50 transition-colors">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Score
                      </div>
                      <div className="text-base font-extrabold font-mono text-[#C6FF5F]">
                        {item.priorityScore}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      {item.reportedAt}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#223252]/60 flex items-center justify-between text-xs">
                  <span className="text-[#8E9EB8] text-[11px] truncate max-w-sm">
                    Dept: <span className="text-slate-200">{item.department}</span>
                  </span>
                  <span className="text-[#43D9FF] text-[11px] font-mono flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Inspect ticket <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('complaints')}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#243354] hover:border-[#43D9FF] text-xs font-mono text-slate-400 hover:text-white transition-all text-center"
          >
            Show full queue ({complaints.length} tickets) →
          </button>
        </div>

        {/* Right: City Incident Map Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#43D9FF]" />
              <span>City Incident Map</span>
            </h2>
            <button
              onClick={() => setActiveTab('map')}
              className="text-xs font-mono text-[#43D9FF] hover:underline flex items-center gap-1 group"
            >
              <span>FULL SCREEN MAP</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div 
            onClick={() => setActiveTab('map')}
            className="glass-panel p-4 rounded-2xl border border-[#223252] hover:border-[#2C416A] transition-all cursor-pointer relative overflow-hidden group space-y-3"
          >
            {/* Interactive Visual Map Representation */}
            <div className="h-64 rounded-xl bg-[#090D1A] border border-[#1E2C4A] relative overflow-hidden flex items-center justify-center">
              
              {/* Radar Grid Graphic */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#43D9FF_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Concentric rings */}
              <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20 animate-ping opacity-25" />
              <div className="absolute w-72 h-72 rounded-full border border-slate-700/30" />
              <div className="absolute w-96 h-96 rounded-full border border-slate-800/40" />

              {/* Sample Floating Glowing Pins */}
              {priorityQueue.map((item, idx) => {
                const offsets = [
                  { top: '25%', left: '30%' },
                  { top: '38%', left: '72%' },
                  { top: '65%', left: '42%' },
                  { top: '78%', left: '20%' },
                  { top: '50%', left: '55%' },
                ];
                const pos = offsets[idx % offsets.length];
                const isCrit = item.severity === 'CRITICAL';

                return (
                  <div
                    key={item.id}
                    className="absolute flex items-center gap-1.5 transition-transform hover:scale-125 z-10"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg ${
                      isCrit 
                        ? 'bg-[#FF4D5E] text-white animate-bounce' 
                        : 'bg-[#FF9B42] text-black'
                    }`}>
                      !
                    </div>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#121A2B]/90 border border-[#243354] text-slate-200">
                      {item.ward}
                    </span>
                  </div>
                );
              })}

              {/* Center Map Overlay Button */}
              <div className="relative z-20 text-center space-y-2 pointer-events-none">
                <div className="px-3.5 py-1.5 rounded-full bg-[#121A2B]/95 border border-[#43D9FF]/40 text-xs font-mono text-[#43D9FF] flex items-center gap-2 shadow-2xl backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-[#C6FF5F]" />
                  <span>Interactive Map Live ({complaints.length} active pins)</span>
                </div>
              </div>
            </div>

            {/* Severity Legend */}
            <div className="flex items-center justify-between text-[11px] font-mono px-2 text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF4D5E]" /> Critical ({stats.criticalCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF9B42]" /> High ({stats.highCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FFD166]" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#47D18C]" /> Resolved
              </span>
            </div>

          </div>

          {/* Quick Department Activity Mini Strip */}
          <div className="glass-panel p-4 rounded-2xl border border-[#223252] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-300">
              <span>Department Quick Status</span>
              <button 
                onClick={() => setActiveTab('departments')}
                className="text-[#C6FF5F] hover:underline"
              >
                All Departments →
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 truncate">Roads & Public Works</div>
                  <div className="font-bold text-white font-mono">14 Teams Active</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 truncate">Water Department</div>
                  <div className="font-bold text-[#FF9B42] font-mono">High Load (12)</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#FF9B42] animate-pulse" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Bottom Section: 18-Sector Live Matrix Ticker */}
      <div className="glass-panel p-5 rounded-2xl border border-[#223252] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C6FF5F]" />
              <span>18-Sector Intelligence Matrix</span>
            </h2>
            <p className="text-xs text-[#8E9EB8]">
              Instant access to all 18 civic classifications. Click any sector for deep analytics.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('sectors')}
            className="text-xs font-mono text-[#C6FF5F] hover:underline flex items-center gap-1"
          >
            <span>EXPLORE ALL 18 SECTORS</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sectors.slice(0, 6).map((sec) => (
            <div
              key={sec.id}
              onClick={() => {
                setSelectedSectorForDrilldown(sec);
                setActiveTab('sectors');
              }}
              className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] hover:border-[#43D9FF] cursor-pointer transition-all hover:scale-[1.02] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{sec.icon}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  #{sec.id}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">
                {sec.name}
              </h4>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">{sec.totalComplaints} reports</span>
                {sec.criticalComplaints > 0 ? (
                  <span className="text-[#FF4D5E] font-bold">● {sec.criticalComplaints}</span>
                ) : (
                  <span className="text-emerald-400">✓ clear</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
