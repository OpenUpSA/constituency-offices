# PMG Office Locations - React Map App

A modern React application that displays office locations on an interactive map using Leaflet and integrates with NocoDB for data management.

## Features

- 🗺️ **Interactive Map**: Built with React Leaflet for smooth map interactions
- 🏢 **Office Management**: Display and manage office locations
- 🔗 **NocoDB Integration**: Connect to NocoDB database for data storage
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Fast Development**: Built with Vite for lightning-fast development

## Technologies Used

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Leaflet** - Open-source interactive maps
- **React Leaflet** - React components for Leaflet
- **NocoDB SDK** - Database connectivity
- **CSS3** - Modern responsive styling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- NocoDB instance (optional - uses mock data if not configured)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd offices
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your NocoDB configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## NocoDB Configuration

To connect to your NocoDB database, update the `.env` file:

```env
VITE_NOCODB_API_URL=http://localhost:8080
VITE_NOCODB_API_TOKEN=your-api-token-here
VITE_NOCODB_BASE_ID=your-base-id-here
VITE_NOCODB_TABLE_ID=your-table-id-here
```

### Database Schema

Your NocoDB table should have the following columns:

| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| Id | Number | Yes | Primary key |
| Part | Text | No | Office part/region |
| Province | Text | No | Province name |
| MP Select | Text | No | MP party affiliation |
| MP | Text | No | Member of Parliament name |
| PcoName | Text | Yes | Office/PCO name |
| Address | Text | No | Office address |
| Latlon | Text | Yes | Latitude,Longitude coordinates (comma or space separated) |
| AdministratorDetails | Text | No | Administrator details |
| AdminPerson | Text | No | Administrator contact person |
| AdminPhone | Text | No | Administrator phone number |
| AdminEmail | Text | No | Administrator email address |

## Project Structure

```
src/
├── components/
│   ├── OfficeMap.jsx      # Interactive map component
│   ├── OfficeList.jsx     # Office list sidebar
│   └── ConfigHelper.jsx   # Configuration helper
├── services/
│   └── nocodbService.js   # NocoDB API service
├── App.jsx                # Main application component
├── App.css                # Application styles
└── main.jsx              # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Interactive Map
- Displays office locations with custom markers
- Different marker colors for different office types
- Click markers to view office details
- Responsive map that adjusts to screen size

### Office Management
- List view of all offices
- Click to select and focus on specific offices
- Real-time data loading from NocoDB
- Fallback to mock data when database is unavailable

### NocoDB Integration
- Full CRUD operations support
- Automatic fallback to mock data
- Error handling and user feedback
- Environment-based configuration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
