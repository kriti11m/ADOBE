import React from 'react';
import { FileText, ChevronRight, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useDarkMode } from '../App';

const DocumentOutline = ({ 
  currentDocument, 
  pdfStructure, 
  isExtractingStructure, 
  currentSection, 
  onNavigateToSection,
  onClose 
}) => {
  const { isDarkMode } = useDarkMode();

  // Don't show outline if no document is selected
  if (!currentDocument) {
    return null;
  }

  const handleSectionClick = (page, title) => {
    if (onNavigateToSection) {
      onNavigateToSection(page, title);
    }
  };

  return (
    <div className={`w-80 flex-shrink-0 border-r transition-colors duration-300 flex flex-col h-full ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className={`w-5 h-5 mr-2 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`font-semibold text-sm ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Document Outline
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-opacity-20 ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-300'
            }`}
            title="Close outline"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        
        <div className={`text-xs mt-2 truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {currentDocument.name}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isExtractingStructure ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Extracting document structure...
              </p>
            </div>
          </div>
        ) : pdfStructure && pdfStructure.hasStructure && pdfStructure.outline ? (
          <div className="space-y-1">
            <div className={`text-xs font-medium mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              📋 Table of Contents
            </div>
            
            {pdfStructure.outline.map((section, index) => (
              <div
                key={index}
                onClick={() => handleSectionClick(section.page, section.text)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  currentSection?.page === section.page
                    ? isDarkMode
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-blue-100 text-blue-900 border-blue-300 shadow-sm'
                    : isDarkMode
                      ? 'hover:bg-gray-700 text-gray-300 border-transparent hover:border-gray-600'
                      : 'hover:bg-white text-gray-700 border-transparent hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center">
                  <ChevronRight className={`w-4 h-4 mr-2 transition-transform ${
                    currentSection?.page === section.page ? 'rotate-90' : ''
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      section.level > 1 ? 'ml-' + (section.level - 1) * 2 : ''
                    }`}>
                      {section.text}
                    </div>
                    <div className={`text-xs mt-1 ${
                      currentSection?.page === section.page
                        ? isDarkMode ? 'text-blue-200' : 'text-blue-700'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Page {section.page}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No structure found
            </p>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              This document doesn't have a clear outline structure
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-3 border-t text-center ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {pdfStructure && pdfStructure.outline ? 
            `${pdfStructure.outline.length} sections found` : 
            'Smart structure extraction'
          }
        </div>
      </div>
    </div>
  );
};

export default DocumentOutline;
