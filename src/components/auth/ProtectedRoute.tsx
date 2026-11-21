import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { UserRole } from '../../types';
import { DEPARTMENTS } from '../../data/departments';
import {
  ShieldAlert,
  Lock,
  Building2,
  User,
  ShieldCheck,
  Loader2,
  RefreshCcw,
  ArrowRight,
  LogOut,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export interface RoleGuardOptions {
  allowedRoles: UserRole[];
  requiredDepartmentId?: string;
  requireAssignedDepartment?: boolean;
}

export type RoleGuardStatus =
  | 'loading'
  | 'unauthenticated'
  | 'pending_department'
  | 'forbidden'
  | 'authorized';

export interface RoleGuardResult {
  status: RoleGuardStatus;
  effectiveRole: UserRole;
  assignedDepartmentId?: string;
  claimSource: 'idToken' | 'firestore' | 'none';
  reason?: 'unauthenticated' | 'role' | 'department' | 'pending_department';
  defaultAuthorizedTab: NavigationTab;
}

export function getDefaultTabForRole(role: UserRole): NavigationTab {
  if (role === 'ADMIN') return 'command-center';
  if (role === 'DEPARTMENT_OFFICER') return 'department-portal';
  return 'citizen-portal';
}

export function useRoleGuard({
  allowedRoles,
  requiredDepartmentId,
  requireAssignedDepartment = false,
}: RoleGuardOptions): RoleGuardResult {
  const { authReady, currentUser, verifiedRole, verifiedDepartmentId, customClaims } = useApp();

  const effectiveRole: UserRole =
    customClaims.admin === true
      ? 'ADMIN'
      : customClaims.role || verifiedRole || 'CITIZEN';

  const assignedDepartmentId = customClaims.departmentId || verifiedDepartmentId;
  const defaultAuthorizedTab = getDefaultTabForRole(effectiveRole);

  if (!authReady) {
    return {
      status: 'loading',
      effectiveRole,
      assignedDepartmentId,
      claimSource: customClaims.source,
      defaultAuthorizedTab,
    };
  }

  if (!currentUser.isAuthenticated) {
    return {
      status: 'unauthenticated',
      effectiveRole: 'CITIZEN',
      assignedDepartmentId: undefined,
      claimSource: 'none',
      reason: 'unauthenticated',
      defaultAuthorizedTab: 'citizen-portal',
    };
  }

  // Admin override permits inspecting any guarded interface
  if (effectiveRole === 'ADMIN' && allowedRoles.includes('ADMIN')) {
    return {
      status: 'authorized',
      effectiveRole,
      assignedDepartmentId,
      claimSource: customClaims.source,
      defaultAuthorizedTab,
    };
  }

  if (!allowedRoles.includes(effectiveRole)) {
    return {
      status: 'forbidden',
      effectiveRole,
      assignedDepartmentId,
      claimSource: customClaims.source,
      reason: 'role',
      defaultAuthorizedTab,
    };
  }

  if (effectiveRole === 'DEPARTMENT_OFFICER') {
    if (requireAssignedDepartment && !assignedDepartmentId) {
      return {
        status: 'pending_department',
        effectiveRole,
        assignedDepartmentId,
        claimSource: customClaims.source,
        reason: 'pending_department',
        defaultAuthorizedTab,
      };
    }

    if (requiredDepartmentId && assignedDepartmentId !== requiredDepartmentId) {
      return {
        status: 'forbidden',
        effectiveRole,
        assignedDepartmentId,
        claimSource: customClaims.source,
        reason: 'department',
        defaultAuthorizedTab,
      };
    }
  }

  return {
    status: 'authorized',
    effectiveRole,
    assignedDepartmentId,
    claimSource: customClaims.source,
    defaultAuthorizedTab,
  };
}

interface ProtectedRouteProps extends RoleGuardOptions {
  children: React.ReactNode;
  portalTitle?: string;
  portalDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredDepartmentId,
  requireAssignedDepartment = false,
  portalTitle,
  portalDescription,
  children,
}) => {
  const {
    currentUser,
    signInWithGoogle,
    logout,
    authLoading,
    authError,
    setActiveTab,
    refreshAuthClaims,
  } = useApp();

  const guard = useRoleGuard({
    allowedRoles,
    requiredDepartmentId,
    requireAssignedDepartment,
  });

  if (guard.status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-7 h-7 animate-spin text-[#C6FF5F]" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8E9EB8]">
          Verifying Firebase Auth token claims...
        </p>
      </div>
    );
  }

  if (guard.status === 'unauthenticated') {
    return (
      <div className="max-w-5xl mx-auto py-8 px-2 space-y-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#121A2B] via-[#16223B] to-[#0E1525] border border-[#2C416A] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#223252] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1020] border border-[#C6FF5F]/40 flex items-center justify-center text-[#C6FF5F]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C6FF5F]">
                  Protected CivicLens Workspace
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {portalTitle || 'Role-Verified Access Gateway'}
                </h1>
                <p className="text-xs text-[#8E9EB8] mt-0.5">
                  {portalDescription ||
                    'Sign in with Google so CivicLens can verify your role claim and route you to your authorized workspace.'}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#0B1020] border border-[#2C416A] text-[#43D9FF] self-start sm:self-center">
              Required: {allowedRoles.join(' / ')}
            </span>
          </div>

          {/* 3-Tier Role Hierarchy Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl bg-[#0B1020] border space-y-2 ${
                allowedRoles.includes('CITIZEN')
                  ? 'border-[#C6FF5F]/50'
                  : 'border-[#223252] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C6FF5F]/15 text-[#C6FF5F]">
                  TIER 1 · CITIZEN
                </span>
                <User className="w-4 h-4 text-[#C6FF5F]" />
              </div>
              <h3 className="text-sm font-bold text-white">Citizen Access Portal</h3>
              <p className="text-[11px] text-[#8E9EB8] leading-relaxed">
                Any verified resident can sign in to submit AI-triaged reports, track local ward status, and confirm issues.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl bg-[#0B1020] border space-y-2 ${
                allowedRoles.includes('DEPARTMENT_OFFICER')
                  ? 'border-[#43D9FF]/50'
                  : 'border-[#223252] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#43D9FF]/15 text-[#43D9FF]">
                  TIER 2 · OFFICER
                </span>
                <Building2 className="w-4 h-4 text-[#43D9FF]" />
              </div>
              <h3 className="text-sm font-bold text-white">Department Dispatch Desk</h3>
              <p className="text-[11px] text-[#8E9EB8] leading-relaxed">
                Scoped strictly to the officer&apos;s assigned municipal bureau claim (Roads, Water Board, Sanitation, etc.).
              </p>
            </div>

            <div
              className={`p-4 rounded-xl bg-[#0B1020] border space-y-2 ${
                allowedRoles.includes('ADMIN')
                  ? 'border-amber-400/50'
                  : 'border-[#223252] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                  TIER 3 · ADMIN
                </span>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="text-sm font-bold text-white">City Operations Command</h3>
              <p className="text-[11px] text-[#8E9EB8] leading-relaxed">
                Restricted to verified City Admins for cross-department oversight, SLA rules, and officer role assignment.
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-[#FF4D5E]/40 text-xs text-[#FF4D5E]">
              {authError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] font-mono text-[#8E9EB8] flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-[#43D9FF]" />
              <span>Your role & department assignment are verified automatically on sign-in.</span>
            </div>

            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={authLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold font-mono text-xs uppercase tracking-wider hover:scale-[1.01] transition-all shadow-lg shadow-[#C6FF5F]/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Google Session...</span>
                </>
              ) : (
                <span>Sign in with Google →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (guard.status === 'pending_department') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-2">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121A2B] border border-[#43D9FF]/40 shadow-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#43D9FF]/15 border border-[#43D9FF]/40 flex items-center justify-center text-[#43D9FF]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-[#43D9FF]">
                Pending Department Assignment
              </div>
              <h2 className="text-lg font-extrabold text-white">
                No Municipal Bureau Assigned Yet
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your account has the <strong className="text-[#43D9FF]">DEPARTMENT_OFFICER</strong> role,
            but no <code className="px-1.5 py-0.5 rounded bg-[#0B1020] text-[#C6FF5F]">departmentId</code> claim
            is assigned yet. Share your User ID below with the City Admin to link your bureau.
          </p>

          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#223252] font-mono text-xs space-y-1">
            <div className="text-[#8E9EB8]">Signed in as: <span className="text-white">{currentUser.email}</span></div>
            <div className="text-[#8E9EB8]">UID: <span className="text-[#C6FF5F] break-all">{currentUser.uid}</span></div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void refreshAuthClaims()}
              className="px-4 py-2 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#43D9FF]/40 text-xs font-mono text-[#43D9FF] flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Refresh Role Claims</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className="px-4 py-2 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-slate-200 flex items-center gap-1.5"
            >
              <span>View City Incident Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (guard.status === 'forbidden') {
    const assignedDept = guard.assignedDepartmentId
      ? DEPARTMENTS.find((d) => d.id === guard.assignedDepartmentId)?.name ||
        guard.assignedDepartmentId
      : undefined;

    return (
      <div className="max-w-2xl mx-auto py-12 px-2">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121A2B] border border-[#FF4D5E]/40 shadow-2xl space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF4D5E]/15 border border-[#FF4D5E]/40 flex items-center justify-center text-[#FF4D5E] shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF4D5E]">
                Access Restricted · Role Claim Guard
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {guard.reason === 'department'
                  ? 'Department Scope Mismatch'
                  : 'Unauthorized Workspace for Your Role'}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {portalTitle ? (
              <>
                <strong className="text-white">{portalTitle}</strong> requires{' '}
              </>
            ) : (
              'This workspace requires '
            )}
            <span className="font-mono text-[#C6FF5F] font-bold">
              {allowedRoles.join(' or ')}
            </span>
            {requiredDepartmentId ? ` (Department: ${requiredDepartmentId})` : ''}.
            Your verified account claim is currently{' '}
            <span className="font-mono text-[#43D9FF] font-bold">{guard.effectiveRole}</span>
            {assignedDept ? ` (${assignedDept})` : ''}.
          </p>

          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#223252] text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between text-[#8E9EB8]">
              <span>Verified Role Claim:</span>
              <span className="text-white font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#C6FF5F]" />
                {guard.effectiveRole} ({guard.claimSource})
              </span>
            </div>
            {assignedDept && (
              <div className="flex items-center justify-between text-[#8E9EB8]">
                <span>Assigned Bureau:</span>
                <span className="text-[#43D9FF] font-bold">{assignedDept}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#8E9EB8]">
              <span>Account:</span>
              <span className="text-slate-300">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab(guard.defaultAuthorizedTab)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold font-mono text-xs uppercase tracking-wider hover:scale-[1.01] transition-all flex items-center gap-2"
            >
              <span>Go to My Authorized Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshAuthClaims()}
                className="px-3 py-2 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-slate-300 flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Refresh Claims</span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="px-3 py-2 rounded-xl bg-[#18233B] hover:bg-red-950/40 border border-[#2C416A] hover:border-[#FF4D5E]/40 text-xs font-mono text-slate-300 hover:text-[#FF4D5E] flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardOptions: RoleGuardOptions & {
    portalTitle?: string;
    portalDescription?: string;
  }
): React.FC<P> {
  const GuardedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...guardOptions}>
      <WrappedComponent {...props} />
    </ProtectedRoute>
  );

  GuardedComponent.displayName = `withProtectedRoute(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return GuardedComponent;
}
