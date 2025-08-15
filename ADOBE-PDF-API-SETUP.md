# 🔑 Adobe PDF Embed API Setup Guide

## Step-by-Step Instructions to Get Your Adobe Client ID

### 1. Go to Adobe Developer Console
Visit: **https://www.adobe.com/go/dcsdks_credentials**

### 2. Sign In
- Use your Adobe account (create one if you don't have it)
- It's free for development use

### 3. Create a New Project
- Click **"Create new project"**
- Or select an existing project if you have one

### 4. Add PDF Embed API Service
- Click **"Add API"** 
- Select **"PDF Embed API"** from the list
- Click **"Next"**

### 5. Configure Your Project
- **Project Name**: "Adobe Hackathon 2025" (or any name)
- **Description**: "Interactive PDF Reading Application"
- **Platform**: Web
- **Domain**: For development, you can use:
  - `localhost`
  - `localhost:3000` 
  - `*.vercel.app` (if deploying)
  - Or your actual domain

### 6. Get Your Client ID
- After setup, you'll see your **Client ID**
- Copy this ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 7. Update Your Project
Replace `YOUR_ADOBE_CLIENT_ID_HERE` in these files:

#### File 1: `/adobe_frontend/.env`
```bash
REACT_APP_ADOBE_CLIENT_ID=your_actual_client_id_here
```

#### File 2: `/adobe_frontend/src/config/adobe.js`
```javascript
CLIENT_ID: process.env.REACT_APP_ADOBE_CLIENT_ID || "your_actual_client_id_here",
```

## 🚀 Quick Setup Commands

### Option 1: Using Your Client ID
```bash
# Navigate to frontend directory
cd adobe_frontend

# Update .env file with your Client ID
echo "REACT_APP_ADOBE_CLIENT_ID=your_actual_client_id_here" > .env
echo "REACT_APP_API_URL=http://localhost:8080" >> .env

# Restart the frontend
npm start
```

### Option 2: Temporary Development Setup
If you want to test immediately without getting the API key:

```bash
# Use a development placeholder (limited functionality)
echo "REACT_APP_ADOBE_CLIENT_ID=development_mode" > adobe_frontend/.env
echo "REACT_APP_API_URL=http://localhost:8080" >> adobe_frontend/.env
```

## 🔧 Troubleshooting

### Issue: PDF Not Loading
**Symptoms**: Blank viewer, loading forever, or error messages

**Solutions**:
1. **Check Client ID**: Ensure it's correctly set in `.env`
2. **Check Domain**: Make sure `localhost:3000` is allowed in Adobe Console
3. **Browser Console**: Check for error messages
4. **Network Tab**: Look for failed API calls

### Issue: Client ID Invalid
**Error**: "Invalid Client ID" or authentication errors

**Solutions**:
1. **Verify Client ID**: Copy it exactly from Adobe Console
2. **Check Domains**: Ensure your domain is whitelisted
3. **Regenerate**: Create a new Client ID if needed

### Issue: Features Not Working
**Problem**: PDF loads but features like search/navigation don't work

**Solutions**:
1. **Check API Permissions**: Ensure all features are enabled
2. **Update Configuration**: Check `adobe.js` configuration
3. **Browser Compatibility**: Use Chrome for best results

## 📝 Environment File Template

Create `/adobe_frontend/.env`:
```bash
# Adobe PDF Embed API
REACT_APP_ADOBE_CLIENT_ID=your_client_id_here

# Backend Configuration  
REACT_APP_API_URL=http://localhost:8080

# Development Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

## 🔗 Important Links

- **Adobe Developer Console**: https://www.adobe.com/go/dcsdks_credentials
- **PDF Embed API Docs**: https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/
- **API Reference**: https://developer.adobe.com/document-services/docs/apis/#tag/PDF-Embed-API

## ⚡ Quick Test

After setting up, test with:
```javascript
// Open browser console and run:
console.log('Adobe Client ID:', process.env.REACT_APP_ADOBE_CLIENT_ID);
```

## 🎯 For Contest Submission

For the Adobe Hackathon, you'll need to:
1. Get a real Client ID (not development placeholder)
2. Submit it via the contest form
3. Ensure it works with `localhost:8080` for evaluation

## 💡 Pro Tips

1. **Free Usage**: Adobe PDF Embed API is free for development
2. **No Credit Card**: No payment info required for basic usage
3. **Immediate Access**: Client ID works instantly after creation
4. **Multiple Domains**: You can add multiple domains to one project
5. **Contest Ready**: This API is specifically designed for hackathons

---

## 🔴 Common Errors & Fixes

### Error: "Adobe DC View SDK failed to load"
```bash
# Fix: Check internet connection and Client ID
curl -s "https://documentservices.adobe.com/view-sdk/viewer.js" | head -5
```

### Error: "Invalid domain"
**Solution**: Add your domain to Adobe Console project settings

### Error: "Client ID not found" 
**Solution**: Double-check the Client ID is correctly copied

---

**Your Adobe PDF viewer should work perfectly once the Client ID is set up!** 🎉
