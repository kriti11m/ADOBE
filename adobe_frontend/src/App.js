import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import OnboardingModal from './components/OnboardingModal';
import Navigation from './components/Navigation';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentOutline from './components/DocumentOutline';
import FinalAdobePDFViewer from './components/FinalAdobePDFViewer';
import SmartConnections from './components/SmartConnections';
import PDFUploader from './components/PDFUploader';
import CollectionUploader from './components/CollectionUploader';
import HistoryPanel from './components/HistoryPanel';
import backendService from './services/backendService';
import part1aService from './services/part1aService';
import historyService from './services/historyService';

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
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCollectionUploader, setShowCollectionUploader] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [analyzedCollectionId, setAnalyzedCollectionId] = useState(null); // Track which collection was analyzed
  
  // Part 1A Integration - Document Structure
  const [pdfStructure, setPdfStructure] = useState(null);
  const [isExtractingStructure, setIsExtractingStructure] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  
  // History Panel State
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  // Document Outline State
  const [showDocumentOutline, setShowDocumentOutline] = useState(false);
  
  // Ref for PDF viewer to control navigation
  const pdfViewerRef = useRef(null);

  // Load document statuses from history on app start
  useEffect(() => {
    const loadDocumentStatuses = async () => {
      if (documents.length > 0) {
        try {
          const documentsWithStatus = await historyService.getDocumentStatuses(documents);
          setDocuments(documentsWithStatus);
        } catch (error) {
          console.warn('Failed to load document statuses:', error);
        }
      }
    };

    loadDocumentStatuses();
  }, [documents.length]); // Only run when documents are added

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

  const handleDocumentSelect = async (document) => {
    setCurrentDocument(document);
    
    // Show document outline when selecting a document
    setShowDocumentOutline(true);
    
    // If document is from a collection, ensure it's extracted properly
    if (document.fromCollection) {
      console.log('Selected document from collection:', document.name, 'from', document.fromCollection.name);
    }
    
    // Clear previous structure and start extracting for the new document
    setPdfStructure(null);
    setCurrentSection(null);
    
    if (document.file || document.url) {
      setIsExtractingStructure(true);
      try {
        const structure = await part1aService.extractPdfStructure(document);
        setPdfStructure(structure);
      } catch (error) {
        console.error('Error extracting PDF structure:', error);
      } finally {
        setIsExtractingStructure(false);
      }
    }
  };

  const handleCollectionDocumentSelect = async (document, collection) => {
    // Add collection info to document
    const documentWithCollection = {
      ...document,
      fromCollection: collection
    };
    
    setCurrentDocument(documentWithCollection);
    
    // Show document outline when selecting a document from collection
    setShowDocumentOutline(true);
    
    // Clear previous structure
    setPdfStructure(null);
    setCurrentSection(null);
    
    // Extract document structure using Part 1A if it's a real document with a file
    if (document && document.file) {
      await extractDocumentStructure(document);
    }
    
    // DON'T automatically run backend analysis - only when Smart Connections is clicked
    // This prevents unnecessary backend calls when browsing documents in collections
  };

  const extractDocumentStructure = async (document) => {
    if (!document.file) return;
    
    try {
      setIsExtractingStructure(true);
      console.log(`📖 Extracting structure for: ${document.name}`);
      
      // Check if document was already analyzed
      const isAnalyzed = await historyService.isDocumentAnalyzed(document.name);
      
      if (isAnalyzed) {
        console.log(`📚 Document "${document.name}" was previously analyzed, checking for cached structure...`);
        const cachedResults = await historyService.getCachedResults(document.name);
        
        if (cachedResults && cachedResults.structure) {
          console.log('✅ Using cached structure from history');
          setPdfStructure(cachedResults.structure);
          setIsExtractingStructure(false);
          return;
        }
      }
      
      // Extract fresh structure using Part 1A
      const structure = await part1aService.extractStructure(document.file);
      
      if (structure) {
        console.log('✅ Structure extracted:', structure);
        // Transform outline for navigation
        const navigationOutline = part1aService.getNavigationOutline(structure.outline);
        setPdfStructure({
          ...structure,
          outline: navigationOutline
        });
      } else {
        console.warn('⚠️ No structure extracted');
        setPdfStructure({ hasStructure: false });
      }
    } catch (error) {
      console.error('❌ Failed to extract document structure:', error);
      setPdfStructure({ hasStructure: false, error: error.message });
    } finally {
      setIsExtractingStructure(false);
    }
  };

  const handleDocumentLoad = (document) => {
    console.log('Document loaded in Adobe viewer:', document.name);
    // DON'T automatically get recommendations - only when Smart Connections is clicked
    // This prevents backend from running every time a PDF loads
  };

  const handleSectionSelect = (section) => {
    console.log('Section selected:', section);
    // Handle section selection - just log for now, don't trigger backend analysis
    // Backend analysis should only happen when Smart Connections is clicked
  };

  const handleGetRecommendations = async (document, section = null) => {
    // If we have an active collection, analyze all PDFs in the collection
    if (activeCollection && activeCollection.documents.length > 0) {
      // Check if we've already analyzed this collection
      if (analyzedCollectionId === activeCollection.id && recommendations.length > 0) {
        console.log(`Collection "${activeCollection.name}" already analyzed. Using cached results.`);
        return; // Just return, let SmartConnections handle the view switch
      }

      setIsProcessing(true);
      try {
        // Use all documents from the active collection
        const collectionFiles = activeCollection.documents.map(doc => doc.file);
        const recs = await backendService.getRecommendations(
          collectionFiles,
          userProfile.role || 'Researcher',
          userProfile.task || 'Analyze document content'
        );
        setRecommendations(recs);
        
        // Mark this collection as analyzed
        setAnalyzedCollectionId(activeCollection.id);
        
        // Prepare highlighted sections for PDF viewer
        const highlights = recs.map((rec, index) => ({
          page: parseInt(rec.page?.replace('Page ', '') || 1),
          title: rec.section,
          color: index === 0 ? '#22C55E' : index === 1 ? '#3B82F6' : '#8B5CF6',
          coordinates: rec.coordinates || null
        }));
        setHighlightedSections(highlights);
        
        console.log(`✅ Analyzed ${collectionFiles.length} PDFs from collection "${activeCollection.name}" - Results cached`);
      } catch (error) {
        console.error('Error getting collection recommendations:', error);
        setRecommendations([]);
        setHighlightedSections([]);
      } finally {
        setIsProcessing(false);
      }
    } else if (document && document.file && !document.fromCollection) {
      // Only analyze individual documents if they're NOT from a collection
      setIsProcessing(true);
      try {
        const recs = await backendService.getRecommendations(
          [document.file],
          userProfile.role || 'Researcher',
          userProfile.task || 'Analyze document content'
        );
        setRecommendations(recs);
        
        // Clear collection analysis cache since this is individual analysis
        setAnalyzedCollectionId(null);
        
        // Prepare highlighted sections for PDF viewer
        const highlights = recs.map((rec, index) => ({
          page: parseInt(rec.page?.replace('Page ', '') || 1),
          title: rec.section,
          color: index === 0 ? '#22C55E' : index === 1 ? '#3B82F6' : '#8B5CF6',
          coordinates: rec.coordinates || null
        }));
        setHighlightedSections(highlights);
        
      } catch (error) {
        console.error('Error getting single document recommendations:', error);
        setRecommendations([]);
        setHighlightedSections([]);
      } finally {
        setIsProcessing(false);
      }
    } else if (document && document.fromCollection) {
      // If selecting a document from a collection, just inform user to use Smart Connections
      console.log(`Document "${document.name}" is from collection "${document.fromCollection.name}". Use Smart Connections to analyze the entire collection.`);
    }
  };

  const handleNavigateToSection = (pageNumber, sectionTitle = null) => {
    console.log(`📍 App.js: Navigation requested to page ${pageNumber}${sectionTitle ? ` (section: "${sectionTitle}")` : ''}`);

    // Update current section if we have structure
    if (pdfStructure && pdfStructure.outline) {
      const section = part1aService.findSectionByPage(pageNumber, pdfStructure.outline);
      if (section) {
        setCurrentSection(section);
      }
    }

    if (pdfViewerRef.current && pdfViewerRef.current.navigateToSection) {
      pdfViewerRef.current.navigateToSection(pageNumber, sectionTitle);
    } else {
      console.warn('⚠️ PDF viewer ref not available or navigateToSection method missing');
      if (pdfViewerRef.current) {
        console.log('PDF viewer ref methods:', Object.keys(pdfViewerRef.current));
      }
    }
  };

  const handleNavigateToSectionByTitle = (sectionTitle) => {
    if (pdfViewerRef.current && pdfViewerRef.current.navigateToSectionByTitle) {
      pdfViewerRef.current.navigateToSectionByTitle(sectionTitle);
    }
  };

  const handleCreateCollection = (name, files) => {
    const newCollection = {
      id: `collection-${Date.now()}`,
      name,
      documents: Array.from(files).map(file => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        file: file,
        status: 'ready',
        timestamp: 'Just now',
        tags: ['Collection']
      })),
      createdAt: new Date().toISOString(),
      status: 'ready'
    };
    
    setCollections(prev => [newCollection, ...prev]);
    setActiveCollection(newCollection);
    setShowCollectionUploader(false);
    console.log(`Created collection "${name}" with ${files.length} documents`);
  };

  const handleSelectCollection = (collection) => {
    setActiveCollection(collection);
    setCurrentDocument(null); // Clear single document selection
    
    // Reset analysis cache if switching to a different collection or clearing selection
    if (!collection || analyzedCollectionId !== collection.id) {
      setRecommendations([]); // Clear previous recommendations
      setAnalyzedCollectionId(null); // Reset analyzed collection cache
      setHighlightedSections([]); // Clear highlights
    }
    
    if (collection) {
      console.log(`Selected collection: ${collection.name}`);
    } else {
      console.log('Cleared collection selection');
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

  // History Panel handlers
  const handleOpenHistory = () => {
    setShowHistoryPanel(true);
  };

  const handleCloseHistory = () => {
    setShowHistoryPanel(false);
  };

  const handleLoadSession = (session) => {
    console.log('Loading session:', session);
    // Here you can implement loading a session - for now just close the panel
    // You could restore documents, recommendations, etc. from the session data
    setShowHistoryPanel(false);
    
    // If the session has documents, you could restore them
    if (session.documents && session.documents.length > 0) {
      console.log('Session contains documents:', session.documents.map(d => d.filename));
      // Future enhancement: restore documents and analysis state
    }
  };

  // Document Outline handlers
  const handleCloseDocumentOutline = () => {
    setShowDocumentOutline(false);
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
          onOpenHistory={handleOpenHistory}
        />

        <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
          <DocumentSidebar 
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            onFileUpload={handleFileUpload}
            currentDocument={currentDocument}
            onShowUploader={() => setShowUploader(true)}
            collections={collections}
            activeCollection={activeCollection}
            onSelectCollection={handleSelectCollection}
            onShowCollectionUploader={() => setShowCollectionUploader(true)}
            onCollectionDocumentSelect={handleCollectionDocumentSelect}
          />

          <div className="flex-1 flex">
            {/* Document Outline Panel - shows when document is selected */}
            {showDocumentOutline && currentDocument && (
              <DocumentOutline
                currentDocument={currentDocument}
                pdfStructure={pdfStructure}
                isExtractingStructure={isExtractingStructure}
                currentSection={currentSection}
                onNavigateToSection={handleNavigateToSection}
                onClose={handleCloseDocumentOutline}
              />
            )}

            <div className="flex-1">
              <FinalAdobePDFViewer 
                ref={pdfViewerRef}
                selectedDocument={currentDocument}
                highlightedSections={highlightedSections}
                onDocumentLoad={handleDocumentLoad}
                onSectionSelect={handleSectionSelect}
                onSectionHighlight={(page) => console.log('Highlighted page:', page)}
              />
            </div>

            <SmartConnections 
              currentDocument={currentDocument}
              recommendations={recommendations}
              isProcessing={isProcessing}
              onGetRecommendations={handleGetRecommendations}
              activeCollection={activeCollection}
              onNavigateToSection={handleNavigateToSection}
              pdfStructure={pdfStructure}
              isExtractingStructure={isExtractingStructure}
              currentSection={currentSection}
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

        {/* Collection Uploader Modal */}
        {showCollectionUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Document Collection
                </h2>
                <button
                  onClick={() => setShowCollectionUploader(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <CollectionUploader
                onCollectionCreate={handleCreateCollection}
                onClose={() => setShowCollectionUploader(false)}
              />
            </div>
          </div>
        )}

        {/* History Panel */}
        <HistoryPanel
          isOpen={showHistoryPanel}
          onClose={handleCloseHistory}
          onLoadSession={handleLoadSession}
        />

      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
