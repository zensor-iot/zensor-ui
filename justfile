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
    
    # Build client first to ensure latest changes are included
    echo "🏗️  Building client with latest changes..."
    npm run build:client
    
    # Set API base URL for the React app
    export VITE_API_BASE_URL=http://localhost:3000/v1
    
    echo "🌐 Starting Express SSR server..."
    echo "📱 Application will be available at: http://localhost:5173"
    echo "🔗 Mock server available at: http://localhost:3000"
    echo "🔌 WebSocket available at: ws://localhost:3000/ws/device-messages"
    echo ""
    echo "💡 Press Ctrl+C to stop both servers"
    echo "🔄 To see latest changes, run 'just rebuild' in another terminal"
    
    # Start the Express SSR server
    npm run dev

rebuild:
    #!/bin/bash
    echo "🔄 Rebuilding client with latest changes..."
    npm run build:client
    echo "✅ Client rebuilt successfully!"
    echo "🔄 Refresh your browser to see the latest changes"

watch:
    #!/bin/bash
    echo "👀 Starting full development mode with auto-rebuild and server restart..."
    echo "💡 This will automatically rebuild the client and restart the server when you save files"
    echo ""
    
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
    
    # Build client first
    echo "🏗️  Building client with latest changes..."
    npm run build:client
    
    # Set API base URL for the React app
    export VITE_API_BASE_URL=http://localhost:3000/v1
    
    echo "🌐 Starting Express SSR server with auto-restart..."
    echo "📱 Application will be available at: http://localhost:5173"
    echo "🔗 Mock server available at: http://localhost:3000"
    echo "🔌 WebSocket available at: ws://localhost:3000/ws/device-messages"
    echo ""
    echo "💡 Press Ctrl+C to stop all servers"
    echo "🔄 Server will auto-restart when you save files"
    
    # Install nodemon if not already installed
    if ! command -v nodemon &> /dev/null; then
        echo "📦 Installing nodemon for file watching..."
        npm install -g nodemon
    fi
    
    # Watch for changes and restart both client build and server
    nodemon --watch src/ --watch server/ --ext js,jsx,ts,tsx,css --exec "npm run build:client && npm run dev" --delay 1

watch-client:
    #!/bin/bash
    echo "👀 Watching client files only (no server restart)..."
    echo "💡 This will automatically rebuild the client when you save files"
    echo "🔄 Run this in a separate terminal while 'just dev' is running"
    echo ""
    
    # Install nodemon if not already installed
    if ! command -v nodemon &> /dev/null; then
        echo "📦 Installing nodemon for file watching..."
        npm install -g nodemon
    fi
    
    # Watch for changes in src/ and rebuild client only
    nodemon --watch src/ --ext js,jsx,ts,tsx,css --exec "npm run build:client" --delay 1

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

prod:
    #!/bin/bash
    echo "🚀 Starting Zensor Portal UI in production mode..."
    echo "🌐 Connecting to production API: https://server.zensor-iot.net"
    
    # Check if API key is provided
    if [ -z "$ZENSOR_API_KEY" ]; then
        echo ""
        echo "❌ ZENSOR_API_KEY environment variable is not set!"
        echo ""
        echo "🔑 Please provide your API key in one of these ways:"
        echo ""
        echo "Option 1 - Set environment variable:"
        echo "   export ZENSOR_API_KEY=your-api-key-here"
        echo "   just prod"
        echo ""
        echo "Option 2 - Set it inline:"
        echo "   ZENSOR_API_KEY=your-api-key-here just prod"
        echo ""
        echo "Option 3 - Create a .env file:"
        echo "   cp .env.example .env"
        echo "   # Edit .env and set your ZENSOR_API_KEY"
        echo "   just prod"
        echo ""
        exit 1
    fi
    
    # Build client first to ensure latest changes are included
    echo "🏗️  Building client with latest changes..."
    npm run build:client
    
    # Set production environment variables for the Express server
    export NODE_ENV=production
    export ZENSOR_API_URL=https://server.zensor-iot.net
    export PORT=${PORT:-5173}
    
    echo "🔧 Production configuration:"
    echo "   - API URL: $ZENSOR_API_URL"
    echo "   - API Key: [SET - ${#ZENSOR_API_KEY} characters]"
    echo "   - Port: $PORT"
    echo "   - Environment: $NODE_ENV"
    echo ""
    echo "📱 Application will be available at: http://localhost:$PORT"
    echo "🔗 WebSocket will connect to: wss://server.zensor-iot.net/ws/device-messages"
    echo "🌐 API calls will be proxied to: $ZENSOR_API_URL"
    echo ""
    echo "💡 Press Ctrl+C to stop the server"
    echo "⚠️  Note: This connects to the production API server"
    echo ""
    
    # Start the Express server with production API
    node server/simple-server.js

build-prod:
    #!/bin/bash
    echo "🏗️  Building Zensor Portal UI for production..."
    
    # Set production API base URL
    export VITE_API_BASE_URL=https://server.zensor-iot.net
    
    echo "🌐 Production API URL: $VITE_API_BASE_URL"
    echo "📦 Building optimized production bundle..."
    
    # Build the application
    npm run build
    
    echo "✅ Production build completed!"
    echo "📁 Build output: ./dist/"
    echo "🚀 Ready for deployment"

serve-prod:
    #!/bin/bash
    echo "🌐 Serving production build locally..."
    
    # Check if dist directory exists
    if [ ! -d "./dist" ]; then
        echo "❌ Production build not found. Run 'just build-prod' first."
        exit 1
    fi
    
    echo "📁 Serving from: ./dist/"
    echo "🌐 Application will be available at: http://localhost:4173"
    echo "🔗 Connecting to production API: https://server.zensor-iot.net"
    echo ""
    echo "💡 Press Ctrl+C to stop the server"
    
    # Serve the production build
    npm run preview