import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const SmartConnections = ({ currentDocument, recommendations, isProcessing }) => {
  const [view, setView] = useState('bulb'); // 'bulb', 'connections', 'insights'
  const { isDarkMode } = useDarkMode();

  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

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

  // Main view - connections button
  if (view === 'bulb') {
    return (
      <div className={`w-1/5 p-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <button 
              onClick={() => setView('connections')}
              className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              <span className="text-2xl">💡</span>
            </button>
            <h3 className={`font-medium text-sm mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Smart Connections</h3>
            <p className={`text-xs leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Click to discover relevant sections from your documents using AI analysis
            </p>
            {relatedSections.length > 0 && (
              <div className={`mt-3 text-xs px-2 py-1 rounded ${
                isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
              }`}>
                {relatedSections.length} relevant sections found
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
      <div className={`w-1/5 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      }`}>
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
          }`}>Top {Math.min(relatedSections.length, 3)} AI-ranked matches</p>
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
            relatedSections.map((section) => (
              <div 
                key={section.id}
                className={`related-item border rounded-lg p-3 cursor-pointer transition-colors ${getColorClasses(section.color)}`}
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
                <h5 className="font-medium text-sm mb-1">{section.section}</h5>
                <p className="text-xs leading-relaxed mb-2 line-clamp-3">{section.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    section.relevance >= 80 
                      ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                      : isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {section.relevance}% relevant
                  </span>
                  <button 
                    onClick={() => setView('insights')}
                    className={`text-xs underline ${
                      isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    View Details
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

  // Insights view
  if (view === 'insights') {
    return (
      <div className={`w-1/5 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      }`}>
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
