import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_SCENARIOS } from '../../data/demoScenarios';
import { 
  ShieldAlert, 
  Bell, 
  PlusCircle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  User,
  Building2,
  Lock,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    setActiveTab, 
    notifications, 
    clearAllNotifications,
    setActiveDemoScenarioId,
    setSelectedComplaintForDetails,
    complaints,
    currentUser,
    verifiedRole,
    customClaims,
    isFirestoreSynced,
    signInWithGoogle,
    logout,
    setIsLoginModalOpen,
    loginAs
  } = useApp();
  const effectiveRole = customClaims.admin ? 'ADMIN' : customClaims.role || verifiedRole;

  const [time, setTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDemo = (scenarioId: string) => {
    setActiveDemoScenarioId(scenarioId);
    setActiveTab('ai-triage');
    setShowDemoMenu(false);
  };

  const handleNotificationClick = (ticketId?: string) => {
    if (ticketId) {
      const comp = complaints.find(c => c.id === ticketId);
      if (comp) {
        setSelectedComplaintForDetails(comp);
      }
    }
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1020]/90 backdrop-blur-md border-b border-[#223252] px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand & System Status */}
        <div className="flex items-center gap-3.5">
          <div 
            onClick={() =>
              setActiveTab(
                effectiveRole === 'ADMIN'
                  ? 'command-center'
                  : effectiveRole === 'DEPARTMENT_OFFICER'
                    ? 'department-portal'
                    : 'citizen-portal'
              )
            }
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#121A2B] to-[#1E2C4A] border border-[#2C416A] flex items-center justify-center text-[#C6FF5F] shadow-lg group-hover:border-[#C6FF5F]/50 transition-all">
              <ShieldAlert className="w-5 h-5 text-[#C6FF5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CIVIC<span className="text-[#C6FF5F]">LENS</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-[#C6FF5F] border border-[#C6FF5F]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF5F] animate-ping" />
                  {isFirestoreSynced ? 'FIREBASE LIVE' : 'LIVE SYSTEM'}
                </span>
              </div>
              <p className="text-[10px] tracking-widest uppercase font-mono text-[#8E9EB8] hidden sm:block">
                AI Civic Intelligence & Incident Management
              </p>
            </div>
          </div>
        </div>

        {/* Center: Demo Scenarios Quick Launcher */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121A2B] border border-[#2C416A] hover:border-[#43D9FF] text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#43D9FF] animate-pulse" />
              <span>Demo Scenarios</span>
              <span className="bg-[#43D9FF]/20 text-[#43D9FF] text-[10px] font-mono px-1.5 py-0.2 rounded">
                6 Scenarios
              </span>
            </button>

            {showDemoMenu && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#121A2B] border border-[#2C416A] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 border-b border-[#223252] flex items-center justify-between text-[11px] font-mono text-[#8E9EB8]">
                  <span>SELECT SCENARIO FOR DEMO</span>
                  <span className="text-[#C6FF5F]">Auto-fills AI Triage</span>
                </div>
                <div className="py-1 space-y-1">
                  {DEMO_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectDemo(sc.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#1B2844] transition-colors flex flex-col gap-0.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-100 group-hover:text-[#C6FF5F]">
                          {sc.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#243354] text-slate-300">
                          {sc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{sc.tagline}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Role Switcher, Notifications, Report Button */}
        <div className="flex items-center gap-2.5">
          
          {/* Active User / Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#121A2B] border border-[#2C416A] hover:border-[#C6FF5F] text-xs font-mono transition-all"
            >
              <div className="w-5 h-5 rounded-md bg-[#18233B] flex items-center justify-center text-xs overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser.role === 'CITIZEN' ? (
                  <User className="w-3.5 h-3.5 text-[#C6FF5F]" />
                ) : currentUser.role === 'DEPARTMENT_OFFICER' ? (
                  <Building2 className="w-3.5 h-3.5 text-[#43D9FF]" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-[11px] font-bold text-white truncate max-w-[140px]">
                  {currentUser.role === 'CITIZEN' ? 'Citizen Portal' : 
                   currentUser.role === 'DEPARTMENT_OFFICER' ? (currentUser.departmentName?.split(' ')[0] || 'Dept Officer') : 
                   'City Admin'}
                </div>
                <div className="text-[9px] text-[#8E9EB8] truncate max-w-[140px]">
                  {currentUser.isAuthenticated ? currentUser.name : 'Sign in with Google'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#121A2B] border border-[#2C416A] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-150 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-[#223252] text-[10px] font-mono text-[#8E9EB8] uppercase">
                  {currentUser.isAuthenticated ? `VERIFIED: ${effectiveRole}` : 'AUTHENTICATION REQUIRED'}
                </div>

                {verifiedRole === 'ADMIN' && currentUser.isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { loginAs('CITIZEN'); setShowUserMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between ${
                        currentUser.role === 'CITIZEN' ? 'bg-[#18233B] text-[#C6FF5F] font-bold' : 'hover:bg-[#162035] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#C6FF5F]" />
                        <span>Preview Citizen Portal</span>
                      </div>
                      {currentUser.role === 'CITIZEN' && <span className="text-[10px]">● Active</span>}
                    </button>

                    <button
                      onClick={() => { loginAs('DEPARTMENT_OFFICER', 'dept-trees'); setShowUserMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between ${
                        currentUser.role === 'DEPARTMENT_OFFICER' && currentUser.departmentId === 'dept-trees' ? 'bg-[#18233B] text-[#43D9FF] font-bold' : 'hover:bg-[#162035] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#43D9FF]" />
                        <span>Preview Horticulture Dept</span>
                      </div>
                      {currentUser.role === 'DEPARTMENT_OFFICER' && currentUser.departmentId === 'dept-trees' && <span className="text-[10px]">● Active</span>}
                    </button>

                    <button
                      onClick={() => { loginAs('DEPARTMENT_OFFICER', 'dept-roads'); setShowUserMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between ${
                        currentUser.role === 'DEPARTMENT_OFFICER' && currentUser.departmentId === 'dept-roads' ? 'bg-[#18233B] text-[#FF9B42] font-bold' : 'hover:bg-[#162035] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#FF9B42]" />
                        <span>Preview Roads Dept</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { loginAs('DEPARTMENT_OFFICER', 'dept-water'); setShowUserMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between ${
                        currentUser.role === 'DEPARTMENT_OFFICER' && currentUser.departmentId === 'dept-water' ? 'bg-[#18233B] text-[#3B82F6] font-bold' : 'hover:bg-[#162035] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Preview Water Board Dept</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { loginAs('ADMIN'); setShowUserMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between ${
                        currentUser.role === 'ADMIN' ? 'bg-[#18233B] text-white font-bold' : 'hover:bg-[#162035] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>City Operations Admin</span>
                      </div>
                      {currentUser.role === 'ADMIN' && <span className="text-[10px]">● Active</span>}
                    </button>
                  </>
                ) : (
                  <div className="px-2.5 py-2 text-[11px] text-slate-300 space-y-1">
                    <div className="truncate font-semibold text-white">
                      {currentUser.isAuthenticated ? currentUser.name : 'Not Signed In'}
                    </div>
                    {currentUser.isAuthenticated && (
                      <div className="text-[10px] font-mono text-[#8E9EB8] truncate">
                        {currentUser.departmentName || currentUser.email}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1 border-t border-[#223252] space-y-1">
                  {!currentUser.isAuthenticated ? (
                    <button
                      onClick={() => { void signInWithGoogle(); setShowUserMenu(false); }}
                      className="w-full text-left p-2 rounded-lg text-[11px] font-mono text-[#C6FF5F] hover:bg-[#18233B] flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Sign in with Google →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { void logout(); setShowUserMenu(false); }}
                      className="w-full text-left p-2 rounded-lg text-[11px] font-mono text-[#FF4D5E] hover:bg-[#18233B] flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Sign Out →</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setIsLoginModalOpen(true); setShowUserMenu(false); }}
                    className="w-full text-left p-2 rounded-lg text-[11px] font-mono text-slate-300 hover:bg-[#18233B] flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Open Access Gateway →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-[#121A2B] border border-[#223252] hover:border-[#2C416A] text-slate-300 hover:text-white transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4D5E] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-[#121A2B] border border-[#2C416A] rounded-xl shadow-2xl z-50 p-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#223252] text-xs font-semibold text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#C6FF5F]" />
                    <span>Real-Time Incident Notifications</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-400 hover:text-[#FF4D5E] transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No active operational notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 cursor-pointer hover:bg-[#1B2844] ${
                          n.type === 'critical' 
                            ? 'bg-red-950/20 border-red-500/30 text-red-200' 
                            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        }`}
                        onClick={() => handleNotificationClick(n.ticketId)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100 flex items-center gap-1">
                            {n.type === 'critical' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D5E]" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF5F]" />
                            )}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Star Action: + REPORT INCIDENT */}
          <button
            onClick={() => setActiveTab('ai-triage')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold text-xs shadow-lg shadow-[#C6FF5F]/20 hover:shadow-[#C6FF5F]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#0B1020]" />
            <span className="tracking-wide uppercase font-mono">+ REPORT INCIDENT</span>
          </button>
        </div>

      </div>
    </header>
  );
};
