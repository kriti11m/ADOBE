// Backend Service for communicating with FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

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
  async getRecommendations(files, persona = 'Researcher', job = 'Analyze document content', profileId = null) {
    const formData = new FormData();
    
    // Append files
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Append form data
    formData.append('persona', persona);
    formData.append('job', job);
    
    // Append profile_id if provided
    if (profileId) {
      formData.append('profile_id', profileId);
    }
    
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
        originalData: section,
        keyPoints: this.extractKeyPoints(section.content || section.section_title),
        fullContent: section.content || section.section_title,
        conceptType: this.identifyConceptType(section.section_title),
        // Enhanced navigation data
        sectionTitle: section.section_title,
        pageNumber: section.page_number,
        coordinates: section.coordinates || null
      }));
      
      console.log('Transformed sections for Smart Connections:', transformedSections);
      
      // Return both recommendations and session_id for cross-document analysis
      return {
        recommendations: transformedSections,
        session_id: result.session_id,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Generate insights from Part 1B data
  async generateInsightsFromRecommendations(recommendations, persona = 'Researcher', job = 'Generate insights', sessionId = null) {
    try {
      // Transform recommendations back to the format expected by insights backend
      const sections = recommendations.map(rec => ({
        document: rec.document,
        section_title: rec.section,
        page_number: rec.pageNumber || parseInt(rec.page.replace('Page ', '')),
        content: rec.fullContent,
        importance_rank: recommendations.indexOf(rec) + 1,
        coordinates: rec.coordinates
      }));

      const payload = {
        extracted_sections: sections,
        metadata: {
          persona: job, // Use the job as the persona for more targeted insights
          job: job,     // Keep job as well for backward compatibility
          processed_at: new Date().toISOString(),
          source: "frontend_recommendations",
          session_id: sessionId  // Include session_id for cross-document analysis
        }
      };

      console.log('🔄 Sending payload to insights backend:', payload);
      console.log('📊 Session ID for cross-document analysis:', sessionId);

      const response = await fetch(`${API_BASE_URL}/insights/generate-from-sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Insights response:', result);
      return result;
    } catch (error) {
      console.error('Error generating insights from recommendations:', error);
      throw error;
    }
  }

  // Generate podcast from recommendations or current section
  async generatePodcast(recommendations, persona = 'Researcher', job = 'Generate podcast', sessionId = null) {
    try {
      let sections;
      
      if (Array.isArray(recommendations)) {
        // Transform recommendations to sections format
        sections = recommendations.map(rec => ({
          document: rec.document,
          section_title: rec.section,
          page_number: rec.pageNumber || parseInt(rec.page.replace('Page ', '')),
          content: rec.fullContent,
          importance_rank: recommendations.indexOf(rec) + 1,
          coordinates: rec.coordinates
        }));
      } else {
        // Single section from current document
        sections = [{
          document: recommendations.name || 'Current Document',
          section_title: 'Selected Content',
          page_number: 1,
          content: recommendations.content || 'Selected section content',
          importance_rank: 1
        }];
      }

      const payload = {
        sections: sections,
        persona: persona,
        job: job,
        session_id: sessionId
      };

      console.log('🎧 Generating podcast with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/insights/podcast-only`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Podcast generation error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Podcast generated successfully:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error generating podcast:', error);
      throw error;
    }
  }

  // Generate audio from podcast script
  async generatePodcastAudio(podcastScript, ttsEngine = 'gtts', voiceSettings = null) {
    try {
      console.log('🎵 Generating podcast audio...', { ttsEngine });
      
      const response = await fetch(`${API_BASE_URL}/insights/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcast_script: podcastScript,
          tts_engine: ttsEngine,
          voice_settings: voiceSettings
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Audio generation error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Return the audio blob
      const audioBlob = await response.blob();
      console.log('✅ Audio generated successfully');
      
      return audioBlob;
      
    } catch (error) {
      console.error('❌ Error generating audio:', error);
      throw error;
    }
  }

  // Get available TTS engines
  async getAvailableTTSEngines() {
    try {
      const response = await fetch(`${API_BASE_URL}/insights/tts-engines`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching TTS engines:', error);
      throw error;
    }
  }

  // Generate insights (legacy file-based method)
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

  // Helper method to extract key points from content
  extractKeyPoints(content) {
    if (!content || typeof content !== 'string') return [];
    
    // Simple extraction of key points from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  // Helper method to identify concept type
  identifyConceptType(title) {
    if (!title) return 'General Concept';
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('definition') || lowerTitle.includes('concept')) {
      return 'Definition';
    } else if (lowerTitle.includes('example') || lowerTitle.includes('case')) {
      return 'Example';
    } else if (lowerTitle.includes('method') || lowerTitle.includes('process')) {
      return 'Process';
    } else if (lowerTitle.includes('theory') || lowerTitle.includes('principle')) {
      return 'Theory';
    }
    return 'Key Concept';
  }

  // Process multiple files
  async processFiles(files, userProfile) {
    const results = {
      structures: [],
      recommendations: [],
      errors: []
    };

    try {
      // Process each file
      for (const file of files) {
        try {
          // Extract structure
          const structure = await this.extractStructure(file);
          results.structures.push({ file, structure });
        } catch (error) {
          results.errors.push({ file: file.name, error: error.message });
        }
      }

      // Get recommendations for all files
      if (files.length > 0) {
        try {
          const result = await this.getRecommendations(
            files, 
            userProfile.role, 
            userProfile.task
          );
          
          // Handle new return format
          results.recommendations = result.recommendations || result;
          results.session_id = result.session_id;
          results.metadata = result.metadata;
        } catch (error) {
          results.errors.push({ 
            file: 'recommendations', 
            error: error.message 
          });
        }
      }

    } catch (error) {
      console.error('Error processing files:', error);
      results.errors.push({ file: 'general', error: error.message });
    }

    return results;
  }

  // Get document history
  async getHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/history/documents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting document history:', error);
      throw error;
    }
  }

  // Save document to history
  async saveToHistory(filename, analysis_results) {
    try {
      const response = await fetch(`${API_BASE_URL}/history/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          analysis_results
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  }
}

const backendService = new BackendService();
export default backendService;
