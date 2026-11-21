export interface DemoScenario {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  text: string;
  language: string;
  ward: string;
  locationName: string;
  coordinates: [number, number];
  sampleImage?: string;
  expectedSectorId: string;
  expectedSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expectedPriority: number;
  expectedDepartment: string;
  expectedReasoning: string;
  expectedAction: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-tree',
    name: 'Scene 1: Fallen Tree (The Pitch Demo)',
    tagline: 'Fallen tree blocking major two-way transit artery',
    badge: 'Competition Favorite',
    text: 'A large tree has fallen across the road and is blocking vehicles. People are unable to pass and traffic is completely stalled in both directions.',
    language: 'English',
    ward: 'Ward 8',
    locationName: 'Sankey Tank Crossroad, Ward 8',
    coordinates: [13.0068, 77.5755],
    sampleImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '06',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 96,
    expectedDepartment: 'Horticulture / Environment Department',
    expectedReasoning: 'The fallen tree causes complete road blockage on an arterial route, endangering motorists, disrupting emergency transport, and potentially straining adjacent utility lines.',
    expectedAction: 'Immediate dispatch of tree clearance team with motorized chainsaws, hydraulic crane, and traffic diversion protocol at Sankey Junction.'
  },
  {
    id: 'demo-pothole',
    name: 'Scene 2: Dangerous Junction Pothole',
    tagline: 'Deep crater causing near-miss two-wheeler accidents',
    badge: 'Road Safety',
    text: 'A large pothole has formed near the main junction. Vehicles are swerving around it into oncoming traffic and a bike nearly crashed right in front of us.',
    language: 'English',
    ward: 'Ward 9',
    locationName: 'Outer Ring Road, Marathahalli, Ward 9',
    coordinates: [12.9569, 77.7011],
    sampleImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '01',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 94,
    expectedDepartment: 'Public Works / Roads Department',
    expectedReasoning: 'The pothole is located directly within high-speed junction maneuvers, creating acute collision risk for two-wheelers and braking shockwaves.',
    expectedAction: 'Immediate deployment of reflective hazard cones and rapid cold-mix asphalt patching squad within 3 hours.'
  },
  {
    id: 'demo-pipe',
    name: 'Scene 3: High-Pressure Pipeline Burst',
    tagline: 'Gushing potable water submerging roadway',
    badge: 'Infrastructure Emergency',
    text: 'A major underground water distribution pipe has burst with enormous pressure! Water is flooding into neighboring shops, the asphalt is sinking, and nearby apartments have zero pressure.',
    language: 'English',
    ward: 'Ward 12',
    locationName: 'Indiranagar 100ft Road, Ward 12',
    coordinates: [12.9784, 77.6408],
    sampleImage: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '03',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 98,
    expectedDepartment: 'Water Department (Jal Board)',
    expectedReasoning: 'Massive loss of treated municipal water combined with structural road subsidence and flooding of commercial establishments.',
    expectedAction: 'Emergency isolation valve shutoff at Indiranagar Grid 4; mobilize mobile dewatering tankers and pipe-welding crew.'
  },
  {
    id: 'demo-manhole',
    name: 'Scene 4: Open Manhole in Heavy Rain',
    tagline: 'Submerged open chamber posing fatal fall hazard',
    badge: 'Severe Hazard',
    text: 'Heavy rain has flooded the street and an open manhole cover is completely missing on 5th Cross. Pedestrians cannot see the hole in the murky water.',
    language: 'English',
    ward: 'Ward 4',
    locationName: 'Malleshwaram 15th Cross, Ward 4',
    coordinates: [13.0031, 77.5684],
    sampleImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '04',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 95,
    expectedDepartment: 'Drainage Department',
    expectedReasoning: 'Unmarked, submerged subterranean suction chamber in a high-density pedestrian zone during rainfall presents imminent fatality risk.',
    expectedAction: 'Deploy high-visibility luminescent barricades immediately; dispatch drainage maintenance crew with ductile iron cover replacement.'
  },
  {
    id: 'demo-hindi',
    name: 'Scene 5: Regional Language (Hindi)',
    tagline: 'Dangling live electrical cable sparking in market',
    badge: 'Multilingual AI',
    text: 'मेन मार्केट में बिजली का तार टूट कर सड़क पर लटक रहा है, बारिश में स्पार्किंग हो रही है और लोग बहुत डरे हुए हैं। कोई बड़ा हादसा हो सकता है।',
    language: 'Hindi (हिंदी)',
    ward: 'Ward 15',
    locationName: 'Koramangala 4th Block Market, Ward 15',
    coordinates: [12.9345, 77.6265],
    sampleImage: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '05',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 97,
    expectedDepartment: 'Electrical Department (Power Corp)',
    expectedReasoning: 'Translated: Live severed overhead power conductor arcing in market rain; acute electrocution danger to public.',
    expectedAction: 'Emergency remote feeder line de-energization; dispatch aerial emergency bucket repair van.'
  },
  {
    id: 'demo-toxic',
    name: 'Scene 6: Toxic Lake Chemical Froth',
    tagline: 'Pollution spillway foaming into residential areas',
    badge: 'Environment & Ecology',
    text: 'Dense white toxic chemical foam is overflowing from Bellandur lake weir onto the main bypass road. Pungent odor causing breathing trouble for commuters.',
    language: 'English',
    ward: 'Ward 18',
    locationName: 'Bellandur Lake North Weir, Ward 18',
    coordinates: [12.9372, 77.6744],
    sampleImage: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&auto=format&fit=crop&q=80',
    expectedSectorId: '17',
    expectedSeverity: 'CRITICAL',
    expectedPriority: 93,
    expectedDepartment: 'Environment / Water Quality Bureau',
    expectedReasoning: 'High-volume chemical surfactant plume causing air and ground toxicity, reducing traffic visibility, and threatening aquatic biosphere.',
    expectedAction: 'Activate chemical suppressant sprayers; seal industrial inlet sluices and initiate water specimen toxicity testing.'
  }
];
