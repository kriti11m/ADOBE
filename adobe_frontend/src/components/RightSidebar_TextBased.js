import React, { useState } from 'react';
import { Brain, Lightbulb, RefreshCw, ArrowLeft, Zap, Sparkles, Plus } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import SmartConnections from './SmartConnections';

const RightSidebar = ({ 
  currentDocument, 
  recommendations, 
  currentSessionId,
  isProcessing, 
  onGetRecommendations, 
  onUpdateRecommendations,
  activeCollection, 
  onNavigateToSection,
  pdfStructure,
  isExtractingStructure,
  currentSection,
  userProfile,
  currentProfile,
  tutorialHighlightedComponent,
  selectedTextData,
  relatedSections: finaleRelatedSections
}) => {
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Helper function to determine if a component should be highlighted
  const isHighlighted = (componentName) => {
    return tutorialHighlightedComponent === componentName;
  };

  // Helper function to get highlight classes
  const getHighlightClasses = (componentName) => {
    if (isHighlighted(componentName)) {
      return 'ring-4 ring-blue-400 ring-opacity-60 shadow-2xl shadow-blue-500/25 scale-105 transition-all duration-500';
    }
    return '';
  };

  const Card = ({ children, className, id }) => (
    <div id={id} className={`rounded-2xl border ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-4 p-4 overflow-y-auto">
      {/* Smart Connections - Now using the dedicated component */}
      <div className={getHighlightClasses('smart-connections')}>
        <SmartConnections
          currentDocument={currentDocument}
          recommendations={recommendations}
          currentSessionId={currentSessionId}
          isProcessing={isProcessing}
          onGetRecommendations={onGetRecommendations}
          activeCollection={activeCollection}
          onNavigateToSection={onNavigateToSection}
          pdfStructure={pdfStructure}
          isExtractingStructure={isExtractingStructure}
          currentSection={currentSection}
          selectedTextData={selectedTextData}
        />
      </div>

      {/* AI Assistant Placeholder */}
      <Card 
        id="ai-assistant"
        className={`${isDarkMode 
          ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
          : 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300/40 shadow-lg'} backdrop-blur-sm ${getHighlightClasses('ai-assistant')}`}
      >
        <div className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Assistant
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            Enhanced with Gemini LLM for intelligent document analysis and insights generation.
          </p>
        </div>
      </Card>

      {/* Podcast Mode Placeholder */}
      <Card 
        id="podcast-mode"
        className={`${isDarkMode 
          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
          : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300/40 shadow-lg'} backdrop-blur-sm ${getHighlightClasses('podcast-mode')}`}
      >
        <div className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Podcast Mode
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            Convert your document insights into audio content with multi-provider TTS integration.
          </p>
        </div>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && selectedTextData && (
        <Card className={`${isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'} backdrop-blur-sm`}
        >
          <div className="p-3">
            <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Debug: Selected Text
            </h4>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Length: {selectedTextData.selectedText?.length || 0} characters
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Preview: "{(selectedTextData.selectedText || '').substring(0, 50)}..."
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RightSidebar;
