# Admin Portal Documentation

## Overview

The Zensor Portal UI now includes a comprehensive admin portal that provides system-wide management capabilities for all Zensor server resources. The admin portal is accessible only to users with admin privileges, identified by the `Remote-Role: admin` header.

## Features

### 🔐 Admin Authentication
- **Header-based Authentication**: Admin access is controlled by the `Remote-Role` header with value `admin` (case-sensitive)
- **Automatic Role Detection**: The system automatically detects admin users and shows/hides admin navigation
- **Access Control**: All admin routes are protected and require admin privileges

### 📊 Admin Dashboard
- **System Overview**: Real-time statistics for tenants, devices, scheduled tasks, and system health
- **Quick Actions**: Direct access to key admin functions
- **System Health Monitoring**: Visual indicators for database, API, and WebSocket status

### 🏢 Tenant Management
- **Full CRUD Operations**: Create, read, update, and delete tenant organizations
- **Tenant Details**: View tenant information, device counts, and task statistics
- **Status Management**: Activate, deactivate, or suspend tenants
- **Bulk Operations**: Manage multiple tenants efficiently

### 🔧 Device Management
- **System-wide Device View**: Access all devices across all tenants
- **Device CRUD**: Create, update, and delete devices
- **Device Types**: Support for sensors, actuators, gateways, and controllers
- **Location Tracking**: Device location and status management
- **Direct Portal Access**: Quick access to individual device portals

### ⏰ Scheduled Task Management
- **Hierarchical Navigation**: Navigate from tenant → device → scheduled tasks
- **Task CRUD**: Create, edit, and delete scheduled irrigation tasks
- **Cron Expression Support**: Full cron expression support with human-readable display
- **Task Status Control**: Activate/deactivate tasks without deletion
- **Execution History**: View detailed execution history for each task

### 📋 Task Execution Monitoring
- **Execution History**: Complete history of task executions
- **Status Tracking**: Monitor completed, failed, and running tasks
- **Command Details**: View exact commands executed for each task
- **Performance Metrics**: Execution duration and success rates
- **Error Logging**: Detailed error messages for failed executions

### 🎮 System Command Center
- **Device Command Interface**: Send commands to any device in the system
- **Command Parameters**: Configure index, value, priority, and wait times
- **Real-time Monitoring**: Track command execution status
- **Command History**: View recent commands and their results
- **System-wide Overview**: Statistics for all system commands

## Navigation Structure

The admin portal follows a hierarchical navigation structure:

```
Admin Dashboard
├── Tenant Management
│   └── Device Management
│       └── Scheduled Tasks
│           └── Task Executions
└── System Commands
```

### Breadcrumb Navigation
- **Tenant Level**: Shows tenant name with building icon
- **Device Level**: Shows device name with CPU icon
- **Task Level**: Shows schedule with clock icon
- **Execution Level**: Shows execution details with play icon

## Technical Implementation

### Server-side Changes

#### Header Propagation
```javascript
// Remote-Role header is now propagated to the Zensor API
if (req.headers['remote-role']) {
    userHeaders['X-User-Role'] = req.headers['remote-role']
}
```

#### CORS Configuration
```javascript
// Added Remote-Role to allowed headers
'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Auth-Token, X-User-ID, X-User-Email, X-User-Name, X-Tenant-ID, X-Request-ID, X-Forwarded-For, X-Real-IP, Remote-User, Remote-Name, Remote-Email, Remote-Role'
```

#### User Info Endpoint
```javascript
// Enhanced user info to include role information
const userInfo = {
    user: req.headers['remote-user'] || null,
    name: req.headers['remote-name'] || null,
    email: req.headers['remote-email'] || null,
    role: req.headers['remote-role'] || null,
    isAdmin: req.headers['remote-role'] === 'admin'
}
```

### Client-side Implementation

#### Admin Hook
```javascript
// useAdmin hook for role detection
export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)
  
  // Fetches user info and determines admin status
}
```

#### Route Protection
```javascript
// Admin routes are automatically protected
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/tenants" element={<AdminTenants />} />
// ... other admin routes
```

#### Conditional Navigation
```javascript
// Admin navigation only shows for admin users
{!isLoading && isAdmin && (
  <Link to="/admin" className="nav-link admin-link">
    <Shield size={20} />
    Admin
  </Link>
)}
```

## API Integration

### Admin-specific Endpoints
- **Tenants**: `/api/tenants` (GET, POST, PUT, DELETE)
- **Devices**: `/api/devices` and `/api/tenants/{id}/devices`
- **Scheduled Tasks**: `/api/tenants/{tenant_id}/devices/{device_id}/scheduled-tasks`
- **Task Executions**: `/api/tenants/{tenant_id}/devices/{device_id}/scheduled-tasks/{task_id}/tasks`
- **Device Commands**: `/api/devices/{device_id}/commands`

