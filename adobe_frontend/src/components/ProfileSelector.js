import React, { useState, useEffect } from 'react';
import profileService from '../services/profileService';

const ProfileSelector = ({ currentProfile, onProfileChange, onManageProfiles }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const response = await profileService.getAllProfiles();
      setProfiles(response.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profile) => {
    onProfileChange(profile);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <span className="text-sm">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Profile Display */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 transition-colors shadow-sm min-w-[200px]"
      >
        <div className="text-left">
          <div className="text-sm font-medium text-gray-800">
            {currentProfile?.profile_name || 'Select Profile'}
          </div>
          {currentProfile?.description && (
            <div className="text-xs text-blue-600">
              {currentProfile.description}
            </div>
          )}
        </div>
        <div className="text-gray-400 ml-2">
          {showDropdown ? '▲' : '▼'}
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* Profile List */}
            <div className="max-h-64 overflow-y-auto">
              {profiles.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No profiles yet</p>
                  <p className="text-xs mt-1">Create your first profile in settings</p>
                </div>
              ) : (
                profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                      currentProfile?.id === profile.id ? 'bg-blue-50 border-2 border-blue-200' : 'border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm text-gray-800">
                        {profile.profile_name}
                      </div>
                      {currentProfile?.id === profile.id && (
                        <div className="text-xs text-blue-600">✓</div>
                      )}
                    </div>
                    {profile.description && (
                      <div className="text-xs text-blue-600">
                        {profile.description.length > 100 
                          ? `${profile.description.substring(0, 100)}...`
                          : profile.description
                        }
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProfileSelector;
