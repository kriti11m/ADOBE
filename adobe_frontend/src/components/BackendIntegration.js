import React, { useState, useEffect } from 'react';
import { FileText, Download, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const BackendIntegration = ({ currentDocument, userProfile }) => {
  const [backendData, setBackendData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const { isDarkMode } = useDarkMode();

  // Backend integration using the service
  const fetchBackendData = async (documentName) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a mock file object for the service
      const mockFile = { name: documentName };
      
      // Get PDF structure from Part 1A
      const outlineData = await backendService.extractPDFStructure(mockFile);
      
      // Get AI recommendations from Part 1B
      const aiRecommendations = await backendService.getRecommendations(
        mockFile, 
        userProfile.role || 'Researcher', 
        userProfile.task || 'Document analysis'
      );

      setBackendData(outlineData);
      setRecommendations(aiRecommendations);
      
    } catch (err) {
      console.error('Backend integration error:', err);
      setError('Failed to fetch backend data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentDocument) {
      fetchBackendData(currentDocument.name);
    }
  }, [currentDocument]);

  const getLevelClasses = (level) => {
    const baseClasses = "flex items-center space-x-2 py-2 px-3 rounded cursor-pointer transition-colors";
    const levelClasses = {
      H1: isDarkMode ? "text-white font-semibold" : "text-gray-900 font-semibold",
      H2: isDarkMode ? "text-gray-200 font-medium" : "text-gray-800 font-medium", 
      H3: isDarkMode ? "text-gray-300" : "text-gray-600"
    };
    return `${baseClasses} ${levelClasses[level] || levelClasses.H3}`;
  };

  const getIndentation = (level) => {
    const indentMap = { H1: 0, H2: 4, H3: 8 };
    return indentMap[level] || 0;
  };

  const getRelevanceColor = (relevance) => {
    if (relevance >= 90) return isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
    if (relevance >= 80) return isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
    return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
  };

  if (!currentDocument) {
    return (
      <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <FileText className="w-12 h-12" />
          </div>
          <h3 className={`text-xl font-medium mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Select a document to analyze</h3>
          <p className={`mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Backend integration will extract real PDF structure and provide AI-powered recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex relative transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Backend Data Sidebar */}
      <div className={`w-80 border-r transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <FileText className="w-4 h-4 inline mr-2" />
              Backend Analysis
            </h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            )}
          </div>
          
          {backendData && (
            <div className="mt-3 space-y-2">
              <div className={`text-xs p-2 rounded ${
                isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'
              }`}>
                <strong>Title:</strong> {backendData.title}
              </div>
              <div className={`text-xs p-2 rounded ${
                isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'
              }`}>
                <strong>Language:</strong> {backendData.metadata.language}
              </div>
              <div className={`text-xs p-2 rounded ${
                isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-800'
              }`}>
                <strong>Confidence:</strong> {(backendData.metadata.confidence * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Extracting document structure...</p>
            </div>
          ) : error ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <p className="text-sm">{error}</p>
            </div>
          ) : backendData ? (
            <div>
              <h4 className={`font-medium text-sm mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Extracted Outline (Real Backend Data)</h4>
              
              {backendData.outline.map((item, index) => (
                <div
                  key={index}
                  className={`${getLevelClasses(item.level)} hover:${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                  style={{ paddingLeft: `${getIndentation(item.level) + 8}px` }}
                >
                  <span className="text-xs text-gray-500">p.{item.page}</span>
                  <span className="flex-1">{item.text}</span>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Recommendations Panel */}
      <div className={`w-80 border-r transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            AI Recommendations
          </h3>
          {userProfile.role && (
            <div className={`text-xs p-2 rounded mt-2 ${
              isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-800'
            }`}>
              <strong>Role:</strong> {userProfile.role}
            </div>
          )}
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-3 transition-colors ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm">{rec.section}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${getRelevanceColor(rec.relevance)}`}>
                      {rec.relevance}%
                    </span>
                  </div>
                  <p className="text-xs mb-2 text-gray-600">{rec.importance}</p>
                  <div className={`text-xs p-2 rounded mb-2 ${
                    isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <strong>Refined Text:</strong> {rec.refinedText}
                  </div>
                  <div className={`text-xs p-2 rounded ${
                    isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'
                  }`}>
                    <strong>AI Reasoning:</strong> {rec.reasoning}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p className="text-sm">No recommendations available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className={`p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Backend Integration Dashboard
          </h2>
          <p className={`mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Real-time PDF structure extraction and AI-powered recommendations based on your persona and task.
          </p>
          
          {backendData && (
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-2xl font-bold text-blue-600">{backendData.outline.length}</div>
                <div className="text-sm">Sections Extracted</div>
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-2xl font-bold text-green-600">{backendData.metadata.totalPages}</div>
                <div className="text-sm">Total Pages</div>
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-2xl font-bold text-purple-600">{recommendations.length}</div>
                <div className="text-sm">AI Recommendations</div>
              </div>
            </div>
          )}
        </div>

        <div className={`flex-1 p-6 overflow-y-auto ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="max-w-4xl mx-auto">
            <div className={`prose prose-lg max-w-none ${
              isDarkMode ? 'prose-invert' : ''
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                How Backend Integration Works
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h4 className="font-medium mb-2">📄 PDF Structure Extraction (Part 1A)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Multilingual text analysis with font detection</li>
                    <li>• Hierarchical heading identification (H1, H2, H3)</li>
                    <li>• Page number mapping and confidence scoring</li>
                    <li>• Language detection and script analysis</li>
                  </ul>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h4 className="font-medium mb-2">🤖 AI Recommendations (Part 1B)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Semantic similarity analysis with SentenceTransformers</li>
                    <li>• Persona-driven content filtering</li>
                    <li>• Task-specific relevance scoring</li>
                    <li>• Refined text extraction and reasoning</li>
                  </ul>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h4 className="font-medium mb-2">🔗 Real-time Integration</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Docker containerized backend processing</li>
                    <li>• AMD64 architecture compatibility</li>
                    <li>• Offline processing capabilities</li>
                    <li>• JSON output format for seamless frontend integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendIntegration;
