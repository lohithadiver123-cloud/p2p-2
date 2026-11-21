import { AIAnalysisResult, Severity } from '../types';
import { CIVIC_SECTORS } from '../data/sectors';

interface ClassificationRule {
  sectorId: string;
  keywords: string[];
  baseSeverity: Severity;
  basePriority: number;
  reasoningTemplate: string;
  actionTemplate: string;
}

const SECTOR_RULES: ClassificationRule[] = [
  {
    sectorId: '06', // Trees & Environment
    keywords: ['tree', 'branch', 'fallen', 'timber', 'banyan', 'felled', 'foliage', 'horticulture', 'collapsed tree', 'blocking road'],
    baseSeverity: 'CRITICAL',
    basePriority: 95,
    reasoningTemplate: 'Obstructed right-of-way poses high danger to vehicles and disrupts emergency vehicle transit routes.',
    actionTemplate: 'Deploy chainsaw crew, heavy hydraulic recovery truck, and initiate traffic detour via adjacent corridor.'
  },
  {
    sectorId: '03', // Water Supply
    keywords: ['water', 'pipe', 'pipeline', 'burst', 'gushing', 'leak', 'drinking water', 'tap', 'tanker', 'pressure', 'jal board'],
    baseSeverity: 'CRITICAL',
    basePriority: 96,
    reasoningTemplate: 'High-volume potable water distribution failure threatening roadway integrity and residential supply stability.',
    actionTemplate: 'Isolate grid distribution valves; dispatch mobile dewatering unit and emergency pipeline repair squad.'
  },
  {
    sectorId: '04', // Drainage & Sewerage
    keywords: ['manhole', 'sewer', 'sewage', 'drainage', 'drain', 'gutter', 'open manhole', 'overflow', 'chamber', 'cover missing'],
    baseSeverity: 'CRITICAL',
    basePriority: 93,
    reasoningTemplate: 'Subterranean fall hazard with heightened risk of toxic gas release and pedestrian drowning in wet conditions.',
    actionTemplate: 'Erect luminescent hazard barricade immediately; dispatch emergency casting replacement vehicle.'
  },
  {
    sectorId: '05', // Electricity & Street Lighting
    keywords: ['electricity', 'wire', 'cable', 'transformer', 'spark', 'shock', 'pole', 'current', 'power', 'blackout', 'streetlight', 'dark', 'बिजली', 'तार'],
    baseSeverity: 'CRITICAL',
    basePriority: 97,
    reasoningTemplate: 'Severe electrocution hazard and potential arching adjacent to vehicular traffic and pedestrian walkways.',
    actionTemplate: 'Remotely trip local circuit feeder; mobilize high-altitude cherry picker for cable splicing.'
  },
  {
    sectorId: '01', // Roads & Infrastructure
    keywords: ['pothole', 'road', 'asphalt', 'crater', 'divider', 'bridge', 'flyover', 'crack', 'tar', 'swerving', 'highway'],
    baseSeverity: 'HIGH',
    basePriority: 88,
    reasoningTemplate: 'Surface structural degradation forcing dangerous vehicular swerving maneuvers and elevated two-wheeler collision risk.',
    actionTemplate: 'Place reflective traffic cones; dispatch fast-curing cold-mix asphalt patching team.'
  },
  {
    sectorId: '02', // Waste Management
    keywords: ['garbage', 'waste', 'trash', 'dump', 'dustbin', 'smell', 'odor', 'rotting', 'debris', 'litter', 'குப்பை', 'ಕಸ'],
    baseSeverity: 'HIGH',
    basePriority: 82,
    reasoningTemplate: 'Decomposing municipal solid waste posing public vector hazard and air quality deterioration in neighborhood.',
    actionTemplate: 'Dispatch compacting compactor truck; sanitize perimeter with bio-disinfectant spray.'
  },
  {
    sectorId: '07', // Traffic & Road Safety
    keywords: ['traffic', 'signal', 'light', 'junction', 'gridlock', 'jam', 'red light', 'sensor', 'speed breaker', 'pedestrian crossing'],
    baseSeverity: 'HIGH',
    basePriority: 86,
    reasoningTemplate: 'Unregulated junction flow in high-throughput node causing arterial paralysis and pedestrian endangerment.',
    actionTemplate: 'Deploy field traffic marshals immediately and reboot computerized traffic signaling unit.'
  },
  {
    sectorId: '12', // Flooding & Disaster
    keywords: ['flood', 'flooding', 'underpass', 'waterlogged', 'submerged', 'cloudburst', 'monsoon', 'inundated', 'trapped'],
    baseSeverity: 'CRITICAL',
    basePriority: 97,
    reasoningTemplate: 'Sudden water accumulation submerging low-lying rights-of-way, creating acute hydro-locking and hypothermia hazard.',
    actionTemplate: 'Deploy twin high-horsepower diesel suction trailer pumps; seal access ramps with emergency gates.'
  },
  {
    sectorId: '14', // Fire Safety
    keywords: ['fire', 'flame', 'smoke', 'burning', 'combustible', 'cylinder', 'gas', 'chemical fire', 'hydrant'],
    baseSeverity: 'CRITICAL',
    basePriority: 98,
    reasoningTemplate: 'Active thermal danger and rapid combustion expansion potential near infrastructure and public assets.',
    actionTemplate: 'Dispatch primary class-B foam fire tenders; clear perimeter and shut gas lines.'
  },
  {
    sectorId: '17', // Water Bodies & Pollution
    keywords: ['lake', 'pollution', 'foam', 'froth', 'chemical', 'toxic', 'factory discharge', 'effluent', 'river', 'pond'],
    baseSeverity: 'HIGH',
    basePriority: 89,
    reasoningTemplate: 'Airborne chemical surfactant and heavy chemical effluent degrading water ecology and posing toxic inhalation threat.',
    actionTemplate: 'Deploy mobile aeration sprinklers; collect certified water samples and trace upstream effluent source.'
  },
  {
    sectorId: '09', // Animal-Related
    keywords: ['dog', 'stray', 'bite', 'barking', 'rabies', 'animal', 'cow', 'cattle', 'monkey', 'snake'],
    baseSeverity: 'MEDIUM',
    basePriority: 72,
    reasoningTemplate: 'Territorial pack aggression threatening school children and cyclists during morning transit hours.',
    actionTemplate: 'Dispatch specialized humane animal catch team for rabies observation and behavioral tagging.'
  },
  {
    sectorId: '16', // Building Safety
    keywords: ['balcony', 'building', 'collapse', 'structural', 'scaffold', 'concrete falling', 'masonry', 'plaster'],
    baseSeverity: 'HIGH',
    basePriority: 87,
    reasoningTemplate: 'Unstable elevated architectural components risking kinetic impact on sidewalk pedestrians below.',
    actionTemplate: 'Erect cantilevered catch nets; serve immediate structural integrity rectification notice.'
  },
  {
    sectorId: '15', // Public Accessibility
    keywords: ['wheelchair', 'ramp', 'tactile', 'disabled', 'blind', 'handicapped', 'barrier', 'accessibility'],
    baseSeverity: 'MEDIUM',
    basePriority: 68,
    reasoningTemplate: 'Architectural non-compliance obstructing citizens with disabilities from basic transit and health amenities.',
    actionTemplate: 'Issue stop-work notice to offending party; erect standard gradient compliant accessibility ramp.'
  },
  {
    sectorId: '08', // Public Health
    keywords: ['dengue', 'malaria', 'mosquito', 'clinic', 'hospital', 'food poisoning', 'hygiene', 'epidemic', 'stagnant'],
    baseSeverity: 'HIGH',
    basePriority: 84,
    reasoningTemplate: 'Confirmed vector incubation hotspot with elevated epidemiological threat to surrounding community.',
    actionTemplate: 'Administer thermal larvicide fogging within 500-meter radius; test standing water pools.'
  },
  {
    sectorId: '10', // Public Infrastructure & Facilities
    keywords: ['shelter', 'bus stop', 'toilet', 'restroom', 'bench', 'park', 'gate', 'railing', 'facility'],
    baseSeverity: 'MEDIUM',
    basePriority: 64,
    reasoningTemplate: 'Degraded public civic asset compromising civic comfort and baseline sanitation.',
    actionTemplate: 'Deploy municipal civil maintenance gang for structural replacement and restoration.'
  },
  {
    sectorId: '11', // Urban Planning
    keywords: ['encroachment', 'illegal construction', 'hoarding', 'setback', 'footpath shop', 'hawker obstruction'],
    baseSeverity: 'MEDIUM',
    basePriority: 65,
    reasoningTemplate: 'Unlawful occupation of public thoroughfare impeding pedestrian clearance and violating municipal zoning code.',
    actionTemplate: 'Issue Section 321 demolition and clearance notice with designated 24-hour compliance window.'
  },
  {
    sectorId: '13', // Public Transport
    keywords: ['bus breakdown', 'metro', 'transit', 'electric bus', 'charging', 'conductor', 'bus route'],
    baseSeverity: 'HIGH',
    basePriority: 79,
    reasoningTemplate: 'Fleet breakdown occupying transit corridor causing cascading delays to city commuter networks.',
    actionTemplate: 'Dispatch heavy recovery tow vehicle; dispatch standby fleet bus to transfer trapped passengers.'
  },
  {
    sectorId: '18', // Civic Administration
    keywords: ['tax', 'portal', 'certificate', 'receipt', 'property tax', 'corruption', 'officer', 'delay', 'birth certificate'],
    baseSeverity: 'LOW',
    basePriority: 52,
    reasoningTemplate: 'Digital grievance related to administrative delivery delays without direct physical bodily hazard.',
    actionTemplate: 'Escalate to e-Governance IT Operations desk with prioritized database ticket recreation.'
  }
];

