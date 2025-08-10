// Backend Service for communicating with FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class BackendService {
  // Test connection to backend
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // Extract PDF structure (Part 1A)
  async extractStructure(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/part1a/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error extracting PDF structure:', error);
      throw error;
    }
  }

  // Get document recommendations (Part 1B)
  async getRecommendations(files, persona = 'Researcher', job = 'Analyze document content') {
    const formData = new FormData();
    
    // Append files
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Append form data
    formData.append('persona', persona);
    formData.append('job', job);
    
    try {
      const response = await fetch(`${API_BASE_URL}/part1b/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform backend response to frontend format
      // Take top 3 sections from extracted_sections and format for SmartConnections
      const sections = result.extracted_sections || [];
      const transformedSections = sections.slice(0, 3).map((section, index) => ({
        id: `section-${index}`,
        document: section.document,
        page: `Page ${section.page_number}`,
        section: section.section_title,
        description: `Ranked #${section.importance_rank} most relevant section for your task: "${job}"`,
        relevance: Math.max(85 - (section.importance_rank - 1) * 5, 70), // Calculate relevance score
        color: index === 0 ? 'green' : index === 1 ? 'blue' : 'purple',
        originalData: section
      }));
      
      console.log('Transformed sections for Smart Connections:', transformedSections);
      return transformedSections;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Generate insights
  async generateInsights(files, persona = 'Researcher', job = 'Generate insights') {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('persona', persona);
    formData.append('job', job);
    
    try {
      const response = await fetch(`${API_BASE_URL}/insights/generate`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  // Generate podcast
  async generatePodcast(files, persona = 'Researcher', job = 'Create podcast') {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('persona', persona);
    formData.append('job', job);
    
    try {
      const response = await fetch(`${API_BASE_URL}/insights/podcast`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating podcast:', error);
      throw error;
    }
  }

  // Get document history
  async getHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/history/list`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }
}

// Export singleton instance
const backendService = new BackendService();
export default backendService;
