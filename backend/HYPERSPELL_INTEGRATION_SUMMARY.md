# Hyperspell Integration Summary

## ✅ What Was Integrated

Hyperspell (EnhancedContextStore) has been **deeply integrated** into the Morv AI project. Here's what was added:

---

## 🔄 Updated Endpoints

### 1. **`/api/predictions`** - Enhanced Health Predictions
- ✅ Uses `EnhancedContextStore` instead of `SimpleContextStore`
- ✅ Retrieves learned patterns for each component
- ✅ Retrieves fleet-wide insights
- ✅ Gets component lifecycle data
- ✅ Automatically learns patterns when critical health is detected
- ✅ Updates component lifecycles after each prediction
- ✅ Returns enriched data with `learnedPatterns`, `fleetInsights`, and `lifecycleTrend`

**New Response Fields:**
```json
{
  "components": [
    {
      "id": "eng-001",
      "learnedPatterns": [...],      // NEW
      "fleetInsights": [...],        // NEW
      "lifecycleTrend": {            // NEW
        "degradationRate": -0.5,
        "patternCount": 3
      }
    }
  ],
  "hyperspellEnhanced": true         // NEW
}
```

### 2. **`/api/maintenance`** - Enhanced Maintenance Scheduling
- ✅ Uses `EnhancedContextStore`
- ✅ Retrieves historical decisions for learning
- ✅ Tracks all maintenance scheduling decisions
- ✅ Returns decision history with success scores

**New Response Fields:**
```json
{
  "events": [...],
  "historicalDecisions": [...],      // NEW
  "hyperspellEnhanced": true         // NEW
}
```

### 3. **`/api/repair/context`** - Enhanced Context Storage
- ✅ Uses `EnhancedContextStore` for repair workflow context

---

## 🆕 New Hyperspell Endpoints

### 1. **`GET /api/hyperspell/patterns`**
Get learned patterns from Hyperspell.

**Query Parameters:**
- `tank_id` (optional) - Filter by tank
- `component_id` (optional) - Filter by component
- `pattern_type` (optional) - Filter by pattern type
- `min_confidence` (optional, default: 0.6) - Minimum confidence threshold

**Example:**
```bash
GET /api/hyperspell/patterns?tank_id=TNK-B-023&component_id=eng-001
```

**Response:**
```json
{
  "component_id": "eng-001",
  "patterns": [
    {
      "pattern_type": "critical_health",
      "pattern_data": {...},
      "confidence": 0.8,
      "occurrence_count": 5
    }
  ],
  "count": 1
}
```

### 2. **`GET /api/hyperspell/fleet-insights`**
Get fleet-wide insights (learned from all tanks).

**Query Parameters:**
- `component_id` (optional) - Filter by component
- `insight_type` (optional) - Filter by insight type

**Example:**
```bash
GET /api/hyperspell/fleet-insights?component_id=eng-001
```

### 3. **`GET /api/hyperspell/lifecycle/<tank_id>/<component_id>`**
Get component lifecycle tracking data.

**Example:**
```bash
GET /api/hyperspell/lifecycle/TNK-B-023/eng-001
```

**Response:**
```json
{
  "tank_id": "TNK-B-023",
  "component_id": "eng-001",
  "lifecycle": {
    "health_trajectory": [...],
    "patterns_detected": [...],
    "degradation_rate": -0.5
  }
}
```

### 4. **`GET /api/hyperspell/decisions`**
Get historical agent decisions with outcomes.

**Query Parameters:**
- `tank_id` (optional) - Filter by tank
- `agent_name` (optional) - Filter by agent
- `decision_type` (optional) - Filter by decision type
- `limit` (optional, default: 20) - Number of results

**Example:**
```bash
GET /api/hyperspell/decisions?tank_id=TNK-B-023&agent_name=SchedulerAgent
```

### 5. **`POST /api/hyperspell/decision/<decision_id>/outcome`**
Update a decision with its outcome (for learning).

**Request Body:**
```json
{
  "outcome": {
    "actual_rul_at_maintenance": 95,
    "maintenance_completed": true,
    "downtime_hours": 8
  },
  "success_score": 0.9
}
```

### 6. **`GET /api/hyperspell/context/<tank_id>`**
Get all aggregated context for a tank (patterns, lifecycles, decisions, insights).

**Example:**
```bash
GET /api/hyperspell/context/TNK-B-023
```

**Response:**
```json
{
  "tank_id": "TNK-B-023",
  "context": {
    "contexts": {...},
    "patterns": [...],
    "lifecycle_data": {...},
    "historical_decisions": [...],
    "fleet_insights": [...]
  }
}
```

---

## 🧠 Automatic Learning Features

### 1. **Pattern Learning**
- Automatically learns patterns when:
  - Component health drops below 50%
  - Component status becomes 'critical'
  - Anomalies are detected

