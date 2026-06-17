# CRM App V5

A single-page CRM (Customer Relationship Management) UI built with **React** and **Vite**.

The entire application is fully client-side — there is **no backend, no database, and no API**. All data is mock/in-memory data defined directly in the component, so you can run it anywhere with zero configuration.

## Features

The app renders a complete CRM interface including:

- **Role-based dashboards** (Sales Admin / Vertriebsdirektor / Geschäftspartner)
- **Leads** list, detail view, lead drawer, and AI scoring
- **Appointments & Calendar** with activities and reminders
- **Auto-assignment** rules and smart (re)assignment
- **Lead capture** and import sources
- **Email marketing** campaigns, templates, and automations
- **Reports & analytics**
- **Events** management
- **Education** hub
- **Settings** (statuses, document types, workflow rules, automations, audit log)
- **AI features** — insights, roleplay, voice-to-CRM, meeting-prep briefs, call analysis

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- Plain inline styles + emoji icons (no UI component library, no CSS framework)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open the URL printed in the terminal (default: http://localhost:5173).

### Build for production

```bash
npm run build
```

The optimized output is written to `dist/`.

### Preview the production build

```bash
npm run preview
```

## Project Structure

```
.
├── index.html          # Vite entry HTML
├── vite.config.js      # Vite + React plugin config
├── src/
│   ├── main.jsx        # React entry point — mounts <CRMAppV5 />
│   ├── CRMAppV5.jsx    # The entire CRM application (self-contained)
│   └── index.css       # Global reset / base styles
└── package.json
```

## Notes

`src/CRMAppV5.jsx` is a single self-contained component that holds all screens,
mock data, and UI logic. It only depends on `react`. Because all state lives in
memory, refreshing the page resets the app to its initial mock data.
