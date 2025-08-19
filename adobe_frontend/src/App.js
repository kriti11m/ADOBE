import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import HomePage from './components/HomePage';
import InteractiveTutorial from './components/InteractiveTutorial';
import OnboardingModal from './components/OnboardingModal';
import Navigation from './components/Navigation';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentOutline from './components/DocumentOutline';
import FinalAdobePDFViewer from './components/FinalAdobePDFViewer';
import PDFUploader from './components/PDFUploader';
import CollectionUploader from './components/CollectionUploader';
import AIAssistant from './components/AIAssistant';
import SmartConnections from './components/SmartConnections';
import DocumentManager from './components/DocumentManager';
import PodcastButton from './components/PodcastButton';
import { Headphones, FileText, Lightbulb, Sparkles, Brain, Zap } from 'lucide-react';
import backendService from './services/backendService';
import part1aService from './services/part1aService';
import documentService from './services/documentService';

// Simple Card component
const Card = ({ children, className }) => (
  <div className={`rounded-2xl border ${className}`}>
    {children}
  </div>
);

// Simple Button component
const Button = ({ children, className, ...props }) => (
  <button className={`${className}`} {...props}>
    {children}
  </button>
);

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
  // App state management
  const [showHomePage, setShowHomePage] = useState(true); // Always show home page on launch

  // Check if user has seen tutorial before
  const [showTutorial, setShowTutorial] = useState(false); // Will be triggered from home page
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
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState([]);
  const [analyzedCollectionId, setAnalyzedCollectionId] = useState(null); // Track which collection was analyzed
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [podcastData, setPodcastData] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [availableTTSEngines, setAvailableTTSEngines] = useState(null);
  
  // Finale text selection features
  const [selectedTextData, setSelectedTextData] = useState(null);
  const [relatedSections, setRelatedSections] = useState([]);
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Insights state (shared with SmartConnections)
  const [currentInsights, setCurrentInsights] = useState(null);
  
  // Floating Podcast Mode state
  const [showFloatingAudioPlayer, setShowFloatingAudioPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioPlayerRef = useRef(null);
  
  // Podcast generation options
  const [podcastVoice, setPodcastVoice] = useState('female');
  const [podcastSpeed, setPodcastSpeed] = useState(1.0);
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
  
  // Part 1A Integration - Document Structure
  const [pdfStructure, setPdfStructure] = useState(null);
  const [isExtractingStructure, setIsExtractingStructure] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  
  // Document Outline State
  const [showDocumentOutline, setShowDocumentOutline] = useState(false);
  
  // Ref for PDF viewer to control navigation
  const pdfViewerRef = useRef(null);

  // Tutorial state management
  const [tutorialSidebarTab, setTutorialSidebarTab] = useState(null);
  const [tutorialHighlightedComponent, setTutorialHighlightedComponent] = useState(null);

  // history functionality removed

  // Load documents on app start
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log('🔍 Loading documents...');
        const backendDocuments = await documentService.getAllDocuments();
        console.log('� Documents loaded:', documents);
        
        // Convert to format expected by Documents tab
        const frontendDocuments = backendDocuments.map(doc => ({
          id: doc.id,
          name: doc.original_filename,
          status: 'uploaded',
          timestamp: new Date(doc.upload_timestamp).toLocaleDateString(),
          tags: ['PDF'],
          dbDocumentId: doc.id,
          // Add URL for Adobe PDF viewer
          url: `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/documents/${doc.id}/download`
        }));
        
        // For compatibility with existing UI, convert to collections format
        const documentCollections = backendDocuments.map(doc => ({
          id: doc.id,
          title: doc.title || doc.original_filename,
          filename: doc.original_filename,
          uploadDate: doc.upload_timestamp,
          tags: ['PDF'],
          isUploaded: true,
          // Add URL for Adobe PDF viewer
          url: `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/documents/${doc.id}/download`,
          documents: [{ 
            ...doc, 
            url: `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/documents/${doc.id}/download` 
          }]
        }));
        
        // Set both arrays
        setDocuments(frontendDocuments);
        setCollections(documentCollections);
        console.log(`✅ Loaded ${backendDocuments.length} documents`);
      } catch (error) {
        console.error('Failed to load documents:', error);
        setDocuments([]);
        setCollections([]);
      }
    };

    loadDocuments();
  }, []);

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

  const handleStartFromHomePage = () => {
    setShowHomePage(false);
    setShowTutorial(true);
  };

  const handleShowHomePage = () => {
    // Reset all states to show home page
    setShowHomePage(true);
    setShowTutorial(false);
    setShowOnboarding(false);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    // Skip onboarding since we no longer need the persona selection
    // Mark tutorial as seen (first time experience completed)
    localStorage.setItem('doc-a-doodle-tutorial-seen', 'true');
    // Also mark as completed for backwards compatibility
    localStorage.setItem('doc-a-doodle-tutorial-completed', 'true');
  };

  const handleRestartTutorial = () => {
    setShowTutorial(true);
    setShowOnboarding(false);
    // Clear both tutorial flags to reset the experience
    localStorage.removeItem('doc-a-doodle-tutorial-seen');
    localStorage.removeItem('doc-a-doodle-tutorial-completed');
  };

  // Tutorial interaction handlers
  const handleTutorialShowSidebar = (tabType) => {
    setTutorialSidebarTab(tabType);
    console.log(`Tutorial: Showing sidebar tab: ${tabType}`);
  };

  const handleTutorialShowUploader = (show) => {
    setShowUploader(show);
    console.log(`Tutorial: Showing uploader: ${show}`);
  };

  const handleTutorialHighlightRightSidebar = (component) => {
    setTutorialHighlightedComponent(component);
    console.log(`Tutorial: Highlighting right sidebar component: ${component}`);
    // Clear highlight after a few seconds
    setTimeout(() => {
      setTutorialHighlightedComponent(null);
    }, 5000);
  };

  // Handler for updating recommendations from text-based analysis
  const handleUpdateRecommendations = (newRecommendations) => {
    console.log('🔄 Updating recommendations with text-based analysis results:', newRecommendations.length);
    setRecommendations(newRecommendations);
    setIsProcessing(false); // Ensure processing state is cleared
  };

  const handleOnboardingComplete = (userProfile) => {
    setShowOnboarding(false);
    setUserProfile(userProfile);
    console.log('Onboarding completed:', userProfile);
    
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
    console.log('📄 Document selected:', document);
    setCurrentDocument(document);
    
    // Don't auto-open document outline on selection - only open after Part 1A completes
    // setShowDocumentOutline(true); // Removed - will be set when structure extraction completes
    
    // If document is from a collection, ensure it's extracted properly
    if (document.fromCollection) {
      console.log('Selected document from collection:', document.name, 'from', document.fromCollection.name);
    }
    
    // Clear previous structure and start extracting for the new document
    setPdfStructure(null);
    setCurrentSection(null);
    
    // Documents from the library have URLs, uploaded documents have file objects
    if (document.file || document.url) {
      setIsExtractingStructure(true);
      try {
        const structure = await part1aService.extractStructure(document.file || document);
        setPdfStructure(structure);
        
        // Auto-open document outline when structure extraction completes
        if (structure && structure.hasStructure) {
          console.log('✅ Structure extracted successfully - opening document outline');
          setShowDocumentOutline(true);
        }
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
      
      // history check removed - always extract fresh structure
      
      // Extract fresh structure using Part 1A
      let fileForExtraction = document.file;
      
      // If this is a database document, fetch it as a blob first
      if (!fileForExtraction && document.dbDocumentId) {
        console.log(`📥 Fetching database document ${document.dbDocumentId} for structure extraction...`);
        try {
          // For now, skip fetching from database - we'll handle file uploads directly
          console.log(`⚠️ Database document fetching not implemented yet`);
          setIsExtractingStructure(false);
          return;
        } catch (error) {
          console.error('❌ Failed to fetch database document for structure extraction:', error);
          setIsExtractingStructure(false);
          return;
        }
      }
      
      if (!fileForExtraction) {
        console.error('❌ No file available for structure extraction');
        setIsExtractingStructure(false);
        return;
      }
      
      const structure = await part1aService.extractStructure(fileForExtraction);
      
      if (structure) {
        console.log('✅ Structure extracted:', structure);
        // Transform outline for navigation
        const navigationOutline = part1aService.getNavigationOutline(structure.outline);
        setPdfStructure({
          ...structure,
          outline: navigationOutline
        });
        
        // Auto-open document outline when structure extraction completes
        if (structure.hasStructure) {
          console.log('✅ Part 1A completed successfully - opening document outline');
          setShowDocumentOutline(true);
        }
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

  // Finale text selection handler
  const handleTextSelection = async (selectionData) => {
    try {
      console.log('🎯 Text selection event received:', selectionData);
      
      setSelectedTextData(selectionData);
      setRelatedSections(selectionData.relatedSections || []);
      
      // Handle specific actions
      if (selectionData?.action === 'ai-assistant') {
        console.log('🤖 AI Assistant action triggered, showing modal');
        setShowAIAssistant(true);
      } else if (selectionData?.action === 'smart-connections') {
        console.log('🔗 Smart Connections action triggered');
        // Handle smart connections logic here
      } else if (selectionData?.action === 'podcast-mode') {
        console.log('🎧 Podcast Mode action triggered');
        // Handle podcast mode logic here
      } else {
        // Default behavior for regular text selection (no specific action)
        console.log('📝 Regular text selection (no specific action)');
      }
      
    } catch (error) {
      console.error('❌ Error handling text selection:', error);
    }
  };

  // AI Assistant handlers
  const handleCloseAIAssistant = () => {
    setShowAIAssistant(false);
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
        let result;
        
        // Check if this is a database collection (has dbCollectionId)
        if (activeCollection.fromDatabase && activeCollection.dbCollectionId) {
          // Use the new collection analysis endpoint
          console.log(`🗃️ Analyzing database collection "${activeCollection.name}" (ID: ${activeCollection.dbCollectionId})`);
          result = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/part1b/analyze-collection`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              collection_id: activeCollection.dbCollectionId,
              persona: userProfile?.role || 'Researcher',
              job: userProfile?.task || 'Analyze document content',
              profile_id: 'default'
            })
          });
          
          if (!result.ok) {
            throw new Error(`HTTP error! status: ${result.status}`);
          }
          
          const data = await result.json();
          
          // Transform the result to match frontend format
          const sections = data.extracted_sections || [];
          const transformedSections = sections.slice(0, 3).map((section, index) => ({
            id: `section-${index}`,
            document: section.document,
            page: `Page ${section.page_number}`,
            section: section.section_title,
            description: `Ranked #${section.importance_rank} most relevant section for your task`,
            relevance: Math.max(85 - (section.importance_rank - 1) * 5, 70),
            color: index === 0 ? 'green' : index === 1 ? 'blue' : 'purple',
            originalData: section,
            keyPoints: section.content ? section.content.split('\n').slice(0, 3) : [section.section_title],
          }));
          
          result = {
            recommendations: transformedSections,
            session_id: data.session_id
          };
        } else {
          // Use the original file-based approach for non-database collections
          const collectionFiles = activeCollection.documents.map(doc => doc.file);
          result = await backendService.getRecommendations(
            collectionFiles,
            userProfile?.role || 'Researcher',
            userProfile?.task || 'Analyze document content',
            'default'
          );
        }
        
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
        
        console.log(`✅ Analyzed ${activeCollection.documents.length} PDFs from collection "${activeCollection.name}" - Results cached`);
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
          userProfile?.role || 'Researcher',
          userProfile?.task || 'Analyze document content',
          'default'
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

  // Load a document by its ID and navigate to a specific page
  const handleLoadDocumentAndNavigate = async (documentId, pageNumber, sectionTitle = null) => {
    try {
      console.log(`📄 Loading document ${documentId} and navigating to page ${pageNumber}`);
      
      // Find the document in our documents or collections
      let targetDocument = null;
      
      // Check documents array
      targetDocument = documents.find(doc => doc.dbDocumentId === documentId || doc.id === documentId);
      
      // If not found, check collections
      if (!targetDocument) {
        for (const collection of collections) {
          if (collection.documents) {
            targetDocument = collection.documents.find(doc => doc.id === documentId);
            if (targetDocument) {
              // Add collection info
              targetDocument = {
                ...targetDocument,
                fromCollection: collection
              };
              break;
            }
          }
        }
      }

      if (!targetDocument) {
        console.error(`Document with ID ${documentId} not found`);
        return false;
      }

      // Load the document
      await handleDocumentSelect(targetDocument);
      
      // Wait a bit for the document to load, then navigate
      setTimeout(() => {
        handleNavigateToSection(pageNumber, sectionTitle);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error loading document and navigating:', error);
      return false;
    }
  };

  const handleNavigateToSectionByTitle = (sectionTitle) => {
    if (pdfViewerRef.current && pdfViewerRef.current.navigateToSectionByTitle) {
      pdfViewerRef.current.navigateToSectionByTitle(sectionTitle);
    }
  };

  const handleCreateCollection = async (name, files) => {
    try {
      console.log(`🔨 Creating collection "${name}" with ${files.length} documents`);

      // Upload each file as a separate document
      const uploadedDocuments = [];
      for (const file of files) {
        try {
          const document = await documentService.uploadDocument(file, file.name.replace('.pdf', ''));
          uploadedDocuments.push(document);
          console.log(`✅ Uploaded document: ${document.original_filename}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        }
      }

      // Create a frontend collection representation
      const frontendCollection = {
        id: Date.now(), // Temporary ID for frontend
        title: name,
        name: name,
        documents: uploadedDocuments.map(doc => ({
          id: doc.id,
          name: doc.original_filename,
          title: doc.title,
          file: null, // File object not needed for uploaded docs
          dbDocumentId: doc.id
        })),
        uploadDate: new Date().toISOString(),
        tags: ['Collection'],
        isUploaded: true
      };

      setCollections(prev => {
        const newCollections = [frontendCollection, ...prev];
        console.log('📚 Updated collections state:', newCollections.map(c => c.name));
        return newCollections;
      });
      setActiveCollection(frontendCollection);
      setShowCollectionUploader(false);
      
      console.log(`✅ Created collection "${name}" with ${uploadedDocuments.length} documents`);
    } catch (error) {
      console.error('❌ Failed to create collection:', error);
      alert('Failed to create collection. Please try again.');
      
      // Don't fall back to local collections anymore - require backend
      setShowCollectionUploader(false);
    }
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

  const handleFileUpload = async (files) => {
    console.log('📤 Bulk file upload:', files.length, 'files');
    
    try {
      // Upload each file to backend
      const uploadedDocuments = [];
      const failedUploads = [];
      
      for (const file of Array.from(files)) {
        try {
          console.log(`📤 Uploading ${file.name}...`);
          const uploadedDoc = await documentService.uploadDocument(file, file.name.replace('.pdf', ''));
          uploadedDocuments.push(uploadedDoc);
          console.log(`✅ Uploaded ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      }
      
      console.log(`✅ Bulk upload complete: ${uploadedDocuments.length} success, ${failedUploads.length} failed`);
      
      // Show success/error message
      if (failedUploads.length > 0) {
        alert(`Uploaded ${uploadedDocuments.length} files successfully. Failed: ${failedUploads.join(', ')}`);
      } else {
        alert(`Successfully uploaded ${uploadedDocuments.length} files!`);
      }
      
      // Refresh documents from backend to update both arrays
      try {
        const allDocuments = await documentService.getAllDocuments();
        
        // Update Documents tab format
        const frontendDocuments = allDocuments.map(doc => ({
          id: doc.id,
          name: doc.original_filename,
          status: 'uploaded',
          timestamp: new Date(doc.upload_timestamp).toLocaleDateString(),
          tags: ['PDF'],
          dbDocumentId: doc.id
        }));
        
        // Update Collections format
        const documentCollections = allDocuments.map(doc => ({
          id: doc.id,
          title: doc.title || doc.original_filename,
          filename: doc.original_filename,
          uploadDate: doc.upload_timestamp,
          tags: ['PDF'],
          isUploaded: true,
          documents: [doc]
        }));
        
        // Set both arrays
        setDocuments(frontendDocuments);
        setCollections(documentCollections);
        console.log('🔄 Documents refreshed after bulk upload');
      } catch (error) {
        console.error('⚠️ Failed to refresh documents after bulk upload:', error);
      }
      
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      alert('Failed to upload files. Please try again.');
    }
  };

  const handleSinglePDFUpload = async (file) => {
    console.log('🎯 Single PDF upload:', file.name);
    
    try {
      // Upload to backend first
      console.log('📤 Uploading to backend...');
      const uploadedDocument = await documentService.uploadDocument(file, file.name.replace('.pdf', ''));
      console.log('✅ Document uploaded to backend:', uploadedDocument);
      
      // Create frontend document object
      const singleDocument = {
        id: uploadedDocument.id,
        name: uploadedDocument.original_filename,
        file: file, // Keep file for immediate viewing
        status: 'single-upload',
        timestamp: 'Just uploaded',
        tags: ['Single Upload', 'Ready'],
        dbDocumentId: uploadedDocument.id
      };
      
      // Add to documents list for immediate display
      setDocuments(prev => [singleDocument, ...prev]);
      
      // Also refresh the documents from backend to ensure sync
      try {
        const allDocuments = await documentService.getAllDocuments();
        
        // Update Documents tab format
        const frontendDocuments = allDocuments.map(doc => ({
          id: doc.id,
          name: doc.original_filename,
          status: 'uploaded',
          timestamp: new Date(doc.upload_timestamp).toLocaleDateString(),
          tags: ['PDF'],
          dbDocumentId: doc.id
        }));
        
        // Update Collections format
        const documentCollections = allDocuments.map(doc => ({
          id: doc.id,
          title: doc.title || doc.original_filename,
          filename: doc.original_filename,
          uploadDate: doc.upload_timestamp,
          tags: ['PDF'],
          isUploaded: true,
          documents: [doc]
        }));
        
        // Set both arrays
        setDocuments(frontendDocuments);
        setCollections(documentCollections);
        console.log('🔄 Documents refreshed from backend');
      } catch (error) {
        console.error('⚠️ Failed to refresh documents from backend:', error);
      }
      
      // Immediately select and open this document
      setCurrentDocument(singleDocument);
      
      // Start extracting PDF structure in background
      setIsExtractingStructure(true);
      try {
        const structure = await part1aService.extractStructure(file);
        setPdfStructure(structure);
        console.log('✅ PDF structure extracted for single upload:', structure);
      } catch (error) {
        console.error('❌ Failed to extract PDF structure:', error);
      } finally {
        setIsExtractingStructure(false);
      }
      
      console.log('✅ Single PDF uploaded and opened:', file.name);
      
    } catch (error) {
      console.error('❌ Error handling single PDF upload:', error);
      
      // Fallback: create local document if backend fails
      const singleDocument = {
        id: file.name + '_single_' + Date.now(),
        name: file.name,
        file: file,
        status: 'single-upload',
        timestamp: 'Just uploaded',
        tags: ['Single Upload', 'Local Only']
      };
      
      setDocuments(prev => [singleDocument, ...prev]);
      setCurrentDocument(singleDocument);
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

  // Floating podcast handlers
  const handleFloatingPodcastClick = async () => {
    console.log('🎧 Podcast button clicked!');
    console.log('Current state:', {
      audioUrl: !!audioUrl,
      podcastData: !!podcastData,
      selectedTextData: !!selectedTextData,
      recommendations: recommendations?.length || 0,
      currentInsights: !!currentInsights
    });
    
    if (audioUrl) {
      // If audio is available, show the floating player
      console.log('🎵 Audio available, showing player');
      setShowFloatingAudioPlayer(true);
    } else if (podcastData) {
      // If podcast script exists but no audio, open the podcast modal
      console.log('📝 Podcast data exists, showing modal');
      setShowPodcastModal(true);
    } else {
      // Generate podcast from current relevant sections and insights
      console.log('🎧 Generating new podcast...');
      await generatePodcastFromCurrentData();
    }
  };

  // Generate podcast from current relevant sections and insights
  const generatePodcastFromCurrentData = async () => {
    try {
      console.log('🎧 Starting podcast generation...');
      setIsGeneratingAudio(true); // Set loading state immediately
      
      console.log('Input data check:', {
        selectedTextData,
        recommendations: recommendations?.length || 0,
        currentInsights: !!currentInsights,
        currentDocument: currentDocument?.name
      });
      
      // Check if we have data to work with
      if (!selectedTextData && (!recommendations || recommendations.length === 0)) {
        console.warn('⚠ No text selection or recommendations available');
        alert('Please select some text first to generate relevant sections and insights, then try generating the podcast.');
        setIsGeneratingAudio(false);
        return;
      }

      // Use the original working method - get selectedText from multiple possible sources
      let selectedText = 'No text selected';
      
      // Priority order: selectedTextData, recommendations content, or fallback
      if (selectedTextData?.selectedText) {
        selectedText = selectedTextData.selectedText;
      } else if (recommendations && recommendations.length > 0) {
        // Use content from recommendations if available
        selectedText = recommendations.map(rec => rec.content || rec.text || '').join(' ').trim();
      } else if (relatedSections && relatedSections.length > 0) {
        // Use content from related sections if available
        selectedText = relatedSections.map(section => section.content || section.text || '').join(' ').trim();
      }
      
      // If still no content, use document info
      if (selectedText === 'No text selected' && currentDocument) {
        selectedText = `Analysis of document: ${currentDocument.name}`;
      }
      
      const relatedSectionData = recommendations || relatedSections || [];

      console.log('📊 Calling generateAudioOverview with:', {
        selectedText: selectedText.substring(0, 100) + '...',
        relatedSections: relatedSectionData.length,
        audioType: 'podcast'
      });

      // Call the audio overview API with podcast mode and voice options
      const audioBlob = await backendService.generateAudioOverview(
        selectedText,
        relatedSectionData,
        'podcast',  // Use podcast mode for single narrative
        3,  // 3-minute duration
        podcastVoice,  // Voice setting (male/female)
        1.0,   // Always generate at normal speed, frontend handles playback speed
        currentInsights  // Pass the generated insights
      );
      
      if (audioBlob) {
        console.log('✅ Podcast audio generated successfully');
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setShowFloatingAudioPlayer(true);
        
        // Apply current speed setting after a short delay
        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.playbackRate = podcastSpeed;
          }
        }, 100);

        // Pre-generate the other voice in background for instant switching
        const otherVoice = podcastVoice === 'female' ? 'male' : 'female';
        setTimeout(async () => {
          try {
            console.log(`🔄 Pre-generating ${otherVoice} voice for instant switching...`);
            await backendService.generateAudioOverview(
              selectedText,
              relatedSectionData,
              'podcast',
              3,
              otherVoice,
              1.0,
              currentInsights  // Pass the generated insights for pre-generation too
            );
            console.log(`✅ ${otherVoice} voice pre-generated and cached`);
          } catch (error) {
            console.log(`⚠ Failed to pre-generate ${otherVoice} voice:`, error);
          }
        }, 2000); // Start pre-generation 2 seconds after main audio is ready
      } else {
        console.error('❌ Failed to generate podcast - no audio returned');
        alert('Failed to generate podcast. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error generating podcast from current data:', error);
      alert(`Error generating podcast: ${error.message}\n\nPlease check your connection and try again.`);
    } finally {
      setIsGeneratingAudio(false); // Always reset loading state
    }
  };

  const regenerateAudioWithNewSettings = async (voice = podcastVoice, speed = podcastSpeed) => {
    try {
      setIsRegeneratingAudio(true);
      console.log('🔄 Checking cache and regenerating audio with new voice:', { voice });
      
      if (!selectedTextData && (!recommendations || recommendations.length === 0)) {
        console.warn('⚠ No text selection or recommendations available for regeneration');
        return;
      }

      // Pause current audio if playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      }

      // Use improved text selection logic - same as generatePodcastFromCurrentData
      let selectedText = 'No text selected';
      
      // Priority order: selectedTextData, recommendations content, or fallback
      if (selectedTextData?.selectedText) {
        selectedText = selectedTextData.selectedText;
      } else if (recommendations && recommendations.length > 0) {
        // Use content from recommendations if available
        selectedText = recommendations.map(rec => rec.content || rec.text || '').join(' ').trim();
      } else if (relatedSections && relatedSections.length > 0) {
        // Use content from related sections if available
        selectedText = relatedSections.map(section => section.content || section.text || '').join(' ').trim();
      }
      
      // If still no content, use document info
      if (selectedText === 'No text selected' && currentDocument) {
        selectedText = `Analysis of document: ${currentDocument.name}`;
      }
      
      const relatedSectionData = recommendations || relatedSections || [];

      // Check if audio is cached for the requested voice
      const cacheStatus = await backendService.checkAudioCache(
        selectedText,
        relatedSectionData,
        'podcast',
        3,
        currentInsights  // Pass insights for cache checking too
      );

      if (cacheStatus.cached_voices[voice]) {
        console.log(`✅ Using cached audio for ${voice} voice`);
      } else {
        console.log(`🎵 Generating new audio for ${voice} voice`);
      }

      // Call the audio overview API with new voice (speed handled by frontend)
      const audioBlob = await backendService.generateAudioOverview(
        selectedText,
        relatedSectionData,
        'podcast',  // Use podcast mode
        3,  // 3-minute duration
        voice,  // Updated voice setting
        1.0,   // Always generate at normal speed, frontend handles playback speed
        currentInsights  // Pass the generated insights
      );
      
      if (audioBlob) {
        console.log('✅ Audio available with new voice');
        // Clean up old audio URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        // Set new audio
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);
        setPodcastVoice(voice); // Update the current voice
        setAudioProgress(0);
        setCurrentTime(0);
        
        // Apply current speed setting to new audio
        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.playbackRate = speed;
          }
        }, 100);
      } else {
        console.error('❌ Failed to get audio');
        alert('Failed to get audio with new voice. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error getting audio:', error);
      alert(`Error getting audio: ${error.message}`);
    } finally {
      setIsRegeneratingAudio(false);
    }
  };

  // Handle audio seeking by clicking or dragging on progress bar
  const handleProgressBarClick = (e) => {
    if (!audioPlayerRef.current || !audioDuration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * audioDuration;
    
    audioPlayerRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setAudioProgress((newTime / audioDuration) * 100);
  };

  // Handle keyboard navigation for audio player
  const handleAudioKeyNavigation = (e) => {
    if (!audioPlayerRef.current || !audioDuration) return;
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowLeft':
      case 'j':
        e.preventDefault();
        // Skip back 10 seconds
        const newTimeBack = Math.max(0, audioPlayerRef.current.currentTime - 10);
        audioPlayerRef.current.currentTime = newTimeBack;
        setCurrentTime(newTimeBack);
        setAudioProgress((newTimeBack / audioDuration) * 100);
        break;
      case 'ArrowRight':
      case 'l':
        e.preventDefault();
        // Skip forward 10 seconds
        const newTimeForward = Math.min(audioDuration, audioPlayerRef.current.currentTime + 10);
        audioPlayerRef.current.currentTime = newTimeForward;
        setCurrentTime(newTimeForward);
        setAudioProgress((newTimeForward / audioDuration) * 100);
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Increase speed
        const currentSpeed = audioPlayerRef.current.playbackRate;
        const newSpeedUp = Math.min(2.0, currentSpeed + 0.25);
        audioPlayerRef.current.playbackRate = newSpeedUp;
        setPodcastSpeed(newSpeedUp);
        break;
      case 'ArrowDown':
        e.preventDefault();
        // Decrease speed
        const currentSpeedDown = audioPlayerRef.current.playbackRate;
        const newSpeedDown = Math.max(0.5, currentSpeedDown - 0.25);
        audioPlayerRef.current.playbackRate = newSpeedDown;
        setPodcastSpeed(newSpeedDown);
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        // Jump to percentage of audio (1 = 10%, 2 = 20%, etc.)
        const percent = parseInt(e.key) / 10;
        const jumpTime = percent * audioDuration;
        audioPlayerRef.current.currentTime = jumpTime;
        setCurrentTime(jumpTime);
        setAudioProgress((jumpTime / audioDuration) * 100);
        break;
      case '0':
        e.preventDefault();
        // Jump to beginning
        audioPlayerRef.current.currentTime = 0;
        setCurrentTime(0);
        setAudioProgress(0);
        break;
    }
  };

  const handleCloseFloatingAudioPlayer = () => {
    setShowFloatingAudioPlayer(false);
    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  const handlePlayPause = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle speed change via HTML5 audio playbackRate
  const handleSpeedChange = (speed) => {
    setPodcastSpeed(speed);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = speed;
      console.log(`🎧 Audio speed changed to ${speed}x`);
    }
  };

  // Handle voice change (this needs regeneration)
  const handleVoiceChange = async (newVoice) => {
    if (newVoice !== podcastVoice) {
      setPodcastVoice(newVoice);
      await regenerateAudioWithNewSettings(newVoice, podcastSpeed);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      const current = audioPlayerRef.current.currentTime;
      const duration = audioPlayerRef.current.duration;
      setCurrentTime(current);
      setAudioProgress((current / duration) * 100);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      setAudioDuration(audioPlayerRef.current.duration);
      // Apply current speed setting when audio loads
      audioPlayerRef.current.playbackRate = podcastSpeed;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Add keyboard event listener when audio player is shown
  useEffect(() => {
    if (showFloatingAudioPlayer) {
      const handleKeyDown = (e) => {
        // Only handle if not typing in an input field
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          handleAudioKeyNavigation(e);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showFloatingAudioPlayer, audioDuration]);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // history session loading removed

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
        {/* Show Home Page first */}
        {showHomePage && (
          <HomePage 
            onStartTutorial={handleStartFromHomePage}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Show Tutorial after home page */}
        {!showHomePage && showTutorial && (
          <InteractiveTutorial 
            onComplete={handleTutorialComplete}
            onShowSidebar={handleTutorialShowSidebar}
            onShowUploader={handleTutorialShowUploader}
            onHighlightRightSidebar={handleTutorialHighlightRightSidebar}
          />
        )}

        {/* Show Onboarding if needed (legacy) */}
        {!showHomePage && showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}

        {/* Main App UI - Always show when not on home page (tutorial will overlay on top) */}
        {!showHomePage && (
          <>
            <Navigation 
              userProfile={userProfile}
              isProcessing={isProcessing}
              onRestartTutorial={handleRestartTutorial}
              onShowHomePage={handleShowHomePage}
              onOpenDocumentManager={() => setShowDocumentManager(true)}
            />

        <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
          <DocumentSidebar 
            id="document-sidebar"
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            onFileUpload={handleFileUpload}
            onSinglePDFUpload={handleSinglePDFUpload}
            currentDocument={currentDocument}
            onShowUploader={() => setShowUploader(true)}
            collections={collections}
            activeCollection={activeCollection}
            onSelectCollection={handleSelectCollection}
            onShowCollectionUploader={() => setShowCollectionUploader(true)}
            onCollectionDocumentSelect={handleCollectionDocumentSelect}
            tutorialActiveTab={tutorialSidebarTab}
            // onLoadSession removed
          />

          <div className="flex-1 flex">
            {/* Document Outline Panel - shows when document is selected AND outline is enabled */}
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

            {/* Tutorial placeholder - only shows during tutorial */}
            {showTutorial && !showDocumentOutline && (
              <div 
                id="document-outline-placeholder" 
                className={`w-80 flex-shrink-0 border-r transition-colors duration-300 flex flex-col h-full ${
                  isDarkMode 
                    ? 'bg-gray-900/30 border-gray-700' 
                    : 'bg-gray-50/30 border-gray-200'
                }`}
              >
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Document Outline
                  </h3>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Select a document to view its structure
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className={`text-center ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Outline appears here</p>
                  </div>
                </div>
              </div>
            )}

            <div id="pdf-viewer-container" className="flex-1">
              <FinalAdobePDFViewer 
                ref={pdfViewerRef}
                selectedDocument={currentDocument}
                highlightedSections={highlightedSections}
                onDocumentLoad={handleDocumentLoad}
                onSectionSelect={handleSectionSelect}
                onSectionHighlight={handleTextSelection}
              />
            </div>

            {/* Right Sidebar - Smart Connections */}
            <SmartConnections
              currentDocument={currentDocument}
              recommendations={recommendations}
              currentSessionId={currentSessionId}
              isProcessing={isProcessing}
              onGetRecommendations={setRecommendations}
              activeCollection={activeCollection}
              onNavigateToSection={handleNavigateToSection}
              onLoadDocumentAndNavigate={handleLoadDocumentAndNavigate}
              pdfStructure={pdfStructure}
              isExtractingStructure={isExtractingStructure}
              currentSection={currentSection}
              selectedTextData={selectedTextData}
              onPodcastGeneration={handlePodcastGeneration}
              onInsightsGenerated={setCurrentInsights}
            />
          </div>
        </div>
          </>
        )}

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

        {/* Document Manager Modal */}
        {showDocumentManager && (
          <DocumentManager
            isDarkMode={isDarkMode}
            onClose={() => setShowDocumentManager(false)}
            onDocumentDeleted={(documentId, filename) => {
              console.log(`Document deleted: ${filename} (ID: ${documentId})`);
              // Refresh documents list or update state as needed
              // If the deleted document was the current document, clear it
              if (currentDocument && currentDocument.id === documentId) {
                setCurrentDocument(null);
              }
            }}
          />
        )}

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
                        
                        {availableTTSEngines && availableTTSEngines.available_engines && (
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

        {/* AI Assistant Modal */}
        <AIAssistant
          selectedTextData={selectedTextData}
          show={showAIAssistant}
          onClose={handleCloseAIAssistant}
        />

        {/* Floating Podcast Button */}
        <PodcastButton 
          onClick={handleFloatingPodcastClick}
          isVisible={true}
          selectedText={selectedTextData?.selectedText}
          recommendations={recommendations}
          relatedSections={relatedSections}
          currentDocument={currentDocument}
          selectedSection={selectedTextData}
          isGenerating={isGeneratingAudio}
          setIsGenerating={setIsGeneratingAudio}
        />

        {/* Floating Audio Player */}
        {showFloatingAudioPlayer && audioUrl && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white shadow-2xl' 
                : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
            } border rounded-2xl p-4 max-w-sm w-80`}>
              {/* Audio Player Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎧</span>
                  <div>
                    <h4 className="font-medium text-sm">AI Podcast</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseFloatingAudioPlayer}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div 
                className={`w-full h-2 rounded-full cursor-pointer mb-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
                onClick={handleProgressBarClick}
              >
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-100"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>

              {/* Audio Controls with Voice Switching */}
              <div className="flex items-center justify-between mb-3">
                {/* Left: Empty space for balance */}
                <div className="w-16"></div>
                
                {/* Center: Playback Controls Group */}
                <div className="flex items-center space-x-3">
                  {/* Skip Back */}
                  <button
                    onClick={() => {
                      const newTime = Math.max(0, currentTime - 10);
                      audioPlayerRef.current.currentTime = newTime;
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors text-sm ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    ⏮
                  </button>
                  
                  {/* Play/Pause - Perfect Circle */}
                  <button
                    onClick={handlePlayPause}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors text-xl ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    style={{ minWidth: '48px', minHeight: '48px' }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  
                  {/* Skip Forward */}
                  <button
                    onClick={() => {
                      const newTime = Math.min(audioDuration, currentTime + 10);
                      audioPlayerRef.current.currentTime = newTime;
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors text-sm ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    ⏭
                  </button>
                </div>

                {/* Right: Voice Switching */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleVoiceChange('female')}
                    disabled={isRegeneratingAudio}
                    className={`w-6 h-6 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                      podcastVoice === 'female'
                        ? (isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-600 text-white')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')
                    } ${isRegeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Female Voice"
                  >
                    ♀
                  </button>
                  <button
                    onClick={() => handleVoiceChange('male')}
                    disabled={isRegeneratingAudio}
                    className={`w-6 h-6 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                      podcastVoice === 'male'
                        ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')
                    } ${isRegeneratingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Male Voice"
                  >
                    ♂
                  </button>
                </div>
              </div>

              {/* Professional Speed Controls */}
              <div className="flex justify-center items-center space-x-1 mb-2">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
                  Speed:
                </span>
                {[0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 min-w-[45px] ${
                      podcastSpeed === speed
                        ? (isDarkMode ? 'bg-green-600 text-white shadow-md' : 'bg-green-600 text-white shadow-md')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')
                    }`}
                  >
                    {speed === 1.0 ? '1×' : `${speed}×`}
                  </button>
                ))}
              </div>

              {/* Hidden Audio Element */}
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleAudioLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
              
              {isRegeneratingAudio && (
                <div className={`absolute inset-0 rounded-2xl flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800 bg-opacity-90' : 'bg-white bg-opacity-90'
                }`}>
                  <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Switching voice...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
