import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock, FolderPlus } from 'lucide-react';
import { useDarkMode } from '../App';

const CollectionUploader = ({ onCollectionCreate, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { isDarkMode } = useDarkMode();

  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (files.length !== event.target.files.length) {
      setError('Only PDF files are allowed');
      setTimeout(() => setError(null), 3000);
    }
    
    setSelectedFiles(files);
    setSuccess(false);
  }, []);

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setCollectionName('');
    setError(null);
    setSuccess(false);
  };

  const handleCreateCollection = () => {
    if (!collectionName.trim()) {
      setError('Please enter a collection name');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    onCollectionCreate(collectionName.trim(), selectedFiles);
    setSuccess(true);
    
    // Reset form
    setTimeout(() => {
      clearAll();
      onClose();
    }, 1500);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <FolderPlus className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <div>
          <p className={`text-lg font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Upload PDF files to analyze together for cross-document insights
          </p>
        </div>
      </div>

      {/* Collection Name Input */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Collection Name
        </label>
        <input
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          placeholder="e.g., Research Papers, Travel Documents, Study Materials"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* File Upload Area */}
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDarkMode 
          ? 'border-gray-600 hover:border-blue-500 bg-gray-800/50' 
          : 'border-gray-300 hover:border-blue-400 bg-gray-50'
      }`}>
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="collection-file-input"
        />
        <label htmlFor="collection-file-input" className="cursor-pointer">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <div className="space-y-2">
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Drop PDF files here or click to browse
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Select 2-6 PDF files (Max 10MB each)
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className={`border rounded-lg ${
          isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className={`px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Selected Files ({selectedFiles.length}/6)</h4>
              <button
                onClick={clearAll}
                className={`text-sm underline ${
                  isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                }`}
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className={`flex items-center justify-between px-4 py-3 ${
                index < selectedFiles.length - 1 
                  ? isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
                  : ''
              }`}>
                <div className="flex items-center space-x-3">
                  <FileText className={`w-5 h-5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className={`p-1 rounded-full hover:bg-red-100 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Collection created successfully!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleCreateCollection}
          disabled={!collectionName.trim() || selectedFiles.length === 0 || success}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            !collectionName.trim() || selectedFiles.length === 0 || success
              ? isDarkMode 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {success ? 'Collection Created!' : 'Create Collection'}
        </button>
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cancel
        </button>
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg ${
        isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <h4 className={`font-medium text-sm mb-2 ${
          isDarkMode ? 'text-blue-300' : 'text-blue-800'
        }`}>
          💡 How Collections Work
        </h4>
        <ul className={`text-sm space-y-1 ${
          isDarkMode ? 'text-blue-200' : 'text-blue-700'
        }`}>
          <li>• Upload 2-6 related PDF documents</li>
          <li>• Smart Connections will analyze ALL documents together</li>
          <li>• Get top 3 relevant sections from across the entire collection</li>
          <li>• Perfect for research papers, project documents, or study materials</li>
        </ul>
      </div>
    </div>
  );
};

export default CollectionUploader;
