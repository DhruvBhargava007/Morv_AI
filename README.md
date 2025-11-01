# Predictive Insights Dashboard - Tank Maintenance Analytics

A comprehensive dashboard for predictive tank maintenance analytics with real-time monitoring, failure predictions, maintenance scheduling, and parts forecasting.

## Project Structure

```
AxERn/
├── backend/              # Python backend API
│   └── tank_database.db  # SQLite database
├── frontend/            # React + TypeScript frontend
│   └── src/
│       ├── components/   # UI components
│       ├── stores/       # Zustand state management
│       ├── types/        # TypeScript type definitions
│       └── App.tsx       # Main application
├── docs/                 # Documentation
│   ├── Allaboutyourtanks.md
│   └── database_schema.md
├── scripts/              # Utility scripts
│   ├── create_tank_database.py
│   ├── query_examples.py
│   └── show_all_tank_details.py
└── predictive_insights_ui_design.md  # Design document
```

## Features

- **Fleet Overview**: Grid and list views of all tanks with health scores
- **Single Tank Analysis**: Detailed view of individual tank systems and health
- **Failure Predictions**: Risk scoring and failure timeline predictions
- **Maintenance Scheduling**: Priority matrix and task scheduling
- **Parts Forecasting**: Inventory status and critical parts tracking
- **Weight Adjustment**: Configurable prediction weights for different systems
- **Context Upload**: File upload for additional maintenance data
- **AI Assistant**: Contextual help and insights chatbot

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup (Future)

The backend API will connect to the SQLite database. Implementation pending.

### Database

The SQLite database is located at `backend/tank_database.db`. Use the scripts in `scripts/` to:
- Create the database: `python scripts/create_tank_database.py`
- Query examples: `python scripts/query_examples.py`
- View all details: `python scripts/show_all_tank_details.py`

## Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Zustand for state management
- Framer Motion for animations
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Python 3
- SQLite database

## Design System

The application follows a dark theme design with:
- Primary background: `#0A0E1A`
- Card background: `#1E2433`
- Accent color: `#00A3FF`
- Status colors for critical, warning, success states

See `predictive_insights_ui_design.md` for complete design specifications.

## Development

### Adding New Components

1. Create component in appropriate folder under `src/components/`
2. Export from component file
3. Import and use in `App.tsx` or parent component

### State Management

State is managed using Zustand stores:
- `weightsStore.ts` - Prediction weight configuration
- `viewStore.ts` - View mode and selection state
- `tanksStore.ts` - Tank data and predictions
- `chatStore.ts` - AI assistant chat state

## License

MIT

