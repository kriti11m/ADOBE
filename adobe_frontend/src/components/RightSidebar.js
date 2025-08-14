import React, { useState } from 'react';
import { Brain, Lightbulb, RefreshCw, ArrowLeft, Zap, Sparkles, Plus } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const RightSidebar = ({ 
  currentDocument, 
  recommendations, 
  currentSessionId,
  isProcessing, 
  onGetRecommendations, 
  activeCollection, 
  onNavigateToSection,
  pdfStructure,
  isExtractingStructure,
  currentSection,
  userProfile,
  currentProfile,
  tutorialHighlightedComponent
}) => {
  const [smartConnectionsView, setSmartConnectionsView] = useState('bulb'); // 'bulb', 'connections'
  const [generatedInsights, setGeneratedInsights] = useState(null);
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

  const relatedSections = recommendations || [];

  const handleSmartConnectionsClick = () => {
    if (activeCollection) {
      console.log(`🔍 Getting recommendations for collection: ${activeCollection.name}`);
      onGetRecommendations(activeCollection);
    } else if (currentDocument) {
      console.log(`🔍 Getting recommendations for document: ${currentDocument.name}`);
      onGetRecommendations(currentDocument);
    }
    setSmartConnectionsView('connections');
  };

  const handleJumpToSection = (section) => {
    console.log('🔄 RightSidebar: Jump to section clicked:', section);
    if (onNavigateToSection && section.page) {
      const pageNumber = parseInt(section.page.replace('Page ', ''));
      console.log(`🔄 RightSidebar: Parsed page number ${pageNumber} for section "${section.section}"`);
      onNavigateToSection(pageNumber, section.section);
    }
  };

  const handleGenerateInsights = async () => {
    if (!recommendations || recommendations.length === 0) {
      setInsightsError('No recommendations available. Please run Smart Connections first.');
      return;
    }

    const hasProfile = currentProfile?.persona && currentProfile?.job_description || 
                      userProfile?.role && userProfile?.task;
    
    if (!hasProfile) {
      setInsightsError(currentProfile ? 
        'Profile information is incomplete. Please update your profile in settings.' :
        'Please select a profile or complete the onboarding to generate insights.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);

    try {
      const persona = currentProfile?.persona || userProfile?.role || '';
      const task = currentProfile?.job_description || userProfile?.task || '';

      const insights = await backendService.generateInsights(
        recommendations,
        persona,
        task,
        currentSessionId
      );

      if (insights) {
        setGeneratedInsights(insights);
      } else {
        setInsightsError('Failed to generate insights. Please try again.');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsError('An error occurred while generating insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const Card = ({ children, className }) => (
    <div className={`rounded-2xl border ${className}`}>
      {children}
    </div>
  );

  const Button = ({ children, className, onClick, disabled }) => (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  const renderSmartConnections = () => {
    if (smartConnectionsView === 'connections') {
      return (
        <Card className={`${isDarkMode 
          ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
          : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300/40 shadow-lg'} backdrop-blur-sm h-full flex flex-col`}>
          <div className={`p-3 border-b ${isDarkMode ? 'border-yellow-500/20' : 'border-yellow-300/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSmartConnectionsView('bulb')}
                className={`flex items-center space-x-2 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300`}
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="text-xs">Back</span>
              </button>
              <div className="flex items-center space-x-2">
                <Lightbulb className={`w-3 h-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Related Sections</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isProcessing ? (
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <RefreshCw className={`w-5 h-5 animate-spin mb-2 mx-auto ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>Finding relevant sections...</p>
                </div>
              </div>
            ) : relatedSections.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-xl mb-2 mx-auto flex items-center justify-center shadow-xl border ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border-white/10' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200'
                  }`}>
                    <span className="text-lg">🔍</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    {currentDocument 
                      ? 'No relevant sections found. Try uploading more documents.'
                      : 'Select a document to find relevant sections'
                    }
                  </p>
                </div>
              </div>
            ) : (
              relatedSections.map((section, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] ${
                    isDarkMode 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-gray-200 bg-white/80 hover:bg-white/90'
                  }`}
                  onClick={() => handleJumpToSection(section)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`text-xs px-2 py-1 rounded-full border ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30' 
                        : 'bg-gradient-to-r from-yellow-200/60 to-orange-200/60 text-yellow-700 border-yellow-400/40'
                    }`}>
                      {section.page || 'Page ?'}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode 
                        ? 'text-white/50 bg-white/5' 
                        : 'text-gray-600 bg-gray-100/60'
                    }`}>
                      {(section.similarity * 100).toFixed(0)}% match
                    </div>
                  </div>
                  <h4 className={`font-semibold text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {section.section || 'Untitled Section'}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    {section.text?.length > 100 
                      ? section.text.substring(0, 100) + '...'
                      : section.text || 'No preview available'
                    }
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      );
    }

    // Default bulb view
    return (
      <Card 
        id="smart-connections"
        className={`${isDarkMode 
          ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
          : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300/40 shadow-lg'} backdrop-blur-sm ${getHighlightClasses('smart-connections')}`}
      >
        <div className="p-4 text-center">
          <button 
            onClick={handleSmartConnectionsClick}
            disabled={!activeCollection && !currentDocument || isProcessing}
            className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25 transition-all duration-300 ${
              (!activeCollection && !currentDocument) || isProcessing
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-110 hover:shadow-yellow-500/40 hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Lightbulb className="w-6 h-6 text-white animate-pulse" />
            )}
          </button>
          
          <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Smart Connections</h3>
          
          <p className={`${isDarkMode ? 'text-white/70' : 'text-gray-700'} text-xs mb-3 leading-relaxed`}>
            Create a collection or select a document to discover relevant sections
          </p>
          
          {(!activeCollection && !currentDocument) && (
            <div className={`text-xs mb-3 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
              Upload documents or create a collection first
            </div>
          )}

          <div className={`flex items-center justify-center gap-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} text-xs`}>
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered Analysis</span>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className={`w-80 border-l ${isDarkMode ? 'border-white/10 backdrop-blur-xl bg-white/5' : 'border-gray-200/60 backdrop-blur-xl bg-white/60 shadow-sm'} p-4 h-full overflow-y-auto`}>
      <div className="space-y-4">
        {/* Smart Connections */}
        {renderSmartConnections()}

        {/* AI Features */}
        <Card 
          id="ai-assistant"
          className={`${isDarkMode 
            ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
            : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300/40 shadow-lg'} backdrop-blur-sm ${getHighlightClasses('ai-assistant')}`}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Assistant</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                <Zap className={`w-3 h-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                <span>Document Summarization</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                <Zap className={`w-3 h-3 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
                <span>Key Insights Extraction</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                <Zap className={`w-3 h-3 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                <span>Cross-Document Analysis</span>
              </div>
            </div>

            <Button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights || (!recommendations || recommendations.length === 0)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
                isGeneratingInsights || (!recommendations || recommendations.length === 0)
                  ? (isDarkMode ? 'bg-white/10 text-white/40' : 'bg-gray-200 text-gray-400') + ' cursor-not-allowed'
                  : (isDarkMode 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25') + ' hover:scale-105 hover:shadow-xl'
              }`}
            >
              {isGeneratingInsights ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-3 h-3" />
                  <span>Generate Insights</span>
                </div>
              )}
            </Button>

            {insightsError && (
              <div className={`mt-3 text-xs rounded-lg p-2 backdrop-blur-sm ${
                isDarkMode 
                  ? 'text-red-300 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20' 
                  : 'text-red-700 bg-gradient-to-r from-red-100/80 to-pink-100/80 border border-red-300/40'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-red-400' : 'bg-red-500'}`}></div>
                  {insightsError}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Podcast Mode */}
        <Button 
          id="podcast-mode"
          className={`w-full py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white' 
              : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800'
          } ${getHighlightClasses('podcast-mode')}`}
        >
          <div className="flex items-center gap-2 justify-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-white/20' : 'bg-gray-400/30'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isDarkMode ? 'bg-white' : 'bg-gray-600'
              }`}></div>
            </div>
            <span className="font-medium text-sm">Podcast Mode</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default RightSidebar;
