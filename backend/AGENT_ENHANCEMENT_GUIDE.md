# AI Agent Enhancement Guide

## Overview

The enhanced agent system makes the pipeline **more AI-dependent** and **more robust** by:

1. **AI-Driven Health Prediction**: Uses LLM to analyze telemetry patterns instead of just formulas
2. **AI-Driven Scheduling**: Makes intelligent priority and scheduling decisions
3. **Pattern Recognition**: Detects anomalies and patterns that formulas might miss
4. **Context-Aware Decisions**: Considers mission readiness, resource constraints, and historical data

## Key Improvements

### 1. Enhanced Health Agent (`enhanced_health_agent.py`)

**Before**: Used formulas (Weibull, z-scores) only
**After**: 
- AI analyzes telemetry patterns
- Detects anomalies and trends
- Combines AI predictions with formula results (weighted)
- Provides detailed explanations with context

**Features**:
- Pattern recognition in sensor data
- Anomaly detection
- Intelligent health scoring (70% AI, 30% formula for critical components)
- Comprehensive explanations

### 2. Enhanced Scheduler Agent (`enhanced_scheduler_agent.py`)

**Before**: Rule-based priority (if RUL < 72h → critical)
**After**:
- AI assesses priority considering multiple factors
- Context-aware scheduling (mission status, resources)
- Schedule optimization (groups related maintenance)
- Risk assessment if maintenance is delayed

**Features**:
- Multi-factor priority assessment
- Schedule optimization
- Resource-aware recommendations
- Risk mitigation strategies

### 3. AI Health Predictor (`ai_health_predictor.py`)

**Purpose**: Core AI engine for health prediction

**Capabilities**:
- Telemetry pattern analysis
- Anomaly detection
- Trend analysis
- Predictive failure risk assessment

## Usage

### Using Enhanced Agents

```python
from agents.enhanced_supervisor import EnhancedSupervisor

# Create enhanced supervisor
supervisor = EnhancedSupervisor('TNK-B-023', use_enhanced_agents=True)

# Run pipeline
result = supervisor.run_maintenance_pipeline(data_directory='path/to/data')
```

### Using Individual Enhanced Agents

```python
from agents.enhanced_health_agent import EnhancedHealthAgent
from agents.enhanced_scheduler_agent import EnhancedSchedulerAgent
from openai import OpenAI
from agents.context_store import SimpleContextStore

# Initialize
openai_client = OpenAI(api_key=OPENAI_API_KEY)
hyperspell = SimpleContextStore()

# Health Agent
health_agent = EnhancedHealthAgent('TNK-B-023', openai_client, hyperspell)
health_result = health_agent.run()

# Scheduler Agent
scheduler_agent = EnhancedSchedulerAgent('TNK-B-023', openai_client, hyperspell)
schedule_result = scheduler_agent.run(health_result)
```

## API Integration

Update your API to use enhanced agents:

```python
from agents.enhanced_supervisor import EnhancedSupervisor

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    tank_id = request.args.get('tank_id')
    use_enhanced = request.args.get('enhanced', 'true').lower() == 'true'
    
    if use_enhanced:
        supervisor = EnhancedSupervisor(tank_id, use_enhanced_agents=True)
        result = supervisor.run_maintenance_pipeline()
        return jsonify(result)
    else:
        # Use original supervisor
        ...
```

## Fallback Behavior

The enhanced agents gracefully fallback to rule-based methods if:
- OpenAI API key is not set
- API calls fail
- No telemetry data available

This ensures the system still works without AI, but with reduced intelligence.

## Configuration

Set in `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
HYPERSPELL_API_KEY=your-hyperspell-key
```

## Benefits

1. **More Accurate**: AI can detect complex patterns formulas miss
2. **More Contextual**: Considers mission status, resources, history
3. **More Robust**: Handles edge cases and anomalies better
4. **More Explainable**: Detailed reasoning for each decision
5. **More Adaptive**: Learns from patterns in telemetry data

## Performance Considerations

- AI calls add latency (~1-2 seconds per component)
- Consider caching results for frequently accessed tanks
- Use parallel processing for multiple components
- Fallback to formulas ensures reliability

## Future Enhancements

1. **Fine-tuned Models**: Train models on historical maintenance data
2. **Multi-Agent Collaboration**: Agents discuss and debate decisions
3. **Reinforcement Learning**: Learn optimal scheduling from outcomes
4. **Predictive Maintenance**: Predict failures before they occur
5. **Resource Optimization**: AI-driven resource allocation

