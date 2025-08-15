# Adobe India Hackathon 2025 Grand Finale Backend

## 🎯 **"Connecting the Dots"** - Cross-Document AI Insights System

A sophisticated backend that enables users to select text in PDF documents and discover related content across their entire document collection, powered by AI-generated insights and audio overviews.

---

## 🏆 **Hackathon Features Implemented**

### **Core Mandatory Features**
1. **Text Selection in PDF Documents**
   - Select any text passage in uploaded PDF files
   - Trigger cross-document semantic search
   - Navigate between related sections across documents

2. **Cross-Document Semantic Search**
   - AI-powered semantic similarity using sentence transformers
   - Find related content across all uploaded documents
   - Context-aware section extraction and ranking

### **Bonus Features (+10 Points Total)**

#### 🔍 **Insights Bulb Feature (+5 Points)**
- **Key Takeaways**: Automated extraction of main insights
- **Did You Know**: Surprising facts from related sections
- **Contradictions**: Identifying conflicting information
- **Examples & Applications**: Practical use cases
- **Cross-Document Inspirations**: Creative connections between documents

#### 🎧 **Audio Overview/Podcast Mode (+5 Points)**
- **2-5 Minute Audio Summaries**: TTS-generated overviews
- **Podcast Mode**: Two-speaker conversation format
- **Personalized Content**: Based on user's actual documents
- **Professional Narration**: Clear, engaging audio output

---

## 🚀 **Quick Start Guide**

### **1. Environment Setup**
```bash
# Clone and navigate to project
cd combined-backend

# Copy environment template
cp .env.example .env

# Edit .env with your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### **2. Docker Deployment (Recommended)**
```bash
# Build and run on port 8080 (as required by hackathon)
docker-compose up --build

# Backend will be available at: http://localhost:8080
```

### **3. Local Development**
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## 📋 **API Endpoints Overview**

### **Document Management**
```http
POST /documents/upload          # Upload PDF documents
GET  /documents/list           # List all documents
GET  /documents/{doc_id}       # Get document details
```

### **Text Selection & Cross-Document Search**
```http
POST /text-selection/find-related      # Find related sections
POST /text-selection/navigate-to       # Navigate to specific section
GET  /text-selection/similarity-test   # Test semantic similarity
```

### **AI Insights (Bonus +5 Points)**
```http
POST /insights/generate-insights-bulb  # Generate AI insights
GET  /insights/health                   # Check insights service
```

### **Audio Overview (Bonus +5 Points)**
```http
POST /insights/generate-audio-overview # Generate audio/podcast
```

### **System Health**
```http
GET  /health                   # System health check
GET  /docs                     # API documentation
```

---

## 🎯 **Usage Workflow**

### **Step 1: Document Upload**
```bash
curl -X POST "http://localhost:8080/documents/upload" \
     -F "file=@document.pdf"
```

### **Step 2: Text Selection**
```bash
curl -X POST "http://localhost:8080/text-selection/find-related" \
     -H "Content-Type: application/json" \
     -d '{
       "selected_text": "artificial intelligence machine learning",
       "document_id": "doc_123",
       "max_results": 5
     }'
```

### **Step 3: Generate AI Insights (Bonus)**
```bash
curl -X POST "http://localhost:8080/insights/generate-insights-bulb" \
     -H "Content-Type: application/json" \
     -d '{
       "selected_text": "machine learning applications",
       "related_sections": [...],
       "insight_types": ["key_takeaways", "did_you_know", "examples"]
     }'
```

### **Step 4: Audio Overview (Bonus)**
```bash
curl -X POST "http://localhost:8080/insights/generate-audio-overview" \
     -H "Content-Type: application/json" \
     -d '{
       "selected_text": "deep learning neural networks",
       "related_sections": [...],
       "audio_type": "podcast"
     }' --output audio_overview.mp3
