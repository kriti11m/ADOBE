// History Service for Session Management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class HistoryService {
  // Get analysis history with pagination
  async getHistory(limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/history/?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  // Get detailed session information
  async getSessionDetails(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/history/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  // Check if document was already analyzed
  async isDocumentAnalyzed(filename) {
    try {
      const history = await this.getHistory(100, 0); // Get recent history
      
      if (!history.history) return false;
      
      // Check if any session contains this document
      return history.history.some(session => {
        return session.documents && session.documents.some(doc => 
          doc.filename === filename || doc.filename.includes(filename)
        );
      });
    } catch (error) {
      console.warn('Error checking document analysis status:', error);
      return false;
    }
  }

  // Get cached results for a document
  async getCachedResults(filename) {
    try {
      const history = await this.getHistory(100, 0);
      
      if (!history.history) return null;
      
      // Find session with this document
      const session = history.history.find(session => {
        return session.documents && session.documents.some(doc => 
          doc.filename === filename || doc.filename.includes(filename)
        );
      });
      
      if (!session) return null;
      
      // Get full session details
      return await this.getSessionDetails(session.id);
    } catch (error) {
      console.error('Error getting cached results:', error);
      return null;
    }
  }

  // Format session for display
  formatSessionForDisplay(session) {
    return {
      id: session.id,
      timestamp: new Date(session.session_timestamp).toLocaleDateString(),
      persona: session.persona,
      task: session.job_description,
      documentCount: session.documents ? session.documents.length : 0,
      sectionCount: session.extracted_sections ? session.extracted_sections.length : 0,
      hasInsights: session.insights && session.insights.length > 0
    };
  }

  // Get document analysis status for sidebar
  async getDocumentStatuses(documents) {
    try {
      const history = await this.getHistory(200, 0); // Get more history for status check
      
      if (!history.history) return documents;
      
      // Create lookup map of analyzed documents
      const analyzedDocs = new Set();
      history.history.forEach(session => {
        if (session.documents) {
          session.documents.forEach(doc => {
            analyzedDocs.add(doc.filename);
          });
        }
      });
      
      // Update document statuses
      return documents.map(doc => ({
        ...doc,
        isAnalyzed: analyzedDocs.has(doc.name),
        analysisStatus: analyzedDocs.has(doc.name) ? 'analyzed' : 'new'
      }));
    } catch (error) {
      console.error('Error getting document statuses:', error);
      return documents; // Return unchanged if error
    }
  }
}

const historyService = new HistoryService();
export default historyService;
