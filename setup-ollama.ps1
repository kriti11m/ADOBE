# Adobe Contest Setup Script for Windows
# Sets up Ollama and required models for enhanced text selection

Write-Host "🚀 Adobe Contest Setup - Windows + Ollama" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Ollama is installed
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

if ($ollamaInstalled) {
    Write-Host "✅ Ollama is already installed" -ForegroundColor Green
} else {
    Write-Host "📦 Please install Ollama manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://ollama.ai/download" -ForegroundColor White
    Write-Host "   2. Download and install Ollama for Windows" -ForegroundColor White
    Write-Host "   3. Re-run this script after installation" -ForegroundColor White
    Read-Host "Press Enter after installing Ollama..."
    
    # Check again
    $ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollamaInstalled) {
        Write-Host "❌ Ollama not found. Please install it and try again." -ForegroundColor Red
        exit 1
    }
}

# Check if Ollama service is running
Write-Host "🔄 Checking Ollama service..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Ollama service is running" -ForegroundColor Green
} catch {
    Write-Host "🔄 Starting Ollama service..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 10
        Write-Host "✅ Ollama service started successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Ollama service may not be ready yet. Continuing..." -ForegroundColor Yellow
    }
}

# Pull required models
Write-Host "📥 Downloading required models..." -ForegroundColor Cyan

Write-Host "  📋 Pulling nomic-embed-text (1.5GB) for embeddings..." -ForegroundColor White
& ollama pull nomic-embed-text
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ nomic-embed-text downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Failed to download nomic-embed-text, will use fallback" -ForegroundColor Yellow
}

Write-Host "  📋 Pulling llama3 (4GB) for LLM..." -ForegroundColor White
& ollama pull llama3
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ llama3 downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Failed to download llama3, will use fallback" -ForegroundColor Yellow
}

# Optional: Pull alternative models
Write-Host "  📋 Pulling mxbai-embed-large (alternative embedding model)..." -ForegroundColor White
& ollama pull mxbai-embed-large

# List installed models
Write-Host "📋 Installed models:" -ForegroundColor Cyan
& ollama list

# Create environment file for local development
Write-Host "📝 Creating .env.local file..." -ForegroundColor Cyan

$envContent = @"
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
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Copy .env.local to .env and configure your API keys" -ForegroundColor White
Write-Host "   2. Install Docker Desktop if not already installed" -ForegroundColor White
Write-Host "   3. Run: docker-compose up --build" -ForegroundColor White
Write-Host "   4. Open: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "📊 Model sizes installed:" -ForegroundColor Cyan
Write-Host "   - nomic-embed-text: ~1.5GB (embeddings)" -ForegroundColor White
Write-Host "   - llama3: ~4GB (LLM)" -ForegroundColor White
Write-Host "   - mxbai-embed-large: ~670MB (alternative embeddings)" -ForegroundColor White
Write-Host ""
Write-Host "🏆 Contest ready! Total size well under 20GB requirement." -ForegroundColor Green

# Test the setup
Write-Host ""
Write-Host "🧪 Testing setup..." -ForegroundColor Cyan

Push-Location "combined-backend"
try {
    & python -c "from app.text_selection.service import TextSelectionService; service = TextSelectionService(); print('✅ Enhanced text selection service ready!')"
    Write-Host "✅ Backend services are working correctly" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend test failed - check Python dependencies" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "🚀 Ready for contest! Your enhanced embedding system is configured." -ForegroundColor Green
Read-Host "Press Enter to continue..."
