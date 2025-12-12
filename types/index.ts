// types/index.ts
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
  category?: 'risk' | 'environment' | 'infrastructure' | 'diy';
}

export interface MapControlProps {
  tileLayers?: Record<string, TileLayerConfig>;
  baseTileLayer?: string;
  onBaseLayerChange?: (layer: string) => void;
  overlayLayers?: { [key: string]: boolean };
  onToggleOverlay?: (layer: string) => void;
}

// Tile layers configuration - UPDATED WITH ALL QGIS MAPS
export const tileLayers: Record<string, TileLayerConfig> = {
  // Base layers
  standard: {
    name: 'Standar OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true,
    category: 'infrastructure'
  },
  satellite: {
    name: 'Citra Satelit', 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true,
    category: 'environment'
  },
  terrain: {
    name: 'Topografi',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    hideBoundary: false,
    zoomLock: { min: 9, max: 16 },
    defaultZoom: 10,
    isBaseLayer: true,
    category: 'environment'
  },
  
  // QGIS DIY Maps - All in one category
  diy_kerawanan: {
    name: 'Peta Kerawanan DIY',
    url: '/tiles/kerawananan_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Kerawanan DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'risk'
  },
  diy_hujan: {
    name: 'Peta Curah Hujan DIY',
    url: '/tiles/hujan_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Curah Hujan DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'environment'
  },
  diy_jalan: {
    name: 'Peta Jaringan Jalan DIY',
    url: '/tiles/jalan_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Jalan DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'infrastructure'
  },
  diy_lahan: {
    name: 'Peta Penggunaan Lahan DIY',
    url: '/tiles/lahan_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Lahan DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'environment'
  },
  diy_slope: {
    name: 'Peta Kemiringan Lereng DIY',
    url: '/tiles/slope_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Kemiringan DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'environment'
  },
  diy_sungai: {
    name: 'Peta Jaringan Sungai DIY',
    url: '/tiles/sungai_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Sungai DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'environment'
  },
  diy_tanah: {
    name: 'Peta Jenis Tanah DIY',
    url: '/tiles/tanah_web/{z}/{x}/{y}.png',
    attribution: 'Created by QGIS - Data Tanah DIY',
    minZoom: 10,
    maxZoom: 14,
    tms: false,
    hideBoundary: true,
    zoomLock: { min: 10, max: 14 },
    defaultZoom: 12,
    opacity: 0.8,
    isBaseLayer: false,
    category: 'environment'
  }
};

export type TileLayerKey = keyof typeof tileLayers;