import { Api } from 'nocodb-sdk';

class NocoDBService {
  constructor() {
    this.api = new Api({
      baseURL: import.meta.env.VITE_NOCODB_API_URL || 'http://localhost:8080',
      headers: {
        'xc-token': import.meta.env.VITE_NOCODB_API_TOKEN || '',
      },
    });
    
    this.baseId = import.meta.env.VITE_NOCODB_BASE_ID;
    this.tableId = import.meta.env.VITE_NOCODB_TABLE_ID;
    this.mpTableId = 'm7a7jwhbuhlahp2'; // MP_New table ID
  }

  async fetchData() {
    console.log('NocoDBService.fetchData: baseId', this.baseId, 'tableId', this.tableId);
    try {
      if (!this.baseId || !this.tableId) {
        console.warn('NocoDB configuration missing. Using mock data.');
        return this.getMockData();
      }

      // Fetch all MPs first to create a lookup map
      const mpsMap = await this.fetchAllMPs();

      let allRows = [];
      let offset = 0;
      const pageSize = 100; // NocoDB default/max is usually 100 or 200

      while (true) {
        console.log('Fetching offset', offset, 'with pageSize', pageSize);
        const response = await this.api.dbTableRow.list(
          'noco',
          this.baseId,
          this.tableId,
          { offset, limit: pageSize }
        );
        console.log('Response for offset', offset, ':', response);
        const rows = response.list || [];
        allRows = allRows.concat(rows);

        // If less than pageSize returned, or no more pages, break
        if (!response.pageInfo || rows.length < pageSize) {
          break;
        }
        offset += pageSize;
      }

      console.log('Total rows fetched from NocoDB:', allRows.length);
      return this.transformData(allRows, mpsMap);
    } catch (error) {
      console.error('Error fetching data from NocoDB:', error);
      // Return mock data if NocoDB is not available
      return this.getMockData();
    }
  }

  async fetchAllMPs() {
    console.log('Fetching all MPs from table:', this.mpTableId);
    try {
      let allMPs = [];
      let offset = 0;
      const pageSize = 100;

      while (true) {
        const response = await this.api.dbTableRow.list(
          'noco',
          this.baseId,
          this.mpTableId,
          { offset, limit: pageSize }
        );
        const rows = response.list || [];
        allMPs = allMPs.concat(rows);

        if (!response.pageInfo || rows.length < pageSize) {
          break;
        }
        offset += pageSize;
      }

      console.log('Total MPs fetched:', allMPs.length);

      // Create a map of MP ID -> MP data
      const mpsMap = {};
      allMPs.forEach(mp => {
        mpsMap[mp.ID] = {
          id: mp.ID,
          name: mp.Name,
          party: mp.Party,
          image: mp.ProfilePicUrl,
          link: mp.PaLink
        };
      });

      return mpsMap;
    } catch (error) {
      console.error('Error fetching MPs:', error);
      return {};
    }
  }

