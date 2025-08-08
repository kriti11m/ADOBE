import React, { useState } from 'react';
import { useDarkMode } from '../App';

const OnboardingModal = ({ onComplete }) => {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const { isDarkMode } = useDarkMode();

  const handleStartExploring = () => {
    if (role && task) {
      onComplete(role, task);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex items-center justify-center z-50">
      <div className={`rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Welcome to ConnectPDF!</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Tell us about yourself to personalize your experience
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>I am a...</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Researcher">Researcher</option>
              <option value="Analyst">Analyst</option>
              <option value="Consultant">Consultant</option>
              <option value="Manager">Manager</option>
              <option value="Developer">Developer</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>I'm trying to...</label>
            <input 
              type="text" 
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., understand climate models, analyze financial trends" 
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <button 
            onClick={handleStartExploring}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
