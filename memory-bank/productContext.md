# Product Context: Zensor Portal UI

## Why This Project Exists

### Problem Statement
IoT device management at scale requires a sophisticated interface that can handle:
- **Multi-tenant operations**: Different organizations managing their own device fleets
- **Real-time monitoring**: Live data streaming from sensors and devices
- **Remote control**: Ability to send commands and control devices remotely
- **Automation**: Scheduled tasks and automated responses to sensor data
- **Complex device states**: Managing devices with multiple sensors and actuators

### Target Users
1. **System Administrators**: Manage tenant organizations and overall system health
2. **Tenant Managers**: Oversee their organization's device fleet and operations
3. **Field Technicians**: Monitor device status and perform remote troubleshooting
4. **Operations Teams**: Create automation rules and scheduled tasks

### User Journey
1. **System Overview**: Administrators view all tenants and their status
2. **Tenant Selection**: Navigate to specific tenant's device management
3. **Device Monitoring**: View real-time sensor data and device status
4. **Device Control**: Send commands or create scheduled tasks
5. **Automation Setup**: Configure evaluation rules and automated responses

## How It Should Work

### Core User Flows

#### Tenant Management Flow
1. **Landing Page**: Display grid of all tenants with status indicators
2. **Tenant Details**: Click to view tenant information and device count
3. **Device Navigation**: One-click access to tenant's device management
4. **Status Tracking**: Visual indicators for active/inactive tenants

#### Device Management Flow
1. **Device List**: Grid view of all devices belonging to a tenant
2. **Device Details**: Comprehensive device information with technical details
3. **Real-time Data**: Live sensor data display with WebSocket updates
4. **Device Control**: Send commands and create scheduled tasks
5. **Status Monitoring**: Real-time device status and health indicators

#### Irrigation Control Flow (Specialized)
1. **Device Selection**: Choose specific irrigation device
2. **Status Check**: Verify relay state (On/Off) before control
3. **Command Execution**: Send two irrigation commands - activate relay (value=1) and deactivate after duration (value=0)
4. **Real-time Feedback**: Monitor relay state changes via WebSocket
5. **Safety Controls**: Prevent conflicting operations when relay is active

### Key Interactions

#### Real-time Data Display
- **WebSocket Connection**: Automatic connection to `/ws/device-messages`
- **Live Updates**: Sensor data updates in real-time without page refresh
- **Connection Status**: Visual indicators for WebSocket connection health
- **Error Handling**: Graceful degradation when connection is lost

#### Device Control
- **Command Validation**: Ensure device is online before sending commands
- **Task Scheduling**: Create complex command sequences with timing
- **Status Feedback**: Immediate feedback on command success/failure
- **Safety Checks**: Prevent conflicting operations (e.g., irrigation when relay is active)

#### Responsive Design
- **Mobile-First**: Optimized for mobile devices with touch-friendly controls
- **Desktop Enhancement**: Enhanced layouts for larger screens
- **Consistent Experience**: Same functionality across all device sizes

### User Experience Principles

#### Clarity and Simplicity
- **Clear Navigation**: Intuitive breadcrumbs and navigation patterns
- **Visual Hierarchy**: Important information stands out clearly
- **Consistent Patterns**: Similar interactions work the same way throughout
- **Progressive Disclosure**: Show essential info first, details on demand

#### Reliability and Trust
- **Real-time Status**: Always show current device and connection status
- **Error Recovery**: Clear error messages with actionable recovery steps
- **Data Accuracy**: Ensure displayed data reflects actual device state
- **Confirmation Actions**: Require confirmation for destructive operations

#### Performance and Responsiveness
- **Fast Loading**: Optimized bundle sizes and efficient data fetching
- **Smooth Interactions**: Responsive UI that doesn't block during operations
- **Background Updates**: Data updates without interrupting user workflow
- **Offline Grace**: Graceful handling of network interruptions

### Success Metrics
- **User Efficiency**: Time to complete common tasks (device monitoring, control)
- **Error Reduction**: Fewer user errors in device control operations
- **System Reliability**: Uptime and connection stability
- **User Satisfaction**: Intuitive interface that requires minimal training
- **Operational Efficiency**: Reduced time for device management tasks 