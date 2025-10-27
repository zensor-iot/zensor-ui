import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage
const mockData = {
    tenants: [
        {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Acme Corporation',
            email: 'admin@acme.com',
            description: 'Manufacturing company specializing in IoT solutions',
            is_active: true,
            version: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            deleted_at: null,
            configuration: {
                timezone: 'America/New_York',
                notification_email: 'notifications@acme.com'
            }
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Green Farms Ltd',
            email: 'contact@greenfarms.com',
            description: 'Sustainable agriculture and smart irrigation',
            is_active: true,
            version: 1,
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-20T14:15:00Z',
            deleted_at: null,
            configuration: {
                timezone: 'Europe/London',
                notification_email: 'alerts@greenfarms.com'
            }
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Tech Solutions Inc',
            email: 'info@techsolutions.com',
            description: 'Technology consulting and IoT integration services',
            is_active: true,
            version: 1,
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-25T09:20:00Z',
            deleted_at: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: 'Smart City Corp',
            email: 'admin@smartcity.com',
            description: 'Municipal IoT infrastructure and smart city solutions',
            is_active: true,
            version: 1,
            created_at: '2024-01-12T00:00:00Z',
            updated_at: '2024-01-28T16:45:00Z',
            deleted_at: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440005',
            name: 'Industrial IoT Ltd',
            email: 'contact@industrialiot.com',
            description: 'Industrial automation and IoT monitoring systems',
            is_active: false,
            version: 1,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-30T11:30:00Z',
            deleted_at: null
        }
    ],
    devices: [
        {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'sensor-001',
            display_name: 'Temperature Sensor 1',
            app_eui: '0000000000000001',
            dev_eui: '0000000000000001',
            app_key: '00000000000000000000000000000001',
            tenant_id: '550e8400-e29b-41d4-a716-446655440001',
            status: 'online',
            last_message_received_at: new Date().toISOString(),
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        },
        {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'irrigation-001',
            display_name: 'Irrigation Controller 1',
            app_eui: '0000000000000002',
            dev_eui: '0000000000000002',
            app_key: '00000000000000000000000000000002',
            tenant_id: '550e8400-e29b-41d4-a716-446655440001',
            status: 'online',
            last_message_received_at: new Date().toISOString(),
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        },
        {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'sensor-002',
            display_name: 'Humidity Sensor 1',
            app_eui: '0000000000000003',
            dev_eui: '0000000000000003',
            app_key: '00000000000000000000000000000003',
            tenant_id: '550e8400-e29b-41d4-a716-446655440002',
            status: 'offline',
            last_message_received_at: '2024-01-10T15:45:00Z',
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-10T15:45:00Z'
        }
    ],
    scheduledTasks: [
        {
            id: 'task-001',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    index: 1,
                    value: 1, // Activate relay
                    priority: "NORMAL",
                    wait_for: "0s"
                },
                {
                    index: 1,
                    value: 0, // Deactivate relay
                    priority: "NORMAL",
                    wait_for: "5m" // 5 minutes duration
                }
            ],
            scheduling: {
                type: 'interval',
                initial_day: '2024-01-15T00:00:00Z',
                day_interval: 1,
                execution_time: '06:00'
            },
            is_active: true
        },
        {
            id: 'task-002',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    index: 1,
                    value: 1, // Activate relay
                    priority: "NORMAL",
                    wait_for: "0s"
                },
                {
                    index: 1,
                    value: 0, // Deactivate relay
                    priority: "NORMAL",
                    wait_for: "3m" // 3 minutes duration
                }
            ],
            scheduling: {
                type: 'interval',
                initial_day: '2024-01-15T00:00:00Z',
                day_interval: 1,
                execution_time: '18:00'
            },
            is_active: false
        },
        {
            id: 'task-003',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    index: 1,
                    value: 1, // Activate relay
                    priority: "NORMAL",
                    wait_for: "0s"
                },
                {
                    index: 1,
                    value: 0, // Deactivate relay
                    priority: "NORMAL",
                    wait_for: "2m" // 2 minutes duration
                }
            ],
            scheduling: {
                type: 'interval',
                initial_day: '2024-01-16T00:00:00Z',
                day_interval: 2,
                execution_time: '12:00'
            },
            is_active: true
        }
    ],
    taskExecutions: [
        {
            id: 'exec-001',
            task_id: 'task-001',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    id: uuidv4(),
                    index: 1,
                    value: 1,
                    port: 1,
                    priority: 'NORMAL',
                    dispatch_after: '2024-01-15T06:00:00Z',
                    ready: true,
                    sent: true,
                    sent_at: '2024-01-15T06:00:00Z'
                }
            ],
            created_at: '2024-01-15T06:00:00Z'
        },
        {
            id: 'exec-002',
            task_id: 'task-001',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    id: uuidv4(),
                    index: 1,
                    value: 1,
                    port: 1,
                    priority: 'NORMAL',
                    dispatch_after: '2024-01-14T06:00:00Z',
                    ready: true,
                    sent: true,
                    sent_at: '2024-01-14T06:00:00Z'
                }
            ],
            created_at: '2024-01-14T06:00:00Z'
        },
        {
            id: 'exec-003',
            task_id: 'task-001',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    id: uuidv4(),
                    index: 1,
                    value: 1,
                    port: 1,
                    priority: 'NORMAL',
                    dispatch_after: '2024-01-13T06:00:00Z',
                    ready: true,
                    sent: true,
                    sent_at: '2024-01-13T06:00:00Z'
                }
            ],
            created_at: '2024-01-13T06:00:00Z'
        },
        {
            id: 'exec-004',
            task_id: 'task-002',
            device_id: '123e4567-e89b-12d3-a456-426614174002',
            commands: [
                {
                    id: uuidv4(),
                    index: 1,
                    value: 1,
                    port: 1,
                    priority: 'NORMAL',
                    dispatch_after: '2024-01-10T18:00:00Z',
                    ready: true,
                    sent: true,
                    sent_at: '2024-01-10T18:00:00Z'
                }
            ],
            created_at: '2024-01-10T18:00:00Z'
        }
    ]
};

