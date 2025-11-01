# Technical Architecture: Data, Decisions & Processes

## Overview

This application is an AI-powered predictive maintenance system for military tank fleets. It uses a multi-agent architecture with intelligent decision-making, pattern learning, and real-time streaming capabilities.

---

## 1. DATA FLOW ARCHITECTURE

### 1.1 Data Ingestion Pipeline

**Entry Point:** `/api/ingest` (POST) - Multipart form data with CSV files

**Process Flow:**
```
Frontend Upload → API Endpoint → Temporary Directory → DataAgent → Database
```

**Detailed Steps:**

1. **File Upload** (`api.py:244-336`)
   - Receives 6 CSV file types: `maintenance`, `risk`, `priority`, `usage`, `sensors`, `logs`
   - Validates `tank_id` parameter
   - Creates temporary directory for file storage
   - Saves all uploaded files with secure filenames

2. **Agent Pipeline** (if agents available)
   - **DataAgent** (`data_agent.py`)
     - Calls `ingest_tank_data()` for each file
     - Validates schema, deduplicates, type-checks
     - Batch inserts sensor telemetry (performance optimization)
     - Logs each step to `agent_activity_log` table
     - Stores ingestion summary in context store (namespace: `tank_{tank_id}`)
   
3. **Direct Ingestion** (fallback if agents unavailable)
   - Uses `ingestion.py` functions directly
   - Same validation and processing, without agent orchestration

**Data Validation (`ingestion.py:49-98`):**
- Schema validation: Checks required columns per file type
- Type validation: Ensures numeric ranges, valid enums
- Deduplication: Removes duplicates based on primary keys per table

**CSV File Types & Schemas:**

| File Type | Key Tables | Primary Columns |
|-----------|-----------|----------------|
| `maintenance` | `maintenance_events` | `tankId`, `componentId`, `eventTime` |
| `risk` | `part_risk` | `componentId` |
| `priority` | `priority_policy` | `componentId` |
| `usage` | `usage_profile` | `tankId`, `date` |
| `sensors` | `telemetry` | `tankId`, `componentId`, `timestamp`, `feature` |
| `logs` | `logs_parsed` | `tankId`, `timestamp`, `componentId`, `code` |

### 1.2 Health Data Upload & Recalculation

**Entry Point:** `/api/health/upload` (POST) → `/api/health/recalculate` (POST)

**Process:**
1. **File Upload** (`api.py:914-967`)
   - Validates CSV file using `validate_csv_file()` from `utils/file_processor.py`
   - Detects category (`sensors` or `logs`)
   - Stores file temporarily with job ID
   - Returns job ID and detected category

2. **Recalculation** (`api.py:969-1032`)
   - Loads uploaded file by job ID
   - Parses CSV by detected category
   - Initializes `HealthAdjustmentAgent`
   - Calls `process_csv_and_adjust_health()`
   - Returns adjusted health scores with reasoning

**Data Flow:**
```
CSV Upload → Validation → Temporary Storage → HealthAdjustmentAgent → Adjusted Scores → Frontend
```

### 1.3 Health Prediction Retrieval

**Entry Point:** `/api/predictions` (GET)

**Two-Tier Retrieval Strategy:**

1. **Agent-Enhanced Path** (if agents available):
   ```
   API → Context Store (Hyperspell) → Retrieve 'health_predictions' → 
   Enhance with learned patterns → Enhance with fleet insights → Return
   ```

2. **Direct Calculation Path** (fallback):
   ```
   API → health_engine.compute_health_index() → 
   Optionally enhance with Hyperspell patterns → Return
   ```

**Context Enhancement (`api.py:358-414`):**
- Retrieves learned patterns from `learned_patterns` table
- Retrieves fleet-wide insights from `fleet_insights` table
- Retrieves component lifecycle from `component_lifecycles` table
- Merges all into component data before returning

---

## 2. DECISION-MAKING PROCESSES

### 2.1 Health Prediction Algorithm

**Core Engine:** `health_engine.py:compute_health_index()`

**Formula:**
```
HI = 100 * exp(-[alpha * feature_penalty + beta * overload + gamma * hazard + delta * recency])
```

**Components:**

1. **Feature Deviation Penalty** (`alpha = 0.15`)
   - Computes z-scores for each telemetry feature
   - Groups by feature type (temp, pressure, vibration, etc.)
   - Applies component-specific weights
   - Penalizes deviations beyond `Z_SCORE_THRESHOLD = 2.0`
   - Formula: `penalty = weight * max(0, avg_z_score - threshold)`

