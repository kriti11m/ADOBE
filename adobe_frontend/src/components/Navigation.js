import React, { useState } from 'react';
import { Settings, Moon, Sun, HelpCircle, HardDrive } from 'lucide-react';
import { useDarkMode } from '../App';

const Navigation = ({ 
  isProcessing, 
  currentSection, 
  onToggleDarkMode, 
  onOpenCollectionUploader,
  onRestartTutorial,
  onOpenSettings,
  onShowHomePage = () => {}, // Add this prop
  onOpenDocumentManager, // Add document manager prop
  userProfile
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <nav id="nav" className={`glass border-b transition-all duration-300 backdrop-blur-lg ${
      isDarkMode 
        ? 'border-gray-800/50 text-white' 
        : 'border-gray-200/50 text-gray-900'
    } px-6 py-4 sticky top-0 z-50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onShowHomePage}
            className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">DV</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DocuVerse
            </h1>
          </button>
          
          {/* Processing Status */}
          {isProcessing && (
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl glass ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300 border border-blue-800/30' 
                : 'bg-blue-50/80 text-blue-700 border border-blue-200/50'
            }`}>
              <div className="relative">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-4 h-4 border border-blue-400/30 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Analyzing documents...</span>
            </div>
          )}
          
          {/* Offline Mode Badge */}
          <div className={`hidden items-center space-x-2 px-3 py-1 rounded-lg glass ${
            isDarkMode 
              ? 'bg-gray-700/50 text-gray-300' 
              : 'bg-gray-100/50 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm">Offline Mode Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User Profile (Legacy) */}
          {userProfile.role && (
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl glass cursor-pointer transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40 border border-blue-800/30' 
                : 'bg-blue-50/80 text-blue-900 hover:bg-blue-100/80 border border-blue-200/50'
            }`}>
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👤</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{userProfile.role}</span>
                <span className={`mx-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>:</span>
                <span className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>{userProfile.task}</span>
              </div>
            </div>
          )}
          
          {/* Dark Mode Toggle */}
          <button 
            id="dark-mode-toggle"
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl glass transition-all duration-300 hover:scale-105 focus-ring ${
              isDarkMode 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700/50 border border-gray-700/50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 border border-gray-200/50'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Settings */}
          <div className="relative">
            <button 
              id="settings-toggle"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-3 rounded-xl glass transition-all duration-300 hover:scale-105 focus-ring ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 border border-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 border border-gray-200/50'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Settings Dropdown */}
            {showSettingsMenu && (
              <div className={`absolute right-0 mt-3 w-72 glass border rounded-2xl shadow-2xl z-50 overflow-hidden ${
                isDarkMode 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/90 border-gray-200/50'
              }`}>
                <div className="p-3">
                  {/* General Settings */}
                  <div className={`text-xs font-semibold px-3 py-2 mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    General
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onRestartTutorial();
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 text-sm flex items-center gap-3 group ${
                      isDarkMode 
                        ? 'hover:bg-gray-700/50 text-white' 
                        : 'hover:bg-gray-100/50 text-gray-900'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Restart Tutorial</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Learn how to use the app</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      if (onOpenDocumentManager) onOpenDocumentManager();
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 text-sm flex items-center gap-3 group ${
                      isDarkMode 
                        ? 'hover:bg-gray-700/50 text-white' 
                        : 'hover:bg-gray-100/50 text-gray-900'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HardDrive className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Manage Documents</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>View, delete, or clear all files</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      toggleDarkMode();
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 text-sm flex items-center gap-3 group ${
                      isDarkMode 
                        ? 'hover:bg-gray-700/50 text-white' 
                        : 'hover:bg-gray-100/50 text-gray-900'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                        : 'bg-gradient-to-br from-slate-700 to-slate-800'
                    }`}>
                      {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Switch color theme</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {/* Overlay to close dropdown */}
            {showSettingsMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSettingsMenu(false)}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
