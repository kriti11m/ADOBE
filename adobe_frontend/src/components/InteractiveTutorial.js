import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown, ArrowLeft, ArrowUp, SkipForward, Check } from 'lucide-react';
import { useDarkMode } from '../App';

// Enhanced tutorial styles with impressive animations
const tutorialStyles = `
  @keyframes tutorialPulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1);
      border-color: #3B82F6;
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.2);
      border-color: #60A5FA;
      transform: scale(1.02);
    }
  }
  
  @keyframes tutorialFadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes tutorialShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  
  @keyframes tutorialBounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0,0,0);
    }
    40%, 43% {
      transform: translate3d(0, -10px, 0);
    }
    70% {
      transform: translate3d(0, -5px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }
  
  .tutorial-tooltip {
    animation: tutorialFadeIn 0.4s ease-out;
    backdrop-filter: blur(20px);
    background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85));
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3);
  }
  
  .tutorial-tooltip-dark {
    background: linear-gradient(145deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95));
    border: 1px solid rgba(75, 85, 99, 0.3);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(75, 85, 99, 0.2);
  }
  
  .tutorial-step-indicator {
    background: linear-gradient(45deg, #3B82F6, #8B5CF6);
    background-size: 200% 200%;
    animation: tutorialShimmer 2s ease-in-out infinite;
  }
  
  .tutorial-button-primary {
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .tutorial-button-primary:hover {
    background: linear-gradient(135deg, #2563EB, #1E40AF);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
  }
  
  .tutorial-button-secondary {
    transition: all 0.3s ease;
    position: relative;
  }
  
  .tutorial-button-secondary:hover {
    transform: translateY(-1px);
  }
  
  .tutorial-progress-bar {
    background: linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899);
    background-size: 200% 100%;
    animation: tutorialShimmer 3s ease-in-out infinite;
  }
  
  .tutorial-arrow {
    animation: tutorialBounce 2s infinite;
    filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3));
  }
`;

