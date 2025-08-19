import React, { useState, useRef } from 'react';
import { Upload, FileText, Plus } from 'lucide-react';
import { useDarkMode } from '../App';

const DocumentSidebar = ({ 
  documents, 
  onDocumentSelect, 
  onFileUpload,
  currentDocument, 
  onShowUploader,
  tutorialActiveTab,
  onSinglePDFUpload
}) => {
  // Use tutorial tab if provided, otherwise use default (changed to documents)
  const [activeTab, setActiveTab] = useState('documents');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSingleUploadDragOver, setIsSingleUploadDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);
  const { isDarkMode } = useDarkMode();

  // Override activeTab if tutorial is active
  const currentActiveTab = tutorialActiveTab || activeTab;

  const handleSingleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      onSinglePDFUpload(file);
    }
  };

  const handleSingleDragOver = (e) => {
    e.preventDefault();
    setIsSingleUploadDragOver(true);
  };

  const handleSingleDragLeave = () => {
    setIsSingleUploadDragOver(false);
  };

  const handleSingleDrop = (e) => {
    e.preventDefault();
    setIsSingleUploadDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onSinglePDFUpload(file);
    }
  };

  const handleSingleUploadClick = () => {
    singleFileInputRef.current.click();
  };

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
    return documents; // Show all documents since filters are removed
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
    <div className={`w-1/5 flex flex-col h-full transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-r border-gray-700' 
        : 'bg-white border-r border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Tab Navigation */}
        <div className={`flex mb-4 p-1 rounded-lg ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <button
            id="documents-tab"
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentActiveTab === 'documents'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents
          </button>
          <button
            id="single-upload-tab"
            onClick={() => setActiveTab('single-upload')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentActiveTab === 'single-upload'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Upload Document
          </button>
        </div>

        {currentActiveTab === 'documents' ? (
          // Documents Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">📚</span>
                Document Library
              </h2>
            </div>
            
            {/* Bulk Upload Area */}
            <div 
              id="upload-documents"
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer mb-4 ${
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
              <div className={`text-3xl mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📚
              </div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Bulk Upload Documents
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drop multiple documents here or click to select
              </p>
            </div>

            {/* Document Library Info */}
            <div className={`text-xs mb-4 p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              Upload and manage your documents here
            </div>
          </>
        ) : (
          // Single Document Upload Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">📄</span>
                Upload Single Document
              </h2>
            </div>

            {/* Single Document Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4 ${
                isSingleUploadDragOver 
                  ? isDarkMode 
                    ? 'border-green-400 bg-green-900/20' 
                    : 'border-green-400 bg-green-50'
                  : isDarkMode
                    ? 'border-gray-600 hover:border-green-400'
                    : 'border-gray-300 hover:border-green-400'
              }`}
              onClick={handleSingleUploadClick}
              onDragOver={handleSingleDragOver}
              onDragLeave={handleSingleDragLeave}
              onDrop={handleSingleDrop}
            >
              <input
                ref={singleFileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleSingleFileSelect}
                className="hidden"
              />
              <div className={`text-4xl mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📄
              </div>
              <p className={`text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload a Single Document
              </p>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drop one document here or click to select
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ✨ Opens instantly with viewer
              </p>
            </div>
          </>
        )}
      </div>
        
      {/* Content based on active tab */}
      {currentActiveTab === 'documents' ? (
        // Documents Tab Content - Show documents list
        <>
          {/* Documents List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {getFilteredDocuments().map(document => (
                <div
                  key={document.id}
                  onClick={() => onDocumentSelect(document)}
                  className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 border backdrop-blur-sm ${
                    currentDocument?.id === document.id
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white border-blue-400/50 shadow-lg shadow-blue-500/25' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-blue-300/60 shadow-sm'
                      : isDarkMode 
                        ? 'hover:bg-gray-800/60 text-gray-300 border-gray-700/50 hover:border-gray-600/70 hover:shadow-md hover:shadow-gray-900/20' 
                        : 'hover:bg-white/80 text-gray-700 border-gray-200/60 hover:border-gray-300/80 hover:shadow-sm'
                  }`}
                >
                  {/* Document Header */}
                  <div className="flex items-start space-x-2 mb-1">
                    <div className={`flex-shrink-0 p-1 rounded-md ${
                      currentDocument?.id === document.id
                        ? isDarkMode ? 'bg-white/20' : 'bg-blue-200/50'
                        : isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/70'
                    }`}>
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 
                          className="text-sm font-semibold leading-tight truncate group-hover:text-clip"
                          title={document.name}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.2',
                            maxHeight: '1.2em'
                          }}
                        >
                          {document.name.length > 45 
                            ? `${document.name.substring(0, 42)}...` 
                            : document.name
                          }
                        </h3>
                      </div>
                      <div className={`text-xs opacity-75 font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {document.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  {/* Document Tags */}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {document.tags.slice(0, 2).map((tag, index) => (
                        <span 
                          key={index}
                          className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${getTagColor(tag)} backdrop-blur-sm`}
                        >
                          {tag}
                        </span>
                      ))}
                      {document.tags.length > 2 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                          isDarkMode ? 'bg-gray-600/40 text-gray-300' : 'bg-gray-200/60 text-gray-600'
                        }`}>
                          +{document.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Hover Indicator */}
                  <div className={`absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    currentDocument?.id === document.id ? 'hidden' : ''
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                  </div>
                </div>
              ))}
              
              {getFilteredDocuments().length === 0 && (
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No documents found</p>
                  <p className="text-xs">Upload some documents to get started</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Single Upload Tab Content - Clean and simple
        <div className="flex-1 p-4">
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-sm">
              Select a document above to open it with viewer
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar;
