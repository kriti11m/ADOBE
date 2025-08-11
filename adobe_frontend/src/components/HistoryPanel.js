import React, { useState, useEffect } from 'react';
import historyService from '../services/historyService';

const HistoryPanel = ({ isOpen, onClose, onLoadSession }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadStats();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await historyService.getHistory(50, 0);
      setHistory(response.history || []);
    } catch (err) {
      setError('Failed to load history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/history/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    // Validate session ID before making the request
    if (!sessionId || sessionId === undefined || sessionId === 'undefined') {
      console.warn('Invalid session ID provided:', sessionId);
      return;
    }

    try {
      const details = await historyService.getSessionDetails(sessionId);
      setSelectedSession(details);
    } catch (err) {
      console.error('Error loading session details:', err);
      setSelectedSession(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleLoadSession = (session) => {
    onLoadSession(session);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg w-5/6 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">📚 Analysis History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - History List */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            {/* Stats Panel */}
            {stats && (
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h3 className="font-semibold mb-2">📊 Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Sessions</div>
                    <div className="text-blue-400 font-semibold">{stats.total_sessions}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Documents</div>
                    <div className="text-green-400 font-semibold">{stats.total_documents}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Sections Extracted</div>
                    <div className="text-purple-400 font-semibold">{stats.total_sections_extracted}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Insights Generated</div>
                    <div className="text-orange-400 font-semibold">{stats.total_insights_generated}</div>
                  </div>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold mb-4">🕐 Recent Sessions</h3>
              
              {loading && (
                <div className="text-center text-gray-400 py-8">
                  Loading history...
                </div>
              )}

              {error && (
                <div className="text-center text-red-400 py-8">
                  {error}
                </div>
              )}

              {!loading && !error && history.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No analysis history found
                </div>
              )}

              <div className="space-y-3">
                {history.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => session.id && loadSessionDetails(session.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">
                        Session #{session.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                    
                    {session.documents && session.documents.length > 0 && (
                      <div className="text-sm text-gray-300 mb-1">
                        📄 {session.documents[0].filename}
                        {session.documents.length > 1 && ` +${session.documents.length - 1} more`}
                      </div>
                    )}
                    
                    {session.persona && (
                      <div className="text-xs text-blue-400">
                        👤 {session.persona}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        Status: {session.status || 'completed'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSession(session);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Session Details */}
          <div className="w-1/2 flex flex-col">
            {selectedSession ? (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-semibold mb-4">🔍 Session Details</h3>
                
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">ℹ️ Session Info</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-400">ID:</span> {selectedSession.id}</div>
                      <div><span className="text-gray-400">Created:</span> {formatDate(selectedSession.created_at)}</div>
                      {selectedSession.persona && (
                        <div><span className="text-gray-400">Persona:</span> {selectedSession.persona}</div>
                      )}
                      {selectedSession.status && (
                        <div><span className="text-gray-400">Status:</span> {selectedSession.status}</div>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  {selectedSession.documents && selectedSession.documents.length > 0 && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">📄 Documents</h4>
                      <div className="space-y-2">
                        {selectedSession.documents.map((doc, index) => (
                          <div key={index} className="text-sm">
                            <div className="text-white">{doc.filename}</div>
                            <div className="text-gray-400 text-xs">
                              Uploaded: {formatDate(doc.upload_timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structure/Sections */}
                  {selectedSession.sections && selectedSession.sections.length > 0 && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">📖 Extracted Sections ({selectedSession.sections.length})</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                          {selectedSession.sections.map((section, index) => (
                            <div key={index} className="text-gray-300">
                              <span className="text-blue-400">Page {section.page_number}:</span> {section.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {selectedSession.insights && selectedSession.insights.length > 0 && (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">💡 Generated Insights ({selectedSession.insights.length})</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <div className="space-y-2 text-sm">
                          {selectedSession.insights.map((insight, index) => (
                            <div key={index} className="border-l-2 border-orange-500 pl-2">
                              <div className="text-orange-400 text-xs">{insight.insight_type}</div>
                              <div className="text-gray-300">{insight.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Load Session Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleLoadSession(selectedSession)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      🔄 Load This Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                👈 Select a session to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
