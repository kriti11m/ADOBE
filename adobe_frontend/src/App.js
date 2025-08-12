import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import InteractiveTutorial from './components/InteractiveTutorial';
import OnboardingModal from './components/OnboardingModal';
import Navigation from './components/Navigation';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentOutline from './components/DocumentOutline';
import FinalAdobePDFViewer from './components/FinalAdobePDFViewer';
import SmartConnections from './components/SmartConnections';
import PDFUploader from './components/PDFUploader';
import CollectionUploader from './components/CollectionUploader';
import HistoryPanel from './components/HistoryPanel';
import PodcastButton from './components/PodcastButton';
import { Headphones } from 'lucide-react';
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
  // Check if user has seen tutorial before
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial automatically on very first visit
    const hasSeenTutorial = localStorage.getItem('connectpdf-tutorial-seen');
    return !hasSeenTutorial; // Show tutorial if user has never seen it
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState({ role: '', task: '' });
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null); // Store session ID for insights
  const [showUploader, setShowUploader] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCollectionUploader, setShowCollectionUploader] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [analyzedCollectionId, setAnalyzedCollectionId] = useState(null); // Track which collection was analyzed
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [podcastData, setPodcastData] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [availableTTSEngines, setAvailableTTSEngines] = useState(null);
  
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

  // Development helper: Press Ctrl+Shift+T to restart tutorial
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        console.log('🎯 Restarting tutorial via keyboard shortcut');
        // Clear both tutorial flags and restart the tutorial
        localStorage.removeItem('connectpdf-tutorial-seen');
        localStorage.removeItem('connectpdf-tutorial-completed');
        setShowTutorial(true);
        setShowOnboarding(false);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setShowOnboarding(true);
    // Mark tutorial as seen (first time experience completed)
    localStorage.setItem('connectpdf-tutorial-seen', 'true');
    // Also mark as completed for backwards compatibility
    localStorage.setItem('connectpdf-tutorial-completed', 'true');
  };

  const handleRestartTutorial = () => {
    setShowTutorial(true);
    setShowOnboarding(false);
    // Clear both tutorial flags to reset the experience
    localStorage.removeItem('connectpdf-tutorial-seen');
    localStorage.removeItem('connectpdf-tutorial-completed');
  };

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
        const structure = await part1aService.extractStructure(document.file || document);
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
        const result = await backendService.getRecommendations(
          collectionFiles,
          userProfile.role || 'Researcher',
          userProfile.task || 'Analyze document content'
        );
        
        // Handle new return format with session_id
        const recs = result.recommendations || result; // Support both old and new format
        const sessionId = result.session_id;
        
        setRecommendations(recs);
        
        // Store session ID for cross-document insights
        if (sessionId) {
          setCurrentSessionId(sessionId);
          console.log('📊 Stored session ID from collection analysis:', sessionId);
        }
        
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
        const result = await backendService.getRecommendations(
          [document.file],
          userProfile.role || 'Researcher',
          userProfile.task || 'Analyze document content'
        );
        
        // Handle new return format with session_id
        const recs = result.recommendations || result; // Support both old and new format
        const sessionId = result.session_id;
        
        setRecommendations(recs);
        
        // Store session ID for cross-document insights
        if (sessionId) {
          setCurrentSessionId(sessionId);
          console.log('📊 Stored session ID from document analysis:', sessionId);
        }
        
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
    
    // Store session ID for cross-document insights
    if (processedData.session_id) {
      setCurrentSessionId(processedData.session_id);
      console.log('📊 Stored session ID for cross-document analysis:', processedData.session_id);
    }
    
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

  // Handle podcast generation
  const handlePodcastGeneration = (podcastData) => {
    console.log('🎧 Podcast generated:', podcastData);
    setPodcastData(podcastData);
    setShowPodcastModal(true);
    // Clear previous audio when new podcast is generated
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // Handle audio generation from podcast script
  const handleGenerateAudio = async (ttsEngine = 'gtts', voiceSettings = null) => {
    if (!podcastData?.podcast_script) {
      console.error('No podcast script available for audio generation');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      console.log('🎵 Generating audio with engine:', ttsEngine);
      
      const audioBlob = await backendService.generatePodcastAudio(
        podcastData.podcast_script,
        ttsEngine,
        voiceSettings
      );

      if (audioBlob) {
        setAudioBlob(audioBlob);
        
        // Create URL for audio playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        console.log('✅ Audio generated successfully');
      }
    } catch (error) {
      console.error('❌ Error generating audio:', error);
      // You could show an error toast here
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Download generated audio
  const handleDownloadAudio = () => {
    if (!audioBlob) {
      console.error('No audio to download');
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load available TTS engines on component mount
  useEffect(() => {
    const loadTTSEngines = async () => {
      try {
        const engines = await backendService.getAvailableTTSEngines();
        setAvailableTTSEngines(engines);
        console.log('🎵 Available TTS engines:', engines);
      } catch (error) {
        console.error('Error loading TTS engines:', error);
      }
    };

    loadTTSEngines();
  }, []);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
        {showTutorial && (
          <InteractiveTutorial onComplete={handleTutorialComplete} />
        )}

        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}

        <Navigation 
          userProfile={userProfile}
          isProcessing={isProcessing}
          onOpenHistory={handleOpenHistory}
          onRestartTutorial={handleRestartTutorial}
        />

        <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
          <DocumentSidebar 
            id="document-sidebar"
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

            <div id="pdf-viewer" className="flex-1">
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
              id="smart-connections"
              currentDocument={currentDocument}
              recommendations={recommendations}
              currentSessionId={currentSessionId}
              isProcessing={isProcessing}
              onGetRecommendations={handleGetRecommendations}
              activeCollection={activeCollection}
              onNavigateToSection={handleNavigateToSection}
              pdfStructure={pdfStructure}
              isExtractingStructure={isExtractingStructure}
              currentSection={currentSection}
              userProfile={userProfile}
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

        {/* Podcast Button */}
        <div id="podcast-button" className="fixed bottom-6 right-6 z-40">
          <PodcastButton
            onClick={handlePodcastGeneration}
            currentDocument={currentDocument}
            selectedSection={currentSection}
            userProfile={userProfile}
            recommendations={recommendations}
            currentSessionId={currentSessionId}
          />
        </div>

        {/* Podcast Modal */}
        {showPodcastModal && podcastData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-4xl max-h-[90vh] m-4 rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Headphones className={`w-8 h-8 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {podcastData.podcast_script?.title || 'AI-Generated Podcast'}
                      </h2>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {podcastData.podcast_script?.estimated_duration || '5-7 minutes'} • 
                        {podcastData.cross_document_enhanced ? ' Enhanced Cross-Document Analysis' : ' Standard Analysis'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPodcastModal(false)}
                    className={`p-2 rounded-full transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {/* Podcast Description */}
                {podcastData.podcast_script?.description && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>About This Episode</h3>
                    <p className={`${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {podcastData.podcast_script.description}
                    </p>
                  </div>
                )}

                {/* Podcast Script */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Podcast Script</h3>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${
                      isDarkMode ? 'prose-invert' : 'prose-gray'
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {podcastData.podcast_script?.script || 'No script available'}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Key Takeaways */}
                {podcastData.podcast_script?.key_takeaways && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Key Takeaways</h3>
                    <ul className={`space-y-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {podcastData.podcast_script.key_takeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cross-Document Highlights */}
                {podcastData.podcast_script?.cross_document_highlights && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Cross-Document Insights</h3>
                    <ul className={`space-y-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {podcastData.podcast_script.cross_document_highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">🔗</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audio Generation Section */}
                <div className={`p-4 rounded-lg border-2 ${
                  audioUrl ? 'border-green-500 bg-green-50' : 'border-dashed'
                } ${
                  isDarkMode ? (audioUrl ? 'border-green-400 bg-green-900 bg-opacity-20' : 'border-gray-600 bg-gray-800') : (audioUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50')
                }`}>
                  <div className="text-center">
                    <Headphones className={`w-12 h-12 mx-auto mb-3 ${
                      audioUrl 
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                    }`} />
                    
                    {audioUrl ? (
                      // Audio player section
                      <div>
                        <h4 className={`text-lg font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Podcast Audio Ready!</h4>
                        
                        <audio 
                          controls 
                          className="w-full mb-4"
                          src={audioUrl}
                        />
                        
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            onClick={handleDownloadAudio}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            📥 Download Audio
                          </button>
                          
                          <button
                            onClick={() => {
                              setAudioBlob(null);
                              setAudioUrl(null);
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                            }`}
                          >
                            🗑️ Clear Audio
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Audio generation section
                      <div>
                        <h4 className={`text-lg font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Generate Podcast Audio</h4>
                        <p className={`text-sm mb-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Convert your podcast script to audio using text-to-speech technology.
                        </p>
                        
                        {availableTTSEngines && (
                          <div className="mb-4">
                            <p className={`text-xs mb-2 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              Available engines: {Object.entries(availableTTSEngines.available_engines)
                                .filter(([_, available]) => available)
                                .map(([engine, _]) => engine)
                                .join(', ')}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            onClick={() => handleGenerateAudio('gtts')}
                            disabled={isGeneratingAudio || !availableTTSEngines?.available_engines?.gtts}
                            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isDarkMode 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {isGeneratingAudio ? '🎵 Generating...' : '🎤 Generate with Google TTS'}
                          </button>
                          
                          <button
                            onClick={() => handleGenerateAudio('pyttsx3')}
                            disabled={isGeneratingAudio || !availableTTSEngines?.available_engines?.pyttsx3}
                            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isDarkMode 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {isGeneratingAudio ? '🎵 Generating...' : '🎧 Generate with Local TTS'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
