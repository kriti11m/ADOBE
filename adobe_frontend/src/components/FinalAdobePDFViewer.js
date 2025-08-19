import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ADOBE_CONFIG } from '../config/adobe';
import collectionService from '../services/collectionService';
import backendService from '../services/backendService';

const FinalAdobePDFViewer = forwardRef(({ 
  selectedDocument, 
  onSectionHighlight,
  onDocumentLoad,
  onSectionSelect,
  highlightedSections,
  className = ""
}, ref) => {
  // State management
  const [isLoading, setIsLoading] = useState(false); // Start as false, only load when document selected
  const [error, setError] = useState(null);
  const [adobeAPIs, setAdobeAPIs] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [currentSelectedText, setCurrentSelectedText] = useState(''); // Store selected text
  const [isRealSelection, setIsRealSelection] = useState(false); // Track if selection is from PDF or test
  
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
  const handleTextSelection = async (action, textOverride = null) => {
    try {
      // Use override text first, then stored text, then current selection
      let selectedText = textOverride || currentSelectedText;
      
      console.log('🔍 handleTextSelection called with:', { action, textOverride, storedText: currentSelectedText, finalText: selectedText });
      
      if (!selectedText) {
        const selection = window.getSelection();
        selectedText = selection.toString().trim();
        console.log('🔍 No stored text, got from selection:', selectedText);
      }
      
      if (!selectedText) {
        console.log('No text selected');
        showTextSelectionNotification('No text selected');
        return;
      }

      console.log('Selected text:', selectedText);
      console.log('Action:', action);

      // Always find related sections for context
      try {
        const relatedSections = await backendService.findRelatedSections(selectedText);
        console.log('Found related sections:', relatedSections);
        
        // Update parent component with selected text and related sections
        if (onSectionHighlight) {
          onSectionHighlight({
            selectedText: selectedText,
            relatedSections: relatedSections || []
          });
        }
        showTextSelectionNotification(relatedSections ? relatedSections.length : 0);
        
        // Handle specific actions with appropriate messages
        switch(action) {
          case 'ai-assistant':
            console.log('Triggering AI Assistant with selected text:', selectedText);
            // Update parent component with action info
            if (onSectionHighlight) {
              onSectionHighlight({
                selectedText: selectedText,
                relatedSections: relatedSections || [],
                action: 'ai-assistant'
              });
            }
            showTextSelectionNotification('AI Assistant activated');
            break;
          case 'smart-connections':
            console.log('Triggering Smart Connections with selected text:', selectedText);
            // Update parent component with action info
            if (onSectionHighlight) {
              onSectionHighlight({
                selectedText: selectedText,
                relatedSections: relatedSections || [],
                action: 'smart-connections'
              });
            }
            showTextSelectionNotification('Smart Connections activated');
            break;
          case 'podcast-mode':
            console.log('Triggering Podcast Mode with selected text:', selectedText);
            // Update parent component with action info
            if (onSectionHighlight) {
              onSectionHighlight({
                selectedText: selectedText,
                relatedSections: relatedSections || [],
                action: 'podcast-mode'
              });
            }
            showTextSelectionNotification('Podcast Mode activated');
            break;
          default:
            console.log('Default text selection handling');
            // Update parent component for default case
            if (onSectionHighlight) {
              onSectionHighlight({
                selectedText: selectedText,
                relatedSections: relatedSections || []
              });
            }
        }
      } catch (error) {
        console.error('Error finding related sections:', error);
        // Still update with selected text even if related sections fail
        if (onSectionHighlight) {
          onSectionHighlight({
            selectedText: selectedText,
            relatedSections: []
          });
        }
        showTextSelectionNotification('Text selected successfully');
      }
      
      // Clear the current selection if it exists
      try {
        const selection = window.getSelection();
        if (selection && selection.removeAllRanges) {
          selection.removeAllRanges();
        }
      } catch (clearError) {
        console.warn('Could not clear selection:', clearError);
      }
      
    } catch (error) {
      console.error('Error in handleTextSelection:', error);
      showTextSelectionNotification('Error processing text selection');
    }
  };

  // Store selected text and automatically trigger Smart Connections panel update
  const showTextSelectionActions = (selectedText, isRealPDFSelection = false) => {
    // Store the selected text for later use
    console.log('💾 Storing selected text:', selectedText, 'Real selection:', isRealPDFSelection);
    
    // Only update if it's a real selection, or if we don't have a real selection yet
    if (isRealPDFSelection || !isRealSelection) {
      setCurrentSelectedText(selectedText);
      setIsRealSelection(isRealPDFSelection);
    } else if (isRealSelection && !isRealPDFSelection) {
      console.log('📋 Ignoring test selection because we have real PDF text selected');
      return; // Don't override real selection with test selection
    }
    
    // No popup menu - text selection automatically updates Smart Connections panel
    console.log('✅ Text selection stored - use Smart Connections panel to analyze');
  };

  // Show notification for text selection
  const showTextSelectionNotification = (message) => {
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
    
    if (typeof message === 'number') {
      notification.innerHTML = `🔍 Found ${message} related sections`;
    } else {
      notification.innerHTML = `✨ ${message}`;
    }
    
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

      // Build content descriptor: support URL, local File object, file_path, or database document
      let contentDescriptor = null;
      let metaFileName = selectedDocument.name || selectedDocument.original_filename || selectedDocument.file?.name || 'document.pdf';
      
      if (selectedDocument.file && selectedDocument.file.arrayBuffer) {
        // Handle uploaded File objects
        console.log('📄 Loading PDF from File object:', metaFileName);
        const arrayBuffer = await selectedDocument.file.arrayBuffer();
        contentDescriptor = { content: { promise: Promise.resolve(arrayBuffer) }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.url) {
        // Handle documents with direct URLs (from document library)
        console.log('📄 Loading PDF from URL:', selectedDocument.url);
        contentDescriptor = { content: { location: { url: selectedDocument.url } }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.file_path) {
        // Handle legacy backend file paths
        console.log('📄 Loading PDF file by file path:', selectedDocument.file_path);
        contentDescriptor = { content: { location: { url: `http://localhost:8000/files/${selectedDocument.file_path}` } }, metaData: { fileName: metaFileName } };
      } else if (selectedDocument.dbDocumentId) {
        // Handle database documents via blob URL
        console.log(`📥 Fetching database document ${selectedDocument.dbDocumentId} as blob...`);
        const blobUrl = await collectionService.getDocumentBlobUrl(selectedDocument.dbDocumentId);
        contentDescriptor = { content: { location: { url: blobUrl } }, metaData: { fileName: metaFileName } };
      } else {
        throw new Error('Selected document has no valid source (file, url, file_path, or dbDocumentId)');
      }

      // Preview the PDF file and get viewer instance
      const viewer = await adobeDCView.previewFile(
        contentDescriptor,
        {
        ...ADOBE_CONFIG.VIEWER_CONFIG,
        // Enhanced viewer options for navigation and text selection
        showPageControls: true,
        showBookmarks: true,
        showThumbnails: true,
        showSearch: true,
        enableFormFilling: false,
        showAnnotationTools: true,
        enableTextSelection: true, // Explicitly enable text selection
        enableCopyText: true, // Allow copying text
        disableTextSelection: false, // Make sure text selection is not disabled
        showSecondaryToolbar: true,
        showToolbarControl: true
      }
      );

      console.log('🔗 Getting PDF APIs from viewer...');
      
      // Get the APIs from the viewer instance
      const apis = await viewer.getAPIs();
      
      console.log('✅ Adobe PDF viewer fully loaded and ready');
      console.log('🎯 Available navigation methods:', Object.keys(apis));

      // Register feature flag callbacks to prevent console errors
      try {
        if (viewer.registerCallback) {
          // Register feature flag handlers
          const featureFlags = [
            'GET_FEATURE_FLAG:enable-tools-multidoc',
            'GET_FEATURE_FLAG:edit-config', 
            'GET_FEATURE_FLAG:enable-accessibility',
            'GET_FEATURE_FLAG:preview-config',
            'GET_FEATURE_FLAG:enable-inline-organize',
            'GET_FEATURE_FLAG:enable-pdf-request-signatures',
            'GET_FEATURE_FLAG:DCWeb_edit_image_experiment'
          ];
          
          featureFlags.forEach(flag => {
            try {
              viewer.registerCallback(flag, (flagName) => {
                // Return default false for all feature flags to suppress errors
                console.log(`🏁 Feature flag requested: ${flagName} - returning false`);
                return false;
              });
            } catch (e) {
              console.log(`⚠️ Could not register ${flag}:`, e.message);
            }
          });
        }
      } catch (flagError) {
        console.log('⚠️ Feature flag registration not available:', flagError);
      }

      // Add text selection event listener for finale functionality
      try {
        // Register callback for text selection events
        await viewer.registerCallback(
          viewer.eventAPI.callbackAPI.TEXT_SELECTOR_API.ANNOTATION_ADDED,
          function(annotation) {
            console.log('🎯 Annotation added:', annotation);
          }
        );
        
        // Try to register more specific text selection events
        if (viewer.eventAPI && viewer.eventAPI.callbackAPI.CONTENT_CHANGE) {
          await viewer.registerCallback(
            viewer.eventAPI.callbackAPI.CONTENT_CHANGE,
            async function(event) {
              console.log('📝 PDF content change detected:', event);
              // Check for text selection after content change
              setTimeout(async () => {
                try {
                  const selectedContent = await apis.getSelectedContent();
                  if (selectedContent?.data?.length > 0) {
                    const currentText = selectedContent.data.map(item => item.text || '').join(' ').trim();
                    if (currentText && currentText.length > 5) {
                      console.log('🎯 PDF text selected via content change:', currentText);
                      showTextSelectionActions(currentText, true);
                    }
                  }
                } catch (error) {
                  console.log('Error checking selection after content change:', error);
                }
              }, 100);
            }
          );
        }
        
      } catch (callbackError) {
        console.log('⚠️ Text selection callbacks not available in this Adobe SDK version');
      }

      // Listen for postMessage events from Adobe iframe (for cross-origin text selection)
      window.addEventListener('message', (event) => {
        // Adobe might send text selection events via postMessage
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'textSelected' || event.data.action === 'textSelected') {
            console.log('📨 Received text selection message from Adobe iframe:', event.data);
            const selectedText = event.data.text || event.data.selectedText;
            if (selectedText && selectedText.length > 5) {
              console.log('🎯 Adobe iframe text selection:', selectedText);
              showTextSelectionActions(selectedText, true);
            }
          }
        }
      });

      // Alternative approach: Add a global text selection listener
      document.addEventListener('selectionchange', async () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('📝 Selection changed:', { 
          text: selectedText, 
          length: selectedText.length,
          rangeCount: selection.rangeCount 
        });
        
        if (selectedText.length > 5) { // Reduced minimum length
          console.log('🎯 Text selected globally:', selectedText);
          
          // Check if the selection is within our PDF viewer - improved detection
          const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const container = range ? range.commonAncestorContainer : null;
          
          // More comprehensive container detection
          const adobeContainer = document.getElementById('adobe-dc-view');
          const isInPDFViewer = container && adobeContainer && (
            adobeContainer.contains(container) ||
            container.closest?.('#adobe-dc-view') ||
            container === adobeContainer ||
            // Check if any of the range's parent elements are within the PDF viewer
            (container.nodeType === Node.TEXT_NODE && adobeContainer.contains(container.parentNode)) ||
            // Check for Adobe's internal iframe or canvas elements
            container.closest?.('[data-adobe-dc-view]') ||
            container.closest?.('.adobe-dc-view') ||
            // Look for Adobe's internal content containers
            container.closest?.('div[id*="adobe"]') ||
            container.closest?.('iframe[src*="adobe"]') ||
            // Check if selection contains any PDF-related text patterns
            /\b(sub\s*class|super\s*class|inherit|entity|attribute|relationship)\b/i.test(selectedText)
          );
          
          console.log('📍 Selection container detection:', { 
            container: container?.nodeName || 'unknown',
            containerType: container?.nodeType,
            hasAdobeDiv: !!adobeContainer,
            isInPDFViewer,
            containerParent: container?.parentNode?.nodeName,
            containerClass: container?.className || 'no-class',
            textContent: selectedText.substring(0, 50) + '...'
          });
          
          if (isInPDFViewer) {
            console.log('🎯 Text selected in PDF viewer - showing actions');
            showTextSelectionActions(selectedText, true); // Mark as real PDF selection
          } else {
            console.log('❌ Text selection not in PDF viewer');
            // Still show actions if we detect any PDF-related selection
            if (selectedText && (
              selectedText.length > 10 || // Longer selections are more likely to be intentional
              adobeContainer // If Adobe container exists, be more permissive
            )) {
              console.log('🎯 Showing actions anyway for substantial text selection');
              showTextSelectionActions(selectedText, true); // Mark as real PDF selection
            }
          }
        } else {
          // No action needed when selection is cleared
          console.log('📝 Text selection cleared');
        }
      });

      // Additional mouseup listener specifically for the PDF container and document
      const pdfContainer = document.getElementById('adobe-dc-view');
      
      // Listen on both the container and the entire document for better detection
      const handleMouseUp = () => {
        setTimeout(() => { // Small delay to ensure selection is complete
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();
          
          console.log('🖱️ Mouseup detected, selected text:', selectedText);
          
          if (selectedText.length > 5) {
            console.log('🎯 Showing text selection actions after mouseup');
            showTextSelectionActions(selectedText, true); // Mark as real PDF selection
          }
        }, 100);
      };
      
      if (pdfContainer) {
        pdfContainer.addEventListener('mouseup', handleMouseUp);
      }
      
      // Keyboard shortcut for manual text selection (Ctrl+Shift+S or Cmd+Shift+S)
      const handleKeyboardShortcut = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
          event.preventDefault();
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();
          
          if (selectedText) {
            console.log('⌨️ Keyboard shortcut triggered with text:', selectedText);
            showTextSelectionActions(selectedText, true); // Mark as real PDF selection
          } else {
            console.log('⌨️ Keyboard shortcut triggered but no text selected');
            // Show a notification
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #f59e0b;
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              z-index: 10000;
              font-size: 12px;
            `;
            notification.textContent = 'Select text first, then press Ctrl+Shift+S (or Cmd+Shift+S)';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyboardShortcut);
      
      // Also listen on both the container and the entire document for better detection
      document.addEventListener('mouseup', () => {
        setTimeout(() => {
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();
          
          if (selectedText.length > 10) { // Higher threshold for document-wide detection
            console.log('🖱️ Document mouseup with substantial text:', selectedText);
            const adobeContainer = document.getElementById('adobe-dc-view');
            if (adobeContainer) {
              // Directly update Smart Connections panel - no popup
              handleTextSelection('smart-connections', selectedText);
            }
          }
        }, 150);
      });

      // Also try to use Adobe's getSelectedContent API periodically
      const setupAdobeTextSelection = () => {
        let lastSelectedText = '';
        let isProcessingSelection = false;
        let selectionCheckInterval;
        
        const checkSelection = async () => {
          try {
            if (apis?.getSelectedContent) {
              const selectedContent = await apis.getSelectedContent();
              console.log('🔍 Adobe getSelectedContent result:', selectedContent);
              
              if (selectedContent?.data) {
                let currentText = '';
                
                // Handle different data formats from Adobe API
                if (typeof selectedContent.data === 'string') {
                  // Data is already a string
                  currentText = selectedContent.data.trim();
                } else if (Array.isArray(selectedContent.data)) {
                  // Data is an array of objects with text property
                  currentText = selectedContent.data.map(item => item.text || '').join(' ').trim();
                } else if (selectedContent.data.text) {
                  // Data is an object with text property
                  currentText = selectedContent.data.text.trim();
                } else {
                  // Try to convert to string
                  currentText = String(selectedContent.data).trim();
                }
                
                if (currentText && currentText.length > 5 && currentText !== lastSelectedText && !isProcessingSelection) {
                  console.log('🎯 Adobe API detected PDF text selection:', currentText);
                  lastSelectedText = currentText;
                  isProcessingSelection = true;
                  
                  // Directly update Smart Connections panel - no popup
                  showTextSelectionActions(currentText, true);
                  
                  // Also directly trigger backend analysis
                  await handleTextSelection('smart-connections', currentText);
                  
                  // Reset processing flag after a delay
                  setTimeout(() => {
                    isProcessingSelection = false;
                  }, 2000);
                }
              } else {
                // Clear actions when no text is selected in PDF
                if (lastSelectedText) {
                  console.log('📝 Adobe API: Text selection cleared');
                  lastSelectedText = '';
                  isProcessingSelection = false;
                  // No action needed - text selection just cleared
                }
              }
            } else {
              console.log('⚠️ Adobe getSelectedContent API not available');
            }
          } catch (error) {
            console.log('Error in Adobe text selection check:', error);
          }
        };
        
        // Start with less frequent polling to avoid infinite loops
        selectionCheckInterval = setInterval(checkSelection, 1000); // Check every 1 second instead of 200ms
        
        // Also set up event listeners on the Adobe container for immediate detection
        const adobeContainer = document.getElementById('adobe-dc-view');
        if (adobeContainer) {
          console.log('🔧 Setting up Adobe container event listeners...');
          
          // Listen for mouse events on the Adobe container
          const handleAdobeEvent = (eventType) => {
            console.log(`📱 Adobe container ${eventType} event detected`);
            setTimeout(() => {
              checkSelection();
            }, 150); // Small delay to ensure selection is complete
          };
          
          adobeContainer.addEventListener('mouseup', () => handleAdobeEvent('mouseup'));
          adobeContainer.addEventListener('click', () => handleAdobeEvent('click'));
          adobeContainer.addEventListener('touchend', () => handleAdobeEvent('touchend'));
          
          // Also try to listen on all child elements
          const observer = new MutationObserver(() => {
            const iframes = adobeContainer.querySelectorAll('iframe');
            iframes.forEach((iframe, index) => {
              console.log(`🖼️ Found Adobe iframe ${index}`);
              try {
                // Try to access iframe content (will fail for cross-origin)
                iframe.addEventListener('load', () => {
                  console.log(`📄 Adobe iframe ${index} loaded`);
                  setTimeout(checkSelection, 500);
                });
              } catch (e) {
                console.log(`🔒 Cannot access iframe ${index} (cross-origin)`);
              }
            });
          });
          
          observer.observe(adobeContainer, { childList: true, subtree: true });
          
          console.log('📎 Added enhanced Adobe PDF text selection listeners');
        }
        
        return () => {
          if (selectionCheckInterval) {
            clearInterval(selectionCheckInterval);
          }
        };
      };
      
      // Wait longer for Adobe to fully initialize, then start text selection monitoring
      setTimeout(setupAdobeTextSelection, 5000);

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
