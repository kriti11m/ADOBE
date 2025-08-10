import React, { useEffect, useRef, useState } from 'react';
import { ADOBE_CONFIG } from '../config/adobe';
import { useDarkMode } from '../App';

const FinalAdobePDFViewer = ({ selectedDocument }) => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (selectedDocument && selectedDocument.file) {
      loadPDF();
    }
  }, [selectedDocument]);

  const loadPDF = async () => {
    setIsLoading(true);
    setError(null);
    setViewerReady(false);

    try {
      // Check Adobe SDK availability
      if (!window.AdobeDC?.View) {
        throw new Error('Adobe PDF SDK not loaded');
      }

      // Check configuration
      if (!ADOBE_CONFIG?.CLIENT_ID) {
        throw new Error('Adobe Client ID not configured');
      }

      // Wait for React to render the component
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if the ref is available
      if (!viewerRef.current) {
        throw new Error('PDF viewer container not ready');
      }
      
      // Clear any existing content
      viewerRef.current.innerHTML = '';
      
      // Convert file to array buffer
      const arrayBuffer = await selectedDocument.file.arrayBuffer();

      // Create a unique ID for this instance
      const uniqueId = `adobe-pdf-viewer-${Date.now()}`;
      viewerRef.current.id = uniqueId;

      // Initialize Adobe DC View
      const adobeDCView = new window.AdobeDC.View({
        clientId: ADOBE_CONFIG.CLIENT_ID,
        divId: uniqueId
      });

      // Prepare file data
      const filePromise = Promise.resolve(arrayBuffer);
      
      // Load the PDF
      await adobeDCView.previewFile({
        content: { promise: filePromise },
        metaData: { 
          fileName: selectedDocument.name || selectedDocument.file.name || 'document.pdf'
        }
      }, ADOBE_CONFIG.VIEWER_CONFIG);

      setViewerReady(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading PDF:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (!selectedDocument) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg flex items-center justify-center`}>
            <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Document Selected
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Choose a document from the sidebar to start viewing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isDarkMode ? 'bg-gray-900 bg-opacity-90' : 'bg-white bg-opacity-90'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading PDF...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isDarkMode ? 'bg-red-900 bg-opacity-90' : 'bg-red-50'}`}>
          <div className="text-center p-6 rounded-lg max-w-md">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-red-800' : 'bg-red-100'} flex items-center justify-center`}>
              <svg className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              Failed to load PDF
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
              {error}
            </p>
            <button 
              onClick={loadPDF}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div 
        ref={viewerRef}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
      
      {viewerReady && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
          isDarkMode 
            ? 'bg-green-800 text-green-200 border border-green-600' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>PDF Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalAdobePDFViewer;
