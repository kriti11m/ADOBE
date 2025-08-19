const API_BASE_URL = 'http://localhost:8083';

class CollectionService {
  // Create a new collection
  async createCollection(name, files, description = null, profileId = null) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (description) {
        formData.append('description', description);
      }
      
      // Add profile_id if provided
      if (profileId) {
        formData.append('profile_id', profileId);
      }
      
      // Add all files to FormData
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/collections/create`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Get all collections (profile-specific)
  async getCollections(limit = 100, offset = 0, profileId = null) {
    try {
      let url = `${API_BASE_URL}/collections/?limit=${limit}&offset=${offset}`;
      if (profileId) {
        url += `&profile_id=${profileId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  // Get a specific collection
  async getCollection(collectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw error;
    }
  }

  // Delete a collection
  async deleteCollection(collectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  // Get PDF document as blob URL for Adobe Embed API
  async getDocumentBlobUrl(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error getting document blob:', error);
      throw error;
    }
  }

  // Convert backend collection to frontend format
  convertToFrontendFormat(backendCollection) {
    return {
      id: `db-collection-${backendCollection.id}`,
      name: backendCollection.name,
      description: backendCollection.description,
      documents: backendCollection.documents.map(doc => ({
        id: `db-doc-${doc.id}`,
        name: doc.filename,
        dbDocumentId: doc.id,
        fileSize: doc.file_size,
        fileType: 'application/pdf',
        status: 'ready',
        timestamp: this.formatDate(doc.upload_timestamp),
        tags: ['From Database'],
        fromDatabase: true
      })),
      createdAt: backendCollection.created_at,
      updatedAt: backendCollection.updated_at,
      status: backendCollection.status,
      fromDatabase: true,
      dbCollectionId: backendCollection.id
    };
  }

  // Format date helper
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

const collectionService = new CollectionService();
export default collectionService;
