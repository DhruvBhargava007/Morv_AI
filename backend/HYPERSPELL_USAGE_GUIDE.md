# Hyperspell Usage Guide for Morv AI

## What is Hyperspell in This Project?

**Hyperspell** is a context storage system that enables **inter-agent communication** and **persistent memory** across your maintenance pipeline. In this project, you have two implementations:

1. **SimpleContextStore** - Basic key-value storage (SQLite-based)
2. **EnhancedContextStore** - Advanced version with pattern learning, decision tracking, and fleet-wide insights

Both are stored in your SQLite database (`tank_database.db`) and act as a shared memory system for all AI agents.

---

## Current Usage in the Project

### 1. **Basic Context Sharing** (Already Implemented)

Agents store and retrieve context to pass information down the pipeline:

```python
# In DataAgent
hyperspell.store('tank_TNK-B-023', 'data_ingestion', json.dumps({
    'files_processed': 5,
    'total_records': 1200,
    'anomalies_detected': 3
}))

# In HealthAgent (retrieves from DataAgent)
data_context = hyperspell.retrieve('tank_TNK-B-023', 'data_ingestion')
```

### 2. **Enhanced Learning Features** (Available but Underutilized)

The `EnhancedContextStore` provides powerful features that you can leverage:

```python
from agents.enhanced_context_store import EnhancedContextStore

store = EnhancedContextStore()
```

---

## How to Use Hyperspell Better

### **Option 1: Use Enhanced Context Store in API**

Update your API to use `EnhancedContextStore` instead of `SimpleContextStore`:

```python
# In backend/api.py
from agents.enhanced_context_store import EnhancedContextStore as Hyperspell

# Instead of:
# hyperspell = SimpleContextStore()

# Use:
hyperspell = EnhancedContextStore()
```

### **Option 2: Enable Pattern Learning in Health Predictions**

When predicting component health, learn from patterns:

```python
# In your health prediction endpoint
from agents.enhanced_context_store import EnhancedContextStore

store = EnhancedContextStore()
namespace = f'tank_{tank_id}'

# After detecting an anomaly
if anomaly_detected:
    store.learn_pattern(
        pattern_type='temperature_spike',
        namespace=namespace,
        component_id='eng-001',
        pattern_data={
            'anomaly_type': 'temperature_spike',
            'preceding_signals': ['pressure_fluctuation', 'vibration_increase'],
            'health_impact': 0.15
        },
        confidence=0.85
    )

# Before making predictions, check for similar patterns
patterns = store.get_learned_patterns(
    component_id='eng-001',
    namespace=namespace,
    min_confidence=0.7
)

if patterns:
    # Use patterns to adjust predictions
    print(f"Found {len(patterns)} learned patterns")
```

### **Option 3: Track Decisions and Learn from Outcomes**

Track maintenance decisions and learn what works:

```python
# When scheduling maintenance
decision_id = store.store_decision(
    namespace=f'tank_{tank_id}',
    agent_name='SchedulerAgent',
    decision_type='priority',
    input_context={
        'health': 45,
        'rul_hours': 120,
        'component': 'eng-001'
    },
    decision={
        'priority': 'critical',
        'schedule_days': 1
    },
    reasoning='Health below 50% with low RUL'
)

# Later, when maintenance completes, update with outcome
store.update_decision_outcome(
    decision_id,
    outcome={
        'actual_failure_hours': 95,  # Component failed at 95 hours (good catch!)
        'maintenance_completed': True,
        'downtime_hours': 8
    },
    success_score=0.9  # 0.9 = excellent decision
)
```

### **Option 4: Fleet-Wide Learning**

Learn from all tanks, not just one:

```python
# When you detect a common issue across multiple tanks
store.create_fleet_insight(
    insight_type='common_failure',
    component_id='eng-001',
    insight_data={
        'failure_mode': 'oil_pump_failure',
        'avg_failure_hours': 850,
        'warning_signals': ['oil_pressure_drop', 'temperature_rise']
    },
    affected_tanks=['TNK-A-047', 'TNK-B-023', 'TNK-C-091'],
    confidence=0.92
)

# Retrieve fleet insights when predicting
insights = store.get_fleet_insights(component_id='eng-001')
# Use insights to improve predictions for any tank
```

### **Option 5: Component Lifecycle Tracking**

Track health over time to predict failures:

```python
# Update lifecycle after each health check
store.update_component_lifecycle(
    namespace=f'tank_{tank_id}',
    component_id='eng-001',
    health=65.5,
    rul_hours=250,
    patterns=['degrading_oil_quality', 'increasing_vibration']
)

# Get lifecycle trends
lifecycle = store.get_component_lifecycle(f'tank_{tank_id}', 'eng-001')
if lifecycle and len(lifecycle['health_trajectory']) > 5:
    # Calculate degradation rate
    recent_health = lifecycle['health_trajectory'][-5:]
    # Use trends to adjust predictions
```

---

## Practical Integration Examples

### **Example 1: Enhanced API Endpoint**

