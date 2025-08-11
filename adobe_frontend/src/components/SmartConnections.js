import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import TableOfContents from './TableOfContents';

const SmartConnections = ({ 
  currentDocument, 
  recommendations, 
  isProcessing, 
  onGetRecommendations, 
  activeCollection, 
  onNavigateToSection,
  pdfStructure,
  isExtractingStructure,
  currentSection 
}) => {
  const [view, setView] = useState('bulb'); // 'bulb', 'connections', 'insights'
  const [selectedSection, setSelectedSection] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

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
        ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-900',
      red: isDarkMode 
        ? 'bg-red-900/50 border-red-700 text-red-300' 
        : 'bg-red-50 border-red-200 text-red-900'
    };
    return colorMap[color] || (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900');
  };

  const getTextColorClasses = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'text-blue-300' : 'text-blue-800',
      green: isDarkMode ? 'text-green-300' : 'text-green-800',
      purple: isDarkMode ? 'text-purple-300' : 'text-purple-800',
      yellow: isDarkMode ? 'text-yellow-300' : 'text-yellow-800',
      red: isDarkMode ? 'text-red-300' : 'text-red-800'
    };
    return colorMap[color] || (isDarkMode ? 'text-gray-300' : 'text-gray-800');
  };

  // Main view - always show bulb, outline is now in separate panel
  if (view === 'bulb') {
    return (
      <div className={`w-80 p-4 transition-colors duration-300 ${
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
                  <span className={`text-xs px-2 py-1 rounded ml-2 flex-shrink-0 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {section.page}
                  </span>
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
            onClick={() => setView('insights')}
            className={`w-full text-xs py-2 px-3 rounded transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            💡 View AI Insights
          </button>
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
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className={`border rounded-lg p-3 ${getColorClasses(insight.color)}`}>
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{insight.icon}</span>
                <h4 className="font-medium text-sm">{insight.title}</h4>
              </div>
              {insight.items ? (
                <ul className={`text-sm space-y-1 ${getTextColorClasses(insight.color)}`}>
                  {insight.items.map((item, itemIndex) => (
                    <li key={itemIndex}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${getTextColorClasses(insight.color)}`}>
                  {insight.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SmartConnections;
