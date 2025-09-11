import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper function to get party logo
const getPartyLogo = (partyCode) => {
  if (!partyCode || partyCode === 'Unknown') return null;
  
  try {
    return new URL(`../assets/party-logos/${partyCode}.png`, import.meta.url).href;
  } catch (error) {
    console.warn(`Logo not found for party: ${partyCode}`);
    return null;
  }
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      console.log('MapController: Setting view to', center, 'zoom', zoom);
      // Use flyTo for smoother animation and better centering
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.5
      });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    // Invalidate map size when component mounts or updates
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};

const OfficeMap = ({ offices = [], selectedOffice = null, onMarkerClick, onBackToOverview }) => {
  const [mapCenter, setMapCenter] = useState([-30.5595, 22.9375]); // South Africa center - fallback
  const [mapZoom, setMapZoom] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackButton, setShowBackButton] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const markerRefs = useRef({});

  useEffect(() => {
    // Simulate loading delay to ensure map renders properly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to calculate bounds for multiple offices
  const calculateBounds = (officeList) => {
    if (officeList.length === 0) return null;
    
    // Filter out any invalid coordinates
    const validOffices = officeList.filter(office => 
      office.latitude && office.longitude && 
      !isNaN(office.latitude) && !isNaN(office.longitude) &&
      office.latitude >= -35 && office.latitude <= -22 && // South Africa latitude range
      office.longitude >= 16 && office.longitude <= 33    // South Africa longitude range
    );
    
    if (validOffices.length === 0) {
      // Default to South Africa center if no valid offices
      return {
        center: [-30.5595, 22.9375],
        zoom: 6
      };
    }
    
    if (validOffices.length === 1) {
      const office = validOffices[0];
      return {
        center: [office.latitude, office.longitude],
        zoom: 12
      };
    }

    const lats = validOffices.map(office => office.latitude);
    const lngs = validOffices.map(office => office.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate zoom level based on bounds with padding
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // Add padding to the bounds
    const paddedDiff = maxDiff * 1.2;
    
    let zoom = 6;
    if (paddedDiff < 0.01) zoom = 13;
    else if (paddedDiff < 0.05) zoom = 11;
    else if (paddedDiff < 0.1) zoom = 9;
    else if (paddedDiff < 0.5) zoom = 7;
    else if (paddedDiff < 2) zoom = 6;
    else zoom = 5;
    
    console.log('Calculated bounds:', { center: [centerLat, centerLng], zoom, validOffices: validOffices.length });
    
    return {
      center: [centerLat, centerLng],
      zoom: zoom
    };
  };

  const zoomToFitOffices = () => {
    const bounds = calculateBounds(offices);
    if (bounds) {
      setMapCenter(bounds.center);
      setMapZoom(bounds.zoom);
      setShowBackButton(false);
      
      // Close any open popups
      setTimeout(() => {
        Object.values(markerRefs.current).forEach(markerRef => {
          if (markerRef && markerRef.closePopup) {
            markerRef.closePopup();
          }
        });
      }, 100);
      
      // Call the callback to clear selected office
      if (onBackToOverview) {
        onBackToOverview();
      }
    }
  };

  useEffect(() => {
    if (selectedOffice) {
      console.log('Selected office changed:', selectedOffice);
      console.log('Setting map center to:', [selectedOffice.latitude, selectedOffice.longitude]);
      setMapCenter([selectedOffice.latitude, selectedOffice.longitude]);
      setMapZoom(14);
      setShowBackButton(true);
      setIsInitialized(true);
      
      // Open the popup for the selected office after the flyTo animation completes
      setTimeout(() => {
        const markerRef = markerRefs.current[selectedOffice.id];
        if (markerRef) {
          markerRef.openPopup();
        }
      }, 1600); // Slightly longer than the flyTo duration (1.5s)
    } else {
      console.log('No office selected, calculating bounds for offices:', offices.length);
      // When no office is selected, zoom to fit all filtered offices
      const bounds = calculateBounds(offices);
      if (bounds) {
        console.log('Setting bounds:', bounds);
        setMapCenter(bounds.center);
        setMapZoom(bounds.zoom);
        setShowBackButton(false);
        setIsInitialized(true);
      } else if (offices.length === 0 && !isInitialized) {
        // Keep default center if no offices available yet
        setMapCenter([-30.5595, 22.9375]);
        setMapZoom(6);
      }
    }
  }, [selectedOffice, offices, isInitialized]);

  // Initialize map position when offices first load
  useEffect(() => {
    if (!isInitialized && offices.length > 0 && !selectedOffice) {
      const bounds = calculateBounds(offices);
      if (bounds) {
        setMapCenter(bounds.center);
        setMapZoom(bounds.zoom);
        setIsInitialized(true);
      }
    }
  }, [offices, isInitialized, selectedOffice]);

  const createCustomIcon = (office) => {
    const partyLogo = getPartyLogo(office.mpSelect);
    
    if (partyLogo) {
      // Use party logo as marker
      return L.divIcon({
        className: 'custom-party-marker',
        html: `
          <div class="party-marker-container">
            <img src="${partyLogo}" alt="${office.mpSelect} logo" class="party-marker-logo" />
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    } else {
      // Fallback to colored markers for offices without party logos
      let color;
      switch (office.type) {
        case 'Main Office':
          color = '#ff4757'; // Red
          break;
        case 'Provincial Office':
          color = '#3742fa'; // Blue
          break;
        case 'MP Office':
          color = '#2ed573'; // Green
          break;
        default:
          color = '#ffa502'; // Orange
      }
      
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    }
  };

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
          <div>Loading map...</div>
        </div>
      ) : (
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-map"
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {offices.map((office) => (
            <Marker
              key={office.id}
              position={[office.latitude, office.longitude]}
              icon={createCustomIcon(office)}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[office.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(office)
              }}
            >
              <Popup>
                <div className="popup-content">
                  <h3>{office.name}</h3>
                  <p><strong>Type:</strong> {office.type}</p>
                  {office.province && <p><strong>Province:</strong> {office.province}</p>}
                  {office.mp && (
                    <p><strong>MP:</strong> {office.mp} {office.mpSelect && `(${office.mpSelect})`}</p>
                  )}
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
  );
};

export default OfficeMap;
