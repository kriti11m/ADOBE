import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const PDFUploader = ({ onDocumentsProcessed, userProfile }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
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
    
    setSelectedFiles(prev => [...prev, ...files]);
    setSuccess(false);
  }, []);

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setError(null);
    setSuccess(false);
    setUploadProgress({});
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Process files in batches to avoid overwhelming the backend
      const batchSize = 3;
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize);
        
        // Update progress for current batch
        batch.forEach((_, index) => {
          setUploadProgress(prev => ({
            ...prev,
            [i + index]: 'processing'
          }));
        });
        
        // Process PDF structure extraction for batch
        const structurePromises = batch.map(async (file, index) => {
          try {
            const structure = await backendService.extractPDFStructure(file);
            setUploadProgress(prev => ({
              ...prev,
              [i + index]: 'completed'
            }));
            return { file, structure, status: 'success' };
          } catch (error) {
            setUploadProgress(prev => ({
              ...prev,
              [i + index]: 'error'
            }));
            return { file, error: error.message, status: 'error' };
          }
        });
        
        const batchResults = await Promise.all(structurePromises);
        results.push(...batchResults);
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < selectedFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Get AI recommendations for all successfully processed files
      const successfulFiles = results.filter(r => r.status === 'success').map(r => r.file);
      let recommendations = [];
      
      if (successfulFiles.length > 0) {
        try {
          recommendations = await backendService.getRecommendations(
            successfulFiles,
            userProfile.role || 'Researcher',
            userProfile.task || 'Analyze document content and extract relevant sections'
          );
        } catch (recError) {
          console.warn('Failed to get recommendations:', recError);
          // Continue without recommendations rather than failing completely
        }
      }
      
      // Notify parent component
      onDocumentsProcessed({
        structures: results.filter(r => r.status === 'success'),
        recommendations,
        errors: results.filter(r => r.status === 'error')
      });
      
      setSuccess(true);
      setSelectedFiles([]);
      setUploadProgress({});
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getProgressIcon = (fileIndex) => {
    const status = uploadProgress[fileIndex];
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`p-6 rounded-xl border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="mb-4">
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Upload PDF Documents
        </h3>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Upload your PDFs to build your document library for intelligent recommendations
        </p>
      </div>

      {/* File Upload Area */}
      <div className="mb-4">
        <label
          htmlFor="pdf-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDarkMode
              ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={`mb-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              PDF files only
            </p>
          </div>
          <input
            id="pdf-upload"
            type="file"
            className="hidden"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className={`text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Selected Files ({selectedFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2 flex-1">
                  {getProgressIcon(index)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className={`p-1 rounded hover:bg-opacity-20 ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">
                Documents processed successfully! Check the recommendations panel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || isUploading}
        className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-colors ${
          selectedFiles.length === 0 || isUploading
            ? isDarkMode
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isDarkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isUploading ? 'Processing Documents...' : `Process ${selectedFiles.length} Document${selectedFiles.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

export default PDFUploader;
