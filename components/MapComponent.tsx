// components/MapComponent.tsx - FIXED VERSION
'use client'

import 'leaflet/dist/leaflet.css'
import { useMapConfig } from '@/hooks/useMap'
import { useDIYGeoJSON } from '@/hooks/useDIYGeoJSON'
import { useState, useEffect, useRef } from 'react'
import { DIYBoundaryFallback } from './map/DIYBoundaryFallback'
import { InfoPanel } from './map/InfoPanel'
import { LoadingIndicator } from './map/LoadingIndicator'
import { MapClickHandler } from './map/MapClickHandler'
import { PreciseDIYBoundary } from './map/PreciseDIYBoundary'
import { RiskMarker } from './map/RiskMarker'
import { SidebarControl } from './map/SidebarControl'
import { HistoryMarkers } from './map/HistoryMarkers'
import { DataSourceInfo } from './map/DataSourceInfo'
import { MapContainer, TileLayer, useMapEvents, LayersControl } from 'react-leaflet'
import type { MapContainerProps } from 'react-leaflet'
import { AnalyzedPoint, TileLayerKey } from '@/types'
import { Toast } from './map/Toast'
import { TileLayerInfo } from './map/components/map/TileLayerInfo'
import L from 'leaflet'

const { BaseLayer, Overlay } = LayersControl

