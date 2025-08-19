// Document Service - handles PDF document operations
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class DocumentService {
  async getAllDocuments(activeOnly = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/?active_only=${activeOnly}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async getDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  async uploadDocument(file, title = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload document: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async updateDocument(documentId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId, permanent = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}?permanent=${permanent}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async searchDocuments(query, activeOnly = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          active_only: activeOnly,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search documents: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async getDocumentStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/stats/summary`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document stats: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  // Utility functions
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}

const documentService = new DocumentService();
export default documentService;
