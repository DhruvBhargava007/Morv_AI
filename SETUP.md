# Setup Guide

## Quick Start

### 1. Set up the Database

```bash
# Create the tank database
python scripts/create_tank_database.py
```

This will create `backend/tank_database.db` with comprehensive tank specifications.

### 2. Set up the Backend API

```bash
cd backend
pip install -r requirements.txt
python api.py
```

The API will run on `http://localhost:8000`

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features Implemented

✅ **Complete UI Design Implementation**
- Dark theme with custom color palette
- Responsive layout with sidebar and main content area
- All components from the design document

✅ **Weight Adjustment Panel**
- Collapsible sidebar with system weights
- Preset configurations (Balanced, Defensive, Offensive)
- Real-time weight calculation
- Sub-component weights for powertrain

✅ **Prediction Dashboard Cards**
- Failure Predictions with risk score gauge
- Maintenance Scheduling with priority matrix
- Parts Forecasting with inventory status

✅ **Fleet Overview**
- Grid and list view modes
- Tank cards with health scores
- Status badges and alerts

✅ **Single Tank View**
- Detailed tank information
- System health visualization
- Critical alerts display
- Maintenance history

✅ **Context Upload**
- Drag and drop file upload
- Support for PDF, CSV, XLSX, JSON, TXT
- Upload history with processing status

✅ **AI Assistant**
- Floating chat bubble
- Minimizable chat panel
- Message history
- Context-aware responses

## Project Structure

```
AxERn/
├── backend/
│   ├── api.py              # Flask REST API
│   ├── tank_database.db    # SQLite database
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Documentation
├── scripts/                 # Database scripts
└── README.md
```

## Development Notes

- The frontend uses mock data if the API is unavailable
- All components follow the design specifications from `predictive_insights_ui_design.md`
- TypeScript types ensure type safety throughout the application
- Zustand provides lightweight state management
- TailwindCSS handles all styling with custom design tokens

## Next Steps

1. Connect backend API to frontend (currently using fallback mock data)
2. Implement actual ML prediction models
3. Add authentication and user management
4. Implement file upload processing
5. Enhance AI assistant with actual LLM integration

