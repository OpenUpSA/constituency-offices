import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Helper for party logo
const getPartyLogo = (partyCode) => {
  if (!partyCode || partyCode === 'Unknown') return null
  try {
    return new URL(`../assets/party-logos/${partyCode}.png`, import.meta.url).href
  } catch {
    return null
  }
}

const MapController = ({ center, zoom, bounds }) => {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (center && zoom) {
      map.flyTo(center, zoom, { duration: 1.5 })
    }
  }, [center, zoom, bounds, map])

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(timer)
  }, [map])

  return null
}

const OfficeMap = forwardRef(({ offices = [], selectedOffice, onMarkerClick, onBackToOverview }, ref) => {
  const [userLocation, setUserLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState([-30.5595, 22.9375])
  const [mapZoom, setMapZoom] = useState(6)
  const [mapBounds, setMapBounds] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showBackButton, setShowBackButton] = useState(false)
  const markerRefs = useRef({})

  useImperativeHandle(ref, () => ({
    setUserLocationOnMap: (coords) => {
      setUserLocation(coords)

      const nearest = offices
        .map(o => ({ ...o, distance: L.latLng(coords).distanceTo([o.latitude, o.longitude]) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)

      const latLngs = nearest.map(o => [o.latitude, o.longitude])
      latLngs.push(coords)

      const bounds = L.latLngBounds(latLngs)
      setMapBounds(bounds)
    },
  }))

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  const createCustomIcon = (office) => {
    const partyLogo = getPartyLogo(office.mpSelect)
    if (partyLogo) {
      return L.divIcon({
        className: 'custom-party-marker',
        html: `<div class="party-marker-container"><img src="${partyLogo}" alt="${office.mpSelect} logo" class="party-marker-logo" /></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
    }
    let color
    switch (office.type) {
      case 'Main Office': color = '#ff4757'; break
      case 'Provincial Office': color = '#3742fa'; break
      case 'MP Office': color = '#2ed573'; break
      default: color = '#ffa502'
    }
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  const zoomToFitOffices = () => {
    if (offices.length === 0) return
    const latLngs = offices
      .filter(o => o.latitude && o.longitude)
      .map(o => [o.latitude, o.longitude])
    if (latLngs.length === 0) return
    const bounds = L.latLngBounds(latLngs)
    setMapBounds(bounds)
    setShowBackButton(false)
    onBackToOverview?.()
  }

  useEffect(() => {
    if (selectedOffice) {
      const { latitude, longitude } = selectedOffice
      setMapCenter([latitude, longitude])
      setMapZoom(14)
      setMapBounds(null)
      setShowBackButton(true)

      setTimeout(() => {
        const markerRef = markerRefs.current[selectedOffice.id]
        if (markerRef) markerRef.openPopup()
      }, 1600)
    } else if (!userLocation) {
      const latLngs = offices
        .filter(o => o.latitude && o.longitude)
        .map(o => [o.latitude, o.longitude])
      if (latLngs.length) {
        const bounds = L.latLngBounds(latLngs)
        setMapBounds(bounds)
        setShowBackButton(false)
      }
    }
  }, [selectedOffice, offices, userLocation])

  return (
    <div className="map-container">
      {showBackButton && (
        <button
          className="map-back-button"
          onClick={zoomToFitOffices}
          title="Back to all offices"
        >
          ← Back
        </button>
      )}
      {isLoading ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
          Loading map...
        </div>
      ) : (
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-map"
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `<div style="background:#007bff;width:24px;height:24px;border-radius:50%;border:2px solid white;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>You are here</Popup>
            </Marker>
          )}

          {offices.map(office => (
            <Marker
              key={office.id}
              position={[office.latitude, office.longitude]}
              icon={createCustomIcon(office)}
              ref={ref => { if (ref) markerRefs.current[office.id] = ref; }}
              eventHandlers={{ click: () => onMarkerClick?.(office) }}
            >
              <Popup>
                <div className="popup-content">
                  <h3>{office.name}</h3>
                  <p><strong>Type:</strong> {office.type}</p>
                  {office.province && <p><strong>Province:</strong> {office.province}</p>}
                  {office.mp && <p><strong>MP:</strong> {office.mp} {office.mpSelect && `(${office.mpSelect})`}</p>}
                  <p><strong>Address:</strong> {office.address}</p>
                  {office.adminPerson && <p><strong>Administrator:</strong> {office.adminPerson}</p>}
                  {office.adminPhone && <p><strong>Phone:</strong> {office.adminPhone}</p>}
                  {office.adminEmail && <p><strong>Email:</strong> {office.adminEmail}</p>}
                  <p><strong>Coordinates:</strong> {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  )
})

export default OfficeMap
