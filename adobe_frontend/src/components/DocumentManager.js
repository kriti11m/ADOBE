import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, FileText, HardDrive } from 'lucide-react';
import { collectionService } from '../services/collectionService';

const DocumentManager = ({ isDarkMode, onClose, onDocumentDeleted }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [clearLoading, setClearLoading] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8083/collections/documents');
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
      
      const response = await fetch(`http://localhost:8083/collections/document/${documentId}`, {
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
      
      const response = await fetch('http://localhost:8083/collections/clear-history', {
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

  const handleRepairMissingPaths = async () => {
    try {
      setRepairLoading(true);
      
      const response = await fetch('http://localhost:8083/collections/repair-missing-paths', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh documents list to see repaired items
        await fetchDocuments();
        console.log('Repair completed:', data);
      } else {
        setError(data.detail || 'Failed to repair missing paths');
      }
    } catch (err) {
      console.error('Error repairing paths:', err);
      setError('Failed to repair missing paths');
    } finally {
      setRepairLoading(false);
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
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={clearLoading || documents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {clearLoading ? 'Clearing...' : 'Clear All History'}
            </button>

            <button
              onClick={handleRepairMissingPaths}
              disabled={repairLoading || missingFilesCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400' 
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
              } text-white`}
            >
              <RefreshCw className={`w-4 h-4 ${repairLoading ? 'animate-spin' : ''}`} />
              {repairLoading ? 'Repairing...' : `Repair Missing Files (${missingFilesCount})`}
            </button>

            <button
              onClick={fetchDocuments}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No documents found</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload some PDFs to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-medium">{doc.filename}</h3>
                        <div className="flex items-center gap-1">
                          {doc.file_exists ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-xs ${doc.file_exists ? 'text-green-500' : 'text-red-500'}`}>
                            {doc.file_exists ? 'Available' : 'Missing'}
                          </span>
                        </div>
                      </div>
                      <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div>ID: {doc.id} | Size: {formatFileSize(doc.file_size)}</div>
                        <div>Uploaded: {formatDate(doc.upload_date)}</div>
                        {doc.file_path && (
                          <div className="truncate">Path: {doc.file_path}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowConfirmDelete(doc)}
                      disabled={deleteLoading[doc.id]}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleteLoading[doc.id] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className={`p-6 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className="text-lg font-bold text-red-500 mb-2">Clear All History?</h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                This will permanently delete all uploaded documents and collections. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllHistory}
                  disabled={clearLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg"
                >
                  {clearLoading ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Document Dialog */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className={`p-6 rounded-lg shadow-lg max-w-md ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className="text-lg font-bold text-red-500 mb-2">Delete Document?</h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to delete "{showConfirmDelete.filename}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDocument(showConfirmDelete.id, showConfirmDelete.filename)}
                  disabled={deleteLoading[showConfirmDelete.id]}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg"
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
