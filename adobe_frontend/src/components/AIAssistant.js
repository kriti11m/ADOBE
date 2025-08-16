import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, Lightbulb, BookOpen, Zap, RefreshCw, Copy, X } from 'lucide-react';
import backendService from '../services/backendService';
import { useDarkMode } from '../App';

const AIAssistant = ({ selectedTextData, onClose, show = false }) => {
  const { isDarkMode } = useDarkMode();
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [insightTypes, setInsightTypes] = useState(['key_takeaways', 'did_you_know', 'contradictions', 'examples']);
  const isGeneratingRef = useRef(false);

  // Generate insights when component shows and has selected text
  useEffect(() => {
    if (show && selectedTextData?.selectedText && !isGeneratingRef.current) {
      // Always clear previous insights when new text data comes in
      setInsights(null);
      setError(null);
      
      generateInsights();
    }
  }, [show, selectedTextData?.selectedText]);

  const generateInsights = async () => {
    if (!selectedTextData?.selectedText) {
      setError('No text selected for analysis');
      return;
    }

    if (isGeneratingRef.current) {
      console.log('🚫 Insights generation already in progress, skipping...');
      return;
    }

    console.log('🧠 AI Assistant - Starting insight generation with data:', {
      selectedText: selectedTextData.selectedText,
      textLength: selectedTextData.selectedText.length,
      relatedSections: selectedTextData.relatedSections?.length || 0
    });

    setIsGenerating(true);
    isGeneratingRef.current = true;
    setError(null);

    try {
      console.log('🧠 Generating AI insights for selected text...');
      console.log('📤 Sending to backend API:', {
        selected_text: selectedTextData.selectedText,
        related_sections: selectedTextData.relatedSections || [],
        insight_types: insightTypes
      });
      
      const result = await backendService.generateInsightsBulb(
        selectedTextData.selectedText,
        selectedTextData.relatedSections || [],
        insightTypes
      );

      setInsights(result);
      console.log('✅ AI insights generated:', result);
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const regenerateInsights = () => {
    setInsights(null);
    generateInsights();
  };

  const copyInsights = () => {
    if (!insights) return;

    const insightText = `
AI Insights for: "${selectedTextData.selectedText.substring(0, 100)}..."

Analysis: ${insights.analysis || 'No analysis available'}

Related Sections: ${selectedTextData.relatedSections?.length || 0} found
Generated with: ${insights.generated_with || 'AI Assistant'}
    `.trim();

    navigator.clipboard.writeText(insightText).then(() => {
      // Show brief success indicator
      const button = document.getElementById('copy-insights-btn');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    });
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Assistant
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Powered by Gemini AI • Analyzing selected text
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={regenerateInsights}
                disabled={isGenerating}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                } disabled:opacity-50`}
                title="Regenerate insights"
              >
                <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={copyInsights}
                disabled={!insights}
                id="copy-insights-btn"
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                } disabled:opacity-50`}
                title="Copy insights"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selected Text Preview */}
          <div className={`p-4 rounded-lg mb-6 ${
            isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Selected Text
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              "{selectedTextData?.selectedText?.substring(0, 300)}
              {selectedTextData?.selectedText?.length > 300 ? '...' : ''}"
            </p>
            {selectedTextData?.relatedSections?.length > 0 && (
              <div className="mt-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-green-500" />
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {selectedTextData.relatedSections.length} related sections found across your documents
                </span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Generating AI Insights...
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analyzing your selected text with advanced AI
              </p>
              <div className="mt-4 flex justify-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-900 border-red-700 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Error generating insights</span>
              </div>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={regenerateInsights}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-red-800 hover:bg-red-700 text-red-200' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Insights Display */}
          {insights && !isGenerating && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className={`p-6 rounded-lg ${
                isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Lightbulb className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Analysis
                  </h3>
                </div>
                <div className={`prose prose-sm max-w-none ${
                  isDarkMode ? 'prose-invert text-gray-300' : 'prose-gray text-gray-700'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {insights.analysis || 'No detailed analysis available.'}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Text Length
                    </span>
                  </div>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTextData?.selectedText?.length || 0} chars
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Related Sections
                    </span>
                  </div>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {insights.related_sections_count || 0}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      AI Model
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {insights.generated_with || 'Gemini AI'}
                  </p>
                </div>
              </div>

              {/* Insight Types */}
              {insights.insight_types && (
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Analysis Types
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.insight_types.map((type, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDarkMode 
                            ? 'bg-purple-600 text-purple-100' 
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                AI insights are generated based on your selected text and related document sections
              </span>
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
