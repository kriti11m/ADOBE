import React, { useState, useEffect, createContext, useContext } from 'react';
import OnboardingModal from './components/OnboardingModal';
import Navigation from './components/Navigation';
import DocumentSidebar from './components/DocumentSidebar';
import AdobePDFViewer from './components/FinalAdobePDFViewer';
import SmartConnections from './components/SmartConnections';
import PDFUploader from './components/PDFUploader';
import backendService from './services/backendService';

// Create Dark Mode Context
export const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userProfile, setUserProfile] = useState({ role: '', task: '' });
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [documents, setDocuments] = useState([]);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleOnboardingComplete = (role, task) => {
    setUserProfile({ role, task });
    setShowOnboarding(false);
    startBackgroundAnalysis();
  };

  const startBackgroundAnalysis = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDocuments(prev => prev.map(doc => 
        doc.status === 'new' ? { ...doc, status: 'analyzed', tags: ['Analyzed'] } : doc
      ));
    }, 3000);
  };

  const handleDocumentSelect = (document) => {
    setCurrentDocument(document);
    // Automatically get recommendations when document is selected
    if (document && document.file && userProfile.role && userProfile.task) {
      handleGetRecommendations(document);
    }
  };

  const handleDocumentLoad = (document) => {
    console.log('Document loaded in Adobe viewer:', document.name);
    // Get recommendations when PDF successfully loads if we have user profile
    if (document && document.file && userProfile.role && userProfile.task) {
      handleGetRecommendations(document);
    }
  };

  const handleSectionSelect = (section) => {
    console.log('Section selected:', section);
    // Handle section selection - update recommendations based on current section
    if (currentDocument && section) {
      handleGetRecommendations(currentDocument, section);
    }
  };

  const handleGetRecommendations = async (document, section = null) => {
    if (!document || !document.file) return;

    setIsProcessing(true);
    try {
      // Use the user's persona and task from onboarding
      const recs = await backendService.getRecommendations(
        [document.file], // Pass as array since backend expects multiple files
        userProfile.role || 'Researcher',
        userProfile.task || 'Analyze document content'
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecommendations([]); // Set empty array on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (files) => {
    const newDocuments = Array.from(files).map(file => ({
      id: file.name,
      name: file.name,
      file: file, // Store the actual file object
      status: 'new',
      timestamp: 'Just now',
      tags: ['New']
    }));
    
    setDocuments(prev => [...newDocuments, ...prev]);
    
    if (userProfile.role && userProfile.task) {
      startBackgroundAnalysis();
    }
  };

  const handleDocumentsProcessed = (processedData) => {
    console.log('Documents processed:', processedData);
    
    // Add processed documents to library
    const newDocuments = processedData.structures.map(({ file, structure }) => ({
      id: file.name + '_' + Date.now(),
      name: file.name,
      file: file,
      structure: structure,
      status: 'analyzed',
      timestamp: 'Just processed',
      tags: ['Analyzed', 'In Library']
    }));
    
    setRecommendations(processedData.recommendations);
    setDocuments(prev => [...newDocuments, ...prev]);
    
    // Show success message or update UI as needed
    if (processedData.errors.length > 0) {
      console.warn('Some documents failed to process:', processedData.errors);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const darkModeContextValue = {
    isDarkMode,
    toggleDarkMode
  };

  return (
    <DarkModeContext.Provider value={darkModeContextValue}>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}

        <Navigation 
          userProfile={userProfile}
          isProcessing={isProcessing}
        />

        <div className="flex h-screen">
          <DocumentSidebar 
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            onFileUpload={handleFileUpload}
            currentDocument={currentDocument}
            onShowUploader={() => setShowUploader(true)}
          />

          <div className="flex-1 flex">
            <AdobePDFViewer 
              selectedDocument={currentDocument}
              onDocumentLoad={handleDocumentLoad}
              onSectionSelect={handleSectionSelect}
            />

            <SmartConnections 
              currentDocument={currentDocument}
              recommendations={recommendations}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* PDF Uploader Modal */}
        {showUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Build Your Document Library
                </h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <PDFUploader
                onDocumentsProcessed={handleDocumentsProcessed}
                userProfile={userProfile}
              />
            </div>
          </div>
        )}

      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
