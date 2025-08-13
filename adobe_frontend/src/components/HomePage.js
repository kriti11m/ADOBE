import React from 'react';
import { FileText, Zap, Brain, Users, ArrowRight, Sparkles } from 'lucide-react';

const HomePage = ({ onStartTutorial, isDarkMode }) => {
  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white' 
        : 'bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 text-gray-900'
    }`}>
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
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 fade-in active">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 modern-card ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/25' 
                : 'bg-gradient-to-r from-blue-600 to-purple-700 shadow-2xl shadow-purple-500/25'
            }`}>
              <div className="flex items-center">
                <span className="text-white font-bold text-3xl">D</span>
                <Sparkles className="w-6 h-6 text-yellow-300 ml-1" />
              </div>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-8 text-gradient fade-in active" style={{animationDelay: '0.2s'}}>
            Doc-a-doodle
          </h1>
          
          {/* Subtitle */}
          <p className={`text-2xl md:text-3xl mb-10 font-medium fade-in active ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`} style={{animationDelay: '0.4s'}}>
            Transform Your Documents with AI-Powered Intelligence
          </p>

          {/* Description */}
          <p className={`text-lg mb-16 max-w-3xl mx-auto leading-relaxed fade-in active ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          }`} style={{animationDelay: '0.6s'}}>
            Upload, analyze, and discover intelligent connections across your documents. 
            Get AI-generated insights, create interactive podcasts, and navigate through 
            complex information with smart recommendations tailored to your role.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className={`modern-card p-8 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '0.8s'}}>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Document Analysis</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Extract structure, analyze content, and discover key insights from your PDFs with advanced AI processing
              </p>
            </div>

            <div className={`modern-card p-8 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '1.0s'}}>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Connections</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Find relevant sections across documents with intelligent recommendations based on your persona and tasks
              </p>
            </div>

            <div className={`modern-card p-8 group cursor-pointer scale-in active ${
              isDarkMode 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-white/95'
            }`} style={{animationDelay: '1.2s'}}>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Interactive Podcasts</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Convert insights into engaging audio content for on-the-go learning and knowledge absorption
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="scale-in active" style={{animationDelay: '1.4s'}}>
            <button
              onClick={onStartTutorial}
              className="group btn-primary inline-flex items-center px-10 py-5 rounded-2xl font-semibold text-lg text-white focus-ring"
            >
              <span className="mr-3">Get Started</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Team Credits */}
      <footer className={`py-10 px-6 glass relative z-10 ${
        isDarkMode 
          ? 'border-t border-gray-800/50' 
          : 'border-t border-gray-200/50'
      }`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-3 rounded-xl mr-4 ${
              isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
            }`}>
              <Users className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div>
              <span className={`text-lg font-semibold block ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Team CORS: Crying Over Real Stuff
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Passionate developers building the future of document intelligence
              </span>
            </div>
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex flex-wrap justify-center gap-4">
              <span className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
              }`}>Kriti Maheshwari</span>
              <span className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
              }`}>Shreya Singhal</span>
              <span className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
              }`}>Yashaswini Kanaujia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
