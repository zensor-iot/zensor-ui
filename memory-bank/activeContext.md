# Active Context - Zensor Portal UI

## Current Work Focus
**Scheduled Irrigation Implementation** - Successfully implemented periodic irrigation using scheduled tasks in the tenant portal.

## Recent Changes (Latest Session)
### Scheduled Irrigation Feature
- **Created ScheduledIrrigation Component**: New React component for managing scheduled irrigation tasks
- **Added API Integration**: Extended `api.js` with `scheduledTasksApi` functions for CRUD operations
- **Enhanced TenantDeviceCard**: Integrated scheduled irrigation section below manual irrigation controls
- **Added Comprehensive UI**: Form for creating/editing schedules, list view of existing tasks, and status management

### Technical Implementation Details
- **Cron Expression Support**: Users can input custom cron expressions or use preset examples (Daily 6 AM, 12 PM, 6 PM)
- **Duration Control**: Configurable irrigation duration (1-60 minutes) with increment/decrement controls
- **Task Management**: Create, edit, delete, and toggle active/inactive status for scheduled tasks
- **Human-Readable Display**: Cron expressions are parsed and displayed in user-friendly format
- **Error Handling**: Comprehensive error states and user feedback
- **Responsive Design**: Mobile-friendly interface with proper responsive breakpoints

### API Integration
- **Endpoints Used**: `/v1/tenants/{tenant_id}/devices/{device_id}/scheduled-tasks`
- **Operations**: GET (list), POST (create), PUT (update), DELETE (remove)
- **Command Structure**: Irrigation commands with duration payload in seconds
- **Schedule Format**: Standard cron expressions (6 fields: second minute hour day month dayOfWeek)

## Current Status
✅ **Scheduled Irrigation Feature Complete**
- All core functionality implemented and tested
- UI/UX follows established design patterns
- API integration working with proper error handling
- Responsive design implemented

## Next Steps
1. **Testing**: Verify scheduled task creation and management in production environment
2. **User Feedback**: Gather feedback on usability and feature completeness
3. **Enhancements**: Consider additional scheduling features (weekly patterns, weather-based scheduling)
4. **Documentation**: Update user documentation for scheduled irrigation feature

## Active Decisions
- **Cron Expression UI**: Chose to support both manual cron input and preset examples for better UX
- **Duration Units**: Using minutes in UI, converting to seconds for API payload
- **Task Status**: Implemented active/inactive toggle instead of deletion for better data management
- **Integration Point**: Placed scheduled irrigation below manual controls for logical flow

## Technical Considerations
- **WebSocket Integration**: Scheduled tasks work independently of real-time data streaming
- **Error Handling**: Comprehensive error states for network failures and validation errors
- **State Management**: Local state management with proper cleanup and re-fetching
- **Performance**: Efficient rendering with proper React patterns and minimal re-renders

## Current Work Focus

### Recent Major Changes
1. **Full Width Layout**: Updated CSS to use 100% width across all components
   - Removed `max-width: 1200px` constraints from main content, header, and components
   - Updated body and root element styles to use full width
   - Fixed conflicting styles from `index.css` that were limiting width

2. **Relay Control Enhancement**: Implemented comprehensive relay state management
   - Added "On"/"Off" display for relay values in both live messages and portal views
   - Implemented irrigation button safety controls (disabled when relay is active)
   - Added WebSocket-based irrigation completion detection
   - Enhanced button state management to wait for first WebSocket message

3. **WebSocket Integration**: Improved real-time data handling
   - Fixed Content Security Policy to allow WebSocket connections
   - Enhanced relay value display with visual indicators (green for "On", red for "Off")
   - Added Power icon for relay sensors
   - Implemented proper state synchronization between WebSocket data and UI

## Current State

### Working Features
- ✅ **Tenant Management**: Complete tenant listing and navigation
- ✅ **Device Management**: Device fleet overview with real-time status
- ✅ **Live Data Streaming**: WebSocket-based real-time sensor data display
- ✅ **Irrigation Control**: Specialized irrigation interface with safety controls
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Full Width Layout**: 100% width utilization across all pages
- ✅ **Relay State Management**: Proper "On"/"Off" display and control logic

### Technical Implementation
- ✅ **WebSocket Connection**: Robust connection management with auto-reconnection
- ✅ **API Integration**: Complete integration with Zensor Server API
- ✅ **Error Handling**: Comprehensive error states and recovery mechanisms
- ✅ **State Management**: Proper component state management with React hooks
- ✅ **CSS Architecture**: Consistent styling with CSS variables and responsive design

## Recent Learnings

### Technical Insights
- **WebSocket State Management**: Critical to wait for first message before enabling controls
- **CSS Layout**: Full width layouts require careful consideration of content readability
- **Relay Control**: Safety controls are essential for device control operations

### User Experience Insights
- **Visual Feedback**: Users need immediate feedback for relay state changes
- **Safety Controls**: Users appreciate automatic safety measures that prevent errors
- **Real-time Data**: Live data display significantly improves user confidence

## Environment Context

### Development Environment
- **Local Development**: Running on `http://localhost:5173`
- **API Server**: Zensor Server on `http://localhost:3000`
- **WebSocket**: Direct connection to backend WebSocket endpoint

### Production Environment
- **Deployment**: Docker-based deployment with nginx
- **API Configuration**: Configurable via `VITE_API_BASE_URL` environment variable
- **WebSocket**: WSS protocol in production with proper CSP configuration

### Configuration
- **Environment Variables**: API base URL configuration for different environments
- **nginx Configuration**: Reverse proxy and static file serving
- **CSP Headers**: Properly configured for WebSocket connections 