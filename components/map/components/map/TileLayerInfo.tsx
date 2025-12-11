// components/map/components/map/TileLayerInfo.tsx
'use client'

import { TileLayerConfig } from '@/types'
import { useState, useEffect } from 'react'

interface TileLayerInfoProps {
  layer: TileLayerConfig & { zoomLock?: { min: number; max: number }; defaultZoom?: number };
  isActive: boolean;
}

export function TileLayerInfo({ layer, isActive }: TileLayerInfoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      setIsExiting(false);
      
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => setIsVisible(false), 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsExiting(true);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isActive, layer.name]);

  if (!isVisible) return null;

  const getLayerColor = () => {
    if (layer.name.includes('Khusus')) return 'bg-purple-500';
    if (layer.name.includes('Satelit')) return 'bg-green-500';
    if (layer.name.includes('Topografi')) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getLayerIcon = () => {
    if (layer.name.includes('Khusus')) return '🗺️';
    if (layer.name.includes('Satelit')) return '🛰️';
    if (layer.name.includes('Topografi')) return '🏔️';
    return '🗺️';
  };

  return (
    <div className={`absolute bottom-20 left-4 z-1000 transition-all duration-300 ${
      isExiting ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'
    }`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs animate-slideInLeft">
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full ${getLayerColor()} flex items-center justify-center text-white text-sm`}>
            {getLayerIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {layer.name}
              </h4>
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(() => setIsVisible(false), 300);
                }}
                className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Tutup info"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zoom Info dengan lock status */}
            <div className="mb-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Zoom: {layer.zoomLock?.min || 0} - {layer.zoomLock?.max || 18}</span>
                {layer.defaultZoom && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Auto Zoom: {layer.defaultZoom}x
                  </span>
                )}
              </div>
              
              {/* Auto Zoom Notification */}
              {layer.defaultZoom && (
                <div className="bg-purple-50 p-1.5 rounded border border-purple-100 mb-2">
                  <div className="flex items-center space-x-1 text-xs text-purple-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Zoom otomatis ke {layer.defaultZoom}x saat aktif</span>
                  </div>
                </div>
              )}
              
              {/* Zoom Lock Indicator */}
              {layer.zoomLock && layer.zoomLock.min === 10 && layer.zoomLock.max === 14 && (
                <div className="flex items-center space-x-1 text-[10px] text-purple-600 bg-purple-50 p-1.5 rounded border border-purple-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Zoom terkunci 10-14 untuk optimasi peta</span>
                </div>
              )}
            </div>

            {/* Boundary Status */}
            {layer.hideBoundary && (
              <div className="mb-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                <div className="flex items-center space-x-1 mb-1">
                  <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-yellow-700">
                    Batas DIY dinonaktifkan
                  </span>
                </div>
                <div className="text-[11px] text-yellow-600">
                  Peta khusus sudah mencakup informasi batas wilayah
                </div>
              </div>
            )}

            {/* Layer Specific Info */}
            {layer.name.includes('Khusus') && (
              <div className="mb-2">
                <div className="text-xs font-medium text-purple-700 mb-1">Fitur Khusus:</div>
                <ul className="text-[11px] text-purple-600 space-y-0.5">
                  <li>• Data lokal DIY dari QGIS</li>
                  <li>• Dioptimalkan untuk analisis risiko</li>
                  <li>• Detail area spesifik DIY</li>
                  <li>• Update berkala berdasarkan data terbaru</li>
                  <li>• Zoom terkunci 10-14 untuk detail maksimal</li>
                  <li>• Zoom otomatis ke 10x saat aktif</li>
                  {layer.hideBoundary && (
                    <li>• Batas wilayah sudah termasuk dalam peta</li>
                  )}
                </ul>
              </div>
            )}

            {layer.name.includes('Satelit') && (
              <div className="mb-2">
                <div className="text-xs font-medium text-green-700 mb-1">Fitur:</div>
                <ul className="text-[11px] text-green-600 space-y-0.5">
                  <li>• Citra satelit resolusi tinggi</li>
                  <li>• Terlihat kondisi aktual lahan</li>
                  <li>• Cocok untuk analisis tutupan lahan</li>
                  <li>• Zoom fleksibel 9-16</li>
                </ul>
              </div>
            )}

            {layer.name.includes('Topografi') && (
              <div className="mb-2">
                <div className="text-xs font-medium text-orange-700 mb-1">Fitur:</div>
                <ul className="text-[11px] text-orange-600 space-y-0.5">
                  <li>• Garis kontur ketinggian</li>
                  <li>• Visualisasi medan 3D</li>
                  <li>• Analisis kemiringan lereng</li>
                  <li>• Zoom fleksibel 9-16</li>
                </ul>
              </div>
            )}

            {layer.name.includes('Standar') && (
              <div className="mb-2">
                <div className="text-xs font-medium text-blue-700 mb-1">Fitur:</div>
                <ul className="text-[11px] text-blue-600 space-y-0.5">
                  <li>• Data OpenStreetMap terbaru</li>
                  <li>• Jalan dan batas administratif</li>
                  <li>• Cocok untuk navigasi umum</li>
                  <li>• Zoom fleksibel 9-16</li>
                </ul>
              </div>
            )}

            {/* Attribution */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-[10px] text-gray-500 truncate" title={layer.attribution}>
                {layer.attribution}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              layer.name.includes('Khusus') ? 'bg-purple-500' :
              layer.name.includes('Satelit') ? 'bg-green-500' :
              layer.name.includes('Topografi') ? 'bg-orange-500' : 'bg-blue-500'
            }`}
            style={{
              animation: `shrink 5s linear forwards`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}