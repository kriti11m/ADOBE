#!/bin/bash
# Setup script for Adobe Contest local development
# Installs Ollama and required models for enhanced embedding quality

echo "🚀 Adobe Contest Setup - Local Development with Ollama"
echo "======================================================="

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "❌ This script is for Linux/macOS. For Windows:"
    echo "   1. Install Ollama from https://ollama.ai/download"
    echo "   2. Run: ollama pull nomic-embed-text"
    echo "   3. Run: ollama pull llama3"
    echo "   4. Set environment variables in .env file"
    exit 1
fi

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed"
else
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Failed to install Ollama"
        exit 1
    fi
fi

# Start Ollama service
echo "🔄 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for service to be ready
echo "⏳ Waiting for Ollama service to start..."
sleep 5

# Pull required models for contest
echo "📥 Downloading required models..."

echo "  📋 Pulling nomic-embed-text (1.5GB) for embeddings..."
ollama pull nomic-embed-text

if [ $? -eq 0 ]; then
    echo "  ✅ nomic-embed-text downloaded successfully"
else
    echo "  ⚠️ Failed to download nomic-embed-text, will use fallback"
fi

echo "  📋 Pulling llama3 (4GB) for LLM..."
ollama pull llama3

if [ $? -eq 0 ]; then
    echo "  ✅ llama3 downloaded successfully"
else
    echo "  ⚠️ Failed to download llama3, will use fallback"
fi

# Optional: Pull alternative models
echo "  📋 Pulling mxbai-embed-large (alternative embedding model)..."
ollama pull mxbai-embed-large

# List installed models
echo "📋 Installed models:"
ollama list

# Create environment file for local development
echo "📝 Creating .env.local file..."
cat > .env.local << EOL
# Local development environment with Ollama
# Copy to .env to activate

# Embedding configuration (highest priority)
USE_API_EMBEDDINGS=true
EMBEDDING_API_TYPE=ollama
OLLAMA_BASE_URL=http://localhost:11434

# LLM configuration
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3

# TTS configuration (local fallback)
TTS_PROVIDER=local
LOCAL_TTS_ENGINE=gtts

# Adobe PDF API (add your key)
ADOBE_EMBED_API_KEY=your_adobe_api_key_here

# Contest environment variables (for reference)
# GEMINI_MODEL=gemini-2.5-flash
# GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json
# AZURE_TTS_KEY=your_azure_key
# AZURE_TTS_ENDPOINT=your_azure_endpoint
EOL

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Copy .env.local to .env and configure your API keys"
echo "   2. Run: docker-compose up --build"
echo "   3. Open: http://localhost:8080"
echo ""
echo "📊 Model sizes installed:"
echo "   - nomic-embed-text: ~1.5GB (embeddings)"
echo "   - llama3: ~4GB (LLM)"
echo "   - mxbai-embed-large: ~670MB (alternative embeddings)"
echo ""
echo "🏆 Contest ready! Total size well under 20GB requirement."

# Keep Ollama running for immediate testing
echo "🔄 Ollama service running (PID: $OLLAMA_PID)"
echo "   Use 'kill $OLLAMA_PID' to stop the service"