// Helper functions
const generateMockSensorData = (deviceId) => {
    const device = mockData.devices.find(d => d.id === deviceId);
    if (!device) return null;

    const now = new Date();
    const baseData = {
        temperature: {
            Index: 1,
            Value: 22.5 + (Math.random() - 0.5) * 10
        },
        humidity: {
            Index: 1,
            Value: 45 + (Math.random() - 0.5) * 20
        }
    };

    // Add relay data for irrigation devices
    if (device.name.includes('irrigation')) {
        baseData.relay = {
            Index: 1,
            Value: Math.random() > 0.8 ? 1 : 0 // 20% chance of being on
        };
    }

    return {
        type: 'device_message',
        device_id: deviceId,
        data: baseData,
        timestamp: now.toISOString(),
        receivedAt: now.toISOString()
    };
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');

    // Send initial data
    const initialData = mockData.devices.map(device => generateMockSensorData(device.id)).filter(Boolean);
    ws.send(JSON.stringify(initialData[0])); // Send first device data

    // Send periodic updates
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            const randomDevice = mockData.devices[Math.floor(Math.random() * mockData.devices.length)];
            const sensorData = generateMockSensorData(randomDevice.id);
            if (sensorData) {
                ws.send(JSON.stringify(sensorData));
            }
        }
    }, 5000); // Send update every 5 seconds

    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        clearInterval(interval);
    });
});

// Health check
app.get('/healthz', (req, res) => {
    res.json({ status: 'success' });
});

// Metrics
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`
# HELP zensor_server_requests_total Total number of requests
# TYPE zensor_server_requests_total counter
zensor_server_requests_total{method="GET",endpoint="/healthz"} 42
zensor_server_requests_total{method="GET",endpoint="/v1/tenants"} 15
zensor_server_requests_total{method="GET",endpoint="/v1/devices"} 23
  `);
});

// Tenants endpoints
app.get('/v1/tenants', (req, res) => {
    const { page = 1, limit = 10, include_deleted = false } = req.query;
    const offset = (page - 1) * limit;

    let tenants = mockData.tenants;
    if (!include_deleted) {
        tenants = tenants.filter(t => !t.deleted_at);
    }

    const paginatedTenants = tenants.slice(offset, offset + parseInt(limit));

    // Return the paginated response structure with "data" field
    res.json({
        data: paginatedTenants,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: tenants.length,
            total_pages: Math.ceil(tenants.length / parseInt(limit))
        }
    });
});

app.post('/v1/tenants', (req, res) => {
    const { name, email, description } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    const newTenant = {
        id: uuidv4(),
        name,
        email,
        description: description || '',
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
    };

    mockData.tenants.push(newTenant);
    res.status(201).json(newTenant);
});

app.get('/v1/tenants/:id', (req, res) => {
    const tenant = mockData.tenants.find(t => t.id === req.params.id);
    if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json(tenant);
});

app.put('/v1/tenants/:id', (req, res) => {
    const tenant = mockData.tenants.find(t => t.id === req.params.id);
    if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
    }

    Object.assign(tenant, req.body, {
        updated_at: new Date().toISOString(),
        version: (tenant.version || 0) + 1
    });

    res.json(tenant);
});

