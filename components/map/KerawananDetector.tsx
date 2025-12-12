// components/map/KerawananDetector.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

interface KerawananLevel {
  level: number
  name: string
  color: string
  rgb: [number, number, number] // RGB values for color matching
  tolerance: number // Color matching tolerance
}

// Skala kerawanan berdasarkan gambar (1-5)
const KERAWANAN_LEVELS: KerawananLevel[] = [
  {
    level: 1,
    name: "Sangat Rendah",
    color: "#00FF00", // Hijau terang
    rgb: [0, 255, 0],
    tolerance: 30
  },
  {
    level: 2,
    name: "Rendah",
    color: "#FFFF00", // Kuning
    rgb: [255, 255, 0],
    tolerance: 30
  },
  {
    level: 3,
    name: "Sedang",
    color: "#FFA500", // Orange
    rgb: [255, 165, 0],
    tolerance: 30
  },
  {
    level: 4,
    name: "Tinggi",
    color: "#FF0000", // Merah
    rgb: [255, 0, 0],
    tolerance: 30
  },
  {
    level: 5,
    name: "Sangat Tinggi",
    color: "#8B0000", // Merah tua
    rgb: [139, 0, 0],
    tolerance: 30
  }
]

interface KerawananDetectorProps {
  onKerawananDetected?: (level: number, name: string) => void
  isActive?: boolean
}

