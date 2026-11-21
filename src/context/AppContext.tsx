import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import {
  Complaint,
  CivicSector,
  Department,
  TicketStatus,
  UserRole,
  AuthUser,
  CustomClaims,
} from '../types';
import { INITIAL_COMPLAINTS } from '../data/complaints';
import { CIVIC_SECTORS } from '../data/sectors';
import { DEPARTMENTS } from '../data/departments';
import confetti from 'canvas-confetti';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  buildComplaintCreatePayload,
  buildUserProfilePayload,
  clampString,
  getDepartmentIdForSector,
  sanitizeId,
} from '../utils/firestorePayloads';

export type NavigationTab =
  | 'command-center'
  | 'citizen-portal'
  | 'department-portal'
  | 'ai-triage'
  | 'complaints'
  | 'map'
  | 'sectors'
  | 'analytics'
  | 'departments'
  | 'settings';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'success' | 'info';
  timestamp: string;
  ticketId?: string;
}

export interface PlatformSettingsState {
  modelAccuracy: string;
  autoDispatch: boolean;
  criticalSLAHours: number;
  highSLAHours: number;
  notificationSound: boolean;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  // Auth & Roles
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  isFirestoreSynced: boolean;
  verifiedRole: UserRole;
  verifiedDepartmentId?: string;
  customClaims: CustomClaims;
  refreshAuthClaims: () => Promise<void>;
  updateUserRoleAndDepartment: (
    targetUid: string,
    role: UserRole,
    departmentId?: string
  ) => Promise<void>;
  currentUser: AuthUser;
  signInWithGoogle: () => Promise<void>;
  loginAs: (role: UserRole, departmentId?: string) => void;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (b: boolean) => void;
  switchDepartment: (departmentId: string) => void;
  // Data
  complaints: Complaint[];
  sectors: CivicSector[];
  departments: Department[];
  selectedSectorForDrilldown: CivicSector | null;
  setSelectedSectorForDrilldown: (sector: CivicSector | null) => void;
  selectedComplaintForDetails: Complaint | null;
  setSelectedComplaintForDetails: (complaint: Complaint | null) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'reportedAt'>) => Complaint;
  updateComplaintStatus: (id: string, newStatus: TicketStatus) => void;
  deleteComplaint: (id: string) => void;
  upvoteComplaint: (complaintIdOrTicketCode: string) => Promise<void>;
  upvotedIds: Record<string, boolean>;
  seedDemoComplaints: () => Promise<void>;
  notifications: AppNotification[];
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Settings
  platformSettings: PlatformSettingsState;
  savePlatformSettings: (next: PlatformSettingsState) => Promise<void>;
  // Global filters
  filterSector: string;
  setFilterSector: (s: string) => void;
  filterSeverity: string;
  setFilterSeverity: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterWard: string;
  setFilterWard: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resetAllFilters: () => void;
  // Quick pre-fill demo in triage
  activeDemoScenarioId: string | null;
  setActiveDemoScenarioId: (id: string | null) => void;
  // Statistics
  stats: {
    totalReports: number;
    criticalCount: number;
    highCount: number;
    inProgressCount: number;
    resolvedCount: number;
    resolutionRate: number;
    avgPriorityScore: number;
  };
}

