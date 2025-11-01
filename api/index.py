"""
Vercel Serverless Function - Flask API Wrapper
Handles all /api/* routes by wrapping the Flask application
"""
import sys
import os
import json

# Add backend to Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

# Change working directory to backend for relative paths
original_cwd = os.getcwd()
os.chdir(backend_path)

try:
    # Import Flask app from backend
    from api import app
    
    # Vercel Python serverless function handler
    # This function is called by Vercel for each request
    def handler(request):
        """
        Vercel serverless function handler
        Routes /api/* requests to Flask app
        
        Request format from Vercel:
        {
            'path': '/api/predictions',
            'method': 'GET',
            'headers': {...},
            'body': '...',
            'query': {...}
        }
        """
        from flask import Response
        from werkzeug.test import Client
        
        # Create Flask test client
        client = Client(app, Response)
        
        # Extract request info
        path = request.get('path', '/')
        method = request.get('method', 'GET').upper()
        headers = dict(request.get('headers', {}))
        body = request.get('body', '')
        query_params = request.get('query', {})
        
        # Build query string
        query_string = '&'.join([f"{k}={v}" for k, v in query_params.items()])
        
        # Prepare request data
        data = body.encode('utf-8') if body else b''
        
        # Make request through Flask app
        try:
            response = client.open(
                path=path,
                method=method,
                data=data,
                headers=headers,
                query_string=query_string,
                content_type=headers.get('content-type', 'application/json')
            )
            
            # Get response data
            response_data = response.get_data(as_text=True)
            response_headers = dict(response.headers)
            
            # Return Vercel-compatible response
            return {
                'statusCode': response.status_code,
                'headers': response_headers,
                'body': response_data
            }
        except Exception as e:
            # Handle errors
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
        finally:
            # Restore original working directory
            os.chdir(original_cwd)
            
except Exception as e:
    # If import fails, return error handler
    def handler(request):
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Failed to import Flask app: {str(e)}'})
        }
