import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_SCENARIOS, DemoScenario } from '../../data/demoScenarios';
import { AIAnalysisResult } from '../../types';
import { 
  Sparkles, 
  Camera, 
  MapPin, 
  Globe, 
  Mic, 
  MicOff, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  ArrowRight, 
  Ticket, 
  RefreshCw, 
  Zap, 
  Send,
  Eye,
  FileCheck2,
  SlidersHorizontal
} from 'lucide-react';
import { LiveLocationPicker } from '../map/LiveLocationPicker';

export const AITriageView: React.FC = () => {
  const { 
    addComplaint, 
    setActiveTab, 
    setSelectedComplaintForDetails,
    activeDemoScenarioId, 
    setActiveDemoScenarioId,
    currentUser,
    setIsLoginModalOpen
  } = useApp();

  // Form State
  const [complaintText, setComplaintText] = useState('');
  const [language, setLanguage] = useState('English');
  const [ward, setWard] = useState('Ward 8');
  const [locationName, setLocationName] = useState('Sankey Tank Crossroad, Ward 8');
  const [coordinates, setCoordinates] = useState<[number, number]>([13.0068, 77.5755]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [citizenName, setCitizenName] = useState(
    currentUser.isAuthenticated ? currentUser.name : 'Rajesh Sharma'
  );
  const [manualSectorId, setManualSectorId] = useState<string>('');

  // AI Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const processingSteps = [
    'Understanding citizen report & semantic intent',
    'Detecting language and extracting spatial-temporal entities',
    'Classifying across 18 Civic Sectors matrix',
    'Assessing structural severity & public safety threat',
    'Routing to responsible municipal department',
    'Computing algorithmic priority score (0-100)'
  ];

  // If activeDemoScenarioId is set from navbar or elsewhere, auto-load scenario
  useEffect(() => {
    if (activeDemoScenarioId) {
      const scenario = DEMO_SCENARIOS.find(s => s.id === activeDemoScenarioId);
      if (scenario) {
        loadScenario(scenario);
      }
      setActiveDemoScenarioId(null);
    }
  }, [activeDemoScenarioId]);

  const loadScenario = (scenario: DemoScenario) => {
    setComplaintText(scenario.text);
    setLanguage(scenario.language);
    setWard(scenario.ward);
    setLocationName(scenario.locationName);
    setCoordinates(scenario.coordinates);
    setSelectedImage(scenario.sampleImage || null);
    setCreatedTicketId(null);
    setAnalysisResult(null);

    // Auto-trigger analysis for demo convenience
    setTimeout(() => {
      runAIProcessing(scenario.text, scenario.expectedSectorId, scenario.language);
    }, 350);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setComplaintText('A large tree has fallen across the road and is blocking vehicles. People are unable to pass.');
    }, 2400);
  };

  const runAIProcessing = async (
    textToAnalyze: string, 
    sectorOverride?: string, 
    langOverride?: string
  ) => {
    if (!textToAnalyze.trim()) return;

    setIsProcessing(true);
    setProcessingStep(0);
    setAnalysisResult(null);
    setTriageError(null);
    setCreatedTicketId(null);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < processingSteps.length) {
        setProcessingStep(currentStep);
      }
    }, 350);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          manualSectorId: sectorOverride || (manualSectorId || undefined),
          language: langOverride || language,
          ward,
          locationName,
        }),
      });

      const data = (await response.json()) as AIAnalysisResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `AI Triage request failed (${response.status}).`);
      }

      clearInterval(interval);
      setProcessingStep(processingSteps.length - 1);
      setAnalysisResult(data);
      setIsProcessing(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      clearInterval(interval);
      setIsProcessing(false);
      setTriageError(err instanceof Error ? err.message : 'Unable to analyze complaint with Gemini AI.');
    }
  };

  const handleAnalyzeClick = () => {
    runAIProcessing(complaintText);
  };

  const handleCreateTicket = () => {
    if (!analysisResult) return;
    if (!currentUser.isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    const newTicket = addComplaint({
      title: complaintText.slice(0, 65) + (complaintText.length > 65 ? '...' : ''),
      description: complaintText,
      sectorId: analysisResult.detectedSectorId,
      sectorName: analysisResult.detectedSectorName,
      sectorIcon: analysisResult.sectorIcon,
      severity: analysisResult.severity,
      priorityScore: analysisResult.priorityScore,
      department: analysisResult.responsibleDepartment,
      status: 'New',
      ward: ward,
      locationName: locationName,
      coordinates: coordinates,
      citizenName: currentUser.name || citizenName,
      language: analysisResult.detectedLanguage,
      imageUrl: selectedImage || undefined,
      aiReasoning: analysisResult.aiReasoning,
      recommendedAction: analysisResult.recommendedAction,
      assignedTeam: `${analysisResult.responsibleDepartment.split(' ')[0]} Rapid Taskforce 1`,
      slaHours: analysisResult.severity === 'CRITICAL' ? 2 : analysisResult.severity === 'HIGH' ? 6 : 24,
      timeRemaining: analysisResult.severity === 'CRITICAL' ? '1h 59m' : '5h 45m'
    });

    setCreatedTicketId(newTicket.id);
  };

  const handleResetForm = () => {
    setComplaintText('');
    setAnalysisResult(null);
    setCreatedTicketId(null);
    setSelectedImage(null);
    setManualSectorId('');
  };

  // Preset sample images
  const samplePresets = [
    { label: 'Fallen Tree', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80' },
    { label: 'Deep Pothole', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80' },
    { label: 'Water Leak', url: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&auto=format&fit=crop&q=80' },
    { label: 'Open Drain', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80' },
    { label: 'Power Sparks', url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80' },
    { label: 'Lake Foam', url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#16223B] to-[#121A2B] border border-[#223252] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#C6FF5F]/20 text-[#C6FF5F] text-xs font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              THE STAR FEATURE
            </span>
            <span className="text-xs font-mono text-slate-400">18-Sector Real-Time NLP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Complaint Triage
          </h1>
          <p className="text-sm text-[#8E9EB8] max-w-2xl mt-1">
            Instant semantic classification across 18 civic sectors, multi-factor severity assessment, and automated municipal department routing.
          </p>
        </div>

        {/* Quick Demo Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 w-full sm:w-auto">Quick Pre-fills:</span>
          {DEMO_SCENARIOS.slice(0, 3).map((sc) => (
            <button
              key={sc.id}
              onClick={() => loadScenario(sc)}
              className="px-2.5 py-1.5 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-medium text-slate-200 hover:text-[#C6FF5F] transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-[#C6FF5F]" />
              <span>{sc.name.split(':')[1]?.trim() || sc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Column & Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Complaint Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#223252] space-y-5">
            <div className="flex items-center justify-between border-b border-[#223252] pb-3">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                  Report a Civic Issue
                </h2>
                <p className="text-xs text-[#8E9EB8]">
                  Tell us what's happening in your neighbourhood.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5 bg-[#0B1020] px-2.5 py-1.5 rounded-lg border border-[#223252] text-xs font-mono text-slate-300">
                <Globe className="w-3.5 h-3.5 text-[#43D9FF]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="English" className="bg-[#121A2B]">English</option>
                  <option value="Hindi (हिंदी)" className="bg-[#121A2B]">Hindi (हिंदी)</option>
                  <option value="Tamil (தமிழ்)" className="bg-[#121A2B]">Tamil (தமிழ்)</option>
                  <option value="Kannada (ಕನ್ನಡ)" className="bg-[#121A2B]">Kannada (ಕನ್ನಡ)</option>
                  <option value="Spanish (Español)" className="bg-[#121A2B]">Spanish (Español)</option>
                </select>
              </div>
            </div>

            {/* Complaint Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                  <span>Describe the issue in detail</span>
                  <span className="text-[#FF4D5E]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Voice recording button */}
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isRecording}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      isRecording 
                        ? 'bg-red-500/20 text-[#FF4D5E] border border-red-500/40 animate-pulse' 
                        : 'bg-[#18233B] text-slate-400 hover:text-white border border-[#223252]'
                    }`}
                  >
                    {isRecording ? <Mic className="w-3 h-3 text-[#FF4D5E]" /> : <MicOff className="w-3 h-3" />}
                    <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-500">
                    {complaintText.length} chars
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe the issue... (e.g., A large pothole has developed near the main junction. Vehicles are swerving around it into oncoming traffic and a bike nearly crashed...)"
                  rows={4}
                  className="w-full p-4 rounded-xl bg-[#0B1020] border border-[#223252] focus:border-[#C6FF5F] focus:ring-1 focus:ring-[#C6FF5F] text-sm text-slate-100 placeholder-slate-500 transition-all font-sans resize-none"
                />
                {complaintText && (
                  <button 
                    onClick={() => setComplaintText('')}
                    className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-300 text-xs"
                    title="Clear text"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Demo Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Quick Try Prompts:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'A large tree has fallen across the road and is blocking vehicles.',
                  'Water pipeline burst flooding arterial junction with high pressure.',
                  'Open manhole cover missing on 5th cross during evening rain.'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setComplaintText(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#16223B] border border-[#243354] text-slate-300 hover:text-[#C6FF5F] hover:border-[#C6FF5F]/30 transition-all text-left"
                  >
                    "{prompt.slice(0, 38)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Live Location Map Picker & Ward */}
            <div className="space-y-3 pt-2">
              <LiveLocationPicker
                coordinates={coordinates}
                locationName={locationName}
                onLocationChange={(nextCoords, resolvedAddress, wardHint) => {
                  setCoordinates(nextCoords);
                  if (resolvedAddress) {
                    setLocationName(resolvedAddress);
                  }
                  if (wardHint) {
                    setWard(wardHint);
                  }
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF9B42]" />
                    <span>Ward Jurisdiction</span>
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#43D9FF]"
                  >
                    {Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`).map(w => (
                      <option key={w} value={w} className="bg-[#121A2B]">{w}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <span>Street / Landmark</span>
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Indiranagar 100ft Road"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-[#223252] text-xs text-slate-200 focus:outline-none focus:border-[#43D9FF]"
                  />
                </div>
              </div>
            </div>

            {/* Photo Attachment & Presets */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#C6FF5F]" />
                  <span>Attach Photographic Evidence</span>
                </label>
                {selectedImage && (
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-[11px] text-[#FF4D5E] hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden border border-[#2C416A] h-40 bg-[#0B1020]">
                  <img
                    src={selectedImage}
                    alt="Complaint Evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#C6FF5F]" />
                    <span>Visual Evidence Attached</span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#2C416A] rounded-xl p-3 bg-[#0B1020]/50 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1">
                    <UploadCloud className="w-4 h-4 text-[#43D9FF]" />
                    <span>Select a photo preset or paste image link</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {samplePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(preset.url)}
                        className="p-1 rounded bg-[#18233B] hover:bg-[#243354] border border-[#223252] text-[10px] font-mono text-slate-300 truncate hover:text-[#C6FF5F] transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: ANALYZE WITH CIVICLENS AI */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={isProcessing || !complaintText.trim()}
                className={`w-full py-3.5 px-6 rounded-xl font-bold font-mono tracking-wider uppercase text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  isProcessing || !complaintText.trim()
                    ? 'bg-[#18233B] text-slate-500 cursor-not-allowed border border-[#223252]'
                    : 'bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] hover:shadow-[#C6FF5F]/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-[#0B1020] animate-spin" />
                    <span>EXECUTING NEURAL TRIAGE PIPELINE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#0B1020]" />
                    <span>ANALYZE WITH CIVICLENS AI →</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Processing Animation OR Results Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6" ref={resultsRef}>
          
          {/* 1. If currently processing: Show AI Processing Animation */}
          {isProcessing && (
            <div className="glass-panel p-6 rounded-2xl border border-[#43D9FF]/40 space-y-6 shadow-2xl animate-in fade-in duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C6FF5F] via-[#43D9FF] to-[#FF4D5E] animate-pulse" />
              
              <div className="flex items-center justify-between border-b border-[#223252] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#43D9FF] animate-ping" />
                  <span className="font-mono text-xs uppercase font-bold text-white tracking-wider">
                    CIVICLENS INTELLIGENCE
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#C6FF5F] animate-pulse">
                  Analyzing complaint...
                </span>
              </div>

              {/* Sequential Steps List */}
              <div className="space-y-3 font-mono text-xs">
                {processingSteps.map((step, idx) => {
                  const isDone = idx < processingStep;
                  const isCurrent = idx === processingStep;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-3 transition-all duration-300 ${
                        isDone 
                          ? 'text-[#C6FF5F]' 
                          : isCurrent 
                            ? 'text-[#43D9FF] font-bold scale-[1.02]' 
                            : 'text-slate-600'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isDone ? (
                          <Check className="w-4 h-4 text-[#C6FF5F]" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-[#43D9FF] animate-spin" />
                        ) : (
                          <span className="w-4 h-4 flex items-center justify-center text-slate-600 text-[10px]">
                            ○
                          </span>
                        )}
                      </div>
                      <span className="leading-snug">{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>NEURAL INFERENCE</span>
                  <span>{Math.round(((processingStep + 1) / processingSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden border border-[#223252]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#43D9FF] to-[#C6FF5F] transition-all duration-300"
                    style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* 2. If Analysis complete: Show Blueprint AI Analysis Results Card */}
          {analysisResult && !isProcessing && (
            <div className="glass-panel p-6 rounded-2xl border border-[#2C416A] space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#223252] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C6FF5F]/20 flex items-center justify-center text-[#C6FF5F]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs uppercase font-extrabold text-white tracking-widest">
                    AI ANALYSIS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-[#C6FF5F] border border-[#C6FF5F]/30">
                    {analysisResult.confidenceScore}% CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Detected Sector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                  DETECTED SECTOR
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1020] border border-[#223252]">
                  <span className="text-2xl">{analysisResult.sectorIcon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {analysisResult.detectedSectorName}
                    </h3>
                    <p className="text-[11px] text-[#8E9EB8]">
                      Sector #{analysisResult.detectedSectorId} · Municipal Matrix
                    </p>
                  </div>
                </div>
              </div>

              {/* Severity & Priority Meter */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                    SEVERITY
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs pt-1">
                    {analysisResult.severity === 'CRITICAL' && (
                      <span className="inline-flex items-center gap-1 text-[#FF4D5E]">
                        🔴 CRITICAL
                      </span>
                    )}
                    {analysisResult.severity === 'HIGH' && (
                      <span className="inline-flex items-center gap-1 text-[#FF9B42]">
                        🟠 HIGH
                      </span>
                    )}
                    {analysisResult.severity === 'MEDIUM' && (
                      <span className="inline-flex items-center gap-1 text-[#FFD166]">
                        🟡 MEDIUM
                      </span>
                    )}
                    {analysisResult.severity === 'LOW' && (
                      <span className="inline-flex items-center gap-1 text-[#47D18C]">
                        🟢 LOW
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B1020] border border-[#223252] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                    ESTIMATED SLA
                  </span>
                  <div className="text-xs font-mono font-bold text-[#43D9FF] pt-1">
                    ⏱️ {analysisResult.estimatedSLA}
                  </div>
                </div>
              </div>

              {/* Priority Score Bar */}
              <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#223252] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold uppercase tracking-wider">
                    PRIORITY SCORE
                  </span>
                  <span className="text-[#C6FF5F] font-extrabold text-sm">
                    {analysisResult.priorityScore} / 100
                  </span>
                </div>
                <div className="w-full bg-[#18233B] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#223252]">
                  <div 
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-yellow-500 via-orange-500 to-[#FF4D5E]"
                    style={{ width: `${analysisResult.priorityScore}%` }}
                  />
                </div>
              </div>

              {/* Responsible Department */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                  RESPONSIBLE DEPARTMENT
                </span>
                <p className="text-xs font-semibold text-white bg-[#0B1020] p-2.5 rounded-lg border border-[#223252]">
                  {analysisResult.responsibleDepartment}
                </p>
              </div>

              {/* AI Reasoning */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                  AI REASONING
                </span>
                <div className="p-3 rounded-lg bg-[#162035]/60 border border-[#243354] text-xs text-slate-300 leading-relaxed italic">
                  "{analysisResult.aiReasoning}"
                </div>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB8]">
                  RECOMMENDED ACTION
                </span>
                <div className="p-3 rounded-lg bg-[#122421]/60 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed">
                  {analysisResult.recommendedAction}
                </div>
              </div>

              {/* CREATE TICKET ACTION */}
              {!createdTicketId ? (
                <button
                  type="button"
                  onClick={handleCreateTicket}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-extrabold font-mono text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#C6FF5F]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-[#0B1020]" />
                  <span>[ CREATE TICKET ]</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                    <CheckCircle className="w-4 h-4" />
                    <span>TICKET GENERATED: {createdTicketId}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Incident queued into Command Center priority queue. Field crews notified via automated radio dispatch.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('command-center')}
                      className="px-3 py-2 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-[#C6FF5F] text-center"
                    >
                      Priority Queue →
                    </button>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="px-3 py-2 rounded-lg bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-xs font-mono text-[#43D9FF] text-center"
                    >
                      Locate on Map →
                    </button>
                  </div>
                  <button
                    onClick={handleResetForm}
                    className="w-full py-1 text-center text-[11px] font-mono text-slate-400 hover:text-white pt-1"
                  >
                    + Report Another Incident
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Triage API Error Banner */}
          {triageError && !isProcessing && (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-[#FF4D5E]/50 text-xs text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold text-[#FF4D5E]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>GEMINI AI TRIAGE ERROR</span>
              </div>
              <p className="text-slate-300">{triageError}</p>
            </div>
          )}

          {/* 3. Empty State when no analysis has run */}
          {!analysisResult && !isProcessing && (
            <div className="border border-dashed border-[#223252] rounded-2xl p-8 text-center space-y-4 bg-[#0B1020]/30">
              <div className="w-12 h-12 rounded-2xl bg-[#121A2B] border border-[#243354] mx-auto flex items-center justify-center text-[#43D9FF]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">
                  Awaiting Citizen Incident Report
                </h3>
                <p className="text-xs text-[#8E9EB8] max-w-sm mx-auto">
                  Type an issue or click any quick pre-fill to watch Gemini AI evaluate urgency, map to one of 18 sectors, and formulate municipal actions.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => loadScenario(DEMO_SCENARIOS[0])}
                  className="px-3 py-1.5 rounded-lg bg-[#121A2B] hover:bg-[#18233B] border border-[#2C416A] text-xs font-mono text-[#C6FF5F]"
                >
                  Load Fallen Tree Demo
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
