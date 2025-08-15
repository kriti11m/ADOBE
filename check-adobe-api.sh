#!/bin/bash

echo "🔍 Adobe PDF API Configuration Checker"
echo "====================================="

# Check if .env file exists
if [ -f "/Users/kritimaheshwari/Documents/kriti zed/ADOBE/adobe_frontend/.env" ]; then
    echo "✅ .env file found"
    
    # Check if Adobe Client ID is set
    if grep -q "REACT_APP_ADOBE_CLIENT_ID" "/Users/kritimaheshwari/Documents/kriti zed/ADOBE/adobe_frontend/.env"; then
        CLIENT_ID=$(grep "REACT_APP_ADOBE_CLIENT_ID" "/Users/kritimaheshwari/Documents/kriti zed/ADOBE/adobe_frontend/.env" | cut -d'=' -f2)
        
        if [ "$CLIENT_ID" = "YOUR_ADOBE_CLIENT_ID_HERE" ] || [ "$CLIENT_ID" = "" ]; then
            echo "❌ Adobe Client ID not set properly"
            echo "📝 Please follow these steps:"
            echo ""
            echo "1. Go to: https://www.adobe.com/go/dcsdks_credentials"
            echo "2. Create a project and add PDF Embed API"
            echo "3. Copy your Client ID"
            echo "4. Replace YOUR_ADOBE_CLIENT_ID_HERE in .env file"
        else
            echo "✅ Adobe Client ID is configured: ${CLIENT_ID:0:8}..."
        fi
    else
        echo "❌ REACT_APP_ADOBE_CLIENT_ID not found in .env"
    fi
else
    echo "❌ .env file not found"
    echo "📝 Creating .env file template..."
    
    cat > "/Users/kritimaheshwari/Documents/kriti zed/ADOBE/adobe_frontend/.env" << EOF
# Adobe PDF Embed API Configuration
REACT_APP_ADOBE_CLIENT_ID=YOUR_ADOBE_CLIENT_ID_HERE

# Backend API Configuration
REACT_APP_API_URL=http://localhost:8080

# Development Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
EOF
    
    echo "✅ .env file created. Please update with your Adobe Client ID."
fi

echo ""
echo "🔧 Quick Setup Commands:"
echo ""
echo "# Option 1: Set your actual Adobe Client ID"
echo "cd adobe_frontend"
echo "echo 'REACT_APP_ADOBE_CLIENT_ID=your_client_id_here' > .env"
echo "echo 'REACT_APP_API_URL=http://localhost:8080' >> .env"
echo ""
echo "# Option 2: Use development mode (limited features)"
echo "echo 'REACT_APP_ADOBE_CLIENT_ID=development_mode' > adobe_frontend/.env"
echo ""
echo "🌐 Get Adobe Client ID:"
echo "https://www.adobe.com/go/dcsdks_credentials"
echo ""
echo "📚 Full setup guide:"
echo "See ADOBE-PDF-API-SETUP.md for detailed instructions"