2. **Overload Exposure** (`beta = 0.25`)
   - Averages `overloadPct` from usage profile
   - Represents operational stress on components

3. **Weibull Hazard** (`gamma = 0.30`)
   - Cumulative hazard: `H(t) = (operating_hours / eta)^k`
   - Uses Weibull parameters from `part_risk` table
   - Represents age-based wear

4. **Maintenance Recency** (`delta = 0.20`)
   - Normalized time since last service: `hours_since / MTBF`
   - Capped at 1.0

**RUL Calculation:**
```
eta_effective = eta / (1 + 0.5 * overload_exposure)
RUL = (HI / 100) * eta_effective
```

**Status Thresholds:**
- `operational`: HI ≥ 80
- `degraded`: 60 ≤ HI < 80
- `maintenance_required`: 40 ≤ HI < 60
- `critical`: HI < 40

### 2.2 AI-Enhanced Health Prediction

**Enhanced Agents:** `enhanced_health_agent.py`, `intelligent_health_agent.py`

**Process:**
1. Fetches telemetry data (30 days)
2. Computes base health using formula (above)
3. Uses OpenAI GPT-4 to analyze patterns:
   - Detects anomalies in sensor data
   - Identifies trends and degradation patterns
   - Provides explanations with context
4. **Weighted Combination:**
   - Critical components: 70% AI prediction, 30% formula
   - Standard components: 50% AI, 50% formula
5. Stores patterns in `learned_patterns` table for future learning

**Pattern Learning** (`enhanced_context_store.py`):
- Detects recurring anomalies
- Tracks failure modes across tanks
- Builds confidence scores based on validation
- Cross-tank pattern recognition in `fleet_insights` table

### 2.3 Maintenance Scheduling Decisions

**Agent:** `scheduler_agent.py`

**Decision Process:**

1. **Retrieve Context:**
   - Gets health predictions from context store
   - Retrieves priority policies from database

2. **Priority Assessment** (`scheduler_agent.py:39-118`):
   - **Rule-Based Base:**
     - `critical`: RUL < 72h OR health < 40
     - `high`: RUL < 168h OR health < 60
     - `medium`: RUL < 336h OR health < 75
     - `low`: Otherwise
   
   - **AI Refinement** (if OpenAI available):
     - For `critical`/`high` priority OR health < 70
     - GPT-4 assesses urgency considering:
       - Mission criticality
       - Resource availability
       - Historical maintenance outcomes
     - Generates refined reasoning

3. **Event Generation:**
   - Only creates events for components with health < 80 OR RUL < 336h
   - Event types:
     - `unscheduled`: health < 70
     - `preventive`: 70 ≤ health < 80
     - `scheduled`: health ≥ 80

4. **Decision Tracking:**
   - Stores decisions in `agent_decisions` table
   - Links to outcomes for learning

### 2.4 Logistics & Resource Allocation

**Agent:** `logistics_agent.py`

**Process:**

1. **Work Order Generation:**
   - Checks parts inventory via `check_parts_inventory()` tool
   - Creates work order if `current_quantity < min_quantity`
   - Uses AI to generate justification:
     - Component health
     - Priority level
     - Historical procurement data
   - Links work order to maintenance event

2. **Personnel Assignment:**
   - Matches personnel by specialization via `match_personnel()` tool
   - Estimates hours based on priority:
     - `critical`: 8 hours
     - `high`: 6 hours
     - `medium`/`low`: 4 hours
   - Includes special instructions from scheduler reasoning

3. **Decision Storage:**
   - Stores all work orders and assignments in context store
   - Links to decisions table for outcome tracking

### 2.5 Repair Workflow Decisions

**Agent:** `repair_agent.py`

**Streaming Decision Process:**

1. **Context Gathering** (`repair_agent.py:45-125`):
   - Component health data
   - Historical repairs (from context store)
   - Personnel availability (for personnel assignment)
   - Parts inventory (for work orders)
   - Vendor data (for work orders)
   - Tank network topology (for part transfers)

2. **AI Stream Generation**:
   - Uses OpenAI GPT-4 Turbo with streaming
   - Generates field-by-field recommendations
   - Each field includes:
     - Field name
     - Recommended value
     - Reasoning (explanation)
     - Confidence score (0-100)

3. **Fallback Generation**:
   - If OpenAI unavailable, uses rule-based logic
   - Simulates streaming with delays
   - Basic matching based on availability and specialization

