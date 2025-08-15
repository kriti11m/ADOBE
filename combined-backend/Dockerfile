# Adobe Hackathon Finale - Dockerfile for Backend Deployment
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for TTS and audio processing
RUN apt-get update && apt-get install -y \
    espeak espeak-data libespeak1 libespeak-dev \
    festival festvox-kallpc16k \
    alsa-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p temp_audio data/collections

# Set environment variables for finale deployment
ENV ENVIRONMENT=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV GEMINI_API_KEY=""
ENV DATABASE_URL="sqlite:///./data/pdf_collections.db"

# Expose port 8080 as required by Adobe Hackathon
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
