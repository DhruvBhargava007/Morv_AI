# AI Agent Setup Guide

## ✅ What's Already Done

I've created the complete agent infrastructure:

### Agent Files Created:
- `backend/agents/config.py` - Configuration with your Hyperspell key
- `backend/agents/tools.py` - Composio tool wrappers (8 tools)
- `backend/agents/data_agent.py` - CSV ingestion agent
- `backend/agents/health_agent.py` - Health prediction + AI explanations
- `backend/agents/scheduler_agent.py` - Maintenance scheduling with AI reasoning
- `backend/agents/logistics_agent.py` - Parts/personnel/work orders
- `backend/agents/supervisor.py` - Mastra orchestrator

### Hyperspell Key Configured:
✅ Your key is set in `config.py`: `hs2-182-wrOEoSA1mKDxlv0knF7y6F6eMIRUKWaq`

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
pip install -r agents/requirements.txt
```

### 2. Setup OpenAI API Key

```bash
cd backend

# Create .env file (or add to existing)
echo "OPENAI_API_KEY=sk-your-openai-key-here" >> .env
echo "HYPERSPELL_API_KEY=hs2-182-wrOEoSA1mKDxlv0knF7y6F6eMIRUKWaq" >> .env
```

Get your OpenAI key from: https://platform.openai.com/api-keys

### 3. Setup Mastra

**Option A: Check if Mastra requires API key**
```bash
# Try importing Mastra
python3 -c "from mastra import Mastra; print('Mastra OK')"

# If it errors, check documentation:
# https://mastra.ai/docs
```

**If Mastra needs API key:**
- Sign up at https://mastra.ai
- Get API key
- Add to `.env`: `MASTRA_API_KEY=your-key`

**If Mastra is open-source:**
- Just install: `pip install mastra`
- No key needed

### 4. Setup Composio

**Option A: Auth Login (Recommended)**
```bash
composio auth login
# Follow prompts to authenticate
```

**Option B: API Key**
- Sign up at https://composio.dev
- Get API key from dashboard
- Add to `.env`: `COMPOSIO_API_KEY=your-key`

**If Composio doesn't need auth:**
- Just install: `pip install composio-core`
- No setup needed

---

## 📦 What Each Framework Does

### Mastra (Orchestration)
- **Role**: Manages the 4-agent workflow
- **Location**: `agents/supervisor.py`
- **What it does**: 
  - Defines DAG: DataAgent → HealthAgent → SchedulerAgent → LogisticsAgent
  - Handles handoffs between agents
  - Manages retries if agent fails

### Hyperspell (Context/Memory)
- **Role**: Stores agent context across tanks
- **Location**: All agent files use `hyperspell.store()` and `hyperspell.retrieve()`
- **What it does**:
  - DataAgent stores: "TNK-B-023: 21,720 rows ingested"
  - HealthAgent retrieves: Past ingestion results
  - SchedulerAgent stores: "3 critical events scheduled"
  - LogisticsAgent retrieves: Maintenance schedule from SchedulerAgent

### Composio (Tool Integration)
- **Role**: Makes your Python functions callable by agents
- **Location**: `agents/tools.py` - 8 tools wrapped
- **What it does**:
  - Wraps `compute_component_health()` → Agents can call it
  - Wraps `check_parts_inventory()` → Agents can query inventory
  - Wraps `match_personnel()` → Agents can find technicians

---

## 🧪 Testing Agents

### Test Individual Agents

```bash
cd backend

# Test DataAgent
python3 -c "from agents.data_agent import DataAgent; from agents.config import HYPERSPELL_API_KEY; from hyperspell import Hyperspell; agent = DataAgent('TNK-A-047', Hyperspell(HYPERSPELL_API_KEY)); result = agent.run('synthetic_data/TNK-A-047'); print(result['status'])"

# Test HealthAgent
python3 -c "from agents.health_agent import HealthAgent; from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY; from openai import OpenAI; from hyperspell import Hyperspell; agent = HealthAgent('TNK-B-023', OpenAI(api_key=OPENAI_API_KEY), Hyperspell(HYPERSPELL_API_KEY)); result = agent.run(); print(f'Readiness: {result[\"readiness_score\"]}%')"

# Test SchedulerAgent
python3 -c "from agents.scheduler_agent import SchedulerAgent; from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY; from openai import OpenAI; from hyperspell import Hyperspell; agent = SchedulerAgent('TNK-B-023', OpenAI(api_key=OPENAI_API_KEY), Hyperspell(HYPERSPELL_API_KEY)); result = agent.run(); print(f'Events: {len(result[\"events\"])}')"

# Test LogisticsAgent
python3 -c "from agents.logistics_agent import LogisticsAgent; from agents.config import OPENAI_API_KEY, HYPERSPELL_API_KEY; from openai import OpenAI; from hyperspell import Hyperspell; agent = LogisticsAgent('TNK-B-023', OpenAI(api_key=OPENAI_API_KEY), Hyperspell(HYPERSPELL_API_KEY)); result = agent.run(); print(f'Work Orders: {len(result[\"work_orders\"])}')"
```

### Test Full Pipeline (Supervisor)

```bash
cd backend

python3 -c "
from agents.supervisor import Supervisor
supervisor = Supervisor('TNK-B-023')
result = supervisor.run_maintenance_pipeline(data_directory='synthetic_data/TNK-B-023')
print(f'Status: {result[\"status\"]}')
print(f'Readiness: {result[\"results\"][\"health_predictions\"][\"readiness_score\"]}%')
print(f'Events: {len(result[\"results\"][\"maintenance_schedule\"][\"events\"])}')
"
```

---

## 🔌 Integration with API

The agents are ready to use! Next steps:

1. **Update `backend/api.py`** to call `Supervisor.run_maintenance_pipeline()`
2. **Replace rule-based scheduler** with agent outputs
3. **Add AI explanations** to predictions endpoint
4. **Stream agent activity** to frontend

---

## ⚠️ Troubleshooting

### "Module mastra not found"
```bash
pip install mastra
# OR check: https://mastra.ai/docs for correct package name
```

### "Module hyperspell not found"
```bash
pip install hyperspell
# Your API key is already configured in config.py
```

### "Module composio not found"
```bash
pip install composio-core
# Then run: composio auth login
```

### "OpenAI API key not set"
- Create `.env` file in `backend/`
- Add: `OPENAI_API_KEY=sk-your-key`

### Agents work without AI
- All agents have fallback modes
- If OpenAI not available, they use template-based explanations
- If Hyperspell not available, they print context (still work)
- If Mastra not available, Supervisor uses manual orchestration

---

## 📋 Next: Integration Steps

1. **Update API** to call Supervisor instead of direct functions
2. **Add AI explanations** to `/api/predictions` response
3. **Stream agent activity** via SSE endpoint
4. **Frontend** displays live AI activity (filling work orders, etc.)

---

**Status**: Agent infrastructure complete! Just need Mastra/Composio setup and OpenAI key.

