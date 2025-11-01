# Hyperspell Cloud Service Integration Guide

## Overview

You have **two options** for Hyperspell:

1. **Local Implementation** (Currently Active) - `EnhancedContextStore` using SQLite
2. **Hyperspell Cloud Service** - Connect to the actual Hyperspell platform API

This guide shows how to integrate with the **Hyperspell Cloud Service**.

---

## Step 1: Get Your Hyperspell API Key

1. Go to your Hyperspell platform (the interface you showed)
2. Navigate to **"API Keys"** in the left sidebar
3. Create a new API key or copy your existing one
4. The key should look like: `hs2-xxx-...`

---

## Step 2: Install Hyperspell Python SDK

```bash
cd backend
pip install hyperspell
```

Or add to `requirements.txt`:
```
hyperspell>=0.1.0
```

---

## Step 3: Create Hyperspell Cloud Client

Create a new file: `backend/agents/hyperspell_cloud_client.py`

```python
#!/usr/bin/env python3
"""
Hyperspell Cloud Service Client
Connects to the actual Hyperspell platform API
"""

import os
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

class HyperspellCloudClient:
    """Client for Hyperspell cloud service"""
    
    def __init__(self, api_key: str = None, base_url: str = "https://api.hyperspell.com"):
        self.api_key = api_key or os.getenv('HYPERSPELL_API_KEY')
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make API request"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, params=data)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Hyperspell API Error: {e}")
            return None
    
    # Context Storage
    def store(self, namespace: str, key: str, value: str, metadata: Dict = None):
        """Store context in Hyperspell cloud"""
        return self._request('POST', '/v1/context', {
            'namespace': namespace,
            'key': key,
            'value': value,
            'metadata': metadata or {}
        })
    
    def retrieve(self, namespace: str, key: str) -> Optional[str]:
        """Retrieve context from Hyperspell cloud"""
        result = self._request('GET', f'/v1/context/{namespace}/{key}')
        return result.get('value') if result else None
    
    def list_keys(self, namespace: str) -> List[str]:
        """List all keys in a namespace"""
        result = self._request('GET', f'/v1/context/{namespace}')
        return result.get('keys', []) if result else []
    
    # Pattern Learning (if supported by cloud API)
    def learn_pattern(self, pattern_type: str, namespace: str, component_id: str,
                     pattern_data: Dict, confidence: float):
        """Learn a pattern"""
        return self._request('POST', '/v1/patterns', {
            'pattern_type': pattern_type,
            'namespace': namespace,
            'component_id': component_id,
            'pattern_data': pattern_data,
            'confidence': confidence
        })
    
    def get_learned_patterns(self, component_id: str, namespace: str = None,
                            pattern_type: str = None, min_confidence: float = 0.6):
        """Get learned patterns"""
        params = {'component_id': component_id}
        if namespace:
            params['namespace'] = namespace
        if pattern_type:
            params['pattern_type'] = pattern_type
        params['min_confidence'] = min_confidence
        
        result = self._request('GET', '/v1/patterns', params)
        return result.get('patterns', []) if result else []
    
    # Decision Tracking
    def store_decision(self, namespace: str, agent_name: str, decision_type: str,
                     input_context: Dict, decision: Dict, reasoning: str = None):
        """Store a decision"""
        return self._request('POST', '/v1/decisions', {
            'namespace': namespace,
            'agent_name': agent_name,
            'decision_type': decision_type,
            'input_context': input_context,
            'decision': decision,
            'reasoning': reasoning
        })
    
    def update_decision_outcome(self, decision_id: int, outcome: Dict, success_score: float):
        """Update decision outcome"""
        return self._request('PUT', f'/v1/decisions/{decision_id}', {
            'outcome': outcome,
            'success_score': success_score
        })
    
    # Memory/Vault (Hyperspell feature)
    def add_memory(self, memory_type: str, content: str, tags: List[str] = None):
        """Add memory to Hyperspell"""
        return self._request('POST', '/v1/memories', {
            'type': memory_type,
            'content': content,
            'tags': tags or []
        })
    
    def query_memories(self, query: str, limit: int = 10):
        """Query memories"""
        return self._request('GET', '/v1/memories', {
            'query': query,
            'limit': limit
        })
    
    # Sandbox/Query (if available)
    def query(self, query: str, context: Dict = None):
        """Run a query in Hyperspell"""
        return self._request('POST', '/v1/query', {
            'query': query,
            'context': context or {}
        })
```

---

## Step 4: Update API to Use Cloud Service

Modify `backend/api.py` to use cloud client:

```python
# At the top of api.py, add:
try:
    from agents.hyperspell_cloud_client import HyperspellCloudClient
    HYPERSPELL_CLOUD_AVAILABLE = True
except ImportError:
    HYPERSPELL_CLOUD_AVAILABLE = False

# In your endpoints, use:
if HYPERSPELL_CLOUD_AVAILABLE:
    hyperspell = HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
else:
    # Fallback to local EnhancedContextStore
    hyperspell = EnhancedContextStore()
```

---

## Step 5: Environment Variables

Create or update `.env` file in `backend/`:

```bash
# backend/.env
HYPERSPELL_API_KEY=hs2-182-wrOEoSA1mKDxlv0knF7y6F6eMIRUKWaq
OPENAI_API_KEY=your-openai-key
```

