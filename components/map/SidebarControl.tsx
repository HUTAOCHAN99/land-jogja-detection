// components/map/SidebarControl.tsx - SIMPLIFIED VERSION
'use client'
import { useState } from 'react'
import { TileLayerConfig, TileLayerKey } from "@/types";

interface SidebarControlProps {
  tileLayers: Record<string, TileLayerConfig>;
  baseTileLayer: string;
  onBaseLayerChange: (layer: string) => void;
  overlayLayers: { [key: string]: boolean };
  onToggleOverlay: (layer: string) => void;
}

// Group layers by category
const groupLayersByCategory = (layers: Record<string, TileLayerConfig>) => {
  const categories: Record<string, Array<{key: string; layer: TileLayerConfig}>> = {};
  
  Object.entries(layers).forEach(([key, layer]) => {
    if (!layer.isBaseLayer) {
      const category = layer.category || 'diy';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ key, layer });
    }
  });
  
  return categories;
};

// Category labels
const categoryLabels: Record<string, string> = {
  'risk': 'Peta Risiko',
  'environment': 'Peta Lingkungan',
  'infrastructure': 'Peta Infrastruktur',
  'diy': 'Peta DIY'
};

export function SidebarControl({ 
  tileLayers,
  baseTileLayer,
  onBaseLayerChange,
  overlayLayers,
  onToggleOverlay
}: SidebarControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const groupedLayers = groupLayersByCategory(tileLayers);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'risk': return '⚠️';
      case 'environment': return '🌿';
      case 'infrastructure': return '🛣️';
      default: return '🗺️';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 z-1000 bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-all"
        title="Kontrol Peta"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </button>

      {/* Sidebar */}
      <div className={`absolute top-0 right-0 h-full z-1000 bg-white/95 backdrop-blur-sm shadow-lg border-l border-gray-200 transition-all duration-200 ${
        isOpen ? 'w-80' : 'w-0'
      }`}>
        <div className={`h-full overflow-y-auto ${isOpen ? 'p-4' : 'p-0 opacity-0'}`}>
          
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Kontrol Peta DIY</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Base Layer Selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-900 mb-2">Peta Dasar</label>
            <select 
              value={baseTileLayer}
              onChange={(e) => onBaseLayerChange(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
            >
              {Object.entries(tileLayers)
                .filter(([key, layer]) => layer.isBaseLayer)
                .map(([key, layer]) => (
                  <option key={key} value={key}>{layer.name}</option>
                ))
              }
            </select>
          </div>

          {/* Category Tabs */}
          {Object.keys(groupedLayers).length > 0 && (
            <div className="mb-4">
              <div className="flex space-x-1 mb-3 overflow-x-auto pb-2">
                {Object.keys(groupedLayers).map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      activeCategory === category 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{getCategoryIcon(category)}</span>
                    <span>{categoryLabels[category] || category}</span>
                    <span className="bg-gray-300 text-gray-700 text-[10px] px-1 rounded-full">
                      {groupedLayers[category].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer Controls - Filtered by Category */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-900">Layer Overlay</label>
              {activeCategory && (
                <span className="text-xs text-purple-600">
                  {categoryLabels[activeCategory] || activeCategory}
                </span>
              )}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {Object.entries(tileLayers)
                .filter(([key, layer]) => {
                  if (!activeCategory) return !layer.isBaseLayer;
                  return !layer.isBaseLayer && layer.category === activeCategory;
                })
                .map(([key, layer]) => (
                  <div key={key} className="bg-gray-50/50 p-2 rounded border border-gray-200">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={overlayLayers[key] || false}
                          onChange={() => onToggleOverlay(key)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {layer.name}
                          </div>
                          {layer.defaultZoom && (
                            <div className="text-[10px] text-purple-600">
                              Zoom: {layer.zoomLock?.min || 10}-{layer.zoomLock?.max || 14} (auto {layer.defaultZoom}x)
                            </div>
                          )}
                        </div>
                      </div>
                      {layer.opacity && (
                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded">
                          {layer.opacity * 100}%
                        </span>
                      )}
                    </label>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Active Layers Summary */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Layer Aktif</h3>
            <div className="space-y-1">
              {tileLayers[baseTileLayer] && (
                <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-700">
                    {tileLayers[baseTileLayer].name}
                  </span>
                </div>
              )}
              
              {Object.entries(overlayLayers)
                .filter(([_, isActive]) => isActive)
                .map(([key, _]) => (
                  tileLayers[key] && (
                    <div key={key} className="flex items-center space-x-2 bg-purple-50 p-2 rounded border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-xs text-purple-700">
                        {tileLayers[key].name}
                      </span>
                      <span className="text-[10px] text-purple-600 ml-auto">
                        {tileLayers[key].opacity ? `${tileLayers[key].opacity! * 100}%` : '80%'}
                      </span>
                    </div>
                  )
                ))
              }
              
              {Object.keys(overlayLayers).filter(key => overlayLayers[key]).length === 0 && (
                <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded">
                  Tidak ada overlay yang aktif
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Legenda</h3>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"></div>
                <span className="text-xs font-medium text-gray-900">Wilayah DIY</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full border border-white shadow-sm"></div>
                <span className="text-xs font-medium text-gray-900">Luar DIY</span>
              </div>
            </div>
          </div>

          {/* Map Information */}
          <div className="bg-blue-50/80 p-3 rounded border border-blue-200/50">
            <h4 className="text-xs font-semibold text-blue-800 mb-1.5">Informasi Peta</h4>
            <ul className="text-[11px] text-blue-700 space-y-0.5">
              <li>• Zoom range: 9-16 (base), 10-14 (overlay)</li>
              <li>• Sentral: DIY Yogyakarta</li>
              <li>• Overlay auto zoom ke 12x</li>
              <li>• 7 peta khusus QGIS tersedia</li>
              <li>• Update data berkala</li>
            </ul>
          </div>

          {/* Categories Info */}
          <div className="mt-4 p-3 bg-gray-50/80 rounded border border-gray-200/50">
            <h4 className="text-xs font-semibold text-gray-800 mb-1.5">Kategori Peta</h4>
            <div className="text-[11px] text-gray-700 space-y-1">
              <div className="flex items-center space-x-1">
                <span>⚠️</span>
                <span><strong>Peta Risiko:</strong> Kerawanan longsor</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🌿</span>
                <span><strong>Peta Lingkungan:</strong> Hujan, Lahan, Slope, Sungai, Tanah</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🛣️</span>
                <span><strong>Peta Infrastruktur:</strong> Jaringan jalan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop untuk klik luar sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-999 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}