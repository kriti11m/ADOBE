# DocuVerse 
*AI-Powered Cross-Document Intelligence Platform*

# Adobe India Hackathon 2025 - Interactive PDF Intelligence Platform

An AI-powered platform that transforms PDF interaction with cross-document insights, smart navigation, and contextual content generation.

---

## **Quick Start - Docker Setup**

# **Step 1: Update Dockerfile**

Create/Update the `Dockerfile` in the root directory with this code:

```dockerfile
# Multi-stage Docker build for Adobe Contest
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including eSpeak for TTS
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    espeak \
    espeak-data \
    libespeak1 \
    libespeak-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY combined-backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY combined-backend/ ./

# Copy frontend build  
COPY adobe_frontend/build/ ./frontend/

# Create necessary directories
RUN mkdir -p /app/data/collections \
    && mkdir -p /app/temp_audio \
    && mkdir -p /credentials

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Set environment variables
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8080
ENV LLM_PROVIDER=gemini
ENV GEMINI_MODEL=gemini-2.5-flash
ENV TTS_PROVIDER=azure

# Expose port
EXPOSE 8080

# Use the startup script
CMD ["/app/start.sh"]
```

# **Step 2: Create start.sh File**

Create a `start.sh` file in the root directory:

```bash
#!/bin/bash
# Contest-compliant startup script
set -e

echo "Starting Adobe Contest Application..."

# Set environment variables with defaults
export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-8080}

# Database setup
export DATABASE_URL=${DATABASE_URL:-"sqlite:///app/data/pdf_collections.db"}
echo "Database path: $DATABASE_URL"

# Create necessary directories
mkdir -p /app/data
mkdir -p /app/temp_audio
mkdir -p /app/uploads

# Check if we have API keys configured
if [ -n "$GEMINI_API_KEY" ]; then
    echo "✅ Gemini API key configured"
fi

if [ -n "$ADOBE_EMBED_API_KEY" ]; then
    echo "✅ Adobe API key configured"
fi

# Start the FastAPI application
echo "Starting server on $HOST:$PORT"
exec uvicorn main:app --host $HOST --port $PORT --workers 1
```

# **Step 3: Build the Docker Image**

```bash
docker build --platform linux/amd64 -t yourimageidentifier .
```

# **Step 4: Run the Container**

```bash
docker run --rm \
  -e ADOBE_EMBED_API_KEY="dfd0b7db776d46e08de836741b4b8b9a" \
  -e LLM_PROVIDER=gemini \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e GEMINI_MODEL="gemini-2.5-flash" \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY="test_key" \
  -e AZURE_TTS_ENDPOINT="test_endpoint" \
  -p 8080:8080 \
  yourimageidentifier
```

**Access the application at:** http://localhost:8080

---

## **Quick Start Guide & Best Practices**

### **What to do For Optimal Performance:**

1. **First-Time Setup:**
   - When accessing the application, you can choose to take the interactive tutorial or skip it
   - **Recommended:** Click "Skip Tutorial" for immediate access to all features
   - If you complete the tutorial and experience any UI responsiveness, simply refresh the page and click on skip tutorial to proceed.

2. **Document Management Best Practice:**
   - Before bulk document uploads, navigate to **Settings → Manage Documents**
   - Click **"Clear History"** to ensure optimal performance and clean slate
   - This ensures efficient document processing and prevents any legacy data conflicts

*These practices ensure seamless document processing and optimal user experience with DocuVerse's advanced AI features.*

---

## **Features**

- **Cross-Document Intelligence:** AI-powered connections between multiple PDFs
- **Smart Navigation:** Precise Adobe PDF navigation with page-specific linking
- **AI-Generated Insights:** Contextual analysis using Gemini AI
- **Audio Podcasts:** Text-to-speech document summaries
- **Real-time Search:** Semantic document search across collections

---

## **Contest Features**

- **✓ Single Port:** Everything runs on port 8080
- **✓ Docker Ready:** One-command deployment
- **✓ Environment Variables:** All API keys externalized
- **✓ Health Checks:** Real-time monitoring at `/health`

---

## **Tech Stack**

- **Frontend:** React, Adobe PDF Embed API
- **Backend:** FastAPI, Python
- **AI/ML:** Gemini AI, Sentence Transformers
- **Database:** SQLite
- **Deployment:** Docker, Uvicorn


