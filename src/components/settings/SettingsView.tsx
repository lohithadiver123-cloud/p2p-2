import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  Sliders, 
  RefreshCcw, 
  BellRing, 
  Save, 
  Check, 
  Database,
  Layers,
  Sparkles
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    complaints,
    platformSettings,
    savePlatformSettings,
    seedDemoComplaints,
    isFirestoreSynced,
    currentUser,
  } = useApp();
  const [modelAccuracy, setModelAccuracy] = useState(platformSettings.modelAccuracy);
  const [autoDispatch, setAutoDispatch] = useState(platformSettings.autoDispatch);
  const [criticalSLAHours, setCriticalSLAHours] = useState(platformSettings.criticalSLAHours);
  const [highSLAHours, setHighSLAHours] = useState(platformSettings.highSLAHours);
  const [notificationSound, setNotificationSound] = useState(platformSettings.notificationSound);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async () => {
    await savePlatformSettings({
      modelAccuracy,
      autoDispatch,
      criticalSLAHours,
      highSLAHours,
      notificationSound,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleReloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#8E9EB8]/20 text-slate-300 text-xs font-mono font-bold flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              SYSTEM CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Settings & SLA Thresholds
          </h1>
          <p className="text-sm text-[#8E9EB8] mt-1">
            Configure the neural classification engine, SLA breach monitors, and telemetry feeds.
          </p>
        </div>

        <button
          onClick={() => void handleSave()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-bold text-xs font-mono uppercase tracking-wider hover:scale-[1.02] transition-all shadow-lg"
        >
          {savedToast ? <Check className="w-4 h-4 text-[#0B1020]" /> : <Save className="w-4 h-4 text-[#0B1020]" />}
          <span>{savedToast ? 'SETTINGS SAVED!' : 'SAVE SETTINGS'}</span>
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        
        {/* Section 1: AI Triage Engine */}
        <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#223252] pb-3">
            <Cpu className="w-4 h-4 text-[#C6FF5F]" />
            <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wider">
              CivicLens Neural Triage Engine
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">18-Sector Matrix Dynamic Inference</div>
                <div className="text-[#8E9EB8]">Semantic routing across roads, water, waste, electrical and 14 other municipal sectors.</div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ENABLED (18/18)
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#223252]/60">
              <div>
                <div className="font-semibold text-slate-200">Automated Dispatch Trigger</div>
                <div className="text-[#8E9EB8]">Auto-assigns field teams immediately when priority score &ge; 90.</div>
              </div>
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                className="w-4 h-4 accent-[#C6FF5F] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#223252]/60">
              <div>
                <div className="font-semibold text-slate-200">Classification Precision Tier</div>
                <div className="text-[#8E9EB8]">Inference threshold for low-confidence citizen submissions.</div>
              </div>
              <select
                value={modelAccuracy}
                onChange={(e) => setModelAccuracy(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#223252] text-xs font-mono text-slate-200 focus:outline-none"
              >
                <option value="High (98.4%)">High (98.4% target)</option>
                <option value="Balanced (92%)">Balanced (92% target)</option>
                <option value="Experimental (99%)">Experimental (99% target)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: SLA Breach Configuration */}
        <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#223252] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#FF4D5E]" />
            <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wider">
              SLA Thresholds & Escalation Window
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>🔴 CRITICAL SLA TARGET</span>
                <span className="text-[#FF4D5E]">{criticalSLAHours} Hours</span>
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={criticalSLAHours}
                onChange={(e) => setCriticalSLAHours(Number(e.target.value))}
                className="w-full accent-[#FF4D5E] cursor-pointer"
              />
              <p className="text-[11px] text-[#8E9EB8]">
                Mandatory resolution window before escalation to Department Commissioner.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>🟠 HIGH SEVERITY SLA TARGET</span>
                <span className="text-[#FF9B42]">{highSLAHours} Hours</span>
              </label>
              <input
                type="range"
                min={2}
                max={24}
                value={highSLAHours}
                onChange={(e) => setHighSLAHours(Number(e.target.value))}
                className="w-full accent-[#FF9B42] cursor-pointer"
              />
              <p className="text-[11px] text-[#8E9EB8]">
                Standard operational window for potholes, signal outages, and waste spills.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Data Management */}
        <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#223252] pb-3">
            <Database className="w-4 h-4 text-[#43D9FF]" />
            <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wider">
              Firebase Firestore & Seed Management
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-200">
                Current Queue Size ({isFirestoreSynced ? 'Synced with Firestore' : 'Local Preview'})
              </div>
              <div className="text-[#8E9EB8]">
                Currently managing {complaints.length} tickets across 18 sectors.
                {!currentUser.isAuthenticated && ' Sign in with Google to persist changes.'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.isAuthenticated && (
                <button
                  onClick={() => void seedDemoComplaints()}
                  className="px-3 py-1.5 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#C6FF5F]/40 text-xs font-mono text-[#C6FF5F] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Demo Incidents</span>
                </button>
              )}
              <button
                onClick={handleReloadPage}
                className="px-3 py-1.5 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-[#43D9FF] flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