---

## Step 6: Hybrid Approach (Recommended)

Use **both** local and cloud for best results:

```python
from agents.enhanced_context_store import EnhancedContextStore
from agents.hyperspell_cloud_client import HyperspellCloudClient

class HybridHyperspell:
    """Combine local and cloud Hyperspell"""
    
    def __init__(self, cloud_api_key: str = None):
        self.local = EnhancedContextStore()
        self.cloud = HyperspellCloudClient(api_key=cloud_api_key) if cloud_api_key else None
    
    def store(self, namespace: str, key: str, value: str, metadata: Dict = None):
        # Store locally (fast)
        self.local.store(namespace, key, value, metadata)
        
        # Also store in cloud (sync)
        if self.cloud:
            try:
                self.cloud.store(namespace, key, value, metadata)
            except:
                pass  # Cloud sync failed, but local is fine
    
    def retrieve(self, namespace: str, key: str):
        # Try cloud first (most up-to-date)
        if self.cloud:
            try:
                result = self.cloud.retrieve(namespace, key)
                if result:
                    # Sync to local
                    self.local.store(namespace, key, result)
                    return result
            except:
                pass
        
        # Fallback to local
        return self.local.retrieve(namespace, key)
    
    def learn_pattern(self, pattern_type: str, namespace: str, component_id: str,
                     pattern_data: Dict, confidence: float):
        # Learn locally
        self.local.learn_pattern(pattern_type, namespace, component_id, pattern_data, confidence)
        
        # Also learn in cloud
        if self.cloud:
            try:
                self.cloud.learn_pattern(pattern_type, namespace, component_id, pattern_data, confidence)
            except:
                pass
```

---

## Step 7: Use in Your Code

### Example 1: Store Context

```python
from agents.hyperspell_cloud_client import HyperspellCloudClient

hyperspell = HyperspellCloudClient(api_key=os.getenv('HYPERSPELL_API_KEY'))

# Store tank health data
hyperspell.store(
    namespace='tank_TNK-B-023',
    key='health_predictions',
    value=json.dumps({
        'readiness_score': 85,
        'components': [...]
    }),
    metadata={'timestamp': datetime.now().isoformat()}
)
```

### Example 2: Learn Patterns

```python
# Learn from anomaly
hyperspell.learn_pattern(
    pattern_type='temperature_spike',
    namespace='tank_TNK-B-023',
    component_id='eng-001',
    pattern_data={
        'anomaly_type': 'temperature_spike',
        'health_impact': 0.15,
        'preceding_signals': ['pressure_drop', 'vibration_increase']
    },
    confidence=0.85
)
```

### Example 3: Use Memories

```python
# Add maintenance memory
hyperspell.add_memory(
    memory_type='maintenance',
    content='Engine eng-001 in TNK-B-023 required early maintenance at 850 hours',
    tags=['engine', 'early_maintenance', 'TNK-B-023']
)

# Query memories
memories = hyperspell.query_memories(
    query='early engine maintenance',
    limit=5
)
```

---

## Step 8: API Endpoints for Cloud Integration

Add new endpoints in `api.py`:

```python
@app.route('/api/hyperspell/cloud/query', methods=['POST'])
def hyperspell_query():
    """Query Hyperspell cloud service"""
    if not HYPERSPELL_CLOUD_AVAILABLE:
        return jsonify({'error': 'Hyperspell cloud not available'}), 503
    
    try:
        data = request.get_json()
        query = data.get('query')
        context = data.get('context', {})
        
        client = HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
        result = client.query(query, context)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hyperspell/cloud/memories', methods=['POST'])
def add_hyperspell_memory():
    """Add memory to Hyperspell"""
    if not HYPERSPELL_CLOUD_AVAILABLE:
        return jsonify({'error': 'Hyperspell cloud not available'}), 503
    
    try:
        data = request.get_json()
        memory_type = data.get('type', 'general')
        content = data.get('content')
        tags = data.get('tags', [])
        
        client = HyperspellCloudClient(api_key=HYPERSPELL_API_KEY)
        result = client.add_memory(memory_type, content, tags)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## Testing Cloud Integration

```python
# Test script: test_hyperspell_cloud.py
from agents.hyperspell_cloud_client import HyperspellCloudClient
import os

client = HyperspellCloudClient(api_key=os.getenv('HYPERSPELL_API_KEY'))

# Test store
client.store('tank_TNK-B-023', 'test_key', 'test_value')
print("✅ Store successful")

# Test retrieve
value = client.retrieve('tank_TNK-B-023', 'test_key')
print(f"✅ Retrieved: {value}")

# Test pattern learning
client.learn_pattern(
    'test_pattern',
    'tank_TNK-B-023',
    'eng-001',
    {'test': 'data'},
    0.9
)
print("✅ Pattern learned")
```

---

## Which to Use?

- **Local (EnhancedContextStore)**: Fast, offline, no API costs
- **Cloud (HyperspellCloudClient)**: Sync across devices, access from UI, advanced features
- **Hybrid**: Best of both worlds (recommended)

---

## Next Steps

1. Get your API key from Hyperspell platform
2. Install Hyperspell SDK: `pip install hyperspell`
3. Create `hyperspell_cloud_client.py`
4. Update your `.env` with API key
5. Test the connection
6. Use hybrid approach for best results!

