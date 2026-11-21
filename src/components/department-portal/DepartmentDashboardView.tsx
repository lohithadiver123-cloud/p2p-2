import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketStatus } from '../../types';
import { DEPARTMENTS } from '../../data/departments';
import { 
  Building2, 
  Users, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  Flame, 
  Navigation, 
  Sparkles, 
  Check, 
  Filter, 
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
  PhoneCall
} from 'lucide-react';

export const DepartmentDashboardView: React.FC = () => {
  const { 
    currentUser, 
    verifiedRole,
    verifiedDepartmentId,
    customClaims,
    complaints, 
    departments, 
    updateComplaintStatus, 
    setSelectedComplaintForDetails,
    switchDepartment,
    setActiveTab
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [selectedCrew, setSelectedCrew] = useState<{ [ticketId: string]: string }>({});
  const [resolutionNotes, setResolutionNotes] = useState<{ [ticketId: string]: string }>({});

  const isAdminUser = verifiedRole === 'ADMIN';
  const lockedDeptId = !isAdminUser
    ? customClaims.departmentId || verifiedDepartmentId || currentUser.departmentId
    : currentUser.departmentId;

  // Current active department (strictly locked to assigned department for DEPARTMENT_OFFICER)
  const currentDept = departments.find(d => d.id === lockedDeptId) || 
                      departments.find(d => d.id === 'dept-trees') || 
                      departments[0];

  // Filter complaints strictly belonging to this department
  const deptComplaints = complaints.filter(c => currentDept.sectorIds.includes(c.sectorId));

  const filteredTickets = deptComplaints.filter(c => {
    if (activeFilter === 'NEW') return c.status === 'New';
    if (activeFilter === 'IN_PROGRESS') return c.status === 'Assigned' || c.status === 'In Progress';
    if (activeFilter === 'RESOLVED') return c.status === 'Resolved';
    return true;
  });

  const criticalCount = deptComplaints.filter(c => c.severity === 'CRITICAL' && c.status !== 'Resolved').length;
  const inProgressCount = deptComplaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolvedCount = deptComplaints.filter(c => c.status === 'Resolved').length;

  const handleDispatch = (ticketId: string) => {
    updateComplaintStatus(ticketId, 'In Progress');
  };

  const handleResolve = (ticketId: string) => {
    updateComplaintStatus(ticketId, 'Resolved');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Department Portal Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141E34] via-[#162746] to-[#121A2B] border border-[#2C416A] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1020] border border-[#2C416A] flex items-center justify-center text-[#43D9FF] text-2xl shadow-inner">
              <Building2 className="w-7 h-7 text-[#43D9FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#43D9FF]/20 text-[#43D9FF] border border-[#43D9FF]/40">
                  DEPARTMENT OFFICER PORTAL
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-[#C6FF5F] border border-[#C6FF5F]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF5F] animate-ping" />
                  DISPATCH ACTIVE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                {currentDept.name}
              </h1>
              <p className="text-xs text-[#8E9EB8] mt-0.5">
                Officer Desk: <strong className="text-slate-200">{currentUser.name}</strong> · Tel: {currentDept.phone}
              </p>
            </div>
          </div>

          {/* Department Switcher Dropdown (Admins only) or Locked Bureau Badge */}
          {isAdminUser ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Preview Department:</span>
              <select
                value={currentDept.id}
                onChange={(e) => switchDepartment(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0B1020] border border-[#2C416A] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#C6FF5F] cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-[#121A2B]">
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-[#0B1020] border border-[#43D9FF]/40 text-xs font-mono text-[#43D9FF]">
              Assigned Scope: {currentDept.id}
            </div>
          )}
        </div>

        {/* Department Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-[#223252]">
            <div className="text-[10px] font-mono uppercase text-[#8E9EB8]">ROUTED TO US</div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">
              {deptComplaints.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">AI Automatic Allocation</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-[#FF4D5E]/40">
            <div className="text-[10px] font-mono uppercase text-[#FF4D5E] font-bold">🔴 CRITICAL SLA</div>
            <div className="text-2xl font-extrabold font-mono text-[#FF4D5E] mt-1">
              {criticalCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Needs immediate action</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-[#FF9B42]/40">
            <div className="text-[10px] font-mono uppercase text-[#FF9B42] font-bold">ACTIVE FIELD CREWS</div>
            <div className="text-2xl font-extrabold font-mono text-[#FF9B42] mt-1">
              {inProgressCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{currentDept.activeTeams} teams on standby</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020]/80 border border-emerald-500/40">
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">RESOLVED TODAY</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {resolvedCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{currentDept.slaCompliance}% SLA target</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Department Ticket Inbox & Field Crew Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Department Tickets (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter Bar */}
          <div className="glass-panel p-3 rounded-xl border border-[#223252] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All Tickets ({deptComplaints.length})
              </button>
              <button
                onClick={() => setActiveFilter('NEW')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'NEW' ? 'bg-[#18233B] text-[#FF4D5E] font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                New / Unassigned ({deptComplaints.filter(c => c.status === 'New').length})
              </button>
              <button
                onClick={() => setActiveFilter('IN_PROGRESS')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'IN_PROGRESS' ? 'bg-[#18233B] text-[#FF9B42] font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setActiveFilter('RESOLVED')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'RESOLVED' ? 'bg-[#18233B] text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>

            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              Sorted by Urgency
            </span>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center glass-panel rounded-2xl border border-[#223252] space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Department Queue Clear</h3>
                <p className="text-xs text-[#8E9EB8]">
                  No active incidents currently assigned to {currentDept.name} matching this filter.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass-panel p-5 rounded-2xl border border-[#223252] hover:border-[#43D9FF]/50 transition-all space-y-4"
                >
                  {/* Top Bar of card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{ticket.sectorIcon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#43D9FF]">
                            {ticket.id}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-xs font-mono font-bold text-[#C6FF5F]">
                            {ticket.ward}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ticket.reportedAt}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                          {ticket.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {ticket.severity === 'CRITICAL' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5E] animate-ping" />
                          🔴 CRITICAL (Score: {ticket.priorityScore})
                        </span>
                      ) : ticket.severity === 'HIGH' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF9B42]/20 text-[#FF9B42] border border-[#FF9B42]/40">
                          🟠 HIGH (Score: {ticket.priorityScore})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/40">
                          🟡 MEDIUM (Score: {ticket.priorityScore})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Citizen Description */}
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200">
                    <p className="italic">"{ticket.description}"</p>
                    <div className="text-[11px] text-[#8E9EB8] mt-1.5 flex items-center justify-between">
                      <span>Location: {ticket.locationName}</span>
                      <span>Target SLA: {ticket.slaHours}h</span>
                    </div>
                  </div>

                  {/* Optional Photo */}
                  {ticket.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-[#223252] h-36 bg-[#0B1020]">
                      <img
                        src={ticket.imageUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* AI Recommended Directive */}
                  <div className="p-3 rounded-xl bg-[#122421]/60 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                    <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C6FF5F]" />
                      <span>AI Triage Operational Directive</span>
                    </div>
                    <p>{ticket.recommendedAction}</p>
                  </div>

                  {/* Department Action Controls */}
                  <div className="pt-2 border-t border-[#223252] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Assigned Crew info */}
                    <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#43D9FF]" />
                      <span>Assigned:</span>
                      <span className="font-bold text-white">
                        {ticket.assignedTeam || `${currentDept.name.split(' ')[0]} Response Crew 1`}
                      </span>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-2">
                      {ticket.status === 'New' && (
                        <button
                          onClick={() => handleDispatch(ticket.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#43D9FF] to-[#2563EB] text-white font-mono font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Crew</span>
                        </button>
                      )}

                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-mono font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center gap-1.5 shadow-lg shadow-[#C6FF5F]/20"
                        >
                          <Check className="w-4 h-4 text-[#0B1020]" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {ticket.status === 'Resolved' && (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved & Closed
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedComplaintForDetails(ticket)}
                        className="px-3 py-2 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-slate-300 text-xs font-mono"
                      >
                        Inspect Dossier →
                      </button>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Column: Field Crew Dispatch Board (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="glass-panel p-5 rounded-2xl border border-[#223252] space-y-4">
            <div className="flex items-center justify-between border-b border-[#223252] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C6FF5F]" />
                <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                  Field Units Radar
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                {currentDept.activeTeams} Teams Live
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: `${currentDept.name.split(' ')[0]} Rapid Unit 1`, status: 'ON SCENE', loc: 'Ward 8 Junction', lead: 'Foreman R. Patel' },
                { name: `${currentDept.name.split(' ')[0]} Strike Unit 2`, status: 'EN ROUTE', loc: 'Ward 12 Corridor', lead: 'Officer K. Das' },
                { name: `${currentDept.name.split(' ')[0]} Heavy Squad 3`, status: 'STANDBY', loc: 'Central Depot', lead: 'Tech S. Gowda' },
              ].map((crew, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{crew.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      crew.status === 'ON SCENE' ? 'bg-orange-500/20 text-[#FF9B42]' :
                      crew.status === 'EN ROUTE' ? 'bg-blue-500/20 text-[#43D9FF]' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {crew.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8E9EB8] flex items-center justify-between">
                    <span>Lead: {crew.lead}</span>
                    <span>📍 {crew.loc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#162035] border border-[#243354] space-y-2 text-xs">
              <div className="font-mono text-[10px] uppercase text-[#8E9EB8]">Department Hotline</div>
              <div className="flex items-center gap-2 text-white font-mono font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-[#C6FF5F]" />
                <span>{currentDept.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick link to Command Center (Admin only) */}
          {isAdminUser && (
            <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2">
              <div className="text-xs font-semibold text-slate-200">Municipal Command Center</div>
              <p className="text-[11px] text-[#8E9EB8]">
                Switch back to the City Operations Command Center for cross-department monitoring.
              </p>
              <button
                onClick={() => setActiveTab('command-center')}
                className="w-full py-2 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-[#C6FF5F] text-center"
              >
                Back to Command Center →
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
