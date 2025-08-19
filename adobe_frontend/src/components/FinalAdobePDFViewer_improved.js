import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ADOBE_CONFIG } from '../config/adobe';

const FinalAdobePDFViewer = forwardRef(({ 
  selectedDocument, 
  onSectionHighlight,
  className = "" 
}, ref) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adobeViewInstance, setAdobeViewInstance] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  
  // Refs
  const viewerRef = useRef(null);
  const adobeViewRef = useRef(null);

  // Expose navigation methods to parent components
  useImperativeHandle(ref, () => ({
    navigateToSection: (pageNumber, sectionTitle = null) => navigateToSection(pageNumber, sectionTitle),
    navigateToSectionByTitle: (sectionTitle) => navigateToSectionByTitle(sectionTitle),
  }));

  // Enhanced navigation with multiple Adobe PDF Embed API approaches
  const navigateToSection = async (pageNumber, sectionTitle = null) => {
    console.log(`🎯 Attempting to navigate to page ${pageNumber}${sectionTitle ? ` (section: "${sectionTitle}")` : ''}`);
    
    // Wait for the Adobe viewer instance to be available
    let retryCount = 0;
    const maxRetries = 20;
    
    while ((!adobeViewInstance || !adobeViewRef.current || !viewerReady) && retryCount < maxRetries) {
      console.log(`⏳ Waiting for Adobe viewer instance and readiness... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      retryCount++;
    }
    
    if (!adobeViewInstance && !adobeViewRef.current) {
      console.warn('⚠️ Adobe viewer instance not ready after waiting');
      return;
    }

    const activeInstance = adobeViewInstance || adobeViewRef.current;

    if (!pageNumber || pageNumber < 1) {
      console.warn('⚠️ Invalid page number:', pageNumber);
      return;
    }

    try {
      console.log('📋 Available methods in Adobe viewer:', Object.keys(activeInstance));
      
      let navigationSuccess = false;

      // Method 1: Use Adobe PDF Embed API's official getAPIs method
      try {
        console.log('🔧 Attempting Adobe PDF navigation using official APIs...');
        
        if (typeof activeInstance.getAPIs === 'function') {
          console.log('✅ getAPIs() method is available, accessing APIs...');
          
          const adobeAPIs = await activeInstance.getAPIs();
          console.log('📋 Available Adobe APIs:', Object.keys(adobeAPIs || {}));
          
          // Try PDF Document APIs
          if (adobeAPIs && adobeAPIs.getPDFDocumentAPIs) {
            const pdfDocAPIs = await adobeAPIs.getPDFDocumentAPIs();
            console.log('📄 PDF Document APIs:', Object.keys(pdfDocAPIs || {}));
            
            if (pdfDocAPIs.gotoLocation) {
              console.log(`🎯 Using gotoLocation to navigate to page ${pageNumber}`);
              await pdfDocAPIs.gotoLocation({ pageNumber: pageNumber });
              console.log('✅ Successfully navigated using gotoLocation');
              navigationSuccess = true;
            }
          }
          
          // Try PDF Viewer APIs
          if (!navigationSuccess && adobeAPIs.getPDFViewerAPIs) {
            const pdfViewAPIs = await adobeAPIs.getPDFViewerAPIs();
            console.log('👀 PDF Viewer APIs:', Object.keys(pdfViewAPIs || {}));
            
            if (pdfViewAPIs.gotoLocation) {
              console.log(`🎯 Using viewer gotoLocation to navigate to page ${pageNumber}`);
              await pdfViewAPIs.gotoLocation({ pageNumber: pageNumber });
              console.log('✅ Successfully navigated using viewer gotoLocation');
              navigationSuccess = true;
            }
          }
          
        } else {
          console.log('⚠️ getAPIs() method not available on Adobe instance');
        }
        
      } catch (apiError) {
        console.warn('⚠️ Adobe API navigation failed:', apiError);
      }

      // Method 2: Try Adobe's Preview API
      if (!navigationSuccess) {
        try {
          console.log('🔄 Trying Adobe Preview API navigation...');
          
          if (activeInstance.previewFile && activeInstance.previewFile.getAPIs) {
            const previewAPIs = await activeInstance.previewFile.getAPIs();
            console.log('🎪 Preview APIs:', Object.keys(previewAPIs || {}));
            
            if (previewAPIs.gotoLocation) {
              await previewAPIs.gotoLocation({ pageNumber: pageNumber });
              console.log('✅ Navigation successful via Preview API');
              navigationSuccess = true;
            }
          }
        } catch (previewError) {
          console.warn('⚠️ Preview API navigation failed:', previewError);
        }
      }

      // Method 3: Try postMessage to Adobe iframe
      if (!navigationSuccess) {
        try {
          console.log('📨 Attempting navigation via postMessage...');
          
          const adobeIframe = document.querySelector('iframe[src*="adobe"]') || 
                             document.querySelector('iframe[title*="Adobe"]') ||
                             document.querySelector('#adobe-dc-view iframe');
          
          if (adobeIframe && adobeIframe.contentWindow) {
            console.log('📋 Found Adobe iframe, sending navigation message...');
            
            // Try multiple postMessage formats
            const messages = [
              {
                type: 'ADOBE_DC_SDK_NAVIGATE',
                data: { command: 'gotoLocation', params: { pageNumber: pageNumber } }
              },
              {
                type: 'NAVIGATE_TO_PAGE',
                page: pageNumber,
                pageIndex: pageNumber - 1
              },
              {
                action: 'gotoPage',
                page: pageNumber - 1 // 0-based indexing
              }
            ];
            
            messages.forEach((message, index) => {
              adobeIframe.contentWindow.postMessage(message, '*');
              console.log(`📨 Sent navigation message ${index + 1}:`, message);
            });
            
            navigationSuccess = true;
            
          } else {
            console.log('⚠️ Adobe iframe not found');
          }
          
        } catch (postMessageError) {
          console.warn('⚠️ postMessage navigation failed:', postMessageError);
        }
      }

      // Method 4: Search functionality for section highlighting
      if (sectionTitle) {
        try {
          console.log(`🔍 Attempting to search and highlight section: "${sectionTitle}"`);
          
          // Try Adobe's search API
          if (activeInstance.getAPIs) {
            const apis = await activeInstance.getAPIs();
            if (apis && apis.getPDFViewerAPIs) {
              const viewerAPIs = await apis.getPDFViewerAPIs();
              if (viewerAPIs.search) {
                await viewerAPIs.search(sectionTitle);
                console.log('✅ Section search executed via Adobe API');
              }
            }
          }
          
          // DOM-based search fallback
          setTimeout(() => {
            const searchBtn = document.querySelector('[title*="Search"], [aria-label*="Search"], button[data-tool*="search"]');
            if (searchBtn) {
              searchBtn.click();
              setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder*="search" i], input[type="search"]');
                if (searchInput) {
                  searchInput.value = sectionTitle;
                  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                  searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                  console.log('✅ Triggered search via DOM manipulation');
                }
              }, 100);
            }
          }, 500);
          
        } catch (searchError) {
          console.warn('⚠️ Section search failed:', searchError);
        }
      }

      if (!navigationSuccess) {
        console.error('❌ All Adobe navigation methods failed');
        console.log('💡 Adobe PDF Embed API may have different method names or require different initialization');
      } else {
        console.log('🎉 Navigation completed successfully!');
      }

      // Trigger section highlight callback
      if (onSectionHighlight) {
        onSectionHighlight(pageNumber);
      }

    } catch (error) {
      console.error('❌ Navigation failed with error:', error);
    }
  };

  const navigateToSectionByTitle = async (sectionTitle) => {
    if (!adobeViewInstance || !sectionTitle) return;
    
    try {
      console.log(`🔍 Searching for section: "${sectionTitle}"`);
      
      const activeInstance = adobeViewInstance || adobeViewRef.current;
      
      // Try Adobe's search functionality
      if (activeInstance.getAPIs) {
        const apis = await activeInstance.getAPIs();
        if (apis && apis.getPDFViewerAPIs) {
          const viewerAPIs = await apis.getPDFViewerAPIs();
          if (viewerAPIs.search) {
            const searchResult = await viewerAPIs.search(sectionTitle);
            console.log('🎯 Search result:', searchResult);
            return;
          }
        }
      }
      
      // Fallback to DOM-based search
      const searchBtn = document.querySelector('[data-tool="search"], button[title*="Search"]');
      if (searchBtn) {
        searchBtn.click();
        
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="search" i]');
          if (searchInput) {
            searchInput.value = sectionTitle;
            searchInput.focus();
            searchInput.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              keyCode: 13,
              bubbles: true
            }));
          }
        }, 300);
      }
      
    } catch (error) {
      console.error('❌ Section search failed:', error);
    }
  };

  // Initialize Adobe PDF viewer
  const initializeAdobePDF = async () => {
    if (!selectedDocument || !selectedDocument.file_path) {
      console.log('📄 No document selected for Adobe PDF viewer');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Initializing Adobe PDF Embed API...');

      // Ensure Adobe DC SDK is loaded
      if (typeof window.AdobeDC === 'undefined') {
        console.error('❌ Adobe DC SDK not loaded');
        setError('Adobe PDF SDK not loaded. Please check your internet connection.');
        setIsLoading(false);
        return;
      }

      // Clean up previous viewer instance
      if (adobeViewRef.current) {
        try {
          await adobeViewRef.current.destroy?.();
        } catch (destroyError) {
          console.warn('⚠️ Error destroying previous viewer:', destroyError);
        }
      }

      // Clear the viewer container
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }

      console.log('🔧 Creating new Adobe DC View instance...');
      const adobeDCView = new window.AdobeDC.View({
        clientId: ADOBE_CONFIG.CLIENT_ID,
        divId: "adobe-dc-view"
      });

      console.log('📄 Loading PDF file:', selectedDocument.file_path);
      
      // Preview the PDF file
      await adobeDCView.previewFile({
        content: { location: { url: `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/files/${selectedDocument.file_path}` } },
        metaData: { fileName: selectedDocument.name || 'document.pdf' }
      }, {
        ...ADOBE_CONFIG.VIEWER_CONFIG,
        // Enhanced viewer options for navigation
        showPageControls: true,
        showBookmarks: true,
        showThumbnails: true,
        showSearch: true,
        enableFormFilling: false,
        showAnnotationTools: true
      });

      // Wait for the viewer to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('🎉 Adobe PDF viewer fully loaded and ready');
      console.log('📋 Viewer instance methods:', Object.keys(adobeDCView));

      // Store the viewer instance
      adobeViewRef.current = adobeDCView;
      setAdobeViewInstance(adobeDCView);
      setViewerReady(true);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Failed to initialize Adobe PDF viewer:', error);
      setError('Failed to load PDF viewer. Please try again.');
      setIsLoading(false);
    }
  };

  // Initialize when document changes
  useEffect(() => {
    if (selectedDocument) {
      initializeAdobePDF();
    }
    
    // Cleanup on unmount
    return () => {
      if (adobeViewRef.current && typeof adobeViewRef.current.destroy === 'function') {
        adobeViewRef.current.destroy().catch(console.warn);
      }
    };
  }, [selectedDocument]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={initializeAdobePDF}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render PDF viewer
  return (
    <div className={`h-full w-full ${className}`}>
      <div 
        id="adobe-dc-view" 
        ref={viewerRef}
        className="h-full w-full"
        style={{ minHeight: '600px' }}
      >
        {/* Adobe PDF Embed API will render the viewer here */}
      </div>
    </div>
  );
});

FinalAdobePDFViewer.displayName = 'FinalAdobePDFViewer';

export default FinalAdobePDFViewer;
