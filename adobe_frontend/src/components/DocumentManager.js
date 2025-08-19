import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, FileText, HardDrive } from 'lucide-react';
import { collectionService } from '../services/collectionService';

const DocumentManager = ({ isDarkMode, onClose, onDocumentDeleted }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [clearLoading, setClearLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/collections/documents`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        setError('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId, filename) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [documentId]: true }));
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/collections/document/${documentId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove document from list
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setShowConfirmDelete(null);
        
        // Notify parent component
        if (onDocumentDeleted) {
          onDocumentDeleted(documentId, filename);
        }
      } else {
        setError(data.detail || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const handleClearAllHistory = async () => {
    try {
      setClearLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/collections/clear-history`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDocuments([]);
        setShowConfirmClear(false);
        
        // Show success message
        console.log('History cleared:', data.statistics);
      } else {
        setError(data.detail || 'Failed to clear history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
    } finally {
      setClearLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const missingFilesCount = documents.filter(doc => !doc.file_exists).length;
  const totalStorage = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50`}>
      <div className={`w-full max-w-4xl max-h-[90vh] mx-4 rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <HardDrive className="w-6 h-6" />
                Document Management
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your uploaded PDFs and clear storage
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="text-sm text-gray-500">Total Documents</div>
              <div className="text-xl font-bold">{documents.length}</div>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="text-sm text-gray-500">Storage Used</div>
              <div className="text-xl font-bold">{formatFileSize(totalStorage)}</div>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="text-sm text-gray-500">Missing Files</div>
              <div className={`text-xl font-bold ${missingFilesCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {missingFilesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`px-6 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={clearLoading || documents.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:text-red-600 disabled:hover:bg-transparent' 
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-red-400 disabled:hover:bg-transparent'
              } disabled:cursor-not-allowed`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearLoading ? 'Clearing...' : 'Clear All History'}
            </button>

            <button
              onClick={fetchDocuments}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 disabled:text-gray-600' 
                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:text-gray-400'
              } disabled:cursor-not-allowed`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-96">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No documents found</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Upload some documents to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`group p-3 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/70 hover:shadow-md hover:shadow-gray-900/20' 
                      : 'bg-white/60 border-gray-200/60 hover:bg-white/90 hover:border-gray-300/80 hover:shadow-sm hover:shadow-gray-200/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Document Header */}
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`flex-shrink-0 p-1.5 rounded-md ${
                          isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100/80'
                        }`}>
                          <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className={`font-semibold text-sm leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            title={doc.original_filename || doc.filename}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.3',
                              maxHeight: '1.3em'
                            }}
                          >
                            {(doc.original_filename || doc.filename).length > 35 
                              ? `${(doc.original_filename || doc.filename).substring(0, 32)}...` 
                              : (doc.original_filename || doc.filename)
                            }
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {doc.file_exists ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className={`text-xs font-medium ${
                                doc.file_exists 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {doc.file_exists ? 'Available' : 'Missing'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Document Metadata */}
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-0.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono">ID: {doc.id}</span>
                          <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                        </div>
                        <div className="text-right">
                          {formatDate(doc.upload_date)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => setShowConfirmDelete(doc)}
                      disabled={deleteLoading[doc.id]}
                      className={`p-1.5 rounded-md transition-all duration-200 flex-shrink-0 ${
                        isDarkMode 
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30 active:bg-red-900/50' 
                          : 'text-red-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105`}
                      title="Delete document"
                    >
                      {deleteLoading[doc.id] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Clear All Dialog */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className={`p-6 rounded-xl shadow-2xl max-w-md mx-4 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold text-red-500 mb-2">Clear All History?</h3>
              <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This will permanently delete all uploaded documents and collections. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllHistory}
                  disabled={clearLoading}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {clearLoading ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Document Dialog */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className={`p-6 rounded-xl shadow-2xl max-w-md mx-4 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold text-red-500 mb-2">Delete Document?</h3>
              <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to delete <span className="font-medium">"{showConfirmDelete.original_filename || showConfirmDelete.filename}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDocument(showConfirmDelete.id, showConfirmDelete.filename)}
                  disabled={deleteLoading[showConfirmDelete.id]}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {deleteLoading[showConfirmDelete.id] ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
