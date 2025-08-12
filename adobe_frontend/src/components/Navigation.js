import React from 'react';
import { Settings, Moon, Sun, HelpCircle } from 'lucide-react';
import { useDarkMode } from '../App';

const Navigation = ({ userProfile, isProcessing, onRestartTutorial }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <nav id="nav" className={`shadow-sm border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    } px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
            <h1 className="text-xl font-semibold">ConnectPDF</h1>
          </div>
          
          {/* Processing Status */}
          {isProcessing && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isDarkMode 
                ? 'bg-blue-900/50 text-blue-300' 
                : 'bg-blue-50 text-blue-700'
            }`}>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Analyzing documents...</span>
            </div>
          )}
          
          {/* Offline Mode Badge */}
          <div className={`hidden items-center space-x-2 px-3 py-1 rounded-full ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm">Offline Mode Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User Profile */}
          {userProfile.role && (
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              isDarkMode 
                ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50' 
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
            }`}>
              <span className="text-lg">👤</span>
              <div className="text-sm">
                <span className="font-medium">{userProfile.role}</span>
                <span className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>: </span>
                <span className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>{userProfile.task}</span>
              </div>
            </div>
          )}
          
          {/* Tutorial Help Button */}
          <button 
            onClick={onRestartTutorial}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' 
                : 'text-blue-600 hover:text-blue-900 hover:bg-gray-100'
            }`}
            title="Restart Tutorial"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          
          {/* Dark Mode Toggle */}
          <button 
            id="dark-mode-toggle"
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          
          {/* Settings */}
          <button className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}>
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