```

---

## 🏗️ **Architecture Overview**

### **Backend Structure**
```
combined-backend/
├── app/
│   ├── text_selection/         # Cross-document search
│   │   ├── service.py         # Semantic similarity engine
│   │   └── router.py          # REST API endpoints
│   ├── insights/              # AI insights generation
│   │   ├── bulb_service.py    # Insights Bulb (+5 points)
│   │   └── router.py          # Insights API
│   ├── documents/             # Document management
│   ├── services/              # TTS and other services
│   └── database/              # Data models
├── Dockerfile                 # Production deployment
├── docker-compose.yml         # Container orchestration
└── requirements.txt           # Python dependencies
```

### **Key Technologies**
- **FastAPI**: High-performance async Python web framework
- **Sentence Transformers**: Semantic similarity calculation
- **Google Gemini 2.5 Flash**: AI insights generation
- **pyttsx3/gTTS**: Text-to-Speech for audio features
- **SQLAlchemy**: Document storage and retrieval
- **Docker**: Containerized deployment on port 8080

---

## 🔬 **Technical Implementation**

### **Cross-Document Search Algorithm**
1. **Text Processing**: Clean and tokenize selected text
2. **Embedding Generation**: Convert text to semantic vectors
3. **Similarity Calculation**: Compare against all document sections
4. **Ranking & Filtering**: Sort by relevance score
5. **Context Extraction**: Retrieve surrounding content

### **AI Insights Pipeline**
1. **Content Analysis**: Process selected text and related sections
2. **Prompt Engineering**: Structure queries for Gemini 2.5 Flash
3. **Insight Generation**: Generate multiple insight types
4. **Quality Filtering**: Ensure relevance and accuracy
5. **Response Formatting**: Structure for frontend consumption

### **Audio Generation Process**
1. **Script Generation**: Create natural-sounding narration
2. **TTS Synthesis**: Convert text to speech
3. **Audio Processing**: Optimize for clarity and engagement
4. **File Management**: Serve as downloadable MP3

---

## 🧪 **Testing & Validation**

### **Health Checks**
```bash
# System health
curl http://localhost:8080/health

# Feature-specific health
curl http://localhost:8080/insights/health
```

### **Feature Testing**
```bash
# Test semantic similarity
curl -X GET "http://localhost:8080/text-selection/similarity-test?text1=machine%20learning&text2=artificial%20intelligence"

# Validate TTS service
curl -X POST "http://localhost:8080/insights/generate-audio-overview" \
     -H "Content-Type: application/json" \
     -d '{"selected_text": "test", "related_sections": [], "audio_type": "overview"}'
```

---

## 🎖️ **Hackathon Scoring Breakdown**

### **Mandatory Features Implementation**
- ✅ **Text Selection in PDFs**: Fully implemented
- ✅ **Cross-Document Search**: AI-powered semantic search
- ✅ **Navigation Between Documents**: Seamless section jumping
- ✅ **User Interface Integration**: API ready for frontend

### **Bonus Points Achieved**
- 🏆 **Insights Bulb (+5 points)**: Complete AI insights generation
- 🏆 **Audio Overview (+5 points)**: TTS podcast generation
- 🏆 **Total Bonus**: +10 points

### **Technical Excellence**
- ✅ **Docker Deployment**: Port 8080 ready
- ✅ **API Documentation**: Comprehensive Swagger docs
- ✅ **Error Handling**: Robust exception management
- ✅ **Performance**: Async processing with caching
- ✅ **Scalability**: Modular architecture

---

## 🔧 **Development Notes**

### **Environment Variables**
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=sqlite:///./data/pdf_collections.db
PORT=8080
ENVIRONMENT=production
```

### **Dependencies**
- All dependencies listed in `requirements.txt`
- TTS libraries: `pyttsx3`, `gTTS`
- AI/ML: `sentence-transformers`, `google-generativeai`
- Web: `fastapi`, `uvicorn`
- Database: `sqlalchemy`, `sqlite3`

### **Known Limitations**
- TTS quality depends on system capabilities
- Gemini API key required for full insights functionality
- Large document collections may require indexing optimization

---

## 📞 **Support & Documentation**

- **API Docs**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health
- **ReDoc**: http://localhost:8080/redoc

---

## 🎯 **Hackathon Submission Summary**

This backend implements the complete "Connecting the Dots" challenge for Adobe India Hackathon 2025 Grand Finale, featuring:

1. **Core functionality**: Cross-document text selection and semantic search
2. **Bonus Feature 1**: Insights Bulb with AI-generated insights (+5 points)
3. **Bonus Feature 2**: Audio Overview/Podcast Mode (+5 points)
4. **Production ready**: Docker deployment on port 8080
5. **Comprehensive API**: Full REST API with documentation

**Total Implementation**: All mandatory features + 10 bonus points

Ready for demo and production deployment! 🚀
