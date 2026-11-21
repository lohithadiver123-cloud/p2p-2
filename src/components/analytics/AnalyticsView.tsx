import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Award, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building2, 
  MapPin,
  Flame,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { sectors, complaints, departments, stats, setSelectedSectorForDrilldown, setActiveTab } = useApp();
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  // Sector distribution sorted by complaints
  const sortedSectors = [...sectors].sort((a, b) => b.totalComplaints - a.totalComplaints);
  const maxSectorComplaints = Math.max(...sectors.map(s => s.totalComplaints), 1);

  // Severity counts
  const criticalCount = complaints.filter(c => c.severity === 'CRITICAL').length;
  const highCount = complaints.filter(c => c.severity === 'HIGH').length;
  const mediumCount = complaints.filter(c => c.severity === 'MEDIUM').length;
  const lowCount = complaints.filter(c => c.severity === 'LOW').length;
  const totalCount = complaints.length || 1;

  // Ward counts
  const wardMap: { [key: string]: { total: number; critical: number } } = {};
  complaints.forEach(c => {
    if (!wardMap[c.ward]) {
      wardMap[c.ward] = { total: 0, critical: 0 };
    }
    wardMap[c.ward].total++;
    if (c.severity === 'CRITICAL') wardMap[c.ward].critical++;
  });

  const sortedWards = Object.entries(wardMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#C6FF5F]/20 text-[#C6FF5F] text-xs font-mono font-bold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              INTELLIGENCE ANALYTICS
            </span>
            <span className="text-xs font-mono text-slate-400">Tactical Insights Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-sm text-[#8E9EB8] max-w-2xl mt-1">
            Aggregated cross-sector velocity, municipal department response SLAs, and geospatial vulnerability telemetry.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-[#0B1020] p-1 rounded-xl border border-[#223252] text-xs font-mono">
          <button
            onClick={() => setActiveTimeframe('7d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTimeframe === '7d' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setActiveTimeframe('30d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTimeframe === '30d' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Past 30 Days
          </button>
          <button
            onClick={() => setActiveTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTimeframe === 'all' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Top 3 High-Impact KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-[#223252] space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase">Avg Response Time</div>
          <div className="text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
            <span>2.8 hrs</span>
            <span className="text-xs font-semibold text-[#47D18C] font-mono">-18% vs last week</span>
          </div>
          <p className="text-xs text-[#8E9EB8]">Fastest response in Electrical & Fire Services</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#223252] space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase">City Resolution Rate</div>
          <div className="text-3xl font-extrabold font-mono text-[#C6FF5F] flex items-baseline gap-2">
            <span>{stats.resolutionRate}%</span>
            <span className="text-xs font-semibold text-[#47D18C] font-mono">Target: 70%</span>
          </div>
          <p className="text-xs text-[#8E9EB8]">172 total issues closed across 18 sectors</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#223252] space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase">AI Classification Accuracy</div>
          <div className="text-3xl font-extrabold font-mono text-[#43D9FF] flex items-baseline gap-2">
            <span>97.4%</span>
            <span className="text-xs font-semibold text-cyan-400 font-mono">1.2s inference</span>
          </div>
          <p className="text-xs text-[#8E9EB8]">Evaluated against manual supervisor audits</p>
        </div>
      </div>

      {/* Grid: Sector Distribution (Left) & Severity / Ward (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Complaints by 18 Civic Sectors (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-[#223252] space-y-5">
          <div className="flex items-center justify-between border-b border-[#223252] pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <span>Complaints by Sector</span>
                <span className="text-xs font-mono text-[#C6FF5F]">(All 18 Sectors)</span>
              </h2>
              <p className="text-xs text-[#8E9EB8]">
                Normalized incident count across municipal classifications
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total: {stats.totalReports}</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {sortedSectors.map((sec) => {
              const widthPct = Math.max(8, Math.round((sec.totalComplaints / maxSectorComplaints) * 100));
              return (
                <div 
                  key={sec.id}
                  onClick={() => {
                    setSelectedSectorForDrilldown(sec);
                    setActiveTab('sectors');
                  }}
                  className="space-y-1 group cursor-pointer hover:bg-[#16223B]/40 p-1.5 rounded-lg transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{sec.icon}</span>
                      <span className="font-semibold text-white group-hover:text-[#C6FF5F] transition-colors truncate">
                        {sec.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        #{sec.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                      <span className="text-slate-300 font-bold">{sec.totalComplaints}</span>
                      {sec.criticalComplaints > 0 && (
                        <span className="text-[10px] text-[#FF4D5E] font-bold">
                          ({sec.criticalComplaints} crit)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden border border-[#223252]">
                    <div 
                      className="h-full rounded-full transition-all duration-700 group-hover:brightness-125"
                      style={{ 
                        width: `${widthPct}%`,
                        backgroundColor: sec.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Severity Breakdown & Ward Intelligence (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Severity Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#FF4D5E]" />
              <span>Severity Distribution</span>
            </h2>

            {/* Severity Stacked Visual Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#0B1020] border border-[#223252]">
              <div 
                style={{ width: `${(criticalCount / totalCount) * 100}%` }} 
                className="bg-[#FF4D5E] h-full" 
                title={`Critical: ${criticalCount}`}
              />
              <div 
                style={{ width: `${(highCount / totalCount) * 100}%` }} 
                className="bg-[#FF9B42] h-full" 
                title={`High: ${highCount}`}
              />
              <div 
                style={{ width: `${(mediumCount / totalCount) * 100}%` }} 
                className="bg-[#FFD166] h-full" 
                title={`Medium: ${mediumCount}`}
              />
              <div 
                style={{ width: `${(lowCount / totalCount) * 100}%` }} 
                className="bg-[#47D18C] h-full" 
                title={`Low: ${lowCount}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0B1020] border border-[#FF4D5E]/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#FF4D5E] font-bold">🔴 CRITICAL</div>
                  <div className="text-xl font-mono font-bold text-white">{criticalCount}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {Math.round((criticalCount / totalCount) * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1020] border border-[#FF9B42]/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#FF9B42] font-bold">🟠 HIGH</div>
                  <div className="text-xl font-mono font-bold text-white">{highCount}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {Math.round((highCount / totalCount) * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1020] border border-[#FFD166]/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#FFD166] font-bold">🟡 MEDIUM</div>
                  <div className="text-xl font-mono font-bold text-white">{mediumCount}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {Math.round((mediumCount / totalCount) * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1020] border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">🟢 LOW</div>
                  <div className="text-xl font-mono font-bold text-white">{lowCount}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {Math.round((lowCount / totalCount) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Ward Intelligence: Most Vulnerable Municipal Wards */}
          <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#43D9FF]" />
                <span>Ward Vulnerability Intelligence</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Top Hotspots</span>
            </div>

            <div className="space-y-2.5">
              {sortedWards.map(([wardName, data], idx) => (
                <div 
                  key={wardName}
                  className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#18233B] flex items-center justify-center font-mono text-[10px] font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{wardName}</div>
                      <div className="text-[10px] text-[#8E9EB8]">
                        Urban Density Zone
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-slate-200 font-bold">
                      {data.total} incidents
                    </div>
                    {data.critical > 0 ? (
                      <span className="text-[10px] text-[#FF4D5E] font-bold">
                        {data.critical} critical
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400">
                        Under control
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Department Performance Matrix (Blueprint Section 11) */}
      <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
        <div className="flex items-center justify-between border-b border-[#223252] pb-3">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#C6FF5F]" />
              <span>Department Performance & Response SLA</span>
            </h2>
            <p className="text-xs text-[#8E9EB8]">
              Automated routing efficiency, active personnel count, and SLA adherence across municipal agencies.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('departments')}
            className="text-xs font-mono text-[#C6FF5F] hover:underline"
          >
            Manage Departments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.slice(0, 6).map((dept) => (
            <div 
              key={dept.id}
              className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[210px]">
                    {dept.name}
                  </h4>
                  <div className="text-[11px] text-[#8E9EB8]">Head: {dept.head}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  dept.status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  dept.status === 'HIGH_LOAD' ? 'bg-orange-500/10 text-[#FF9B42] border border-orange-500/20' :
                  'bg-red-500/10 text-[#FF4D5E] border border-red-500/20'
                }`}>
                  {dept.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-[#223252]/60 text-center text-xs font-mono">
                <div>
                  <div className="text-[9px] text-[#8E9EB8]">TEAMS</div>
                  <div className="font-bold text-white">{dept.activeTeams}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8E9EB8]">AVG SLA</div>
                  <div className="font-bold text-[#43D9FF]">{dept.avgResolutionHours}h</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8E9EB8]">SLA COMPL.</div>
                  <div className="font-bold text-[#C6FF5F]">{dept.slaCompliance}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
