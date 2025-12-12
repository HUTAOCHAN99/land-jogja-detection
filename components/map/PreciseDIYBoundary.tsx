// components/map/PreciseDIYBoundary.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import { useMap, GeoJSON } from 'react-leaflet'
import L from 'leaflet'

interface PreciseDIYBoundaryProps {
  diyFeature: any
  source: string // TETAPKAN meski tidak digunakan, untuk interface consistency
}

// Sumber data Natural Earth untuk provinsi di Indonesia
const ALL_PROVINCES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'

export function PreciseDIYBoundary({ diyFeature }: PreciseDIYBoundaryProps) {
  const map = useMap()

  // Style untuk boundary DIY - lebih transparan
  const diyStyle: L.PathOptions = {
    color: '#10b981',
    weight: 3,
    opacity: 0.7,
    fillColor: 'rgba(16, 185, 129, 0.1)',
    fillOpacity: 0.1,
    dashArray: '8, 4'
  }

  // Style untuk area luar DIY - GELAP
  const nonDiyStyle: L.PathOptions = {
    color: 'rgba(15, 23, 42, 0.9)',
    weight: 2,
    opacity: 0.9,
    fillColor: 'rgba(2, 6, 23, 0.7)',
    fillOpacity: 0.7
  }

  // Create a dark overlay for outside DIY area
  const createDarkOverlay = (): any => {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
        ]]
      },
      properties: {
        name: "Outside DIY",
        type: "outside_diy"
      }
    }
  }

  // Load all provinces data for Indonesia
  const [allProvinces, setAllProvinces] = useState<any>(null)
  const [loadingProvinces, setLoadingProvinces] = useState(true)

  useEffect(() => {
    const loadAllProvinces = async () => {
      try {
        const response = await fetch(ALL_PROVINCES_URL)
        const data = await response.json()
        
        // Filter hanya provinsi di Indonesia
        const indonesianProvinces = {
          ...data,
          features: data.features.filter((feature: any) => 
            feature.properties?.iso_a2 === 'ID' ||
            feature.properties?.admin === 'Indonesia'
          )
        }
        
        setAllProvinces(indonesianProvinces)
      } catch (error) {
        console.error('Failed to load provinces data:', error)
      } finally {
        setLoadingProvinces(false)
      }
    }

    loadAllProvinces()
  }, [])

  // Filter untuk mendapatkan provinsi NON-DIY
  const nonDIYFeatures = useMemo(() => {
    if (!allProvinces || !allProvinces.features) return null
    
    const features = allProvinces.features.filter((feature: any) => {
      const props = feature.properties || {}
      
      const isDIY = (
        props.iso_3166_2 === 'ID-YO' ||
        (props.name && props.name.toLowerCase().includes('yogyakarta')) ||
        props.Propinsi?.toLowerCase().includes('yogyakarta') ||
        props.province?.toLowerCase().includes('yogyakarta')
      )

      return !isDIY
    })

    return {
      type: "FeatureCollection" as const,
      features: features
    }
  }, [allProvinces])

  // Event handlers untuk DIY boundary
  const onEachDIYFeature = (feature: any, layer: L.Layer) => {
    const properties = feature.properties || {}
    const provinceName = properties.name || properties.Propinsi || 'DIY'

    layer.bindTooltip(
      `📍 ${provinceName}<br>Daerah Istimewa Yogyakarta`,
      { 
        permanent: false, 
        direction: 'center', 
        className: 'diy-province-tooltip',
        offset: [0, 0]
      }
    )

    // Hover effect
    layer.on('mouseover', () => {
      if (layer instanceof L.Path) {
        layer.setStyle({
          weight: 4,
          fillOpacity: 0.15,
          opacity: 1
        })
      }
    })

    layer.on('mouseout', () => {
      if (layer instanceof L.Path) {
        layer.setStyle({
          weight: 3,
          fillOpacity: 0.1,
          opacity: 0.7
        })
      }
    })

    // Click handler untuk DIY
    layer.on('click', (e) => {
      map.fire("click", { latlng: e.latlng })
    })
  }

  // Handler untuk non-DIY features
  const onEachNonDIYFeature = (feature: any, layer: L.Layer) => {
    const properties = feature.properties || {}
    const provinceName = properties.name || properties.Propinsi || 'Provinsi Lain'
    
    layer.bindTooltip(
      `⛔ ${provinceName}<br><small>Luar Area Analisis DIY</small>`,
      { 
        permanent: false, 
        direction: 'center',
        className: 'outside-diy-tooltip'
      }
    )

    // Click handler untuk area non-DIY
    layer.on('click', (e) => {
      const { lat, lng } = e.latlng
      
      // Show warning popup
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div style="padding: 12px; min-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="background: #f59e0b; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 14px;">
                ⚠️
              </span>
              <div>
                <strong style="color: #d97706; font-size: 15px;">Area di Luar DIY</strong>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">${provinceName}</div>
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
        .openOn(map)
    })
  }

  useEffect(() => {
    if (diyFeature && map) {
      try {
        const diyLayer = L.geoJSON(diyFeature)
        const bounds = diyLayer.getBounds()
        
        if (bounds.isValid()) {
          const paddedBounds = bounds.pad(0.1)
          map.fitBounds(paddedBounds, { 
            padding: [20, 20], 
            maxZoom: 12 
          })
          map.setMaxBounds(bounds.pad(0.2))
          map.setMinZoom(9)
          map.setMaxZoom(16)
        }
      } catch (error) {
        console.error('Error setting bounds:', error)
        const fallbackBounds = L.latLngBounds(
          L.latLng(-8.3, 109.9),
          L.latLng(-7.4, 110.8)
        )
        map.setMaxBounds(fallbackBounds)
        map.setView([-7.7972, 110.3688], 10)
      }
    }

    // Tambahkan custom control untuk info area
    const InfoControl = L.Control.extend({
      onAdd: function() {
        const div = L.DomUtil.create('div', 'info-control')
        div.innerHTML = `
          <div style="background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 6px;"></div>
              <span style="color: #374151;">Wilayah DIY</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 12px; height: 12px; background: #1e293b; border-radius: 50%; margin-right: 6px;"></div>
              <span style="color: #374151;">Luar DIY</span>
            </div>
          </div>
        `
        return div
      }
    })

    const infoControl = new InfoControl({ position: 'bottomleft' })
    infoControl.addTo(map)

    return () => {
      if (infoControl && map) {
        map.removeControl(infoControl)
      }
    }
  }, [diyFeature, map])

  return (
    <>
      {/* Area gelap untuk seluruh peta (background) */}
      <GeoJSON
        key="world-dark-overlay"
        data={createDarkOverlay()}
        style={{
          color: 'transparent',
          weight: 0,
          fillColor: 'rgba(2, 6, 23, 0.05)',
          fillOpacity: 0.05
        }}
      />
      
      {/* Provinsi NON-DIY dengan style gelap */}
      {!loadingProvinces && nonDIYFeatures && nonDIYFeatures.features.length > 0 && (
        <GeoJSON
          key="non-diy-provinces"
          data={nonDIYFeatures}
          style={nonDiyStyle}
          onEachFeature={onEachNonDIYFeature}
        />
      )}
      
      {/* DIY dengan style transparan */}
      {diyFeature && (
        <GeoJSON
          key="diy-boundary"
          data={diyFeature}
          style={diyStyle}
          onEachFeature={onEachDIYFeature}
        />
      )}
    </>
  )
}