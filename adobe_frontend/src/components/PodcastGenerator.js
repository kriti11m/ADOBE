import React, { useState } from 'react';

const PodcastGenerator = ({ selectedText, relatedSections, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [podcastType, setPodcastType] = useState('podcast');
  const [duration, setDuration] = useState(3);

  const generatePodcast = async () => {
    if (!selectedText || selectedText.length < 10) {
      setError('Please select more text to generate a meaningful podcast.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      console.log('🎧 Generating podcast for selected text:', selectedText.substring(0, 100) + '...');
      console.log('🎧 Related sections count:', relatedSections?.length || 0);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${API_URL}/insights/generate-audio-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          related_sections: relatedSections || [],
          audio_type: podcastType,
          duration_minutes: duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate podcast');
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioObjectUrl = URL.createObjectURL(audioBlob);
      
      setAudioUrl(audioObjectUrl);
      console.log('✅ Podcast generated successfully');
      
    } catch (err) {
      console.error('❌ Podcast generation error:', err);
      setError(`Podcast generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `document_podcast_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                🎧 Generate Podcast
              </h2>
              <p className="text-gray-600 mt-1">Create an audio overview of your selected content</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Selected Text Preview */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Selected Text:</h3>
            <div className="bg-gray-50 p-3 rounded-lg border max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700">
                {selectedText ? selectedText.substring(0, 200) + (selectedText.length > 200 ? '...' : '') : 'No text selected'}
              </p>
            </div>
            {relatedSections && relatedSections.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                📚 Found {relatedSections.length} related sections to include in analysis
              </p>
            )}
          </div>

          {/* Podcast Options */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Style:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="podcast"
                    checked={podcastType === 'podcast'}
                    onChange={(e) => setPodcastType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">🎙 Two-host conversation</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="overview"
                    checked={podcastType === 'overview'}
                    onChange={(e) => setPodcastType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">📢 Single narrator overview</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Duration: {duration} minutes
              </label>
              <input
                type="range"
                min="2"
                max="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2 min</span>
                <span>5 min</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-6">
            <button
              onClick={generatePodcast}
              disabled={isGenerating || !selectedText}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                isGenerating || !selectedText
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Podcast...</span>
                </>
              ) : (
                <>
                  <span>🎧</span>
                  <span>Generate {podcastType === 'podcast' ? 'Podcast Conversation' : 'Audio Overview'}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">🎵 Your Podcast is Ready!</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <audio controls className="w-full mb-3">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <button
                  onClick={downloadAudio}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <span>⬇</span>
                  <span>Download Podcast</span>
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 How it works:</p>
            <ul className="space-y-1">
              <li>• Analyzes your selected text and finds related content across your documents</li>
              <li>• Generates comprehensive insights using AI analysis</li>
              <li>• Creates a natural-sounding podcast that summarizes both content and insights</li>
              <li>• Uses Google Text-to-Speech for high-quality audio generation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodcastGenerator;
