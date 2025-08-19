# Combined PDF Processing Backend

A unified FastAPI backend that integrates two powerful PDF processing services:

## 🚀 Services

### 📄 Part 1A: PDF Structure Extractor
- **Purpose**: Extracts title and headings (H1, H2, H3) from PDF files with page numbers
- **Features**: 
  - ✨ Multilingual support
  - 🔍 Font analysis and spatial reasoning
  - 🚀 Offline processing with minimal memory usage
  - 📊 Content pattern recognition

### 🧠 Part 1B: Document Analysis System
- **Purpose**: Extracts and ranks relevant sections from PDF documents based on user personas and tasks
- **Features**:
  - 🎯 Persona-based relevance ranking
  - 🔍 Semantic analysis using sentence transformers
  - 📖 Section detection and extraction
  - 📊 Multi-document processing

## 📋 Requirements

- Python 3.8+
- 8 CPUs, 16GB RAM minimum (for Part 1B)
- Internet connection for initial model download (first run only)

## 🛠 Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download models** (for Part 1B):
   ```bash
   cd app/part1b
   python download_models.py
   cd ../..
   ```

## 🚀 Quick Start

### Start the Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Access the API
- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📚 API Endpoints

### Part 1A - PDF Structure Extractor

#### Extract PDF Structure
```http
POST /part1a/extract
Content-Type: multipart/form-data

file: [PDF file]
```

### Part 1B - Document Analysis System

#### Analyze Single Document
```http
POST /part1b/analyze-single
Content-Type: multipart/form-data

file: [PDF file]
persona: "Researcher"
job: "Extract key findings and conclusions"
```

## 🧪 Example Usage

### Using cURL

**Part 1A - Extract PDF Structure**:
```bash
curl -X POST "http://localhost:8000/part1a/extract" \
  -F "file=@your_document.pdf"
```

**Part 1B - Analyze Document**:
```bash
curl -X POST "http://localhost:8000/part1b/analyze-single" \
  -F "file=@your_document.pdf" \
  -F "persona=PhD Researcher" \
  -F "job=Prepare literature review focusing on methodologies"
```

## 🏥 Health Checks

- **Part 1A Health**: `GET /part1a/health`
- **Part 1B Health**: `GET /part1b/health`
- **Combined Health**: `GET /health`

## 📄 License

MIT License - Open source, built for robust and accurate document processing.
