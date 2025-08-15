/**
 * Frontend Integration Service for Adobe Hackathon Finale
 * Connects React components to backend finale features
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class FinaleIntegrationService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Find related sections across documents for selected text
   */
  async findRelatedSections(selectedText, documentId, maxResults = 5) {
    try {
      const response = await fetch(`${this.baseURL}/text-selection/find-related`, {
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

  /**
   * Navigate to a specific section in a document
   */
  async navigateToSection(documentId, sectionId, pageNumber) {
    try {
      const response = await fetch(`${this.baseURL}/text-selection/navigate-to-snippet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          section_id: sectionId,
          page_number: pageNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error navigating to section:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights for selected text (Bonus +5 points)
   */
  async generateInsightsBulb(selectedText, relatedSections, insightTypes = null) {
    try {
      const defaultInsightTypes = ['key_takeaways', 'did_you_know', 'contradictions', 'examples'];
      
      const response = await fetch(`${this.baseURL}/insights/generate-insights-bulb`, {
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
      return data.insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  /**
   * Generate audio overview or podcast (Bonus +5 points)
   */
  async generateAudioOverview(selectedText, relatedSections, audioType = 'overview', duration = 3) {
    try {
      const response = await fetch(`${this.baseURL}/insights/generate-audio-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          related_sections: relatedSections,
          audio_type: audioType,
          duration_minutes: duration
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

  /**
   * Test semantic similarity between two text passages
   */
  async testSimilarity(text1, text2) {
    try {
      const response = await fetch(
        `${this.baseURL}/text-selection/similarity-test?text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing similarity:', error);
      throw error;
    }
  }

  /**
   * Check backend health and available features
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /**
   * Helper: Extract text from PDF text selection event
   */
  extractSelectedText(selectionEvent) {
    if (selectionEvent && selectionEvent.selection && selectionEvent.selection.text) {
      return selectionEvent.selection.text.trim();
    }
    return null;
  }

  /**
   * Helper: Create audio download URL from blob
   */
  createAudioDownloadURL(audioBlob) {
    return URL.createObjectURL(audioBlob);
  }

  /**
   * Helper: Play audio from blob
   */
  playAudioFromBlob(audioBlob) {
    const audioURL = this.createAudioDownloadURL(audioBlob);
    const audio = new Audio(audioURL);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
    return audio;
  }

  /**
   * Workflow: Complete finale feature pipeline
   * 1. Find related sections for selected text
   * 2. Generate AI insights
   * 3. Optionally generate audio overview
   */
  async completeFinaleWorkflow(selectedText, documentId, options = {}) {
    try {
      const {
        maxResults = 5,
        generateInsights = true,
        generateAudio = false,
        audioType = 'overview',
        insightTypes = ['key_takeaways', 'did_you_know']
      } = options;

      const results = {
        selectedText,
        documentId,
        relatedSections: [],
        insights: null,
        audioBlob: null,
        error: null
      };

      // Step 1: Find related sections
      console.log('🔍 Finding related sections...');
      results.relatedSections = await this.findRelatedSections(selectedText, documentId, maxResults);
      console.log(`✅ Found ${results.relatedSections.length} related sections`);

      // Step 2: Generate insights (if requested)
      if (generateInsights && results.relatedSections.length > 0) {
        console.log('💡 Generating AI insights...');
        results.insights = await this.generateInsightsBulb(selectedText, results.relatedSections, insightTypes);
        console.log('✅ Insights generated successfully');
      }

      // Step 3: Generate audio (if requested)
      if (generateAudio && results.relatedSections.length > 0) {
        console.log('🎧 Generating audio overview...');
        results.audioBlob = await this.generateAudioOverview(selectedText, results.relatedSections, audioType);
        console.log('✅ Audio generated successfully');
      }

      return results;

    } catch (error) {
      console.error('Error in finale workflow:', error);
      return {
        selectedText,
        documentId,
        relatedSections: [],
        insights: null,
        audioBlob: null,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const finaleIntegrationService = new FinaleIntegrationService();
export default finaleIntegrationService;
