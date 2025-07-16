# System Patterns: Zensor Portal UI

## Architecture Overview

### Component Architecture
The application follows a hierarchical component structure with clear separation of concerns:

```
App.jsx (Root)
├── TenantList.jsx (Landing Page)
├── TenantDevices.jsx (Device Management)
├── TenantPortal.jsx (Portal View)
│   └── TenantDeviceCard.jsx (Device Cards)
└── DeviceMessagesLive.jsx (Live Data View)
```

### Data Flow Patterns

#### API Data Flow
1. **Component Mount**: Components fetch initial data on mount
2. **State Management**: Data stored in component state
3. **Error Handling**: Graceful error states with retry mechanisms
4. **Loading States**: Loading indicators during data fetching

#### WebSocket Data Flow
1. **Connection Management**: `useWebSocket` hook manages connections
2. **Real-time Updates**: Components receive live data updates
3. **State Synchronization**: UI state reflects real-time device state
4. **Connection Recovery**: Automatic reconnection with backoff

## Key Design Patterns

### Custom Hooks Pattern
- **useWebSocket**: Manages WebSocket connections and message handling
- **Reusable Logic**: Encapsulates complex state management
- **Error Handling**: Centralized error handling for WebSocket operations

### Component Composition
- **Card-based Layout**: Consistent card components for data display
- **Responsive Grid**: CSS Grid for responsive layouts
- **Conditional Rendering**: Dynamic UI based on data availability

### State Management
- **Local Component State**: React useState for component-specific state
- **Derived State**: Computed values from props and state
- **Shared State**: Props drilling for data sharing between components

## Technical Decisions

### React Patterns
- **Functional Components**: Modern React with hooks
- **Custom Hooks**: Reusable logic encapsulation
- **Props Interface**: Clear component interfaces
- **Error Boundaries**: Graceful error handling

### Styling Approach
- **CSS Variables**: Consistent theming and design tokens
- **Component-scoped Styles**: Styles co-located with components
- **Responsive Design**: Mobile-first approach with CSS Grid
- **Design System**: Consistent color palette and spacing

### API Integration
- **Configuration-based**: Environment variable configuration
- **Error Handling**: Comprehensive error states
- **Loading States**: User feedback during operations
- **Retry Logic**: Automatic retry for failed requests

## Component Relationships

### Tenant Management Flow
```
TenantList → TenantDevices → TenantPortal → TenantDeviceCard
```

### Data Dependencies
- **TenantList**: Fetches tenant data from `/v1/tenants`
- **TenantDevices**: Fetches device data from `/v1/tenants/{id}/devices`
- **TenantPortal**: Receives device data and WebSocket updates
- **DeviceMessagesLive**: Independent WebSocket connection for live data

### State Sharing
- **Device Data**: Passed down through props
- **WebSocket Data**: Shared through custom hooks
- **Configuration**: Centralized in config files

## WebSocket Architecture

### Connection Management
- **Single Connection**: One WebSocket connection per component
- **Auto-reconnection**: Exponential backoff strategy
- **Connection Status**: Visual indicators for connection health
- **Message Processing**: JSON parsing and state updates

### Message Handling
- **Device Messages**: Real-time sensor data updates
- **State Synchronization**: UI reflects device state changes
- **Error Recovery**: Graceful handling of malformed messages
- **Performance**: Efficient message processing

## Responsive Design Patterns

### Layout Patterns
- **Mobile-First**: Base styles for mobile devices
- **Progressive Enhancement**: Additional styles for larger screens
- **CSS Grid**: Flexible layouts that adapt to screen size
- **Touch-Friendly**: Appropriate touch targets for mobile

### Component Adaptation
- **Flexible Cards**: Cards that adapt to container width
- **Responsive Navigation**: Navigation that works on all screen sizes
- **Adaptive Controls**: Controls that scale appropriately
- **Readable Text**: Text that remains readable on all devices

## Error Handling Patterns

### API Error Handling
- **HTTP Status Codes**: Appropriate handling of different status codes
- **User Feedback**: Clear error messages for users
- **Retry Mechanisms**: Automatic retry for transient errors
- **Fallback States**: Graceful degradation when services are unavailable

### WebSocket Error Handling
- **Connection Errors**: Visual indicators for connection issues
- **Message Errors**: Graceful handling of malformed messages
- **Reconnection Logic**: Automatic recovery from connection loss
- **State Consistency**: Maintaining consistent state during errors

## Performance Patterns

### Bundle Optimization
- **Code Splitting**: Route-based code splitting
- **Tree Shaking**: Removal of unused code
- **Asset Optimization**: Optimized images and assets
- **Caching Strategy**: Appropriate caching headers

### Runtime Performance
- **Efficient Rendering**: Minimal re-renders
- **Memoization**: Preventing unnecessary calculations
- **Lazy Loading**: Loading components on demand
- **WebSocket Efficiency**: Efficient message processing

## Documentation Patterns

### File Organization
- **Documentation Location**: All documentation files must be placed in `./docs` folder
- **README Structure**: Main README.md in root, detailed docs in ./docs
- **Navigation**: docs/README.md serves as documentation index
- **Categorization**: Documentation organized by type (Configuration, Development, API, etc.)

### Documentation Standards
- **Markdown Format**: All documentation in Markdown format
- **Consistent Structure**: Standardized headers and formatting
- **Cross-references**: Proper linking between related documents
- **Code Examples**: Inline code examples with proper syntax highlighting

## Security Patterns

### Content Security Policy
- **CSP Headers**: Configured in nginx for production
- **WebSocket Security**: WSS protocol in production
- **XSS Prevention**: Proper data sanitization
- **CSRF Protection**: Future implementation planned

### Data Validation
- **Input Validation**: Client-side validation
- **API Validation**: Server-side validation
- **Type Safety**: Runtime type checking
- **Error Sanitization**: Safe error message display

## Future Architecture Considerations

### State Management Evolution
- **Context API**: For shared state across components
- **State Libraries**: Redux/Zustand for complex state
- **Server State**: React Query for server state management
- **Optimistic Updates**: Immediate UI updates with rollback

### Component Architecture
- **Micro-frontends**: Potential for component federation
- **Component Library**: Reusable component system
- **Design System**: Comprehensive design tokens
- **Accessibility**: Enhanced accessibility patterns 