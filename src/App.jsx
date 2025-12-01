import { useState, useEffect, useRef } from 'react'
import OfficeMap from './components/OfficeMap'
import OfficeList from './components/OfficeList'
import nocodbService from './services/nocodbService'
import './App.css'

function App() {
  const [offices, setOffices] = useState([])
  const [filteredOffices, setFilteredOffices] = useState([])
  const [selectedOffice, setSelectedOffice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const modalRef = useRef(null)
  const mapRef = useRef(null)


  const [isFirstUse, setIsFirstUse] = useState(false)

  useEffect(() => {
    if (loading || offices.length === 0) return

    const params = new URLSearchParams(window.location.search)
    const useMyLocation = params.get('usemylocation') === 'true'
    const addressQuery = params.get('q')?.trim()

    if (useMyLocation) {
      geoLocate() // priority
    } else if (addressQuery) {
      geocodeAddress(addressQuery)
    }
  }, [loading, offices])

  useEffect(() => {
    const firstLoadShown = localStorage.getItem('modalFirstLoadShown')
    if (!firstLoadShown) {
      setIsFirstUse(true)
      setIsModalOpen(true)
      localStorage.setItem('modalFirstLoadShown', 'true')
    }
  }, [])

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenModal')
    if (!hasSeenModal) {
      setIsModalOpen(true)
      localStorage.setItem('hasSeenModal', 'true')
    }
  }, [])

  useEffect(() => {
    loadOffices()
  }, [])

  useEffect(() => {
    setFilteredOffices(offices)
  }, [offices])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile && !sidebarOpen) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const geocodeAddress = async (address) => {
    try {
      // Default to South Africa if not already included
      const query = address.toLowerCase().includes('south africa')
        ? address
        : `${address}, South Africa`

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'Pombola/1.0 (admin@pmg.org.za)',
            'Accept-Language': 'en',
          },
        }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        if (mapRef.current && mapRef.current.setUserLocationOnMap) {
          mapRef.current.setUserLocationOnMap([parseFloat(lat), parseFloat(lon)])
        }
      } else {
        alert('Address not found')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to look up address')
    }
  }

  const loadOffices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await nocodbService.fetchData()
      setOffices(data)
    } catch (err) {
      setError('Failed to load office data')
    } finally {
      setLoading(false)
    }
  }

  const handleOfficeSelect = (office) => {
    setSelectedOffice(office)
    if (isMobile) setSidebarOpen(false)
  }

  const handleMarkerClick = (office) => setSelectedOffice(office)
  const handleFilterChange = (filtered) => {
    setFilteredOffices(filtered)
    if (selectedOffice && !filtered.find(o => o.id === selectedOffice.id)) {
      setSelectedOffice(null)
    }
  }
  const handleBackToOverview = () => setSelectedOffice(null)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const geoLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        if (mapRef.current && mapRef.current.setUserLocationOnMap) {
          mapRef.current.setUserLocationOnMap(coords)
        }
      },
      (err) => alert('Unable to retrieve location')
    )
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsFirstUse(false)
    setIsModalOpen(false)
  }
  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) closeModal()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {isMobile && (
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle office list"
            >
              ☰
            </button>
          )}
          <h1>Constituency Offices</h1>
        </div>
        <div>
          {"geolocation" in navigator && (
            <button className="header-button" onClick={geoLocate} aria-label="Open modal" title="Show nearest offices to my location">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">

                <mask id="cutout">
                  <rect width="20" height="20" fill="white" />
                  <g transform="translate(-0.8, 0.6)">
                    <path d="M10 10v6h2L16 6V4H14L4 8v2Z" fill="black" />
                  </g>
                </mask>

                <circle cx="10" cy="10" r="10" fill="white" mask="url(#cutout)" />
              </svg>
            </button>
          )}

          <button className="header-button" onClick={openModal} aria-label="Open modal" title="Show information about this map">
            <svg
              fill="#fff"
              height="20px"
              width="20px"
              version="1.1"
              viewBox="0 0 416.979 416.979"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
                c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
                c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
                c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
                c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"/>
              </g>
            </svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={loadOffices}>Try Again</button>
        </div>
      )}

      <main className="app-main">
        {!isMobile && (
          <div className="desktop-layout">
            <div className="desktop-sidebar">
              <OfficeList
                offices={offices}
                selectedOffice={selectedOffice}
                onOfficeSelect={handleOfficeSelect}
                onFilterChange={handleFilterChange}
                loading={loading}
              />
            </div>
            <div className="desktop-map">
              <OfficeMap
                ref={mapRef}
                offices={filteredOffices}
                selectedOffice={selectedOffice}
                onMarkerClick={handleMarkerClick}
                onBackToOverview={handleBackToOverview}
              />
            </div>
          </div>
        )}

        {isMobile && (
          <>
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}>
              <div className="sidebar-backdrop" onClick={toggleSidebar}></div>
              <div className="sidebar">
                <div className="sidebar-header">
                  <button
                    className="sidebar-close"
                    onClick={toggleSidebar}
                    aria-label="Close office list"
                  >
                    ✕
                  </button>
                </div>
                <OfficeList
                  offices={offices}
                  selectedOffice={selectedOffice}
                  onOfficeSelect={handleOfficeSelect}
                  onFilterChange={handleFilterChange}
                  loading={loading}
                />
              </div>
            </div>

            <div className="mobile-map">
              <OfficeMap
                offices={filteredOffices}
                selectedOffice={selectedOffice}
                onMarkerClick={handleMarkerClick}
                onBackToOverview={handleBackToOverview}
              />
            </div>
          </>
        )}
      </main>

      {isModalOpen && (
        <div
          ref={modalRef}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              position: 'relative',
              background: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              textAlign: 'left',
              color: '#000000'
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#666'
              }}
              aria-label="Close modal"
            >
              ×
            </button>

            <h2 style={{ marginTop: 0 }}>
              Welcome to the South African Political Party Constituency Map
            </h2>
            <p>
              Explore and search for the constituency offices and Members of Parliament who represent you. Please note that some information is incomplete, and the level of detail varies across political parties. This map is a work in progress, built from publicly available data. You can view our <a href="https://www.parlimeter.org.za/post/find-your-mp-and-constituency-office" target="_blank">call to action here</a>.
            </p>
            <p>
              If you have additional details about your local constituency offices, please email us at <a href="mailto:admin@pmg.org.za" target="_blank">admin@pmg.org.za</a>.
            </p>

            {isFirstUse && (
              <button
                onClick={closeModal}
                style={{
                  display: 'block',
                  margin: '1.5rem auto 0',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Use Map
              </button>

            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default App
