import React, { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';

const PodcastButton = ({ 
  onClick, 
  currentDocument, 
  selectedSection, 
  recommendations = [],
  currentSessionId = null,
  selectedText = '', 
  relatedSections = [],
  isVisible = true
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePodcastClick = () => {
    // Check if we have content to generate podcast from
    if (!selectedText && !selectedSection && !currentDocument && (!recommendations || recommendations.length === 0)) {
      alert('Please select text or upload documents first to generate a podcast.');
      return;
    }

    // Call the parent onClick handler (App.js handleFloatingPodcastClick)
    if (onClick) {
      onClick();
    }
  };

  // Determine button state and text
  const hasContent = selectedText || recommendations.length > 0 || selectedSection || currentDocument;
  const buttonText = selectedText
    ? 'Generate Podcast (Selected Text)'
    : recommendations.length > 0 
      ? `Generate Podcast (${recommendations.length} sections)`
      : selectedSection 
        ? 'Generate Podcast (Current Section)' 
        : currentDocument 
          ? 'Generate Podcast (Document)' 
          : 'Select Content First';

  if (!isVisible) return null;

  return (
    <>
      <button 
        onClick={handlePodcastClick}
        disabled={!hasContent || isGenerating}
        className={`floating-fab text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
          !hasContent || isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        title={!hasContent ? 'Select content to generate podcast' : buttonText}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="flex items-center space-x-1">
          {isGenerating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <span className="text-2xl">🎧</span>
          )}
          {currentSessionId && (
            <span className="text-xs bg-blue-500 px-1 rounded absolute -top-1 -right-1">✨</span>
          )}
        </div>
      </button>
    </>
  );
};

export default PodcastButton;
