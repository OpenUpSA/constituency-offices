import { useState, useEffect, useMemo } from 'react';
import { Scrollbar } from 'react-scrollbars-custom';

// Helper function to get party logo
const getPartyLogo = (partyCode) => {
  if (!partyCode || partyCode === 'Unknown') return null;

  try {
    // Import the logo dynamically
    return new URL(`../assets/party-logos/${partyCode}.png`, import.meta.url).href;
  } catch (error) {
    console.warn(`Logo not found for party: ${partyCode}`);
    return null;
  }
};

const OfficeList = ({ offices = [], selectedOffice, onOfficeSelect, onFilterChange, geoLocate, loading = false }) => {
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');

  // Group offices by party and province, get unique values
  const { groupedOffices, parties, provinces } = useMemo(() => {
    const partyGroups = {};
    const provinceGroups = {};
    const uniqueParties = new Set();
    const uniqueProvinces = new Set();

    offices.forEach(office => {
      const party = office.mpSelect || 'Unknown';
      const province = office.province || 'Unknown';

      uniqueParties.add(party);
      uniqueProvinces.add(province);

      if (!partyGroups[party]) {
        partyGroups[party] = [];
      }
      partyGroups[party].push(office);

      if (!provinceGroups[province]) {
        provinceGroups[province] = [];
      }
      provinceGroups[province].push(office);
    });

    // Sort parties and provinces alphabetically, but put 'Unknown' at the end
    const sortedParties = Array.from(uniqueParties).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return a.localeCompare(b);
    });

    const sortedProvinces = Array.from(uniqueProvinces).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return a.localeCompare(b);
    });

    return {
      groupedOffices: { parties: partyGroups, provinces: provinceGroups },
      parties: sortedParties,
      provinces: sortedProvinces
    };
  }, [offices]);

  // Filter offices based on selected party and province
  const filteredOffices = useMemo(() => {
    let filtered = offices;

    if (selectedParty !== 'all') {
      filtered = filtered.filter(office => (office.mpSelect || 'Unknown') === selectedParty);
    }

    if (selectedProvince !== 'all') {
      filtered = filtered.filter(office => (office.province || 'Unknown') === selectedProvince);
    }

    return filtered;
  }, [offices, selectedParty, selectedProvince]);

  // Notify parent component when filtered offices change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredOffices);
    }
  }, [filteredOffices, onFilterChange]);

  if (loading) {
    return (
      <div className="office-list">
        <h3>Office Locations</h3>
        <div className="loading">Loading offices...</div>
      </div>
    );
  }

  return (
    <div className="office-list">
      <h3>Office Locations ({filteredOffices.length})</h3>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="party-select">Filter by Party:</label>
          <select
            id="party-select"
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="filter-selector"
          >
            <option value="all">All Parties ({offices.length})</option>
            {parties.map(party => (
              <option key={party} value={party}>
                {party} ({groupedOffices.parties[party]?.length || 0})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="province-select">Filter by Province:</label>
          <select
            id="province-select"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="filter-selector"
          >
            <option value="all">All Provinces ({offices.length})</option>
            {provinces.map(province => (
              <option key={province} value={province}>
                {province} ({groupedOffices.provinces[province]?.length || 0})
              </option>
            ))}
          </select>
        </div>
      </div>
        <button className="secondary-button" onClick={geoLocate} aria-label="Open modal" title="Show nearest offices to my location">
          Party Offices Near Me
        </button>

      {filteredOffices.length === 0 ? (
        <div className="no-data">
          <p>No office data available.</p>
          <p>Configure NocoDB connection in .env file or check your database.</p>
        </div>
      ) : (
        <div className="office-items">
          <Scrollbar
            style={{ width: '100%', height: '100%' }}
            thumbYProps={{
              style: {
                backgroundColor: '#cbd5e0',
                borderRadius: '4px',
                width: '8px'
              }
            }}
            trackYProps={{
              style: {
                backgroundColor: '#f7fafc',
                borderRadius: '4px',
                width: '12px',
                right: '0px',
                position: 'absolute',
                top: '0',
                bottom: '0'
              }
            }}
            contentProps={{
              style: {
                paddingRight: '16px'
              }
            }}
          >
            {filteredOffices.map((office) => (
              <div
                key={office.id}
                className={`office-card ${selectedOffice?.id === office.id ? 'selected' : ''}`}
                onClick={() => onOfficeSelect(office)}
              >
                <div className="office-card-header">
                  <div className="party-province-row">
                    {office.mpSelect && (
                      <span className={`party-badge party-${office.mpSelect.toLowerCase().replace(/\s+/g, '-')}`}>
                        {getPartyLogo(office.mpSelect) && (
                          <img
                            src={getPartyLogo(office.mpSelect)}
                            alt={`${office.mpSelect} logo`}
                            className="party-logo"
                          />
                        )}
                        {office.mpSelect}
                      </span>
                    )}
                    <span className="province-text">
                      {office.province || 'Unknown Province'}
                    </span>
                  </div>
                </div>
                <div className="office-card-body">
                  <div className="office-name">{office.name}</div>
                  {office.mps && office.mps.length > 0 && office.mps.some(mp => mp.name) && (
                    <div className="office-mp">
                      {office.mps.map((mp, index) => (
                        mp.name && (
                          <div key={index} className="mp-info">
                            {mp.image && (
                              <img
                                src={`https://static.pmg.org.za/${mp.image}`}
                                alt={`${mp.name} photo`}
                                className="mp-thumbnail"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="mp-name">
                              MP: {mp.link ? (
                                <a
                                  href={mp.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mp-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {mp.name}
                                </a>
                              ) : (
                                mp.name
                              )}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Scrollbar>
        </div>
      )}
    </div>
  );
};

export default OfficeList;
