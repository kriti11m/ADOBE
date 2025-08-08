# ConnectPDF - Intelligent Document Companion

A modern React application that provides an intelligent document reading experience with AI-powered insights, cross-document connections, and personalized audio summaries.

## Features

### 🎯 **Personalized Onboarding**
- User role and task-based customization
- Tailored document analysis and recommendations

### 📚 **Smart Document Management**
- Drag & drop file upload (PDF, ZIP)
- Document status tracking (New, Recent, Analyzed)
- Filtering and organization tools

### 🔍 **Intelligent PDF Viewer**
- Section-based navigation
- Real-time content highlighting
- Cross-document linking

### 💡 **AI-Powered Insights**
- Smart connections between related content
- Key insights extraction
- Contradiction detection
- Cross-domain applicability suggestions

### 🎧 **Podcast Mode**
- Audio summary generation
- Playback controls with progress tracking
- Personalized content narration

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Smooth animations and transitions
- Intuitive navigation

## Technology Stack

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Custom Animations** - CSS animations and transitions

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd connectpdf
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Project Structure

```
src/
├── components/
│   ├── OnboardingModal.js      # User profile setup
│   ├── Navigation.js           # Top navigation bar
│   ├── DocumentSidebar.js      # Document management
│   ├── PDFViewer.js           # PDF content display
│   ├── SmartConnections.js    # AI insights panel
│   ├── PodcastButton.js       # Floating action button
│   └── AudioPlayer.js         # Audio playback controls
├── App.js                     # Main application component
├── index.js                   # Application entry point
└── index.css                  # Global styles and Tailwind imports
```

## Key Components

### OnboardingModal
Handles user profile creation with role and task selection for personalized experience.

### DocumentSidebar
Manages document upload, filtering, and selection with drag & drop functionality.

### PDFViewer
Displays document content with section navigation and highlighting.

### SmartConnections
Provides AI-powered insights and cross-document connections with three view modes:
- **Bulb View**: Initial insights activation
- **Connections View**: Related content discovery
- **Insights View**: Detailed AI analysis

### AudioPlayer
Handles audio summary playback with progress tracking and controls.

## Customization

### Styling
The application uses Tailwind CSS for styling. Custom animations and styles are defined in:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Custom CSS classes and animations

### Adding New Features
1. Create new components in the `src/components/` directory
2. Import and integrate them in `App.js`
3. Update the state management as needed

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspired by modern document management interfaces
- Icons provided by Lucide React
- Styling powered by Tailwind CSS
