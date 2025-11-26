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

  const [isFirstUse, setIsFirstUse] = useState(false);

  useEffect(() => {
    const firstLoadShown = localStorage.getItem('modalFirstLoadShown');
    if (!firstLoadShown) {
      setIsFirstUse(true);
      setIsModalOpen(true);
      localStorage.setItem('modalFirstLoadShown', 'true');
    }
  }, []);

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

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsFirstUse(false);
    setIsModalOpen(false);
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

        <button className="dialog-modal-control" onClick={openModal} aria-label="Open modal">
          <svg
            fill="#fff"
            version="1.1"
            viewBox="0 0 416.979 416.979"
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            width="20px"
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
              textAlign: 'left'
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
              Browse or search for the Constituency offices and MPs that represent you.
              You will notice that some data is missing. Currently this is all the information
              that has been made publicly available. If you have info about your local
              constituency offices, please email <a href="mailto:monique@pmg.org.za">monique@pmg.org.za</a>.
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
