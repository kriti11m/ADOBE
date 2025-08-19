import React, { useState } from 'react';
import { RefreshCw, Lightbulb, Brain, ChevronLeft, BookOpen, FileText } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import FinaleIntegrationService from '../services/finaleIntegrationService';

// Mock data for fallback when no real data is available
const mockRelatedSections = [
  {
    pageNumber: 15,
    title: "Introduction to Machine Learning",
    snippet: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. This revolutionary approach has transformed how we process data and make predictions.",
  },
  {
    pageNumber: 23,
    title: "Neural Network Fundamentals", 
    snippet: "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes that process information using a connectionist approach to computation, mimicking the human brain's structure.",
  },
  {
    pageNumber: 41,
    title: "Deep Learning Applications",
    snippet: "Deep learning has found applications across various domains including computer vision, natural language processing, and speech recognition. These applications have revolutionized industries from healthcare to autonomous vehicles.",
  },
  {
    pageNumber: 67,
    title: "Training Algorithms", 
    snippet: "Training algorithms are essential for optimizing neural network performance. Backpropagation, gradient descent, and other optimization techniques help networks learn from data and improve their accuracy over time.",
  },
  {
    pageNumber: 89,
    title: "Future of AI",
    snippet: "The future of artificial intelligence holds immense potential for solving complex global challenges. From climate change to healthcare, AI technologies continue to evolve and offer innovative solutions for humanity's greatest problems.",
  },
];

