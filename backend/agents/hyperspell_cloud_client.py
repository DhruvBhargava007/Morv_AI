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
        if not self.api_key:
            raise ValueError("HYPERSPELL_API_KEY is required")
    
    def _request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> dict:
        """Make API request to Hyperspell cloud"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, params=params or data)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Hyperspell Cloud API Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Status: {e.response.status_code}")
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
    
    # Pattern Learning
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
        params = {
            'component_id': component_id,
            'min_confidence': min_confidence
        }
        if namespace:
            params['namespace'] = namespace
        if pattern_type:
            params['pattern_type'] = pattern_type
        
        result = self._request('GET', '/v1/patterns', params=params)
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
        return self._request('GET', '/v1/memories', params={
            'query': query,
            'limit': limit
        })
    
    # Sandbox/Query
    def query(self, query: str, context: Dict = None):
        """Run a query in Hyperspell sandbox"""
        return self._request('POST', '/v1/query', {
            'query': query,
            'context': context or {}
        })
    
    # Fleet Insights
    def create_fleet_insight(self, insight_type: str, component_id: str,
                           insight_data: Dict, affected_tanks: List[str], confidence: float):
        """Create fleet-wide insight"""
        return self._request('POST', '/v1/fleet-insights', {
            'insight_type': insight_type,
            'component_id': component_id,
            'insight_data': insight_data,
            'affected_tanks': affected_tanks,
            'confidence': confidence
        })
    
    def get_fleet_insights(self, component_id: str = None, insight_type: str = None):
        """Get fleet-wide insights"""
        params = {}
        if component_id:
            params['component_id'] = component_id
        if insight_type:
            params['insight_type'] = insight_type
        
        result = self._request('GET', '/v1/fleet-insights', params=params)
        return result.get('insights', []) if result else []

