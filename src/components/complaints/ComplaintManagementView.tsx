import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, TicketStatus, Severity } from '../../types';
import { 
  ListFilter, 
  Search, 
  Filter, 
  Download, 
  RefreshCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';

export const ComplaintManagementView: React.FC = () => {
  const { 
    complaints, 
    sectors, 
    departments, 
    filterSector, 
    setFilterSector,
    filterSeverity, 
    setFilterSeverity,
    filterStatus, 
    setFilterStatus,
    filterWard, 
    setFilterWard,
    searchQuery, 
    setSearchQuery,
    resetAllFilters,
    updateComplaintStatus,
    setSelectedComplaintForDetails,
    setActiveTab,
    verifiedRole,
    verifiedDepartmentId,
    customClaims,
  } = useApp();

  const effectiveRole = customClaims.admin ? 'ADMIN' : customClaims.role || verifiedRole;
  const assignedDeptId = customClaims.departmentId || verifiedDepartmentId;
  const [sortField, setSortField] = useState<'priority' | 'time' | 'id'>('priority');
  const [sortAsc, setSortAsc] = useState(false);
  const [myDeptOnly, setMyDeptOnly] = useState(false);

  // Filter complaints
  const filteredComplaints = complaints.filter(comp => {
    if (myDeptOnly && assignedDeptId && comp.departmentId !== assignedDeptId) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = comp.id.toLowerCase().includes(q) ||
                    comp.title.toLowerCase().includes(q) ||
                    comp.description.toLowerCase().includes(q) ||
                    comp.sectorName.toLowerCase().includes(q) ||
                    comp.department.toLowerCase().includes(q) ||
                    comp.ward.toLowerCase().includes(q) ||
                    comp.locationName.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Sector filter
    if (filterSector !== 'ALL' && comp.sectorId !== filterSector) {
      return false;
    }

    // Severity filter
    if (filterSeverity !== 'ALL' && comp.severity !== filterSeverity) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'ALL' && comp.status !== filterStatus) {
      return false;
    }

    // Ward filter
    if (filterWard !== 'ALL' && comp.ward !== filterWard) {
      return false;
    }

    return true;
  });

  // Sort complaints
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortField === 'priority') {
      return sortAsc ? a.priorityScore - b.priorityScore : b.priorityScore - a.priorityScore;
    }
    if (sortField === 'id') {
      return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    }
    return 0;
  });

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Title', 'Sector', 'Severity', 'Priority Score', 'Department', 'Status', 'Ward', 'Location', 'Reported At'];
    const rows = sortedComplaints.map(c => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.sectorName}"`,
      c.severity,
      c.priorityScore,
      `"${c.department}"`,
      c.status,
      c.ward,
      `"${c.locationName}"`,
      c.reportedAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicLens_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = filterSector !== 'ALL' || filterSeverity !== 'ALL' || filterStatus !== 'ALL' || filterWard !== 'ALL' || searchQuery !== '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#FF9B42]/20 text-[#FF9B42] text-xs font-mono font-bold flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" />
              OPERATIONAL QUEUE
            </span>
            <span className="text-xs font-mono text-slate-400">All Municipal Incident Tickets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Complaint Management
          </h1>
          <p className="text-sm text-[#8E9EB8] max-w-2xl mt-1">
            Comprehensive triage ledger. Filter across all 18 sectors, reassign municipal departments, and adjust lifecycle states in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18233B] hover:bg-[#223252] border border-[#2C416A] text-xs font-mono text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#43D9FF]" />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-triage')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-[#C6FF5F]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>+ NEW TICKET</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar as specified in Blueprint Section 9 */}
      <div className="glass-panel p-4 rounded-2xl border border-[#223252] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by ID, title, keyword, ward..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] focus:border-[#C6FF5F] text-xs text-white placeholder-slate-500 font-sans"
            />
          </div>

          {/* Sector Filter (All 18 sectors!) */}
          <div className="md:col-span-2">
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#43D9FF] cursor-pointer"
            >
              <option value="ALL">All Sectors (18)</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id} className="bg-[#121A2B]">
                  {sec.icon} #{sec.id} {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="md:col-span-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#FF4D5E] cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL" className="bg-[#121A2B]">🔴 Critical</option>
              <option value="HIGH" className="bg-[#121A2B]">🟠 High</option>
              <option value="MEDIUM" className="bg-[#121A2B]">🟡 Medium</option>
              <option value="LOW" className="bg-[#121A2B]">🟢 Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#C6FF5F] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="New" className="bg-[#121A2B]">New</option>
              <option value="Assigned" className="bg-[#121A2B]">Assigned</option>
              <option value="In Progress" className="bg-[#121A2B]">In Progress</option>
              <option value="Resolved" className="bg-[#121A2B]">Resolved</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div className="md:col-span-2">
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#43D9FF] cursor-pointer"
            >
              <option value="ALL">All Wards</option>
              {Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`).map(w => (
                <option key={w} value={w} className="bg-[#121A2B]">{w}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filter status strip & Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8E9EB8] pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Showing <strong className="text-white">{sortedComplaints.length}</strong> of {complaints.length} complaints</span>
            {effectiveRole === 'DEPARTMENT_OFFICER' && assignedDeptId && (
              <button
                type="button"
                onClick={() => setMyDeptOnly((prev) => !prev)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all ${
                  myDeptOnly
                    ? 'bg-[#43D9FF]/20 text-[#43D9FF] border-[#43D9FF]/50 font-bold'
                    : 'bg-[#0B1020] text-slate-300 border-[#2C416A] hover:border-[#43D9FF]/40'
                }`}
              >
                {myDeptOnly ? `Showing Assigned Bureau (${assignedDeptId})` : `Filter: My Bureau Only (${assignedDeptId})`}
              </button>
            )}
            {hasActiveFilters && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#43D9FF]/20 text-[#43D9FF]">
                Active Filter
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-[#FF4D5E] hover:underline flex items-center gap-1"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table (Blueprint Section 9) */}
      <div className="glass-panel rounded-2xl border border-[#223252] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#223252] bg-[#0E1524] text-[11px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                <th className="py-3 px-4">
                  <button 
                    onClick={() => { setSortField('id'); setSortAsc(!sortAsc); }}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Complaint Title & Location</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => { setSortField('priority'); setSortAsc(!sortAsc); }}
                    className="flex items-center gap-1 hover:text-white text-[#C6FF5F]"
                  >
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Responsible Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C4A] text-xs">
              {sortedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-mono text-sm">No complaints found matching current filters.</p>
                    <button
                      onClick={resetAllFilters}
                      className="mt-2 text-xs text-[#C6FF5F] hover:underline"
                    >
                      Clear active filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedComplaints.map((c) => (
                  <tr 
                    key={c.id}
                    className="hover:bg-[#16223B]/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedComplaintForDetails(c)}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#43D9FF]">
                      {c.id}
                    </td>

                    {/* Complaint & Location */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-white group-hover:text-[#C6FF5F] transition-colors truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-[#8E9EB8] truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-300 font-semibold">{c.ward}</span>
                        <span>·</span>
                        <span>{c.locationName}</span>
                        <span>·</span>
                        <span className="text-slate-500">{c.reportedAt}</span>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{c.sectorIcon}</span>
                        <span className="text-slate-200 font-medium">
                          {c.sectorName}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.severity === 'CRITICAL' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5E] animate-ping" />
                          🔴 Critical
                        </span>
                      )}
                      {c.severity === 'HIGH' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF9B42]/20 text-[#FF9B42] border border-[#FF9B42]/40 w-fit">
                          🟠 High
                        </span>
                      )}
                      {c.severity === 'MEDIUM' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/40 w-fit">
                          🟡 Medium
                        </span>
                      )}
                      {c.severity === 'LOW' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#47D18C]/20 text-[#47D18C] border border-[#47D18C]/40 w-fit">
                          🟢 Low
                        </span>
                      )}
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <span className={`text-sm ${
                        c.priorityScore >= 90 ? 'text-[#FF4D5E]' : 
                        c.priorityScore >= 75 ? 'text-[#FF9B42]' : 'text-[#C6FF5F]'
                      }`}>
                        {c.priorityScore}
                      </span>
                      <span className="text-[10px] text-slate-500">/100</span>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-[#8E9EB8] max-w-[200px] truncate">
                      {c.department}
                    </td>

                    {/* Status Dropdown (editable only for Admin or assigned Department Officer) */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {(effectiveRole === 'ADMIN' ||
                        (effectiveRole === 'DEPARTMENT_OFFICER' &&
                          assignedDeptId &&
                          c.departmentId === assignedDeptId)) ? (
                        <select
                          value={c.status}
                          onChange={(e) => updateComplaintStatus(c.id, e.target.value as TicketStatus)}
                          className={`text-[11px] font-mono font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            c.status === 'Resolved' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
                            c.status === 'In Progress'
                              ? 'bg-orange-950/40 text-[#FF9B42] border-orange-500/30' :
                            c.status === 'Assigned'
                              ? 'bg-blue-950/40 text-[#43D9FF] border-blue-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="New" className="bg-[#121A2B]">New</option>
                          <option value="Assigned" className="bg-[#121A2B]">Assigned</option>
                          <option value="In Progress" className="bg-[#121A2B]">In Progress</option>
                          <option value="Resolved" className="bg-[#121A2B]">Resolved</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-[11px] font-mono font-semibold px-2 py-1 rounded-lg border ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
                            c.status === 'In Progress'
                              ? 'bg-orange-950/40 text-[#FF9B42] border-orange-500/30' :
                            c.status === 'Assigned'
                              ? 'bg-blue-950/40 text-[#43D9FF] border-blue-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedComplaintForDetails(c)}
                        className="px-2.5 py-1 rounded-lg bg-[#18233B] hover:bg-[#223252] border border-[#2C416A] text-slate-300 hover:text-[#C6FF5F] text-xs font-mono transition-colors"
                      >
                        Details →
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
