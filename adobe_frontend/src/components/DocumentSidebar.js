import React, { useState, useRef } from 'react';
import { Upload, FileText, FolderPlus, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { useDarkMode } from '../App';

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
  onCollectionDocumentSelect
}) => {
  const [activeTab, setActiveTab] = useState('collections');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const fileInputRef = useRef(null);
  const { isDarkMode } = useDarkMode();

  // Auto-expand active collection when it changes
  React.useEffect(() => {
    if (activeCollection && !expandedCollections.has(activeCollection.id)) {
      setExpandedCollections(prev => new Set(prev).add(activeCollection.id));
    }
  }, [activeCollection, expandedCollections]);

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
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

  const getFilteredDocuments = () => {
    if (activeFilter === 'all') return documents;
    return documents.filter(doc => doc.status === activeFilter);
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
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents
          </button>
          <button
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

        {activeTab === 'documents' ? (
          // Documents Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">📚</span>
                Your Documents
              </h2>
            </div>
            
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer mb-2 ${
                isDragOver 
                  ? isDarkMode 
                    ? 'border-blue-400 bg-blue-900/20' 
                    : 'border-blue-400 bg-blue-50'
                  : isDarkMode
                    ? 'border-gray-600 hover:border-blue-400'
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className={`text-2xl mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📄
              </div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Drop PDFs here or click to upload
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Supports PDF files
              </p>
            </div>

            {/* Bulk Upload Button */}
            <div id="upload-buttons">
              <button
                onClick={onShowUploader}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors mb-4 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Bulk Upload & Process
              </button>
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
      {activeTab === 'documents' ? (
        // Documents Tab Content
        <>
          {/* Quick Filters */}
          <div className="p-4 pt-0">
            <div className="flex gap-1 mb-4">
              {['all', 'new', 'recent', 'analyzed'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    activeFilter === filter
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {getFilteredDocuments().map(document => (
                <div
                  key={document.id}
                  onClick={() => onDocumentSelect(document)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    currentDocument?.id === document.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-blue-100 text-blue-900 border-blue-300'
                      : isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500' 
                        : 'hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{document.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">{document.timestamp}</span>
                    <div className="flex space-x-1">
                      {document.tags?.map((tag, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredDocuments().length === 0 && (
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No documents found</p>
                  <p className="text-xs">Upload some PDFs to get started</p>
                </div>
              )}
            </div>
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