**Example Pattern:**
```python
{
  "pattern_type": "critical_health",
  "pattern_data": {
    "health": 45,
    "status": "critical",
    "drivers": ["oil_pressure_drop", "temperature_rise"],
    "rul_hours": 120
  },
  "confidence": 0.8
}
```

### 2. **Decision Tracking**
- All maintenance scheduling decisions are tracked
- Includes input context, decision, and reasoning
- Can be updated with outcomes later for learning

**Tracked Decisions:**
- Maintenance priorities
- Scheduled dates
- Event types (unscheduled, preventive, routine)

### 3. **Component Lifecycle Tracking**
- Automatically updated after each health prediction
- Tracks health trajectory over time
- Records degradation rates
- Stores detected patterns

---

## 📊 How It Works

### Flow Diagram

```
1. Health Prediction Request
   ↓
2. Calculate Health (formula-based)
   ↓
3. Check Hyperspell for:
   - Learned patterns
   - Fleet insights
   - Component lifecycle
   ↓
4. Enhance prediction with Hyperspell data
   ↓
5. Learn new patterns if anomalies detected
   ↓
6. Update component lifecycle
   ↓
7. Return enriched prediction
```

### Maintenance Scheduling Flow

```
1. Calculate component health
   ↓
2. Generate maintenance event
   ↓
3. Track decision in Hyperspell
   ↓
4. Store decision ID with event
   ↓
5. Later: Update decision with outcome
```

---

## 🎯 Benefits

1. **Smarter Predictions**: Uses historical patterns and fleet insights
2. **Continuous Learning**: Learns from every decision and outcome
3. **Fleet-Wide Intelligence**: Learns from all tanks, not just one
4. **Predictive Maintenance**: Tracks lifecycles to predict failures
5. **Decision Quality**: Tracks which decisions work best

---

## 🔧 Usage Examples

### Example 1: Get Enhanced Predictions
```bash
GET /api/predictions?tank_id=TNK-B-023
```

The response now includes:
- Learned patterns for each component
- Fleet-wide insights
- Lifecycle trends

### Example 2: Track Maintenance Outcome
```bash
# After maintenance completes
POST /api/hyperspell/decision/123/outcome
{
  "outcome": {
    "actual_rul_at_maintenance": 95,
    "maintenance_completed": true,
    "downtime_hours": 8
  },
  "success_score": 0.9
}
```

This helps the system learn which decisions were correct.

### Example 3: Query Learned Patterns
```bash
GET /api/hyperspell/patterns?component_id=eng-001&min_confidence=0.7
```

Use this to see what patterns the system has learned.

---

## 📝 Next Steps

1. **Frontend Integration**: Update frontend to display Hyperspell data
2. **Dashboard Widgets**: Show learned patterns and insights
3. **Maintenance Outcome Tracking**: Add UI to update decision outcomes
4. **Pattern Visualization**: Show pattern trends over time
5. **Fleet Insights Dashboard**: Visualize fleet-wide insights

---

## 🚀 Testing

Test the integration:

```bash
# 1. Get predictions (should include Hyperspell data)
curl "http://localhost:8000/api/predictions?tank_id=TNK-B-023"

# 2. Get learned patterns
curl "http://localhost:8000/api/hyperspell/patterns?component_id=eng-001"

# 3. Get fleet insights
curl "http://localhost:8000/api/hyperspell/fleet-insights?component_id=eng-001"

# 4. Get component lifecycle
curl "http://localhost:8000/api/hyperspell/lifecycle/TNK-B-023/eng-001"

# 5. Get historical decisions
curl "http://localhost:8000/api/hyperspell/decisions?tank_id=TNK-B-023"
```

---

## 🔍 Database Tables Created

Hyperspell creates these tables in `tank_database.db`:

- `agent_context` - Main context storage
- `context_history` - Historical context versions
- `learned_patterns` - Learned patterns
- `agent_decisions` - Decision tracking
- `fleet_insights` - Fleet-wide insights
- `component_lifecycles` - Component lifecycle tracking

All tables are created automatically when `EnhancedContextStore` is first used.

---

## ⚙️ Configuration

The integration uses `EnhancedContextStore` by default. If it's not available, it falls back to `SimpleContextStore`.

Check if enhanced features are available:
```python
if ENHANCED_HYPERSPELL_AVAILABLE:
    # Enhanced features available
else:
    # Fallback to basic features
```

---

## ✅ Integration Status

- ✅ EnhancedContextStore integrated
- ✅ Pattern learning in predictions
- ✅ Decision tracking in maintenance
- ✅ Lifecycle tracking for components
- ✅ New Hyperspell endpoints created
- ✅ Automatic anomaly detection
- ✅ Fleet-wide insights retrieval
- ✅ Historical decision tracking

**Hyperspell is now fully integrated and actively learning! 🎉**