export default function KerawananDetector({ 
  onKerawananDetected, 
  isActive = false 
}: KerawananDetectorProps) {
  const map = useMap()
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const [detectedColor, setDetectedColor] = useState<string>('')
  const [position, setPosition] = useState<L.LatLng | null>(null)

  // Fungsi untuk menghitung jarak warna (color distance)
  const getColorDistance = useCallback((color1: [number, number, number], color2: [number, number, number]): number => {
    const [r1, g1, b1] = color1
    const [r2, g2, b2] = color2
    
    // Euclidean distance in RGB space
    return Math.sqrt(
      Math.pow(r2 - r1, 2) +
      Math.pow(g2 - g1, 2) +
      Math.pow(b2 - b1, 2)
    )
  }, [])

  // Fungsi untuk mendeteksi warna dari titik di peta
  const detectColorAtPoint = useCallback((latlng: L.LatLng): Promise<string> => {
    return new Promise((resolve) => {
      const point = map.latLngToContainerPoint(latlng)
      const container = map.getContainer()
      
      // Buat canvas untuk mengambil warna
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve('#000000')
        return
      }
      
      // Set canvas size
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      
      // Gambar peta ke canvas
      const layers = container.querySelectorAll('.leaflet-layer')
      layers.forEach(layer => {
        if (layer instanceof HTMLCanvasElement) {
          ctx.drawImage(layer, 0, 0)
        }
      })
      
      // Ambil warna di titik tersebut
      const imageData = ctx.getImageData(point.x, point.y, 1, 1)
      const [r, g, b] = imageData.data
      
      // Konversi ke hex
      const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
      resolve(hexColor)
    })
  }, [map])

  // Fungsi untuk konversi hex ke RGB
  const hexToRgb = useCallback((hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0]
  }, [])

  // Fungsi untuk menentukan level kerawanan berdasarkan warna
  const getKerawananLevelFromColor = useCallback((colorHex: string): { level: number, name: string } | null => {
    const colorRgb = hexToRgb(colorHex)
    
    let closestLevel: KerawananLevel | null = null
    let minDistance = Infinity
    
    // Cari level dengan warna terdekat
    KERAWANAN_LEVELS.forEach(level => {
      const distance = getColorDistance(colorRgb, level.rgb)
      if (distance < minDistance && distance <= level.tolerance) {
        minDistance = distance
        closestLevel = level
      }
    })
    

    return null
  }, [getColorDistance, hexToRgb])

  // Handler untuk klik pada peta
  useEffect(() => {
    if (!isActive || !map) return

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const { latlng } = e
      setPosition(latlng)
      
      try {
        // Deteksi warna di titik klik
        const detectedColorHex = await detectColorAtPoint(latlng)
        setDetectedColor(detectedColorHex)
        
        // Tentukan level kerawanan
        const kerawananInfo = getKerawananLevelFromColor(detectedColorHex)
        
        if (kerawananInfo) {
          setCurrentLevel(kerawananInfo.level)
          
          // Kirim data ke parent component
          if (onKerawananDetected) {
            onKerawananDetected(kerawananInfo.level, kerawananInfo.name)
          }
          
          // Tampilkan popup dengan informasi
          L.popup()
            .setLatLng(latlng)
            .setContent(`
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Tingkat Kerawanan</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 20px; height: 20px; background-color: ${detectedColorHex}; margin-right: 10px; border: 1px solid #ccc;"></div>
                  <div>
                    <strong>Level ${kerawananInfo.level}: ${kerawananInfo.name}</strong>
                  </div>
                </div>
                <div style="font-size: 12px; color: #666;">
                  Warna terdeteksi: ${detectedColorHex}<br>
                  Koordinat: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}
                </div>
              </div>
            `)
            .openOn(map)
        } else {
          L.popup()
            .setLatLng(latlng)
            .setContent(`
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Tidak Terdeteksi</h3>
                <p style="margin: 0; color: #666;">
                  Warna pada titik ini tidak sesuai dengan skala kerawanan.
                </p>
              </div>
            `)
            .openOn(map)
        }
      } catch (error) {
        console.error('Error detecting color:', error)
      }
    }

    // Tambahkan event listener
    map.on('click', handleClick)
    
    // Cleanup
    return () => {
      map.off('click', handleClick)
    }
  }, [map, isActive, onKerawananDetected, detectColorAtPoint, getKerawananLevelFromColor])

  // Effect untuk mode aktif/non-aktif
  useEffect(() => {
    if (!map) return

    if (isActive) {
      // Ubah cursor menjadi crosshair saat aktif
      map.getContainer().style.cursor = 'crosshair'
      
      // Tambahkan instruksi
      L.popup()
        .setLatLng(map.getCenter())
        .setContent(`
          <div style="padding: 15px; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Mode Deteksi Kerawanan</h3>
            <p style="margin: 0 0 10px 0; color: #666;">
              Klik pada peta untuk mendeteksi tingkat kerawanan berdasarkan warna.
            </p>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 10px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px;">Skala Kerawanan:</h4>
              ${KERAWANAN_LEVELS.map(level => `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <div style="width: 15px; height: 15px; background-color: ${level.color}; margin-right: 8px;"></div>
                  <span style="font-size: 12px;">Level ${level.level}: ${level.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `)
        .openOn(map)
    } else {
      // Reset cursor
      map.getContainer().style.cursor = ''
      
      // Tutup semua popup
      map.closePopup()
    }
  }, [map, isActive])

  if (!isActive) return null

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-300 z-1000 max-w-xs">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Deteksi Tingkat Kerawanan</h3>
      
      {/* Legend */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Skala Kerawanan:</h4>
        <div className="space-y-1">
          {KERAWANAN_LEVELS.map(level => (
            <div key={level.level} className="flex items-center">
              <div 
                className="w-4 h-4 mr-2 rounded-sm border border-gray-300"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-xs text-gray-600">
                Level {level.level}: {level.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Deteksi */}
      {currentLevel && (
        <div className="mt-3 p-3 rounded-md bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Hasil Deteksi:</span>
            <div className="flex items-center">
              <div 
                className="w-3 h-3 mr-1 rounded-sm"
                style={{ backgroundColor: detectedColor }}
              />
              <span className="text-xs text-gray-500">{detectedColor}</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`text-lg font-bold ${
              currentLevel >= 4 ? 'text-red-600' :
              currentLevel >= 3 ? 'text-orange-600' :
              currentLevel >= 2 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              Level {currentLevel}
            </div>
            <div className="ml-2 text-sm text-gray-600">
              {KERAWANAN_LEVELS.find(l => l.level === currentLevel)?.name}
            </div>
          </div>
          {position && (
            <div className="mt-1 text-xs text-gray-500">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Klik pada peta kerawanan untuk mendeteksi tingkat kerawanan
      </div>
    </div>
  )
}