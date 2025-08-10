# Adobe PDF Embed API Integration Guide

## 🚀 Getting Started with Adobe PDF Embed API

Your frontend is now integrated with Adobe PDF Embed API for beautiful PDF viewing and intelligent document analysis.

## 📋 Setup Instructions

### 1. Get Your Adobe Client ID

1. **Visit Adobe Developer Console**: Go to [https://developer.adobe.com/console/](https://developer.adobe.com/console/)

2. **Sign In**: Use your Adobe ID (create one if you don't have it)

3. **Create New Project**:
   - Click "Create new project"
   - Choose "Add API"
   - Select "PDF Embed API"
   - Choose "Web" platform

4. **Configure Domain**:
   - Add `localhost:3000` to allowed domains for development
   - Add your production domain when ready to deploy

5. **Get Client ID**: Copy the generated Client ID

6. **Update Environment File**:
   ```bash
   # Edit .env file
   REACT_APP_ADOBE_CLIENT_ID=your_actual_client_id_here
   ```

### 2. Features Enabled

✅ **Beautiful PDF Display**: Adobe's professional PDF viewer
✅ **Document Structure Extraction**: Automatic outline and sections via 1A backend
✅ **Smart Recommendations**: Context-aware suggestions via 1B backend  
✅ **Page Navigation**: Click sections to jump to specific pages
✅ **Search Integration**: Get recommendations based on search queries
✅ **Dark Mode Support**: Seamless theme switching
✅ **Event Tracking**: Page views and user interactions

### 3. How It Works

1. **File Upload**: Users upload PDFs via bulk uploader
2. **Adobe Rendering**: PDFs display using Adobe Embed API
3. **Structure Extraction**: 1A backend extracts document outline
4. **Smart Analysis**: 1B backend provides contextual recommendations
5. **Interactive Features**: Search, navigation, and cross-document connections

### 4. Testing Your Integration

1. **Start Backend**: `cd combined-backend && python -m uvicorn main:app --reload`
2. **Start Frontend**: `cd adobe_frontend && npm start`
3. **Upload PDF**: Use the bulk upload button
4. **Verify Features**:
   - PDF displays in Adobe viewer
   - Document outline appears in sidebar
   - Recommendations update based on current section

## 🔧 Development Notes

- The Adobe SDK loads from CDN (see `public/index.html`)
- Client ID is configured in `src/config/adobe.js`
- PDF viewer component is `src/components/AdobePDFViewer.js`
- Integration connects to your existing 1A/1B backends

## 🌐 Production Deployment

When deploying:
1. Update `.env` with production Adobe Client ID
2. Add your production domain to Adobe Console
3. Ensure HTTPS for production (Adobe requirement)

## 🔍 Troubleshooting

**PDF not loading?**
- Check if Adobe Client ID is correctly set
- Verify domain is added to Adobe Console
- Check browser console for errors

**No recommendations?**
- Ensure backend is running on port 8000
- Check that 1A and 1B APIs are responding
- Verify file upload is working

## 📚 Next Steps

- Test with multiple PDF documents
- Customize Adobe viewer appearance
- Add more contextual recommendation triggers
- Implement insights and podcast features
