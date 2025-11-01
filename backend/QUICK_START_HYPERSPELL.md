# Quick Start: Integrate Hyperspell Cloud Service

## 🚀 3 Simple Steps

### Step 1: Get Your API Key
1. Open your Hyperspell platform (the interface you showed)
2. Click **"API Keys"** in the left sidebar
3. Copy your API key (looks like `hs2-xxx-...`)

### Step 2: Set Environment Variable
```bash
# In backend/.env file, add:
HYPERSPELL_API_KEY=your-api-key-here
```

### Step 3: Use in Your Code

```python
from agents.hyperspell_cloud_client import HyperspellCloudClient

# Initialize
hyperspell = HyperspellCloudClient(api_key=os.getenv('HYPERSPELL_API_KEY'))

# Store context
hyperspell.store('tank_TNK-B-023', 'health_predictions', json.dumps({
    'readiness_score': 85,
    'components': [...]
}))

# Retrieve context
data = hyperspell.retrieve('tank_TNK-B-023', 'health_predictions')

# Learn patterns
hyperspell.learn_pattern(
    pattern_type='temperature_spike',
    namespace='tank_TNK-B-023',
    component_id='eng-001',
    pattern_data={'anomaly': 'temperature_rise'},
    confidence=0.85
)

# Query memories
memories = hyperspell.query_memories('engine maintenance', limit=10)
```

---

## 🔄 Use Both Local + Cloud (Recommended)

```python
from agents.enhanced_context_store import EnhancedContextStore
from agents.hyperspell_cloud_client import HyperspellCloudClient

# Use both for best results
local_store = EnhancedContextStore()  # Fast, offline
cloud_store = HyperspellCloudClient()  # Sync, access from UI

# Store in both
local_store.store(namespace, key, value)
cloud_store.store(namespace, key, value)  # Syncs to cloud
```

---

## 📍 Where to Use It

### In `api.py`:
```python
from agents.hyperspell_cloud_client import HyperspellCloudClient

# In your endpoints:
hyperspell = HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
hyperspell.store(namespace, key, value)
```

### In Agents:
```python
from agents.hyperspell_cloud_client import HyperspellCloudClient

class MyAgent:
    def __init__(self, tank_id):
        self.hyperspell = HyperspellCloudClient()
        self.namespace = f"tank_{tank_id}"
```

---

## ✅ Test It

```python
# test_hyperspell.py
from agents.hyperspell_cloud_client import HyperspellCloudClient
import os

client = HyperspellCloudClient(api_key=os.getenv('HYPERSPELL_API_KEY'))

# Test
result = client.store('test', 'key', 'value')
print(f"✅ Store: {result}")

value = client.retrieve('test', 'key')
print(f"✅ Retrieve: {value}")
```

---

## 📚 Full Documentation

See `HYPERSPELL_CLOUD_INTEGRATION.md` for complete guide.

