import React, { useState, useEffect } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { useDarkMode } from '../App';

const AudioPlayer = ({ onClose, onPlayPause, isPlaying, progress }) => {
  const [audioStatus, setAudioStatus] = useState('🎙 Generating personalized audio summary...');
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isPlaying) {
      setTimeout(() => {
        setAudioStatus('🎙 Ready to play: "ML Research Methods - Key insights and methodology overview"');
      }, 2000);
    }
  }, [isPlaying]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = (progress / 225) * 100; // 3:45 = 225 seconds

  return (
    <div className={`fixed bottom-24 right-8 rounded-lg shadow-xl border p-4 w-80 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Audio Summary</h3>
        <button 
          onClick={onClose}
          className={`transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-gray-300' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`rounded-lg p-3 mb-3 ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onPlayPause}
            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1">
            <div className={`rounded-full h-2 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}>
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <div className={`flex justify-between text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>{formatTime(progress)}</span>
              <span>3:45</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className={`text-sm ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>{audioStatus}</p>
    </div>
  );
};

export default AudioPlayer;
