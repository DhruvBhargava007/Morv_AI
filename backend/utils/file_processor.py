#!/usr/bin/env python3
"""
File Processing Utilities for Health Dashboard
Validates and processes CSV files matching one of 6 categories
"""

import pandas as pd
import io
from typing import Dict, List, Tuple, Optional
import sys
import os

# Import REQUIRED_SCHEMAS from ingestion module
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from ingestion import REQUIRED_SCHEMAS

# Valid CSV categories (must match one of these 6)
VALID_CATEGORIES = list(REQUIRED_SCHEMAS.keys())


def detect_csv_category(csv_content: str) -> Tuple[Optional[str], List[str], Optional[str]]:
    """
    Auto-detect CSV category by checking columns against REQUIRED_SCHEMAS
    
    Args:
        csv_content: CSV file content as string
        
    Returns:
        Tuple of (detected_category, detected_columns, error_message)
        - detected_category: One of the 6 valid categories or None
        - detected_columns: List of column names found in CSV
        - error_message: Error message if no match found
    """
    try:
        # Read CSV into DataFrame
        df = pd.read_csv(io.StringIO(csv_content))
        detected_columns = df.columns.tolist()
        
        # Check each category's required schema
        for category, required_columns in REQUIRED_SCHEMAS.items():
            # Check if all required columns are present (case-sensitive)
            if all(col in detected_columns for col in required_columns):
                # Check if it's an exact match (no extra columns or minimal mismatch)
                # We'll accept if all required columns are present
                return category, detected_columns, None
        
        # No match found
        error_msg = (
            f"CSV does not match any valid category. "
            f"Detected columns: {detected_columns}. "
            f"Accepted categories: {', '.join(VALID_CATEGORIES)}. "
            f"Required columns for each category: {dict(REQUIRED_SCHEMAS)}"
        )
        return None, detected_columns, error_msg
        
    except pd.errors.EmptyDataError:
        return None, [], "CSV file is empty"
    except Exception as e:
        return None, [], f"Error parsing CSV: {str(e)}"


def validate_csv_file(file_content: bytes, filename: str) -> Tuple[bool, Optional[str], Optional[str], List[str]]:
    """
    Validate uploaded CSV file
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        
    Returns:
        Tuple of (is_valid, detected_category, error_message, detected_columns)
    """
    # Check file extension
    if not filename.lower().endswith('.csv'):
        return False, None, "Please upload a CSV file (.csv extension required)", []
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if len(file_content) > max_size:
        return False, None, f"File size exceeds maximum limit of 10MB. Current size: {len(file_content) / 1024 / 1024:.2f}MB", []
    
    # Try to decode as UTF-8
    try:
        csv_content = file_content.decode('utf-8')
    except UnicodeDecodeError:
        return False, None, "CSV file must be UTF-8 encoded", []
    
    # Detect category
    detected_category, detected_columns, error_msg = detect_csv_category(csv_content)
    
    if detected_category:
        return True, detected_category, None, detected_columns
    else:
        return False, None, error_msg, detected_columns


def parse_csv_by_category(csv_content: str, category: str) -> pd.DataFrame:
    """
    Parse CSV content based on detected category
    
    Args:
        csv_content: CSV file content as string
        category: One of the 6 valid categories
        
    Returns:
        Parsed DataFrame
        
    Raises:
        ValueError: If category is invalid or CSV doesn't match expected schema
    """
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Invalid category: {category}. Must be one of: {VALID_CATEGORIES}")
    
    # Parse CSV
    df = pd.read_csv(io.StringIO(csv_content))
    
    # Verify required columns are present
    required_columns = REQUIRED_SCHEMAS[category]
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise ValueError(
            f"CSV is missing required columns for {category}: {missing_columns}. "
            f"Required columns: {required_columns}"
        )
    
    return df


if __name__ == '__main__':
    # Test with sample CSV
    sample_csv = """tankId,componentId,timestamp,feature,value
TNK-A-047,eng-001,2024-01-01 00:00:00,oil_temp,85.5
TNK-A-047,eng-001,2024-01-01 01:00:00,oil_temp,86.2"""
    
    category, columns, error = detect_csv_category(sample_csv)
    print(f"Category: {category}")
    print(f"Columns: {columns}")
    if error:
        print(f"Error: {error}")