  transformData(rawData, mpsMap = {}) {
    return rawData.map(item => {
      // Parse latitude and longitude from Latlon field
      let latitude = null;
      let longitude = null;
      
      if (item.Latlon) {
        const coords = this.parseLatLon(item.Latlon);
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      // Parse MPs from the new M2M relationship (MP News field)
      const mps = this.parseM2MMPData(item['MP News'], mpsMap);
      
      // Extract party from the office Party field or first MP
      const party = item.Party || this.extractPartyFromMPs(mps);

      return {
        id: item.Id || item.id,
        name: item.PcoName || item.pcoName || 'Unknown Office',
        latitude: latitude,
        longitude: longitude,
        address: item.Address || 'No address provided',
        type: this.determineOfficeType(item),
        part: item.Part || '',
        province: item.Province || '',
        mp: this.extractMPNames(mps), // Comma-separated MP names
        mpSelect: party, // Party from office or first MP
        mps: mps, // Array of MP objects with full details
        administratorDetails: item.AdministratorDetails || '',
        adminPerson: item.AdminPerson || '',
        adminPhone: item.AdminPhone || '',
        adminEmail: item.AdminEmail || '',
        rawData: item // Keep original data for reference
      };
    }).filter(item => item.latitude && item.longitude); // Only include items with valid coordinates
  }

  parseLatLon(latlonString) {
    // Handle different possible formats of lat/lon data
    if (!latlonString) return { latitude: null, longitude: null };
    
    // Remove any extra whitespace
    const cleaned = latlonString.toString().trim();
    
    // Try to parse comma-separated values
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
    
    // Try to parse space-separated values
    if (cleaned.includes(' ')) {
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
    
    console.warn('Could not parse lat/lon from:', latlonString);
    return { latitude: null, longitude: null };
  }

  // Helper function to parse MP data (single MP per office)
  parseMPData(mpNames, mpImages, mpLinks) {
    // Ensure all inputs are strings and handle single MP data
    const name = mpNames ? String(mpNames).trim() : '';
    const image = mpImages ? String(mpImages).trim() : '';
    const link = mpLinks ? String(mpLinks).trim() : '';
    
    // Return array with single MP object if name exists
    if (name) {
      return [{
        name: name,
        image: image,
        link: link
      }];
    }
    
    return [];
  }

  // Helper function to parse M2M MP data from the MP News field
  parseM2MMPData(mpNewsArray, mpsMap = {}) {
    if (!mpNewsArray || !Array.isArray(mpNewsArray)) {
      return [];
    }

    return mpNewsArray.map(mp => {
      const mpId = mp.ID;
      const mpDetails = mpsMap[mpId] || {};
      
      return {
        id: mpId,
        name: mp.Name || mpDetails.name || '',
        image: mpDetails.image || '',
        link: mpDetails.link || '',
        party: mpDetails.party || ''
      };
    }).filter(mp => mp.name); // Only include MPs with names
  }

  // Extract comma-separated MP names from array
  extractMPNames(mpsArray) {
    if (!mpsArray || mpsArray.length === 0) {
      return '';
    }
    return mpsArray.map(mp => mp.name).filter(Boolean).join(', ');
  }

  // Extract party from first MP
  extractPartyFromMPs(mpsArray) {
    if (!mpsArray || mpsArray.length === 0) {
      return '';
    }
    // Return party from first MP that has one
    const mpWithParty = mpsArray.find(mp => mp.party);
    return mpWithParty ? mpWithParty.party : '';
  }

  determineOfficeType(item) {
    // Determine office type based on available data
    if (item.Part && item.Part.toLowerCase().includes('main')) {
      return 'Main Office';
    }
    if (item.Province) {
      return 'Provincial Office';
    }
    if (item.MP) {
      return 'MP Office';
    }
    return 'Branch Office';
  }

  getMockData() {
    return [
      {
        id: 1,
        name: 'Cape Town Parliamentary Office',
        latitude: -33.9249,
        longitude: 18.4241,
        address: '90 Plein Street, Cape Town, 8000',
        type: 'Main Office',
        part: 'Western Cape',
        province: 'Western Cape',
        mp: 'John Smith',
        mpSelect: 'DA',
        administratorDetails: 'Main administrative office for Western Cape',
        adminPerson: 'Jane Doe',
        adminPhone: '+27 21 123 4567',
        adminEmail: 'admin.capetown@pmg.org.za'
      },
      {
        id: 2,
        name: 'Johannesburg Parliamentary Office',
        latitude: -26.2041,
        longitude: 28.0473,
        address: '123 Commissioner Street, Johannesburg, 2000',
        type: 'Provincial Office',
        part: 'Gauteng',
        province: 'Gauteng',
        mp: 'Mary Johnson',
        mpSelect: 'ANC',
        administratorDetails: 'Provincial office for Gauteng region',
        adminPerson: 'Peter Wilson',
        adminPhone: '+27 11 987 6543',
        adminEmail: 'admin.joburg@pmg.org.za'
      },
      {
        id: 3,
        name: 'Durban Parliamentary Office',
        latitude: -29.8587,
        longitude: 31.0218,
        address: '45 Victoria Street, Durban, 4000',
        type: 'Provincial Office',
        part: 'KwaZulu-Natal',
        province: 'KwaZulu-Natal',
        mp: 'David Brown',
        mpSelect: 'EFF',
        administratorDetails: 'Provincial office for KZN region',
        adminPerson: 'Sarah Miller',
        adminPhone: '+27 31 456 7890',
        adminEmail: 'admin.durban@pmg.org.za'
      },
      {
        id: 4,
        name: 'Pietermaritzburg Office',
        latitude: -29.6020,
        longitude: 30.3794,
        address: '12 Church Street, Pietermaritzburg, 3200',
        type: 'Branch Office',
        part: 'KwaZulu-Natal',
        province: 'KwaZulu-Natal',
        mp: 'Sarah Williams',
        mpSelect: 'IFP',
        administratorDetails: 'Branch office for PMB region',
        adminPerson: 'Michael Johnson',
        adminPhone: '+27 33 345 6789',
        adminEmail: 'admin.pmb@pmg.org.za'
      },
      {
        id: 5,
        name: 'Bloemfontein Office',
        latitude: -29.0852,
        longitude: 26.1596,
        address: '78 President Brand Street, Bloemfontein, 9300',
        type: 'Provincial Office',
        part: 'Free State',
        province: 'Free State',
        mp: 'Robert Davis',
        mpSelect: 'DA',
        administratorDetails: 'Provincial office for Free State',
        adminPerson: 'Linda van der Merwe',
        adminPhone: '+27 51 234 5678',
        adminEmail: 'admin.bloem@pmg.org.za'
      }
    ];
  }

  async createRecord(data) {
    try {
      if (!this.baseId || !this.tableId) {
        console.warn('NocoDB configuration missing. Cannot create record.');
        return null;
      }

      const response = await this.api.dbTableRow.create(
        'noco',
        this.baseId,
        this.tableId,
        data
      );
      
      return response;
    } catch (error) {
      console.error('Error creating record in NocoDB:', error);
      throw error;
    }
  }

  async updateRecord(id, data) {
    try {
      if (!this.baseId || !this.tableId) {
        console.warn('NocoDB configuration missing. Cannot update record.');
        return null;
      }

      const response = await this.api.dbTableRow.update(
        'noco',
        this.baseId,
        this.tableId,
        id,
        data
      );
      
      return response;
    } catch (error) {
      console.error('Error updating record in NocoDB:', error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      if (!this.baseId || !this.tableId) {
        console.warn('NocoDB configuration missing. Cannot delete record.');
        return null;
      }

      const response = await this.api.dbTableRow.delete(
        'noco',
        this.baseId,
        this.tableId,
        id
      );
      
      return response;
    } catch (error) {
      console.error('Error deleting record in NocoDB:', error);
      throw error;
    }
  }
}

export default new NocoDBService();