```http
# Upload and analyze documents
POST /documents/upload
POST /part1a/extract                # Extract PDF structure
POST /part1b/find-relevant-sections # Find related content

# The fun stuff
POST /insights/generate-insights-bulb  # Generate AI insights
POST /insights/generate-audio-overview # Create podcast audio

# Health and status
GET /health                           # System health check
GET /docs                            # Interactive API docs
```

### **Quick API Test:**
```bash
# Test if everything's working
curl http://localhost:8080/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-08-20T..."}
```

---

## **Testing & Debugging**

### **Quick Health Checks:**

```bash
# 1. Is the app running?
curl http://localhost:8080/health

# 2. Can I upload files?
curl -X POST http://localhost:8080/documents/upload

# 3. Are AI services working?
curl http://localhost:8080/docs  # Check API documentation
```

### **Common Issues & Quick Fixes:**

#### 🚨 **"Backend Connection Failed"**
```bash
# Check if backend is running
curl http://localhost:8080/health

# If not, restart:
cd combined-backend
python main.py
```

#### 🚨 **"PDF Not Displaying"**
- Check your `ADOBE_EMBED_API_KEY` environment variable
- Make sure the PDF isn't corrupted
- Try a different PDF file

#### 🚨 **"AI Insights Not Working"**
- Verify your `GOOGLE_API_KEY` is set correctly
- Check internet connection
- Look at backend logs for errors

#### 🚨 **"Audio Generation Failed"**
- Ensure `AZURE_TTS_KEY` and `AZURE_TTS_ENDPOINT` are configured
- Check if TTS service is accessible
- Try with shorter text snippets

---

## **Docker Testing Made Easy**

### **Step 1: Build**
```bash
docker build --platform linux/amd64 -t yourimageidentifier .
```

### **Step 2: Test Run**
```bash
# Create test credentials
mkdir -p /tmp/test-credentials
echo '{"type":"service_account"}' > /tmp/test-credentials/adbe-gcp.json

# Run container
docker run --rm \
  -v /tmp/test-credentials:/credentials \
  -e ADOBE_EMBED_API_KEY=test_key \
  -e LLM_PROVIDER=gemini \
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=test_tts \
  -e AZURE_TTS_ENDPOINT=test_endpoint \
  -p 8080:8080 \
  yourimageidentifier
```

### **Step 3: Verify**
Open http://localhost:8080 - you should see DocuVerse running!

---

## **Performance & Benchmarks**

We've optimized DocuVerse for real-world usage:

- **PDF Rendering:** 100% fidelity with Adobe's enterprise API
- **Text Analysis:** <5 seconds for most documents
- **AI Insights:** <15 seconds for comprehensive analysis
- **Audio Generation:** <30 seconds for 2-minute podcast
- **Cross-Document Search:** <2 seconds across 50+ documents

### **System Requirements:**
- **RAM:** 8GB minimum, 16GB recommended
- **CPU:** 4 cores minimum for smooth operation
- **Storage:** 2GB free space for models and cache
- **Network:** Internet required for AI features

---

## **Deployment Options**

### **For Contest Judges (Docker):**
```bash
docker build --platform linux/amd64 -t yourimageidentifier .
docker run -p 8080:8080 yourimageidentifier
```

### **For Developers (Local):**
```bash
# Backend
cd combined-backend && pip install -r requirements.txt && python main.py

# Frontend 
cd adobe_frontend && npm install && npm run build
```

## **Pro Tips for Best Experience**

1. **Upload Strategy:** Upload related documents together for better cross-analysis
2. **Text Selection:** Select complete sentences/paragraphs for better insights
3. **Voice Selection:** Try both male and female voices to find your preference
4. **Speed Control:** Use 1.25x speed for faster consumption, 0.75x for complex content
5. **Keyboard Shortcuts:** Spacebar for play/pause, arrow keys for navigation

---

### **Development Standards:**
- **Frontend:** ESLint + Prettier for consistent code style
- **Backend:** Black + isort for Python formatting
- **Testing:** Write tests for new features
- **Documentation:** Update README for any new functionality

---

## **Support & Resources**

### **Quick Links:**
- **Live Demo:** http://localhost:8080 (when running)
- **API Docs:** http://localhost:8080/docs
- **Health Check:** http://localhost:8080/health
- **Adobe PDF API:** [Official Documentation](https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/)

## Demo video link ##

https://drive.google.com/file/d/1TtegpGUUTrwJOd98f5BBS3uau6w5gHzt/view?usp=drive_web