// Tenant configuration
app.get('/v1/tenants/:id/configuration', (req, res) => {
    const tenant = mockData.tenants.find(t => t.id === req.params.id);
    if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
    }

    // Return configuration if it exists, otherwise return empty/default
    const configuration = tenant.configuration || {
        timezone: '',
        notification_email: ''
    };

    res.json(configuration);
});

app.put('/v1/tenants/:id/configuration', (req, res) => {
    const tenant = mockData.tenants.find(t => t.id === req.params.id);
    if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
    }

    // Initialize configuration if it doesn't exist
    if (!tenant.configuration) {
        tenant.configuration = {};
    }

    // Update configuration with new values
    Object.assign(tenant.configuration, req.body);

    res.json(tenant.configuration);
});

// Tenant devices
app.get('/v1/tenants/:id/devices', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const tenantDevices = mockData.devices.filter(d => d.tenant_id === req.params.id);
    const paginatedDevices = tenantDevices.slice(offset, offset + parseInt(limit));

    const totalPages = Math.ceil(tenantDevices.length / parseInt(limit));

    res.json({
        data: paginatedDevices,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: tenantDevices.length,
            total_pages: totalPages
        }
    });
});

app.post('/v1/tenants/:id/devices', (req, res) => {
    const { device_id } = req.body;

    if (!device_id) {
        return res.status(400).json({ message: 'Device ID is required' });
    }

    const device = mockData.devices.find(d => d.id === device_id);
    if (!device) {
        return res.status(404).json({ message: 'Device not found' });
    }

    device.tenant_id = req.params.id;
    device.updated_at = new Date().toISOString();

    res.status(201).json(device);
});

// Devices endpoints
app.get('/v1/devices', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const paginatedDevices = mockData.devices.slice(offset, offset + parseInt(limit));

    const totalPages = Math.ceil(mockData.devices.length / parseInt(limit));

    res.json({
        data: paginatedDevices,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: mockData.devices.length,
            total_pages: totalPages
        }
    });
});

app.post('/v1/devices', (req, res) => {
    const { name, display_name, app_eui, dev_eui, app_key } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Device name is required' });
    }

    const newDevice = {
        id: uuidv4(),
        name,
        display_name: display_name || name,
        app_eui: app_eui || '0000000000000000',
        dev_eui: dev_eui || '0000000000000000',
        app_key: app_key || '00000000000000000000000000000000',
        tenant_id: null,
        status: 'offline',
        last_message_received_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    mockData.devices.push(newDevice);
    res.status(201).json(newDevice);
});

app.get('/v1/devices/:id', (req, res) => {
    const device = mockData.devices.find(d => d.id === req.params.id);
    if (!device) {
        return res.status(404).json({ message: 'Device not found' });
    }
    res.json(device);
});

app.put('/v1/devices/:id', (req, res) => {
    const device = mockData.devices.find(d => d.id === req.params.id);
    if (!device) {
        return res.status(404).json({ message: 'Device not found' });
    }

    Object.assign(device, req.body, {
        updated_at: new Date().toISOString()
    });

    res.json(device);
});

// Device tasks
app.get('/v1/devices/:id/tasks', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Mock tasks for the device
    const mockTasks = [
        {
            id: uuidv4(),
            device_id: req.params.id,
            commands: [
                {
                    index: 1,
                    value: 1, // Activate relay
                    priority: "NORMAL",
                    wait_for: "0s"
                },
                {
                    index: 1,
                    value: 0, // Deactivate relay
                    priority: "NORMAL",
                    wait_for: "5m" // 5 minutes duration
                }
            ],
            created_at: new Date().toISOString()
        }
    ];

    const paginatedTasks = mockTasks.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(mockTasks.length / parseInt(limit));

    res.json({
        data: paginatedTasks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: mockTasks.length,
            total_pages: totalPages
        }
    });
});

app.post('/v1/devices/:id/tasks', (req, res) => {
    const { commands } = req.body;

    if (!commands || !Array.isArray(commands)) {
        return res.status(400).json({ message: 'Commands array is required' });
    }

    const newTask = {
        id: uuidv4(),
        device_id: req.params.id,
        commands,
        created_at: new Date().toISOString()
    };

    res.status(201).json(newTask);
});

// Scheduled tasks
app.get('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const tasks = mockData.scheduledTasks.filter(
        task => task.device_id === req.params.deviceId
    );

    const paginatedTasks = tasks.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(tasks.length / parseInt(limit));

    console.log('📅 Scheduled tasks request for device:', req.params.deviceId);
    console.log('📅 Returning tasks:', JSON.stringify(paginatedTasks, null, 2));

    res.json({
        data: paginatedTasks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: tasks.length,
            total_pages: totalPages
        }
    });
});

