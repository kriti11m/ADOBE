import React, { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Hash } from 'lucide-react';
import { useDarkMode } from '../App';

const TableOfContents = ({ 
  pdfStructure, 
  currentSection, 
  onSectionClick, 
  onAnalyzeClick,
  isLoading = false 
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const { isDarkMode } = useDarkMode();

  if (isLoading) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pdfStructure || !pdfStructure.hasStructure) {
    return (
      <div className={`p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <BookOpen className={`w-8 h-8 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <h3 className={`font-medium text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Document Structure
        </h3>
        <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No clear structure detected. Use Smart Connections to analyze content.
        </p>
        <button
          onClick={onAnalyzeClick}
          className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Analyze Document
        </button>
      </div>
    );
  }

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getIndentClass = (level) => {
    switch(level) {
      case 0: return 'pl-0';
      case 1: return 'pl-4';
      case 2: return 'pl-8';
      case 3: return 'pl-12';
      default: return 'pl-0';
    }
  };

  const getLevelIcon = (level) => {
    switch(level) {
      case 0: return <Hash className="w-3 h-3" />;
      case 1: return <Hash className="w-2.5 h-2.5" />;
      case 2: return <Hash className="w-2 h-2" />;
      default: return <Hash className="w-2 h-2" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <BookOpen className="w-4 h-4 mr-2" />
            Table of Contents
          </h3>
        </div>
        {pdfStructure.title && (
          <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            {pdfStructure.title}
          </p>
        )}
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {pdfStructure.outline.length} sections • Click to navigate
        </p>
      </div>

      {/* TOC List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {pdfStructure.outline.map((section, index) => {
            const isCurrentSection = currentSection && currentSection.text === section.text;
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id || index}>
                <button
                  onClick={() => onSectionClick(section.page, section.text)}
                  className={`w-full text-left px-2 py-2 rounded-md text-sm transition-colors group flex items-start ${
                    getIndentClass(section.indent)
                  } ${
                    isCurrentSection
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-900'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 mr-2 ${
                    isCurrentSection 
                      ? 'text-current' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {getLevelIcon(section.indent)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{section.text}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                        isCurrentSection
                          ? isDarkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-200 text-blue-800'
                          : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        p.{section.page}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onAnalyzeClick}
          className={`w-full text-xs py-2 px-3 rounded transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          💡 Analyze for Smart Connections
        </button>
      </div>
    </div>
  );
};

export default TableOfContents;
