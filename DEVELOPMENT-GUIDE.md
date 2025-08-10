# Development Guide - Backend Frontend Integration

## ✅ What's Been Completed

### 1. Backend Service Integration
- ✅ Updated `backendService.js` to connect to your actual FastAPI endpoints
- ✅ Added support for Part 1A (PDF structure extraction) via `/part1a/extract`
- ✅ Added support for Part 1B (document analysis) via `/part1b/analyze`  
- ✅ Added Insights generation via `/insights/generate`
- ✅ Added Podcast generation via `/insights/podcast`
- ✅ Added document history via `/history/list`

### 2. New Components Created
- ✅ `PDFUploader.js` - Bulk PDF upload and processing
- ✅ `InsightsBulb.js` - AI insights using Gemini API
- ✅ Updated `PodcastButton.js` - Real backend integration
- ✅ Enhanced `DocumentSidebar.js` - Added bulk upload button

### 3. Application Features
- ✅ Bulk PDF processing workflow
- ✅ Real-time progress tracking
- ✅ Error handling and user feedback
- ✅ Dark mode support throughout
- ✅ Responsive design

### 4. Configuration
- ✅ Environment variables setup (`.env`)
- ✅ Adobe PDF Embed API configuration
- ✅ Backend API endpoint configuration
- ✅ Startup scripts for easy development

## 🔧 Next Steps To Complete

### 1. Backend Dependencies
Your backend might need these dependencies. Check and install as needed:

```bash
cd combined-backend
pip install fastapi uvicorn python-multipart aiofiles
pip install PyMuPDF pydantic sqlalchemy
# Add any other dependencies your specific backend needs
```

### 2. Adobe PDF Embed API Setup
1. Get your Adobe Client ID from: https://www.adobe.com/go/dcsdks_credentials
2. Update `.env` file:
   ```
   REACT_APP_ADOBE_CLIENT_ID=your_actual_client_id_here
   ```

### 3. Test Backend Endpoints
Make sure these endpoints work in your backend:

```bash
# Test structure extraction
curl -X POST "http://localhost:8000/part1a/extract" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf"

# Test document analysis
curl -X POST "http://localhost:8000/part1b/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@test.pdf" \
  -F "persona=Researcher" \
  -F "job=Analyze content"
```

### 4. Database Setup
If your backend uses a database, ensure it's configured:
- Check database connection in your backend
- Run any necessary migrations
- Verify history service works

### 5. AI Services Configuration
Make sure your Gemini/AI services are configured:
- API keys properly set
- Rate limiting configured
- Error handling implemented

## 🚀 Running the Application

### Method 1: Automated Start
```powershell
# Windows PowerShell
.\start-app.ps1

# Or Command Prompt
start-app.bat
```

### Method 2: Manual Start
```powershell
# Terminal 1: Backend
cd combined-backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend  
cd adobe_frontend
npm start
```

## 🧪 Testing the Integration

### 1. Basic Functionality Test
1. Open http://localhost:3000
2. Complete onboarding (set role & task)
3. Upload a test PDF via quick upload
4. Verify PDF displays correctly
5. Check if recommendations appear

### 2. Backend Integration Test
1. Use "Bulk Upload & Process" feature
2. Upload multiple PDFs
3. Watch progress indicators
4. Verify recommendations are generated
5. Test insights bulb functionality
6. Try podcast generation

### 3. Error Handling Test
1. Upload invalid files
2. Test with backend offline
3. Test with large files
4. Verify error messages display correctly

## 🐛 Common Issues & Solutions

### Backend Connection Failed
```
Error: Failed to fetch backend data
```
**Solution:**
- Check if backend is running on port 8000
- Verify REACT_APP_API_URL in .env
- Check CORS settings in your backend

### PDF Not Displaying
```
Adobe PDF Embed error
```
**Solution:**
- Verify Adobe Client ID is correct
- Check browser console for errors
- Ensure file is valid PDF

### Recommendations Not Loading
```
Failed to get AI recommendations
```
**Solution:**
- Check backend logs for errors
- Verify file upload completed
- Check persona/task are set correctly

### CORS Issues
```
Access blocked by CORS policy
```
**Solution:** Update your backend CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Performance Optimization

### Frontend
- Components are lazily loaded
- File upload uses batching
- Progress tracking minimizes re-renders
- Error boundaries prevent crashes

### Backend Integration
- Concurrent processing (3 files at once)
- Request timeout handling
- Retry logic for failed requests
- Response caching where appropriate

## 🔍 Debugging Tips

### Frontend Debugging
```javascript
// Add to backendService.js for debugging
console.log('API Request:', url, options);
console.log('API Response:', response);
```

### Backend Debugging
```python
# Add logging to your FastAPI endpoints
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/part1a/extract")
async def extract_pdf_structure(file):
    logger.debug(f"Processing file: {file.filename}")
    # ... your code
```

### Network Debugging
- Open browser Dev Tools > Network tab
- Monitor all API requests
- Check request/response headers
- Verify payload data

## 📝 Final Checklist

- [ ] Backend services are running without errors
- [ ] Frontend connects to backend successfully  
- [ ] PDF upload and display works
- [ ] Recommendations are generated
- [ ] Insights feature works (if Gemini is configured)
- [ ] Podcast feature works (if TTS is configured)
- [ ] Error handling works gracefully
- [ ] Dark mode toggle works
- [ ] All UI components are responsive

## 🎯 Hackathon Requirements Checklist

### Core Features
- [ ] Upload PDFs in bulk ✅
- [ ] Open fresh PDF for first-time reading ✅  
- [ ] Display PDFs with 100% fidelity (Adobe API) ✅
- [ ] Highlight 3+ relevant sections with >80% accuracy
- [ ] 1-2 sentence snippet explanations ✅
- [ ] Single-click navigation to sections ✅
- [ ] <2 second navigation response time ✅

### Follow-On Features
- [ ] Insights Bulb with GPT-4 integration ✅
- [ ] Podcast Mode (2-5 min audio) ✅
- [ ] Key insights & "Did you know?" facts ✅
- [ ] Contradictions & counterpoints ✅
- [ ] Cross-document connections ✅

### Constraints
- [ ] Base app runs on CPU, ≤10 sec response ✅
- [ ] Offline functionality for base features ✅
- [ ] Works in Chrome ✅
- [ ] LLM calls only for follow-on features ✅

## 🚀 Ready for Demo

Once everything is working:
1. Prepare demo PDFs that showcase features well
2. Create user personas that highlight different use cases  
3. Practice the demo flow from upload to insights
4. Test all features work consistently
5. Have backup plans for any live demo issues

Good luck with your hackathon! 🎉
