import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ADOBE_CONFIG } from '../config/adobe';
import collectionService from '../services/collectionService';
import backendService from '../services/backendService';

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

  // Handle text selection for finale functionality
  const handleTextSelection = async (selectedTextData) => {
    try {
      console.log('🎯 Processing text selection for finale features...');
      
      if (!selectedTextData || !selectedTextData.text) {
        console.warn('⚠️ No text selected');
        return;
      }

      const selectedText = selectedTextData.text.trim();
      if (selectedText.length < 10) {
        console.warn('⚠️ Selected text too short for analysis');
        return;
      }

      console.log('📝 Selected text:', selectedText);

      // Call the finale text selection service
      const relatedSections = await backendService.findRelatedSections({
        selectedText: selectedText,
        documentId: selectedDocument.id,
        documentName: selectedDocument.name
      });

      console.log('🔍 Found related sections:', relatedSections);

      // Notify parent component about text selection
      if (onSectionHighlight) {
        onSectionHighlight({
          selectedText: selectedText,
          relatedSections: relatedSections,
          sourceDocument: selectedDocument
        });
      }

      // Show a temporary notification to user
      showTextSelectionNotification(relatedSections.length);

    } catch (error) {
      console.error('❌ Error processing text selection:', error);
    }
  };

  // Show floating action button for text selection
  const showTextSelectionActions = (selectedText) => {
    // Remove existing button if present
    hideTextSelectionActions();
    
    const actionButton = document.createElement('div');
    actionButton.id = 'finale-text-selection-action';
    actionButton.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 10000;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      border: none;
      max-width: 280px;
    `;
    
    actionButton.innerHTML = `
      <span style="font-size: 18px;">🔍</span>
      <span>Find Related Sections</span>
    `;
    
    actionButton.onclick = async () => {
      console.log('🎯 Finale text selection action clicked');
      actionButton.style.opacity = '0.7';
      actionButton.innerHTML = '<span>⏳</span><span>Searching...</span>';
      
      try {
        // This will trigger the related sections search
        await handleTextSelection({ text: selectedText });
        
        actionButton.innerHTML = '<span>✅</span><span>Found sections!</span>';
        setTimeout(() => {
          hideTextSelectionActions();
        }, 2000);
        
      } catch (error) {
        actionButton.innerHTML = '<span>❌</span><span>Error occurred</span>';
        setTimeout(() => {
          hideTextSelectionActions();
        }, 3000);
      }
    };
    
    // Add hover effects
    actionButton.onmouseenter = () => {
      actionButton.style.transform = 'translateY(-2px)';
      actionButton.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
    };
    
    actionButton.onmouseleave = () => {
      actionButton.style.transform = 'translateY(0)';
      actionButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    };
    
    document.body.appendChild(actionButton);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      hideTextSelectionActions();
    }, 10000);
  };

  // Hide text selection action button
  const hideTextSelectionActions = () => {
    const existingButton = document.getElementById('finale-text-selection-action');
    if (existingButton) {
      existingButton.remove();
    }
  };

  // Show notification for text selection
  const showTextSelectionNotification = (relatedCount) => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4F46E5;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    notification.innerHTML = `🔍 Found ${relatedCount} related sections`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
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

      // Build content descriptor: support either backend URL (file_path), local File object, or database document
      let contentDescriptor = null;
      let metaFileName = selectedDocument.name || selectedDocument.file?.name || 'document.pdf';
      if (selectedDocument.file && selectedDocument.file.arrayBuffer) {
        const arrayBuffer = await selectedDocument.file.arrayBuffer();
        contentDescriptor = { content: { promise: Promise.resolve(arrayBuffer) }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.file_path) {
        console.log('📄 Loading PDF file by URL:', selectedDocument.file_path);
        contentDescriptor = { content: { location: { url: `http://localhost:8000/files/${selectedDocument.file_path}` } }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.dbDocumentId) {
        console.log(`📥 Fetching database document ${selectedDocument.dbDocumentId} as blob...`);
        const blobUrl = await collectionService.getDocumentBlobUrl(selectedDocument.dbDocumentId);
        contentDescriptor = { content: { location: { url: blobUrl } }, metaData: { fileName: metaFileName } };
      } else {
        throw new Error('Selected document has neither file, file_path, nor dbDocumentId');
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

      // Add text selection event listener for finale functionality
      try {
        // Register callback for text selection events
        await viewer.registerCallback(
          viewer.eventAPI.callbackAPI.TEXT_SELECTOR_API.ANNOTATION_ADDED,
          function(annotation) {
            console.log('🎯 Annotation added:', annotation);
          }
        );
      } catch (callbackError) {
        console.log('⚠️ Text selection callbacks not available in this Adobe SDK version');
      }

      // Alternative approach: Add a global text selection listener
      document.addEventListener('selectionchange', async () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length > 10) {
          console.log('🎯 Text selected globally:', selectedText);
          
          // Check if the selection is within our PDF viewer
          const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const container = range ? range.commonAncestorContainer : null;
          
          if (container && (
            document.getElementById('adobe-dc-view')?.contains(container) ||
            container.closest?.('#adobe-dc-view')
          )) {
            console.log('🎯 Text selected in PDF viewer');
            await handleTextSelection({ text: selectedText });
            
            // Show a floating action button for finale features
            showTextSelectionActions(selectedText);
          }
        } else {
          // Hide action button when selection is cleared
          hideTextSelectionActions();
        }
      });

      // Also try to use Adobe's getSelectedContent API periodically
      const setupAdobeTextSelection = () => {
        let lastSelectedText = '';
        const checkSelection = async () => {
          try {
            if (apis?.getSelectedContent) {
              const selectedContent = await apis.getSelectedContent();
              if (selectedContent?.data?.length > 0) {
                const currentText = selectedContent.data.map(item => item.text || '').join(' ').trim();
                if (currentText && currentText.length > 10 && currentText !== lastSelectedText) {
                  console.log('🎯 Adobe API text selected:', currentText);
                  lastSelectedText = currentText;
                  await handleTextSelection({ text: currentText });
                  showTextSelectionActions(currentText);
                }
              }
            }
          } catch (error) {
            // Silent - API might not be available
          }
        };
        
        // Check every 2 seconds
        setInterval(checkSelection, 2000);
      };
      
      setTimeout(setupAdobeTextSelection, 3000);

      // Add page change listener
      try {
        await viewer.registerCallback(
          viewer.eventAPI.callbackAPI.PAGE_API.PAGE_CHANGED,
          function(pageInfo) {
            console.log('📄 Page changed:', pageInfo);
          }
        );
      } catch (callbackError) {
        console.log('⚠️ Page change callbacks not available');
      }

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

  // Test function for finale features - can be triggered manually
  const testFinaleFeatures = async () => {
    console.log('🧪 Testing finale features manually...');
    const testText = "Adobe Acrobat's generative AI features revolutionize document workflows";
    await handleTextSelection({ text: testText });
    showTextSelectionActions(testText);
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
      
      {/* Test Button for Finale Features */}
      {viewerReady && !isLoading && !error && (
        <button
          onClick={testFinaleFeatures}
          className="absolute top-4 left-4 z-50 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-200"
          title="Test Finale Features - Simulates text selection"
        >
          🧪 Test Text Selection
        </button>
      )}
      
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
