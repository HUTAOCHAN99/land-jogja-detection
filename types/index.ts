// types/index.ts
export interface AddressDetails {
  full: string;
  display: string[];
  components: {
    road?: string;
    hamlet?: string;
    village?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  source: string;
}

export interface RiskData {
  elevation: number;
  slope: number;
  landCover: string;
  rainfall: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  soilType: string;
  geologicalRisk: string;
  address: string;
  addressDetails?: AddressDetails;
  accuracy: number;
  timestamp: string;
  metadata: {
    sources: {
      elevation: string;
      geospatial: string;
      address: string;
    };
    resolution: string;
    confidence: number;
    cached?: boolean;
    processingTime: number;
    dataSources?: string[];
  };
}

export interface AnalyzedPoint {
  id: string;
  position: [number, number];
  riskData: RiskData;
  timestamp: string;
}

export interface MapHistoryState {
  analyzedPoints: AnalyzedPoint[];
  showHistory: boolean;
}

export interface ViewportBounds {
  southWest: [number, number];
  northEast: [number, number];
}

export interface ZoomLock {
  min: number;
  max: number;
}

export interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  minZoom?: number;
  maxZoom?: number;
  tms?: boolean;
  hideBoundary?: boolean;
  zoomLock?: ZoomLock;
  defaultZoom?: number;
  opacity?: number;
  isBaseLayer?: boolean;
}

export interface MapControlProps {
  showRiskZones: boolean;
  onRiskZonesChange: (show: boolean) => void;
  showHeatmap: boolean;
  onHeatmapChange: (show: boolean) => void;
  tileLayers?: Record<string, TileLayerConfig>;
  baseTileLayer?: string;
  onBaseLayerChange?: (layer: string) => void;
  overlayLayers?: { [key: string]: boolean };
  onToggleOverlay?: (layer: string) => void;
  showHistory?: boolean;
  onHistoryChange?: (show: boolean) => void;
  historyCount?: number;
  onClearHistory?: () => void;
}

export interface Subdistrict {
  id: string;
  name: string;
  position: [number, number];
  riskData: RiskData;
}

export interface RiskHeatmapZone {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  coordinates: [number, number][];
  population?: number;
  area?: number;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Tile layers configuration
export const tileLayers: Record<string, TileLayerConfig> = {
  // Base layers
  standard: {
    name: 'Standar',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true
  },
  satellite: {
    name: 'Satelit', 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true
  },
  terrain: {
    name: 'Topografi',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true
  },
  
  // Overlay layers
  custom_qgis: {
    name: 'Peta Khusus DIY',
    url: '/tiles/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 10,
    opacity: 0.7,
    isBaseLayer: false
  }
};

export type TileLayerKey = keyof typeof tileLayers;