const SmartConnections = ({ 
  currentDocument, 
  recommendations, 
  currentSessionId,
  isProcessing, 
  onGetRecommendations, 
  activeCollection, 
  onNavigateToSection,
  onLoadDocumentAndNavigate,
  pdfStructure,
  isExtractingStructure,
  currentSection,
  selectedTextData,
  onInsightsGenerated
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarView, setSidebarView] = useState('sections'); // 'sections' or 'insights'
  const [generatedInsights, setGeneratedInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [isLoadingRelatedSections, setIsLoadingRelatedSections] = useState(false);
  const { isDarkMode } = useDarkMode();
  
  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

  // Format backend data to match UI structure
  const formatRelatedSections = (backendSections) => {
    return backendSections.map((section, index) => ({
      pageNumber: section.page || section.page_number || section.pageNumber || 'N/A',
      title: section.section_title || section.sectionTitle || section.title || `Section ${index + 1}`, // Prioritize section_title from Part 1A
      snippet: section.snippet || section.content_preview || section.text?.substring(0, 200) + '...' || 'No preview available',
      document: section.document_name || section.document || 'Unknown Document',
      relevance: section.relevance || Math.round((section.relevance_score || 0.9) * 100),
      documentId: section.document_id || section.documentId, // Add document ID for navigation
      documentTitle: section.document_title || section.documentTitle || section.document_name,
      documentFilename: section.document_filename || section.documentFilename,
      sectionTitle: section.section_title || section.sectionTitle || section.title,
    }));
  };

  // Handle jumping to a specific section in a document
  const handleJumpToSection = async (section) => {
    try {
      console.log('🎯 Jumping to section:', section);
      
      if (!section.documentId || section.pageNumber === 'N/A') {
        console.warn('Cannot navigate: missing document ID or page number');
        return;
      }

      // Handle decimal page numbers (e.g., "2.3" -> page 2)
      const pageNum = parseInt(parseFloat(section.pageNumber));
      if (isNaN(pageNum) || pageNum < 1) {
        console.warn('Invalid page number:', section.pageNumber);
        return;
      }

      console.log(`📍 Navigating to page ${pageNum} from page number "${section.pageNumber}"`);

      // Check if this section is from the currently loaded document
      const isCurrentDocument = currentDocument && 
        (currentDocument.dbDocumentId === section.documentId || 
         currentDocument.id === section.documentId);

      if (isCurrentDocument) {
        // Navigate within current document - only pass page number
        if (onNavigateToSection) {
          console.log(`🎯 Navigating to page ${pageNum} in current document`);
          await onNavigateToSection(pageNum);
        } else {
          console.warn('Navigation function not available');
        }
      } else {
        // Load different document and then navigate
        if (onLoadDocumentAndNavigate) {
          console.log(`🎯 Loading document ${section.documentId} and navigating to page ${pageNum}`);
          await onLoadDocumentAndNavigate(section.documentId, pageNum, section.sectionTitle || section.title);
        } else {
          console.warn('Cross-document navigation function not available');
        }
      }
    } catch (error) {
      console.error('❌ Error jumping to section:', error);
    }
  };

  // Format backend insights to match UI structure
  const formatInsights = (backendInsights) => {
    console.log('formatInsights called with:', backendInsights);
    
    // If no backend data, return empty structure
    if (!backendInsights) {
      console.log('No backend insights data received');
      return {
        keyTakeaways: [],
        didYouKnow: [],
        contradictions: [],
        examples: [],
      };
    }

    // Check if the backend response has the actual insight structure we expect
    if (backendInsights.key_takeaways || backendInsights.did_you_know || 
        backendInsights.contradictions || backendInsights.examples) {
      return {
        keyTakeaways: Array.isArray(backendInsights.key_takeaways) 
          ? backendInsights.key_takeaways 
          : backendInsights.key_takeaways 
          ? [backendInsights.key_takeaways]
          : [],
        didYouKnow: Array.isArray(backendInsights.did_you_know) 
          ? backendInsights.did_you_know 
          : backendInsights.did_you_know 
          ? [backendInsights.did_you_know]
          : [],
        contradictions: Array.isArray(backendInsights.contradictions) 
          ? backendInsights.contradictions 
          : backendInsights.contradictions 
          ? [backendInsights.contradictions]
          : [],
        examples: Array.isArray(backendInsights.examples) 
          ? backendInsights.examples 
          : backendInsights.examples 
          ? [backendInsights.examples]
          : [],
      };
    }

    // Handle the actual backend response structure which has 'analysis' field
    if (backendInsights.analysis) {
      const analysisText = backendInsights.analysis;
      
      // Enhanced parser for structured insights
      const insights = {
        keyTakeaways: [],
        didYouKnow: [],
        contradictions: [],
        examples: [],
      };
      
      // Parse sections based on headers
      const sections = {
        'KEY TAKEAWAYS:': 'keyTakeaways',
        'DID YOU KNOW:': 'didYouKnow', 
        'CONTRADICTIONS/COUNTERPOINTS:': 'contradictions',
        'CONTRADICTIONS:': 'contradictions',
        'COUNTERPOINTS:': 'contradictions',
        'EXAMPLES:': 'examples'
      };
      
      // Split text by section headers and parse content
      let currentSection = null;
      const lines = analysisText.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this line is a section header
        let foundHeader = false;
        for (const [header, sectionKey] of Object.entries(sections)) {
          if (trimmedLine.toUpperCase().includes(header.toUpperCase())) {
            currentSection = sectionKey;
            foundHeader = true;
            break;
          }
        }
        
        // If not a header and we're in a section, parse the content
        if (!foundHeader && currentSection && trimmedLine.length > 10) {
          // Remove bullet points and clean up
          let cleanLine = trimmedLine.replace(/^[-•*]\s*/, '').trim();
          if (cleanLine.length > 5) {
            insights[currentSection].push(cleanLine);
          }
        }
      }
      
      // If parsing didn't work well, fall back to simple sentence splitting
      if (insights.keyTakeaways.length === 0 && insights.didYouKnow.length === 0 && 
          insights.contradictions.length === 0 && insights.examples.length === 0) {
        
        console.log('Structured parsing failed, using fallback method');
        const sentences = analysisText.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
        // Distribute sentences across categories
        sentences.forEach((sentence, index) => {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 10) {
            if (index % 4 === 0) insights.keyTakeaways.push(cleanSentence);
            else if (index % 4 === 1) insights.didYouKnow.push(cleanSentence);
            else if (index % 4 === 2) insights.examples.push(cleanSentence);
            else insights.contradictions.push(cleanSentence);
          }
        });
      }
      
      // Add metadata insights
      if (backendInsights.total_documents_analyzed > 0) {
        insights.didYouKnow.push(
          `This comprehensive analysis examined ${backendInsights.total_documents_analyzed} documents from your collection for cross-document insights.`
        );
      }
      
      if (backendInsights.related_sections_count > 0) {
        insights.didYouKnow.push(
          `Found ${backendInsights.related_sections_count} semantically related sections as starting points for analysis.`
        );
      }
      
      if (backendInsights.analysis_scope === 'comprehensive_cross_document') {
        insights.didYouKnow.push(
          `Analysis performed using Adobe Hackathon comprehensive cross-document insights methodology.`
        );
      }
      
      if (backendInsights.generated_with) {
        insights.didYouKnow.push(
          `Insights generated using ${backendInsights.generated_with}.`
        );
      }
      
      // Ensure each category has at least one item
      if (insights.keyTakeaways.length === 0) {
        insights.keyTakeaways.push('Cross-document analysis completed for your selected text.');
      }
      
      console.log('Parsed insights:', insights);
      return insights;
    }

    // Fallback: return empty structure
    console.log('Backend insights format not recognized, returning empty structure');
    return {
      keyTakeaways: [],
      didYouKnow: [],
      contradictions: [],
      examples: [],
    };
  };

  // Smart Connections API Call (Brain button functionality)
  const handleSmartConnectionsClick = async () => {
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('Please select text in the PDF first.');
      return;
    }

    setIsLoadingRelatedSections(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Starting Smart Connections analysis...');
      console.log('📝 Selected text:', selectedTextData.selectedText.substring(0, 200) + '...');
      
      // Create an instance of the service and call the correct method
      const finaleService = new FinaleIntegrationService();
      const smartConnectionsData = await finaleService.findRelevantSectionsGemini(
        selectedTextData.selectedText
      );
      
      console.log('✅ Smart Connections response:', smartConnectionsData);
      
      if (smartConnectionsData && smartConnectionsData.success && smartConnectionsData.sections) {
        // Format the backend data to match our UI structure
        const formattedSections = formatRelatedSections(smartConnectionsData.sections);
        onGetRecommendations(formattedSections);
        console.log(`📊 Found ${smartConnectionsData.sections.length} relevant sections`);
      } else {
        console.warn('⚠️ No relevant sections returned');
        setInsightsError('No relevant sections found for the selected text.');
      }
      
    } catch (error) {
      console.error('❌ Smart Connections error:', error);
      setInsightsError('Failed to find relevant sections. Please try again.');
    } finally {
      setIsLoadingRelatedSections(false);
    }
  };

  // Generate insights from selected text and relevant sections (Lightbulb button functionality)
  const handleGenerateInsights = async () => {
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('No selected text available. Please select text in the PDF first.');
      return;
    }

    // Use real sections if available, otherwise use mock data for demo
    const sectionsToUse = relatedSections.length > 0 ? relatedSections : mockRelatedSections;

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating text-based insights...');
      console.log('🔄 Selected text:', selectedTextData.selectedText.substring(0, 100) + '...');
      console.log('🔄 Using sections:', sectionsToUse.length);
      
      const response = await backendService.generateInsightsBulb(
        selectedTextData.selectedText,
        sectionsToUse
      );
      
      console.log('✅ Generated insights response:', response);
      
      if (response && response.success) {
        // Format the backend insights to match our UI structure
        const formattedInsights = formatInsights(response.insights);
        console.log('✅ Formatted insights:', formattedInsights);
        setGeneratedInsights(formattedInsights);
        setSidebarView('insights');
      } else {
        console.error('❌ Backend insights failed:', response);
        throw new Error(response?.error || 'Failed to generate insights');
      }
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setInsightsError(`Failed to generate insights: ${error.message}. Please try again.`);
      // Don't fall back to mock data - show the error instead
      setGeneratedInsights(null);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Handle section click with navigation
  const handleSectionClick = (section) => {
    console.log('📍 Section clicked:', section);
    
    if (!section.pageNumber || section.pageNumber === 'N/A') {
      console.warn('Cannot navigate: invalid page number');
      return;
    }

    // Handle decimal page numbers (e.g., "2.3" -> page 2)
    const pageNum = parseInt(parseFloat(section.pageNumber));
    if (isNaN(pageNum) || pageNum < 1) {
      console.warn('Invalid page number for navigation:', section.pageNumber);
      return;
    }

    // Check if this section is from the currently loaded document
    const isCurrentDocument = currentDocument && 
      (currentDocument.dbDocumentId === section.documentId || 
       currentDocument.id === section.documentId);

    if (isCurrentDocument) {
      // Navigate within current document - only pass page number
      if (onNavigateToSection && typeof onNavigateToSection === 'function') {
        console.log(`🎯 Navigating to page ${pageNum} in current document`);
        onNavigateToSection(pageNum);
      }
    } else {
      // Load different document and then navigate
      if (onLoadDocumentAndNavigate && typeof onLoadDocumentAndNavigate === 'function') {
        console.log(`🎯 Loading document ${section.documentId} and navigating to page ${pageNum}`);
        onLoadDocumentAndNavigate(section.documentId, pageNum, section.sectionTitle || section.title);
      }
    }
  };

  const Button = ({ children, className, variant = "default", size = "default", ...props }) => (
    <button className={`transition-all duration-300 ${className}`} {...props}>
      {children}
    </button>
  );

  // Sidebar styling classes
  const sidebarClasses = isDarkMode
    ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-xl'
    : 'bg-white/95 border-gray-200/60 backdrop-blur-xl shadow-sm';

  return (
    <div
      className={`${sidebarExpanded ? "w-80" : "w-16"} border-l ${sidebarClasses} transition-all duration-300 ease-in-out flex flex-col h-full`}
    >
      {!sidebarExpanded ? (
        // Collapsed state - only show Smart Connections icon
        <div className="flex-1 flex items-center justify-center">
          <Button
            onClick={() => setSidebarExpanded(true)}
            className={`w-12 h-12 rounded-xl ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"} transition-all duration-300 hover:scale-110 shadow-lg`}
            variant="ghost"
          >
            <Brain className="w-6 h-6" />
          </Button>
        </div>
      ) : (
        // Expanded state - show full content
        <div className="p-4 flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Smart Connections</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSidebarView(sidebarView === "sections" ? "insights" : "sections")}
                className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"} transition-all duration-300`}
                variant="ghost"
                size="sm"
              >
                {sidebarView === "sections" ? <Lightbulb className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setSidebarExpanded(false)}
                className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"} transition-all duration-300`}
                variant="ghost"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content based on selected view */}
          <div className="flex-1 overflow-y-auto">
            {sidebarView === "sections" ? (
              // Related Sections View
              <div className="space-y-3">
                {/* Selected Text Display & Action Button */}
                {selectedTextData && selectedTextData.selectedText ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}>
                      <div className={`text-xs font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                        Selected Text:
                      </div>
                      <div className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                        "{selectedTextData.selectedText.length > 120 
                          ? selectedTextData.selectedText.substring(0, 120) + '...' 
                          : selectedTextData.selectedText}"
                      </div>
                    </div>
                    
                    {/* Generate Sections Button */}
                    <Button
                      onClick={handleSmartConnectionsClick}
                      disabled={isLoadingRelatedSections || isGeneratingInsights}
                      className={`w-full py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                        isLoadingRelatedSections || isGeneratingInsights
                          ? isDarkMode
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoadingRelatedSections ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Finding Sections...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          <span>Find Related Sections</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className={`text-center py-6 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                    <FileText className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`} />
                    <h3 className="font-medium mb-2 text-sm">Select Text to Begin</h3>
                    <p className="text-xs">
                      Highlight any text in the PDF to discover related sections
                    </p>
                  </div>
                )}

                {/* Related Sections Results */}
                {relatedSections && relatedSections.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"} mb-3`}>
                      Related Sections ({relatedSections.length})
                    </h4>
                    
                    {relatedSections.slice(0, 5).map((section, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 hover:bg-slate-700 border-slate-600" : "bg-white/80 hover:bg-white border-gray-200"} border transition-all duration-300 hover:shadow-lg group`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (section.pageNumber !== 'N/A' && section.documentId) {
                                    handleJumpToSection(section);
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                                  section.pageNumber !== 'N/A' && section.documentId
                                    ? (isDarkMode 
                                        ? "bg-green-900/50 text-green-300 hover:bg-green-800/70" 
                                        : "bg-green-100 text-green-700 hover:bg-green-200")
                                    : (isDarkMode 
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed")
                                }`}
                                title={section.pageNumber !== 'N/A' && section.documentId
                                  ? `Jump to page ${section.pageNumber} in ${section.documentFilename || 'document'}`
                                  : 'Navigation unavailable for this section'}
                                disabled={section.pageNumber === 'N/A' || !section.documentId}
                              >
                                🎯 Jump to Section
                              </button>
                          </div>
                          {section.relevance && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              section.relevance > 80 ? 'bg-green-500/20 text-green-600' :
                              section.relevance > 60 ? 'bg-blue-500/20 text-blue-600' :
                              'bg-yellow-500/20 text-yellow-600'
                            }`}>
                              {section.relevance}% match
                            </div>
                          )}
                        </div>
                        <h5
                          className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm group-hover:text-blue-600 transition-colors`}
                        >
                          {section.title}
                        </h5>
                        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed mb-2`}>
                          {section.snippet}
                        </p>
                        {section.documentFilename && (
                          <div className={`text-xs ${isDarkMode ? "text-slate-500" : "text-gray-500"} italic`}>
                            From: {section.documentFilename}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : selectedTextData && selectedTextData.selectedText && !isLoadingRelatedSections ? (
                  <div className={`text-center py-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                    <p className="text-sm">Click "Find Related Sections" to discover connections</p>
                  </div>
                ) : null}

                {/* Error Display */}
                {insightsError && (
                  <div className={`p-3 rounded-xl text-sm ${
                    isDarkMode 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {insightsError}
                  </div>
                )}
              </div>
            ) : (
              // AI Insights View
              <div className="space-y-4">
                <h4
                  className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"} mb-3 flex items-center gap-2`}
                >
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  AI Insights
                </h4>

                {/* Generate Insights Button */}
                {!generatedInsights && (
                  <div className="text-center mb-4">
                    <Button
                      onClick={handleGenerateInsights}
                      disabled={isGeneratingInsights || !selectedTextData?.selectedText}
                      className={`px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 mx-auto text-sm ${
                        isGeneratingInsights || !selectedTextData?.selectedText
                          ? isDarkMode
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isGeneratingInsights ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4" />
                          <span>Generate AI Insights</span>
                        </>
                      )}
                    </Button>
                    
                    {!selectedTextData?.selectedText && (
                      <p className={`text-xs mt-2 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                        Select text first to generate insights
                      </p>
                    )}
                  </div>
                )}

                {/* Generated Insights Display */}
                {generatedInsights && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>Generated Insights</h3>
                      <Button
                        onClick={() => setGeneratedInsights(null)}
                        className={`text-xs px-2 py-1 rounded ${
                          isDarkMode 
                            ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Clear
                      </Button>
                    </div>

                    {/* Key Takeaways */}
                    <div
                      className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                    >
                      <h5
                        className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm flex items-center gap-2`}
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Key Takeaways
                      </h5>
                      <ul className="space-y-1">
                        {generatedInsights.keyTakeaways.slice(0, 3).map((takeaway, index) => (
                          <li
                            key={index}
                            className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed flex items-start gap-2`}
                          >
                            <span className="text-green-500 mt-1">•</span>
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Did You Know */}
                    <div
                      className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                    >
                      <h5
                        className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm flex items-center gap-2`}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Did You Know?
                      </h5>
                      <ul className="space-y-1">
                        {generatedInsights.didYouKnow.slice(0, 3).map((fact, index) => (
                          <li
                            key={index}
                            className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed flex items-start gap-2`}
                          >
                            <span className="text-blue-500 mt-1">•</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contradictions */}
                    <div
                      className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                    >
                      <h5
                        className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm flex items-center gap-2`}
                      >
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Contradictions / Counterpoints
                      </h5>
                      <ul className="space-y-1">
                        {generatedInsights.contradictions.slice(0, 3).map((contradiction, index) => (
                          <li
                            key={index}
                            className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed flex items-start gap-2`}
                          >
                            <span className="text-orange-500 mt-1">•</span>
                            {contradiction}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Examples */}
                    <div
                      className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                    >
                      <h5
                        className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm flex items-center gap-2`}
                      >
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Examples
                      </h5>
                      <ul className="space-y-1">
                        {generatedInsights.examples.slice(0, 3).map((example, index) => (
                          <li
                            key={index}
                            className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed flex items-start gap-2`}
                          >
                            <span className="text-purple-500 mt-1">•</span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {insightsError && (
                  <div className={`p-3 rounded-xl text-sm ${
                    isDarkMode 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {insightsError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartConnections;
