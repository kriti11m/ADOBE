const API_BASE_URL = 'http://localhost:8083';

class ProfileService {
  
  // Get all profiles
  async getAllProfiles() {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  // Get profile by ID
  async getProfile(profileId) {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Create new profile
  async createProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(profileId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Delete profile
  async deleteProfile(profileId) {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Get profile statistics
  async getProfileStats(profileId) {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${profileId}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      throw error;
    }
  }

  // Get profile history
  async getProfileHistory(profileId, limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/profiles/${profileId}/history?limit=${limit}&offset=${offset}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile history:', error);
      throw error;
    }
  }
}

export default new ProfileService();
