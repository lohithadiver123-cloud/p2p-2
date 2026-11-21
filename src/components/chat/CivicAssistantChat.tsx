import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  Bot,
  Building2,
  Check,
  Copy,
  Lock,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

export type ChatPersonaId = 'citizen-guide' | 'dispatch-advisor' | 'policy-analyst';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  personaId?: ChatPersonaId;
  modelLabel?: string;
  isStreaming?: boolean;
}

interface PersonaConfig {
  id: ChatPersonaId;
  label: string;
  title: string;
  modelBadge: string;
}

const ADMIN_PERSONAS: PersonaConfig[] = [
  {
    id: 'dispatch-advisor',
    label: 'Dispatch Advisor',
    title: 'City Operations Advisor',
    modelBadge: 'gemini-4-hydrogen',
  },
  {
    id: 'policy-analyst',
    label: 'Root-Cause Analyst',
    title: 'Civic Policy & SLA Analyst',
    modelBadge: 'gemini-4-hydrogen',
  },
  {
    id: 'citizen-guide',
    label: 'Citizen Desk',
    title: 'Citizen Help Desk',
    modelBadge: 'gemini-3.1-flash-lite',
  },
];

// Safe inline bold/bullet renderer without raw HTML injection
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');

  const formatInline = (line: string, lineIdx: number) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    return segments.map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
        return (
          <strong key={`${lineIdx}-${idx}`} className="font-semibold text-[#181E2E]">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={`${lineIdx}-${idx}`}>{seg}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, idx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#7C6EE6] shrink-0" />
              <span className="flex-1">{formatInline(bulletMatch[1], idx)}</span>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-[11px] font-semibold text-[#5B4DC9] shrink-0 tabular-nums mt-0.5">
                {numberedMatch[1]}
              </span>
              <span className="flex-1">{formatInline(numberedMatch[2], idx)}</span>
            </div>
          );
        }

        return <p key={idx}>{formatInline(trimmed, idx)}</p>;
      })}
    </div>
  );
}

