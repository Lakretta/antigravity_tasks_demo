#!/usr/bin/env python3
import os
import re
import json
import urllib.request
import time

def load_env():
    env_vars = {}
    possible_paths = [
        os.path.join(os.path.dirname(__file__), '.env'),
        os.path.join(os.path.dirname(__file__), '../../../../.env'),
        os.path.join(os.getcwd(), '.env')
    ]
    env_path = None
    for path in possible_paths:
        if os.path.exists(path):
            env_path = path
            break
            
    if env_path and os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    match = re.match(r'^([^=]+)=(.*)$', line)
                    if match:
                        key = match.group(1).strip()
                        val = match.group(2).strip()
                        if val.startswith(('"', "'")) and val.endswith(('"', "'")):
                            val = val[1:-1]
                        env_vars[key] = val
    return env_vars

def get_project_id():
    env = load_env()
    return env.get('VITE_FIREBASE_PROJECT_ID')

def get_database_id():
    env = load_env()
    return env.get('VITE_FIREBASE_DATABASE_ID', '(default)')

def make_firestore_request(url, data=None, method='GET'):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.data = json_data
        
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error making request to {url}: {e}")
        return None

def fetch_unprocessed_answers(project_id, database_id='(default)'):
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        return []
        
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/answers"
    result = make_firestore_request(url)
    
    if not result or 'documents' not in result:
        return []
        
    answers = []
    for doc in result['documents']:
        doc_fields = doc.get('fields', {})
        name = doc.get('name', '')
        doc_id = name.split('/')[-1]
        
        processed = doc_fields.get('processed', {}).get('booleanValue', False)
        if not processed:
            answers.append({
                'id': doc_id,
                'path': name,
                'featureId': doc_fields.get('featureId', {}).get('stringValue', ''),
                'selectedOptionText': doc_fields.get('selectedOptionText', {}).get('stringValue', ''),
                'submittedAt': int(doc_fields.get('submittedAt', {}).get('integerValue', 0)),
                'processed': processed
            })
            
    answers.sort(key=lambda x: x['submittedAt'])
    return answers

def mark_answer_processed(project_id, doc_path, answer_data):
    path = doc_path if doc_path.startswith('/') else f"/{doc_path}"
    url = f"https://firestore.googleapis.com/v1{path}?updateMask.fieldPaths=processed"
    
    fields = {}
    for k, v in answer_data.items():
        if k in ['id', 'path']:
            continue
        if isinstance(v, bool):
            fields[k] = {'booleanValue': v}
        elif isinstance(v, int):
            fields[k] = {'integerValue': str(v)}
        else:
            fields[k] = {'stringValue': str(v)}
            
    fields['processed'] = {'booleanValue': True}
    
    doc_payload = {
        'fields': fields
    }
    
    return make_firestore_request(url, data=doc_payload, method='PATCH')

def post_feature(project_id, feature_id, feature_name, status='voting', database_id='(default)'):
    if not project_id:
        return None
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/feature_selection/{feature_id}"
    
    doc_payload = {
        'fields': {
            'id': {'stringValue': feature_id},
            'name': {'stringValue': feature_name},
            'status': {'stringValue': status},
            'createdAt': {'integerValue': str(int(time.time() * 1000))}
        }
    }
    
    return make_firestore_request(url, data=doc_payload, method='PATCH')

def fetch_active_features(project_id, database_id='(default)'):
    if not project_id:
        return []
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/feature_selection"
    result = make_firestore_request(url)
    if not result or 'documents' not in result:
        return []
    
    features = []
    for doc in result['documents']:
        fields = doc.get('fields', {})
        status = fields.get('status', {}).get('stringValue', '')
        if status in ['voting', 'implementing']:
            features.append({
                'id': doc.get('name', '').split('/')[-1],
                'path': doc.get('name', ''),
                'name': fields.get('name', {}).get('stringValue', ''),
                'status': status,
                'createdAt': int(fields.get('createdAt', {}).get('integerValue', 0))
            })
    features.sort(key=lambda x: x['createdAt'])
    return features

def fetch_answers_for_feature(project_id, feature_id, database_id='(default)'):
    if not project_id:
        return []
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/answers"
    result = make_firestore_request(url)
    if not result or 'documents' not in result:
        return []
    
    answers = []
    for doc in result['documents']:
        fields = doc.get('fields', {})
        f_id = fields.get('featureId', {}).get('stringValue', '')
        if f_id == feature_id:
            answers.append({
                'id': doc.get('name', '').split('/')[-1],
                'path': doc.get('name', ''),
                'featureId': f_id,
                'selectedOptionText': fields.get('selectedOptionText', {}).get('stringValue', ''),
                'submittedAt': int(fields.get('submittedAt', {}).get('integerValue', 0)),
                'processed': fields.get('processed', {}).get('booleanValue', False)
            })
    answers.sort(key=lambda x: x['submittedAt'])
    return answers

def update_feature_status(project_id, feature_id, status, database_id='(default)'):
    if not project_id:
        return None
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/feature_selection/{feature_id}?updateMask.fieldPaths=status"
    doc_payload = {
        'fields': {
            'status': {'stringValue': status}
        }
    }
    return make_firestore_request(url, data=doc_payload, method='PATCH')

def complete_feature(project_id, feature_id, database_id='(default)'):
    return update_feature_status(project_id, feature_id, status='implemented', database_id=database_id)
