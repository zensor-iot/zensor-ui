# Project Brief: Zensor Portal UI

## Project Overview
Zensor Portal UI is a modern React-based user interface for managing IoT tenants and their device fleets in the Zensor Portal system. It provides a comprehensive web interface for monitoring, controlling, and managing IoT devices across multiple tenants.

## Core Requirements

### Primary Goals
1. **Multi-tenant IoT Device Management**: Provide a clean, intuitive interface for managing IoT devices across different tenant organizations
2. **Real-time Device Monitoring**: Display live sensor data and device status through WebSocket connections
3. **Device Control**: Enable remote control of IoT devices through command execution and task scheduling
4. **Responsive Design**: Ensure the interface works seamlessly across desktop and mobile devices

### Key Features
- **Tenant Management**: List, view, and manage tenant organizations
- **Device Fleet Management**: Comprehensive device overview with real-time status
- **Live Data Streaming**: Real-time sensor data display via WebSocket connections
- **Irrigation Control**: Specialized interface for irrigation system control with relay management
- **Task Scheduling**: Create and manage scheduled tasks for device automation
- **Device Communication**: Send commands and tasks to IoT devices

### Technical Requirements
- **Frontend**: React 19.1.0 with modern hooks and functional components
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: React Router for client-side navigation
- **Styling**: Custom CSS with CSS variables for consistent theming
- **Icons**: Lucide React for modern, consistent iconography
- **API Integration**: RESTful API integration with WebSocket support
- **Responsive**: Mobile-first responsive design

### User Experience Goals
- **Intuitive Navigation**: Clear, logical flow between different sections
- **Real-time Feedback**: Immediate visual feedback for user actions
- **Error Handling**: Graceful error states with clear recovery options
- **Performance**: Fast loading and smooth interactions
- **Accessibility**: Accessible design patterns and keyboard navigation

## Success Criteria
1. Users can efficiently manage multiple tenant organizations
2. Real-time device data is displayed accurately and updates seamlessly
3. Device control operations are reliable and provide clear feedback
4. Interface works consistently across different screen sizes
5. API integration is robust and handles errors gracefully
6. Codebase is maintainable and follows React best practices

## Constraints
- Must integrate with existing Zensor Server API (OpenAPI 3.0.3)
- Must support WebSocket connections for real-time data
- Must be deployable as a static web application
- Must maintain backward compatibility with API changes
- Must work with the existing nginx configuration for production deployment 