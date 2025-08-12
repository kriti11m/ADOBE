import React, { useState } from 'react';
import { Settings, Moon, Sun, HelpCircle, User, UserPlus } from 'lucide-react';
import { useDarkMode } from '../App';

const Navigation = ({ 
  userProfile, 
  isProcessing, 
  onRestartTutorial, 
  currentProfile, 
  onProfileChange, 
  onManageProfiles 
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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
          {/* Current Profile Display - Read-only */}
          {currentProfile && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-200' 
                : 'bg-blue-50 text-blue-800'
            }`}>
              <span className="text-lg">👤</span>
              <div className="text-sm">
                <div className="font-medium">{currentProfile.profile_name}</div>
                <div className="text-xs opacity-80">{currentProfile.persona}</div>
              </div>
            </div>
          )}
          
          {/* User Profile (Legacy - show only if no current profile) */}
          {!currentProfile && userProfile.role && (
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
          
          {/* Tutorial Help Button - Remove since it's now in settings */}
          
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
          <div className="relative">
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            
            {/* Settings Dropdown */}
            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
                <div className="p-2">
                  {/* Profile Management Section */}
                  <div className="pb-2 mb-2 border-b border-gray-600">
                    <div className="text-xs text-gray-400 px-2 py-1 mb-1">Profile Management</div>
                    
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onManageProfiles();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create New Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onManageProfiles();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Manage Profiles
                    </button>
                  </div>
                  
                  {/* Other Settings */}
                  <div className="text-xs text-gray-400 px-2 py-1 mb-1">General</div>
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onRestartTutorial();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Restart Tutorial
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      toggleDarkMode();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
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