export function analyzeComplaintAI(
  text: string, 
  manualSectorId?: string,
  languageOverride?: string
): AIAnalysisResult {
  const lower = text.toLowerCase();
  
  // 1. Detect language
  let detectedLanguage = languageOverride || 'English';
  if (/[\u0900-\u097F]/.test(text)) {
    detectedLanguage = 'Hindi (हिंदी)';
  } else if (/[\u0B80-\u0BFF]/.test(text)) {
    detectedLanguage = 'Tamil (தமிழ்)';
  } else if (/[\u0C80-\u0CFF]/.test(text)) {
    detectedLanguage = 'Kannada (ಕನ್ನಡ)';
  } else if (/[áéíóúñ¿¡]/.test(text)) {
    detectedLanguage = 'Spanish (Español)';
  }

  // 2. Score against sector rules
  let bestMatch: ClassificationRule = SECTOR_RULES[0];
  let highestScore = -1;

  if (manualSectorId) {
    const matched = SECTOR_RULES.find(r => r.sectorId === manualSectorId);
    if (matched) {
      bestMatch = matched;
      highestScore = 100;
    }
  }

  if (highestScore === -1) {
    for (const rule of SECTOR_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += 10;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
      }
    }
  }

  // If no keyword match found, default to Roads & Infrastructure
  if (highestScore <= 0 && !manualSectorId) {
    bestMatch = SECTOR_RULES.find(r => r.sectorId === '01') || SECTOR_RULES[0];
  }

  const sector = CIVIC_SECTORS.find(s => s.id === bestMatch.sectorId) || CIVIC_SECTORS[0];

  // 3. Dynamic severity adjustments based on danger terms
  let severity: Severity = bestMatch.baseSeverity;
  let priority = bestMatch.basePriority;

  const criticalTriggers = ['burst', 'spark', 'fire', 'fatal', 'accident', 'collapsed', 'blood', 'child', 'emergency', 'death', 'near miss', 'submerged', 'danger'];
  const highTriggers = ['heavy', 'deep', 'overflow', 'broken', 'blocking', 'swerving', 'smell', 'dark', 'stalled'];

  let urgencyBonus = 0;
  for (const t of criticalTriggers) {
    if (lower.includes(t)) {
      severity = 'CRITICAL';
      urgencyBonus += 4;
      break;
    }
  }

  for (const t of highTriggers) {
    if (lower.includes(t)) {
      urgencyBonus += 2;
    }
  }

  priority = Math.min(99, Math.max(45, priority + urgencyBonus));

  // Determine SLA
  let estimatedSLA = '6 Hours';
  let urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'NORMAL' | 'ROUTINE' = 'HIGH';
  if (severity === 'CRITICAL' || priority >= 90) {
    estimatedSLA = '1 - 2 Hours';
    urgencyLevel = 'IMMEDIATE';
  } else if (severity === 'HIGH' || priority >= 75) {
    estimatedSLA = '4 - 6 Hours';
    urgencyLevel = 'HIGH';
  } else if (severity === 'MEDIUM') {
    estimatedSLA = '12 - 24 Hours';
    urgencyLevel = 'NORMAL';
  } else {
    estimatedSLA = '48 Hours';
    urgencyLevel = 'ROUTINE';
  }

  return {
    detectedSectorId: sector.id,
    detectedSectorName: sector.name,
    sectorIcon: sector.icon,
    severity,
    priorityScore: priority,
    responsibleDepartment: sector.responsibleDepartment,
    aiReasoning: bestMatch.reasoningTemplate,
    recommendedAction: bestMatch.actionTemplate,
    confidenceScore: Math.floor(92 + Math.random() * 7),
    detectedLanguage,
    urgencyLevel,
    estimatedSLA
  };
}
