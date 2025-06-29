#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
    port: 3000,
    host: '0.0.0.0',
    openapiFile: path.join(__dirname, 'docs', 'openapi.yaml'),
    cors: true,
    dynamic: true,
    verbose: true
};

console.log('🚀 Starting Zensor Mock Server...');
console.log(`📄 OpenAPI Spec: ${config.openapiFile}`);
console.log(`🌐 Server URL: http://localhost:${config.port}`);
console.log(`🔗 WebSocket URL: ws://localhost:${config.port}/ws/device-messages`);
console.log('');

// Build prism command
const args = [
    'mock',
    config.openapiFile,
    '--port', config.port.toString(),
    '--host', config.host,
    '--cors',
    '--dynamic'
];

if (config.verbose) {
    args.push('--verbose');
}

// Start the mock server
const prism = spawn('prism', args, {
    stdio: 'inherit',
    shell: true
});

// Handle process events
prism.on('error', (error) => {
    console.error('❌ Failed to start mock server:', error.message);
    console.log('');
    console.log('💡 Make sure you have @stoplight/prism-cli installed:');
    console.log('   npm install -g @stoplight/prism-cli');
    process.exit(1);
});

prism.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Mock server exited with code ${code}`);
        process.exit(code);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down mock server...');
    prism.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down mock server...');
    prism.kill('SIGTERM');
});

console.log('✅ Mock server started successfully!');
console.log('');
console.log('📋 Available endpoints:');
console.log('   GET  /healthz                    - Health check');
console.log('   GET  /metrics                    - Prometheus metrics');
console.log('   GET  /v1/tenants                 - List tenants');
console.log('   POST /v1/tenants                 - Create tenant');
console.log('   GET  /v1/tenants/{id}            - Get tenant');
console.log('   PUT  /v1/tenants/{id}            - Update tenant');
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
console.log('   GET  /ws/device-messages         - WebSocket endpoint');
console.log('');
console.log('🔧 Press Ctrl+C to stop the server'); 