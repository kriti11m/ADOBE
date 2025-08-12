import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown, ArrowLeft, ArrowUp, SkipForward, Check } from 'lucide-react';
import { useDarkMode } from '../App';

const InteractiveTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const { isDarkMode } = useDarkMode();
  const tutorialRef = useRef(null);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to ConnectPDF!',
      description: 'Your AI-powered PDF analysis companion. Let\'s take a quick tour of the amazing features that will transform how you work with documents.',
      target: null,
      position: 'center',
      arrow: null,
      highlight: null
    },
    {
      id: 'navigation',
      title: 'Smart Navigation Bar',
      description: 'Access your profile, toggle dark mode, and view processing status. Your personal command center for document analysis.',
      target: 'nav',
      position: 'bottom',
      arrow: ArrowDown,
      highlight: { enabled: true }
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode Toggle',
      description: 'Switch between light and dark themes for comfortable viewing in any lighting condition. Your eyes will thank you!',
      target: 'dark-mode-toggle',
      position: 'bottom',
      arrow: ArrowDown,
      highlight: { enabled: true }
    },
    {
      id: 'document-sidebar',
      title: 'Document Library',
      description: 'Upload PDFs, create collections, and manage your document library. Previously analyzed documents get special badges!',
      target: 'document-sidebar',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true }
    },
    {
      id: 'collections',
      title: 'Collections Tab',
      description: 'Create collections to analyze multiple related documents together. Find connections and patterns across your entire document library.',
      target: 'collections-tab',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true }
    },
    {
      id: 'history-tab',
      title: 'Analysis History Tab',
      description: 'Access your complete analysis history through the History tab in the sidebar. View past sessions, collections, and all analyzed documents with timestamps.',
      target: 'history-tab',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true }
    },
    {
      id: 'document-outline',
      title: 'Document Outline Panel',
      description: 'When you select a document, the outline panel shows the document structure, sections, and allows easy navigation through your PDF.',
      target: 'pdf-viewer',
      position: 'left',
      arrow: ArrowLeft,
      highlight: { enabled: true }
    },
    {
      id: 'upload-pdf',
      title: 'Upload PDF Features',
      description: 'Quick upload for single documents or bulk upload for building your complete library. Collections help organize related documents.',
      target: 'upload-documents',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true }
    },
    {
      id: 'smart-connections',
      title: 'Smart Connections Panel',
      description: 'Your AI assistant! Get intelligent recommendations, document structure analysis, and generate deep insights about your content.',
      target: 'smart-connections',
      position: 'left',
      arrow: ArrowLeft,
      highlight: { enabled: true }
    },
    {
      id: 'insights',
      title: 'AI-Powered Insights',
      description: 'Generate intelligent insights, recommendations, and analysis from your documents. Get deep understanding with AI assistance.',
      target: 'smart-connections',
      position: 'left',
      arrow: ArrowLeft,
      highlight: { enabled: true }
    },
    {
      id: 'podcast-button',
      title: 'Podcast Mode',
      description: 'Transform your document analysis into engaging 2-5 minute audio summaries. Perfect for learning on the go!',
      target: 'podcast-button',
      position: 'top',
      arrow: ArrowUp,
      highlight: { enabled: true }
    },
    {
      id: 'completion',
      title: 'Ready to Get Started!',
      description: 'You\'re all set! Now let\'s personalize your experience by telling us about your role and what you\'re trying to accomplish.',
      target: null,
      position: 'center',
      arrow: null,
      highlight: null
    }
  ];

  const currentStepData = tutorialSteps[currentStep];

  // Get the highlighted element's position
  useEffect(() => {
    const updateHighlight = () => {
      if (currentStepData.target && currentStepData.highlight?.enabled) {
        const element = document.querySelector(`#${currentStepData.target}`);
        console.log(`Tutorial: Looking for #${currentStepData.target}`, element);
        if (element) {
          const rect = element.getBoundingClientRect();
          const highlightData = {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          };
          console.log(`Tutorial: Highlighting element #${currentStepData.target}`, highlightData);
          setHighlightedElement(highlightData);
        } else {
          console.warn(`Tutorial: Element #${currentStepData.target} not found`);
          setHighlightedElement(null);
        }
      } else {
        setHighlightedElement(null);
      }
    };

    // Add a small delay to ensure DOM is updated
    const timer = setTimeout(updateHighlight, 200);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // Create overlay with blur and highlight
  const createOverlay = () => {
    if (!highlightedElement) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Top section - above highlighted element */}
        <div 
          className="absolute"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: `${highlightedElement.top - 8}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Left section - beside highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top - 8}px`,
            left: 0,
            width: `${highlightedElement.left - 8}px`,
            height: `${highlightedElement.height + 16}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Right section - beside highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top - 8}px`,
            left: `${highlightedElement.left + highlightedElement.width + 8}px`,
            right: 0,
            height: `${highlightedElement.height + 16}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Bottom section - below highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top + highlightedElement.height + 8}px`,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Highlight border around the clear element */}
        <div
          className="absolute rounded-lg tutorial-highlight border-3"
          style={{
            top: `${highlightedElement.top - 8}px`,
            left: `${highlightedElement.left - 8}px`,
            width: `${highlightedElement.width + 16}px`,
            height: `${highlightedElement.height + 16}px`,
            border: '3px solid #3B82F6',
            borderRadius: '8px',
            zIndex: 43
          }}
        />
        
        {/* Animated attention ring */}
        <div
          className="absolute rounded-lg border-2 border-blue-400 tutorial-spotlight"
          style={{
            top: `${highlightedElement.top - 12}px`,
            left: `${highlightedElement.left - 12}px`,
            width: `${highlightedElement.width + 24}px`,
            height: `${highlightedElement.height + 24}px`,
            opacity: 0.8,
            zIndex: 44
          }}
        />
      </div>
    );
  };

  // Calculate tooltip position based on highlighted element
  const getTooltipPosition = () => {
    const { position } = currentStepData;
    
    if (position === 'center' || !highlightedElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '500px',
        zIndex: 60
      };
    }

    let style = {
      position: 'fixed',
      maxWidth: '350px',
      zIndex: 60
    };

    const margin = 20;

    switch (position) {
      case 'top':
        style = {
          ...style,
          bottom: `${window.innerHeight - highlightedElement.top + margin}px`,
          left: `${highlightedElement.left + highlightedElement.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        break;
      case 'bottom':
        style = {
          ...style,
          top: `${highlightedElement.top + highlightedElement.height + margin}px`,
          left: `${highlightedElement.left + highlightedElement.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        break;
      case 'left':
        style = {
          ...style,
          top: `${highlightedElement.top + highlightedElement.height / 2}px`,
          right: `${window.innerWidth - highlightedElement.left + margin}px`,
          transform: 'translateY(-50%)',
        };
        break;
      case 'right':
        style = {
          ...style,
          top: `${highlightedElement.top + highlightedElement.height / 2}px`,
          left: `${highlightedElement.left + highlightedElement.width + margin}px`,
          transform: 'translateY(-50%)',
        };
        break;
    }

    // Ensure tooltip stays within viewport
    if (style.left && parseInt(style.left) + 350 > window.innerWidth) {
      style.left = `${window.innerWidth - 370}px`;
      style.transform = 'none';
    }
    if (style.right && parseInt(style.right) + 350 > window.innerWidth) {
      style.right = `${window.innerWidth - 370}px`;
      style.transform = 'none';
    }
    if (style.top && parseInt(style.top) + 200 > window.innerHeight) {
      style.top = `${window.innerHeight - 220}px`;
      style.transform = style.transform?.includes('translateX') ? 'translateX(-50%)' : 'none';
    }
    if (style.bottom && parseInt(style.bottom) + 200 > window.innerHeight) {
      style.bottom = `${window.innerHeight - 220}px`;
      style.transform = style.transform?.includes('translateX') ? 'translateX(-50%)' : 'none';
    }

    return style;
  };

  if (!isVisible) return null;

  const ArrowIcon = currentStepData.arrow;

  return (
    <>
      {/* Overlay with blur effect */}
      {createOverlay()}

      {/* Tutorial tooltip */}
      <div
        ref={tutorialRef}
        className={`fixed z-50 p-6 rounded-xl shadow-2xl transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
        }`}
        style={getTooltipPosition()}
      >
        {/* Arrow indicator */}
        {ArrowIcon && (
          <div className={`absolute ${
            currentStepData.position === 'top' ? 'top-full mt-2' :
            currentStepData.position === 'bottom' ? 'bottom-full mb-2' :
            currentStepData.position === 'left' ? 'left-full ml-2' :
            'right-full mr-2'
          } ${
            currentStepData.position === 'top' || currentStepData.position === 'bottom' 
              ? 'left-1/2 transform -translate-x-1/2' 
              : 'top-1/2 transform -translate-y-1/2'
          }`}>
            <ArrowIcon className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        )}

        {/* Step counter */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-sm font-medium ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>
          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep 
                    ? (isDarkMode ? 'bg-blue-400' : 'bg-blue-600')
                    : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className={`text-xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {currentStepData.title}
          </h3>
          <p className={`text-sm leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {currentStepData.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip Tutorial</span>
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === tutorialSteps.length - 1
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                <span>Let's Begin!</span>
              </>
            ) : (
              <>
                <span>Got it</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Fun fact for engagement */}
        {currentStep > 0 && currentStep < tutorialSteps.length - 1 && (
          <div className={`mt-4 pt-4 border-t text-xs ${
            isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            💡 <strong>Pro tip:</strong> You can always access these features from the main interface after the tutorial!
          </div>
        )}
      </div>
    </>
  );
};

export default InteractiveTutorial;
