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
  const [activeFilter, setActiveFilter] = useState('all');
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
            Upload PDF
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
                Bulk Upload PDFs
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drop multiple PDFs here or click to select
              </p>
            </div>

            {/* Advanced Bulk Upload Button */}
            <button
              onClick={onShowUploader}
              className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors mb-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                  : 'bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Advanced Bulk Upload & Process
            </button>
          </>
        ) : (
          // Single PDF Upload Tab Content
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">📄</span>
                Upload Single PDF
              </h2>
            </div>
            
            {/* Single PDF Upload Area */}
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
                Upload a Single PDF
              </p>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drop one PDF here or click to select
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ✨ Opens instantly with Adobe PDF Viewer
              </p>
            </div>
          </>
        )}
      </div>
        
      {/* Content based on active tab */}
      {currentActiveTab === 'documents' ? (
        // Documents Tab Content - Show documents list
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
        // Single Upload Tab Content - Clean and simple
        <div className="flex-1 p-4">
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-sm">
              Select a PDF above to open it with Adobe PDF Viewer
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar;