const InteractiveTutorial = ({ 
  onComplete, 
  onShowSidebar, 
  onShowUploader, 
  onHighlightRightSidebar 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const { isDarkMode } = useDarkMode();
  const tutorialRef = useRef(null);

  // Inject tutorial styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = tutorialStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to DocuVerse! 🚀',
      description: 'Your next-generation AI-powered PDF analysis companion. Prepare to experience revolutionary document intelligence that will transform how you work with PDFs forever. Let\'s embark on this incredible journey through cutting-edge features designed to supercharge your productivity.',
      target: null,
      position: 'center',
      arrow: null,
      highlight: null,
      action: null,
      badge: 'START',
      tip: '💡 This tour will show you features that typically take hours to master!'
    },
    {
      id: 'navigation',
      title: 'Intelligent Navigation Hub 🎯',
      description: 'Your mission control center for document analysis. Access your personalized profile, seamlessly toggle between light and dark themes, and monitor real-time processing status. Every element is designed for maximum efficiency and visual appeal.',
      target: 'nav',
      position: 'bottom',
      arrow: ArrowDown,
      highlight: { enabled: true },
      action: null,
      badge: 'CORE',
      tip: '🎨 The navigation adapts to your preferences and workflow patterns'
    },
    {
      id: 'dark-mode',
      title: 'Adaptive Theme Engine 🌙',
      description: 'Switch effortlessly between stunning light and dark themes optimized for any lighting condition. Our carefully crafted themes reduce eye strain during long document analysis sessions while maintaining perfect contrast ratios for optimal readability.',
      target: 'dark-mode-toggle',
      position: 'bottom',
      arrow: ArrowDown,
      highlight: { enabled: true },
      action: null,
      badge: 'UX',
      tip: '👁️ Dark mode reduces eye strain by up to 40% during extended use'
    },
    {
      id: 'settings-menu',
      title: 'Advanced Control Center ⚙️',
      description: 'Your gateway to advanced customization and profile management. Fine-tune every aspect of your experience, manage multiple user profiles, and access powerful settings that adapt the application to your unique workflow requirements.',
      target: 'settings-toggle',
      position: 'bottom',
      arrow: ArrowDown,
      highlight: { enabled: true },
      action: null,
      badge: 'PRO',
      tip: '🔧 Over 25+ customizable settings to personalize your experience'
    },
    {
      id: 'document-sidebar',
      title: 'Smart Document Library 📚',
      description: 'Your intelligent document ecosystem. Upload PDFs with lightning speed, create organized collections, and manage your entire document library with AI-powered categorization. Previously analyzed documents receive special recognition badges for instant identification.',
      target: 'documents-tab',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true },
      action: { type: 'showSidebar', value: 'documents' },
      badge: 'SMART',
      tip: '🏆 Smart badges help you instantly identify processed documents'
    },
    {
      id: 'upload-pdf',
      title: 'Revolutionary Upload System ⚡',
      description: 'Experience next-generation file processing with support for single documents or massive bulk uploads. Our intelligent system automatically organizes documents and creates searchable collections.',
      target: 'single-upload-tab',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true },
      action: { type: 'showSidebar', value: 'single-upload' },
      badge: 'FAST',
      tip: '📊 Bulk upload up to 100 PDFs with smart categorization'
    },
    {
      id: 'upload-documents',
      title: 'Drag & Drop Magic Zone 🎪',
      description: 'Simply drag and drop your PDFs or click to browse. Our advanced processing engine handles multiple formats while extracting maximum intelligence.',
      target: 'upload-documents',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true },
      action: { type: 'showUploader' },
      badge: 'MAGIC',
      tip: '🎯 AI extracts metadata and insights during upload'
    },
    {
      id: 'smart-connections',
      title: 'AI Intelligence Hub 🧠',
      description: 'Meet your AI-powered research assistant! Generate intelligent recommendations, perform deep document structure analysis, and discover hidden connections across your entire document library. This is where artificial intelligence meets human intuition.',
      target: 'smart-connections-panel',
      position: 'left',
      arrow: ArrowLeft,
      highlight: { enabled: true },
      action: { type: 'closeUploader', component: 'smart-connections' },
      badge: 'AI',
      tip: '🔍 AI analyzes over 50+ document features to provide intelligent insights'
    },
    {
      id: 'insights-generator',
      title: 'AI Insights Generator 💡',
      description: 'Click the lightbulb icon to generate comprehensive AI insights! This powerful feature analyzes your selected text and creates detailed takeaways, interesting facts, contradictions, and examples. Perfect for deep research and understanding complex documents.',
      target: 'insights-lightbulb-toggle',
      position: 'left',
      arrow: ArrowLeft,
      highlight: { enabled: true },
      action: { type: 'highlightRightSidebar', component: 'insights-lightbulb' },
      badge: 'INSIGHTS',
      tip: '💡 The lightbulb icon switches to the AI Insights view where magic happens!'
    },

    {
      id: 'podcast-mode',
      title: 'Audio Intelligence Revolution 🎧',
      description: 'Transform complex document analysis into engaging 2-5 minute audio summaries perfect for multitasking. Listen while commuting, exercising, or working on other tasks. Your documents become podcasts with professional narration and intelligent pacing.',
      target: 'podcast-button',
      position: 'top',
      arrow: ArrowDown,
      highlight: { enabled: true },
      action: { type: 'highlightRightSidebar', component: 'podcast-mode' },
      badge: 'AUDIO',
      tip: '🎵 Choose from multiple voice options and playback speeds for optimal listening'
    },
    {
      id: 'pdf-viewer',
      title: 'Next-Gen PDF Experience 📄',
      description: 'Experience PDFs like never before with our intelligent viewer featuring advanced text selection, precision zoom controls, and real-time highlighting for cross-document analysis. Every interaction is designed for maximum productivity and visual clarity.',
      target: 'pdf-viewer-container',
      position: 'top',
      arrow: ArrowDown,
      highlight: { enabled: true },
      action: null,
      badge: 'VIEW',
      tip: '🔍 Advanced rendering engine ensures crisp text at any zoom level'
    },
    {
      id: 'text-selection',
      title: 'Semantic Text Intelligence 🎯',
      description: 'Select any text to instantly discover related content across your entire document collection. Our AI understands context, meaning, and relationships to surface the most relevant information using advanced semantic matching algorithms.',
      target: 'pdf-viewer-container',
      position: 'bottom',
      arrow: ArrowUp,
      highlight: { enabled: true },
      action: null,
      badge: 'SMART',
      tip: '⚡ AI processes text selection in under 200ms for instant results'
    },

    {
      id: 'collections',
      title: 'Smart Document Ecosystems 🌟',
      description: 'Organize related documents into intelligent collections that enable comprehensive cross-document analysis and deep insights. Perfect for research projects and legal cases.',
      target: 'documents-tab',
      position: 'right',
      arrow: ArrowRight,
      highlight: { enabled: true },
      action: { type: 'showSidebar', value: 'documents' },
      badge: 'ORGANIZE',
      tip: '🔗 Collections auto-suggest related documents'
    },

    {
      id: 'completion',
      title: 'Welcome to the Future of Document Analysis! 🎉',
      description: 'Congratulations! You\'re now equipped with revolutionary AI-powered tools that will transform your document workflow forever. Start by uploading your first PDF to begin experiencing the magic of intelligent document analysis. The future of productivity starts now!',
      target: null,
      position: 'center',
      arrow: null,
      highlight: null,
      action: null,
      badge: 'READY',
      tip: '🚀 You\'re now ready to analyze documents 10x faster than traditional methods!'
    }
  ];

  const currentStepData = tutorialSteps[currentStep];

  // Get the highlighted element's position and handle step actions
  useEffect(() => {
    const updateHighlight = () => {
      if (currentStepData.target) {
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
          
          // Scroll element into view if needed
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        } else {
          console.warn(`Tutorial: Element #${currentStepData.target} not found`);
          setHighlightedElement(null);
        }
      } else {
        setHighlightedElement(null);
      }
    };

    // Handle step actions
    const handleStepAction = () => {
      if (currentStepData.action) {
        const { type, value, component } = currentStepData.action;
        
        switch (type) {
          case 'showSidebar':
            if (onShowSidebar) {
              onShowSidebar(value);
            }
            break;
          case 'showUploader':
            if (onShowUploader) {
              onShowUploader(true);
            }
            break;
          case 'closeUploader':
            if (onShowUploader) {
              onShowUploader(false);
            }
            // Also highlight right sidebar if component is specified
            if (component && onHighlightRightSidebar) {
              setTimeout(() => {
                onHighlightRightSidebar(component);
              }, 100);
            }
            break;
          case 'highlightRightSidebar':
            if (onHighlightRightSidebar) {
              onHighlightRightSidebar(component);
            }
            break;
          default:
            break;
        }
      }
    };

    // Add a small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      updateHighlight();
      handleStepAction();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData, onShowSidebar, onShowUploader, onHighlightRightSidebar]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
    // For center-positioned steps (like welcome), show full-screen overlay with balanced backdrop
    if (currentStepData.position === 'center' || !highlightedElement) {
      return (
        <div 
          className="fixed inset-0 pointer-events-none z-[60]"
          style={{
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.85)' 
              : 'rgba(0, 0, 0, 0.80)',
            backdropFilter: 'blur(4px)'
          }}
        />
      );
    }

    // For targeted steps, show spotlight overlay with improved contrast
    return (
      <div className="fixed inset-0 pointer-events-none z-[60]">
        {/* Top section - above highlighted element */}
        <div 
          className="absolute"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: `${highlightedElement.top - 12}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.85)' 
              : 'rgba(0, 0, 0, 0.80)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Left section - beside highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top - 12}px`,
            left: 0,
            width: `${highlightedElement.left - 12}px`,
            height: `${highlightedElement.height + 24}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.85)' 
              : 'rgba(0, 0, 0, 0.80)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Right section - beside highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top - 12}px`,
            left: `${highlightedElement.left + highlightedElement.width + 12}px`,
            right: 0,
            height: `${highlightedElement.height + 24}px`,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.85)' 
              : 'rgba(0, 0, 0, 0.80)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Bottom section - below highlighted element */}
        <div 
          className="absolute"
          style={{
            top: `${highlightedElement.top + highlightedElement.height + 12}px`,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode 
              ? 'rgba(0, 0, 0, 0.85)' 
              : 'rgba(0, 0, 0, 0.80)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Highlight border around the clear element */}
        <div
          className="absolute rounded-lg tutorial-highlight"
          style={{
            top: `${highlightedElement.top - 12}px`,
            left: `${highlightedElement.left - 12}px`,
            width: `${highlightedElement.width + 24}px`,
            height: `${highlightedElement.height + 24}px`,
            border: '4px solid #3B82F6',
            borderRadius: '12px',
            zIndex: 65,
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1)',
            animation: 'tutorialPulse 2s infinite'
          }}
        />
        
        {/* Inner highlight glow */}
        <div
          className="absolute rounded-lg"
          style={{
            top: `${highlightedElement.top - 8}px`,
            left: `${highlightedElement.left - 8}px`,
            width: `${highlightedElement.width + 16}px`,
            height: `${highlightedElement.height + 16}px`,
            border: '2px solid rgba(59, 130, 246, 0.6)',
            borderRadius: '8px',
            zIndex: 66,
            background: 'rgba(59, 130, 246, 0.05)'
          }}
        />
        
        {/* Animated attention ring */}
        <div
          className="absolute rounded-lg border-2 border-blue-400 tutorial-spotlight"
          style={{
            top: `${highlightedElement.top - 16}px`,
            left: `${highlightedElement.left - 16}px`,
            width: `${highlightedElement.width + 32}px`,
            height: `${highlightedElement.height + 32}px`,
            opacity: 0.7,
            zIndex: 44
          }}
        />
      </div>
    );
  };

  // Smart tooltip positioning that adapts to screen space
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

    const tooltipWidth = 400;
    const tooltipHeight = 320; // Approximate height including padding
    const margin = 20;
    const padding = 15;
    
    // Screen boundaries
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Element boundaries
    const elementCenterX = highlightedElement.left + highlightedElement.width / 2;
    const elementCenterY = highlightedElement.top + highlightedElement.height / 2;
    
    let style = {
      position: 'fixed',
      zIndex: 70
    };

    // Calculate available space in each direction
    const spaceAbove = highlightedElement.top;
    const spaceBelow = screenHeight - (highlightedElement.top + highlightedElement.height);
    const spaceLeft = highlightedElement.left;
    const spaceRight = screenWidth - (highlightedElement.left + highlightedElement.width);
    
    // Smart position selection based on available space and preferred position
    let finalPosition = position;
    
    // If preferred position doesn't have enough space, find the best alternative
    if ((position === 'top' && spaceAbove < tooltipHeight + margin) ||
        (position === 'bottom' && spaceBelow < tooltipHeight + margin) ||
        (position === 'left' && spaceLeft < tooltipWidth + margin) ||
        (position === 'right' && spaceRight < tooltipWidth + margin)) {
      
      // Find position with most space
      const spaces = [
        { pos: 'bottom', space: spaceBelow },
        { pos: 'top', space: spaceAbove },
        { pos: 'right', space: spaceRight },
        { pos: 'left', space: spaceLeft }
      ];
      
      spaces.sort((a, b) => b.space - a.space);
      finalPosition = spaces[0].pos;
    }

    // Position the tooltip based on final calculated position
    switch (finalPosition) {
      case 'top':
        style.bottom = `${screenHeight - highlightedElement.top + margin}px`;
        style.left = `${Math.max(padding, Math.min(elementCenterX - tooltipWidth/2, screenWidth - tooltipWidth - padding))}px`;
        break;
        
      case 'bottom':
        style.top = `${highlightedElement.top + highlightedElement.height + margin}px`;
        style.left = `${Math.max(padding, Math.min(elementCenterX - tooltipWidth/2, screenWidth - tooltipWidth - padding))}px`;
        break;
        
      case 'left':
        style.right = `${screenWidth - highlightedElement.left + margin}px`;
        style.top = `${Math.max(padding, Math.min(elementCenterY - tooltipHeight/2, screenHeight - tooltipHeight - padding))}px`;
        break;
        
      case 'right':
        style.left = `${highlightedElement.left + highlightedElement.width + margin}px`;
        style.top = `${Math.max(padding, Math.min(elementCenterY - tooltipHeight/2, screenHeight - tooltipHeight - padding))}px`;
        break;
    }

    // Final viewport boundary checks and corrections
    if (style.left !== undefined) {
      const leftPos = parseInt(style.left);
      if (leftPos < padding) style.left = `${padding}px`;
      if (leftPos + tooltipWidth > screenWidth - padding) {
        style.left = `${screenWidth - tooltipWidth - padding}px`;
      }
    }
    
    if (style.right !== undefined) {
      const rightPos = parseInt(style.right);
      if (rightPos < padding) style.right = `${padding}px`;
    }
    
    if (style.top !== undefined) {
      const topPos = parseInt(style.top);
      if (topPos < padding) style.top = `${padding}px`;
      if (topPos + tooltipHeight > screenHeight - padding) {
        style.top = `${screenHeight - tooltipHeight - padding}px`;
      }
    }
    
    if (style.bottom !== undefined) {
      const bottomPos = parseInt(style.bottom);
      if (bottomPos < padding) style.bottom = `${padding}px`;
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
        className={`fixed z-[70] p-6 rounded-2xl shadow-2xl transition-all duration-500 ${
          isDarkMode 
            ? 'tutorial-tooltip-dark text-white' 
            : 'tutorial-tooltip text-gray-900'
        }`}
        style={{
          ...getTooltipPosition(),
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
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

        {/* Progress header with enhanced visual elements */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`text-sm font-bold px-3 py-1 rounded-full text-white tutorial-step-indicator ${
              isDarkMode ? 'text-white' : 'text-white'
            }`}>
              Step {currentStep + 1} of {tutorialSteps.length}
            </div>
            {currentStepData.badge && (
              <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                currentStepData.badge === 'AI' ? 'bg-purple-100 text-purple-800' :
                currentStepData.badge === 'SMART' ? 'bg-green-100 text-green-800' :
                currentStepData.badge === 'PRO' ? 'bg-yellow-100 text-yellow-800' :
                currentStepData.badge === 'FAST' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {currentStepData.badge}
              </div>
            )}
          </div>
          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'tutorial-progress-bar w-6'
                    : index < currentStep
                    ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Enhanced title with gradient and emoji */}
        <h3 className={`text-2xl font-bold mb-4 leading-tight ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {currentStepData.title}
        </h3>

        {/* Rich description */}
        <p className={`text-base leading-relaxed mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {currentStepData.description}
        </p>

        {/* Pro tip section */}
        {currentStepData.tip && (
          <div className={`p-4 rounded-xl mb-6 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30' 
              : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
          }`}>
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              {currentStepData.tip}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors shadow-lg whitespace-nowrap ${
              currentStep === tutorialSteps.length - 1
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
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
            💡 <strong>Pro tip:</strong> Use the Previous button if you want to review a step, or access these features from the main interface after the tutorial!
          </div>
        )}
      </div>
    </>
  );
};

export default InteractiveTutorial;