**Repair Types:**
- `personnel_assignment`: Matches personnel by specialization
- `work_order`: Recommends parts, vendors, costs, timelines
- `part_transfer`: Suggests source tanks, transfer paths, logistics

---

## 3. PROCESS ORCHESTRATION

### 3.1 Multi-Agent Pipeline

**Supervisor:** `supervisor.py` or `enhanced_supervisor.py`

**Pipeline Sequence:**

```
DataAgent → HealthAgent → SchedulerAgent → LogisticsAgent
```

**Step-by-Step:**

1. **DataAgent** (`data_agent.py:30-87`)
   - Input: `data_directory` (CSV files path)
   - Process: Ingests all CSV files, validates, deduplicates
   - Output: Summary stored in context store as `data_ingestion`
   - Context Passed: `{'tank_id', 'data_available', 'components_available'}`

2. **HealthAgent** (`health_agent.py:116-207`)
   - Input: Context from DataAgent OR retrieves from context store
   - Process: 
     - Computes health for all 6 components
     - Generates AI explanations (if OpenAI available)
     - Calculates readiness score
   - Output: Health predictions stored as `health_predictions`
   - Context Passed: `{'readiness_score', 'critical_components', 'degraded_components'}`

3. **SchedulerAgent** (`scheduler_agent.py:120-229`)
   - Input: Context from HealthAgent OR retrieves from context store
   - Process:
     - Assesses priority for each component
     - Generates maintenance events
     - Applies AI refinement (if available)
   - Output: Maintenance schedule stored as `maintenance_schedule`
   - Context Passed: `{'events_generated', 'critical_events'}`

4. **LogisticsAgent** (`logistics_agent.py:106-229`)
   - Input: Context from SchedulerAgent OR retrieves from context store
   - Process:
     - Checks parts inventory
     - Generates work orders
     - Matches personnel
     - Creates assignments
   - Output: Logistics recommendations stored as `logistics_recommendations`
   - Context Passed: None (end of pipeline)

**Orchestration Method:**
- Manual Python orchestration (no Mastra, TypeScript-only)
- Sequential execution with context passing
- Error handling with fallbacks at each step

### 3.2 Enhanced Supervisor

**File:** `enhanced_supervisor.py`

**Features:**
- Uses `IntelligentHealthAgent` instead of basic `HealthAgent` (if learning enabled)
- Uses `EnhancedHealthAgent` with stronger AI dependency
- Uses `EnhancedSchedulerAgent` with optimization
- Optional intelligent learning mode via `EnhancedContextStore`

**Configuration:**
- `use_enhanced_agents=True`: Uses enhanced agent implementations
- `use_intelligent_learning=True`: Enables pattern learning and fleet insights

### 3.3 Context Store Architecture

**Storage System:** `SimpleContextStore` (SQLite-based) or `EnhancedContextStore`

**Tables:**

1. **`agent_context`**: Current state storage
   - `namespace`: e.g., `tank_{tank_id}`
   - `key`: e.g., `health_predictions`, `maintenance_schedule`
   - `value`: JSON string
   - `timestamp`, `version`, `metadata`

2. **`context_history`**: Historical changes
   - Tracks all updates to context
   - Enables rollback and audit trails

3. **`learned_patterns`**: Pattern recognition
   - Pattern types: `anomaly`, `degradation`, `failure_mode`
   - Confidence scores
   - Occurrence counts
   - Associated outcomes

4. **`agent_decisions`**: Decision tracking
   - Input context
   - Decision made
   - Reasoning
   - Outcomes (filled later)
   - Success scores

5. **`fleet_insights`**: Cross-tank learning
   - Common failures across fleet
   - Optimal maintenance strategies
   - Component-specific insights

6. **`component_lifecycles`**: Lifecycle tracking
   - Health trajectory over time
   - Failure predictions
   - Maintenance history
   - Detected patterns

**Context Retrieval Flow:**
```
Agent → Context Store → Retrieve by namespace + key → Parse JSON → Use in Decision
```

**Context Update Flow:**
```
Agent → Generate Result → Serialize to JSON → Store with namespace + key → Update History
```

### 3.4 Activity Logging

**System:** `ingestion.py:log_activity()`

**Table:** `agent_activity_log`

**Fields:**
- `tankId`, `agentName`, `action`, `status`, `details` (JSON), `timestamp`

**Usage:**
- Every agent action logged
- Statuses: `in_progress`, `completed`, `error`, `warning`
- Details stored as JSON for querying
- Enables audit trail and debugging

