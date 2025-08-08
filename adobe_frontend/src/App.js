import React, { useState, useEffect, createContext, useContext } from 'react';
import OnboardingModal from './components/OnboardingModal';
import Navigation from './components/Navigation';
import DocumentSidebar from './components/DocumentSidebar';
import PDFViewer from './components/PDFViewer';
import SmartConnections from './components/SmartConnections';
import PodcastButton from './components/PodcastButton';
import AudioPlayer from './components/AudioPlayer';

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
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [documents, setDocuments] = useState([
    {
      id: 'ml-research.pdf',
      name: 'ML Research Methods.pdf',
      status: 'analyzed',
      timestamp: '2 hours ago',
      tags: ['Recent', 'Analyzed']
    },
    {
      id: 'climate-models.pdf',
      name: 'Climate Model Analysis.pdf',
      status: 'analyzed',
      timestamp: 'Yesterday',
      tags: ['Analyzed']
    },
    {
      id: 'financial-trends.pdf',
      name: 'Financial Trends 2024.pdf',
      status: 'new',
      timestamp: '3 days ago',
      tags: ['New']
    }
  ]);

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
  };

  const handleFileUpload = (files) => {
    const newDocuments = Array.from(files).map(file => ({
      id: file.name,
      name: file.name,
      status: 'new',
      timestamp: 'Just now',
      tags: ['New']
    }));
    
    setDocuments(prev => [...newDocuments, ...prev]);
    
    if (userProfile.role && userProfile.task) {
      startBackgroundAnalysis();
    }
  };

  const handleAudioToggle = () => {
    setShowAudioPlayer(!showAudioPlayer);
  };

  const handlePlayPause = () => {
    setAudioPlaying(!audioPlaying);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (audioPlaying) {
      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 225) {
            setAudioPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [audioPlaying]);

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
          />

          <PDFViewer 
            currentDocument={currentDocument}
          />

          <SmartConnections 
            currentDocument={currentDocument}
          />
        </div>

        <PodcastButton onClick={handleAudioToggle} />
        
        {showAudioPlayer && (
          <AudioPlayer 
            onClose={() => setShowAudioPlayer(false)}
            onPlayPause={handlePlayPause}
            isPlaying={audioPlaying}
            progress={audioProgress}
          />
        )}
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
