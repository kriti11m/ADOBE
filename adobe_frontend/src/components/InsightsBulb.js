import React, { useState } from 'react';
import { Lightbulb, Sparkles, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const InsightsBulb = ({ currentDocument, selectedSection, userProfile }) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDarkMode } = useDarkMode();

  const generateInsights = async () => {
    if (!currentDocument) {
      setError('No document selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Create a File object from current document (you'll need to pass the actual file)
      // For now, we'll pass the document info
      const insightsData = await backendService.generateInsights(
        [currentDocument], // Assuming currentDocument is a File object
        userProfile.role || 'Researcher',
        selectedSection
      );
      
      setInsights(insightsData);
      setIsExpanded(true);
      
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const InsightCard = ({ icon: Icon, title, content, type }) => (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${
          type === 'insight' ? 'text-blue-500' :
          type === 'fact' ? 'text-green-500' :
          type === 'contradiction' ? 'text-orange-500' :
          'text-purple-500'
        }`} />
        <div>
          <h4 className={`font-medium mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h4>
          <p className={`text-sm leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`rounded-xl border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className={`w-6 h-6 ${
              insights ? 'text-yellow-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              AI Insights
            </h3>
          </div>
          
          <button
            onClick={generateInsights}
            disabled={isLoading || !currentDocument}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isLoading || !currentDocument
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Generate'}
          </button>
        </div>

        {selectedSection && (
          <div className={`text-xs mb-4 p-2 rounded ${
            isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            Analyzing: {selectedSection.title || selectedSection.section || 'Current section'}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!insights && !isLoading && !error && (
          <div className={`text-center py-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Click "Generate" to get AI-powered insights about your document
            </p>
            <p className="text-xs mt-2">
              Get key insights, facts, contradictions, and connections
            </p>
          </div>
        )}
      </div>

      {insights && (
        <div className="border-t border-gray-200 dark:border-gray-600">
          <div 
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Insights Generated
            </span>
            <div className={`transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}>
              ⌄
            </div>
          </div>
          
          {isExpanded && (
            <div className="px-4 pb-4 space-y-4">
              {insights.key_insights && insights.key_insights.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-3 text-sm ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    🔍 Key Insights
                  </h4>
                  <div className="space-y-3">
                    {insights.key_insights.map((insight, index) => (
                      <InsightCard
                        key={index}
                        icon={Lightbulb}
                        title={insight.title || `Insight ${index + 1}`}
                        content={insight.content || insight}
                        type="insight"
                      />
                    ))}
                  </div>
                </div>
              )}

              {insights.did_you_know && insights.did_you_know.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-3 text-sm ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    💡 Did You Know?
                  </h4>
                  <div className="space-y-3">
                    {insights.did_you_know.map((fact, index) => (
                      <InsightCard
                        key={index}
                        icon={BookOpen}
                        title={fact.title || `Fact ${index + 1}`}
                        content={fact.content || fact}
                        type="fact"
                      />
                    ))}
                  </div>
                </div>
              )}

              {insights.contradictions && insights.contradictions.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-3 text-sm ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    ⚠️ Contradictions & Counterpoints
                  </h4>
                  <div className="space-y-3">
                    {insights.contradictions.map((contradiction, index) => (
                      <InsightCard
                        key={index}
                        icon={AlertTriangle}
                        title={contradiction.title || `Counterpoint ${index + 1}`}
                        content={contradiction.content || contradiction}
                        type="contradiction"
                      />
                    ))}
                  </div>
                </div>
              )}

              {insights.connections && insights.connections.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-3 text-sm ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    🔗 Cross-Document Connections
                  </h4>
                  <div className="space-y-3">
                    {insights.connections.map((connection, index) => (
                      <InsightCard
                        key={index}
                        icon={Sparkles}
                        title={connection.title || `Connection ${index + 1}`}
                        content={connection.content || connection}
                        type="connection"
                      />
                    ))}
                  </div>
                </div>
              )}

              {insights.summary && (
                <div className={`mt-4 p-4 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-800'
                  }`}>
                    📋 Summary
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    {insights.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsightsBulb;
