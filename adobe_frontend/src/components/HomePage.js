import React from 'react';
import { FileText, Zap, Brain, Users, ArrowRight, Sparkles, Code, Heart, Sun, Moon } from 'lucide-react';

const HomePage = ({ onStartTutorial, isDarkMode, toggleDarkMode }) => {
  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white' 
        : 'bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 text-gray-900'
    }`}>
      
      {/* Beautiful Dark Mode Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleDarkMode}
          className={`group relative w-10 h-10 rounded-full backdrop-blur-lg border-0 transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-0 focus:ring-offset-0 ${
            isDarkMode 
              ? 'bg-transparent hover:bg-gray-800/30 text-yellow-400 focus:bg-gray-800/20' 
              : 'bg-transparent hover:bg-white/20 text-gray-700 focus:bg-white/30'
          } hover:shadow-lg`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {/* Background Glow Effect - Only on hover/focus */}
          <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-50 transition-opacity duration-300 ${
            isDarkMode ? 'bg-yellow-400/5' : 'bg-blue-400/5'
          }`}></div>
          
          {/* Icon Container with Rotation Animation */}
          <div className="relative flex items-center justify-center w-full h-full">
            <div className={`transform transition-all duration-500 ${isDarkMode ? 'rotate-0' : 'rotate-180'}`}>
              {isDarkMode ? (
                <Sun className="w-4 h-4 transition-all duration-500 group-hover:rotate-12 drop-shadow-sm" />
              ) : (
                <Moon className="w-4 h-4 transition-all duration-500 group-hover:-rotate-12 drop-shadow-sm" />
              )}
            </div>
          </div>
          
          {/* Subtle Shine Effect - Only on hover */}
          <div className={`absolute inset-0 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
            isDarkMode 
              ? 'bg-gradient-to-tr from-transparent via-yellow-400/5 to-transparent' 
              : 'bg-gradient-to-tr from-transparent via-white/10 to-transparent'
          }`}></div>
          
          {/* Floating Particles Effect */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className={`absolute top-1.5 right-2 w-0.5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 ${
              isDarkMode ? 'bg-yellow-300' : 'bg-blue-300'
            } group-hover:animate-pulse`}></div>
            <div className={`absolute bottom-2 left-1.5 w-0.5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 ${
              isDarkMode ? 'bg-yellow-300' : 'bg-blue-300'
            } group-hover:animate-pulse`}></div>
          </div>
        </button>
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-400'
        }`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 animate-pulse delay-1000 ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
        }`}></div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient fade-in active" style={{animationDelay: '0.2s'}}>
            Doc-a-doodle
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl md:text-2xl mb-8 font-medium fade-in active ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`} style={{animationDelay: '0.4s'}}>
            Transform Your Documents with AI-Powered Intelligence
          </p>

          {/* Description */}
          <p className={`text-base mb-12 max-w-2xl mx-auto leading-relaxed fade-in active ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          }`} style={{animationDelay: '0.6s'}}>
            Upload, analyze, and discover intelligent connections across your documents. 
            Get AI-generated insights, create interactive podcasts, and navigate through 
            complex information with smart recommendations tailored to your role.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className={`modern-card p-6 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '0.8s'}}>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Smart Document Analysis</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Extract structure, analyze content, and discover key insights from your PDFs with advanced AI processing
              </p>
            </div>

            <div className={`modern-card p-6 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '1.0s'}}>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">AI-Powered Connections</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Find relevant sections across documents with intelligent recommendations based on your persona and tasks
              </p>
            </div>

            <div className={`modern-card p-6 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '1.2s'}}>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Interactive Podcasts</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Convert insights into engaging audio content for on-the-go learning and knowledge absorption
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="scale-in active mb-16" style={{animationDelay: '1.4s'}}>
            <button
              onClick={onStartTutorial}
              className="group btn-primary inline-flex items-center px-6 py-3 rounded-xl font-semibold text-sm text-white focus-ring"
            >
              <span className="mr-2">Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Team Credits */}
      <footer className="relative overflow-hidden">
        <div className="relative">
          {/* Team Section Background - Darker shade */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-blue-950 to-gray-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(100,99,178,0.4),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(100,99,178,0.3),transparent_50%)]"></div>

          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400/60 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse delay-500"></div>
            <div className="absolute bottom-10 right-10 w-2 h-2 bg-pink-400/60 rounded-full animate-pulse delay-700"></div>
          </div>

          <div className="relative z-10 px-4 py-6 text-center">
            {/* Team Title with Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-6 h-6 mr-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
                <Users className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-base font-bold text-white bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
                Team CORS: Crying Over Real Stuff
              </h2>
            </div>

            {/* Team Members */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {[
                { name: "Kriti Maheshwari" },
                { name: "Shreya Singhal" },
                { name: "Yashaswini Kanaujia" },
              ].map((member, index) => (
                <div key={member.name} className="group relative" style={{ animationDelay: `${index * 200}ms` }}>
                  <div className="relative bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-blue-500/25">
                    {/* Member Name */}
                    <h3 className="text-white font-medium text-xs group-hover:text-blue-200 transition-colors duration-300">
                      {member.name}
                    </h3>

                    {/* Hover Effect Glow */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Stats */}
            <div className="flex justify-center gap-3 mt-4 text-center">
              <div className="group">
                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">
                  3
                </div>
                <div className="text-blue-300 text-xs opacity-80">Developers</div>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="group">
                <div className="text-xs font-bold text-white mb-1 group-hover:text-purple-300 transition-colors duration-300">
                  ∞
                </div>
                <div className="text-blue-300 text-xs opacity-80">Possibilities</div>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="group">
                <div className="text-xs font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                  24/7
                </div>
                <div className="text-blue-300 text-xs opacity-80">Innovation</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
