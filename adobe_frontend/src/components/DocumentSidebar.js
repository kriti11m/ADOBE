import React, { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useDarkMode } from '../App';

const DocumentSidebar = ({ documents, onDocumentSelect, onFileUpload, currentDocument, onShowUploader }) => {
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
      New: isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
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
          }`}>Upload PDFs, ZIP, or folders</p>
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
          className={`w-full py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          📁 Bulk Upload & Process
        </button>
      </div>
        
      {/* Quick Filters */}
      <div className="p-4 pt-0">
        <div className="flex space-x-2 mb-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'recent', label: 'Recent' },
            { key: 'analyzed', label: 'Analyzed' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                activeFilter === filter.key
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {getFilteredDocuments().map((doc) => (
            <div
              key={doc.id}
              onClick={() => onDocumentSelect(doc)}
              className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                currentDocument?.id === doc.id
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-blue-500 bg-blue-50'
                  : isDarkMode
                    ? 'border-transparent hover:border-blue-400 hover:bg-gray-700'
                    : 'border-transparent hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-8 h-8 text-red-500 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{doc.name}</p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{doc.timestamp}</p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                {doc.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;
