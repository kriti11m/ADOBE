import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ADOBE_CONFIG } from '../config/adobe';

const FinalAdobePDFViewer = forwardRef(({ 
  selectedDocument, 
  onSectionHighlight,
  className = ""
}, ref) => {
  // State management
  const [isLoading, setIsLoading] = useState(false); // Start as false, only load when document selected
  const [error, setError] = useState(null);
  const [adobeAPIs, setAdobeAPIs] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  
  // Refs
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  // Expose navigation methods to parent components
  useImperativeHandle(ref, () => ({
    navigateToSection: (pageNumber, sectionTitle = null) => navigateToSection(pageNumber, sectionTitle),
    navigateToSectionByTitle: (sectionTitle) => navigateToSectionByTitle(sectionTitle),
  }));

  // Enhanced navigation using proper Adobe PDF Embed API structure
  const navigateToSection = async (pageNumber, sectionTitle = null) => {
    console.log(`🎯 Attempting to navigate to page ${pageNumber}${sectionTitle ? ` (section: "${sectionTitle}")` : ''}`);

    if (!adobeAPIs) {
      console.warn('ℹ️ Adobe APIs not ready yet');
      return;
    }

    // Parse page number properly
    let targetPage = pageNumber;
    if (typeof pageNumber === 'string' && pageNumber.includes('Page ')) {
      targetPage = parseInt(pageNumber.replace('Page ', ''));
    } else if (typeof pageNumber === 'string') {
      targetPage = parseInt(pageNumber);
    }

    if (isNaN(targetPage) || targetPage < 1) {
      console.warn('⚠️ Invalid page number:', pageNumber);
      return;
    }

    try {
      console.log(`🎯 Navigating to page ${targetPage} for section: "${sectionTitle}"`);
      await adobeAPIs.gotoLocation({ pageNumber: targetPage });
      console.log(`✅ Successfully navigated to page ${targetPage}`);

      if (onSectionHighlight) onSectionHighlight(targetPage);
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  const navigateToSectionByTitle = async (sectionTitle) => {
    if (!adobeAPIs || !sectionTitle) {
      console.error('❌ Adobe APIs not ready or no section title provided');
      return;
    }
    
    try {
      console.log(`🔍 Searching for section: "${sectionTitle}"`);
      
      // Use Adobe PDF APIs for search
      if (adobeAPIs.search) {
        console.log(`🔍 Using Adobe API search for: "${sectionTitle}"`);
        const searchResult = await adobeAPIs.search(sectionTitle);
        console.log('🎯 Search result:', searchResult);
        return;
      }
      
      console.log('⚠️ Adobe API search not available, using fallback DOM search');
      
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
    if (!selectedDocument) {
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
      if (viewerInstanceRef.current) {
        try {
          await viewerInstanceRef.current.destroy?.();
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

      // Build content descriptor: support either backend URL (file_path) or local File object
      let contentDescriptor = null;
      let metaFileName = selectedDocument.name || selectedDocument.file?.name || 'document.pdf';
      if (selectedDocument.file && selectedDocument.file.arrayBuffer) {
        const arrayBuffer = await selectedDocument.file.arrayBuffer();
        contentDescriptor = { content: { promise: Promise.resolve(arrayBuffer) }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.file_path) {
        console.log('📄 Loading PDF file by URL:', selectedDocument.file_path);
        contentDescriptor = { content: { location: { url: `http://localhost:8000/files/${selectedDocument.file_path}` } }, metaData: { fileName: metaFileName } };
      } else {
        throw new Error('Selected document has neither file nor file_path');
      }

      // Preview the PDF file and get viewer instance
      const viewer = await adobeDCView.previewFile(
        contentDescriptor,
        {
        ...ADOBE_CONFIG.VIEWER_CONFIG,
        // Enhanced viewer options for navigation
        showPageControls: true,
        showBookmarks: true,
        showThumbnails: true,
        showSearch: true,
        enableFormFilling: false,
        showAnnotationTools: true
      }
      );

      console.log('🔗 Getting PDF APIs from viewer...');
      
      // Get the APIs from the viewer instance
      const apis = await viewer.getAPIs();
      
      console.log('✅ Adobe PDF viewer fully loaded and ready');
      console.log('🎯 Available navigation methods:', Object.keys(apis));

      // Store the APIs for navigation
      viewerInstanceRef.current = viewer;
      setAdobeAPIs(apis);
      setViewerReady(true);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Failed to initialize Adobe PDF viewer:', error);
      setError('Failed to load PDF viewer. Please try again.');
      setIsLoading(false);
    }
  };

  // (Removed document auto-loading helpers to revert to original simple approach)

  // Initialize when document changes
  useEffect(() => {
    if (selectedDocument) {
      initializeAdobePDF();
    }
    return () => {
      if (viewerInstanceRef.current && typeof viewerInstanceRef.current.destroy === 'function') {
        viewerInstanceRef.current.destroy().catch(console.warn);
      }
    };
  }, [selectedDocument]);

  // Show placeholder when no document is selected
  if (!selectedDocument) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-gray-400 dark:text-gray-500">📄</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Document Selected</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Select a PDF from your documents or collections to view it here
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            • Choose from individual documents<br/>
            • Or select from a collection<br/>
            • Use Smart Connections to analyze content
          </div>
        </div>
      </div>
    );
  }

  // Always render the container to ensure the divId exists when document is selected
  return (
    <div className={`relative h-full w-full ${className}`}>
      <div 
        id="adobe-dc-view" 
        ref={viewerRef}
        className="h-full w-full"
        style={{ minHeight: '600px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-800/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading PDF viewer...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 dark:bg-red-900/80">
          <div className="text-center">
            <div className="text-red-500 dark:text-red-400 text-2xl mb-4">⚠️</div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button 
              onClick={initializeAdobePDF}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

FinalAdobePDFViewer.displayName = 'FinalAdobePDFViewer';

export default FinalAdobePDFViewer;
