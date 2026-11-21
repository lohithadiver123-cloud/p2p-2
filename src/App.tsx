import React, { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { CitizenDashboardView } from './components/citizen/CitizenDashboardView';
import { DepartmentDashboardView } from './components/department-portal/DepartmentDashboardView';
import { AITriageView } from './components/triage/AITriageView';
import { ComplaintManagementView } from './components/complaints/ComplaintManagementView';
import { CityIncidentMapView } from './components/map/CityIncidentMapView';
import { SectorIntelligenceView } from './components/sectors/SectorIntelligenceView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { DepartmentManagementView } from './components/departments/DepartmentManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { ComplaintDetailModal } from './components/modals/ComplaintDetailModal';
import { LoginModal } from './components/auth/LoginModal';
import { FirebaseErrorBoundary } from './components/common/FirebaseErrorBoundary';
import { withProtectedRoute } from './components/auth/ProtectedRoute';
import { CivicAssistantChat } from './components/chat/CivicAssistantChat';
import {
  LayoutDashboard,
  Sparkles,
  ListFilter,
  MapPin,
  Building2,
  User,
} from 'lucide-react';

const GuardedCommandCenterView = withProtectedRoute(CommandCenterView, {
  allowedRoles: ['ADMIN'],
  portalTitle: 'City Operations Command Center',
  portalDescription: 'Executive cross-department monitoring and city-wide SLA dispatch.',
});

const GuardedCitizenDashboardView = withProtectedRoute(CitizenDashboardView, {
  allowedRoles: ['CITIZEN', 'ADMIN'],
  portalTitle: 'Citizen Access Portal',
  portalDescription: 'Report neighborhood hazards and track live municipal resolution.',
});

const GuardedDepartmentDashboardView = withProtectedRoute(DepartmentDashboardView, {
  allowedRoles: ['DEPARTMENT_OFFICER', 'ADMIN'],
  requireAssignedDepartment: true,
  portalTitle: 'Department Dispatch Portal',
  portalDescription: 'Bureau-scoped incident management and field unit dispatch.',
});

const GuardedAITriageView = withProtectedRoute(AITriageView, {
  allowedRoles: ['CITIZEN', 'DEPARTMENT_OFFICER', 'ADMIN'],
  portalTitle: 'AI Complaint Triage',
  portalDescription: 'Submit civic issues for automated 18-sector classification and routing.',
});

const GuardedComplaintManagementView = withProtectedRoute(ComplaintManagementView, {
  allowedRoles: ['CITIZEN', 'DEPARTMENT_OFFICER', 'ADMIN'],
  portalTitle: 'Complaint Queue',
  portalDescription: 'Inspect civic incident dossiers and department routing status.',
});

const GuardedCityIncidentMapView = withProtectedRoute(CityIncidentMapView, {
  allowedRoles: ['CITIZEN', 'DEPARTMENT_OFFICER', 'ADMIN'],
  portalTitle: 'City Incident Map',
  portalDescription: 'Live geospatial incident radar across municipal wards.',
});

const GuardedSectorIntelligenceView = withProtectedRoute(SectorIntelligenceView, {
  allowedRoles: ['DEPARTMENT_OFFICER', 'ADMIN'],
  portalTitle: '18-Sector Intelligence',
  portalDescription: 'Sector-level risk analytics and department performance trends.',
});

const GuardedAnalyticsView = withProtectedRoute(AnalyticsView, {
  allowedRoles: ['ADMIN'],
  portalTitle: 'Analytics & Insights',
  portalDescription: 'City-wide resolution metrics and SLA compliance executive reporting.',
});

const GuardedDepartmentManagementView = withProtectedRoute(DepartmentManagementView, {
  allowedRoles: ['ADMIN'],
  portalTitle: 'Departments & Officer Role Assignment',
  portalDescription: 'Manage municipal bureaus and assign Department Officer permissions.',
});

const GuardedSettingsView = withProtectedRoute(SettingsView, {
  allowedRoles: ['ADMIN'],
  portalTitle: 'Platform Settings & SLA Thresholds',
  portalDescription: 'Configure automated dispatch and city-wide SLA escalation targets.',
});

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, verifiedRole, customClaims } = useApp();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const effectiveRole = customClaims.admin ? 'ADMIN' : customClaims.role || verifiedRole;

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar onOpenChat={() => setIsChatOpen(true)} />
        </div>

        {/* Dynamic Page View Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-57px)]">
          {activeTab === 'command-center' && <GuardedCommandCenterView />}
          {activeTab === 'citizen-portal' && <GuardedCitizenDashboardView />}
          {activeTab === 'department-portal' && <GuardedDepartmentDashboardView />}
          {activeTab === 'ai-triage' && <GuardedAITriageView />}
          {activeTab === 'complaints' && <GuardedComplaintManagementView />}
          {activeTab === 'map' && <GuardedCityIncidentMapView />}
          {activeTab === 'sectors' && <GuardedSectorIntelligenceView />}
          {activeTab === 'analytics' && <GuardedAnalyticsView />}
          {activeTab === 'departments' && <GuardedDepartmentManagementView />}
          {activeTab === 'settings' && <GuardedSettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden sticky bottom-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-t border-[#223252] flex items-center justify-around py-2 px-1 text-[10px] font-mono">
        {effectiveRole === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('command-center')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'command-center' ? 'text-[#C6FF5F]' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </button>
        )}
        {(effectiveRole === 'CITIZEN' || effectiveRole === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('citizen-portal')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'citizen-portal' ? 'text-[#C6FF5F] font-bold' : 'text-slate-400'}`}
          >
            <User className="w-4 h-4" />
            <span>Citizen</span>
          </button>
        )}
        {(effectiveRole === 'DEPARTMENT_OFFICER' || effectiveRole === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('department-portal')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'department-portal' ? 'text-[#C6FF5F] font-bold' : 'text-slate-400'}`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dept</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('ai-triage')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'ai-triage' ? 'text-[#C6FF5F] font-bold' : 'text-slate-400'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Triage</span>
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'complaints' ? 'text-[#C6FF5F]' : 'text-slate-400'}`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-[#C6FF5F]' : 'text-slate-400'}`}
        >
          <MapPin className="w-4 h-4" />
          <span>Map</span>
        </button>
      </div>

      {/* Global Incident Details Modal */}
      <ComplaintDetailModal />

      {/* Global Login / Role Gateway Modal */}
      <LoginModal />

      {/* Multi-turn Gemini AI Assistant Chat Drawer */}
      <CivicAssistantChat isOpen={isChatOpen} onToggleOpen={setIsChatOpen} />
    </div>
  );
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [quotaBannerDismissed, setQuotaBannerDismissed] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapsQuotaExceeded(true);
      setQuotaBannerDismissed(false);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <FirebaseErrorBoundary>
      {mapsQuotaExceeded && !quotaBannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-3">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button
            type="button"
            onClick={() => setQuotaBannerDismissed(true)}
            className="text-amber-900/70 hover:text-amber-950 font-bold text-xs px-1.5"
            aria-label="Dismiss quota notice"
          >
            ✕
          </button>
        </div>
      )}
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        libraries={['places', 'marker']}
        language="en"
        region="IN"
      >
        <AppProvider>
          <MainContent />
        </AppProvider>
      </APIProvider>
    </FirebaseErrorBoundary>
  );
}

