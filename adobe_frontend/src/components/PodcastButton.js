import React, { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import backendService from '../services/backendService';

const PodcastButton = ({ onClick, currentDocument, selectedSection, userProfile }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePodcastGeneration = async () => {
    if (!currentDocument) {
      alert('Please select a document first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate podcast using backend service
      const podcastData = await backendService.generatePodcast(
        [currentDocument.file || currentDocument], // Use actual file if available
        userProfile.role || 'Researcher',
        selectedSection
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

  return (
    <button 
      onClick={handlePodcastGeneration}
      disabled={!currentDocument || isGenerating}
      className={`floating-fab text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
        !currentDocument || isGenerating
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700'
      }`}
      title={!currentDocument ? 'Select a document to generate podcast' : 'Generate AI Podcast'}
    >
      <div className="flex items-center space-x-2">
        {isGenerating ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Headphones className="w-6 h-6" />
        )}
        <span className="font-medium hidden lg:inline">
          {isGenerating ? 'Generating...' : 'Podcast Mode'}
        </span>
      </div>
    </button>
  );
};

export default PodcastButton;
