// Adobe Embed API Configuration
export const ADOBE_CONFIG = {
  // Get your Adobe Client ID from: https://www.adobe.com/go/dcsdks_credentials
  CLIENT_ID: process.env.REACT_APP_ADOBE_CLIENT_ID || "YOUR_ACTUAL_CLIENT_ID_HERE",
  
  // Domain for development
  DOMAIN: "localhost:3000",
  
  // Viewer configuration options
  VIEWER_CONFIG: {
    embedMode: "SIZED_CONTAINER",
    defaultViewMode: "FIT_WIDTH",
    showDownloadPDF: false,
    showPrintPDF: false,
    showLeftHandPanel: true,
    showAnnotationTools: false,
    enableFormFilling: false,
    showBookmarks: true,
    showThumbnails: true,
    showSearch: true,
    showZoomControls: true,
    showPageControls: true,
    showFullScreen: true,
    showSecondaryToolbar: false,
    showToolbarControl: true
  }
};

// Instructions for getting Adobe Client ID:
// 1. Go to https://www.adobe.com/go/dcsdks_credentials
// 2. Sign in with your Adobe account
// 3. Create a new project or select existing one
// 4. Add "PDF Embed API" service
// 5. Copy the Client ID and replace "YOUR_ADOBE_CLIENT_ID" above
// 6. For development, you can use "YOUR_ADOBE_CLIENT_ID" as placeholder
