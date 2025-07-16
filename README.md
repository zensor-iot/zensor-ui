# Zensor Portal UI

A modern React-based user interface for managing IoT tenants and their device fleets in the Zensor Portal system.

## 🚀 Features

### Tenant Management
- **Tenant List View**: Grid-based display of all tenants with status indicators
- **Tenant Navigation**: One-click navigation to tenant device management
- **Status Tracking**: Visual indicators for active/inactive tenants
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Device Management
- **Device Fleet Overview**: Complete view of all devices belonging to a tenant
- **Device Details**: Comprehensive device information including:
  - Device ID and name
  - App EUI, Dev EUI, and App Key
  - Tenant association
  - Click-to-copy functionality for technical details
- **Real-time Updates**: Live data fetching from the backend API
- **Error Handling**: Graceful error states with retry functionality
- **Grafana Analytics**: Embedded Grafana visualizations for sensor data analysis

### User Experience
- **Modern Design**: Clean, professional interface with consistent styling
- **Intuitive Navigation**: Breadcrumb navigation and clear action buttons
- **Loading States**: Smooth loading indicators for better UX
- **Empty States**: Helpful messages when no data is available

## 🛠 Tech Stack

- **React 19.1.0** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Lucide React** - Modern icon library
- **Custom CSS** - Professional styling with CSS variables

## 📁 Project Structure

```
src/
├── components/
│   ├── TenantList.jsx       # Tenant overview page
│   ├── TenantDevices.jsx    # Tenant device management page
│   ├── DeviceCard.jsx       # Reusable device card component
│   ├── TenantDeviceCard.jsx # Enhanced device card with irrigation controls
│   ├── GrafanaVisualization.jsx # Grafana iframe modal component
│   └── ScheduledIrrigation.jsx  # Scheduled irrigation management
├── config/
│   └── api.js               # API configuration and endpoints
├── hooks/
│   ├── useNotification.js   # Notification system hook
│   └── useWebSocket.js      # WebSocket connection hook
├── App.jsx                  # Main application component with routing
├── App.css                  # Global styles and component styling
├── main.jsx                 # Application entry point
└── index.css                # Base CSS reset and variables
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Zensor Server running on `http://localhost:3000`

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🔗 API Integration

The UI integrates with the following Zensor Server endpoints:

- `GET /v1/tenants` - Fetch all tenants
- `GET /v1/tenants/{id}` - Get tenant details
- `GET /v1/tenants/{id}/devices` - List devices for a tenant

### API Configuration
The base URL is configured for local development (`http://localhost:3000`). Update the fetch URLs in components for different environments.

### Grafana Integration
The application includes embedded Grafana visualizations for sensor data analysis:

- **Environment Variables**: 
  - `VITE_GRAFANA_BASE_URL`: Grafana server URL (default: `http://cardamomo.zensor-iot.net`)
  - `VITE_GRAFANA_API_KEY`: API key for authentication (optional)
- **Dashboard**: Uses dashboard ID `fes28u6b3f6yof` with panel ID `1`
- **Device Variable**: Automatically sets `var-device_name` parameter from device name
- **Time Range**: Defaults to last 24 hours, configurable in the component

To enable Grafana integration:
1. Ensure Grafana is running and accessible
2. Set the `VITE_GRAFANA_BASE_URL` environment variable
3. **For authentication**: Create an API key in Grafana and set `VITE_GRAFANA_API_KEY`
4. Verify the dashboard and panel IDs match your Grafana setup

#### Authentication Options:
- **API Key**: Create a Grafana API key with "Viewer" role and set `VITE_GRAFANA_API_KEY`
- **Anonymous Access**: Configure Grafana to allow anonymous access (see `docs/GRAFANA_AUTH_CONFIG.md`)
- **Session-based**: Implement backend authentication proxy

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Used for buttons, links, and highlights
- **Success**: Green (#10b981) - Active status indicators
- **Warning**: Amber (#f59e0b) - Inactive status indicators
- **Error**: Red (#ef4444) - Error states
- **Gray Scale**: Comprehensive gray palette for text and UI elements

### Typography
- **System Fonts**: Uses native system font stack for optimal performance
- **Monospace**: Monaco/Menlo for technical data (IDs, keys)
- **Weight Scale**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Components
All components follow consistent patterns:
- Card-based layouts with subtle shadows
- Hover effects for interactive elements
- Consistent spacing using 8px grid system
- Mobile-first responsive design

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (single column layouts)
- **Desktop**: ≥ 768px (grid layouts)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- Uses ESLint with React hooks plugin
- Follows React best practices
- Functional components with hooks
- Modern JavaScript (ES6+)

## 🚀 Deployment

The built files in `dist/` can be served by any static web server. For production deployment:

1. Run `npm run build`
2. Deploy the `dist/` folder to your web server
3. Configure your server to serve `index.html` for all routes (SPA routing)

## 🔮 Future Enhancements

- [ ] Device adoption interface
- [ ] Command sending functionality
- [ ] Real-time device status updates
- [ ] Advanced filtering and search
- [ ] Device grouping and bulk operations
- [ ] Dashboard with analytics
- [ ] User management interface

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add appropriate error handling for new features
3. Ensure responsive design for all new components
4. Test API integration thoroughly
5. Update this README for significant changes