---

## 4. DATABASE ARCHITECTURE

### 4.1 Core Tables

**Tank Data:**
- `tanks`: Basic tank information
- `performance`: Speed, power specifications
- `engines`: Engine specifications
- `transmissions`: Transmission specs
- `suspension`: Suspension/track specs
- `armor`: Protection specs
- `fire_control`: Targeting system specs
- `weapons_main`: Main weapon specs

**Operational Data:**
- `telemetry`: Sensor readings (tankId, componentId, timestamp, feature, value)
- `usage_profile`: Daily usage (hours, environment severity, overload %, mission type)
- `maintenance_events`: Maintenance history
- `logs_parsed`: System logs

**Configuration:**
- `part_risk`: Weibull parameters, risk classification
- `priority_policy`: SLA days, base priorities

**Agent System:**
- `agent_context`: Context storage (see above)
- `agent_activity_log`: Activity tracking
- `agent_decisions`: Decision history (Enhanced only)
- `learned_patterns`: Pattern learning (Enhanced only)
- `fleet_insights`: Fleet-wide learning (Enhanced only)
- `component_lifecycles`: Lifecycle tracking (Enhanced only)

### 4.2 Data Relationships

```
tanks (1) → (N) telemetry
tanks (1) → (N) usage_profile
tanks (1) → (N) maintenance_events
tanks (1) → (N) logs_parsed

components (via componentId) → (N) telemetry
components (via componentId) → (1) part_risk
components (via componentId) → (1) priority_policy
```

**Namespace Hierarchy:**
- `tank_{tank_id}`: Tank-level context
- `repair_{component_id}`: Repair workflow context

---

## 5. FRONTEND-BACKEND COMMUNICATION

### 5.1 API Endpoints

**Data Retrieval:**
- `GET /api/tanks`: List all tanks
- `GET /api/tanks/<tank_id>`: Tank details
- `GET /api/predictions?tank_id=`: Health predictions
- `GET /api/maintenance?tank_id=`: Maintenance schedule
- `GET /api/activity?tank_id=&limit=`: Agent activity log

**Data Upload:**
- `POST /api/ingest`: Bulk CSV ingestion
- `POST /api/health/upload`: Single CSV upload
- `POST /api/health/recalculate`: Trigger recalculation

**Repair Workflow:**
- `POST /api/repair/context`: Store repair context
- `GET /api/repair/context/<component_id>`: Retrieve context
- `POST /api/repair/stream`: SSE streaming for form fields

**Enhanced Features:**
- `GET /api/hyperspell/patterns`: Learned patterns
- `GET /api/hyperspell/fleet-insights`: Fleet insights
- `GET /api/hyperspell/lifecycle/<tank_id>/<component_id>`: Lifecycle data
- `GET /api/hyperspell/decisions`: Historical decisions

### 5.2 Streaming Architecture

**Technology:** Server-Sent Events (SSE)

**Endpoint:** `/api/repair/stream` (POST)

**Process:**
1. Frontend sends JSON: `{componentId, tankId, repairType}`
2. Backend initializes `RepairAgent`
3. Agent gathers context
4. OpenAI stream generates field-by-field updates
5. Each update sent as SSE: `data: {JSON}\n\n`
6. Frontend receives via `EventSource` or `useRepairStream` hook

**Message Format:**
```json
{
  "field": "personnelIds",
  "value": ["PER-001"],
  "reasoning": "Selected SSG James Mitchell based on availability...",
  "confidence": 85
}
```

**Frontend Handling** (`frontend/lib/hooks/useRepairStream.ts`):
- Opens SSE connection
- Receives field updates
- Updates form fields in real-time
- Displays reasoning in live panel
- Handles connection errors with fallback

### 5.3 Data Transformation

**Backend → Frontend:**
- Component IDs mapped to names
- Timestamps formatted (ISO → user-friendly)
- Health status mapped to UI colors
- Priority levels mapped to badges

**Frontend → Backend:**
- Tank IDs normalized (e.g., `TNK-A-047` → database format)
- Form data validated before submission
- File uploads converted to FormData

---

## 6. AI INTEGRATION & FALLBACKS

### 6.1 OpenAI Integration

**Models Used:**
- GPT-4: Health explanations, priority assessment, work order justifications
- GPT-4 Turbo: Repair form field streaming

**Integration Points:**
1. **HealthAgent**: Explanation generation
2. **SchedulerAgent**: Priority refinement
3. **LogisticsAgent**: Work order justification
4. **RepairAgent**: Form field generation (streaming)

