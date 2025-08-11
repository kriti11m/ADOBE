import React, { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import backendService from '../services/backendService';

const PodcastButton = ({ 
  onClick, 
  currentDocument, 
  selectedSection, 
  userProfile, 
  recommendations = [],
  currentSessionId = null 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePodcastGeneration = async () => {
    if (!userProfile || !userProfile.role || !userProfile.task) {
      alert('Please complete your profile first');
      return;
    }

    // Determine what content to use for podcast
    let contentToUse;
    let contentType;
    
    if (recommendations && recommendations.length > 0) {
      // Use Part 1B recommendations
      contentToUse = recommendations;
      contentType = 'recommendations';
    } else if (selectedSection) {
      // Use currently selected section
      contentToUse = selectedSection;
      contentType = 'section';
    } else if (currentDocument) {
      // Use current document
      contentToUse = currentDocument;
      contentType = 'document';
    } else {
      alert('Please select content first (upload documents or select a section)');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log(`🎧 Generating podcast from ${contentType}:`, contentToUse);
      
      // Generate podcast using backend service
      const podcastData = await backendService.generatePodcast(
        contentToUse,
        userProfile.role,
        userProfile.task,
        currentSessionId // Pass session ID for cross-document analysis
      );
      
      // Pass the generated podcast data to the parent component
      onClick(podcastData);
      
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert('Failed to generate podcast. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine button state and text
  const hasContent = recommendations.length > 0 || selectedSection || currentDocument;
  const buttonText = recommendations.length > 0 
    ? `Generate Podcast (${recommendations.length} sections)`
    : selectedSection 
      ? 'Generate Podcast (Current Section)' 
      : currentDocument 
        ? 'Generate Podcast (Document)' 
        : 'Select Content First';

  return (
    <button 
      onClick={handlePodcastGeneration}
      disabled={!hasContent || isGenerating || !userProfile.role}
      className={`floating-fab text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
        !hasContent || isGenerating || !userProfile.role
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700'
      }`}
      title={!userProfile.role ? 'Complete your profile first' : !hasContent ? 'Select content to generate podcast' : buttonText}
    >
      <div className="flex items-center space-x-2">
        {isGenerating ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Headphones className="w-6 h-6" />
        )}
        {currentSessionId && (
          <span className="text-xs bg-blue-500 px-1 rounded">Enhanced</span>
        )}
        <span className="font-medium hidden lg:inline">
          {isGenerating ? 'Generating...' : 'Podcast Mode'}
        </span>
      </div>
    </button>
  );
};

export default PodcastButton;