const DEFAULT_SETTINGS: PlatformSettingsState = {
  modelAccuracy: 'High (98.4%)',
  autoDispatch: true,
  criticalSLAHours: 2,
  highSLAHours: 6,
  notificationSound: true,
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '🔴 Critical Escalation Alert',
    message: 'Water pipeline burst reported in Ward 12. Automated team dispatch initiated.',
    type: 'critical',
    timestamp: '3m ago',
    ticketId: 'CL-1042',
  },
  {
    id: 'notif-2',
    title: '⚡ Grid Restoration Update',
    message: 'Transformer repair completed in Ward 15. Service restored for 1,200 households.',
    type: 'success',
    timestamp: '18m ago',
    ticketId: 'CL-1038',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('command-center');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [selectedSectorForDrilldown, setSelectedSectorForDrilldown] =
    useState<CivicSector | null>(null);
  const [selectedComplaintForDetails, setSelectedComplaintForDetails] =
    useState<Complaint | null>(null);
  const [activeDemoScenarioId, setActiveDemoScenarioId] = useState<string | null>(null);

  // Firebase Auth & Sync State
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState(false);
  const [verifiedRole, setVerifiedRole] = useState<UserRole>('CITIZEN');
  const [verifiedDepartmentId, setVerifiedDepartmentId] = useState<string | undefined>(undefined);
  const [customClaims, setCustomClaims] = useState<CustomClaims>({ source: 'none' });
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettingsState>(DEFAULT_SETTINGS);

  const hasAttemptedSeedRef = useRef(false);

  // Authentication UI State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'guest-preview',
    name: 'Guest Visitor',
    role: 'CITIZEN',
    email: 'Sign in with Google to verify role',
    isAuthenticated: false,
    emailVerified: false,
  });

  // Filters
  const [filterSector, setFilterSector] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterWard, setFilterWard] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const syncUserIdentityAndClaims = async (user: User, forceTokenRefresh = false) => {
    const isBootAdmin =
      user.emailVerified &&
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    // 1. Read Firebase Auth ID token custom claims (claims.role / claims.departmentId / claims.admin)
    let tokenRole: UserRole | undefined;
    let tokenDeptId: string | undefined;
    let tokenAdminFlag = false;
    try {
      const tokenResult = await user.getIdTokenResult(forceTokenRefresh);
      const claims = tokenResult.claims as Record<string, unknown>;
      if (claims.admin === true) {
        tokenAdminFlag = true;
        tokenRole = 'ADMIN';
      } else if (
        claims.role === 'ADMIN' ||
        claims.role === 'DEPARTMENT_OFFICER' ||
        claims.role === 'CITIZEN'
      ) {
        tokenRole = claims.role;
      }
      if (typeof claims.departmentId === 'string' && claims.departmentId.trim()) {
        tokenDeptId = claims.departmentId.trim();
      }
    } catch (err) {
      console.warn('Unable to inspect ID token custom claims:', err);
    }

    // 2. Ensure admin marker doc exists for bootstrapped admin
    if (isBootAdmin) {
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        try {
          await setDoc(adminRef, {
            uid: user.uid,
            grantedBy: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `admins/${user.uid}`);
        }
      }
    }

    // 3. Load or create user profile in /users/{uid}
    const userRef = doc(db, 'users', user.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }

    let resolvedRole: UserRole =
      tokenRole || (isBootAdmin ? 'ADMIN' : 'CITIZEN');
    let resolvedName = user.displayName || user.email?.split('@')[0] || 'CivicLens User';
    let resolvedDeptId: string | undefined = tokenDeptId;
    let resolvedDeptName: string | undefined = tokenDeptId
      ? DEPARTMENTS.find((d) => d.id === tokenDeptId)?.name
      : undefined;
    let resolvedWard = 'Ward 8';

    if (!userSnap || !userSnap.exists()) {
      const profilePayload = buildUserProfilePayload({
        uid: user.uid,
        displayName: resolvedName,
        role: isBootAdmin ? 'ADMIN' : 'CITIZEN',
        ward: resolvedWard,
        isCreate: true,
      });
      try {
        await setDoc(userRef, profilePayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
      }
    } else {
      const data = userSnap.data();
      const firestoreRole = data.role as UserRole | undefined;
      if (!tokenRole) {
        resolvedRole = isBootAdmin ? 'ADMIN' : firestoreRole || 'CITIZEN';
      }
      resolvedName = (data.displayName as string) || resolvedName;
      if (!resolvedDeptId && typeof data.departmentId === 'string') {
        resolvedDeptId = data.departmentId;
      }
      if (!resolvedDeptName && typeof data.departmentName === 'string') {
        resolvedDeptName = data.departmentName;
      }
      resolvedWard = (data.ward as string) || resolvedWard;
    }

    if (isBootAdmin) {
      resolvedRole = 'ADMIN';
    }

    if (resolvedDeptId && !resolvedDeptName) {
      resolvedDeptName = DEPARTMENTS.find((d) => d.id === resolvedDeptId)?.name;
    }

    // 4. Ensure isolated PII doc exists in /users/{uid}/private/info
    const privateRef = doc(db, 'users', user.uid, 'private', 'info');
    let privateSnap;
    try {
      privateSnap = await getDoc(privateRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/private/info`);
    }

    if (!privateSnap || !privateSnap.exists()) {
      try {
        await setDoc(privateRef, {
          uid: user.uid,
          email: clampString(user.email || 'user@civiclens.gov', 200),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/private/info`);
      }
    }

    setVerifiedRole(resolvedRole);
    setVerifiedDepartmentId(resolvedDeptId);
    setCustomClaims({
      role: resolvedRole,
      departmentId: resolvedDeptId,
      admin: tokenAdminFlag || resolvedRole === 'ADMIN',
      source: tokenRole ? 'idToken' : 'firestore',
    });
    setCurrentUser({
      id: user.uid,
      uid: user.uid,
      name: resolvedName,
      role: resolvedRole,
      email: user.email || '',
      departmentId: resolvedDeptId,
      departmentName: resolvedDeptName,
      verifiedDepartmentId: resolvedDeptId,
      ward: resolvedWard,
      avatar: user.photoURL || undefined,
      isAuthenticated: true,
      emailVerified: user.emailVerified,
    });

    // Route the signed-in user directly to the workspace matching their verified role
    setActiveTab((prevTab) => {
      if (resolvedRole === 'CITIZEN') {
        if (
          prevTab === 'command-center' ||
          prevTab === 'department-portal' ||
          prevTab === 'analytics' ||
          prevTab === 'departments' ||
          prevTab === 'settings' ||
          prevTab === 'sectors'
        ) {
          return 'citizen-portal';
        }
        return prevTab;
      }
      if (resolvedRole === 'DEPARTMENT_OFFICER') {
        if (
          prevTab === 'command-center' ||
          prevTab === 'citizen-portal' ||
          prevTab === 'analytics' ||
          prevTab === 'departments' ||
          prevTab === 'settings'
        ) {
          return 'department-portal';
        }
        return prevTab;
      }
      return prevTab;
    });
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthError(null);

      if (!user) {
        setVerifiedRole('CITIZEN');
        setVerifiedDepartmentId(undefined);
        setCustomClaims({ source: 'none' });
        setIsFirestoreSynced(false);
        hasAttemptedSeedRef.current = false;
        setComplaints(INITIAL_COMPLAINTS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setCurrentUser({
          id: 'guest-preview',
          name: 'Guest Visitor',
          role: 'CITIZEN',
          email: 'Sign in with Google to verify role',
          isAuthenticated: false,
          emailVerified: false,
        });
        setAuthReady(true);
        return;
      }

      try {
        await syncUserIdentityAndClaims(user, false);
      } catch (err) {
        console.error('Auth profile sync error:', err);
        setAuthError(err instanceof Error ? err.message : 'Failed to load Firebase profile.');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshAuthClaims = async () => {
    if (!auth.currentUser) return;
    setAuthLoading(true);
    try {
      await syncUserIdentityAndClaims(auth.currentUser, true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to refresh role claims.');
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserRoleAndDepartment = async (
    targetUid: string,
    role: UserRole,
    departmentId?: string
  ) => {
    if (verifiedRole !== 'ADMIN') {
      throw new Error('Only a verified City Admin can assign roles or departments.');
    }

    const userRef = doc(db, 'users', sanitizeId(targetUid));
    const dept = departmentId ? DEPARTMENTS.find((d) => d.id === departmentId) : undefined;

    const payload: Record<string, unknown> = {
      role,
      updatedAt: serverTimestamp(),
    };

    if (role === 'DEPARTMENT_OFFICER' && dept) {
      payload.departmentId = dept.id;
      payload.departmentName = clampString(dept.name, 120);
    } else {
      payload.departmentId = deleteField();
      payload.departmentName = deleteField();
    }

    try {
      await updateDoc(userRef, payload);
      if (auth.currentUser && auth.currentUser.uid === targetUid) {
        await syncUserIdentityAndClaims(auth.currentUser, true);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  // Seed helper (writes INITIAL_COMPLAINTS cleanly to Firestore)
  const seedDemoComplaintsInternal = async (uid: string) => {
    const batch = writeBatch(db);
    INITIAL_COMPLAINTS.forEach((c) => {
      const docId = sanitizeId(`seed_${c.id}`);
      const ref = doc(db, 'complaints', docId);
      const payload = buildComplaintCreatePayload(
        {
          ...c,
          departmentId: getDepartmentIdForSector(c.sectorId, c.department),
        },
        c.id,
        uid,
        c.reportedAt
      );
      batch.set(ref, payload);
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'complaints');
    }
  };

  const seedDemoComplaints = async () => {
    if (!firebaseUser) {
      setIsLoginModalOpen(true);
      return;
    }
    await seedDemoComplaintsInternal(firebaseUser.uid);
  };

  // Attach Firestore listeners ONLY when authReady && firebaseUser != null
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      return;
    }

    const complaintsQuery = query(
      collection(db, 'complaints'),
      where('visibility', '==', 'PUBLIC')
    );

    const unsubComplaints = onSnapshot(
      complaintsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          const isBootAdmin =
            firebaseUser.emailVerified &&
            firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

          if (isBootAdmin && !hasAttemptedSeedRef.current) {
            hasAttemptedSeedRef.current = true;
            await seedDemoComplaintsInternal(firebaseUser.uid);
            return;
          }
          setComplaints([]);
          setIsFirestoreSynced(true);
          return;
        }

        const loaded: Complaint[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: (d.ticketCode as string) || docSnap.id,
            docId: docSnap.id,
            title: (d.title as string) || '',
            description: (d.description as string) || '',
            sectorId: (d.sectorId as string) || '01',
            sectorName: (d.sectorName as string) || 'Roads & Infrastructure',
            sectorIcon: (d.sectorIcon as string) || '🛣️',
            severity: (d.severity as Complaint['severity']) || 'MEDIUM',
            priorityScore: typeof d.priorityScore === 'number' ? d.priorityScore : 50,
            department: (d.department as string) || 'Public Works / Roads Department',
            departmentId: (d.departmentId as string) || 'dept-roads',
            status: (d.status as TicketStatus) || 'New',
            ward: (d.ward as string) || 'Ward 1',
            locationName: (d.locationName as string) || '',
            coordinates: [
              typeof d.lat === 'number' ? d.lat : 12.9716,
              typeof d.lng === 'number' ? d.lng : 77.5946,
            ],
            reportedAt: (d.reportedAt as string) || 'Just now',
            resolvedAt: d.resolvedAt as string | undefined,
            reporterUid: d.reporterUid as string | undefined,
            citizenName: d.citizenName as string | undefined,
            language: d.language as string | undefined,
            imageUrl: d.imageUrl as string | undefined,
            aiReasoning: (d.aiReasoning as string) || '',
            recommendedAction: (d.recommendedAction as string) || '',
            assignedTeam: d.assignedTeam as string | undefined,
            slaHours: typeof d.slaHours === 'number' ? d.slaHours : 24,
            timeRemaining: d.timeRemaining as string | undefined,
            visibility: (d.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC',
            upvoteCount: typeof d.upvoteCount === 'number' ? d.upvoteCount : 0,
          };
        });

        loaded.sort((a, b) => b.priorityScore - a.priorityScore);
        setComplaints(loaded);
        setIsFirestoreSynced(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'complaints');
      }
    );

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', firebaseUser.uid)
    );

    const unsubNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setNotifications(INITIAL_NOTIFICATIONS);
          return;
        }
        const loadedNotifs: AppNotification[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: (d.title as string) || 'Notification',
            message: (d.message as string) || '',
            type: (d.type as AppNotification['type']) || 'info',
            timestamp: 'Live',
            ticketId: d.ticketId as string | undefined,
          };
        });
        setNotifications(loadedNotifs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setPlatformSettings({
            modelAccuracy: (d.modelAccuracy as string) || DEFAULT_SETTINGS.modelAccuracy,
            autoDispatch:
              typeof d.autoDispatch === 'boolean' ? d.autoDispatch : DEFAULT_SETTINGS.autoDispatch,
            criticalSLAHours:
              typeof d.criticalSLAHours === 'number'
                ? d.criticalSLAHours
                : DEFAULT_SETTINGS.criticalSLAHours,
            highSLAHours:
              typeof d.highSLAHours === 'number' ? d.highSLAHours : DEFAULT_SETTINGS.highSLAHours,
            notificationSound:
              typeof d.notificationSound === 'boolean'
                ? d.notificationSound
                : DEFAULT_SETTINGS.notificationSound,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      }
    );

    return () => {
      unsubComplaints();
      unsubNotifications();
      unsubSettings();
    };
  }, [authReady, firebaseUser]);

  const resetAllFilters = () => {
    setFilterSector('ALL');
    setFilterSeverity('ALL');
    setFilterStatus('ALL');
    setFilterWard('ALL');
    setSearchQuery('');
  };

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoginModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch active portal view in UI — ONLY allowed for verified City Admins (previewing views).
  // Non-admin users remain strictly bound to their verified role & assigned department.
  const loginAs = (role: UserRole, departmentId?: string) => {
    if (!currentUser.isAuthenticated || verifiedRole !== 'ADMIN') {
      if (verifiedRole === 'DEPARTMENT_OFFICER') {
        setActiveTab('department-portal');
      } else {
        setActiveTab('citizen-portal');
      }
      setIsLoginModalOpen(false);
      return;
    }

    if (role === 'CITIZEN') {
      setCurrentUser((prev) => ({
        ...prev,
        role: 'CITIZEN',
        ward: prev.ward || 'Ward 8',
      }));
      setActiveTab('citizen-portal');
    } else if (role === 'DEPARTMENT_OFFICER') {
      const deptId = departmentId || currentUser.departmentId || 'dept-trees';
      const dept = DEPARTMENTS.find((d) => d.id === deptId) || DEPARTMENTS[5];
      setCurrentUser((prev) => ({
        ...prev,
        role: 'DEPARTMENT_OFFICER',
        departmentId: dept.id,
        departmentName: dept.name,
      }));
      setActiveTab('department-portal');
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        role: 'ADMIN',
      }));
      setActiveTab('command-center');
    }
    setIsLoginModalOpen(false);
  };

  const switchDepartment = (departmentId: string) => {
    if (verifiedRole !== 'ADMIN') {
      return;
    }
    const dept = DEPARTMENTS.find((d) => d.id === departmentId) || DEPARTMENTS[0];
    setCurrentUser((prev) => ({
      ...prev,
      role: 'DEPARTMENT_OFFICER',
      departmentId: dept.id,
      departmentName: dept.name,
    }));
    setActiveTab('department-portal');
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setActiveTab('command-center');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Dynamically compute sectors with live complaint statistics
  const sectors = useMemo(() => {
    return CIVIC_SECTORS.map((baseSector) => {
      const sectorComplaints = complaints.filter((c) => c.sectorId === baseSector.id);
      const total = sectorComplaints.length;
      const critical = sectorComplaints.filter((c) => c.severity === 'CRITICAL').length;
      const resolved = sectorComplaints.filter((c) => c.status === 'Resolved').length;
      const active = total - resolved;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        ...baseSector,
        totalComplaints: total,
        criticalComplaints: critical,
        activeComplaints: active,
        resolvedComplaints: resolved,
        resolutionRate: rate,
      };
    });
  }, [complaints]);

  // Dynamically compute departments with live ticket count
  const departments = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptComplaints = complaints.filter(
        (c) => dept.sectorIds.includes(c.sectorId) && c.status !== 'Resolved'
      );
      const deptStatus: 'CRITICAL' | 'HIGH_LOAD' | 'OPTIMAL' =
        deptComplaints.length >= 15
          ? 'CRITICAL'
          : deptComplaints.length >= 10
            ? 'HIGH_LOAD'
            : 'OPTIMAL';
      return {
        ...dept,
        openTickets: deptComplaints.length,
        status: deptStatus,
      };
    });
  }, [complaints]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalReports = complaints.length;
    const criticalCount = complaints.filter(
      (c) => c.severity === 'CRITICAL' && c.status !== 'Resolved'
    ).length;
    const highCount = complaints.filter(
      (c) => c.severity === 'HIGH' && c.status !== 'Resolved'
    ).length;
    const inProgressCount = complaints.filter(
      (c) => c.status === 'In Progress' || c.status === 'Assigned'
    ).length;
    const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
    const resolutionRate =
      totalReports > 0 ? Number(((resolvedCount / totalReports) * 100).toFixed(1)) : 0;
    const avgPriorityScore =
      totalReports > 0
        ? Math.round(complaints.reduce((acc, c) => acc + c.priorityScore, 0) / totalReports)
        : 0;

    return {
      totalReports,
      criticalCount,
      highCount,
      inProgressCount,
      resolvedCount,
      resolutionRate,
      avgPriorityScore,
    };
  }, [complaints]);

  const addComplaint = (newIncidentData: Omit<Complaint, 'id' | 'reportedAt'>): Complaint => {
    const nextNum = 1043 + complaints.length;
    const ticketCode = `CL-${nextNum}`;
    const docId = sanitizeId(`cl_${nextNum}_${Date.now()}`);

    const newComplaint: Complaint = {
      ...newIncidentData,
      id: ticketCode,
      docId,
      departmentId: getDepartmentIdForSector(newIncidentData.sectorId, newIncidentData.department),
      reportedAt: 'Just now',
      reporterUid: firebaseUser?.uid,
      visibility: 'PUBLIC',
      upvoteCount: 0,
    };

    // Optimistic local state update (overwritten by onSnapshot when authenticated)
    if (!firebaseUser) {
      setComplaints((prev) => [newComplaint, ...prev]);
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `⚡ Ticket Generated: ${ticketCode}`,
          message: `${newComplaint.sectorName} incident in ${newComplaint.ward}. AI Priority: ${newComplaint.priorityScore}/100. Routed to ${newComplaint.department}.`,
          type: newComplaint.severity === 'CRITICAL' ? 'critical' : 'success',
          timestamp: 'Just now',
          ticketId: ticketCode,
        },
        ...prev,
      ]);
    } else {
      const payload = buildComplaintCreatePayload(
        newIncidentData,
        ticketCode,
        firebaseUser.uid,
        'Just now'
      );
      const complaintRef = doc(db, 'complaints', docId);
      setDoc(complaintRef, payload).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `complaints/${docId}`);
      });

      const notifId = sanitizeId(`notif_${Date.now()}`);
      const notifRef = doc(db, 'notifications', notifId);
      setDoc(notifRef, {
        recipientUid: firebaseUser.uid,
        title: clampString(`⚡ Ticket Generated: ${ticketCode}`, 200),
        message: clampString(
          `${newComplaint.sectorName} incident in ${newComplaint.ward}. AI Priority: ${newComplaint.priorityScore}/100. Routed to ${newComplaint.department}.`,
          1000
        ),
        type: newComplaint.severity === 'CRITICAL' ? 'critical' : 'success',
        ticketId: ticketCode,
        read: false,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
      });
    }

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C6FF5F', '#43D9FF', '#FF4D5E'],
      });
    } catch {
      // ignore in non-browser or test
    }

    return newComplaint;
  };

  const updateComplaintStatus = (id: string, newStatus: TicketStatus) => {
    const target = complaints.find((c) => c.id === id || c.docId === id);
    const resolvedAtValue = newStatus === 'Resolved' ? 'Just now' : target?.resolvedAt;

    if (!firebaseUser || !target?.docId) {
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              status: newStatus,
              resolvedAt: resolvedAtValue,
            };
          }
          return c;
        })
      );

      if (newStatus === 'Resolved') {
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            title: `✅ Incident Resolved: ${id}`,
            message: 'Department field team has resolved this incident. Citizen notified.',
            type: 'success',
            timestamp: 'Just now',
            ticketId: id,
          },
          ...prev,
        ]);
      }
      return;
    }

    const complaintRef = doc(db, 'complaints', target.docId);
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (newStatus === 'Resolved') {
      updateData.resolvedAt = 'Just now';
    }

    updateDoc(complaintRef, updateData).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `complaints/${target.docId}`);
    });

    if (newStatus === 'Resolved') {
      const notifId = sanitizeId(`notif_${Date.now()}`);
      setDoc(doc(db, 'notifications', notifId), {
        recipientUid: firebaseUser.uid,
        title: clampString(`✅ Incident Resolved: ${target.id}`, 200),
        message: 'Department field team has resolved this incident. Citizen notified.',
        type: 'success',
        ticketId: target.id,
        read: false,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
      });
    }
  };

  const deleteComplaint = (id: string) => {
    const target = complaints.find((c) => c.id === id || c.docId === id);
    if (!firebaseUser || !target?.docId) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    deleteDoc(doc(db, 'complaints', target.docId)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `complaints/${target.docId}`);
    });
  };

  const upvoteComplaint = async (complaintIdOrTicketCode: string) => {
    const target = complaints.find(
      (c) => c.id === complaintIdOrTicketCode || c.docId === complaintIdOrTicketCode
    );
    if (!target) return;

    if (!firebaseUser || !target.docId) {
      setUpvotedIds((prev) => ({ ...prev, [target.id]: true }));
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, upvoteCount: (c.upvoteCount || 0) + 1 } : c
        )
      );
      return;
    }

    const upvoteRef = doc(db, 'complaints', target.docId, 'upvotes', firebaseUser.uid);
    try {
      const existingUpvote = await getDoc(upvoteRef);
      if (existingUpvote.exists()) {
        setUpvotedIds((prev) => ({ ...prev, [target.id]: true }));
        return;
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.GET,
        `complaints/${target.docId}/upvotes/${firebaseUser.uid}`
      );
    }

    const batch = writeBatch(db);
    batch.set(upvoteRef, {
      userId: firebaseUser.uid,
      complaintId: target.docId,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'complaints', target.docId), {
      upvoteCount: (target.upvoteCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setUpvotedIds((prev) => ({ ...prev, [target.id]: true }));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `complaints/${target.docId}/upvotes`);
    }
  };

  const removeNotification = (id: string) => {
    if (!firebaseUser || id.startsWith('notif-')) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return;
    }
    deleteDoc(doc(db, 'notifications', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    });
  };

  const clearAllNotifications = () => {
    if (!firebaseUser) {
      setNotifications([]);
      return;
    }
    const firestoreIds = notifications
      .map((n) => n.id)
      .filter((id) => !id.startsWith('notif-'));
    if (firestoreIds.length === 0) {
      setNotifications([]);
      return;
    }
    const batch = writeBatch(db);
    firestoreIds.forEach((id) => {
      batch.delete(doc(db, 'notifications', id));
    });
    batch.commit().catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    });
  };

  const savePlatformSettings = async (next: PlatformSettingsState) => {
    setPlatformSettings(next);
    if (!firebaseUser) return;

    const settingsRef = doc(db, 'settings', 'global');
    try {
      await setDoc(settingsRef, {
        modelAccuracy: clampString(next.modelAccuracy, 64, 'High (98.4%)'),
        autoDispatch: Boolean(next.autoDispatch),
        criticalSLAHours: Math.max(1, Math.min(24, Math.round(next.criticalSLAHours))),
        highSLAHours: Math.max(1, Math.min(72, Math.round(next.highSLAHours))),
        notificationSound: Boolean(next.notificationSound),
        updatedBy: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        authReady,
        authLoading,
        authError,
        isFirestoreSynced,
        verifiedRole,
        verifiedDepartmentId,
        customClaims,
        refreshAuthClaims,
        updateUserRoleAndDepartment,
        currentUser,
        signInWithGoogle,
        loginAs,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        switchDepartment,
        complaints,
        sectors,
        departments,
        selectedSectorForDrilldown,
        setSelectedSectorForDrilldown,
        selectedComplaintForDetails,
        setSelectedComplaintForDetails,
        addComplaint,
        updateComplaintStatus,
        deleteComplaint,
        upvoteComplaint,
        upvotedIds,
        seedDemoComplaints,
        notifications,
        removeNotification,
        clearAllNotifications,
        platformSettings,
        savePlatformSettings,
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
        activeDemoScenarioId,
        setActiveDemoScenarioId,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