interface CivicAssistantChatProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export const CivicAssistantChat: React.FC<CivicAssistantChatProps> = ({
  isOpen,
  onToggleOpen,
}) => {
  const {
    complaints,
    stats,
    currentUser,
    verifiedRole,
    verifiedDepartmentId,
    customClaims,
    departments,
    signInWithGoogle,
    authLoading,
    refreshAuthClaims,
  } = useApp();

  const effectiveRole =
    customClaims.admin === true ? 'ADMIN' : customClaims.role || verifiedRole || 'CITIZEN';
  const assignedDeptId = customClaims.departmentId || verifiedDepartmentId;
  const assignedDept = assignedDeptId
    ? departments.find((d) => d.id === assignedDeptId)
    : undefined;

  const isOfficerMissingDept = effectiveRole === 'DEPARTMENT_OFFICER' && !assignedDept;

  // Role-locked persona configuration
  const allowedPersonas: PersonaConfig[] = useMemo(() => {
    if (effectiveRole === 'ADMIN') return ADMIN_PERSONAS;
    if (effectiveRole === 'DEPARTMENT_OFFICER') {
      return [
        {
          id: 'dispatch-advisor',
          label: 'Bureau Dispatch',
          title: assignedDept ? `${assignedDept.name.split('/')[0].trim()} Assistant` : 'Department Assistant',
          modelBadge: 'gemini-4-hydrogen',
        },
      ];
    }
    return [
      {
        id: 'citizen-guide',
        label: 'Citizen Desk',
        title: 'Citizen Help Desk',
        modelBadge: 'gemini-3.1-flash-lite',
      },
    ];
  }, [effectiveRole, assignedDept]);

  const [adminPersonaChoice, setAdminPersonaChoice] = useState<ChatPersonaId>('dispatch-advisor');
  const selectedPersonaId: ChatPersonaId =
    effectiveRole === 'ADMIN' ? adminPersonaChoice : allowedPersonas[0].id;

  const activePersona =
    allowedPersonas.find((p) => p.id === selectedPersonaId) || allowedPersonas[0];

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevRoleKeyRef = useRef<string>(`${effectiveRole}:${assignedDeptId || ''}`);

  // Reset thread when signed-in role or assigned bureau changes so role boundaries never leak
  useEffect(() => {
    const nextKey = `${effectiveRole}:${assignedDeptId || ''}`;
    if (prevRoleKeyRef.current !== nextKey) {
      prevRoleKeyRef.current = nextKey;
      abortControllerRef.current?.abort();
      setMessages([]);
      setChatError(null);
      setIsSending(false);
    }
  }, [effectiveRole, assignedDeptId]);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Scoped complaints & metrics strictly matched to login role
  const scopedData = useMemo(() => {
    if (effectiveRole === 'CITIZEN') {
      const ownComplaints = complaints.filter(
        (c) =>
          (currentUser.uid && c.reporterUid === currentUser.uid) ||
          (!c.reporterUid && currentUser.name && c.citizenName === currentUser.name)
      );
      const ownOpen = ownComplaints.filter((c) => c.status !== 'Resolved');
      const topOwn = ownOpen[0];

      const summary = [
        `Role: Citizen (${currentUser.name || 'Resident'})`,
        `Your Submitted Reports: ${ownComplaints.length} total, ${ownOpen.length} open`,
        topOwn
          ? `Latest Open Ticket: ${topOwn.id} (${topOwn.sectorName}, ${topOwn.ward}, Status: ${topOwn.status}, SLA: ${topOwn.timeRemaining || `${topOwn.slaHours}h`})`
          : 'No open reports currently filed under your account.',
      ].join(' | ');

      const starterPrompts = [
        topOwn
          ? `What is the SLA status and assigned department for my report ${topOwn.id}?`
          : 'How do I attach my live GPS location when submitting a complaint?',
        'Which municipal department handles a fallen tree blocking traffic?',
        'What response times apply to Critical, High, and Medium reports?',
      ];

      const briefIntro = topOwn
        ? `You have ${ownOpen.length} active ${ownOpen.length === 1 ? 'report' : 'reports'} in progress. Latest: ${topOwn.id} (${topOwn.sectorName}, ${topOwn.status}).`
        : 'Ready to help you identify the right municipal sector, capture live GPS coordinates, or check SLA timelines.';

      return { summary, starterPrompts, briefIntro, openCount: ownOpen.length };
    }

    if (effectiveRole === 'DEPARTMENT_OFFICER') {
      const deptComplaints = assignedDept
        ? complaints.filter((c) => assignedDept.sectorIds.includes(c.sectorId))
        : [];
      const openDept = deptComplaints
        .filter((c) => c.status !== 'Resolved')
        .sort((a, b) => b.priorityScore - a.priorityScore);
      const criticalDept = openDept.filter((c) => c.severity === 'CRITICAL');
      const topTicket = openDept[0];

      const topLines = openDept
        .slice(0, 6)
        .map(
          (c) =>
            `${c.id} [${c.severity}, Priority ${c.priorityScore}/100] ${c.title} (${c.ward}, Status: ${c.status}, SLA: ${c.timeRemaining || `${c.slaHours}h`})`
        )
        .join('; ');

      const summary = [
        `Role: Department Officer (${assignedDept?.name || 'Unassigned Bureau'})`,
        `Bureau Backlog: ${deptComplaints.length} total, ${openDept.length} open, ${criticalDept.length} critical`,
        topLines ? `Active Bureau Tickets: ${topLines}` : 'No open tickets in this bureau.',
      ].join(' | ');

      const starterPrompts = [
        topTicket
          ? `Draft a field crew dispatch checklist for ${topTicket.id} (${topTicket.title.slice(0, 42)}).`
          : `Prepare a standard rapid-response inspection checklist for ${assignedDept?.name || 'our bureau'}.`,
        `Prioritize the ${openDept.length} open tickets in ${assignedDept?.name || 'our bureau'} by SLA urgency.`,
        `Which wards have the highest open incident load for ${assignedDept?.name || 'our bureau'} right now?`,
      ];

      const briefIntro = assignedDept
        ? `${assignedDept.name}: ${openDept.length} open ${openDept.length === 1 ? 'ticket' : 'tickets'} (${criticalDept.length} critical).${topTicket ? ` Highest priority: ${topTicket.id} in ${topTicket.ward} (${topTicket.priorityScore}/100).` : ''}`
        : 'Waiting for a City Admin to assign your Department Bureau.';

      return { summary, starterPrompts, briefIntro, openCount: openDept.length };
    }

    // ADMIN: full cross-department visibility
    const openAll = complaints
      .filter((c) => c.status !== 'Resolved')
      .sort((a, b) => b.priorityScore - a.priorityScore);
    const topTicket = openAll[0];
    const topLines = openAll
      .slice(0, 7)
      .map(
        (c) =>
          `${c.id} [${c.severity}, ${c.priorityScore}/100] ${c.sectorName} -> ${c.department} (${c.ward}, ${c.status}, SLA: ${c.timeRemaining || `${c.slaHours}h`})`
      )
      .join('; ');

    const summary = [
      'Role: City Administrator (All 18 Municipal Sectors)',
      `City Metrics: ${stats.totalReports} total, ${stats.criticalCount} critical open, ${stats.highCount} high open, ${stats.resolvedCount} resolved (${stats.resolutionRate}% resolution rate, avg priority ${stats.avgPriorityScore}/100)`,
      topLines ? `Highest-Priority Open Incidents: ${topLines}` : 'No open incidents.',
    ].join(' | ');

    const starterPrompts =
      selectedPersonaId === 'policy-analyst'
        ? [
            'Identify recurring ward and sector hotspots from our active complaint queue.',
            'Recommend a cross-department preventive maintenance schedule for top risk sectors.',
            'How can we lift overall resolution rate above 85% across lagging sectors?',
          ]
        : selectedPersonaId === 'citizen-guide'
          ? [
              'How do I attach my live GPS location when submitting a complaint?',
              'Which municipal bureau handles a fallen tree blocking traffic?',
              'What response times apply to Critical, High, and Medium reports?',
            ]
          : [
              topTicket
                ? `Create an escalation plan for ${topTicket.id} (${topTicket.sectorName}, ${topTicket.ward}).`
                : 'Summarize today’s dispatch priorities across all departments.',
              `Review the ${stats.criticalCount} critical incidents and recommend crew allocation.`,
              'Which municipal departments currently carry the heaviest open SLA backlog?',
            ];

    const briefIntro = `City-wide view: ${openAll.length} active incidents across 18 sectors (${stats.criticalCount} critical, ${stats.resolutionRate}% resolved).`;

    return { summary, starterPrompts, briefIntro, openCount: openAll.length };
  }, [
    effectiveRole,
    complaints,
    currentUser.uid,
    currentUser.name,
    assignedDept,
    stats,
    selectedPersonaId,
  ]);

  // Soft pastel theme tokens by verified role
  const roleTheme = useMemo(() => {
    if (effectiveRole === 'CITIZEN') {
      return {
        roleLabel: 'Citizen',
        badgeIcon: User,
        headerBg: 'bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF9] to-[#EFF6FF]',
        headerBorder: 'border-[#CBEAD8]',
        iconBox: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
        userBubble: 'bg-[#DCFCE7] border-[#B7EBD0] text-[#113A29]',
        sendBtn: 'bg-[#A7E8CB] hover:bg-[#8EDFC0] text-[#0E3A28]',
        fabClass:
          'from-[#DCFCE7] via-[#E0F2FE] to-[#EDE9FE] text-[#1E2433] border-[#B7EBD0]',
      };
    }
    if (effectiveRole === 'DEPARTMENT_OFFICER') {
      return {
        roleLabel: assignedDept ? assignedDept.name.split('/')[0].trim() : 'Dept Officer',
        badgeIcon: Building2,
        headerBg: 'bg-gradient-to-r from-[#EFF6FF] via-[#F0F7FF] to-[#EEF2FF]',
        headerBorder: 'border-[#CFE0FA]',
        iconBox: 'bg-[#DBEAFE] text-[#1E3A8A] border-[#BFDBFE]',
        userBubble: 'bg-[#DBEAFE] border-[#BFDBFE] text-[#172E61]',
        sendBtn: 'bg-[#A5C8FF] hover:bg-[#8FB9FF] text-[#13295B]',
        fabClass:
          'from-[#DBEAFE] via-[#E0E7FF] to-[#EDE9FE] text-[#1E2433] border-[#BFDBFE]',
      };
    }
    return {
      roleLabel: 'City Admin',
      badgeIcon: ShieldCheck,
      headerBg: 'bg-gradient-to-r from-[#F5F3FF] via-[#F0F4FF] to-[#FDF2F8]',
      headerBorder: 'border-[#DDD6FE]',
      iconBox: 'bg-[#EDE9FE] text-[#4C1D95] border-[#DDD6FE]',
      userBubble: 'bg-[#E9E3FF] border-[#D5CAFC] text-[#2B1863]',
      sendBtn: 'bg-[#C4B5FD] hover:bg-[#B49FFB] text-[#261459]',
      fabClass:
        'from-[#EDE9FE] via-[#E0E7FF] to-[#FCE7F3] text-[#1E2433] border-[#DDD6FE]',
    };
  }, [effectiveRole, assignedDept]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleResetChat = () => {
    abortControllerRef.current?.abort();
    setIsSending(false);
    setChatError(null);
    setMessages([]);
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending || !currentUser.isAuthenticated || isOfficerMissingDept) return;

    setChatError(null);
    setInputValue('');
    setIsSending(true);

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowLabel,
    };

    const assistantMsgId = `model-${Date.now() + 1}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      text: '',
      timestamp: nowLabel,
      personaId: selectedPersonaId,
      modelLabel: activePersona.modelBadge,
      isStreaming: true,
    };

    const historyPayload = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          roleId: selectedPersonaId,
          userRole: effectiveRole,
          departmentName: assignedDept?.name || '',
          contextSummary: scopedData.summary,
        }),
      });

      if (!response.ok) {
        let errMessage = `Chat request failed (${response.status}).`;
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errMessage = errJson.error;
        } catch {
          // ignore parse error
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('Streaming response body unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            const parsed = JSON.parse(jsonStr) as {
              text?: string;
              done?: boolean;
              error?: string;
              model?: string;
            };

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: accumulatedText } : m
                )
              );
            }

            if (parsed.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        modelLabel: parsed.model || m.modelLabel,
                      }
                    : m
                )
              );
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: m.text || 'Unable to generate a response. Please try again.',
                isStreaming: false,
              }
            : m
        )
      );
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      const errText = err instanceof Error ? err.message : 'Failed to get response from Gemini.';
      setChatError(errText);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputValue);
    }
  };

  const RoleBadgeIcon = roleTheme.badgeIcon;
  const fabLabel = !currentUser.isAuthenticated
    ? 'Sign in for AI Assistant'
    : activePersona.title;

  return (
    <>
      {/* Pastel Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          className={`fixed bottom-16 md:bottom-6 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r ${roleTheme.fabClass} border font-semibold text-xs shadow-xl shadow-slate-950/25 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap shrink-0`}
          aria-label="Open role-based CivicLens AI assistant"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>{fabLabel}</span>
        </button>
      )}

      {/* Pastel Role-Scoped Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-[#FAF9F7] text-[#1E2433] border border-[#E5E0EE] shadow-2xl shadow-slate-950/35 rounded-2xl overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'inset-4 md:inset-8 lg:left-auto lg:right-6 lg:top-6 lg:bottom-6 lg:w-[660px]'
              : 'bottom-16 md:bottom-5 right-3 sm:right-5 w-[calc(100vw-24px)] sm:w-[430px] h-[76vh] max-h-[640px]'
          }`}
        >
          {/* Pastel Header (Zero truncation, clean typographic hierarchy) */}
          <div
            className={`px-4 py-3.5 ${roleTheme.headerBg} border-b ${roleTheme.headerBorder} flex items-center justify-between gap-3 shrink-0`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${roleTheme.iconBox}`}
              >
                <RoleBadgeIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#181E2E] leading-tight">
                  {currentUser.isAuthenticated ? activePersona.title : 'CivicLens Assistant'}
                </h2>
                <p className="text-[11px] text-[#5B6478] mt-0.5 truncate">
                  {currentUser.isAuthenticated
                    ? `${currentUser.name} · ${roleTheme.roleLabel} · ${activePersona.modelBadge}`
                    : 'Role-matched guidance · Sign in to continue'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {currentUser.isAuthenticated && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-2 rounded-lg bg-white/80 hover:bg-white border border-[#E5E0EE] text-[#5B6478] hover:text-[#181E2E] transition-colors"
                  title="Start a fresh conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-2 rounded-lg bg-white/80 hover:bg-white border border-[#E5E0EE] text-[#5B6478] hover:text-[#181E2E] transition-colors"
                title={isExpanded ? 'Compact view' : 'Expand panel'}
                aria-label={isExpanded ? 'Compact view' : 'Expand panel'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="p-2 rounded-lg bg-white/80 hover:bg-[#FFE4E6] border border-[#E5E0EE] text-[#5B6478] hover:text-[#9F1239] transition-colors"
                aria-label="Close assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Admin-only Role Mode Segmented Switcher */}
          {currentUser.isAuthenticated && effectiveRole === 'ADMIN' && (
            <div className="px-3 py-2 bg-[#F3F0FA] border-b border-[#E5E0EE] flex items-center gap-1 shrink-0">
              {ADMIN_PERSONAS.map((persona) => {
                const isSelected = persona.id === selectedPersonaId;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setAdminPersonaChoice(persona.id)}
                    className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-white text-[#2B1863] shadow-sm font-semibold'
                        : 'text-[#5B6478] hover:text-[#181E2E]'
                    }`}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body: Gate by Auth / Department Assignment OR Scrollable Conversation */}
          {!currentUser.isAuthenticated ? (
            <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center space-y-4">
              <div className="rounded-2xl bg-white border border-[#E5E0EE] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#4C1D95] shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#181E2E]">
                      Sign in for your role-scoped assistant
                    </h3>
                    <p className="text-xs text-[#5B6478]">
                      Your login automatically selects the right tools and data scope.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#CBEAD8] text-[#113A29]">
                    <span className="font-semibold">Citizen:</span> Sector matching, live GPS reporting help, and personal ticket SLA tracking.
                  </div>
                  <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#CFE0FA] text-[#172E61]">
                    <span className="font-semibold">Department Officer:</span> Dispatch prioritization and crew checklists scoped to your assigned bureau.
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#2B1863]">
                    <span className="font-semibold">City Admin:</span> Full 18-sector backlog triage, SLA escalation, and root-cause policy planning.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#DDD6FE] hover:bg-[#C4B5FD] text-[#261459] font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{authLoading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
              </div>
            </div>
          ) : isOfficerMissingDept ? (
            <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center">
              <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-5 space-y-3 text-xs text-[#7C2D12]">
                <div className="font-bold text-sm">Bureau assignment required</div>
                <p className="leading-relaxed">
                  Your account is signed in as a Department Officer, but no municipal bureau has been assigned yet. Ask your City Administrator to assign your bureau under Departments, then refresh your access claims.
                </p>
                <button
                  type="button"
                  onClick={() => void refreshAuthClaims()}
                  className="px-4 py-2 rounded-xl bg-white border border-[#FED7AA] font-semibold text-[#7C2D12] hover:bg-[#FFEDD5] inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Refresh Claims</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Message Thread */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F7]"
              >
                {/* Grounded Live Scope Summary Card on empty/initial thread */}
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white border border-[#E5E0EE] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#181E2E]">
                        <Bot className="w-4 h-4 text-[#5B4DC9]" />
                        <span>{activePersona.title} Ready</span>
                      </div>
                      <p className="text-xs text-[#475066] leading-relaxed">
                        {scopedData.briefIntro}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-[#5B6478] px-1">
                        Suggested prompts for your role
                      </div>
                      <div className="space-y-1.5">
                        {scopedData.starterPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => void sendMessage(prompt)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F3F0FA] border border-[#E5E0EE] hover:border-[#C4B5FD] text-xs text-[#1E2433] transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isWaitingFirstToken = msg.isStreaming && !msg.text;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isUser ? roleTheme.iconBox : 'bg-white border-[#E5E0EE] text-[#5B4DC9]'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                          isUser
                            ? `${roleTheme.userBubble} rounded-tr-sm`
                            : 'bg-white border-[#E5E0EE] text-[#1E2433] rounded-tl-sm'
                        }`}
                      >
                        {isWaitingFirstToken ? (
                          <div className="flex items-center gap-2 text-[#5B6478] py-0.5">
                            <span className="inline-flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD] animate-bounce [animation-delay:120ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-bounce [animation-delay:240ms]" />
                            </span>
                            <span>Drafting response...</span>
                          </div>
                        ) : isUser ? (
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                        ) : (
                          renderFormattedText(msg.text)
                        )}

                        <div className="flex items-center justify-between gap-3 pt-2 text-[10px] text-[#6B7280] tabular-nums">
                          <span>
                            {msg.timestamp}
                            {!isUser ? ` · ${activePersona.label}` : ''}
                          </span>
                          {!isUser && msg.text && !msg.isStreaming && (
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="text-[#6B7280] hover:text-[#181E2E] inline-flex items-center gap-1 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-[#059669]" />
                                  <span className="text-[#059669]">Copied</span>
                                </>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Banner */}
              {chatError && (
                <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-[#FFE4E6] border border-[#FECDD3] text-xs text-[#9F1239] flex items-start gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{chatError}</span>
                  <button
                    type="button"
                    onClick={() => setChatError(null)}
                    className="font-semibold hover:opacity-75"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Composer */}
              <form
                onSubmit={handleFormSubmit}
                className="p-3 bg-white border-t border-[#E5E0EE] flex items-end gap-2 shrink-0"
              >
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${activePersona.title}...`}
                  rows={2}
                  maxLength={4000}
                  disabled={isSending}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF9F7] border border-[#E5E0EE] focus:border-[#A78BFA] focus:outline-none text-xs text-[#181E2E] placeholder-[#8A94A6] resize-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputValue.trim()}
                  className={`px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${roleTheme.sendBtn}`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
