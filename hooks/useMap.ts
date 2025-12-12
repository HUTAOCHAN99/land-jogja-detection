// hooks/useMap.ts - SIMPLIFIED VERSION
import { useState, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { tileLayers, TileLayerKey } from '@/types'

export const useMapConfig = () => {
  const [map, setMap] = useState<L.Map | null>(null)
  const [baseTileLayer, setBaseTileLayer] = useState<TileLayerKey>('satellite')
  const [overlayLayers, setOverlayLayers] = useState<{
    [key: string]: boolean;
  }>({})

  // Fix leaflet icon
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
    const DIY_BOUNDS = {
      southWest: [-8.2, 110.1] as [number, number],
      northEast: [-7.5, 110.7] as [number, number]
    }
    
    const bounds = L.latLngBounds(
      L.latLng(DIY_BOUNDS.southWest[0], DIY_BOUNDS.southWest[1]),
      L.latLng(DIY_BOUNDS.northEast[0], DIY_BOUNDS.northEast[1])
    )
    
    mapInstance.setMaxBounds(bounds)
    mapInstance.on('drag', () => {
      mapInstance.panInsideBounds(bounds, { animate: false })
    })
    
    // Set initial zoom berdasarkan base layer
    const currentLayer = tileLayers[baseTileLayer]
    const initialZoom = currentLayer?.defaultZoom || 10
    
    mapInstance.setView([-7.7972, 110.3688], initialZoom)
    
    // Set zoom bounds berdasarkan base layer
    if (currentLayer?.zoomLock) {
      mapInstance.setMinZoom(currentLayer.zoomLock.min)
      mapInstance.setMaxZoom(currentLayer.zoomLock.max)
    }
  }, [baseTileLayer])

  const handleBaseLayerChange = (layer: string) => {
    const layerKey = layer as TileLayerKey
    
    if (tileLayers[layerKey] && tileLayers[layerKey].isBaseLayer) {
      setBaseTileLayer(layerKey)
      
      const newLayer = tileLayers[layerKey]
      
      if (map) {
        const hasActiveOverlay = Object.keys(overlayLayers).some(key => overlayLayers[key])
        
        if (hasActiveOverlay) {
          // Jika ada overlay aktif, gunakan zoom lock dari overlay pertama
          const firstActiveOverlay = Object.keys(overlayLayers).find(key => overlayLayers[key])
          if (firstActiveOverlay && tileLayers[firstActiveOverlay]) {
            const overlayLayer = tileLayers[firstActiveOverlay]
            map.setMinZoom(overlayLayer.zoomLock?.min || 10)
            map.setMaxZoom(overlayLayer.zoomLock?.max || 14)
            map.setZoom(overlayLayer.defaultZoom || 12)
          }
        } else {
          // Jika tidak ada overlay aktif, gunakan zoom lock dari base layer
          if (newLayer.zoomLock) {
            map.setMinZoom(newLayer.zoomLock.min)
            map.setMaxZoom(newLayer.zoomLock.max)
            
            const currentZoom = map.getZoom()
            if (currentZoom < newLayer.zoomLock.min) {
              map.setZoom(newLayer.zoomLock.min)
            } else if (currentZoom > newLayer.zoomLock.max) {
              map.setZoom(newLayer.zoomLock.max)
            }
          }
          
          if (newLayer.defaultZoom) {
            map.setZoom(newLayer.defaultZoom)
          }
        }
      }
    }
  }

  const toggleOverlayLayer = (layerKey: string) => {
    const key = layerKey as TileLayerKey
    const layer = tileLayers[key]
    
    if (layer && !layer.isBaseLayer) {
      const willBeActive = !overlayLayers[key]
      
      setOverlayLayers(prev => ({
        ...prev,
        [key]: willBeActive
      }))
      
      if (willBeActive && map) {
        // Otomatis set zoom untuk overlay
        setTimeout(() => {
          if (map && layer.defaultZoom) {
            map.setZoom(layer.defaultZoom)
            
            if (layer.zoomLock) {
              map.setMinZoom(layer.zoomLock.min)
              map.setMaxZoom(layer.zoomLock.max)
            }
          }
        }, 100)
      } else if (!willBeActive && map) {
        // Jika overlay dimatikan dan tidak ada overlay aktif lagi
        const hasOtherActiveOverlay = Object.keys(overlayLayers).some(
          k => k !== key && overlayLayers[k]
        )
        
        if (!hasOtherActiveOverlay) {
          const currentBaseLayer = tileLayers[baseTileLayer]
          if (currentBaseLayer?.zoomLock) {
            map.setMinZoom(currentBaseLayer.zoomLock.min)
            map.setMaxZoom(currentBaseLayer.zoomLock.max)
          }
        }
      }
    }
  }

  const handleMapReady = useCallback((mapInstance: L.Map) => {
    setMap(mapInstance)
    initMapBounds(mapInstance)
  }, [initMapBounds])

  return {
    map,
    baseTileLayer,
    overlayLayers,
    tileLayers,
    handleBaseLayerChange,
    toggleOverlayLayer,
    setMap,
    handleMapReady
  }
}