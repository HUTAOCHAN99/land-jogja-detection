// components/MapComponent.tsx - FIXED VERSION (WITHOUT LAYERS CONTROL)
'use client'

import 'leaflet/dist/leaflet.css'
import { useDIYGeoJSON } from '@/hooks/useDIYGeoJSON'
import { useState, useEffect, useRef } from 'react'
import { DIYBoundaryFallback } from './map/DIYBoundaryFallback'
import { PreciseDIYBoundary } from './map/PreciseDIYBoundary'
import { SidebarControl } from './map/SidebarControl'
import { TileLayerInfo } from './map/components/map/TileLayerInfo'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type { MapContainerProps } from 'react-leaflet'
import { tileLayers, TileLayerKey } from '@/types'
import L from 'leaflet'

export default function MapComponent() {
  const { diyFeature, loading: geoJSONLoading, sourceUsed } = useDIYGeoJSON()
  
  const [map, setMap] = useState<L.Map | null>(null)
  const [baseTileLayer, setBaseTileLayer] = useState<TileLayerKey>('satellite')
  const [overlayLayers, setOverlayLayers] = useState<{
    [key: string]: boolean;
  }>({})
  
  const [activeOverlayInfo, setActiveOverlayInfo] = useState<{key: string, name: string} | null>(null)
  const mapInitializedRef = useRef(false)

  // Handler untuk map ready
  const handleMapReady = (mapInstance: L.Map) => {
    if (!mapInitializedRef.current) {
      console.log('Map is ready')
      setMap(mapInstance)
      mapInitializedRef.current = true
      
      // Set initial zoom dan bounds
      const currentBaseLayer = tileLayers[baseTileLayer]
      
      if (currentBaseLayer?.zoomLock) {
        mapInstance.setMinZoom(currentBaseLayer.zoomLock.min)
        mapInstance.setMaxZoom(currentBaseLayer.zoomLock.max)
      }
      
      // Center ke DIY
      mapInstance.setView([-7.7972, 110.3688], 10)
    }
  }

  // Fungsi untuk mengubah base layer
  const handleBaseLayerChange = (layer: string) => {
    const layerKey = layer as TileLayerKey
    
    if (tileLayers[layerKey] && tileLayers[layerKey].isBaseLayer) {
      setBaseTileLayer(layerKey)
      
      const newLayer = tileLayers[layerKey]
      
      if (map) {
        if (Object.keys(overlayLayers).some(key => overlayLayers[key])) {
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

  // Fungsi untuk toggle overlay layer
  const toggleOverlayLayer = (layerKey: string) => {
    const key = layerKey as TileLayerKey
    const layer = tileLayers[key]
    
    if (layer && !layer.isBaseLayer) {
      const willBeActive = !overlayLayers[key]
      
      // Update state
      setOverlayLayers(prev => ({
        ...prev,
        [key]: willBeActive
      }))
      
      if (willBeActive) {
        // Set active overlay info untuk TileLayerInfo
        setActiveOverlayInfo({ key, name: layer.name })
        
        if (map) {
          // Otomatis set zoom untuk overlay
          setTimeout(() => {
            if (map && layer.defaultZoom) {
              map.setZoom(layer.defaultZoom)
              
              // Set zoom lock untuk overlay
              if (layer.zoomLock) {
                map.setMinZoom(layer.zoomLock.min)
                map.setMaxZoom(layer.zoomLock.max)
              }
            }
          }, 100)
        }
      } else {
        // Jika overlay dimatikan, reset active overlay info
        if (activeOverlayInfo?.key === key) {
          setActiveOverlayInfo(null)
        }
        
        // Jika tidak ada overlay aktif lagi, reset zoom ke base layer
        if (map && !Object.keys(overlayLayers).some(k => k !== key && overlayLayers[k])) {
          const currentBaseLayer = tileLayers[baseTileLayer]
          if (currentBaseLayer?.zoomLock) {
            map.setMinZoom(currentBaseLayer.zoomLock.min)
            map.setMaxZoom(currentBaseLayer.zoomLock.max)
          }
        }
      }
    }
  }

  // Effect untuk reset zoom ketika semua overlay dimatikan
  useEffect(() => {
    if (map && baseTileLayer) {
      const hasActiveOverlay = Object.keys(overlayLayers).some(key => overlayLayers[key])
      
      if (!hasActiveOverlay) {
        const currentBaseLayer = tileLayers[baseTileLayer]
        if (currentBaseLayer?.zoomLock) {
          map.setMinZoom(currentBaseLayer.zoomLock.min)
          map.setMaxZoom(currentBaseLayer.zoomLock.max)
        }
      }
    }
  }, [overlayLayers, baseTileLayer, map])

  const mapContainerProps: MapContainerProps = {
    center: [-7.7972, 110.3688] as [number, number],
    zoom: 10,
    style: { height: '100%', width: '100%' },
    scrollWheelZoom: true,
    className: "z-0"
  }

  // Tentukan apakah boundary harus ditampilkan
  // Boundary tidak ditampilkan jika ada overlay aktif
  const showBoundary = !Object.keys(overlayLayers).some(key => overlayLayers[key])

  // Dapatkan URL untuk tile layer yang aktif
  const getBaseTileLayerUrl = () => {
    const layer = tileLayers[baseTileLayer]
    return layer?.url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  // Dapatkan attribution untuk tile layer yang aktif
  const getBaseTileLayerAttribution = () => {
    const layer = tileLayers[baseTileLayer]
    return layer?.attribution || '© OpenStreetMap contributors'
  }

  return (
    <div className="relative h-full">
      <SidebarControl
        tileLayers={tileLayers}
        baseTileLayer={baseTileLayer}
        onBaseLayerChange={handleBaseLayerChange}
        overlayLayers={overlayLayers}
        onToggleOverlay={toggleOverlayLayer}
      />
      
      {/* Tile Layer Info Component */}
      {activeOverlayInfo && (
        <TileLayerInfo 
          layer={tileLayers[activeOverlayInfo.key]}
          isActive={true}
        />
      )}

      <MapContainer {...mapContainerProps}>
        {/* Tile layer untuk base map */}
        <TileLayer
          attribution={getBaseTileLayerAttribution()}
          url={getBaseTileLayerUrl()}
        />
        
        {/* Overlay layers */}
        {Object.entries(tileLayers)
          .filter(([key, layer]) => !layer.isBaseLayer && overlayLayers[key])
          .map(([key, layer]) => (
            <TileLayer
              key={key}
              attribution={layer.attribution}
              url={layer.url}
              opacity={layer.opacity || 0.8}
              minZoom={layer.minZoom || 10}
              maxZoom={layer.maxZoom || 14}
              tms={layer.tms || false}
            />
          ))
        }
        
        {/* Komponen untuk mendapatkan map instance */}
        <MapInstanceHandler onMapReady={handleMapReady} />
        
        {/* Batas DIY hanya ditampilkan jika tidak ada overlay aktif */}
        {showBoundary && !geoJSONLoading && diyFeature ? (
          <PreciseDIYBoundary 
            diyFeature={diyFeature} 
            source={sourceUsed}
          />
        ) : showBoundary ? (
          <DIYBoundaryFallback />
        ) : null}
      </MapContainer>

      {/* Layer info indicator */}
      <div className="absolute bottom-20 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 z-1000 min-w-[200px]">
        <div className="space-y-2">
          {/* Base Layer Info */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              baseTileLayer === 'satellite' ? 'bg-green-500' :
              baseTileLayer === 'terrain' ? 'bg-orange-500' : 'bg-blue-500'
            }`}></div>
            <div>
              <span className="text-xs font-medium text-gray-700">
                {tileLayers[baseTileLayer]?.name || 'Peta Dasar'}
              </span>
            </div>
          </div>
          
          {/* Active Overlays */}
          {Object.keys(overlayLayers)
            .filter(key => overlayLayers[key])
            .map(key => (
              <div key={key} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <span className="text-xs font-medium text-purple-700">
                    {tileLayers[key]?.name}
                  </span>
                  <div className="text-[10px] text-purple-600">
                    Zoom: {tileLayers[key]?.defaultZoom}x | Opacity: {tileLayers[key]?.opacity ? tileLayers[key].opacity * 100 : 80}%
                  </div>
                </div>
              </div>
            ))
          }
          
          {/* Boundary Status */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${showBoundary ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-[10px] text-gray-600">
                {showBoundary ? 'Batas DIY aktif' : 'Batas DIY tersembunyi'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Komponen helper untuk mendapatkan map instance
function MapInstanceHandler({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMapEvents({})
  
  useEffect(() => {
    if (map) {
      onMapReady(map)
    }
  }, [map, onMapReady])
  
  return null
}