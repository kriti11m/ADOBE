// Part 1A Service for PDF Structure Extraction
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class Part1AService {
  // Extract PDF structure (title, headings, outline)
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
      
      const result = await response.json();
      
      // Transform response for frontend use
      return {
        title: result.title || 'Document',
        outline: result.outline || [],
        metadata: result.metadata || {},
        hasStructure: result.outline && result.outline.length > 0
      };
    } catch (error) {
      console.error('Error extracting PDF structure:', error);
      throw error;
    }
  }

  // Find current section based on page number
  findSectionByPage(pageNumber, outline) {
    if (!outline || outline.length === 0) return null;
    
    // Find the section that contains this page
    let currentSection = null;
    for (let i = 0; i < outline.length; i++) {
      const section = outline[i];
      if (section.page <= pageNumber) {
        currentSection = section;
      } else {
        break;
      }
    }
    
    return currentSection;
  }

  // Get navigation-friendly outline
  getNavigationOutline(outline) {
    if (!outline) return [];
    
    return outline.map((item, index) => ({
      id: `section-${index}`,
      text: item.text || item.title || `Section ${index + 1}`,
      page: item.page || 1,
      level: item.level || 'H1',
      indent: this.getLevelIndent(item.level)
    }));
  }

  // Get indentation level for TOC display
  getLevelIndent(level) {
    switch(level) {
      case 'H1': return 0;
      case 'H2': return 1;
      case 'H3': return 2;
      case 'H4': return 3;
      default: return 0;
    }
  }
}

const part1aService = new Part1AService();
export default part1aService;
