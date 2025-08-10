import React, { useState, useEffect } from 'react';
import { Search, Menu, FileText, Clock } from 'lucide-react';
import { useDarkMode } from '../App';
import backendService from '../services/backendService';

const PDFViewer = ({ currentDocument, onSectionSelect, recommendations }) => {
  const [documentStructure, setDocumentStructure] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Extract document structure when a new document is selected
  useEffect(() => {
    const extractDocumentStructure = async () => {
      if (currentDocument && currentDocument.file) {
        setIsLoading(true);
        setError(null);
        
        try {
          const structure = await backendService.extractPDFStructure(currentDocument.file);
          setDocumentStructure(structure);
          setCurrentSection(structure.outline?.[0] || null);
        } catch (err) {
          console.error('Error extracting document structure:', err);
          setError('Failed to extract document structure');
        } finally {
          setIsLoading(false);
        }
      } else {
        setDocumentStructure(null);
        setCurrentSection(null);
      }
    };

    extractDocumentStructure();
  }, [currentDocument]);

  const handleSectionClick = (section) => {
    setCurrentSection(section);
    if (onSectionSelect) {
      onSectionSelect(section);
    }
  };

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
              <FileText className={`w-12 h-12 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
            </div>
            <h3 className={`text-xl font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Select a document to begin</h3>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Upload a PDF and let our AI analyze its structure and content</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Document Outline Sidebar */}
      <div className={`w-80 border-r ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } flex flex-col`}>
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Document Outline
          </h3>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {currentDocument.name}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className={`w-6 h-6 animate-spin ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <span className={`ml-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Extracting structure...
              </span>
            </div>
          ) : error ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          ) : documentStructure ? (
            <div className="space-y-2">
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {documentStructure.title || 'Document'}
                </h4>
                {documentStructure.metadata && (
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {documentStructure.metadata.totalPages || documentStructure.metadata.total_pages} pages
                  </p>
                )}
              </div>
              
              {documentStructure.outline && documentStructure.outline.length > 0 ? (
                <div className="space-y-1">
                  {documentStructure.outline.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => handleSectionClick(section)}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        currentSection === section
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDarkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${
                          section.level === 'H1' ? 'font-bold' : 
                          section.level === 'H2' ? 'font-semibold ml-2' : 'ml-4'
                        }`}>
                          {section.text}
                        </span>
                        <span className={`text-xs ${
                          currentSection === section
                            ? 'text-blue-200'
                            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          p.{section.page}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-center py-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No structure detected
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* PDF Display Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              PDF Viewer
            </h2>
            {currentSection && (
              <div className={`text-sm px-3 py-1 rounded ${
                isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                {currentSection.text}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}>
              <Search className="w-5 h-5" />
            </button>
            <button className={`p-2 rounded ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 p-4">
          <div className={`h-full rounded-lg border-2 border-dashed ${
            isDarkMode ? 'border-gray-600' : 'border-gray-300'
          } flex items-center justify-center`}>
            <div className="text-center">
              <FileText className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Adobe PDF Embed API
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                PDF will be displayed here with Adobe's PDF Embed API
              </p>
              <p className={`text-xs mt-2 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Configure your Adobe Client ID to enable PDF rendering
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