app.post('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks', (req, res) => {
    const { commands, scheduling, schedule, is_active = true } = req.body;

    if (!commands || (!scheduling && !schedule)) {
        return res.status(400).json({ message: 'Commands and scheduling (or schedule) are required' });
    }

    const newTask = {
        id: uuidv4(),
        device_id: req.params.deviceId,
        commands,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Handle both new scheduling format and legacy schedule format
    if (scheduling) {
        newTask.scheduling = scheduling;
    } else {
        newTask.schedule = schedule;
    }

    mockData.scheduledTasks.push(newTask);
    res.status(201).json(newTask);
});

app.get('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks/:id', (req, res) => {
    const task = mockData.scheduledTasks.find(
        t => t.id === req.params.id && t.device_id === req.params.deviceId
    );

    if (!task) {
        return res.status(404).json({ message: 'Scheduled task not found' });
    }

    res.json(task);
});

app.put('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks/:id', (req, res) => {
    const task = mockData.scheduledTasks.find(
        t => t.id === req.params.id && t.device_id === req.params.deviceId
    );

    if (!task) {
        return res.status(404).json({ message: 'Scheduled task not found' });
    }

    // Update task with new data
    Object.assign(task, req.body);
    task.updated_at = new Date().toISOString();

    res.json(task);
});

app.delete('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks/:id', (req, res) => {
    const taskIndex = mockData.scheduledTasks.findIndex(
        t => t.id === req.params.id && t.device_id === req.params.deviceId
    );

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Scheduled task not found' });
    }

    mockData.scheduledTasks.splice(taskIndex, 1);
    res.status(204).send();
});

// Task executions for scheduled tasks
app.get('/v1/tenants/:tenantId/devices/:deviceId/scheduled-tasks/:id/tasks', (req, res) => {
    const { page = 1, limit = 3 } = req.query;
    const offset = (page - 1) * limit;

    // Find executions for the specific scheduled task
    const executions = mockData.taskExecutions.filter(
        exec => exec.task_id === req.params.id
    );

    // Sort by created_at descending (most recent first) and paginate
    const sortedExecutions = executions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const paginatedExecutions = sortedExecutions.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(executions.length / parseInt(limit));

    res.json({
        data: paginatedExecutions,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: executions.length,
            total_pages: totalPages
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log('🚀 Zensor Mock Server started successfully!');
    console.log(`📄 Server URL: http://${HOST}:${PORT}`);
    console.log(`🔗 WebSocket URL: ws://${HOST}:${PORT}/ws/device-messages`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   GET  /healthz                    - Health check');
    console.log('   GET  /metrics                    - Prometheus metrics');
    console.log('   GET  /v1/tenants                 - List tenants');
    console.log('   POST /v1/tenants                 - Create tenant');
    console.log('   GET  /v1/tenants/{id}            - Get tenant');
    console.log('   PUT  /v1/tenants/{id}            - Update tenant');
    console.log('   GET  /v1/tenants/{id}/configuration - Get tenant configuration');
    console.log('   PUT  /v1/tenants/{id}/configuration - Update tenant configuration');
    console.log('   GET  /v1/tenants/{id}/devices    - List tenant devices');
    console.log('   POST /v1/tenants/{id}/devices    - Adopt device');
    console.log('   GET  /v1/devices                 - List all devices');
    console.log('   POST /v1/devices                 - Create device');
    console.log('   GET  /v1/devices/{id}            - Get device');
    console.log('   PUT  /v1/devices/{id}            - Update device');
    console.log('   GET  /v1/devices/{id}/tasks      - List device tasks');
    console.log('   POST /v1/devices/{id}/tasks      - Create task');
    console.log('   GET  /v1/tenants/{tid}/devices/{did}/scheduled-tasks - List scheduled tasks');
    console.log('   POST /v1/tenants/{tid}/devices/{did}/scheduled-tasks - Create scheduled task');
    console.log('   GET  /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id} - Get scheduled task');
    console.log('   PUT  /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id} - Update scheduled task');
    console.log('   DELETE /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id} - Delete scheduled task');
    console.log('   GET  /v1/tenants/{tid}/devices/{did}/scheduled-tasks/{id}/tasks - Get task executions');
    console.log('   GET  /ws/device-messages         - WebSocket endpoint');
    console.log('');
    console.log('🔧 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down mock server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down mock server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
}); 