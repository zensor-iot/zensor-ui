# Technical Context: Zensor Portal UI

## Technology Stack

### Frontend Framework
- **React 19.1.0**: Latest React with modern hooks and functional components
- **React Router 7.6.2**: Client-side routing with nested routes
- **Vite 6.3.5**: Fast build tool and development server

### Styling and UI
- **Custom CSS**: CSS variables for theming and consistent design
- **Lucide React 0.513.0**: Modern icon library
- **CSS Grid/Flexbox**: Modern layout techniques
- **CSS Variables**: Consistent color scheme and design tokens

### Development Tools
- **ESLint 9.25.0**: Code linting with React-specific rules
- **npm**: Package management
- **Git**: Version control

### Build and Deployment
- **Vite**: Development server and production build
- **nginx**: Production web server with reverse proxy
- **Docker**: Containerization for deployment

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Environment Configuration
- **Development**: `http://localhost:3000` (default API server)
- **Production**: Configurable via `VITE_API_BASE_URL` environment variable
- **WebSocket**: Automatically derived from API base URL (http → ws, https → wss)

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/          # React components
│   ├── TenantList.jsx
│   ├── TenantDevices.jsx
│   ├── TenantPortal.jsx
│   ├── TenantDeviceCard.jsx
│   └── DeviceMessagesLive.jsx
├── hooks/              # Custom React hooks
│   └── useWebSocket.js
├── config/             # Configuration files
│   └── api.js
├── App.jsx             # Main application component
├── App.css             # Global styles
└── main.jsx            # Application entry point
```

## API Integration

### Backend API (Zensor Server)
- **Base URL**: Configurable via environment variables
- **Version**: OpenAPI 3.0.3 specification
- **Authentication**: Not currently implemented (future enhancement)

### Key Endpoints
- `GET /v1/tenants` - List all tenants
- `GET /v1/tenants/{id}` - Get tenant details
- `GET /v1/tenants/{id}/devices` - List tenant devices
- `GET /v1/devices` - List all devices
- `PUT /v1/devices/{id}` - Update device display name
- `POST /v1/devices/{id}/tasks` - Create device tasks
- `GET /ws/device-messages` - WebSocket for real-time data

### WebSocket Integration
- **Endpoint**: `/ws/device-messages`
- **Protocol**: Auto-detected (ws/wss based on API protocol)
- **Message Format**: JSON with device sensor data
- **Reconnection**: Automatic with exponential backoff
- **Error Handling**: Graceful degradation when connection fails

## Technical Constraints

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **ES6+ Support**: Requires modern JavaScript features
- **WebSocket Support**: Required for real-time functionality

### Performance Requirements
- **Bundle Size**: Optimized for fast loading
- **Real-time Updates**: WebSocket messages processed efficiently
- **Responsive Design**: Smooth interactions on mobile devices

### Security Considerations
- **CSP Headers**: Content Security Policy configured in nginx
- **WebSocket Security**: WSS protocol in production
- **API Security**: Future authentication implementation planned

## Deployment Architecture

### Development
- **Frontend**: Vite dev server on port 5173
- **Backend**: Zensor Server on port 3000
- **WebSocket**: Direct connection to backend

### Production
- **Frontend**: Static files served by nginx
- **Backend**: Reverse proxy through nginx to Zensor Server
- **WebSocket**: Proxied through nginx to backend
- **SSL/TLS**: HTTPS/WSS in production

### Docker Deployment
- **Multi-stage Build**: Optimized production image
- **nginx Configuration**: Reverse proxy and static file serving
- **Environment Variables**: Configurable API endpoints

## Configuration Management

### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:3000  # Development
VITE_API_BASE_URL=https://api.zensor-iot.net  # Production
```

### API Configuration
- **Dynamic URL Generation**: WebSocket URLs derived from API base URL
- **Protocol Detection**: Automatic ws/wss based on http/https
- **Error Handling**: Graceful fallbacks for connection issues

### Build Configuration
- **Vite Config**: Optimized for React and production builds
- **ESLint Config**: React-specific linting rules
- **nginx Config**: Production deployment configuration

## Future Technical Enhancements

### Planned Features
- **Authentication**: User login and session management
- **Real-time Notifications**: Push notifications for device events
- **Advanced Filtering**: Complex device and data filtering
- **Data Visualization**: Charts and graphs for sensor data
- **Offline Support**: Service worker for offline functionality

### Technical Debt
- **TypeScript Migration**: Consider migrating from JavaScript
- **State Management**: Evaluate need for Redux/Zustand
- **Testing**: Add unit and integration tests
- **Performance Monitoring**: Add analytics and performance tracking 