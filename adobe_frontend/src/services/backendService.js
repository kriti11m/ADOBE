/**
 * Backend Service for Adobe Hackathon Finale Integration
 * Handles document upload and integrates with finale features
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class BackendService {
  constructor() {
    this.API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    console.log('🚀 Backend Service initialized for Adobe Hackathon Finale');
  }

  // Upload single PDF document to finale backend
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Document uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  // Get list of all documents
  async getDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      return [];
    }
  }

  // Get document details by ID
  async getDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching document:', error);
      throw error;
    }
  }

  // Legacy method - now returns finale-friendly response
  async getRecommendations(files, persona = 'Researcher', job = 'Analyze document content', profileId = null) {
    try {
      console.log('📊 Legacy recommendations called - using finale backend approach');
      
      // Return a simplified response that works with existing UI
      return {
        success: true,
        message: 'Document uploaded successfully. Use text selection to get cross-document insights.',
        extracted_sections: [],
        recommendations: [{
          id: 'finale-feature-1',
          title: "Text Selection Available",
          description: "Select any text in this document to find related content across your document collection and generate AI insights.",
          category: "Feature",
          relevance: 95,
          color: 'green',
          keyPoints: ['Select text in PDF', 'Find related sections', 'Generate AI insights']
        }, {
          id: 'finale-feature-2',
          title: "Cross-Document Search", 
          description: "The new finale backend enables semantic search across all your documents when you select text.",
          category: "Feature",
          relevance: 90,
          color: 'blue',
          keyPoints: ['Semantic similarity', 'Cross-document search', 'Related content discovery']
        }, {
          id: 'finale-feature-3',
          title: "AI Insights Bulb",
          description: "Generate AI-powered insights including key takeaways, examples, and cross-document connections.",
          category: "Bonus Feature",
          relevance: 85,
          color: 'purple',
          keyPoints: ['Key takeaways', 'Did you know facts', 'Cross-document inspirations']
        }],
        analysis_summary: "Document ready for text selection and cross-document analysis using the finale features.",
        persona_insights: "Use the new text selection features to explore connections across your document library.",
        session_id: `finale-session-${Date.now()}`
      };
      
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      
      // Return fallback response to prevent UI breaking
      return {
        success: false,
        message: 'Recommendations temporarily unavailable. Document upload was successful.',
        extracted_sections: [],
        recommendations: [{
          id: 'upload-success',
          title: "Upload Successful",
          description: "Your document was uploaded successfully. Text selection features are available.",
          category: "Status",
          relevance: 70,
          color: 'green',
          keyPoints: ['Upload complete', 'Text selection ready', 'Finale features available']
        }],
        analysis_summary: "Document uploaded - ready for finale features.",
        persona_insights: "Use text selection to explore document connections.",
        session_id: `finale-fallback-${Date.now()}`
      };
    }
  }

  // Legacy collection recommendations - simplified for finale
  async getCollectionRecommendations(collectionFiles, persona = 'Researcher', job = 'Analyze document collection') {
    try {
      console.log('📊 Collection recommendations - using finale approach');
      
      return {
        success: true,
        message: 'Collection ready for cross-document analysis',
        extracted_sections: [],
        recommendations: [{
          id: 'collection-ready',
          title: "Collection Analysis Ready",
          description: "Your document collection is ready for cross-document text selection and semantic search.",
          category: "Collection",
          relevance: 95,
          color: 'green',
          keyPoints: ['Collection ready', 'Cross-document search', 'Text selection enabled']
        }],
        analysis_summary: `Collection of ${collectionFiles?.length || 0} documents ready for finale features.`,
        session_id: `finale-collection-${Date.now()}`
      };
    } catch (error) {
      console.error('Error getting collection recommendations:', error);
      return {
        success: false,
        message: 'Collection analysis temporarily unavailable',
        recommendations: [],
        session_id: null
      };
    }
  }

  // Find related sections using finale text selection service
  async findRelatedSections(selectedText, documentId, maxResults = 5) {
    try {
      const url = `${API_BASE_URL}/text-selection/find-related`;
      console.log('🔍 Finding related sections for selected text...');
      console.log('🔗 Request URL:', url);
      console.log('🔗 API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          document_id: documentId,
          max_results: maxResults,
          similarity_threshold: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.related_sections || [];
    } catch (error) {
      console.error('Error finding related sections:', error);
      throw error;
    }
  }

  // NEW: Find relevant sections using Part 1B text-based analysis
  async findRelevantSections(selectedText, documentId = null) {
    try {
      console.log('🚀 Finding relevant sections with Part 1B text analysis...');
      console.log('   Selected text:', selectedText.substring(0, 100) + '...');
      
      const response = await fetch(`${API_BASE_URL}/part1b/find-relevant-sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          document_id: documentId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to find relevant sections');
      }

      console.log('✅ Found relevant sections:', data.relevant_sections?.length || 0);
      console.log('   Top relevance score:', data.relevant_sections?.[0]?.relevance_score || 'N/A');
      
      // Transform to match expected format for Smart Connections UI
      const transformedSections = (data.relevant_sections || []).map((section, index) => ({
        id: `section-${section.document_id}-${index}`,
        section: section.section_title,
        title: section.section_title,
        document: section.document_name,
        document_name: section.document_name,
        page: section.page,
        relevance: Math.round(section.relevance_score * 100),
        relevance_score: section.relevance_score,
        snippet: section.snippet,
        content_preview: section.content_preview,
        category: 'Relevant Section',
        color: section.relevance_score > 0.8 ? 'green' : section.relevance_score > 0.6 ? 'blue' : 'yellow',
        keyPoints: section.enhanced_analysis?.key_reasons || 
                  [`Relevance: ${Math.round(section.relevance_score * 100)}%`],
        metadata: section.metadata || {},
        enhanced_analysis: section.enhanced_analysis || {}
      }));

      return {
        success: true,
        selectedText: data.selected_text,
        sections: transformedSections,
        totalAnalyzed: data.total_sections_analyzed,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('❌ Error finding relevant sections:', error);
      return {
        success: false,
        error: error.message,
        sections: []
      };
    }
  }

  // Check audio cache for different voices
  async checkAudioCache(selectedText, relatedSections, audioType = 'overview', duration = 3, insights = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/insights/check-audio-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          related_sections: relatedSections,
          audio_type: audioType,
          duration_minutes: duration,
          voice: 'female', // Default voice for hash generation
          speed: 1.0,
          insights: insights  // Include insights in cache check
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking audio cache:', error);
      return { cached_voices: { male: false, female: false } };
    }
  }

  // Generate audio overview using finale TTS service
  async generateAudioOverview(selectedText, relatedSections, audioType = 'overview', duration = 3, voice = 'female', speed = 1.0, insights = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/insights/generate-audio-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          related_sections: relatedSections,
          audio_type: audioType,
          duration_minutes: duration,
          voice: voice,
          speed: speed,
          insights: insights
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Return blob for audio file
      return await response.blob();
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }


  // Check backend health
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // Helper method to extract key points from content (legacy support)
  extractKeyPoints(content) {
    if (!content) return [];
    
    // Simple extraction of first few sentences
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  // Legacy method for processing files (simplified)
  async processFiles(files, userProfile) {
    try {
      console.log('📁 Processing files for finale backend...');
      
      const results = [];
      for (const file of files) {
        const result = await this.uploadDocument(file);
        results.push(result);
      }
      
      return {
        success: true,
        processed_files: results,
        message: `Successfully processed ${results.length} files`
      };
    } catch (error) {
      console.error('Error processing files:', error);
      throw error;
    }
  }

  // Get available TTS engines (for legacy compatibility)
  async getAvailableTTSEngines() {
    try {
      // For finale backend, return mock TTS engines info
      return [
        { id: 'pyttsx3', name: 'pyttsx3', available: true },
        { id: 'gtts', name: 'Google TTS', available: true }
      ];
    } catch (error) {
      console.error('Error getting TTS engines:', error);
      return [
        { id: 'mock', name: 'Mock TTS', available: true }
      ];
    }
  }

  // Legacy method: Extract PDF structure (for compatibility)
  async extractStructure(file) {
    try {
      // For finale backend, we don't need structure extraction
      // Return a simple success response
      return {
        success: true,
        message: 'Document ready for text selection',
        sections: [],
        pages: 1
      };
    } catch (error) {
      console.error('Error extracting structure:', error);
      throw error;
    }
  }

  // Generate AI insights using finale insights bulb
  async generateInsightsBulb(selectedText, relatedSections, insightTypes = null) {
    try {
      const defaultInsightTypes = ['key_takeaways', 'did_you_know', 'contradictions', 'examples'];
      
      const response = await fetch(`${API_BASE_URL}/insights/generate-insights-bulb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          related_sections: relatedSections,
          insight_types: insightTypes || defaultInsightTypes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data; // Return full response object instead of just data.insights
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backendService = new BackendService();
export default backendService;
