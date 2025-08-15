import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw, Lightbulb, Zap, Brain } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const SmartConnections = ({ 
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
  selectedTextData // NEW: Selected text data instead of user profile
}) => {
  const [view, setView] = useState('bulb'); // 'bulb', 'connections', 'insights'
  const [selectedSection, setSelectedSection] = useState(null);
  const [generatedInsights, setGeneratedInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

  // Generate insights from selected text and relevant sections
  const handleGenerateInsights = async () => {
    if (!recommendations || recommendations.length === 0) {
      setInsightsError('No relevant sections found. Please run Smart Connections first.');
      return;
    }

    // Check if we have selected text instead of profile
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('No selected text available. Please select text in the PDF first.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating text-based insights...');
      console.log('🔄 Selected text:', selectedTextData.selectedText.substring(0, 100) + '...');
      console.log('🔄 Relevant sections:', recommendations.length);
      
      const response = await backendService.generateInsightsBulb(
        selectedTextData.selectedText,
        recommendations
      );
      
      console.log('✅ Generated insights response:', response);
      
      if (response && response.success) {
        setGeneratedInsights(response.insights);
        setView('insights');
      } else {
        throw new Error(response?.error || 'Failed to generate insights');
      }
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setInsightsError('Failed to generate insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Generate insights from a single section
  const handleGenerateSectionInsights = async (section) => {
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('No selected text available. Please select text in the PDF first.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating insights from single section:', section);
      
      const response = await backendService.generateInsightsBulb(
        selectedTextData.selectedText,
        [section] // Pass only the selected section
      );
      
      console.log('✅ Generated section insights response:', response);
      
      if (response && response.success) {
        setGeneratedInsights(response.insights);
        setView('insights');
      } else {
        throw new Error(response?.error || 'Failed to generate insights');
      }
      
    } catch (error) {
      console.error('❌ Error generating section insights:', error);
      setInsightsError('Failed to generate insights for this section. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSmartConnectionsClick = () => {
    if (selectedTextData && selectedTextData.selectedText) {
      // Text is already selected, show connections directly
      setView('connections');
    } else if (activeCollection || (currentDocument && onGetRecommendations)) {
      // Fallback to legacy behavior but inform user to select text
      alert('Please select text in the PDF to use Smart Connections.');
    }
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
      onNavigateToSection(pageNumber, section.section);
    } else {
      console.warn('⚠️ SmartConnections: No navigation handler or page info missing:', {
        hasHandler: !!onNavigateToSection,
        hasPage: !!section.page,
        section
      });
    }
  };

  // Updated insights that don't reference persona/job
  const insights = [
    {
      type: 'key',
      title: 'Key Insights',
      icon: '🔑',
      color: 'blue',
      items: [
        'AI-powered analysis identifies relevant sections based on selected text',
        'Sentence transformers provide semantic understanding',
        'Gemini LLM enhances content relevance scoring with detailed reasoning'
      ]
    },
    {
      type: 'did-you-know',
      title: 'Did You Know?',
      icon: '💭',
      color: 'yellow',
      content: 'Your selected text helps our AI find the most relevant sections across all your documents using advanced semantic similarity.'
    },
    {
      type: 'inspiration',
      title: 'Smart Analysis',
      icon: '✨',
      color: 'green',
      content: 'The system analyzes document structure and content to provide contextually relevant recommendations based on your text selection.'
    }
  ];

  const Card = ({ children, className }) => (
    <div className={`rounded-2xl border ${className}`}>
      {children}
    </div>
  );

  const renderBulbView = () => (
    <Card className={`${isDarkMode 
      ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
      : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300/40 shadow-lg'} backdrop-blur-sm`}>
      <div className="p-6">
        <div className="text-center mb-6">
          <button 
            onClick={handleSmartConnectionsClick}
            disabled={isProcessing}
            className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25 transition-all duration-300 ${
              isProcessing
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-110 hover:shadow-yellow-500/40 hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Lightbulb className="w-8 h-8 text-white animate-pulse" />
            )}
          </button>
          
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart Connections
          </h2>
          
          {selectedTextData && selectedTextData.selectedText ? (
            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
              Text selected! Click to find relevant sections across your documents.
            </p>
          ) : (
            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
              Select text in the PDF, then click to discover related content across your document collection.
            </p>
          )}
        </div>

        {/* Selected Text Preview */}
        {selectedTextData && selectedTextData.selectedText && (
          <div className={`mb-6 p-4 rounded-xl border ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white/90' 
              : 'bg-white/70 border-gray-200 text-gray-800'
          }`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              Selected Text:
            </h3>
            <p className="text-sm leading-relaxed">
              "{selectedTextData.selectedText.length > 150 
                ? selectedTextData.selectedText.substring(0, 150) + '...' 
                : selectedTextData.selectedText}"
            </p>
          </div>
        )}

        {/* Static insights */}
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white/70 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{insight.icon}</span>
                <h3 className={`font-semibold text-sm ${
                  insight.color === 'blue' ? 'text-blue-600' :
                  insight.color === 'yellow' ? 'text-yellow-600' :
                  insight.color === 'green' ? 'text-green-600' :
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {insight.title}
                </h3>
              </div>
              
              {insight.items ? (
                <ul className={`space-y-1 text-xs ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  {insight.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-xs ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
                  {insight.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderConnectionsView = () => (
    <Card className={`${isDarkMode 
      ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20' 
      : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-300/40 shadow-lg'} backdrop-blur-sm`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setView('bulb')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-white/80 hover:bg-white/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Relevant Sections ({relatedSections.length})
          </h2>
          
          <button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights || relatedSections.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isGeneratingInsights || relatedSections.length === 0
                ? 'opacity-50 cursor-not-allowed' 
                : isDarkMode
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
            }`}
          >
            {isGeneratingInsights ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span className="text-sm">Generate Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Selected Text Preview */}
        {selectedTextData && selectedTextData.selectedText && (
          <div className={`mb-4 p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white/90' 
              : 'bg-white/70 border-gray-200 text-gray-800'
          }`}>
            <h3 className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Searching for:
            </h3>
            <p className="text-sm">
              "{selectedTextData.selectedText.length > 100 
                ? selectedTextData.selectedText.substring(0, 100) + '...' 
                : selectedTextData.selectedText}"
            </p>
          </div>
        )}

        {/* Error Display */}
        {insightsError && (
          <div className={`mb-4 p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-red-500/10 border-red-500/20 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm">{insightsError}</p>
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {relatedSections.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No relevant sections found.</p>
              <p className="text-xs mt-1">Try selecting different text or upload more documents.</p>
            </div>
          ) : (
            relatedSections.map((section, index) => (
              <div
                key={section.id || index}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/70 border-gray-200 hover:bg-white/90 hover:shadow-md'
                }`}
                onClick={() => handleJumpToSection(section)}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      section.color === 'green' ? 'bg-green-500' :
                      section.color === 'blue' ? 'bg-blue-500' :
                      section.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode 
                        ? 'text-white/60 bg-white/10' 
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {section.document_name || section.document || 'Unknown Document'}
                    </span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    section.relevance > 80 ? 'bg-green-500/20 text-green-600' :
                    section.relevance > 60 ? 'bg-blue-500/20 text-blue-600' :
                    'bg-yellow-500/20 text-yellow-600'
                  }`}>
                    {section.relevance || Math.round((section.relevance_score || 0) * 100)}% relevant
                  </div>
                </div>

                {/* Section Title */}
                <h4 className={`font-semibold text-sm mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {section.title || section.section_title || section.section || 'Untitled Section'}
                </h4>

                {/* Section Snippet */}
                <p className={`text-xs leading-relaxed mb-2 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  {section.snippet || section.content_preview || section.text?.substring(0, 150) + '...' || 'No preview available'}
                </p>

                {/* Enhanced Analysis */}
                {section.enhanced_analysis?.key_reasons && (
                  <div className="mt-2">
                    <h5 className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      AI Analysis:
                    </h5>
                    <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                      {section.enhanced_analysis.key_reasons.slice(0, 2).map((reason, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateSectionInsights(section);
                    }}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      isDarkMode 
                        ? 'border-white/20 text-white/80 hover:bg-white/10' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Generate Insights
                  </button>
                  <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    {section.page || 'Page ?'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );

  const renderInsightsView = () => (
    <Card className={`${isDarkMode 
      ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
      : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300/40 shadow-lg'} backdrop-blur-sm`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setView('connections')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-white/80 hover:bg-white/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sections</span>
          </button>
          
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Insights
          </h2>
          
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>

        {/* Insights Content */}
        {generatedInsights ? (
          <div className="space-y-4">
            {Object.entries(generatedInsights).map(([key, insight]) => (
              <div
                key={key}
                className={`p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/70 border-gray-200'
                }`}
              >
                <h3 className={`font-semibold text-sm mb-2 ${
                  key === 'key_takeaways' ? 'text-blue-600' :
                  key === 'did_you_know' ? 'text-yellow-600' :
                  key === 'examples' ? 'text-green-600' :
                  key === 'contradictions' ? 'text-red-600' :
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                
                {Array.isArray(insight) ? (
                  <ul className={`space-y-1 text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                    {insight.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                    {insight}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No insights generated yet.</p>
            <p className="text-xs mt-1">Go back to sections and click "Generate Insights".</p>
          </div>
        )}
      </div>
    </Card>
  );

  // Main render
  if (view === 'insights') {
    return renderInsightsView();
  }
  
  if (view === 'connections') {
    return renderConnectionsView();
  }
  
  return renderBulbView();
};

export default SmartConnections;
