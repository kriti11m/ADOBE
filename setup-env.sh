#!/bin/bash

# Environment Setup Script for ConnectPDF
echo "🔧 ConnectPDF Environment Setup"
echo "================================"

# Check if global .env exists
if [ ! -f ".env" ]; then
    echo "❌ Global .env file not found!"
    exit 1
fi

echo "✅ Global .env file found"

# Check for required environment variables
echo ""
echo "📋 Checking required environment variables..."

# Check Gemini API Key
if grep -q "GEMINI_API_KEY=AIzaSy" .env && ! grep -q "GEMINI_API_KEY=your_actual" .env; then
    echo "✅ Gemini API Key configured"
else
    echo "⚠️  Gemini API Key needs to be configured"
    echo "   1. Go to https://aistudio.google.com/app/apikey"
    echo "   2. Create an API key"
    echo "   3. Replace the value in .env file"
fi

# Check Adobe Client ID
if grep -q "REACT_APP_ADOBE_CLIENT_ID=" adobe_frontend/.env && ! grep -q "REACT_APP_ADOBE_CLIENT_ID=YOUR_ACTUAL" adobe_frontend/.env; then
    echo "✅ Adobe Client ID configured"
else
    echo "⚠️  Adobe Client ID needs to be configured"
    echo "   1. Go to https://www.adobe.com/go/dcsdks_credentials"
    echo "   2. Create a project and get Client ID"
    echo "   3. Replace the value in adobe_frontend/.env file"
fi

echo ""
echo "🚀 Environment Status:"
echo "   - Global .env: ✅ Present"
echo "   - Backend .env: Uses global config"
echo "   - Frontend .env: ✅ Present"

echo ""
echo "💡 To start the application:"
echo "   Backend:  cd combined-backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo "   Frontend: cd adobe_frontend && npm start"
