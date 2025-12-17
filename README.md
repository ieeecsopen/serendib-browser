

# Seran Browser

A modern, privacy-focused Electron browser with AI integration, container tabs, and workspace management.

## Features

### 🔒 Privacy & Security
- **Container Tabs (Firefox-style)**: Isolate your browsing with separate containers (e.g., Personal, Work, Shopping) to prevent cross-site tracking.
  - **Persistent Containers**: Sessions saved across restarts.
  - **Disposable Containers**: Temporary, incognito-like usage where data is cleared internally upon closure.
- **Built-in Ad & Tracker Blocker**: Automatically blocks known tracking domains and ads.
- **Proxy & VPN Manager**: Native interface to connect to proxy servers and manage connection rules.
- **Secure Password Manager**:
  - Encrypted vault for credential storage.
  - Strong password generator.
  - Import/Export functionality.

### 🚀 Productivity & Workflow
- **Workspace Snapshots**:
  - Save your entire browsing state (open tabs, layout) to a generic file (`.Seran-snapshot`).
  - Export and share workspaces with colleagues.
  - Load previous snapshots instantly.
- **Offline Reading Mode**:
  - Download full web pages (HTML + Images) for offline access.
  - Dedicated library for managing saved offline content.
- **Mira AI Assistant**:
  - Integrated sidebar chat powered by Google Gemini.
  - Context-aware assistance for the current webpage.
- **Screen Capture Tool**: Built-in utility to capture the visible area or specific regions of a page.
- **PDF & Printing**: High-fidelity PDF export and customizable printing options.

### 🌐 Browsing Experience
- **Modern Architecture**:
  - **Multi-process**: Stable and responsive Electron backend.
  - **Frameless UI**: Sleek, distraction-free design with custom window controls.
- **Advanced Omnibox**: Smart address bar with autocomplete and search suggestions.
- **Download Manager**: Dedicated interface to track and manage file downloads.
- **Extensions Support**: Compatible with browser extensions for enhanced functionality.
- **Customization**:
  - Theming system with multiple color schemes.
  - Customizable search engines.

## Project Structure

```
seran-browser/
├── electron/           # Electron main process
│   ├── main.js         # Core logic (Windows, IPC, Session Management)
│   └── preload.js      # Safe API exposure (Bridge between Main & Renderer)
├── src/
│   ├── components/     # React UI Components
│   │   ├── ai/         # Mira AI Assistant
│   │   ├── browser/    # WebView & Tab Content
│   │   ├── layout/     # Window Frame, Sidebar, Tabs
│   │   ├── navigation/ # Omnibox & Address Bar
│   │   ├── pages/      # Settings, Offline, Passwords, etc.
│   │   ├── snapshots/  # Workspace Snapshot Management
│   │   └── ui/         # Reusable Design System
│   ├── constants/      # Configuration & Defaults
│   ├── services/       # External Integrations (Gemini, etc.)
│   └── types/          # TypeScript Definitions
├── App.tsx             # Main React Application
├── index.tsx           # Entry Point
└── index.html          # HTML Shell
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
