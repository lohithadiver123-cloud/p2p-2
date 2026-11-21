import React, { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  ColorScheme,
  Map as GoogleMap,
  useMap,
} from '@vis.gl/react-google-maps';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';
import {
  MapPin,
  Navigation,
  X,
  ExternalLink,
  Radio,
} from 'lucide-react';

const CITY_MAP_ID = 'city-incident-map';

const CameraFocusController: React.FC<{
  focusTarget: { lat: number; lng: number; nonce: number } | null;
}> = ({ focusTarget }) => {
  const map = useMap(CITY_MAP_ID);

  useEffect(() => {
    if (!map || !focusTarget) return;
    map.panTo({ lat: focusTarget.lat, lng: focusTarget.lng });
    map.setZoom(15);
  }, [map, focusTarget]);

  return null;
};

export const CityIncidentMapView: React.FC = () => {
  const {
    complaints,
    sectors,
    filterSector,
    setFilterSector,
    filterSeverity,
    setFilterSeverity,
    filterWard,
    setFilterWard,
    setSelectedComplaintForDetails,
  } = useApp();

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedIncident, setSelectedIncident] = useState<Complaint | null>(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lng: number;
    nonce: number;
  } | null>(null);

  // Filter complaints based on map controls
  const visibleComplaints = complaints.filter((c) => {
    if (filterSector !== 'ALL' && c.sectorId !== filterSector) return false;
    if (filterSeverity !== 'ALL' && c.severity !== filterSeverity) return false;
    if (filterWard !== 'ALL' && c.ward !== filterWard) return false;
    return true;
  });

  const handleCenterOn = (coords: [number, number]) => {
    setFocusTarget({
      lat: coords[0],
      lng: coords[1],
      nonce: Date.now(),
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Map Controls Header */}
      <div className="glass-panel p-4 rounded-2xl border border-[#223252] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#43D9FF] animate-pulse" />
            <h1 className="text-lg font-bold font-mono uppercase tracking-wider text-white">
              City Incident Map
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#18233B] text-[#C6FF5F] border border-[#2C416A]">
              {visibleComplaints.length} Pins Active
            </span>
          </div>
          <p className="text-xs text-[#8E9EB8] mt-0.5">
            Geospatial surveillance &amp; active dispatch routing across all municipal wards.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0B1020] border border-[#223252] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#43D9FF]"
          >
            <option value="ALL">All Sectors (18)</option>
            {sectors.map((sec) => (
              <option key={sec.id} value={sec.id} className="bg-[#121A2B]">
                {sec.icon} #{sec.id} {sec.name}
              </option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0B1020] border border-[#223252] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF4D5E]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL" className="bg-[#121A2B]">🔴 Critical</option>
            <option value="HIGH" className="bg-[#121A2B]">🟠 High</option>
            <option value="MEDIUM" className="bg-[#121A2B]">🟡 Medium</option>
            <option value="LOW" className="bg-[#121A2B]">🟢 Low</option>
          </select>

          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0B1020] border border-[#223252] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#43D9FF]"
          >
            <option value="ALL">All Wards</option>
            {Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`).map((w) => (
              <option key={w} value={w} className="bg-[#121A2B]">{w}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              heatmapMode
                ? 'bg-[#43D9FF]/20 text-[#43D9FF] border-[#43D9FF]'
                : 'bg-[#0B1020] text-slate-300 border-[#223252] hover:text-white'
            }`}
          >
            {heatmapMode ? 'Density Rings: ON' : 'Density Rings: OFF'}
          </button>
        </div>
      </div>

      {/* Main Map Container & Right Details Panel (explicit height per CF2) */}
      <div className="relative h-[620px] rounded-2xl overflow-hidden border border-[#223252] shadow-2xl bg-[#0B1020]">
        {mapsApiKey ? (
          <GoogleMap
            id={CITY_MAP_ID}
            mapId="DEMO_MAP_ID"
            colorScheme={ColorScheme.DARK}
            defaultCenter={{ lat: 12.9716, lng: 77.61 }}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            <CameraFocusController focusTarget={focusTarget} />

            {visibleComplaints.map((comp) => {
              const isCritical = comp.severity === 'CRITICAL';
              const isHigh = comp.severity === 'HIGH';
              const isMedium = comp.severity === 'MEDIUM';
              const color = isCritical
                ? '#FF4D5E'
                : isHigh
                  ? '#FF9B42'
                  : isMedium
                    ? '#FFD166'
                    : '#47D18C';
              const isSelected = selectedIncident?.id === comp.id;

              return (
                <AdvancedMarker
                  key={comp.id}
                  position={{ lat: comp.coordinates[0], lng: comp.coordinates[1] }}
                  onClick={() => setSelectedIncident(comp)}
                  title={`${comp.id}: ${comp.title}`}
                  zIndex={isCritical ? 30 : isSelected ? 40 : 10}
                >
                  <div className="relative flex items-center justify-center cursor-pointer">
                    {heatmapMode && (
                      <div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: isCritical ? 72 : isHigh ? 56 : 42,
                          height: isCritical ? 72 : isHigh ? 56 : 42,
                          background: `radial-gradient(circle, ${color}55 0%, ${color}10 60%, transparent 75%)`,
                        }}
                      />
                    )}
                    {isCritical && (
                      <div
                        className="absolute w-8 h-8 rounded-full animate-ping"
                        style={{ backgroundColor: 'rgba(255, 77, 94, 0.45)' }}
                      />
                    )}
                    <div
                      className="relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110"
                      style={{
                        backgroundColor: '#121A2B',
                        border: `${isSelected ? 3 : 2}px solid ${color}`,
                        boxShadow: `0 0 ${isSelected ? 16 : 10}px ${color}90`,
                      }}
                    >
                      {comp.sectorIcon}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
            <MapPin className="w-8 h-8 text-[#43D9FF]" />
            <div className="text-sm font-mono text-white">
              Google Maps City Radar requires VITE_GOOGLE_MAPS_API_KEY
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {visibleComplaints.length} geocoded civic incidents are ready to render once the Google Maps API key is loaded.
            </p>
          </div>
        )}

        {/* Top-Left Floating Legend */}
        <div className="absolute top-4 left-4 z-20 glass-panel p-3 rounded-xl border border-[#2C416A] text-[11px] font-mono space-y-1.5 shadow-xl">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] pb-1 border-b border-[#223252]">
            INCIDENT SEVERITY
          </div>
          <div className="flex items-center gap-2 text-[#FF4D5E]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D5E] animate-ping" />
            <span>Critical Incident</span>
          </div>
          <div className="flex items-center gap-2 text-[#FF9B42]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9B42]" />
            <span>High Severity</span>
          </div>
          <div className="flex items-center gap-2 text-[#FFD166]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD166]" />
            <span>Medium Hazard</span>
          </div>
          <div className="flex items-center gap-2 text-[#47D18C]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#47D18C]" />
            <span>Resolved / Low</span>
          </div>
        </div>

        {/* Selected Incident Drawer */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-20 w-88 sm:w-96 glass-panel rounded-2xl border border-[#2C416A] shadow-2xl p-5 space-y-4 animate-in slide-in-from-right-4 duration-200 max-h-[580px] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#223252] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#43D9FF] tracking-wider">
                  INCIDENT SELECTED
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-extrabold font-mono text-white">
                    {selectedIncident.id}
                  </span>
                  {selectedIncident.severity === 'CRITICAL' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40">
                      🔴 CRITICAL
                    </span>
                  )}
                  {selectedIncident.severity === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF9B42]/20 text-[#FF9B42] border border-[#FF9B42]/40">
                      🟠 HIGH
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg bg-[#0B1020] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">{selectedIncident.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {selectedIncident.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[#223252] h-32 bg-[#0B1020]">
                <img
                  src={selectedIncident.imageUrl}
                  alt="Incident Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Sector</div>
                <div className="font-semibold text-white truncate flex items-center gap-1 mt-0.5">
                  <span>{selectedIncident.sectorIcon}</span>
                  <span className="truncate">{selectedIncident.sectorName}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Priority Score</div>
                <div className="font-extrabold font-mono text-[#C6FF5F] text-sm mt-0.5">
                  {selectedIncident.priorityScore} / 100
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#223252] text-xs space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Location</div>
              <div className="font-semibold text-white">
                {selectedIncident.ward} · {selectedIncident.locationName}
              </div>
              <div className="text-[10px] font-mono text-[#43D9FF]">
                {selectedIncident.coordinates[0].toFixed(5)}, {selectedIncident.coordinates[1].toFixed(5)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#162035] border border-[#243354] text-xs space-y-1">
              <div className="text-[10px] font-mono uppercase text-[#8E9EB8]">AI Rationale</div>
              <p className="text-slate-300 text-[11px] italic">&ldquo;{selectedIncident.aiReasoning}&rdquo;</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedComplaintForDetails(selectedIncident)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C6FF5F] to-[#a8f828] text-[#0B1020] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
              >
                <span>[ VIEW COMPLAINT ]</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleCenterOn(selectedIncident.coordinates)}
                className="w-full py-2 rounded-xl bg-[#18233B] hover:bg-[#203154] border border-[#2C416A] text-slate-200 text-xs font-mono flex items-center justify-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5 text-[#43D9FF]" />
                <span>Focus Map Camera</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
