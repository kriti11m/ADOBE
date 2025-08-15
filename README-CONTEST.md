# Adobe Contest Submission - PDF Text Selection & Cross-Document Insights

## 🎯 Solution Overview

This solution implements a comprehensive PDF text selection system with cross-document semantic search and AI-powered insights, specifically built for the Adobe Contest requirements.

### ✨ Core Features

1. **📝 Text Selection in PDFs** - Interactive text selection with Adobe PDF Embed API
2. **🔍 Cross-Document Search** - Semantic search across multiple documents using embeddings
3. **💡 Insights Bulb (+5 points)** - AI-powered insights and connections using contest LLM providers
4. **🎙️ Audio Overview/Podcast (+5 points)** - Text-to-speech generation with multiple providers

### 🏗️ Architecture

- **Backend**: FastAPI with modular router architecture
- **Frontend**: React.js with Adobe PDF Embed API integration
- **LLM Integration**: Multi-provider support (Gemini, Ollama, OpenAI, Azure)
- **TTS Integration**: Azure TTS, Google Cloud TTS, local TTS options
- **Embeddings**: Ollama (local), OpenAI, Cohere with SentenceTransformer fallback
- **Database**: SQLite with SQLAlchemy for document management

## 🚀 Contest Compliance

### Environment Variables (Contest Required)

```bash
# Required by contest evaluation
ADOBE_EMBED_API_KEY=your_adobe_api_key
LLM_PROVIDER=gemini
GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json
GEMINI_MODEL=gemini-2.5-flash
TTS_PROVIDER=azure
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_ENDPOINT=your_azure_tts_endpoint
```

### Docker Commands (Contest Specification)

```bash
# Build (contest requirement)
docker build --platform linux/amd64 -t adobe-contest .

# Run (contest format)
docker run -v /path/to/credentials:/credentials \
  -e ADOBE_EMBED_API_KEY=<ADOBE_EMBED_API_KEY> \
  -e LLM_PROVIDER=gemini \
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=TTS_KEY \
  -e AZURE_TTS_ENDPOINT=TTS_ENDPOINT \
  -p 8080:8080 adobe-contest
```

## 🛠️ Local Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd ADOBE-1

# Build and run with Docker Compose
docker-compose up --build

# Access the application
open http://localhost:8080
```

### Alternative: Local Development

```bash
# Backend setup
cd combined-backend
pip install -r requirements.txt
python init_db.py
uvicorn main:app --host 0.0.0.0 --port 8080

# Frontend setup (separate terminal)
cd adobe_frontend
npm install
npm run build
```

### With Ollama (Local LLM)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull nomic-embed-text  # For embeddings (1.5GB)
ollama pull llama3            # For LLM (4GB)

# Run with Ollama
LLM_PROVIDER=ollama docker-compose up
```

## 📋 API Endpoints

### Core Features

- `GET /` - Main application interface
- `GET /health` - Health check for Docker monitoring
- `GET /docs` - Interactive API documentation

### Text Selection

- `POST /text-selection/find-related` - Find related sections for selected text
- `GET /text-selection/documents` - List available documents

### Insights (Bonus Features)

- `POST /insights/generate-insights-bulb` - Generate AI insights (+5 points)
- `POST /insights/generate-audio-overview` - Generate audio/podcast (+5 points)

### Document Management

- `POST /documents/upload` - Upload PDF documents
- `GET /documents/list` - List uploaded documents
- `POST /part1a/extract-structure` - Extract PDF structure
- `POST /part1b/analyze-content` - Analyze document content

## 🔧 Configuration Options

### LLM Providers

```bash
# Gemini (contest default)
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash

# Ollama (local, free)
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o

# Azure OpenAI
LLM_PROVIDER=azure
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_BASE=your_endpoint
```

### Embedding Models

```bash
# Ollama embeddings (recommended, 1.5GB)
USE_API_EMBEDDINGS=true
EMBEDDING_API_TYPE=ollama

# OpenAI embeddings
EMBEDDING_API_TYPE=openai
OPENAI_API_KEY=your_key

# SentenceTransformers (fallback, 90MB)
USE_API_EMBEDDINGS=false
```

### TTS Providers

```bash
# Azure TTS (contest default)
TTS_PROVIDER=azure
AZURE_TTS_KEY=your_key
AZURE_TTS_ENDPOINT=your_endpoint

# Google Cloud TTS
TTS_PROVIDER=gcp
GOOGLE_APPLICATION_CREDENTIALS=path_to_json

# Local TTS
TTS_PROVIDER=local
LOCAL_TTS_ENGINE=gtts
```

