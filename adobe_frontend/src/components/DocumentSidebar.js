import React, { useState, useEffect } from 'react';
import { FileText, FolderPlus, Folder, ChevronDown, ChevronRight, History, Calendar } from 'lucide-react';
import { useDarkMode } from '../App';
import historyService from '../services/historyService';

const DocumentSidebar = ({ 
  documents, 
  onDocumentSelect, 
  onFileUpload, 
  currentDocument, 
  onShowUploader,
  collections = [],
  activeCollection,
  onSelectCollection,
  onShowCollectionUploader,
  onCollectionDocumentSelect,
  onLoadSession // Add this new prop for loading sessions
}) => {
  const [activeTab, setActiveTab] = useState('collections');
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [expandedHistoryItems, setExpandedHistoryItems] = useState(new Set());
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { isDarkMode } = useDarkMode();

  // Auto-expand active collection when it changes
  React.useEffect(() => {
    if (activeCollection && !expandedCollections.has(activeCollection.id)) {
      setExpandedCollections(prev => new Set(prev).add(activeCollection.id));
    }
  }, [activeCollection, expandedCollections]);

  // Load history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await historyService.getHistory(50, 0);
      setHistoryData(response.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistoryExpansion = (sessionId) => {
    const newExpanded = new Set(expandedHistoryItems);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedHistoryItems(newExpanded);
  };

  const handleLoadHistorySession = (session) => {
    if (onLoadSession) {
      onLoadSession(session);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleCollectionExpansion = (collectionId) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleCollectionDocumentSelect = (document, collection) => {
    const documentWithCollection = {
      ...document,
      fromCollection: collection
    };
    if (onCollectionDocumentSelect) {
      onCollectionDocumentSelect(documentWithCollection, collection);
    } else {
      onDocumentSelect(documentWithCollection);
    }
  };

  const getTagColor = (tag) => {
    const baseColors = {
      Recent: isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800',
      Analyzed: isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800',
      New: isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      Collection: isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800',
      'Previously Analyzed': isDarkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
    };
    return baseColors[tag] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  return (
    <div id="document-sidebar" className={`w-80 border-r transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } flex flex-col`}>
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Tab Navigation */}
        <div className={`flex mb-4 p-1 rounded-lg ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <button
            id="history-tab"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            History
          </button>
          <button
            id="collections-tab"
            onClick={() => setActiveTab('collections')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'collections'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Folder className="w-4 h-4 inline mr-2" />
            Collections
          </button>
        </div>

        {activeTab === 'history' ? (
          // History Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">�</span>
                Analysis History
              </h2>
            </div>
            
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              View your previous analysis sessions and collections
            </div>
          </>
        ) : (
          // Collections Tab Content
          <>
            <div id="collections" className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">📁</span>
                Collections
              </h2>
            </div>
            
            {/* Create Collection Button */}
            <button
              id="upload-documents"
              onClick={onShowCollectionUploader}
              className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors mb-4 border-2 border-dashed ${
                isDarkMode 
                  ? 'border-blue-500 text-blue-400 hover:bg-blue-900/20 hover:border-blue-400' 
                  : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
              }`}
            >
              <FolderPlus className="w-5 h-5 inline mr-2" />
              Create New Collection
            </button>
          </>
        )}
      </div>
        
      {/* Content based on active tab */}
      {activeTab === 'history' ? (
        // History Tab Content
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {loadingHistory ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-sm">Loading history...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No analysis history found</p>
                <p className="text-xs">Start analyzing documents to build your history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.map((session) => (
                  <div key={session.id} className={`border rounded-lg overflow-hidden ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    {/* Session Header */}
                    <div
                      className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <History className="w-4 h-4 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">
                            Session #{session.id}
                          </div>
                          <div className={`text-xs flex items-center mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(session.created_at)}
                          </div>
                          {session.persona && (
                            <div className={`text-xs mt-1 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              👤 {session.persona}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadHistorySession(session);
                          }}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isDarkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                          }`}
                        >
                          Load
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHistoryExpansion(session.id);
                          }}
                          className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                        >
                          {expandedHistoryItems.has(session.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Session Documents (when expanded) */}
                    {expandedHistoryItems.has(session.id) && (
                      <div className={`${
                        isDarkMode ? 'bg-gray-800 border-t border-gray-600' : 'bg-white border-t border-gray-200'
                      }`}>
                        {session.documents && session.documents.length > 0 ? (
                          <div className="p-3">
                            <div className={`text-xs font-medium mb-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              📄 Documents ({session.documents.length})
                            </div>
                            {session.documents.map((document, index) => (
                              <div
                                key={`${session.id}-${index}`}
                                className={`p-2 mb-2 rounded border-l-4 transition-colors ${
                                  isDarkMode 
                                    ? 'bg-gray-700 border-blue-500 text-gray-300' 
                                    : 'bg-gray-50 border-blue-400 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <FileText className="w-3 h-3 mr-2 flex-shrink-0" />
                                    <span className="text-sm truncate">{document.filename}</span>
                                  </div>
                                </div>
                                <div className={`text-xs mt-1 flex items-center ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Uploaded: {formatDate(document.upload_timestamp)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`p-3 text-center text-sm ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            No documents found in this session
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // Collections Tab Content
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {collections.map(collection => (
                <div key={collection.id} className={`border rounded-lg overflow-hidden ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  {/* Collection Header */}
                  <div
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      activeCollection?.id === collection.id
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
                        : isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div 
                      className="flex items-center flex-1"
                      onClick={() => onSelectCollection(collection)}
                    >
                      <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm">{collection.name}</span>
                        <p className="text-xs opacity-75 mt-1">
                          {collection.documents.length} documents
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollectionExpansion(collection.id);
                      }}
                      className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                    >
                      {expandedCollections.has(collection.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Collection Documents (when expanded) */}
                  {expandedCollections.has(collection.id) && (
                    <div className={`${
                      isDarkMode ? 'bg-gray-800 border-t border-gray-600' : 'bg-white border-t border-gray-200'
                    }`}>
                      {collection.documents.map((document, index) => (
                        <div
                          key={`${collection.id}-${index}`}
                          onClick={() => handleCollectionDocumentSelect(document, collection)}
                          className={`p-3 cursor-pointer transition-colors border-l-4 ${
                            currentDocument?.id === document.id || currentDocument?.name === document.name
                              ? isDarkMode 
                                ? 'bg-blue-600 text-white border-blue-400' 
                                : 'bg-blue-100 text-blue-900 border-blue-400'
                              : isDarkMode 
                                ? 'hover:bg-gray-700 text-gray-300 border-transparent hover:border-gray-500' 
                                : 'hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center ml-2">
                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="text-sm truncate">{document.name}</span>
                          </div>
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex space-x-1 mt-2 ml-8">
                              {document.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className={`px-2 py-1 text-xs rounded-full ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {collections.length === 0 && (
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No collections yet</p>
                  <p className="text-xs">Create a collection to analyze multiple PDFs together</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentSidebar;
