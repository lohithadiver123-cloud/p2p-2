import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Content, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SectorMeta {
  id: string;
  name: string;
  icon: string;
  responsibleDepartment: string;
}

const SECTOR_CATALOG: SectorMeta[] = [
  { id: '01', name: 'Roads & Infrastructure', icon: '🛣️', responsibleDepartment: 'Public Works / Roads Department' },
  { id: '02', name: 'Waste Management', icon: '🗑️', responsibleDepartment: 'Sanitation Department' },
  { id: '03', name: 'Water Supply', icon: '💧', responsibleDepartment: 'Water Department (Jal Board)' },
  { id: '04', name: 'Drainage & Sewerage', icon: '🌊', responsibleDepartment: 'Drainage Department' },
  { id: '05', name: 'Electricity & Street Lighting', icon: '⚡', responsibleDepartment: 'Electrical Department (Power Corp)' },
  { id: '06', name: 'Trees & Environment', icon: '🌳', responsibleDepartment: 'Horticulture / Environment Department' },
  { id: '07', name: 'Traffic & Road Safety', icon: '🚦', responsibleDepartment: 'Traffic Department & Enforcement' },
  { id: '08', name: 'Public Health & Sanitation', icon: '🏥', responsibleDepartment: 'Public Health Department' },
  { id: '09', name: 'Animal-Related Issues', icon: '🐕', responsibleDepartment: 'Animal Welfare / Veterinary Services' },
  { id: '10', name: 'Public Infrastructure & Facilities', icon: '🏗️', responsibleDepartment: 'Public Infrastructure Department' },
  { id: '11', name: 'Urban Planning & Encroachment', icon: '🏙️', responsibleDepartment: 'Urban Planning Department' },
  { id: '12', name: 'Flooding & Disaster Management', icon: '🌧️', responsibleDepartment: 'Disaster Management Cell' },
  { id: '13', name: 'Public Transport', icon: '🚌', responsibleDepartment: 'Transport Department' },
  { id: '14', name: 'Fire Safety', icon: '🔥', responsibleDepartment: 'Fire & Emergency Services' },
  { id: '15', name: 'Public Accessibility', icon: '♿', responsibleDepartment: 'Accessibility / Infrastructure Bureau' },
  { id: '16', name: 'Building Safety', icon: '🏢', responsibleDepartment: 'Building Inspection Department' },
  { id: '17', name: 'Water Bodies & Pollution', icon: '🏞️', responsibleDepartment: 'Environment / Water Quality Bureau' },
  { id: '18', name: 'Civic Administration', icon: '🏛️', responsibleDepartment: 'Municipal Administration Office' },
];

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  app.post('/api/triage', async (req, res) => {
    try {
      const body = req.body as {
        text?: unknown;
        manualSectorId?: unknown;
        language?: unknown;
        ward?: unknown;
        locationName?: unknown;
      };

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        res.status(400).json({ error: 'Complaint text is required for AI triage.' });
        return;
      }
      if (text.length > 4000) {
        res.status(400).json({ error: 'Complaint text exceeds maximum 4000 character limit.' });
        return;
      }

      const manualSectorId =
        typeof body.manualSectorId === 'string' && /^\d{2}$/.test(body.manualSectorId)
          ? body.manualSectorId
          : undefined;
      const languageHint = typeof body.language === 'string' ? body.language.trim() : 'Auto-detect';
      const ward = typeof body.ward === 'string' ? body.ward.trim() : 'Unknown Ward';
      const locationName =
        typeof body.locationName === 'string' ? body.locationName.trim() : 'City Location';

      const ai = getGenAIClient();

      const sectorListText = SECTOR_CATALOG.map(
        (s) => `- "${s.id}": ${s.name} -> ${s.responsibleDepartment}`
      ).join('\n');

      const systemInstruction = [
        'You are CivicLens AI, a municipal civic incident triage and emergency dispatch router.',
        'Analyze the citizen complaint report and classify it into exactly one of the 18 municipal sectors below.',
        'Assess life-safety risk, infrastructure disruption, and urgency to produce a severity tier, a 0-100 priority score, concise technical reasoning (1-2 sentences), and a concrete operational field action directive (1-2 sentences).',
        'Detect the language of the complaint text (e.g., "English", "Hindi (हिंदी)", "Tamil (தமிழ்)", "Kannada (ಕನ್ನಡ)", "Spanish (Español)", or the matching language name).',
        manualSectorId
          ? `The operator explicitly overrode the sector to "${manualSectorId}". You MUST use "${manualSectorId}" as detectedSectorId.`
          : '',
        'Available 18 Civic Sectors:',
        sectorListText,
      ]
        .filter(Boolean)
        .join('\n');

      const prompt = [
        `Ward: ${ward}`,
        `Location: ${locationName}`,
        `Submitted Language Selector: ${languageHint}`,
        `Citizen Report: """${text}"""`,
      ].join('\n');

      let response;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedSectorId: {
                    type: Type.STRING,
                    description: 'Two-digit sector ID from "01" to "18".',
                  },
                  severity: {
                    type: Type.STRING,
                    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                  },
                  priorityScore: {
                    type: Type.INTEGER,
                    description: 'Urgency score from 0 to 100.',
                  },
                  aiReasoning: {
                    type: Type.STRING,
                    description: '1-2 sentence safety and infrastructure impact analysis.',
                  },
                  recommendedAction: {
                    type: Type.STRING,
                    description: '1-2 sentence concrete municipal field dispatch directive.',
                  },
                  confidenceScore: {
                    type: Type.INTEGER,
                    description: 'Model confidence percentage between 75 and 99.',
                  },
                  detectedLanguage: {
                    type: Type.STRING,
                    description: 'Detected language of the report.',
                  },
                  urgencyLevel: {
                    type: Type.STRING,
                    enum: ['IMMEDIATE', 'HIGH', 'NORMAL', 'ROUTINE'],
                  },
                  estimatedSLA: {
                    type: Type.STRING,
                    description: 'Target SLA window such as "1 - 2 Hours", "4 - 6 Hours", "12 - 24 Hours", or "48 Hours".',
                  },
                },
                required: [
                  'detectedSectorId',
                  'severity',
                  'priorityScore',
                  'aiReasoning',
                  'recommendedAction',
                  'confidenceScore',
                  'detectedLanguage',
                  'urgencyLevel',
                  'estimatedSLA',
                ],
              },
            },
          });
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message.toLowerCase() : '';
          const isTransient = msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand');
          if (!isTransient || attempt === maxAttempts) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }

      if (!response) {
        res.status(503).json({ error: 'Gemini service temporarily unavailable. Please try again.' });
        return;
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty triage response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        detectedSectorId: string;
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        priorityScore: number;
        aiReasoning: string;
        recommendedAction: string;
        confidenceScore: number;
        detectedLanguage: string;
        urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'NORMAL' | 'ROUTINE';
        estimatedSLA: string;
      };

      const targetId = manualSectorId || parsed.detectedSectorId;
      const sector =
        SECTOR_CATALOG.find((s) => s.id === targetId) || SECTOR_CATALOG[0];

      const validSeverities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
      const severity = validSeverities.has(parsed.severity) ? parsed.severity : 'HIGH';

      const validUrgencies = new Set(['IMMEDIATE', 'HIGH', 'NORMAL', 'ROUTINE']);
      const urgencyLevel = validUrgencies.has(parsed.urgencyLevel)
        ? parsed.urgencyLevel
        : severity === 'CRITICAL'
          ? 'IMMEDIATE'
          : 'HIGH';

      res.json({
        detectedSectorId: sector.id,
        detectedSectorName: sector.name,
        sectorIcon: sector.icon,
        severity,
        priorityScore: Math.max(0, Math.min(100, Math.round(parsed.priorityScore || 75))),
        responsibleDepartment: sector.responsibleDepartment,
        aiReasoning: parsed.aiReasoning.slice(0, 1000),
        recommendedAction: parsed.recommendedAction.slice(0, 1000),
        confidenceScore: Math.max(70, Math.min(99, Math.round(parsed.confidenceScore || 94))),
        detectedLanguage: parsed.detectedLanguage || languageHint,
        urgencyLevel,
        estimatedSLA: parsed.estimatedSLA || (severity === 'CRITICAL' ? '1 - 2 Hours' : '4 - 6 Hours'),
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Failed to execute AI triage.';
      console.error('[/api/triage] Gemini API error:', error);

      const lower = errMessage.toLowerCase();
      const status =
        lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')
          ? 429
          : lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')
            ? 503
            : lower.includes('403') || lower.includes('permission_denied') || lower.includes('api key')
              ? 403
              : 500;

      res.status(status).json({ error: errMessage });
    }
  });

  app.get('/api/geocode/reverse', async (req, res) => {
    try {
      const latRaw = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
      const lngRaw = typeof req.query.lng === 'string' ? Number(req.query.lng) : NaN;

      if (!Number.isFinite(latRaw) || latRaw < -90 || latRaw > 90) {
        res.status(400).json({ error: 'Valid numeric latitude (-90 to 90) is required.' });
        return;
      }
      if (!Number.isFinite(lngRaw) || lngRaw < -180 || lngRaw > 180) {
        res.status(400).json({ error: 'Valid numeric longitude (-180 to 180) is required.' });
        return;
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: 'Google Maps API key is not configured on the server.' });
        return;
      }

      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${latRaw},${lngRaw}`);
      url.searchParams.set('language', 'en');
      url.searchParams.set('key', apiKey);

      const upstream = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
      });

      const payload = (await upstream.json()) as {
        status?: string;
        error_message?: string;
        error?: { status?: string; message?: string };
        results?: Array<{
          place_id?: string;
          formatted_address?: string;
          types?: string[];
          address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        }>;
      };

      if (
        upstream.status === 429 ||
        payload.status === 'OVER_QUERY_LIMIT' ||
        payload.error?.status === 'RESOURCE_EXHAUSTED'
      ) {
        res.status(429).json({
          status: 'RESOURCE_EXHAUSTED',
          error:
            payload.error_message ||
            payload.error?.message ||
            'Google Maps Geocoding API quota exceeded.',
        });
        return;
      }

      if (payload.status === 'REQUEST_DENIED') {
        res.status(403).json({
          error: payload.error_message || 'Google Maps Geocoding request was denied.',
        });
        return;
      }

      if (!upstream.ok) {
        res.status(upstream.status).json({
          error: payload.error_message || `Reverse geocoding failed (${upstream.status}).`,
        });
        return;
      }

      if (payload.status === 'ZERO_RESULTS' || !payload.results || payload.results.length === 0) {
        res.json({
          formattedAddress: `${latRaw.toFixed(5)}, ${lngRaw.toFixed(5)}`,
          shortLabel: `GPS Pin (${latRaw.toFixed(4)}, ${lngRaw.toFixed(4)})`,
          neighborhood: null,
          wardHint: null,
          placeId: null,
        });
        return;
      }

      const primary = payload.results[0];
      const components = primary.address_components || [];

      const findComponent = (typeList: string[]) =>
        components.find((c) => c.types.some((t) => typeList.includes(t)))?.long_name || null;

      const route = findComponent(['route', 'street_address', 'premise', 'point_of_interest']);
      const neighborhood = findComponent([
        'sublocality_level_1',
        'sublocality_level_2',
        'sublocality',
        'neighborhood',
      ]);
      const locality = findComponent(['locality', 'administrative_area_level_2']);

      let wardHint: string | null = null;
      for (const comp of components) {
        const match = comp.long_name.match(/\bWard\s*(\d{1,2})\b/i);
        if (match) {
          const num = Number(match[1]);
          if (num >= 1 && num <= 20) {
            wardHint = `Ward ${num}`;
            break;
          }
        }
      }

      const shortParts = [route, neighborhood, locality].filter(
        (v, idx, arr): v is string => Boolean(v) && arr.indexOf(v) === idx
      );
      const shortLabel = (
        shortParts.length > 0
          ? shortParts.join(', ')
          : primary.formatted_address || `GPS (${latRaw.toFixed(4)}, ${lngRaw.toFixed(4)})`
      ).slice(0, 180);

      res.json({
        formattedAddress: (primary.formatted_address || shortLabel).slice(0, 200),
        shortLabel,
        neighborhood,
        wardHint,
        placeId: primary.place_id || null,
      });
    } catch (error) {
      console.error('[/api/geocode/reverse] Geocoding proxy error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to reverse geocode coordinates.',
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const body = req.body as {
        message?: unknown;
        history?: unknown;
        roleId?: unknown;
        userRole?: unknown;
        departmentName?: unknown;
        contextSummary?: unknown;
      };

      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) {
        res.status(400).json({ error: 'Chat message is required.' });
        return;
      }
      if (message.length > 4000) {
        res.status(400).json({ error: 'Chat message exceeds 4000 character limit.' });
        return;
      }

      const userRole =
        body.userRole === 'CITIZEN' ||
        body.userRole === 'DEPARTMENT_OFFICER' ||
        body.userRole === 'ADMIN'
          ? body.userRole
          : 'CITIZEN';

      const departmentName =
        typeof body.departmentName === 'string' ? body.departmentName.trim().slice(0, 120) : '';

      const requestedRoleId =
        body.roleId === 'citizen-guide' ||
        body.roleId === 'dispatch-advisor' ||
        body.roleId === 'policy-analyst'
          ? body.roleId
          : 'dispatch-advisor';

      // Strictly enforce allowed assistant persona by authenticated login role
      const roleId: 'citizen-guide' | 'dispatch-advisor' | 'policy-analyst' =
        userRole === 'CITIZEN'
          ? 'citizen-guide'
          : userRole === 'DEPARTMENT_OFFICER'
            ? 'dispatch-advisor'
            : requestedRoleId;

      const contextSummary =
        typeof body.contextSummary === 'string'
          ? body.contextSummary.trim().slice(0, 1800)
          : '';

      const rawHistory = Array.isArray(body.history) ? body.history : [];
      const sanitizedTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
      for (const item of rawHistory.slice(-30)) {
        if (!item || typeof item !== 'object') continue;
        const turn = item as { role?: unknown; text?: unknown };
        if (turn.role !== 'user' && turn.role !== 'model') continue;
        if (typeof turn.text !== 'string' || !turn.text.trim()) continue;
        const clamped = turn.text.trim().slice(0, 4000);
        const last = sanitizedTurns[sanitizedTurns.length - 1];
        if (!last && turn.role === 'model') {
          continue;
        }
        if (last && last.role === turn.role) {
          last.text = `${last.text}\n${clamped}`.slice(0, 4000);
        } else {
          sanitizedTurns.push({ role: turn.role, text: clamped });
        }
      }

      // Gemini chat history must end on 'model' if non-empty before sending the next 'user' message
      if (sanitizedTurns.length > 0 && sanitizedTurns[sanitizedTurns.length - 1].role === 'user') {
        sanitizedTurns.pop();
      }

      const history: Content[] = sanitizedTurns.map((t) => ({
        role: t.role,
        parts: [{ text: t.text }],
      }));

      const sectorCatalogText = SECTOR_CATALOG.map(
        (s) => `${s.id}. ${s.name} -> ${s.responsibleDepartment}`
      ).join('\n');

      const roleConfigs: Record<
        'citizen-guide' | 'dispatch-advisor' | 'policy-analyst',
        { model: string; thinkingLevel: ThinkingLevel; instruction: string }
      > = {
        'citizen-guide': {
          model: 'gemini-3.1-flash-lite',
          thinkingLevel: ThinkingLevel.MINIMAL,
          instruction: [
            'You are the CivicLens Citizen Help Desk assistant.',
            'Help residents report civic issues clearly, identify which of the 18 municipal sectors handles a problem, explain how to use the "Use Live Location" GPS button or map pin on AI Complaint Triage, and clarify SLA response targets (Critical: 2h, High: 6h, Medium/Low: 24h) and their own submitted ticket status.',
            'Do not invent fake ticket IDs or reveal internal officer-only queue details. Keep answers specific, concrete, and concise.',
          ].join(' '),
        },
        'dispatch-advisor': {
          model: 'gemini-4-hydrogen',
          thinkingLevel: ThinkingLevel.LOW,
          instruction: [
            userRole === 'DEPARTMENT_OFFICER' && departmentName
              ? `You are the dedicated Dispatch Advisor for ${departmentName}. Focus strictly on tickets, field crews, safety checklists, and SLA timelines within ${departmentName}.`
              : 'You are the CivicLens City Operations Dispatch Advisor for municipal administrators.',
            'Provide concrete, step-by-step operational checklists, prioritization rationale based on the live ticket context provided, and clear crew coordination actions. Never use vague filler.',
          ].join(' '),
        },
        'policy-analyst': {
          model: 'gemini-4-hydrogen',
          thinkingLevel: ThinkingLevel.MEDIUM,
          instruction: [
            'You are the CivicLens Civic Policy & Root-Cause Analyst for City Administrators.',
            'Analyze recurring ward/sector patterns from the provided operational snapshot, recommend cross-department workflows, and propose concrete preventive maintenance schedules with measurable SLA targets.',
          ].join(' '),
        },
      };

      const activeConfig = roleConfigs[roleId];
      const systemInstruction = [
        activeConfig.instruction,
        'CivicLens 18 Municipal Sectors:',
        sectorCatalogText,
        contextSummary ? `Scoped Live Context: ${contextSummary}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const ai = getGenAIClient();
      const chat = ai.chats.create({
        model: activeConfig.model,
        history,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: activeConfig.thinkingLevel },
        },
      });

      let streamResponse;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          streamResponse = await chat.sendMessageStream({ message });
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message.toLowerCase() : '';
          const isTransient =
            msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand');
          if (!isTransient || attempt === maxAttempts) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }

      if (!streamResponse) {
        res.status(503).json({ error: 'Gemini chat service temporarily unavailable.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      try {
        for await (const chunk of streamResponse) {
          const textChunk = chunk.text;
          if (textChunk) {
            res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, model: activeConfig.model })}\n\n`);
        res.end();
      } catch (streamErr) {
        const streamErrMsg =
          streamErr instanceof Error ? streamErr.message : 'Streaming interrupted.';
        console.error('[/api/chat] Stream error:', streamErr);
        res.write(`data: ${JSON.stringify({ error: streamErrMsg })}\n\n`);
        res.end();
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Failed to execute Gemini chat.';
      console.error('[/api/chat] Gemini API error:', error);

      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
        res.end();
        return;
      }

      const lower = errMessage.toLowerCase();
      const status =
        lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')
          ? 429
          : lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')
            ? 503
            : lower.includes('403') ||
                lower.includes('permission_denied') ||
                lower.includes('api key')
              ? 403
              : 500;

      res.status(status).json({ error: errMessage });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CivicLens server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
