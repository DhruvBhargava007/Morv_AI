# Quick Hyperspell Reference

## Enhanced Features at a Glance

### 1. Pattern Learning
```python
store.learn_pattern('anomaly', namespace, component_id, pattern_data, confidence)
patterns = store.get_learned_patterns(component_id='eng-001')
```

### 2. Decision Tracking
```python
decision_id = store.store_decision(namespace, agent, type, input, decision, reasoning)
store.update_decision_outcome(decision_id, outcome, success_score)
```

### 3. Lifecycle Tracking
```python
store.update_component_lifecycle(namespace, component_id, health, rul_hours, patterns)
lifecycle = store.get_component_lifecycle(namespace, component_id)
```

### 4. Fleet Insights
```python
store.create_fleet_insight(type, component_id, data, tanks, confidence)
insights = store.get_fleet_insights(component_id='eng-001')
```

### 5. Similar Tank Learning
```python
similar = store.get_similar_tank_contexts(namespace, limit=5)
```

### 6. Rich Context
```python
context = store.aggregate_context_for_ai(namespace)
# Returns: all contexts, patterns, lifecycles, decisions, insights
```

## Usage

```python
from agents.enhanced_context_store import EnhancedContextStore

store = EnhancedContextStore()

# All features available
# Backward compatible with old SimpleContextStore
```

