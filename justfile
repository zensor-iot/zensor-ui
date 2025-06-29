default:
    @just --list

release version:
    #!/bin/bash
    git tag {{version}}
    git push --tags

dev:
    #!/bin/bash
    echo "🚀 Starting Zensor Portal UI development environment..."
    
    # Check if mock server is already running on port 3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Mock server already running on port 3000"
    else
        echo "🔧 Starting mock server in background..."
        node custom-mock-server.js > mock-server.log 2>&1 &
        MOCK_SERVER_PID=$!
        echo "📝 Mock server started with PID: $MOCK_SERVER_PID"
        
        # Wait a moment for the server to start
        sleep 2
        
        # Check if server started successfully
        if curl -s http://localhost:3000/healthz >/dev/null 2>&1; then
            echo "✅ Mock server started successfully"
        else
            echo "❌ Failed to start mock server"
            kill $MOCK_SERVER_PID 2>/dev/null
            exit 1
        fi
    fi
    
    # Set API base URL for the React app
    export VITE_API_BASE_URL=http://localhost:3000
    
    echo "🌐 Starting React development server..."
    echo "📱 Application will be available at: http://localhost:5173"
    echo "🔗 Mock server available at: http://localhost:3000"
    echo "🔌 WebSocket available at: ws://localhost:3000/ws/device-messages"
    echo ""
    echo "💡 Press Ctrl+C to stop both servers"
    
    # Start the React development server
    npm run dev

mock-only:
    #!/bin/bash
    echo "🔧 Starting mock server only..."
    
    # Check if mock server is already running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Mock server already running on port 3000"
        echo "📄 Server URL: http://localhost:3000"
        echo "🔌 WebSocket URL: ws://localhost:3000/ws/device-messages"
    else
        echo "🚀 Starting mock server..."
        node custom-mock-server.js
    fi

stop-mock:
    #!/bin/bash
    echo "🛑 Stopping mock server..."
    
    # Find and kill the mock server process
    MOCK_PID=$(lsof -ti:3000)
    if [ -n "$MOCK_PID" ]; then
        echo "📝 Found mock server process: $MOCK_PID"
        kill $MOCK_PID
        echo "✅ Mock server stopped"
    else
        echo "ℹ️  No mock server running on port 3000"
    fi

restart-mock:
    #!/bin/bash
    echo "🔄 Restarting mock server..."
    
    # Stop existing mock server
    just stop-mock
    
    # Wait a moment
    sleep 1
    
    # Start new mock server
    echo "🚀 Starting new mock server..."
    node custom-mock-server.js > mock-server.log 2>&1 &
    MOCK_SERVER_PID=$!
    echo "📝 Mock server started with PID: $MOCK_SERVER_PID"
    
    # Wait for server to start
    sleep 2
    
    # Check if server started successfully
    if curl -s http://localhost:3000/healthz >/dev/null 2>&1; then
        echo "✅ Mock server restarted successfully"
        echo "📄 Server URL: http://localhost:3000"
        echo "🔌 WebSocket URL: ws://localhost:3000/ws/device-messages"
    else
        echo "❌ Failed to restart mock server"
        exit 1
    fi