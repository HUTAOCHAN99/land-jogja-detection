// hooks/useMap.ts - COMPLETE FIXED VERSION WITH AUTO ZOOM ON OVERLAY
import { useState, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { RiskData, ViewportBounds, AnalyzedPoint, MapHistoryState, TileLayerKey, tileLayers } from '@/types'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export const useMapConfig = () => {
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showRiskZones, setShowRiskZones] = useState<boolean>(true)
  const [map, setMap] = useState<L.Map | null>(null)
  const [mapHistory, setMapHistory] = useState<MapHistoryState>({
    analyzedPoints: [],
    showHistory: false
  })
  const [toast, setToast] = useState<ToastState | null>(null)
  const [baseTileLayer, setBaseTileLayer] = useState<TileLayerKey>('satellite')
  const [overlayLayers, setOverlayLayers] = useState<{
    [key: string]: boolean;
  }>({
    custom_qgis: false
  })

  // Fungsi untuk menampilkan toast
  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fungsi untuk mendapatkan bounds dari environment variables
  const getDIYBounds = (): ViewportBounds => {
    const southWestLat = parseFloat(process.env.NEXT_PUBLIC_DIY_SOUTHWEST_LAT || '-8.2')
    const southWestLng = parseFloat(process.env.NEXT_PUBLIC_DIY_SOUTHWEST_LNG || '110.1')
    const northEastLat = parseFloat(process.env.NEXT_PUBLIC_DIY_NORTHEAST_LAT || '-7.5')
    const northEastLng = parseFloat(process.env.NEXT_PUBLIC_DIY_NORTHEAST_LNG || '110.7')
    
    return {
      southWest: [southWestLat, southWestLng],
      northEast: [northEastLat, northEastLng]
    }
  }

  const DIY_BOUNDS = getDIYBounds()

  // Fungsi untuk memeriksa apakah koordinat berada dalam DIY
  const isWithinDIYBounds = (lat: number, lng: number): boolean => {
    const bounds = L.latLngBounds(
      L.latLng(DIY_BOUNDS.southWest[0], DIY_BOUNDS.southWest[1]),
      L.latLng(DIY_BOUNDS.northEast[0], DIY_BOUNDS.northEast[1])
    )
    return bounds.contains(L.latLng(lat, lng))
  }

  // Fungsi untuk mengubah base layer
  const handleBaseLayerChange = (layer: string) => {
    const previousLayer = baseTileLayer
    const layerKey = layer as TileLayerKey
    
    // Periksa apakah layer yang dipilih adalah base layer
    if (tileLayers[layerKey] && tileLayers[layerKey].isBaseLayer) {
      setBaseTileLayer(layerKey)
      
      const newLayer = tileLayers[layerKey]
      
      if (map) {
        // Jika overlay peta khusus aktif, gunakan zoom lock dari overlay
        if (overlayLayers.custom_qgis) {
          const customLayer = tileLayers.custom_qgis
          map.setMinZoom(customLayer.zoomLock?.min || 9)
          map.setMaxZoom(customLayer.zoomLock?.max || 16)
          map.setZoom(customLayer.defaultZoom || 10)
          showToast(`Peta dasar diganti ke: ${newLayer.name} - Zoom tetap 10x (overlay aktif)`, 'info')
        } else {
          // Jika tidak ada overlay aktif, gunakan zoom lock dari base layer
          if (newLayer.zoomLock) {
            map.setMinZoom(newLayer.zoomLock.min)
            map.setMaxZoom(newLayer.zoomLock.max)
            
            // Adjust current zoom jika di luar range
            const currentZoom = map.getZoom()
            if (currentZoom < newLayer.zoomLock.min) {
              map.setZoom(newLayer.zoomLock.min)
            } else if (currentZoom > newLayer.zoomLock.max) {
              map.setZoom(newLayer.zoomLock.max)
            }
          }
          
          // Jika ada defaultZoom, set ke default
          if (newLayer.defaultZoom) {
            map.setZoom(newLayer.defaultZoom)
          }
          
          showToast(`Mengganti peta dasar ke: ${newLayer.name}`, 'info')
        }
      }
    } else {
      showToast('Layer yang dipilih bukan peta dasar', 'warning')
    }
  }

  // Fungsi untuk toggle overlay layer dengan auto zoom
  const toggleOverlayLayer = (layerKey: string) => {
    const key = layerKey as TileLayerKey
    const layer = tileLayers[key]
    
    // Hanya untuk layer yang bukan base layer
    if (layer && !layer.isBaseLayer) {
      const willBeActive = !overlayLayers[key]
      setOverlayLayers(prev => ({
        ...prev,
        [key]: willBeActive
      }))
      
      if (key === 'custom_qgis' && willBeActive && map) {
        // Otomatis set zoom ke 10 untuk peta khusus
        setTimeout(() => {
          if (map && layer.defaultZoom) {
            map.setZoom(layer.defaultZoom)
            
            // Juga set zoom lock
            if (layer.zoomLock) {
              map.setMinZoom(layer.zoomLock.min)
              map.setMaxZoom(layer.zoomLock.max)
            }
          }
        }, 100)
        
        showToast(`Mengaktifkan ${layer.name} - Zoom diatur ke ${layer.defaultZoom}x`, 'info')
      } else if (key === 'custom_qgis' && !willBeActive && map) {
        // Reset zoom lock ke base layer saat overlay dimatikan
        const currentBaseLayer = tileLayers[baseTileLayer]
        if (currentBaseLayer?.zoomLock) {
          map.setMinZoom(currentBaseLayer.zoomLock.min)
          map.setMaxZoom(currentBaseLayer.zoomLock.max)
        }
        
        showToast(`Menonaktifkan ${layer.name} - Zoom lock dikembalikan`, 'info')
      } else {
        const message = overlayLayers[key] 
          ? `Menonaktifkan overlay: ${layer.name}`
          : `Mengaktifkan overlay: ${layer.name}${layer.opacity ? ` (Opacity: ${layer.opacity * 100}%)` : ''}`
        
        showToast(message, 'info')
      }
    } else if (layer) {
      showToast('Layer ini adalah peta dasar, bukan overlay', 'warning')
    }
  }

  // Efek untuk reset zoom ketika overlay dimatikan
  useEffect(() => {
    if (map && !overlayLayers.custom_qgis && baseTileLayer) {
      // Reset zoom lock ke base layer saat overlay dimatikan
      const currentBaseLayer = tileLayers[baseTileLayer]
      if (currentBaseLayer?.zoomLock) {
        map.setMinZoom(currentBaseLayer.zoomLock.min)
        map.setMaxZoom(currentBaseLayer.zoomLock.max)
      }
    }
  }, [overlayLayers.custom_qgis, baseTileLayer, map])

  // Data detail untuk fallback alamat berdasarkan koordinat
  const getDetailedFallbackAddress = (lat: number, lng: number): string => {
    const locationDatabase: Array<{
      name: string
      type: 'kecamatan' | 'kelurahan' | 'desa' | 'kawasan' | 'jalan'
      bounds: [number, number, number, number]
      details: string
    }> = [
      { 
        name: "Malioboro", 
        type: "jalan", 
        bounds: [-7.793, 110.363, -7.790, 110.367],
        details: "Jalan Malioboro, Gondomanan, Yogyakarta" 
      },
      { 
        name: "Gejayan", 
        type: "jalan", 
        bounds: [-7.770, 110.370, -7.765, 110.375],
        details: "Jalan Gejayan, Depok, Sleman" 
      },
      { 
        name: "UGM", 
        type: "kawasan", 
        bounds: [-7.770, 110.377, -7.760, 110.387],
        details: "Kawasan Universitas Gadjah Mada, Bulaksumur, Sleman" 
      },
      { 
        name: "Depok", 
        type: "kecamatan", 
        bounds: [-7.765, 110.370, -7.745, 110.395],
        details: "Kecamatan Depok, Kabupaten Sleman" 
      },
      { 
        name: "Kaliurang", 
        type: "kawasan", 
        bounds: [-7.600, 110.430, -7.590, 110.440],
        details: "Kawasan Kaliurang, Cangkringan, Sleman" 
      },
      { 
        name: "Kasihan", 
        type: "kecamatan", 
        bounds: [-7.850, 110.320, -7.830, 110.340],
        details: "Kecamatan Kasihan, Bantul" 
      },
      { 
        name: "Wonosari", 
        type: "kecamatan", 
        bounds: [-7.970, 110.550, -7.950, 110.570],
        details: "Kecamatan Wonosari, Gunungkidul" 
      },
      { 
        name: "Wates", 
        type: "kecamatan", 
        bounds: [-7.870, 110.140, -7.850, 110.160],
        details: "Kecamatan Wates, Kulon Progo" 
      }
    ]

    // Cari lokasi yang sesuai dengan koordinat
    for (const location of locationDatabase) {
      const [minLat, minLng, maxLat, maxLng] = location.bounds
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        return `${location.details}, Daerah Istimewa Yogyakarta`
      }
    }

    // Fallback berdasarkan zona geografis dengan detail lebih
    const zone = getZoneName(lat, lng)
    const zoneDetails: Record<string, string> = {
      "Lereng Merapi": "Lereng Gunung Merapi, Kecamatan Cangkringan, Kabupaten Sleman, DIY",
      "Sleman Tengah": "Kecamatan Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta",
      "Kota Yogyakarta": "Kota Yogyakarta, Daerah Istimewa Yogyakarta",
      "Bantul": "Kabupaten Bantul, Daerah Istimewa Yogyakarta", 
      "Gunungkidul Timur": "Kawasan Karst Pegunungan Sewu, Kabupaten Gunungkidul, DIY",
      "Gunungkidul Barat": "Kabupaten Gunungkidul, Daerah Istimewa Yogyakarta",
      "Kulon Progo": "Kabupaten Kulon Progo, Daerah Istimewa Yogyakarta"
    }

    return zoneDetails[zone] || `Lokasi di ${zone}, Daerah Istimewa Yogyakarta`
  }

  const getZoneName = (lat: number, lng: number): string => {
    if (lat > -7.55 && lat < -7.65) return "Lereng Merapi"
    if (lat > -7.65 && lat < -7.75) return "Sleman Tengah"
    if (lat > -7.75 && lat < -7.85) return "Kota Yogyakarta"
    if (lat > -7.85 && lat < -8.00) return "Bantul"
    if (lat < -8.00 && lng > 110.40) return "Gunungkidul Timur"
    if (lat < -8.00) return "Gunungkidul Barat"
    if (lng < 110.25) return "Kulon Progo"
    return "DIY"
  }

  const fixLeafletIcon = () => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    }
  }

  useEffect(() => {
    fixLeafletIcon()
  }, [])

  const initMapBounds = useCallback((mapInstance: L.Map) => {
    const bounds = L.latLngBounds(
      L.latLng(DIY_BOUNDS.southWest[0], DIY_BOUNDS.southWest[1]),
      L.latLng(DIY_BOUNDS.northEast[0], DIY_BOUNDS.northEast[1])
    )
    
    mapInstance.setMaxBounds(bounds)
    mapInstance.on('drag', () => {
      mapInstance.panInsideBounds(bounds, { animate: false })
    })
    
    // Get center from environment variables or use default
    const centerLat = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '-7.7972')
    const centerLng = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '110.3688')
    
    // Set initial zoom berdasarkan base layer
    const currentLayer = tileLayers[baseTileLayer]
    const initialZoom = currentLayer?.defaultZoom || 10
    
    mapInstance.setView([centerLat, centerLng], initialZoom)
    
    // Set zoom bounds berdasarkan base layer
    if (currentLayer?.zoomLock) {
      mapInstance.setMinZoom(currentLayer.zoomLock.min)
      mapInstance.setMaxZoom(currentLayer.zoomLock.max)
    }
  }, [DIY_BOUNDS.northEast, DIY_BOUNDS.southWest, baseTileLayer])

  // Fungsi retry untuk fetch dengan timeout
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, timeout = 8000): Promise<Response> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying... ${retries} attempts left`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchWithRetry(url, options, retries - 1, timeout)
      }
      throw error
    }
  }

  const handleMapClick = async (lat: number, lng: number): Promise<void> => {
    // Validasi apakah koordinat berada dalam DIY
    if (!isWithinDIYBounds(lat, lng)) {
      showToast(
        'Silakan pilih lokasi dalam wilayah DIY Yogyakarta untuk analisis risiko.',
        'warning'
      )
      
      // Show warning popup on map
      if (map) {
        const warningPopup = L.popup()
          .setLatLng([lat, lng])
          .setContent(`
            <div style="padding: 12px; min-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="background: #f59e0b; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 14px;">
                  ⚠️
                </span>
                <div>
                  <strong style="color: #d97706; font-size: 15px;">Area di Luar DIY</strong>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">${getZoneName(lat, lng)}</div>
                </div>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
                Sistem hanya mendukung analisis risiko untuk wilayah Daerah Istimewa Yogyakarta.
              </p>
              <div style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px; color: #6b7280;">
                📍 Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}
              </div>
            </div>
          `)
        
        // Add a temporary warning marker
        const warningMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<div style="background: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">⚠️</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }),
          zIndexOffset: 1000
        })
          .addTo(map)
          .bindPopup(warningPopup)
          .openPopup()
        
        // Remove marker after 5 seconds
        setTimeout(() => {
          if (map && warningMarker) {
            map.removeLayer(warningMarker)
          }
        }, 5000)
      }
      
      return
    }
    
    // Jika dalam bounds, lanjutkan analisis
    setClickedPosition([lat, lng])
    setLoading(true)
    
    try {
      console.log(`🗺️ Mengirim permintaan ke /api/risk-analysis...`)
      
      const response = await fetchWithRetry('/api/risk-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          latitude: Number(lat.toFixed(6)), 
          longitude: Number(lng.toFixed(6)) 
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Gagal mengambil data risiko'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          
          if (response.status === 400) {
            errorMessage += ` (Koordinat tidak valid)`
          } else if (response.status === 500) {
            errorMessage += ` (Server error)`
            
            // Gunakan fallback data dari server jika ada
            if (errorData.fallbackData) {
              console.log('🔄 Using fallback data from server')
              setRiskData(errorData.fallbackData)
              
              const newPoint: AnalyzedPoint = {
                id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                position: [lat, lng],
                riskData: errorData.fallbackData,
                timestamp: new Date().toISOString()
              }
              
              setMapHistory(prev => ({
                ...prev,
                analyzedPoints: [...prev.analyzedPoints, newPoint]
              }))
              
              showToast('Analisis berhasil (menggunakan data cadangan)', 'success')
              setLoading(false)
              return
            }
          }
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      const data: RiskData = await response.json()
      console.log('✅ Data risiko diterima dari API baru:', data)
      setRiskData(data)
      
      const newPoint: AnalyzedPoint = {
        id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: [lat, lng],
        riskData: data,
        timestamp: new Date().toISOString()
      }
      
      setMapHistory(prev => ({
        ...prev,
        analyzedPoints: [...prev.analyzedPoints, newPoint]
      }))
      
      showToast('Analisis risiko berhasil dilakukan', 'success')
      
    } catch (error) {
      console.error('❌ Error fetching risk data:', error)
      
      // Fallback data dengan alamat yang sangat detail
      const isNorthernArea = lat > -7.65
      const isSouthernArea = lat < -8.0
      const isKulonProgo = lng < 110.25
      const isUrbanArea = lat > -7.78 && lat < -7.82 && lng > 110.35 && lng < 110.42
      
      const fallbackAddress = getDetailedFallbackAddress(lat, lng)
      
      const fallbackData: RiskData = {
        elevation: isNorthernArea ? 350 + Math.random() * 250 :
                   isSouthernArea ? 220 + Math.random() * 130 :
                   isKulonProgo ? 120 + Math.random() * 80 :
                   isUrbanArea ? 115 + Math.random() * 10 :
                   100 + Math.random() * 100,
        slope: isNorthernArea ? 25 + Math.random() * 15 : 
               isSouthernArea ? 15 + Math.random() * 10 : 
               isKulonProgo ? 10 + Math.random() * 10 :
               isUrbanArea ? 2 + Math.random() * 3 :
               5 + Math.random() * 10,
        landCover: isNorthernArea ? 'Hutan' : 
                   isSouthernArea ? 'Lahan Kering Berbatu' : 
                   isKulonProgo ? 'Tegalan' :
                   isUrbanArea ? 'Permukiman Padat' :
                   'Permukiman',
        rainfall: isNorthernArea ? 220 + Math.random() * 60 :
                  isSouthernArea ? 130 + Math.random() * 50 :
                  isUrbanArea ? 180 + Math.random() * 40 :
                  150 + Math.random() * 50,
        riskLevel: isNorthernArea ? 'high' : 
                   isSouthernArea ? 'medium' : 
                   isUrbanArea ? 'low' :
                   'low',
        riskScore: isNorthernArea ? 72 + Math.random() * 18 :
                   isSouthernArea ? 45 + Math.random() * 20 :
                   isUrbanArea ? 25 + Math.random() * 15 :
                   30 + Math.random() * 20,
        soilType: isNorthernArea ? 'Andosol (Vulkanik)' :
                  isSouthernArea ? 'Grumusol (Liat Kapur)' :
                  isKulonProgo ? 'Mediteran' :
                  isUrbanArea ? 'Aluvial' :
                  'Latosol',
        geologicalRisk: 'Data Simulasi - Sistem Offline',
        address: fallbackAddress,
        accuracy: 55 + Math.random() * 25,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: {
            elevation: 'Fallback system',
            geospatial: 'Simulated data',
            address: 'Coordinate-based'
          },
          resolution: '30m',
          confidence: 60,
          processingTime: 100
        }
      }
      
      setRiskData(fallbackData)
      
      const newPoint: AnalyzedPoint = {
        id: `point-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: [lat, lng],
        riskData: fallbackData,
        timestamp: new Date().toISOString()
      }
      
      setMapHistory(prev => ({
        ...prev,
        analyzedPoints: [...prev.analyzedPoints, newPoint]
      }))
      
      showToast('Menggunakan data simulasi (koneksi terbatas)', 'warning')
      
    } finally {
      setLoading(false)
    }
  }

  const clearRiskData = () => {
    setRiskData(null)
    setClickedPosition(null)
  }

  const toggleShowHistory = (show: boolean) => {
    setMapHistory(prev => ({ ...prev, showHistory: show }))
  }

  const clearHistory = () => {
    setMapHistory(prev => ({ ...prev, analyzedPoints: [] }))
    showToast('Riwayat analisis telah dihapus', 'info')
  }

  const handleMapReady = useCallback((mapInstance: L.Map) => {
    setMap(mapInstance)
    initMapBounds(mapInstance)
  }, [initMapBounds])

  // Fungsi untuk mendapatkan pusat peta dari environment
  const getMapCenter = (): [number, number] => {
    const lat = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '-7.7972')
    const lng = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '110.3688')
    return [lat, lng]
  }

  return {
    clickedPosition,
    riskData,
    loading,
    showRiskZones,
    map,
    mapHistory,
    toast,
    setToast,
    baseTileLayer,
    overlayLayers,
    tileLayers,
    handleBaseLayerChange,
    toggleOverlayLayer,
    setShowRiskZones,
    setMap,
    setRiskData,
    handleMapClick,
    initMapBounds,
    clearRiskData,
    handleMapReady,
    toggleShowHistory,
    clearHistory,
    getMapCenter,
    DIY_BOUNDS,
    showToast
  }
}