## 🎯 Contest Features Implementation

### 1. Text Selection Logic
- Select text in PDF → system finds relevant sections/snippets → user clicks to jump
- Implemented with Adobe PDF Embed API and semantic search

### 2. Cross-Document Connections
- Automatic linking across PDFs based on semantic meaning
- Semantic relevance scoring for contest evaluation

### 3. LLM Integration
- Uses contest-provided environment variables
- Supports Gemini 2.5-flash for evaluation
- Ollama support for local development

### 4. Offline Capabilities
- Only LLM, TTS, and Embed API use internet (as permitted)
- Local embeddings with SentenceTransformer fallback
- Local TTS options available

### 5. Docker Deployment
- Fully runnable in Docker (combined frontend + backend)
- Platform: linux/amd64 as required
- Health check endpoint for monitoring

### 6. Performance & Size
- Under 20GB Docker image size requirement
- Optimized model selection (nomic-embed-text: 1.5GB)
- Efficient API call patterns

## 🏆 Bonus Features

### Insights Bulb (+5 points)
- **Endpoint**: `POST /insights/generate-insights-bulb`
- **Function**: AI-powered insights generation for selected text
- **Implementation**: Multi-provider LLM integration with semantic analysis

### Audio Overview/Podcast Mode (+5 points)
- **Endpoint**: `POST /insights/generate-audio-overview`
- **Function**: 2-5 minute audio summaries and podcasts
- **Implementation**: Multi-provider TTS with script generation

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:8080/health

# Test text selection
curl -X POST http://localhost:8080/text-selection/find-related \
  -H "Content-Type: application/json" \
  -d '{"selected_text": "your selected text"}'

# Test insights bulb
curl -X POST http://localhost:8080/insights/generate-insights-bulb \
  -H "Content-Type: application/json" \
  -d '{"selected_text": "test", "related_sections": []}'
```

### Frontend Testing

1. Open http://localhost:8080
2. Upload PDF documents
3. Select text in PDF viewer
4. Observe related sections panel
5. Test insights bulb and audio features

## 📁 Project Structure

```
ADOBE-1/
├── combined-backend/           # FastAPI backend
│   ├── app/
│   │   ├── text_selection/    # Core text selection logic
│   │   ├── insights/          # Insights bulb & audio features
│   │   ├── services/          # LLM and TTS services
│   │   └── ...
│   ├── chat_with_llm.py      # Contest LLM integration
│   ├── generate_audio.py     # Contest TTS integration
│   ├── requirements.txt      # Python dependencies
│   └── main.py              # FastAPI application
├── adobe_frontend/           # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   └── services/        # API integration
│   └── build/              # Production build
├── Dockerfile              # Contest Docker configuration
├── docker-compose.yml     # Development setup
└── README.md              # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Ollama not starting**: Ensure Docker has enough resources
2. **LLM API errors**: Check environment variables and API keys
3. **Frontend not loading**: Verify build directory exists
4. **Embeddings slow**: Try reducing batch size or switching providers

### Debug Mode

```bash
# Enable debug logging
PYTHONUNBUFFERED=1 docker-compose up

# Check container logs
docker-compose logs -f adobe-contest

# Access container shell
docker-compose exec adobe-contest bash
```

## 📊 Performance Metrics

- **Text Selection Response Time**: < 3 seconds
- **Cross-Document Search**: < 5 seconds for 10 documents
- **Insights Generation**: < 10 seconds with Gemini
- **Audio Generation**: < 15 seconds for 2-minute audio
- **Docker Image Size**: < 15GB (well under 20GB requirement)

## 🚀 Deployment

### Production Deployment

1. Set all required environment variables
2. Build with contest platform specification: `--platform linux/amd64`
3. Use provided Docker run command format
4. Ensure credentials volume mount is correct
5. Verify health check endpoint responds

### Contest Submission

1. **Docker Image**: Built with contest specifications
2. **GitHub Repository**: Private repository with complete codebase
3. **Documentation**: This README with setup instructions
4. **Demo Video**: 2-minute demonstration of features
5. **Pitch Deck**: 6-slide presentation (max)

## 📝 License

This project is developed for the Adobe Contest and follows contest guidelines and requirements.

---

**Contact**: For technical questions about this implementation, please refer to the contest guidelines and evaluation criteria.