```python
# backend/api.py - Enhanced predictions endpoint
@app.route('/api/predictions/enhanced', methods=['POST'])
def get_enhanced_predictions():
    data = request.json
    tank_id = data.get('tank_id')
    
    from agents.enhanced_context_store import EnhancedContextStore
    store = EnhancedContextStore()
    namespace = f'tank_{tank_id}'
    
    # Get historical context
    context = store.aggregate_context_for_ai(namespace)
    
    # Get learned patterns for components
    components = ['eng-001', 'trn-001', 'hyd-001', 'sus-001', 'fcs-001', 'com-001']
    predictions = {}
    
    for comp_id in components:
        # Get patterns
        patterns = store.get_learned_patterns(component_id=comp_id, namespace=namespace)
        
        # Get fleet insights
        insights = store.get_fleet_insights(component_id=comp_id)
        
        # Get lifecycle
        lifecycle = store.get_component_lifecycle(namespace, comp_id)
        
        # Make prediction using all context
        prediction = make_prediction(comp_id, patterns, insights, lifecycle)
        predictions[comp_id] = prediction
    
    return jsonify(predictions)
```

### **Example 2: Learning from Maintenance Outcomes**

```python
# backend/api.py - After maintenance completes
@app.route('/api/maintenance/complete', methods=['POST'])
def maintenance_complete():
    data = request.json
    tank_id = data.get('tank_id')
    component_id = data.get('component_id')
    decision_id = data.get('decision_id')  # From scheduling
    
    from agents.enhanced_context_store import EnhancedContextStore
    store = EnhancedContextStore()
    namespace = f'tank_{tank_id}'
    
    # Update decision outcome
    store.update_decision_outcome(
        decision_id,
        outcome={
            'actual_rul_at_maintenance': data.get('rul_hours'),
            'maintenance_type': data.get('type'),
            'cost': data.get('cost'),
            'downtime_hours': data.get('downtime')
        },
        success_score=calculate_success_score(data)
    )
    
    # Learn from outcome - was this the right time?
    if data.get('failed_before_maintenance'):
        # Component failed - decision was too late
        store.learn_pattern(
            pattern_type='failure_mode',
            namespace=namespace,
            component_id=component_id,
            pattern_data={
                'failure_type': data.get('failure_type'),
                'warning_signals_missed': data.get('missed_signals')
            },
            confidence=0.9
        )
    
    return jsonify({'status': 'success'})
```

### **Example 3: Using Intelligent Health Agent**

```python
# Use the IntelligentHealthAgent which automatically leverages all Hyperspell features
from agents.intelligent_health_agent import IntelligentHealthAgent
from agents.enhanced_context_store import EnhancedContextStore
from openai import OpenAI

store = EnhancedContextStore()
openai_client = OpenAI(api_key=OPENAI_API_KEY)

agent = IntelligentHealthAgent(
    tank_id='TNK-B-023',
    openai_client=openai_client,
    context_store=store
)

# Run health prediction - automatically uses:
# - Historical patterns
# - Fleet insights
# - Component lifecycles
# - Similar tank outcomes
result = agent.predict_health('eng-001', telemetry_df)
```

---

## Quick Start: Enable Enhanced Hyperspell

### Step 1: Update API to Use Enhanced Context Store

In `backend/api.py`, find where `SimpleContextStore` is imported and replace with:

```python
# Replace this:
from agents.context_store import SimpleContextStore

# With this:
from agents.enhanced_context_store import EnhancedContextStore as SimpleContextStore
```

Or use both:

```python
from agents.context_store import SimpleContextStore
from agents.enhanced_context_store import EnhancedContextStore

# Use EnhancedContextStore for new features
enhanced_store = EnhancedContextStore()
```

### Step 2: Use Enhanced Supervisor

The `EnhancedSupervisor` already supports intelligent learning:

```python
from agents.enhanced_supervisor import EnhancedSupervisor

# Enable intelligent learning
supervisor = EnhancedSupervisor(
    tank_id='TNK-B-023',
    use_enhanced_agents=True,
    use_intelligent_learning=True  # <-- This enables all Hyperspell features
)

result = supervisor.run_maintenance_pipeline(data_directory)
```

### Step 3: Add Pattern Learning to Your Workflow

```python
# In your health prediction logic
if use_enhanced_store:
    # Learn from anomalies
    if anomaly_detected:
        store.learn_pattern(...)
    
    # Use learned patterns
    patterns = store.get_learned_patterns(...)
    # Adjust predictions based on patterns
```

---

## Benefits of Using Enhanced Hyperspell

1. **Pattern Recognition**: Automatically recognizes recurring issues
2. **Better Predictions**: Uses historical data to improve accuracy
3. **Fleet Learning**: Learn from all tanks, not just one
4. **Decision Tracking**: Learn which maintenance decisions were correct
5. **Predictive Maintenance**: Track component lifecycles to predict failures
6. **Reduced Downtime**: Catch issues earlier using learned patterns

---

## Migration Path

1. **Phase 1**: Keep using `SimpleContextStore` (current behavior)
2. **Phase 2**: Use `EnhancedContextStore` alongside for new features
3. **Phase 3**: Migrate all agents to use enhanced features
4. **Phase 4**: Enable intelligent learning in `EnhancedSupervisor`

---

## Next Steps

1. ✅ Read this guide
2. 🔄 Update `api.py` to use `EnhancedContextStore` for new endpoints
3. 🔄 Add pattern learning to health predictions
4. 🔄 Track maintenance decisions and outcomes
5. 🔄 Enable intelligent learning in production pipeline

---

## References

- `backend/agents/enhanced_context_store.py` - Enhanced implementation
- `backend/agents/context_store.py` - Basic implementation
- `backend/HYPERSPELL_ENHANCEMENT_GUIDE.md` - Detailed technical guide
- `backend/QUICK_HYPERSPELL_REFERENCE.md` - Quick reference

