import React from 'react';

const PodcastButton = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="floating-fab bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl">🎧</span>
        <span className="font-medium hidden lg:inline">Podcast Mode</span>
      </div>
    </button>
  );
};

export default PodcastButton;
