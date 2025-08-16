import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw, Lightbulb, Zap, Brain, Sparkles } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import FinaleIntegrationService from '../services/finaleIntegrationService';

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
  const [activeView, setActiveView] = useState('sections'); // 'sections' or 'insights'
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
        setGeneratedInsights(response.insights); // Use response.insights from full response
        setActiveView('insights');
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
        setActiveView('insights');
      } else {
        throw new Error(response?.error || 'Failed to generate insights');
      }
      
    } catch (error) {
      console.error('❌ Error generating section insights:', error);
      setInsightsError('Failed to generate insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Handle section click with navigation
  const handleSectionClick = (section) => {
    console.log('📍 Section clicked:', section);
    setSelectedSection(section);
    
    // Navigate to the section if navigation function is provided
    if (onNavigateToSection && typeof onNavigateToSection === 'function') {
      onNavigateToSection(section);
    }
  };

  // Smart Connections API Call
  const handleSmartConnectionsClick = async () => {
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('Please select text in the PDF first.');
      return;
    }

    setInsightsError(null);
    
    try {
      console.log('🔄 Starting Smart Connections analysis...');
      console.log('📝 Selected text:', selectedTextData.selectedText.substring(0, 200) + '...');
      
      // Call the actual Smart Connections API
      const smartConnectionsData = await FinaleIntegrationService.getSmartConnections(
        selectedTextData.selectedText,
        currentDocument?.name || 'Current Document'
      );
      
      console.log('✅ Smart Connections response:', smartConnectionsData);
      
      if (smartConnectionsData && smartConnectionsData.relevant_sections) {
        onGetRecommendations(smartConnectionsData.relevant_sections);
        console.log(`📊 Found ${smartConnectionsData.relevant_sections.length} relevant sections`);
      } else {
        console.warn('⚠️ No relevant sections returned');
        setInsightsError('No relevant sections found for the selected text.');
      }
      
    } catch (error) {
      console.error('❌ Smart Connections error:', error);
      setInsightsError('Failed to find relevant sections. Please try again.');
    }
  };

  const handleJumpToSection = (section) => {
    console.log('🚀 Jumping to section:', section);
    handleSectionClick(section);
  };

  const Card = ({ children, className }) => (
    <div className={`rounded-xl border ${className}`}>
      {children}
    </div>
  );

  // Main render with new design
  return (
    <Card className={`${isDarkMode 
      ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-xl' 
      : 'bg-white/80 border-gray-200/60 backdrop-blur-xl shadow-sm'}`}>
      
      {/* Header with toggle buttons */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700/60' : 'border-gray-200/60'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart Analysis
          </h2>
          <div className="flex items-center space-x-2">
            <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI-Powered</span>
          </div>
        </div>
        
        {/* Toggle Buttons */}
        <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          <button
            onClick={() => setActiveView('sections')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeView === 'sections'
                ? isDarkMode 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-blue-600 shadow-sm'
                : isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-600/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Related Sections
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeView === 'insights'
                ? isDarkMode 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white text-purple-600 shadow-sm'
                : isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-600/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Lightbulb className="w-4 h-4 mr-1 inline" />
            Insights
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'sections' ? renderRelatedSectionsView() : renderInsightsView()}
      </div>
    </Card>
  );

  function renderRelatedSectionsView() {
    return (
      <div className="p-4">
        {/* Selected Text Display */}
        {selectedTextData && selectedTextData.selectedText ? (
          <div className="mb-4">
            <div className={`p-3 rounded-lg border text-sm ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/30 text-gray-200' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Selected Text:
              </div>
              <div className="leading-relaxed">
                "{selectedTextData.selectedText.length > 150 
                  ? selectedTextData.selectedText.substring(0, 150) + '...' 
                  : selectedTextData.selectedText}"
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleSmartConnectionsClick}
              disabled={isProcessing || isGeneratingInsights}
              className={`w-full mt-3 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                isProcessing || isGeneratingInsights
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing || isGeneratingInsights ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Find Related Sections</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Lightbulb className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className="font-medium mb-2">Select Text to Begin</h3>
            <p className="text-sm">
              Highlight any text in the PDF to discover related sections across all your documents
            </p>
          </div>
        )}

        {/* Related Sections Results */}
        {relatedSections && relatedSections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Related Sections Found
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDarkMode 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {relatedSections.length} results
              </span>
            </div>

            <div className="space-y-2">
              {relatedSections.slice(0, 3).map((section, index) => (
                <div
                  key={index}
                  onClick={() => handleSectionClick(section)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isDarkMode 
                      ? 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50' 
                      : index % 3 === 0 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                        : index % 3 === 1 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(section.document_name || section.document || 'Unknown Document').substring(0, 25)}...
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDarkMode 
                        ? 'bg-gray-600 text-gray-300' 
                        : index % 3 === 0 
                          ? 'text-blue-600 bg-blue-100' 
                          : index % 3 === 1 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-purple-600 bg-purple-100'
                    }`}>
                      Page {section.page_number || 'N/A'}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(section.snippet || section.content_preview || section.text?.substring(0, 120) + '...' || 'No preview available').substring(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <button className={`text-sm font-medium ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : index % 3 === 0 
                          ? 'text-blue-600 hover:text-blue-800' 
                          : index % 3 === 1 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-purple-600 hover:text-purple-800'
                    }`}>
                      Jump to section →
                    </button>
                    <div className={`text-xs px-2 py-1 rounded ${
                      (section.relevance || section.relevance_score * 100) > 80 ? 'bg-green-500/20 text-green-600' :
                      (section.relevance || section.relevance_score * 100) > 60 ? 'bg-blue-500/20 text-blue-600' :
                      'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {section.relevance || Math.round((section.relevance_score || 0) * 100)}% match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {insightsError && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            isDarkMode 
              ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {insightsError}
          </div>
        )}
      </div>
    );
  }

  function renderInsightsView() {
    return (
      <div className="p-4">
        {/* Generate Insights Button */}
        {!generatedInsights && (
          <div className="text-center mb-6">
            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights || !selectedTextData?.selectedText || !recommendations?.length}
              className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto transition-all duration-200 ${
                isGeneratingInsights || !selectedTextData?.selectedText || !recommendations?.length
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isGeneratingInsights ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Insights...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  <span>Generate AI Insights</span>
                </>
              )}
            </button>
            
            {(!selectedTextData?.selectedText || !recommendations?.length) && (
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {!selectedTextData?.selectedText 
                  ? 'Select text first to generate insights' 
                  : 'Find related sections first to generate insights'}
              </p>
            )}
          </div>
        )}

        {/* Generated Insights Display */}
        {generatedInsights && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Insights</h3>
              <button
                onClick={() => setGeneratedInsights(null)}
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Clear
              </button>
            </div>

            {/* Insights Cards */}
            <div className="space-y-3">
              {/* Key Insights */}
              {generatedInsights.key_takeaways && (
                <div className={`rounded-lg p-4 border ${
                  isDarkMode 
                    ? 'bg-blue-500/10 border-blue-500/20' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    📊 Key Insights
                  </h3>
                  <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    {Array.isArray(generatedInsights.key_takeaways) 
                      ? generatedInsights.key_takeaways.slice(0, 3).map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))
                      : <li>• {generatedInsights.key_takeaways}</li>
                    }
                  </ul>
                </div>
              )}

              {/* Connections Found */}
              {recommendations && recommendations.length > 0 && (
                <div className={`rounded-lg p-4 border ${
                  isDarkMode 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>
                    🔗 Connections Found
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                    {recommendations.length} related sections identified across your document library
                  </p>
                </div>
              )}

              {/* Smart Summary */}
              {(generatedInsights.summary || generatedInsights.did_you_know) && (
                <div className={`rounded-lg p-4 border ${
                  isDarkMode 
                    ? 'bg-yellow-500/10 border-yellow-500/20' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>
                    💡 Smart Summary
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    {generatedInsights.summary || 
                     (Array.isArray(generatedInsights.did_you_know) 
                       ? generatedInsights.did_you_know[0] 
                       : generatedInsights.did_you_know)}
                  </p>
                </div>
              )}

              {/* Examples/Actions */}
              {(generatedInsights.examples || generatedInsights.contradictions) && (
                <div className={`rounded-lg p-4 border ${
                  isDarkMode 
                    ? 'bg-purple-500/10 border-purple-500/20' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                    🎯 {generatedInsights.examples ? 'Examples' : 'Key Points'}
                  </h3>
                  <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                    {Array.isArray(generatedInsights.examples) 
                      ? generatedInsights.examples.slice(0, 3).map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))
                      : Array.isArray(generatedInsights.contradictions)
                        ? generatedInsights.contradictions.slice(0, 3).map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))
                        : <li>• {generatedInsights.examples || generatedInsights.contradictions}</li>
                    }
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {insightsError && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            isDarkMode 
              ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {insightsError}
          </div>
        )}
      </div>
    );
  }
};

export default SmartConnections;
