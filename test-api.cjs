// Test script to verify API endpoints are returning correct paginated format
const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3000';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;

        client.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function testEndpoint(name, url) {
    try {
        const result = await makeRequest(url);

        console.log(`\n✅ ${name}:`);
        console.log(`   URL: ${url}`);
        console.log(`   Status: ${result.status}`);

        // Check if response has the correct structure
        if (result.data.data && result.data.pagination) {
            console.log(`   ✅ Correct paginated format`);
            console.log(`   📊 Data items: ${result.data.data.length}`);
            console.log(`   📄 Pagination: page ${result.data.pagination.page}/${result.data.pagination.total_pages}, total: ${result.data.pagination.total}`);
        } else {
            console.log(`   ❌ Incorrect format - missing data or pagination`);
            console.log(`   📄 Response keys: ${Object.keys(result.data).join(', ')}`);
        }

        return true;
    } catch (error) {
        console.log(`\n❌ ${name}:`);
        console.log(`   URL: ${url}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing API Endpoints for Paginated Response Format\n');

    const tests = [
        {
            name: 'Tenants List',
            url: `${API_BASE}/v1/tenants?page=1&limit=3`
        },
        {
            name: 'Devices List',
            url: `${API_BASE}/v1/devices?page=1&limit=3`
        },
        {
            name: 'Tenant Devices',
            url: `${API_BASE}/v1/tenants/550e8400-e29b-41d4-a716-446655440001/devices?page=1&limit=3`
        },
        {
            name: 'Device Tasks',
            url: `${API_BASE}/v1/devices/123e4567-e89b-12d3-a456-426614174002/tasks?page=1&limit=3`
        },
        {
            name: 'Scheduled Tasks',
            url: `${API_BASE}/v1/tenants/550e8400-e29b-41d4-a716-446655440001/devices/123e4567-e89b-12d3-a456-426614174002/scheduled-tasks?page=1&limit=3`
        },
        {
            name: 'Task Executions',
            url: `${API_BASE}/v1/tenants/550e8400-e29b-41d4-a716-446655440001/devices/123e4567-e89b-12d3-a456-426614174002/scheduled-tasks/task-001/tasks?page=1&limit=3`
        }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        const success = await testEndpoint(test.name, test.url);
        if (success) passed++;
    }

    console.log(`\n📊 Test Results: ${passed}/${total} endpoints working correctly`);

    if (passed === total) {
        console.log('🎉 All endpoints are returning the correct paginated format!');
    } else {
        console.log('⚠️  Some endpoints need attention.');
    }
}

// Run the tests
runTests().catch(console.error); 