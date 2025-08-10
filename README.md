# Adobe India Hackathon 2025 - Connecting the Dots Challenge

## Interactive PDF Reading Application with AI-Powered Recommendations

A comprehensive web-based reading experience that displays PDFs using Adobe's PDF Embed API and provides intelligent document recommendations powered by your Round 1A & 1B backends.

## 🚀 Features

### Core Features
- **📄 PDF Display**: Render PDFs with 100% fidelity using Adobe PDF Embed API
- **🔍 Smart Recommendations**: Identify and highlight relevant sections with >80% accuracy
- **⚡ Fast Navigation**: Complete navigation in <2 seconds
- **📁 Bulk Upload**: Upload and process multiple PDFs to build your document library
- **🎯 Persona-Driven**: Tailored recommendations based on user role and task

### Follow-On Features
- **💡 Insights Bulb**: AI-powered insights using GPT-4o
  - Key insights and "Did you know?" facts
  - Contradictions and counterpoints
  - Cross-document connections
- **🎧 Podcast Mode**: Generate 2-5 min narrated audio overviews
- **📱 Responsive Design**: Optimized for Chrome browser
- **🌙 Dark Mode**: Complete dark/light theme support

## 🏗️ Architecture

```
Frontend (React)     Backend (FastAPI)     AI Services
├── PDF Viewer      ├── Part 1A           ├── PDF Structure Extraction
├── Upload System   ├── Part 1B           ├── Document Analysis
├── Insights        ├── History           ├── Gemini Insights
└── Podcast Mode    └── Insights          └── TTS Generation
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Adobe PDF Services API credentials
- Your existing backend services running

## 🛠️ Setup Instructions

### 1. Backend Setup

First, ensure your backend is running:

```bash
cd combined-backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Your backend should be accessible at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd adobe_frontend
npm install
```

### 3. Environment Configuration

Create/update the `.env` file in the frontend directory:

```bash
# Backend API Configuration
REACT_APP_API_URL=http://localhost:8000

# Adobe PDF Embed API
REACT_APP_ADOBE_CLIENT_ID=your_adobe_client_id_here

# Development Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### 4. Adobe PDF Services Setup

1. Go to [Adobe Developer Console](https://www.adobe.com/go/dcsdks_credentials)
2. Create a new project and add PDF Embed API
3. Copy your Client ID and update the `.env` file

### 5. Start the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## 🖥️ Usage Guide

### Initial Setup
1. **Onboarding**: Complete the user profile setup (role & task)
2. **Upload Documents**: Use bulk upload to build your document library
3. **Select Document**: Choose a PDF to view and analyze

### Core Workflow
1. **Upload PDFs**: Bulk upload documents for background processing
2. **View Document**: PDF renders with full fidelity and zoom/pan support
3. **Get Recommendations**: AI identifies relevant sections automatically
4. **Navigate Sections**: Click recommendations to jump to relevant content
5. **Generate Insights**: Use the Insights Bulb for deeper analysis
6. **Create Podcast**: Generate audio summaries of selected content

### Features Overview

#### Document Upload
- **Quick Upload**: Drag & drop or click to upload individual files
- **Bulk Processing**: Use "Bulk Upload & Process" for library building
- **Real-time Processing**: See progress for each document

#### Smart Recommendations
- **Automatic Analysis**: Documents processed using your Round 1B backend
- **Relevance Scoring**: Sections ranked by relevance (>80% accuracy target)
- **Quick Navigation**: One-click navigation to recommended sections
- **Context-Aware**: Recommendations adapt to your role and task

#### AI Insights
- **Key Insights**: Important takeaways and analysis
- **Did You Know**: Interesting facts and additional information
- **Contradictions**: Potential conflicts or counterpoints
- **Connections**: Links between different documents

#### Podcast Mode
- **Auto-Generation**: Create audio overviews based on current content
- **Section-Specific**: Generate podcasts for selected sections
- **Multi-Source**: Combine insights from multiple documents

## 🔧 Technical Implementation

### Frontend Stack
- **React 18**: Modern React with hooks and context
- **Tailwind CSS**: Utility-first styling with dark mode
- **Lucide Icons**: Consistent iconography
- **Adobe PDF Embed API**: High-fidelity PDF rendering

### Backend Integration
- **REST API**: Connects to your existing FastAPI backend
- **File Handling**: Supports bulk PDF upload and processing
- **Real-time Updates**: Progress tracking for long-running operations

### Performance Optimizations
- **Lazy Loading**: Components load as needed
- **Batch Processing**: Multiple documents processed efficiently
- **Response Caching**: Minimize redundant API calls
- **Error Handling**: Graceful degradation and retry logic

## 📱 Browser Support

- **Primary**: Chrome (fully tested and optimized)
- **Secondary**: Firefox, Safari, Edge (basic compatibility)

## 🔒 Privacy & Security

- **Local Processing**: Recommendations work offline (base functionality)
- **Secure Upload**: Files processed securely through your backend
- **No Data Persistence**: Files not stored permanently in browser

## 🚫 Offline Capabilities

Base functionality works without internet:
- PDF viewing and navigation
- Local document structure analysis
- Basic recommendations (when documents are pre-processed)

Note: Advanced features (Insights, Podcast) require internet connectivity.

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on port 8000
   - Check REACT_APP_API_URL in .env file
   - Verify CORS settings in backend

2. **PDF Not Displaying**
   - Check Adobe Client ID configuration
   - Ensure PDF file is not corrupted
   - Verify file size limits

3. **Recommendations Not Loading**
   - Check backend logs for processing errors
   - Ensure document upload completed successfully
   - Verify persona and task are set

4. **Insights/Podcast Not Working**
   - Check internet connectivity
   - Verify Gemini API configuration in backend
   - Check backend logs for API errors

### Development Tips

```bash
# Check backend status
curl http://localhost:8000/

# View detailed logs
npm start --verbose

# Debug API calls
# Open browser dev tools > Network tab
```

## 📊 Performance Benchmarks

- **PDF Rendering**: 100% fidelity maintained
- **Navigation**: <2 seconds response time
- **Processing**: <10 seconds for CPU-based recommendations
- **Bulk Upload**: Processes 3 documents concurrently

## 🔄 API Endpoints Used

### Part 1A - PDF Structure
- `POST /part1a/extract` - Extract PDF structure and headings

### Part 1B - Document Analysis  
- `POST /part1b/analyze` - Get AI recommendations

### Insights Generation
- `POST /insights/generate` - Generate AI insights
- `POST /insights/podcast` - Create podcast audio

### History Management
- `GET /history/list` - Get document history

## 🚀 Deployment

### Development
```bash
npm run build
npm run start
```

### Production
1. Update environment variables for production
2. Build optimized bundle: `npm run build`
3. Serve static files through web server
4. Ensure backend is deployed and accessible

## 👥 Team & Credits

Built for Adobe India Hackathon 2025 - "Connecting the Dots Challenge"

## 📄 License

This project is created for the Adobe India Hackathon 2025.

---

## 🔗 Quick Links

- [Adobe PDF Embed API Documentation](https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/)
- [Backend API Documentation](http://localhost:8000/docs) (when running)
- [Project Repository](#) (Add your GitHub link here)

For support or questions, refer to the hackathon documentation or contact the development team.