### Notification System
All admin operations use the notification system for user feedback:
- **Success Notifications**: Green notifications for successful operations
- **Error Notifications**: Red notifications for failed operations
- **API Integration**: Automatic notification handling for API responses

## Styling and Design

### Admin Theme
- **Distinctive Styling**: Admin components use a unique color scheme
- **Gradient Navigation**: Admin link uses a purple gradient background
- **Card-based Layout**: Consistent card design for all admin components
- **Responsive Design**: Mobile-first approach with full responsive support

### Component Styling
- **Consistent Patterns**: All admin components follow the same design patterns
- **Status Indicators**: Color-coded status badges and icons
- **Interactive Elements**: Hover effects and smooth transitions
- **Form Styling**: Consistent form design with proper validation states

## Security Considerations

### Access Control
- **Header-based Authentication**: Relies on external authentication system
- **Client-side Protection**: UI elements hidden for non-admin users
- **Server-side Validation**: All admin operations should be validated server-side
- **Role Propagation**: Admin role is propagated to all API calls

### Data Protection
- **Confirmation Dialogs**: Destructive operations require confirmation
- **Error Handling**: Graceful error handling with user-friendly messages
- **Input Validation**: Client-side validation for all forms
- **API Security**: All admin API calls include proper authentication headers

## Usage Examples

### Accessing Admin Portal
1. **Authentication**: Ensure your request includes `Remote-Role: admin` header
2. **Navigation**: Click the "Admin" link in the main navigation (only visible to admins)
3. **Dashboard**: View system overview and quick actions

### Managing Tenants
1. **Navigate**: Go to Admin → Tenants
2. **Create**: Click "Create Tenant" to add new tenant
3. **Edit**: Click edit icon on any tenant card
4. **Delete**: Click delete icon (requires confirmation)

### Managing Devices
1. **Navigate**: Go to Admin → Tenants → Select Tenant → Devices
2. **Create**: Click "Add Device" to create new device
3. **Configure**: Set device type, location, and status
4. **Access Portal**: Click eye icon to access device portal

### Managing Scheduled Tasks
1. **Navigate**: Go to Admin → Tenants → Select Tenant → Devices → Select Device → Scheduled Tasks
2. **Create**: Click "Create Task" to add new scheduled task
3. **Configure**: Set cron schedule, duration, and description
4. **Monitor**: View execution history and status

### Sending Commands
1. **Navigate**: Go to Admin → System Commands
2. **Select Device**: Choose target device from dropdown
3. **Configure**: Set command parameters (index, value, priority, wait time)
4. **Send**: Click "Send Command" to execute

## Future Enhancements

### Planned Features
- **Bulk Operations**: Select multiple items for batch operations
- **Advanced Filtering**: Filter and search across all resources
- **Export Functionality**: Export data in various formats
- **Audit Logging**: Track all admin actions
- **User Management**: Manage admin users and permissions
- **System Monitoring**: Real-time system performance metrics
- **Backup/Restore**: System backup and restore capabilities

### Integration Opportunities
- **External Authentication**: Integration with LDAP, OAuth, or SAML
- **Notification Systems**: Email/SMS notifications for system events
- **Monitoring Tools**: Integration with monitoring and alerting systems
- **Reporting**: Advanced reporting and analytics
- **API Documentation**: Interactive API documentation for admin endpoints

## Troubleshooting

### Common Issues

#### Admin Access Not Working
- **Check Headers**: Ensure `Remote-Role: admin` header is being sent
- **Case Sensitivity**: Header value must be exactly `admin` (lowercase)
- **CORS**: Verify CORS configuration includes `Remote-Role` header

#### Navigation Not Showing
- **Role Detection**: Check browser network tab for `/api/user` response
- **Loading State**: Wait for role detection to complete
- **Cache Issues**: Clear browser cache and reload

#### API Errors
- **Authentication**: Verify API key is configured correctly
- **Headers**: Check that all required headers are being sent
- **Network**: Verify connection to Zensor API server

### Debug Information
- **User Info**: Check `/api/user` endpoint response
- **Network Tab**: Monitor API calls in browser developer tools
- **Console Logs**: Check browser console for error messages
- **Server Logs**: Review server logs for authentication issues

## Support

For technical support or questions about the admin portal:
1. **Documentation**: Review this documentation and related docs
2. **Code Review**: Check the implementation in `/src/components/admin/`
3. **API Testing**: Use browser developer tools to test API endpoints
4. **Server Configuration**: Verify server-side authentication setup
