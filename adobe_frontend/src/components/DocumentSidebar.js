import React, { useState, useRef } from 'react';
import { Upload, FileText, FolderPlus, Folder, Users } from 'lucide-react';
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
  onShowCollectionUploader
}) => {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'collections'
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { isDarkMode } = useDarkMode();

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

  const getFilteredDocuments = () => {
    if (activeFilter === 'all') return documents;
    return documents.filter(doc => doc.status === activeFilter);
  };

  const getTagColor = (tag) => {
    const baseColors = {
      Recent: isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800',
      Analyzed: isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800',
      New: isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      Collection: isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
    };
    return baseColors[tag] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  return (
    <div className={`w-1/5 flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-r border-gray-700' 
        : 'bg-white border-r border-gray-200'
    }`}>
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
              <Upload className={`mx-auto h-8 w-8 mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Upload individual PDFs</p>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                multiple 
                accept=".pdf,.zip"
                onChange={handleFileSelect}
              />
            </div>
        
            {/* Bulk Upload Button */}
            <button
              onClick={onShowUploader}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors mb-4 ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Bulk Upload & Process
            </button>
          </>
        ) : (
          // Collections Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
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

            {activeCollection && (
              <div className={`mb-4 p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-blue-900/20 border-blue-700 text-blue-300' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Active: {activeCollection.name}</span>
                </div>
                <p className="text-xs mt-1 opacity-75">
                  {activeCollection.documents.length} documents • Smart Connections will analyze all
                </p>
              </div>
            )}
          </>
        )}
      </div>
        
      {/* Content based on active tab */}
      {activeTab === 'documents' ? (
        // Documents Tab Content
        <>
          {/* Quick Filters */}
          <div className="p-4 pt-0">
            <div className="flex space-x-2 mb-4">
              {['all', 'analyzed', 'new'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === filter
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'all' && ` (${documents.length})`}
                </button>
              ))}
            </div>
          </div>
          
          {/* Documents List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-2">
              {getFilteredDocuments().map(doc => (
                <div
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentDocument?.id === doc.id
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{doc.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">{doc.timestamp}</span>
                    <div className="flex space-x-1">
                      {doc.tags && doc.tags.map(tag => (
                        <span key={tag} className={`px-2 py-1 text-xs rounded-full ${getTagColor(tag)}`}>
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
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-2">
              {collections.map(collection => (
                <div
                  key={collection.id}
                  onClick={() => onSelectCollection(collection)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    activeCollection?.id === collection.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-blue-600 text-white border-blue-500'
                      : isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500' 
                        : 'hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{collection.name}</span>
                    </div>
                    {activeCollection?.id === collection.id && (
                      <Users className="w-4 h-4 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">
                      {collection.documents.length} documents
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      collection.status === 'ready' 
                        ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {collection.status}
                    </span>
                  </div>
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