export default function MapComponent() {
  const {
    clickedPosition,
    riskData,
    loading,
    showRiskZones,
    setShowRiskZones,
    handleMapClick,
    clearRiskData,
    mapHistory,
    toggleShowHistory,
    clearHistory,
    toast,
    setToast,
    baseTileLayer,
    overlayLayers,
    tileLayers,
    handleBaseLayerChange,
    toggleOverlayLayer,
    map, // INI DITAMBAHKAN
    setMap
  } = useMapConfig()

  const { diyFeature, loading: geoJSONLoading, sourceUsed } = useDIYGeoJSON()
  
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false)
  const mapInitializedRef = useRef(false)

  const handleRiskMarkerClose = () => {
    clearRiskData()
  }

  const handleHistoryMarkerClick = (point: AnalyzedPoint) => {
    console.log('History marker clicked:', point)
  }

  // Handler untuk map click
  const handleMapClickWithError = async (lat: number, lng: number) => {
    try {
      await handleMapClick(lat, lng)
    } catch (error) {
      console.error('Map click error:', error)
    }
  }

  // Handler ketika map siap
  const handleMapReady = (mapInstance: L.Map) => {
    if (!mapInitializedRef.current) {
      console.log('Map is ready')
      setMap(mapInstance)
      mapInitializedRef.current = true
      
      // Set initial zoom dan bounds berdasarkan base layer
      const currentBaseLayer = tileLayers[baseTileLayer]
      
      if (currentBaseLayer?.zoomLock) {
        mapInstance.setMinZoom(currentBaseLayer.zoomLock.min)
        mapInstance.setMaxZoom(currentBaseLayer.zoomLock.max)
      }
      
      // Center ke DIY
      mapInstance.setView([-7.7972, 110.3688], 10)
    }
  }

  // Effect untuk reset zoom ketika overlay dimatikan
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

  const mapContainerProps: MapContainerProps = {
    center: [-7.7972, 110.3688] as [number, number],
    zoom: 10,
    style: { height: '100%', width: '100%' },
    scrollWheelZoom: true,
    className: "z-0"
  }

  // Get current base layer config
  const currentBaseLayer = tileLayers[baseTileLayer]
  
  // Tentukan apakah boundary harus ditampilkan
  // Boundary tidak ditampilkan jika overlay peta khusus aktif
  const showBoundary = !overlayLayers.custom_qgis

  return (
    <div className="relative h-full">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <SidebarControl
        showRiskZones={showRiskZones}
        onRiskZonesChange={setShowRiskZones}
        tileLayers={tileLayers}
        baseTileLayer={baseTileLayer}
        onBaseLayerChange={handleBaseLayerChange}
        overlayLayers={overlayLayers}
        onToggleOverlay={toggleOverlayLayer}
        showHistory={mapHistory.showHistory}
        onHistoryChange={toggleShowHistory}
        historyCount={mapHistory.analyzedPoints.length}
        onClearHistory={clearHistory}
        showHeatmap={showHeatmap}
        onHeatmapChange={setShowHeatmap}
      />
      
      {/* Tile Layer Info Component */}
      {overlayLayers.custom_qgis && (
        <TileLayerInfo 
          layer={tileLayers.custom_qgis}
          isActive={true}
        />
      )}

      <MapContainer {...mapContainerProps}>
        {/* Layers Control untuk base layer dan overlay */}
        <LayersControl position="topright">
          {/* Base Layers */}
          <BaseLayer checked={baseTileLayer === 'satellite'} name="Satelit">
            <TileLayer
              attribution="© Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
          
          <BaseLayer checked={baseTileLayer === 'standard'} name="Standar">
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          
          <BaseLayer checked={baseTileLayer === 'terrain'} name="Topografi">
            <TileLayer
              attribution="© OpenTopoMap"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          
          {/* Overlay Layers */}
          <Overlay checked={overlayLayers.custom_qgis} name="Peta Khusus DIY">
            <TileLayer
              attribution="Created by QGIS"
              url="/tiles/{z}/{x}/{y}.png"
              opacity={tileLayers.custom_qgis.opacity || 0.7}
              minZoom={tileLayers.custom_qgis.minZoom || 10}
              maxZoom={tileLayers.custom_qgis.maxZoom || 14}
              tms={tileLayers.custom_qgis.tms || false}
            />
          </Overlay>
        </LayersControl>
        
        {/* Komponen untuk mendapatkan map instance */}
        <MapInstanceHandler onMapReady={handleMapReady} />
      
        {/* History Markers */}
        <HistoryMarkers 
          points={mapHistory.analyzedPoints}
          visible={mapHistory.showHistory}
          onMarkerClick={handleHistoryMarkerClick}
        />
        
        {/* Batas DIY hanya ditampilkan jika overlay peta khusus tidak aktif */}
        {showBoundary && !geoJSONLoading && diyFeature ? (
          <PreciseDIYBoundary 
            diyFeature={diyFeature} 
            source={sourceUsed}
          />
        ) : showBoundary ? (
          <DIYBoundaryFallback />
        ) : null}
        
        <MapClickHandler onMapClick={handleMapClickWithError} />
        
        {/* Current Marker */}
        {clickedPosition && riskData && !loading && (
          <RiskMarker 
            position={clickedPosition} 
            riskData={riskData} 
            onClose={handleRiskMarkerClose}
          />
        )}
      </MapContainer>

      {/* Status Indicators */}
      {geoJSONLoading && showBoundary && (
        <div className="absolute top-4 left-4 bg-white/90 p-2 rounded-lg shadow-md border border-gray-200 z-1000">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
            <span className="text-xs text-gray-600">Memuat batas wilayah...</span>
          </div>
        </div>
      )}

      {/* Layer info indicator */}
      <div className="absolute bottom-20 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 z-1000">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            baseTileLayer === 'satellite' ? 'bg-green-500' :
            baseTileLayer === 'terrain' ? 'bg-orange-500' : 'bg-blue-500'
          }`}></div>
          <div>
            <span className="text-xs font-medium text-gray-700">
              {tileLayers[baseTileLayer]?.name || 'Peta Dasar'}
            </span>
            {overlayLayers.custom_qgis && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-[10px] text-purple-600">+ Peta Khusus DIY (Zoom: 10x)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoadingIndicator loading={loading} />
      
      {/* InfoPanel - hanya tampil jika boundary aktif */}
      {showBoundary && <InfoPanel />}
      
      {/* Data Source Info */}
      {riskData && (
        <DataSourceInfo data={{ metadata: riskData.metadata }} />
      )}
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