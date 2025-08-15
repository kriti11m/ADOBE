# Multi-stage Docker build for Adobe Contest
# Platform: linux/amd64 as required by contest
FROM --platform=linux/amd64 python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama for local LLM support (contest requirement)
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Copy requirements first for better caching
COPY combined-backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY combined-backend/ ./backend/

# Copy frontend build
COPY adobe_frontend/build/ ./frontend/

# Create necessary directories
RUN mkdir -p /app/backend/data/collections \
    && mkdir -p /app/backend/temp_audio \
    && mkdir -p /credentials

# Install and pull default Ollama models for contest
RUN ollama serve & \
    sleep 10 && \
    ollama pull nomic-embed-text && \
    ollama pull llama3 && \
    pkill ollama

# Set environment variables for contest
ENV PYTHONPATH="/app/backend"
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8080

# Default contest environment variables
ENV LLM_PROVIDER=gemini
ENV GEMINI_MODEL=gemini-2.5-flash
ENV TTS_PROVIDER=azure
ENV USE_API_EMBEDDINGS=true
ENV EMBEDDING_API_TYPE=ollama
ENV OLLAMA_BASE_URL=http://localhost:11434

# Expose port 8080 as required by contest
EXPOSE 8080

# Create startup script for contest requirements
COPY <<EOF /app/start.sh
#!/bin/bash

# Start Ollama service in background
ollama serve &
OLLAMA_PID=\$!

# Wait for Ollama to be ready
echo "🚀 Starting Ollama service..."
sleep 5

# Ensure models are available
echo "📋 Checking Ollama models..."
ollama list || echo "⚠️ No models found, will pull on first use"

# Start the main application
echo "🚀 Starting Adobe Contest Application..."
cd /app/backend

# Initialize database if needed
python init_db.py || echo "⚠️ Database initialization skipped"

# Start the FastAPI application with Uvicorn
exec uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["/app/start.sh"]
