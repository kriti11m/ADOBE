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
      Collection: isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800',
      'Previously Analyzed': isDarkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <span className="mr-2">📚</span>
            Document Library
          </h2>
        </div>

        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer mb-6 ${
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

        {/* Collections Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🔬 Collections
            </h3>
            <button
              onClick={onShowCollectionUploader}
              className={`text-xs px-2 py-1 rounded ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              + New
            </button>
          </div>

          {activeCollection && (
            <div className={`mb-3 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-orange-900/20 border-orange-700 text-orange-300' 
                : 'bg-orange-50 border-orange-200 text-orange-800'
            }`}>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Active: {activeCollection.name}</span>
              </div>
              <p className="text-xs mt-1 opacity-75">
                {activeCollection.documents.length} documents • Multi-doc analysis
              </p>
            </div>
          )}

          {collections.length > 0 && (
            <div className="space-y-1 mb-4">
              {collections.slice(0, 3).map(collection => (
                <div
                  key={collection.id}
                  onClick={() => onSelectCollection(collection)}
                  className={`p-2 rounded cursor-pointer transition-colors text-sm ${
                    activeCollection?.id === collection.id
                      ? isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-900'
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{collection.name}</span>
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {collection.documents.length} docs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters for Documents */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📖 Individual Documents
            </h3>
          </div>
          
          <div className="flex gap-1 mb-3">
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
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4 pt-0">
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
    </div>
  );
};

export default DocumentSidebar;
