import React, { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { useDarkMode } from '../App';

const PDFViewer = ({ currentDocument }) => {
  const [currentSection, setCurrentSection] = useState('3.2 Experimental Setup');
  const [showSectionHeader, setShowSectionHeader] = useState(false);
  const { isDarkMode } = useDarkMode();

  const sections = [
    '1. Introduction',
    '2. Methodology Framework', 
    '3. Experimental Setup',
    '4. Results and Analysis'
  ];

  useEffect(() => {
    if (currentDocument) {
      setShowSectionHeader(true);
      // Simulate section cycling
      const interval = setInterval(() => {
        setCurrentSection(sections[Math.floor(Math.random() * sections.length)]);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setShowSectionHeader(false);
    }
  }, [currentDocument, sections]);

  if (!currentDocument) {
    return (
      <div className={`flex-1 flex flex-col relative transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <span className="text-3xl">📄</span>
            </div>
            <h3 className={`text-xl font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Select a document to begin</h3>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Your personalized reading experience awaits</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span>🔍</span>
                <span>Smart search</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔗</span>
                <span>Cross-document links</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💡</span>
                <span>AI insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col relative transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Current Section Header */}
      {showSectionHeader && (
        <div className={`border-b transition-colors duration-300 px-6 py-3 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Current Section:</span>
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentSection}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
                <Search className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className={`flex-1 shadow-lg rounded-lg m-4 overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {currentDocument.name.replace('.pdf', '')}
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              A comprehensive guide to modern ML approaches
            </p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="section-content mb-8" data-section="1. Introduction">
              <h2 className={`text-2xl font-semibold mb-4 animate-highlight-pulse ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>1. Introduction</h2>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Machine learning has revolutionized how we approach complex data analysis problems. This comprehensive guide explores modern methodologies that align with current research trends and practical applications.
              </p>
            </div>
            
            <div className="section-content mb-8" data-section="2. Methodology Framework">
              <h2 className={`text-2xl font-semibold mb-4 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>2. Methodology Framework</h2>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Our framework incorporates both supervised and unsupervised learning techniques, with particular emphasis on model validation and cross-validation strategies that ensure robust performance across diverse datasets.
              </p>
            </div>
            
            <div className={`section-content mb-8 ${
              isDarkMode ? 'section-highlight-dark' : 'section-highlight'
            }`} data-section="3. Experimental Setup">
              <h2 className={`text-2xl font-semibold mb-4 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>3. Experimental Setup</h2>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                The experimental design follows a rigorous protocol with controlled variables and standardized metrics. We employed a multi-stage validation process to ensure reproducibility and statistical significance of our findings.
              </p>
              <h3 className={`text-xl font-medium mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>3.1 Data Preparation</h3>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Data preprocessing involved normalization, feature selection, and handling of missing values using advanced imputation techniques.
              </p>
              <h3 className={`text-xl font-medium mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>3.2 Model Selection</h3>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                We compared multiple algorithms including Random Forest, Support Vector Machines, and Neural Networks to identify the optimal approach for each dataset characteristic.
              </p>
            </div>
            
            <div className="section-content mb-8" data-section="4. Results and Analysis">
              <h2 className={`text-2xl font-semibold mb-4 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>4. Results and Analysis</h2>
              <p className={`mb-4 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Our analysis reveals significant improvements in prediction accuracy when using ensemble methods compared to individual algorithms. The results demonstrate a 23% improvement in F1-score across all test scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
