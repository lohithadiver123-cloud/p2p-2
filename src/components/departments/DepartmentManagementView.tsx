import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CIVIC_SECTORS } from '../../data/sectors';
import { ManagedUserRecord, UserRole } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../utils/firestorePayloads';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Building2, 
  Search, 
  Phone, 
  Mail, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  UserCheck
} from 'lucide-react';

export const DepartmentManagementView: React.FC = () => {
  const {
    departments,
    sectors,
    complaints,
    setActiveTab,
    setFilterSector,
    currentUser,
    verifiedRole,
    updateUserRoleAndDepartment,
  } = useApp();
  const [search, setSearch] = useState('');
  const [managedUsers, setManagedUsers] = useState<ManagedUserRecord[]>([]);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [roleEdits, setRoleEdits] = useState<Record<string, { role: UserRole; departmentId: string }>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isBootstrappedAdmin =
    currentUser.isAuthenticated &&
    currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isBootstrappedAdmin) return;

    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: ManagedUserRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: (d.uid as string) || docSnap.id,
            displayName: (d.displayName as string) || 'CivicLens User',
            role: (d.role as UserRole) || 'CITIZEN',
            departmentId: d.departmentId as string | undefined,
            departmentName: d.departmentName as string | undefined,
            ward: d.ward as string | undefined,
          };
        });
        setManagedUsers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    return () => unsub();
  }, [isBootstrappedAdmin]);

  const handleSaveUserAssignment = async (u: ManagedUserRecord) => {
    const edit = roleEdits[u.uid] || {
      role: u.role,
      departmentId: u.departmentId || departments[0]?.id || 'dept-roads',
    };
    setSavingUid(u.uid);
    setStatusMessage(null);
    try {
      await updateUserRoleAndDepartment(
        u.uid,
        edit.role,
        edit.role === 'DEPARTMENT_OFFICER' ? edit.departmentId : undefined
      );
      setStatusMessage(`Updated ${u.displayName} to ${edit.role}${edit.role === 'DEPARTMENT_OFFICER' ? ` (${edit.departmentId})` : ''}.`);
    } finally {
      setSavingUid(null);
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.head.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#43D9FF]/20 text-[#43D9FF] text-xs font-mono font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              MUNICIPAL ROUTING ENGINE
            </span>
            <span className="text-xs font-mono text-slate-400">Section 12 Blueprint Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Department Management & Routing
          </h1>
          <p className="text-sm text-[#8E9EB8] max-w-2xl mt-1">
            All 18 civic sectors are directly wired to municipal departmental desks with automated SLA escalation.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments or officers..."
            className="pl-9 pr-3 py-2 rounded-xl bg-[#0B1020] border border-[#223252] text-xs text-white placeholder-slate-500 w-64"
          />
        </div>
      </div>

      {/* Admin Role & Department Officer Assignment Panel */}
      {verifiedRole === 'ADMIN' && (
        <div className="glass-panel p-6 rounded-2xl border border-[#C6FF5F]/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#223252] pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C6FF5F]" />
                <span>Department Officer Role & Bureau Assignment</span>
              </h2>
              <p className="text-xs text-[#8E9EB8] mt-0.5">
                Assign signed-in Google users to a municipal bureau so ProtectedRoute locks them to their department.
              </p>
            </div>
            {statusMessage && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-[#C6FF5F] border border-[#C6FF5F]/30">
                {statusMessage}
              </span>
            )}
          </div>

          {!isBootstrappedAdmin ? (
            <div className="text-xs text-[#8E9EB8] font-mono">
              User directory listing is restricted to the primary bootstrapped City Admin account.
            </div>
          ) : managedUsers.length === 0 ? (
            <div className="text-xs text-[#8E9EB8] font-mono">
              No signed-in user profiles found in Firestore yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#223252] text-[11px] font-mono uppercase text-[#8E9EB8] bg-[#0E1524]">
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Current Role</th>
                    <th className="py-2.5 px-3">Assign Role</th>
                    <th className="py-2.5 px-3">Assign Department Bureau</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2C4A]">
                  {managedUsers.map((u) => {
                    const edit = roleEdits[u.uid] || {
                      role: u.role,
                      departmentId: u.departmentId || departments[0]?.id || 'dept-roads',
                    };
                    return (
                      <tr key={u.uid} className="hover:bg-[#16223B]/50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{u.displayName}</div>
                          <div className="text-[10px] font-mono text-[#8E9EB8]">{u.uid}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#0B1020] border border-[#2C416A] text-[10px] text-[#43D9FF]">
                            {u.role}
                            {u.departmentId ? ` · ${u.departmentId}` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={edit.role}
                            onChange={(e) =>
                              setRoleEdits((prev) => ({
                                ...prev,
                                [u.uid]: {
                                  ...edit,
                                  role: e.target.value as UserRole,
                                },
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#0B1020] border border-[#223252] text-xs font-mono text-white"
                          >
                            <option value="CITIZEN">CITIZEN</option>
                            <option value="DEPARTMENT_OFFICER">DEPARTMENT_OFFICER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={edit.departmentId}
                            disabled={edit.role !== 'DEPARTMENT_OFFICER'}
                            onChange={(e) =>
                              setRoleEdits((prev) => ({
                                ...prev,
                                [u.uid]: {
                                  ...edit,
                                  departmentId: e.target.value,
                                },
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#0B1020] border border-[#223252] text-xs font-mono text-white disabled:opacity-40"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            disabled={savingUid === u.uid}
                            onClick={() => void handleSaveUserAssignment(u)}
                            className="px-3 py-1.5 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#C6FF5F]/40 text-[11px] font-mono text-[#C6FF5F] disabled:opacity-50"
                          >
                            {savingUid === u.uid ? 'Saving...' : 'Save Assignment'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 18-Sector Department Routing Matrix (Blueprint Section 12) */}
      <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
        <div className="flex items-center justify-between border-b border-[#223252] pb-3">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
              Complete 18-Sector Department Mapping Table
            </h2>
            <p className="text-xs text-[#8E9EB8]">
              Verified routing lookup utilized by the CivicLens Neural Classification Engine
            </p>
          </div>
          <span className="text-xs font-mono text-[#C6FF5F]">18/18 Mapped</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#223252] text-[11px] font-mono uppercase text-[#8E9EB8] bg-[#0E1524]">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Civic Sector</th>
                <th className="py-2.5 px-4">Responsible Municipal Department</th>
                <th className="py-2.5 px-4">Color Identity</th>
                <th className="py-2.5 px-4">Active Queue</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C4A]">
              {CIVIC_SECTORS.map((sec) => {
                const activeForSec = complaints.filter(c => c.sectorId === sec.id && c.status !== 'Resolved').length;
                return (
                  <tr key={sec.id} className="hover:bg-[#16223B]/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                      #{sec.id}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <span>{sec.icon}</span>
                        <span>{sec.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-200">
                      {sec.responsibleDepartment}
                    </td>
                    <td className="py-2.5 px-4">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{ backgroundColor: sec.badgeBg, color: sec.textColor, border: `1px solid ${sec.badgeBorder}` }}
                      >
                        {sec.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold">
                      <span className={activeForSec > 0 ? 'text-[#FF9B42]' : 'text-slate-400'}>
                        {activeForSec} tickets
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setFilterSector(sec.id);
                          setActiveTab('complaints');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-[11px] font-mono text-[#C6FF5F]"
                      >
                        Filter Queue →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Department Workload Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
            Operational Department Bureaus
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {filteredDepts.length} Departments Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="glass-panel p-5 rounded-2xl border border-[#223252] hover:border-[#43D9FF]/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-[#243354] flex items-center justify-center text-[#43D9FF]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        {dept.name}
                      </h3>
                      <p className="text-[11px] text-[#8E9EB8] mt-0.5">
                        Officer: {dept.head}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                    dept.status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    dept.status === 'HIGH_LOAD' ? 'bg-orange-500/10 text-[#FF9B42] border border-orange-500/20' :
                    'bg-red-500/10 text-[#FF4D5E] border border-red-500/20'
                  }`}>
                    {dept.status}
                  </span>
                </div>

                {/* Contact info */}
                <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252] space-y-1 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-[#C6FF5F]" />
                    <span>{dept.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-[#43D9FF]" />
                    <span className="truncate">{dept.email}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#223252]/60 text-center text-xs font-mono">
                  <div className="p-1 rounded bg-[#0B1020]/50">
                    <div className="text-[9px] text-[#8E9EB8]">FIELD TEAMS</div>
                    <div className="font-bold text-white mt-0.5">{dept.activeTeams}</div>
                  </div>
                  <div className="p-1 rounded bg-[#0B1020]/50">
                    <div className="text-[9px] text-[#8E9EB8]">OPEN TIX</div>
                    <div className="font-bold text-[#FF9B42] mt-0.5">{dept.openTickets}</div>
                  </div>
                  <div className="p-1 rounded bg-[#0B1020]/50">
                    <div className="text-[9px] text-[#8E9EB8]">SLA RATE</div>
                    <div className="font-bold text-[#C6FF5F] mt-0.5">{dept.slaCompliance}%</div>
                  </div>
                </div>

              </div>

              {/* Action */}
              <div className="pt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E9EB8] text-[11px]">
                  {dept.totalPersonnel} personnel
                </span>
                <button
                  onClick={() => {
                    if (dept.sectorIds.length > 0) {
                      setFilterSector(dept.sectorIds[0]);
                    }
                    setActiveTab('complaints');
                  }}
                  className="text-[#43D9FF] hover:underline flex items-center gap-1"
                >
                  <span>Assigned Tickets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
