<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Serendib Browser

A modern, privacy-focused Electron browser with AI integration, container tabs, and workspace management.

## Features

- 🔐 **Container Tabs** - Firefox-style containers for session isolation
- 🗂️ **Workspaces** - Organize tabs into separate workspaces
- 🤖 **AI Assistant** - Gemini-powered contextual AI chat
- 📱 **Modern UI** - Dark theme with smooth animations
- 📥 **Offline Reading** - Save pages for offline access
- 🔌 **Extensions** - Support for browser extensions

## Project Structure

```
serendib-browser/
├── electron/           # Electron main process
│   ├── main.js         # Main process entry
│   └── preload.js      # Preload scripts
├── src/
│   ├── components/     # React components
│   │   ├── ai/         # AI chat panel
│   │   ├── browser/    # WebView component
│   │   ├── layout/     # Tab system, window controls
│   │   ├── navigation/ # OmniBox (address bar)
│   │   ├── pages/      # Internal pages (downloads, extensions)
│   │   └── ui/         # UI elements (toasts, popups)
│   ├── constants/      # App constants & initial data
│   ├── services/       # External services (Gemini API)
│   └── types/          # TypeScript type definitions
├── App.tsx             # Main React app component
├── index.tsx           # React entry point
└── index.html          # HTML template
```

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run in development mode:
   ```bash
   # Web preview
   npm run dev
   
   # Electron app
   npm run electron:dev
   ```

## Build

```bash
# Build for production
npm run build

# Package Electron app
npm run electron:build
```

## Technology Stack

- **Electron** - Desktop app framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide Icons** - Icon library
- **Google Gemini** - AI integration
