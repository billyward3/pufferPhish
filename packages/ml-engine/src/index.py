"""
ML Lambda Handler - Placeholder
This is a placeholder for the ML team to implement the actual phishing detection model.
"""

import json
import time


def handler(event, context):
    """
    ML Lambda handler for phishing detection inference

    Expected input from backend Lambda:
    {
        "url": "https://example.com",
        "domain": "example.com",
        "metadata": {...}
    }

    Expected output to backend Lambda:
    {
        "riskScore": 0.0-1.0,
        "threats": {
            "phishing": 0.0-1.0,
            "malware": 0.0-1.0,
            "social": 0.0-1.0
        },
        "confidence": 0.0-1.0,
        "source": "ml" | "rule_based" | "fallback",
        "modelVersion": "v1.0.0",
        "processingTime": milliseconds
    }
    """

    print(f"ML Lambda invoked with event: {json.dumps(event)}")

    start_time = time.time()

    try:
        # Parse input
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        url = body.get('url')
        domain = body.get('domain')

        if not url or not domain:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'url and domain are required'})
            }

        # TODO: ML team implements actual model inference here
        # 1. Load model from S3
        # 2. Extract features from URL/domain
        # 3. Run inference
        # 4. Return results

        # Placeholder response - returns moderate risk for all URLs
        processing_time = int((time.time() - start_time) * 1000)

        response = {
            'riskScore': 0.5,  # Moderate risk placeholder
            'threats': {
                'phishing': 0.5,
                'malware': 0.0,
                'social': 0.0
            },
            'confidence': 0.0,  # Low confidence (it's a placeholder)
            'source': 'fallback',
            'modelVersion': 'placeholder-v0.1.0',
            'processingTime': processing_time,
            'message': 'Placeholder ML response - ML team needs to implement actual model'
        }

        print(f"ML Lambda response: {json.dumps(response)}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response)
        }

    except Exception as e:
        print(f"Error in ML Lambda: {str(e)}")
        processing_time = int((time.time() - start_time) * 1000)

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'riskScore': 0.5,
                'threats': {'phishing': 0.5, 'malware': 0.0, 'social': 0.0},
                'confidence': 0.0,
                'source': 'fallback',
                'modelVersion': 'error',
                'processingTime': processing_time,
                'error': str(e)
            })
        }
