import { useState, useEffect } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768) // Open by default on desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    loadOffices()
  }, [])

  useEffect(() => {
    // Initialize filtered offices when offices change
    setFilteredOffices(offices)
  }, [offices])

  useEffect(() => {
    // Handle window resize to update mobile state and sidebar visibility
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      // On desktop, always show sidebar; on mobile, keep current state
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  const loadOffices = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading offices...')
      const data = await nocodbService.fetchData()
      console.log('Loaded offices:', data)
      setOffices(data)
    } catch (err) {
      setError('Failed to load office data')
      console.error('Error loading offices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOfficeSelect = (office) => {
    console.log('Office selected:', office);
    setSelectedOffice(office)
    // Close sidebar only on mobile when office is selected
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleMarkerClick = (office) => {
    setSelectedOffice(office)
  }

  const handleFilterChange = (filtered) => {
    setFilteredOffices(filtered)
    // Only clear selected office if it's not in the filtered results
    if (selectedOffice && !filtered.find(office => office.id === selectedOffice.id)) {
      setSelectedOffice(null)
    }
  }

  const handleBackToOverview = () => {
    setSelectedOffice(null)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
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
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={refreshData}>Try Again</button>
        </div>
      )}

      <main className="app-main">
        {/* Desktop: Side-by-side layout */}
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
                offices={filteredOffices}
                selectedOffice={selectedOffice}
                onMarkerClick={handleMarkerClick}
                onBackToOverview={handleBackToOverview}
              />
            </div>
          </div>
        )}

        {/* Mobile: Overlay Sidebar */}
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
    </div>
  )
}

export default App
