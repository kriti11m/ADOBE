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

  const handleSmartConnectionsClick = async () => {
    if (selectedTextData && selectedTextData.selectedText) {
      // Use the new text-based analysis endpoint
      setIsGeneratingInsights(true);
      try {
        console.log('🚀 Finding relevant sections with text-based analysis...');
        
        const result = await backendService.findRelevantSections(
          selectedTextData.selectedText,
          currentDocument?.id
        );
        
        if (result.success && result.sections) {
          // Update recommendations through parent component
          onGetRecommendations(result.sections);
          setView('connections');
        } else {
          setInsightsError(result.error || 'Failed to find relevant sections');
        }
        
      } catch (error) {
        console.error('❌ Error finding relevant sections:', error);
        setInsightsError('Failed to analyze selected text. Please try again.');
      } finally {
        setIsGeneratingInsights(false);
      }
    } else {
      // Inform user to select text first
      setInsightsError('Please select text in the PDF first to use Smart Connections.');
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

  const Card = ({ children, className }) => (
    <div className={`rounded-2xl border ${className}`}>
      {children}
    </div>
  );

  const renderBulbView = () => (
    <Card className={`${isDarkMode 
      ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' 
      : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300/40 shadow-lg'} backdrop-blur-sm`}>
      <div className="p-4 text-center">
        <button 
          onClick={handleSmartConnectionsClick}
          disabled={isProcessing || isGeneratingInsights}
          className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25 transition-all duration-300 ${
            isProcessing || isGeneratingInsights
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-110 hover:shadow-yellow-500/40 hover:shadow-xl'
          }`}
        >
          {isProcessing || isGeneratingInsights ? (
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Lightbulb className="w-6 h-6 text-white animate-pulse" />
          )}
        </button>
        
        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Smart Connections
        </h3>
        
        {selectedTextData && selectedTextData.selectedText ? (
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            Text selected! Click to find relevant sections across your documents.
          </p>
        ) : (
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
            Select text in the PDF, then click to find related sections
          </p>
        )}

        {/* Selected Text Preview (Compact) */}
        {selectedTextData && selectedTextData.selectedText && (
          <div className={`mb-3 p-2 rounded-lg border text-xs ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white/80' 
              : 'bg-white/70 border-gray-200 text-gray-700'
          }`}>
            "{selectedTextData.selectedText.length > 80 
              ? selectedTextData.selectedText.substring(0, 80) + '...' 
              : selectedTextData.selectedText}"
          </div>
        )}

        {/* Error Display */}
        {insightsError && (
          <div className={`mt-3 p-2 rounded-lg text-xs ${
            isDarkMode 
              ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {insightsError}
          </div>
        )}
      </div>
    </Card>
  );

  const renderConnectionsView = () => (
    <Card className={`${isDarkMode 
      ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20' 
      : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-300/40 shadow-lg'} backdrop-blur-sm`}>
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setView('bulb')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              isDarkMode 
                ? 'text-white/80 hover:bg-white/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
          
          <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Found {relatedSections.length}
          </h2>
          
          <button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights || relatedSections.length === 0}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              isGeneratingInsights || relatedSections.length === 0
                ? 'opacity-50 cursor-not-allowed' 
                : isDarkMode
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-md'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md'
            }`}
          >
            {isGeneratingInsights ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" />
                <span>Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Compact Selected Text Preview */}
        {selectedTextData && selectedTextData.selectedText && (
          <div className={`mb-3 p-2 rounded border text-xs ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white/90' 
              : 'bg-white/70 border-gray-200 text-gray-800'
          }`}>
            <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Searching: 
            </span>
            "{selectedTextData.selectedText.length > 60 
              ? selectedTextData.selectedText.substring(0, 60) + '...' 
              : selectedTextData.selectedText}"
          </div>
        )}

        {/* Error Display */}
        {insightsError && (
          <div className={`mb-3 p-2 rounded border text-xs ${
            isDarkMode 
              ? 'bg-red-500/10 border-red-500/20 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {insightsError}
          </div>
        )}

        {/* Compact Sections List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {relatedSections.length === 0 ? (
            <div className={`text-center py-6 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No relevant sections found</p>
            </div>
          ) : (
            relatedSections.slice(0, 5).map((section, index) => (
              <div
                key={section.id || index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/70 border-gray-200 hover:bg-white/90 hover:shadow-sm'
                }`}
                onClick={() => handleJumpToSection(section)}
              >
                {/* Compact Section Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      section.color === 'green' ? 'bg-green-500' :
                      section.color === 'blue' ? 'bg-blue-500' :
                      section.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isDarkMode 
                        ? 'text-white/60 bg-white/10' 
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {(section.document_name || section.document || 'Unknown').substring(0, 15)}
                    </span>
                  </div>
                  <div className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    section.relevance > 80 ? 'bg-green-500/20 text-green-600' :
                    section.relevance > 60 ? 'bg-blue-500/20 text-blue-600' :
                    'bg-yellow-500/20 text-yellow-600'
                  }`}>
                    {section.relevance || Math.round((section.relevance_score || 0) * 100)}%
                  </div>
                </div>

                {/* Compact Section Title */}
                <h4 className={`font-medium text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(section.title || section.section_title || section.section || 'Untitled').substring(0, 50)}
                </h4>

                {/* Compact Section Snippet */}
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  {(section.snippet || section.content_preview || section.text?.substring(0, 100) + '...' || 'No preview available').substring(0, 120)}
                </p>

                {/* Compact Enhanced Analysis */}
                {section.enhanced_analysis?.key_reasons && (
                  <div className="mt-1">
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      AI: 
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                      {section.enhanced_analysis.key_reasons[0]?.substring(0, 80)}...
                    </span>
                  </div>
                )}

                {/* Jump Action Hint */}
                <div className="flex items-center justify-end mt-1">
                  <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                    Click to view
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
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setView('connections')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              isDarkMode 
                ? 'text-white/80 hover:bg-white/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
          
          <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Insights
          </h2>
          
          <Zap className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>

        {/* Compact Insights Content */}
        {generatedInsights ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(generatedInsights).map(([key, insight]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/70 border-gray-200'
                }`}
              >
                <h3 className={`font-medium text-xs mb-1 ${
                  key === 'key_takeaways' ? 'text-blue-600' :
                  key === 'did_you_know' ? 'text-yellow-600' :
                  key === 'examples' ? 'text-green-600' :
                  key === 'contradictions' ? 'text-red-600' :
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                
                {Array.isArray(insight) ? (
                  <ul className={`space-y-0.5 text-xs ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                    {insight.slice(0, 3).map((item, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{item.length > 80 ? item.substring(0, 80) + '...' : item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-xs ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                    {insight.length > 120 ? insight.substring(0, 120) + '...' : insight}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-6 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No insights generated yet</p>
            <p className="text-xs mt-1 opacity-70">Go back and click "Generate Insights"</p>
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