**Error Handling:**
- All AI calls wrapped in try-catch
- Falls back to rule-based logic on failure
- Logs errors but continues execution

### 6.2 Fallback Mechanisms

**Health Prediction:**
- AI unavailable → Formula-based calculation only
- Enhanced agent unavailable → Basic agent
- Context store unavailable → Direct database queries

**Maintenance Scheduling:**
- AI unavailable → Rule-based priority assessment
- Uses thresholds: RUL < 72h = critical, etc.

**Repair Recommendations:**
- OpenAI unavailable → `_fallback_generation()` method
- Rule-based matching: Available personnel, inventory status, network proximity

**Streaming:**
- OpenAI stream fails → Fallback generator with simulated delays
- Maintains same message format for frontend compatibility

### 6.3 Pattern Learning System

**Enhanced Context Store Features:**

1. **Pattern Detection:**
   - Anomalies in sensor data
   - Degradation trends
   - Failure modes

2. **Confidence Scoring:**
   - Based on occurrence frequency
   - Validation from outcomes
   - Cross-tank confirmation

3. **Fleet Learning:**
   - Aggregates patterns across tanks
   - Identifies common issues
   - Recommends preventive actions

4. **Lifecycle Tracking:**
   - Tracks health over time
   - Predicts failure points
   - Correlates with maintenance events

**Learning Feedback Loop:**
```
Decision Made → Outcome Recorded → Pattern Updated → Next Decision Improved
```

---

## 7. STATE MANAGEMENT

### 7.1 Backend State

**Primary Storage:** SQLite database
**Context Storage:** `agent_context` table
**Namespace Pattern:** `tank_{tank_id}` or `repair_{component_id}`

**State Lifecycle:**
1. Data ingestion updates raw tables
2. Agent runs compute derived state
3. Results stored in context store
4. Frontend retrieves via API
5. Historical state preserved in `context_history`

### 7.2 Frontend State

**React State:**
- Component-level state for UI interactions
- Form field values
- Loading states
- Error states

**Data Fetching:**
- React hooks for API calls
- Automatic refetching on data changes
- Optimistic updates where appropriate

**Context Management:**
- `RepairContextManager`: Manages repair workflow state
- Stores context via API before navigation
- Retrieves on page load

---

## 8. PERFORMANCE OPTIMIZATIONS

### 8.1 Database

- **Batch Inserts**: Sensor telemetry uses `executemany()` for bulk inserts
- **Indexes**: Created on frequently queried columns (namespace, key, componentId, timestamp)
- **Deduplication**: Prevents duplicate data insertion

### 8.2 API

- **Caching**: Context store acts as cache for agent results
- **Lazy Loading**: Health calculations only when requested
- **Streaming**: SSE prevents timeout on long operations

### 8.3 Frontend

- **Memoization**: Component health calculations memoized
- **Pagination**: Activity logs limited and paginated
- **Debouncing**: File upload validation debounced

---

## 9. SECURITY & VALIDATION

### 9.1 Input Validation

- **File Uploads**: Type checking, schema validation, sanitized filenames
- **API Parameters**: Type checking, required parameter validation
- **Database Queries**: Parameterized queries prevent SQL injection

### 9.2 Error Handling

- **Graceful Degradation**: Falls back to rule-based when AI unavailable
- **Error Logging**: All errors logged to activity log
- **User Feedback**: Clear error messages returned to frontend

---

## 10. TESTING & MONITORING

### 10.1 Activity Logging

- Every agent action logged with timestamp
- Status tracking (in_progress → completed/error)
- JSON details for debugging

### 10.2 Decision Tracking

- All decisions stored with input context
- Outcomes recorded for learning
- Success scores computed from outcomes

### 10.3 Health Monitoring

- Database health check endpoint: `/api/health`
- Agent availability checks
- OpenAI connection verification

---

## Summary

This system uses a sophisticated multi-agent architecture with:
- **Data Flow**: CSV ingestion → Agent pipeline → Context storage → API retrieval
- **Decision Making**: Formula-based health prediction + AI enhancement + Pattern learning
- **Process Orchestration**: Sequential agent pipeline with context passing
- **Learning System**: Pattern recognition, fleet insights, outcome-based improvement
- **Fallback Mechanisms**: Rule-based logic when AI unavailable
- **Real-time Features**: SSE streaming for form field generation

The architecture is designed for reliability, scalability, and continuous improvement through learning from outcomes.

