import React, { useState, useEffect } from 'react';
import profileService from '../services/profileService';

const ProfileManager = ({ isOpen, onClose, onProfileSelect, currentProfile }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    profile_name: '',
    persona: '',
    job_description: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileService.getAllProfiles();
      setProfiles(response.profiles || []);
    } catch (err) {
      setError('Failed to load profiles');
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      profile_name: '',
      persona: '',
      job_description: ''
    });
    setEditingProfile(null);
    setShowCreateForm(false);
  };

  const handleCreateProfile = async () => {
    if (!formData.profile_name.trim() || !formData.persona.trim() || !formData.job_description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      await profileService.createProfile(formData);
      await loadProfiles();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.profile_name.trim() || !formData.persona.trim() || !formData.job_description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      await profileService.updateProfile(editingProfile.id, formData);
      await loadProfiles();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleEditProfile = (profile) => {
    setFormData({
      profile_name: profile.profile_name,
      persona: profile.persona,
      job_description: profile.job_description
    });
    setEditingProfile(profile);
    setShowCreateForm(true);
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }

    try {
      setError(null);
      await profileService.deleteProfile(profileId);
      await loadProfiles();
    } catch (err) {
      setError(err.message || 'Failed to delete profile');
    }
  };

  const handleSelectProfile = (profile) => {
    onProfileSelect(profile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-950 to-gray-900 text-white rounded-2xl w-3/4 max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <span className="text-white text-lg">👤</span>
            </div>
            <h2 className="text-xl font-bold">Profile Manager</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>+</span> New Profile
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {showCreateForm ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span>{editingProfile ? '✏️' : '➕'}</span>
                {editingProfile ? 'Edit Profile' : 'Create New Profile'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Profile Name</label>
                  <input
                    type="text"
                    value={formData.profile_name}
                    onChange={(e) => setFormData({...formData, profile_name: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Student, Professional, Personal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">I am... (Persona)</label>
                  <input
                    type="text"
                    value={formData.persona}
                    onChange={(e) => setFormData({...formData, persona: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Student, Research Scholar, Investment Analyst"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">I am trying to... (Job Description)</label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) => setFormData({...formData, job_description: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 h-24 resize-none focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., trip to france, work documents, family & hobbies"
                  />
                </div>

                {error && (
                  <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {editingProfile ? 'Update Profile' : 'Create Profile'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Select Profile</h3>
                <p className="text-gray-400 text-sm">Choose a profile to switch to or create a new one</p>
              </div>

              {loading && (
                <div className="text-center text-gray-400 py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  Loading profiles...
                </div>
              )}

              {error && (
                <div className="text-center text-red-400 py-4 mb-4 bg-red-900/20 rounded-lg">
                  {error}
                </div>
              )}

              {!loading && profiles.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👤</div>
                  <h4 className="text-lg font-medium mb-2">No profiles yet</h4>
                  <p className="text-gray-400 text-sm mb-6">Create your first profile to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Profile
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      currentProfile?.id === profile.id
                        ? 'bg-blue-600 border-blue-400 shadow-lg transform scale-105'
                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          profile.profile_name?.toLowerCase().includes('student') ? 'bg-purple-600' :
                          profile.profile_name?.toLowerCase().includes('professional') ? 'bg-green-600' :
                          'bg-pink-600'
                        }`}>
                          <span className="text-white text-sm">
                            {profile.profile_name?.toLowerCase().includes('student') ? '🎓' :
                             profile.profile_name?.toLowerCase().includes('professional') ? '💼' :
                             '❤️'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{profile.profile_name}</div>
                          <div className="text-sm opacity-80">{profile.job_description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentProfile?.id === profile.id && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Selected
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProfile(profile);
                          }}
                          className="text-gray-400 hover:text-white p-1 rounded"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className="text-gray-400 hover:text-red-400 p-1 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs opacity-60">
                      👤 {profile.persona} • Created: {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {!loading && profiles.length > 0 && (
                <div className="mt-6 text-center">
                  <div className="text-4xl mb-3">👤</div>
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="text-purple-400">✨ Personalized Experience ✨</span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    Profiles help organize your documents and maintain context for better AI analysis
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
