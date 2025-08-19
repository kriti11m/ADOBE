import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw, Lightbulb, Zap, Brain, Sparkles, ChevronLeft, BookOpen, FileText } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';
import FinaleIntegrationService from '../services/finaleIntegrationService';

// Mock data for related sections (matching your provided design)
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

// Mock data for AI insights (matching your provided design)
const mockInsights = {
  keyTakeaways: [
    "Machine learning algorithms can process vast amounts of data faster than traditional methods",
    "Neural networks require substantial computational resources for training", 
    "Deep learning has achieved human-level performance in many specific tasks",
  ],
  didYouKnow: [
    "The first neural network was created in 1943 by Warren McCulloch and Walter Pitts",
    "GPT-3 has 175 billion parameters, making it one of the largest language models",
    "Computer vision models can now identify objects with 99% accuracy in controlled environments",
  ],
  contradictions: [
    "While AI excels at pattern recognition, it struggles with common sense reasoning",
    "Despite processing speed advantages, AI systems often lack the flexibility of human thinking",
    "Advanced AI models require enormous energy consumption, contradicting sustainability goals",
  ],
  examples: [
    "Netflix uses machine learning to recommend movies based on viewing history",
    "Tesla's autopilot system employs deep learning for real-time decision making", 
    "Medical AI can detect certain cancers more accurately than human radiologists",
  ],
};

const SmartConnections = ({ 
  currentDocument, 
  recommendations, 
  currentSessionId,
  isProcessing, 
  onGetRecommendations, 
  activeCollection, 
  onNavigateToSection,
  pdfStructure,
  isExtractingStructure,
  currentSection,
  selectedTextData
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarView, setSidebarView] = useState('sections'); // 'sections' or 'insights'
  const [selectedSection, setSelectedSection] = useState(null);
  const [generatedInsights, setGeneratedInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const { isDarkMode } = useDarkMode();
  
  // Use passed recommendations or empty array
  const relatedSections = recommendations || [];

  // Generate insights from selected text and relevant sections
  const handleGenerateInsights = async () => {
    if (!recommendations || recommendations.length === 0) {
      setInsightsError('No relevant sections found. Please run Smart Connections first.');
      return;
    }

    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('No selected text available. Please select text in the PDF first.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      console.log('🔄 Generating text-based insights...');
      console.log('🔄 Selected text:', selectedTextData.selectedText.substring(0, 100) + '...');
      console.log('🔄 Relevant sections:', recommendations.length);
      
      const response = await backendService.generateInsightsBulb(
        selectedTextData.selectedText,
        recommendations
      );
      
      console.log('✅ Generated insights response:', response);
      
      if (response && response.success) {
        setGeneratedInsights(response.insights);
        setSidebarView('insights');
      } else {
        throw new Error(response?.error || 'Failed to generate insights');
      }
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setInsightsError('Failed to generate insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Handle section click with navigation
  const handleSectionClick = (section) => {
    console.log('📍 Section clicked:', section);
    setSelectedSection(section);
    
    if (onNavigateToSection && typeof onNavigateToSection === 'function') {
      onNavigateToSection(section);
    }
  };

  // Smart Connections API Call
  const handleSmartConnectionsClick = async () => {
    if (!selectedTextData || !selectedTextData.selectedText) {
      setInsightsError('Please select text in the PDF first.');
      return;
    }

    setInsightsError(null);
    
    try {
      console.log('🔄 Starting Smart Connections analysis...');
      console.log('📝 Selected text:', selectedTextData.selectedText.substring(0, 200) + '...');
      
      const smartConnectionsData = await FinaleIntegrationService.getSmartConnections(
        selectedTextData.selectedText,
        currentDocument?.name || 'Current Document'
      );
      
      console.log('✅ Smart Connections response:', smartConnectionsData);
      
      if (smartConnectionsData && smartConnectionsData.relevant_sections) {
        onGetRecommendations(smartConnectionsData.relevant_sections);
        console.log(`📊 Found ${smartConnectionsData.relevant_sections.length} relevant sections`);
      } else {
        console.warn('⚠️ No relevant sections returned');
        setInsightsError('No relevant sections found for the selected text.');
      }
      
    } catch (error) {
      console.error('❌ Smart Connections error:', error);
      setInsightsError('Failed to find relevant sections. Please try again.');
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
      className={`${sidebarExpanded ? "w-96" : "w-16"} border-l ${sidebarClasses} transition-all duration-300 ease-in-out flex flex-col`}
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
        <div className="p-6 flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Smart Connections</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSidebarView(sidebarView === "sections" ? "insights" : "sections")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  sidebarView === "insights" 
                    ? isDarkMode 
                      ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 shadow-lg shadow-yellow-500/25 ring-2 ring-yellow-500/30" 
                      : "bg-yellow-100 hover:bg-yellow-200 text-yellow-600 shadow-lg shadow-yellow-500/25 ring-2 ring-yellow-300/50"
                    : isDarkMode 
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                variant="ghost"
                size="sm"
              >
                {sidebarView === "sections" ? (
                  <Lightbulb className="w-4 h-4 text-yellow-400 animate-pulse drop-shadow-lg" style={{
                    filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
                  }} />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
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
              // Related Sections View (matching your design exactly)
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"} mb-4`}>
                  Top 5 Related Sections
                </h4>
                {mockRelatedSections.map((section, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 hover:bg-slate-700 border-slate-600" : "bg-white/80 hover:bg-white border-gray-200"} border transition-all duration-300 hover:shadow-lg cursor-pointer group`}
                    onClick={() => handleSectionClick(section)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"} font-medium`}
                      >
                        Page {section.pageNumber}
                      </span>
                    </div>
                    <h5
                      className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 text-sm group-hover:text-blue-600 transition-colors`}
                    >
                      {section.title}
                    </h5>
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"} leading-relaxed`}>
                      {section.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // AI Insights View (matching your design exactly)
              <div className="space-y-6">
                <h4
                  className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"} mb-4 flex items-center gap-2`}
                >
                  <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse drop-shadow-lg" />
                  AI Insights
                </h4>

                {/* Key Takeaways */}
                <div
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                >
                  <h5
                    className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-3 text-sm flex items-center gap-2`}
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Key Takeaways
                  </h5>
                  <ul className="space-y-2">
                    {mockInsights.keyTakeaways.map((takeaway, index) => (
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
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                >
                  <h5
                    className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-3 text-sm flex items-center gap-2`}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Did You Know?
                  </h5>
                  <ul className="space-y-2">
                    {mockInsights.didYouKnow.map((fact, index) => (
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
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                >
                  <h5
                    className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-3 text-sm flex items-center gap-2`}
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Contradictions / Counterpoints
                  </h5>
                  <ul className="space-y-2">
                    {mockInsights.contradictions.map((contradiction, index) => (
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
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-white/80 border-gray-200"} border`}
                >
                  <h5
                    className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-3 text-sm flex items-center gap-2`}
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Examples
                  </h5>
                  <ul className="space-y-2">
                    {mockInsights.examples.map((example, index) => (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartConnections;
