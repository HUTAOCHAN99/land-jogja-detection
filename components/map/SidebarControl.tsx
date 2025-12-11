// components/map/SidebarControl.tsx - COMPLETE FIXED VERSION WITH AUTO ZOOM INFO
'use client'
import { useState } from 'react'
import { MapControlProps, TileLayerConfig, TileLayerKey } from "@/types";

interface ExtendedMapControlProps extends MapControlProps {
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

export function SidebarControl({ 
  showRiskZones, 
  onRiskZonesChange, 
  tileLayers,
  baseTileLayer,
  onBaseLayerChange,
  overlayLayers = {},
  onToggleOverlay,
  showHistory = false,
  onHistoryChange,
  historyCount = 0,
  onClearHistory,
  showHeatmap = false,
  onHeatmapChange
}: ExtendedMapControlProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {historyCount}
            </span>
          )}
        </div>
      </button>

      {/* Sidebar */}
      <div className={`absolute top-0 right-0 h-full z-1000 bg-white/95 backdrop-blur-sm shadow-lg border-l border-gray-200 transition-all duration-200 ${
        isOpen ? 'w-64' : 'w-0'
      }`}>
        <div className={`h-full overflow-y-auto ${isOpen ? 'p-4' : 'p-0 opacity-0'}`}>
          
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Kontrol Peta</h2>
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
          {tileLayers && onBaseLayerChange && baseTileLayer && (
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
              {/* Current layer info */}
              {baseTileLayer && tileLayers[baseTileLayer as TileLayerKey] && (
                <div className="mt-2 p-2 rounded border bg-blue-50 border-blue-200">
                  <div className="text-xs text-blue-700">
                    Zoom: {tileLayers[baseTileLayer as TileLayerKey]?.zoomLock?.min || 9} - {tileLayers[baseTileLayer as TileLayerKey]?.zoomLock?.max || 16}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overlay Layer Controls */}
          {onToggleOverlay && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-900 mb-2">Layer Overlay</label>
              <div className="space-y-2">
                {Object.entries(tileLayers || {})
                  .filter(([key, layer]) => !layer.isBaseLayer)
                  .map(([key, layer]) => (
                    <label key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={overlayLayers[key] || false}
                          onChange={() => onToggleOverlay(key)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div>
                          <span className="text-xs text-gray-700">{layer.name}</span>
                          {key === 'custom_qgis' && layer.defaultZoom && (
                            <div className="text-[10px] text-purple-600">
                              Auto zoom: {layer.defaultZoom}x
                            </div>
                          )}
                        </div>
                      </div>
                      {layer.opacity && (
                        <span className="text-[10px] text-gray-500">
                          Opacity: {layer.opacity * 100}%
                        </span>
                      )}
                    </label>
                  ))
                }
              </div>
              {overlayLayers.custom_qgis && (
                <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="text-xs text-purple-700">
                    🔒 Zoom terkunci 10-14<br/>
                    🎯 Auto zoom ke 10x
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Layer Toggles */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Layer Tampilan</h3>
            <div className="space-y-2">
              {/* Risk Zones Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">Zona Risiko</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRiskZones}
                    onChange={(e) => onRiskZonesChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* History Points Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-900">Titik Analisis</span>
                  {historyCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                      {historyCount}
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHistory}
                    onChange={(e) => onHistoryChange?.(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Heatmap Toggle */}
              {onHeatmapChange && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">Heatmap Risiko</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => onHeatmapChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* History Management */}
          {historyCount > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900">Riwayat Analisis</span>
                <span className="text-xs text-gray-600">{historyCount} titik</span>
              </div>
              <button
                onClick={onClearHistory}
                className="w-full text-xs bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded transition-colors flex items-center justify-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Hapus Semua</span>
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Legenda Risiko</h3>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm"></div>
                <span className="text-xs font-medium text-gray-900">Tinggi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full border border-white shadow-sm"></div>
                <span className="text-xs font-medium text-gray-900">Sedang</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"></div>
                <span className="text-xs font-medium text-gray-900">Rendah</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50/80 p-3 rounded border border-blue-200/50">
            <h4 className="text-xs font-semibold text-blue-800 mb-1.5">Tips Cepat</h4>
            <ul className="text-[11px] text-blue-700 space-y-0.5">
              <li>• Klik area untuk analisis risiko</li>
              <li>• Aktifkan Titik Analisis untuk melihat riwayat</li>
              <li>• Pilih Peta Dasar di dropdown atas</li>
              <li>• Aktifkan Peta Khusus DIY sebagai overlay</li>
              <li>• Peta Khusus: Auto zoom ke 10x, Zoom 10-14</li>
              <li>• Merah: Risiko Tinggi</li>
              <li>• Kuning: Risiko Sedang</li>
              <li>• Hijau: Risiko Rendah</li>
            </ul>
          </div>

          {/* Overlay Status */}
          {overlayLayers.custom_qgis && (
            <div className="bg-purple-50/80 p-3 rounded border border-purple-200/50 mt-3">
              <h4 className="text-xs font-semibold text-purple-800 mb-1.5">Status Overlay Aktif</h4>
              <ul className="text-[11px] text-purple-700 space-y-0.5">
                <li>• ✅ Peta Khusus DIY aktif</li>
                <li>• 🔒 Zoom terkunci 10-14</li>
                <li>• 🎯 Zoom saat ini: 10x</li>
                <li>• 📍 Batas DIY tersembunyi</li>
                <li>• 💡 Peta khusus QGIS detail</li>
              </ul>
            </div>
          )}
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