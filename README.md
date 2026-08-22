# Seran Browser

A privacy-focused desktop browser built on Electron, with container tabs,
workspace management and an AI sidebar.

## Features

- **Container tabs** — Firefox-style isolation. Separate cookie jars and storage
  per container (Personal, Work, Shopping), so sites can't correlate you across
  contexts.
- **Workspaces** — group tabs by task and switch between them wholesale.
- **AI assistant** — Gemini-backed page summarising and Q&A in a sidebar.
- **Privacy defaults** — tracker isolation rather than opt-in blocking.

## Stack

| Layer | Technology |
| --- | --- |
| Shell | Electron |
| UI | React, TypeScript, Vite |
| AI | Google Gemini (`@google/genai`) |

## Getting started

**Prerequisites:** Node.js 20+, a Gemini API key (only needed for AI features).

```bash
git clone https://github.com/ieeecsopen/serendib-browser
cd serendib-browser
npm install
```

Create `.env`:

```ini
GEMINI_API_KEY=<gemini key>
```

```bash
npm run electron:dev   # Electron shell + Vite dev server
npm run dev            # renderer only, in a normal browser tab
npm run electron:build # package a distributable
```

`npm run dev` is faster for pure UI work, but anything touching the main
process, container isolation or tab management needs `electron:dev`.

## Project layout

```
electron/     Main process - windows, container isolation, IPC
src/
  components/ Renderer UI
  services/   AI and browser services
  constants/  Configuration
  styles/     Styling
  types/      Shared TypeScript types
```

## Architecture notes

Container isolation is enforced in the **main** process by giving each container
its own Electron session partition. The renderer cannot be trusted to enforce
this — a renderer-side check would be bypassable by any page. If you touch
container logic, keep the boundary in the main process.

## Contributing

See [CONTRIBUTING.md](https://github.com/ieeecsopen/.github/blob/main/CONTRIBUTING.md).

Security-relevant contributions (session isolation, IPC surface, CSP) get
priority review. Please report vulnerabilities privately —
see [SECURITY.md](https://github.com/ieeecsopen/.github/blob/main/SECURITY.md).

## Licence

MIT — see [LICENSE](LICENSE).
