# Morv AI - Military CMMS Landing Page

A simple, clean landing page for a military Computerized Maintenance Management System (CMMS), built with React, React Three Fiber, and Tailwind CSS.

## Features

- 🎨 **Dark Mode UI** - Clean, simple dark interface
- 🎮 **3D Interactive Scene** - Interactive 3D model with clickable parts
- 📊 **Part Details** - Right-side drawer showing maintenance history
- 🎯 **Easy to Use** - Simple hover/click interactions
- 📦 **Sketchfab Support** - Load 3D models from external sources

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Project Structure

```
Morv_AI/
├── src/
│   ├── components/
│   │   ├── Scene3D.jsx       # 3D scene with tank model and interactions
│   │   └── InfoDrawer.jsx    # Right-side drawer for part details
│   ├── data/
│   │   └── mockData.js       # Mock maintenance data for parts
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind CSS imports
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## How to Use

1. **Hover** over parts in the 3D model to highlight them (they'll glow blue)
2. **Click** on any part to open the info drawer with:
   - Part details and description
   - Maintenance schedule
   - Full maintenance history

## Customization

### Adding the Abrams M1A2 SEPv3 Model

**Quick Start (Abrams Tank):**

1. Download the model from [Sketchfab](https://sketchfab.com/3d-models/abrams-m1a2-sepv3-eb6f5560198740269507e9948376414c)
2. Save it as `public/models/abrams-m1a2-sepv3.glb`
3. The code is already configured! Just start the server.

**Detailed Guide:** See [IMPORT_ABRAMS.md](./IMPORT_ABRAMS.md) for step-by-step instructions.

### Adding More Tanks

When you download additional tanks, add them to `src/config/tanks.js` following the existing pattern. The system is set up to easily handle multiple tanks!

### Adding More Parts

1. Add part data to `src/data/mockData.js`
2. If using external model, ensure mesh names match your data keys
3. If using geometric model, add corresponding geometry in `Scene3D.jsx`

### Note on AI Predictions

AI predictive maintenance features are **not included on the landing page** - they should be built on a separate page. The landing page focuses on simple part viewing and maintenance history.

## Build for Production

```bash
npm run build
```

## Technologies Used

- **React** - UI framework
- **React Three Fiber** - 3D rendering
- **@react-three/drei** - 3D utilities and helpers
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server

