import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { DEPARTMENTS } from '../../data/departments';
import {
  X,
  User,
  Building2,
  ShieldCheck,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
            loginAs,
    currentUser,
    verifiedRole,
    verifiedDepartmentId,
    customClaims,
    refreshAuthClaims,
    signInWithGoogle,
    logout,
    authLoading,
    authError,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('CITIZEN');
  const [selectedDeptId, setSelectedDeptId] = useState('dept-trees');

  if (!isLoginModalOpen) return null;

  const handlePortalSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    loginAs(selectedRole, selectedDeptId);
  };

  const assignedDeptName = verifiedDepartmentId
    ? DEPARTMENTS.find((d) => d.id === verifiedDepartmentId)?.name || verifiedDepartmentId
    : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121A2B] border border-[#2C416A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#223252] flex items-center justify-between bg-gradient-to-r from-[#16223B] to-[#121A2B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-[#2C416A] flex items-center justify-center text-[#C6FF5F]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                CivicLens Access Gateway
              </h2>
              <p className="text-[11px] text-[#8E9EB8]">
                Firebase Auth & Verified Role Claims
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 rounded-lg bg-[#0B1020] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Firebase Google Auth Card */}
          <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-3">
            {currentUser.isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full border border-[#C6FF5F]/50 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#18233B] border border-[#C6FF5F]/50 flex items-center justify-center text-[#C6FF5F] shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#8E9EB8] truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-[#C6FF5F] border border-[#C6FF5F]/30 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {verifiedRole}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#121A2B] border border-[#223252] text-[11px] font-mono space-y-1 text-[#8E9EB8]">
                  <div>
                    Claim Source:{' '}
                    <span className="text-[#43D9FF] font-bold">{customClaims.source}</span>
                  </div>
                  {assignedDeptName && (
                    <div>
                      Assigned Bureau:{' '}
                      <span className="text-white font-bold">{assignedDeptName}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void refreshAuthClaims()}
                    className="py-2 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-[#43D9FF] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Refresh Claims</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="py-2 rounded-lg bg-[#18233B] hover:bg-red-950/40 border border-[#2C416A] hover:border-[#FF4D5E]/40 text-xs font-mono text-slate-300 hover:text-[#FF4D5E] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-300">
                  Sign in with Google to verify your role claim and unlock your authorized CivicLens portal.
                </div>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold font-mono text-xs uppercase tracking-wider hover:scale-[1.01] transition-all shadow-lg shadow-[#C6FF5F]/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <span>Continue with Google →</span>
                  )}
                </button>
              </div>
            )}

            {authError && (
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-[#FF4D5E]/40 text-[11px] text-[#FF4D5E] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Admin-only Workspace Preview Switcher */}
          {currentUser.isAuthenticated && verifiedRole === 'ADMIN' && (
            <form onSubmit={handlePortalSwitch} className="space-y-4 pt-1 border-t border-[#223252]">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Admin Portal Preview Switcher
              </div>

              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#0B1020] border border-[#223252] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CITIZEN')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'CITIZEN'
                      ? 'bg-[#18233B] text-[#C6FF5F] font-bold border border-[#C6FF5F]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('DEPARTMENT_OFFICER')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'DEPARTMENT_OFFICER'
                      ? 'bg-[#18233B] text-[#43D9FF] font-bold border border-[#43D9FF]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Dept Officer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#18233B] text-white font-bold border border-slate-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>City Admin</span>
                </button>
              </div>

              {selectedRole === 'DEPARTMENT_OFFICER' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300 tracking-wider">
                    Select Department Bureau
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1020] border border-[#2C416A] text-xs font-mono text-white focus:outline-none focus:border-[#43D9FF]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id} className="bg-[#121A2B]">
                        {dept.name} ({dept.head})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-white font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>OPEN {selectedRole.replace('_', ' ')} PORTAL →</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
