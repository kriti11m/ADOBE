import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useDarkMode } from '../App';

const SmartConnections = ({ currentDocument }) => {
  const [view, setView] = useState('bulb'); // 'bulb', 'connections', 'insights'
  const { isDarkMode } = useDarkMode();

  const relatedSections = [
    {
      id: 1,
      document: 'Climate Model Analysis.pdf',
      page: 'Page 12',
      section: '2.3 Statistical Methods',
      description: 'Similar validation techniques used for climate prediction models align with your ML research approach.',
      color: 'blue'
    },
    {
      id: 2,
      document: 'Financial Trends 2024.pdf',
      page: 'Page 8',
      section: '4.1 Predictive Analytics',
      description: 'Cross-validation methods for financial forecasting mirror your experimental design principles.',
      color: 'green'
    },
    {
      id: 3,
      document: 'ML Research Methods.pdf',
      page: 'Page 45',
      section: '6.2 Future Directions',
      description: 'Advanced ensemble techniques that extend your current methodology framework.',
      color: 'purple'
    }
  ];

  const insights = [
    {
      type: 'key',
      title: 'Key Insights',
      icon: '🔑',
      color: 'blue',
      items: [
        'Ensemble methods show 23% improvement',
        'Cross-validation critical for model reliability',
        'Feature selection impacts performance significantly'
      ]
    },
    {
      type: 'did-you-know',
      title: 'Did You Know?',
      icon: '💭',
      color: 'yellow',
      content: 'Similar validation techniques are used in climate modeling, suggesting cross-domain applicability of your methods.'
    },
    {
      type: 'contradictions',
      title: 'Contradictions',
      icon: '⚠',
      color: 'red',
      content: 'Financial trends document suggests different optimal validation split ratios (70/30 vs your 80/20).'
    },
    {
      type: 'inspiration',
      title: 'Inspiration',
      icon: '✨',
      color: 'green',
      content: 'Consider exploring transfer learning approaches mentioned in related climate research for enhanced model generalization.'
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

  const getButtonColorClasses = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800',
      green: isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800',
      purple: isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
    };
    return colorMap[color] || (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800');
  };

  if (view === 'bulb') {
    return (
      <div className={`w-1/5 flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
      }`}>
        <div className="p-4 text-center">
          <button 
            onClick={() => setView('connections')}
            className="animate-glow-pulse w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-3 transition-colors"
          >
            <span className="text-2xl">💡</span>
          </button>
          <h3 className={`font-medium mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Smart Connections</h3>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Click to discover related content across your documents</p>
        </div>
      </div>
    );
  }

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
          }`}>Found 3 highly relevant matches (&gt;80%)</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {relatedSections.map((section) => (
            <div 
              key={section.id}
              className={`related-item border rounded-lg p-3 cursor-pointer transition-colors ${getColorClasses(section.color)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{section.document}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {section.page}
                </span>
              </div>
              <h5 className="text-sm font-medium mb-1">{section.section}</h5>
              <p className="text-xs mb-2">{section.description}</p>
              <button className={`text-xs font-medium ${getButtonColorClasses(section.color)}`}>
                Jump to section →
              </button>
            </div>
          ))}
        </div>
        
        <div className={`p-4 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button 
            onClick={() => setView('insights')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>💡</span>
            <span>Show AI Insights</span>
          </button>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>AI Insights</h3>
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
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className={`border rounded-lg p-3 transition-colors duration-300 ${getColorClasses(insight.color)}`}>
              <h4 className="font-medium mb-2 flex items-center">
                <span className="mr-2">{insight.icon}</span>
                {insight.title}
              </h4>
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
