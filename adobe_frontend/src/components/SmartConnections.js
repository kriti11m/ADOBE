import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import TableOfContents from './TableOfContents';

const SmartConnections = ({ 
  currentDocument, 
  recommendations, 
  currentSessionId, // Add session ID prop
  isProcessing, 
  onGetRecommendations, 
  activeCollection, 
  onNavigateToSection,
  pdfStructure,
  isExtractingStructure,
  currentSection,
  userProfile // Add userProfile prop
}) => {
  const [view, setView] = useState('bulb'); // 'bulb', 'connections', 'insights'
  const [selectedSection, setSelectedSection] = useState(null);
  const [generatedInsights, setGeneratedInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

  // Generate insights from Part 1B recommendations
  const handleGenerateInsights = async () => {
    if (!recommendations || recommendations.length === 0) {
      setInsightsError('No recommendations available. Please run Smart Connections first.');
      return;
    }

    if (!userProfile || !userProfile.role || !userProfile.task) {
      setInsightsError('User profile is required to generate insights.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating insights from recommendations:', recommendations);
      console.log('🔄 Using user profile:', userProfile);
      
      const response = await backendService.generateInsightsFromRecommendations(
        recommendations,
        userProfile.role,
        userProfile.task,
        currentSessionId // Pass session ID for cross-document analysis
      );
      
      console.log('✅ Generated insights response:', response);
      
      // Extract insights from the response (backend returns {insights: {...}, metadata: {...}})
      const insights = response.insights || response;
      console.log('✅ Extracted insights:', insights);
      
      setGeneratedInsights(insights);
      setView('insights');
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setInsightsError('Failed to generate insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Generate insights from a single section
  const handleGenerateSectionInsights = async (section) => {
    if (!userProfile || !userProfile.role || !userProfile.task) {
      setInsightsError('User profile is required to generate insights.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating insights from single section:', section);
      console.log('🔄 Using user profile:', userProfile);
      
      const response = await backendService.generateInsightsFromRecommendations(
        [section], // Pass only the selected section
        userProfile.role,
        userProfile.task,
        currentSessionId // Pass session ID for cross-document analysis
      );
      
      console.log('✅ Generated section insights response:', response);
      
      // Extract insights from the response
      const insights = response.insights || response;
      console.log('✅ Extracted section insights:', insights);
      
      setGeneratedInsights(insights);
      setView('insights');
      
    } catch (error) {
      console.error('❌ Error generating section insights:', error);
      setInsightsError('Failed to generate insights for this section. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSmartConnectionsClick = () => {
    if (activeCollection || (currentDocument && onGetRecommendations)) {
      onGetRecommendations(currentDocument);
    }
    setView('connections');
  };

  // Determine the context - individual document or collection
  const isCollectionContext = activeCollection && activeCollection.documents.length > 1;
  const isIndividualContext = currentDocument && !activeCollection;

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setView('snippet');
    // Navigate to section in PDF with title for highlighting
    if (onNavigateToSection && section.page) {
      const pageNumber = parseInt(section.page.replace('Page ', ''));
      onNavigateToSection(pageNumber, section.section);
    }
  };

  const handleJumpToSection = (section) => {
    console.log('🔄 SmartConnections: Jump to section clicked:', section);
    if (onNavigateToSection && section.page) {
      const pageNumber = parseInt(section.page.replace('Page ', ''));
      console.log(`🔄 SmartConnections: Parsed page number ${pageNumber} for section "${section.section}"`);
      // Pass both page number and section title for enhanced navigation
      onNavigateToSection(pageNumber, section.section);
    } else {
      console.warn('⚠️ SmartConnections: No navigation handler or page info missing:', {
        hasHandler: !!onNavigateToSection,
        hasPage: !!section.page,
        section
      });
    }
  };

  const insights = [
    {
      type: 'key',
      title: 'Key Insights',
      icon: '🔑',
      color: 'blue',
      items: [
        'AI-powered analysis identifies relevant sections',
        'Sentence transformers provide semantic understanding',
        'DistilGPT-2 enhances content relevance scoring'
      ]
    },
    {
      type: 'did-you-know',
      title: 'Did You Know?',
      icon: '💭',
      color: 'yellow',
      content: 'Your persona and task preferences help our AI find the most relevant sections across all your documents.'
    },
    {
      type: 'inspiration',
      title: 'Smart Analysis',
      icon: '✨',
      color: 'green',
      content: 'The system analyzes document structure and content to provide contextually relevant recommendations.'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: isDarkMode 
        ? 'bg-blue-900/50 border-blue-700 text-blue-300 hover:bg-blue-800/50' 
        : 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
      green: isDarkMode 
        ? 'bg-green-900/50 border-green-700 text-green-300 hover:bg-green-800/50' 
        : 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100',
      purple: isDarkMode 
        ? 'bg-purple-900/50 border-purple-700 text-purple-300 hover:bg-purple-800/50' 
        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
      yellow: isDarkMode 
        ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300 hover:bg-yellow-800/50' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-900 hover:bg-yellow-100',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getTextColorClasses = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'text-blue-200' : 'text-blue-800',
      green: isDarkMode ? 'text-green-200' : 'text-green-800',
      purple: isDarkMode ? 'text-purple-200' : 'text-purple-800',
      yellow: isDarkMode ? 'text-yellow-200' : 'text-yellow-800',
    };
    return colorMap[color] || colorMap.blue;
  };

  // Main view - always show bulb, outline is now in separate panel
  if (view === 'bulb') {
    return (
      <div id="smart-connections" className={`w-80 p-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <div className="text-center px-4">
            <button 
              onClick={handleSmartConnectionsClick}
              disabled={!activeCollection && !currentDocument || isProcessing}
              className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center transition-all duration-300 hover:scale-110 mx-auto ${
                (!activeCollection && !currentDocument) || isProcessing
                  ? isDarkMode 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <span className="text-2xl">💡</span>
              )}
            </button>
            <h3 className={`font-medium text-sm mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {isCollectionContext ? '🔬 Research Analysis' : isIndividualContext ? '📖 Document Analysis' : 'Smart Connections'}
            </h3>
            <p className={`text-xs leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {!activeCollection && !currentDocument 
                ? 'Create a collection or select a document to discover relevant sections' 
                : isProcessing
                  ? activeCollection
                    ? `Analyzing ${activeCollection.documents.length} documents for cross-document insights...`
                    : 'Analyzing document sections...'
                  : isCollectionContext
                    ? `Click to analyze ${activeCollection.documents.length} documents for comparative insights and cross-references`
                    : isIndividualContext
                    ? `Click to analyze "${currentDocument.name}" and find key relevant sections`
                    : 'Click to discover relevant sections using AI analysis'
              }
            </p>
            {relatedSections.length > 0 && (
              <div className={`mt-3 text-xs px-2 py-1 rounded ${
                isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
              }`}>
                {isCollectionContext 
                  ? `${relatedSections.length} cross-document insights found`
                  : `${relatedSections.length} relevant sections found`
                }
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connections view
  if (view === 'connections') {
    return (
      <div id="recommendations" className={`w-80 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      } flex-shrink-0`}>
        <div className={`p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Related Sections</h3>
            <button 
              onClick={() => setView('bulb')}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Top 3 AI-ranked relevant sections</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isProcessing ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <RefreshCw className={`w-6 h-6 animate-spin mb-2 mx-auto ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Finding relevant sections...</p>
              </div>
            </div>
          ) : relatedSections.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mb-3 mx-auto flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl">🔍</span>
                </div>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {currentDocument 
                    ? 'No relevant sections found. Try uploading more documents.'
                    : 'Select a document to find relevant sections'
                  }
                </p>
              </div>
            </div>
          ) : (
            relatedSections.slice(0, 3).map((section, index) => (
              <div 
                key={section.id}
                className={`related-item border rounded-lg p-3 transition-colors ${getColorClasses(section.color)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm truncate">{section.document}</h4>
                  <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                    {/* Lightbulb icon for generating section insights */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSectionInsights(section);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-yellow-800 text-yellow-400 hover:text-yellow-300' 
                          : 'hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700'
                      }`}
                      title="Generate insights for this section"
                      disabled={isGeneratingInsights}
                    >
                      {isGeneratingInsights ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                        </svg>
                      )}
                    </button>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {section.page}
                    </span>
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded mr-2 ${
                    index === 0 
                      ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                      : index === 1
                        ? isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                        : isDarkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                  }`}>
                    #{index + 1} Most Relevant
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    section.relevance >= 80 
                      ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                      : isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {section.relevance}% match
                  </span>
                </div>
                <h5 className="font-medium text-sm mb-1">{section.section}</h5>
                <p className="text-xs leading-relaxed mb-3 line-clamp-3">{section.description}</p>
                <div className="flex items-center justify-between space-x-2">
                  <button 
                    onClick={() => handleSectionClick(section)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      isDarkMode 
                        ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white' 
                        : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    View Snippet
                  </button>
                  <button 
                    onClick={() => handleJumpToSection(section)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      isDarkMode 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Jump to Section
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`p-3 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button 
            id="insights-button"
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights}
            className={`w-full text-xs py-2 px-3 rounded transition-colors ${
              isGeneratingInsights ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {isGeneratingInsights ? (
              <div className="flex items-center justify-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              '💡 Generate AI Insights'
            )}
          </button>
          
          {insightsError && (
            <div className={`mt-2 p-2 rounded text-xs ${
              isDarkMode 
                ? 'bg-red-900/50 border border-red-700 text-red-300' 
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}>
              ⚠️ {insightsError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Snippet view - showing detailed section information
  if (view === 'snippet' && selectedSection) {
    return (
      <div className={`w-80 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      } flex-shrink-0`}>
        <div className={`p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Section Snippet</h3>
            <button 
              onClick={() => setView('connections')}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              {selectedSection.document}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {selectedSection.page}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h4 className={`font-medium text-sm mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {selectedSection.section}
            </h4>
            <div className={`text-xs px-2 py-1 rounded mb-2 inline-block ${
              selectedSection.relevance >= 80 
                ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                : isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedSection.relevance}% relevance match
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className={`font-medium text-xs mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>CONCEPT DESCRIPTION</h5>
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {selectedSection.description}
              </p>
            </div>

            {selectedSection.keyPoints && (
              <div>
                <h5 className={`font-medium text-xs mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>KEY POINTS</h5>
                <ul className="space-y-1">
                  {selectedSection.keyPoints.map((point, index) => (
                    <li key={index} className={`text-sm flex items-start ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => handleJumpToSection(selectedSection)}
                className={`w-full text-sm py-2 px-3 rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                🎯 Jump to This Section
              </button>
              
              <button 
                onClick={() => setView('connections')}
                className={`w-full text-sm py-2 px-3 rounded border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ← Back to All Sections
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Insights view
  if (view === 'insights') {
    return (
      <div className={`w-80 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      } flex-shrink-0`}>
        <div className={`p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setView('connections')}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>AI Insights</h3>
            <button 
              onClick={() => setView('bulb')}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Cross-document analysis indicator */}
        {generatedInsights?.metadata?.cross_document_analysis && (
          <div className={`mx-4 mb-2 p-2 rounded text-xs ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center space-x-2">
              <span>🔗</span>
              <span className="font-medium">Enhanced Cross-Document Analysis</span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              Analyzed {generatedInsights.metadata.total_sections_analyzed} sections across all documents for deeper insights
            </p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!generatedInsights ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="text-4xl mb-4">💡</div>
              <p className="text-sm">No insights generated yet.</p>
              <p className="text-xs mt-1">Click "Generate AI Insights" to analyze your documents.</p>
            </div>
          ) : (
            <>
              {/* Debug info - remove this later */}
              {process.env.NODE_ENV === 'development' && (
                <div className={`text-xs p-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}>
                  <p>Debug keys: {JSON.stringify(Object.keys(generatedInsights))}</p>
                  <p>Key insights type: {typeof generatedInsights.key_insights} | Length: {generatedInsights.key_insights?.length || 'undefined'}</p>
                  <p>Did you know type: {typeof generatedInsights.did_you_know_facts} | Length: {generatedInsights.did_you_know_facts?.length || 'undefined'}</p>
                  <p>Connections type: {typeof generatedInsights.contradictions_and_connections} | Length: {generatedInsights.contradictions_and_connections?.length || 'undefined'}</p>
                  <p>First key insight: {JSON.stringify(generatedInsights.key_insights?.[0])}</p>
                </div>
              )}

              {/* Key Insights - with proper object handling */}
              {generatedInsights.key_insights && (
                <div className={`border rounded-lg p-3 ${getColorClasses('blue')}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🔑</span>
                    <h4 className="font-medium text-sm">Key Insights</h4>
                  </div>
                  <div className={`text-sm space-y-1 ${getTextColorClasses('blue')}`}>
                    {generatedInsights.key_insights.error ? (
                      <div className="text-red-500 text-xs">
                        <p className="font-medium">⚠️ API Error</p>
                        <p className="text-xs">{generatedInsights.key_insights.error}</p>
                      </div>
                    ) : Array.isArray(generatedInsights.key_insights.insights) && generatedInsights.key_insights.insights.length > 0 ? (
                      <ul className="space-y-2">
                        {generatedInsights.key_insights.insights.map((insight, index) => (
                          <li key={index} className="border-l-2 border-blue-300 pl-2">
                            {typeof insight === 'string' ? (
                              <span>• {insight}</span>
                            ) : (
                              <div>
                                <p className="font-medium text-xs">{insight.title || `Insight ${index + 1}`}</p>
                                <p className="text-xs">{insight.description || JSON.stringify(insight)}</p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : Array.isArray(generatedInsights.key_insights) ? (
                      <ul className="space-y-2">
                        {generatedInsights.key_insights.map((insight, index) => (
                          <li key={index} className="border-l-2 border-blue-300 pl-2">
                            {typeof insight === 'string' ? (
                              <span>• {insight}</span>
                            ) : (
                              <div>
                                <p className="font-medium text-xs">{insight.title || `Insight ${index + 1}`}</p>
                                <p className="text-xs">{insight.description || JSON.stringify(insight)}</p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No key insights available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Did You Know Facts - with proper object handling */}
              {generatedInsights.did_you_know_facts && (
                <div className={`border rounded-lg p-3 ${getColorClasses('yellow')}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">💭</span>
                    <h4 className="font-medium text-sm">Did You Know?</h4>
                  </div>
                  <div className={`text-sm space-y-2 ${getTextColorClasses('yellow')}`}>
                    {generatedInsights.did_you_know_facts.error ? (
                      <div className="text-red-500 text-xs">
                        <p className="font-medium">⚠️ API Error</p>
                        <p className="text-xs">{generatedInsights.did_you_know_facts.error}</p>
                      </div>
                    ) : Array.isArray(generatedInsights.did_you_know_facts.facts) && generatedInsights.did_you_know_facts.facts.length > 0 ? (
                      <div className="space-y-3">
                        {generatedInsights.did_you_know_facts.facts.slice(0, 3).map((fact, index) => (
                          <div key={index} className="border-l-2 border-yellow-300 pl-3">
                            {typeof fact === 'string' ? (
                              <p className="text-sm">• {fact}</p>
                            ) : fact.fact ? (
                              <div>
                                <p className="text-sm font-medium">• {fact.fact}</p>
                                {fact.explanation && (
                                  <p className="text-xs opacity-75 mt-1 italic">{fact.explanation}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm">• {JSON.stringify(fact)}</p>
                            )}
                          </div>
                        ))}
                        {generatedInsights.did_you_know_facts.facts.length > 3 && (
                          <p className="text-xs opacity-60">+ {generatedInsights.did_you_know_facts.facts.length - 3} more facts...</p>
                        )}
                      </div>
                    ) : Array.isArray(generatedInsights.did_you_know_facts) ? (
                      <div className="space-y-3">
                        {generatedInsights.did_you_know_facts.slice(0, 3).map((fact, index) => (
                          <div key={index} className="border-l-2 border-yellow-300 pl-3">
                            {typeof fact === 'string' ? (
                              <p className="text-sm">• {fact}</p>
                            ) : fact.fact ? (
                              <div>
                                <p className="text-sm font-medium">• {fact.fact}</p>
                                {fact.explanation && (
                                  <p className="text-xs opacity-75 mt-1 italic">{fact.explanation}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm">• {JSON.stringify(fact)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No facts available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Connections - with proper object handling */}
              {generatedInsights.contradictions_and_connections && (
                <div className={`border rounded-lg p-3 ${getColorClasses('purple')}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🔗</span>
                    <h4 className="font-medium text-sm">Connections & Contradictions</h4>
                  </div>
                  <div className={`text-sm space-y-1 ${getTextColorClasses('purple')}`}>
                    {generatedInsights.contradictions_and_connections.error ? (
                      <div className="text-red-500 text-xs">
                        <p className="font-medium">⚠️ API Error</p>
                        <p className="text-xs">{generatedInsights.contradictions_and_connections.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Handle connections array */}
                        {Array.isArray(generatedInsights.contradictions_and_connections.connections) && generatedInsights.contradictions_and_connections.connections.length > 0 && (
                          <div>
                            <p className="font-medium text-xs mb-2">Connections:</p>
                            <div className="space-y-3">
                              {generatedInsights.contradictions_and_connections.connections.slice(0, 3).map((connection, index) => (
                                <div key={index} className="border-l-2 border-purple-300 pl-3">
                                  {typeof connection === 'string' ? (
                                    <p className="text-sm">• {connection}</p>
                                  ) : connection.connection ? (
                                    <div>
                                      <p className="text-sm font-medium">• {connection.connection}</p>
                                      {connection.explanation && (
                                        <p className="text-xs opacity-75 mt-1 italic">{connection.explanation}</p>
                                      )}
                                      {connection.sections && Array.isArray(connection.sections) && (
                                        <p className="text-xs opacity-60 mt-1">
                                          Related sections: {connection.sections.join(', ')}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-medium text-xs">{connection.title || `Connection ${index + 1}`}</p>
                                      <p className="text-xs">{connection.description || JSON.stringify(connection)}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {generatedInsights.contradictions_and_connections.connections.length > 3 && (
                                <p className="text-xs opacity-60">+ {generatedInsights.contradictions_and_connections.connections.length - 3} more connections...</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Handle contradictions array */}
                        {Array.isArray(generatedInsights.contradictions_and_connections.contradictions) && generatedInsights.contradictions_and_connections.contradictions.length > 0 && (
                          <div>
                            <p className="font-medium text-xs mb-2">Contradictions:</p>
                            <div className="space-y-3">
                              {generatedInsights.contradictions_and_connections.contradictions.slice(0, 3).map((contradiction, index) => (
                                <div key={index} className="border-l-2 border-red-300 pl-3">
                                  {typeof contradiction === 'string' ? (
                                    <p className="text-sm">• {contradiction}</p>
                                  ) : contradiction.contradiction ? (
                                    <div>
                                      <p className="text-sm font-medium">• {contradiction.contradiction}</p>
                                      {contradiction.explanation && (
                                        <p className="text-xs opacity-75 mt-1 italic">{contradiction.explanation}</p>
                                      )}
                                      {contradiction.sections && Array.isArray(contradiction.sections) && (
                                        <p className="text-xs opacity-60 mt-1">
                                          Related sections: {contradiction.sections.join(', ')}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-medium text-xs">{contradiction.title || `Contradiction ${index + 1}`}</p>
                                      <p className="text-xs">{contradiction.description || JSON.stringify(contradiction)}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {generatedInsights.contradictions_and_connections.contradictions.length > 3 && (
                                <p className="text-xs opacity-60">+ {generatedInsights.contradictions_and_connections.contradictions.length - 3} more contradictions...</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Cross-Document Insights */}
                        {Array.isArray(generatedInsights.contradictions_and_connections.cross_document_insights) && generatedInsights.contradictions_and_connections.cross_document_insights.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium text-xs mb-2 text-blue-600">Cross-Document Insights:</p>
                            <div className="space-y-3">
                              {generatedInsights.contradictions_and_connections.cross_document_insights.slice(0, 3).map((insight, index) => (
                                <div key={index} className="border-l-2 border-blue-300 pl-3 bg-blue-50 p-2 rounded">
                                  {typeof insight === 'string' ? (
                                    <p className="text-sm">• {insight}</p>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-medium text-blue-800">🔗 {insight.insight}</p>
                                      {insight.evidence && (
                                        <p className="text-xs text-blue-600 mt-1">{insight.evidence}</p>
                                      )}
                                      {insight.implications && (
                                        <p className="text-xs text-blue-500 mt-1 italic">💡 {insight.implications}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inspiration Opportunities */}
                        {Array.isArray(generatedInsights.contradictions_and_connections.inspiration_opportunities) && generatedInsights.contradictions_and_connections.inspiration_opportunities.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium text-xs mb-2 text-green-600">Inspiration Opportunities:</p>
                            <div className="space-y-3">
                              {generatedInsights.contradictions_and_connections.inspiration_opportunities.slice(0, 3).map((opportunity, index) => (
                                <div key={index} className="border-l-2 border-green-300 pl-3 bg-green-50 p-2 rounded">
                                  {typeof opportunity === 'string' ? (
                                    <p className="text-sm">• {opportunity}</p>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-medium text-green-800">✨ {opportunity.opportunity}</p>
                                      {opportunity.source_docs && Array.isArray(opportunity.source_docs) && (
                                        <p className="text-xs text-green-600 mt-1">📚 Sources: {opportunity.source_docs.join(', ')}</p>
                                      )}
                                      {opportunity.potential_application && (
                                        <p className="text-xs text-green-500 mt-1 italic">🎯 {opportunity.potential_application}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Fallback for direct array */}
                        {Array.isArray(generatedInsights.contradictions_and_connections) && (
                          <ul className="space-y-1">
                            {generatedInsights.contradictions_and_connections.map((item, index) => (
                              <li key={index} className="border-l-2 border-purple-300 pl-2">
                                {typeof item === 'string' ? (
                                  <span>• {item}</span>
                                ) : (
                                  <div>
                                    <p className="font-medium text-xs">{item.title || `Item ${index + 1}`}</p>
                                    <p className="text-xs">{item.description || JSON.stringify(item)}</p>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {/* No data message */}
                        {!generatedInsights.contradictions_and_connections.connections?.length && 
                         !generatedInsights.contradictions_and_connections.contradictions?.length && 
                         !Array.isArray(generatedInsights.contradictions_and_connections) && (
                          <p>No connections or contradictions found</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Podcast Script - with error handling */}
              {generatedInsights.podcast_script && (
                <div className={`border rounded-lg p-3 ${getColorClasses('green')}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🎙️</span>
                    <h4 className="font-medium text-sm">Podcast Script</h4>
                  </div>
                  <div className={`text-sm ${getTextColorClasses('green')} space-y-2`}>
                    {generatedInsights.podcast_script.error ? (
                      <div className="text-red-500 text-xs">
                        <p className="font-medium">⚠️ API Quota Exceeded</p>
                        <p>You've reached the daily limit for Gemini API requests.</p>
                        <p>Please try again tomorrow or upgrade your API plan.</p>
                      </div>
                    ) : (
                      <>
                        {generatedInsights.podcast_script.title && (
                          <p className="font-medium">{generatedInsights.podcast_script.title}</p>
                        )}
                        {generatedInsights.podcast_script.duration_estimate && (
                          <p className="text-xs opacity-75">Duration: {generatedInsights.podcast_script.duration_estimate}</p>
                        )}
                        {generatedInsights.podcast_script.script && Array.isArray(generatedInsights.podcast_script.script) && generatedInsights.podcast_script.script.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Preview:</p>
                            <p className="text-xs italic">"{generatedInsights.podcast_script.script[0]?.content?.substring(0, 150)}..."</p>
                          </div>
                        )}
                        <button 
                          className="mt-2 text-xs underline opacity-75 hover:opacity-100"
                          onClick={() => console.log('Full podcast script:', generatedInsights.podcast_script)}
                        >
                          View full script in console
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Regenerate button */}
              <div className="pt-2">
                <button 
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className={`w-full text-xs py-2 px-3 rounded transition-colors ${
                    isGeneratingInsights ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  {isGeneratingInsights ? (
                    <div className="flex items-center justify-center space-x-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Regenerating...</span>
                    </div>
                  ) : (
                    '🔄 Regenerate Insights'
                  )}
                </button>
              </div>

              {/* Fallback: Show raw insights if structure is unexpected */}
              {!generatedInsights.key_insights && 
               !generatedInsights.did_you_know_facts && 
               !generatedInsights.contradictions_and_connections && 
               !generatedInsights.podcast_script && (
                <div className={`border rounded-lg p-3 ${getColorClasses('blue')}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🔍</span>
                    <h4 className="font-medium text-sm">Generated Insights</h4>
                  </div>
                  <pre className={`text-xs whitespace-pre-wrap ${getTextColorClasses('blue')}`}>
                    {JSON.stringify(generatedInsights, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default SmartConnections;
