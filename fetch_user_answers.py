#!/usr/bin/env python3
import os
import re
import json
import urllib.request
import urllib.parse

def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    match = re.match(r'^([^=]+)=(.*)$', line)
                    if match:
                        key = match.group(1).strip()
                        val = match.group(2).strip()
                        # Strip quotes if present
                        if val.startswith(('"', "'")) and val.endswith(('"', "'")):
                            val = val[1:-1]
                        env_vars[key] = val
    return env_vars

def get_project_id():
    env = load_env()
    return env.get('VITE_FIREBASE_PROJECT_ID')

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

def fetch_unprocessed_answers(project_id):
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        return []
        
    # Query answers collection
    # Note: Using Firestore StructuredQuery REST endpoint or simple list depending on needs
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/answers"
    result = make_firestore_request(url)
    
    if not result or 'documents' not in result:
        return []
        
    answers = []
    for doc in result['documents']:
        doc_fields = doc.get('fields', {})
        name = doc.get('name', '')
        doc_id = name.split('/')[-1]
        
        # Extract fields safely
        processed = doc_fields.get('processed', {}).get('booleanValue', False)
        if not processed:
            answers.append({
                'id': doc_id,
                'path': name,
                'questionId': doc_fields.get('questionId', {}).get('stringValue', ''),
                'selectedOptionIndex': int(doc_fields.get('selectedOptionIndex', {}).get('integerValue', 0)),
                'selectedOptionText': doc_fields.get('selectedOptionText', {}).get('stringValue', ''),
                'submittedAt': int(doc_fields.get('submittedAt', {}).get('integerValue', 0))
            })
            
    # Sort by submittedAt ascending
    answers.sort(key=lambda x: x['submittedAt'])
    return answers

def mark_answer_processed(project_id, doc_path, answer_data):
    # Update processed to true using patch
    path = doc_path if doc_path.startswith('/') else f"/{doc_path}"
    url = f"https://firestore.googleapis.com/v1{path}?updateMask.fieldPaths=processed"
    
    # We must rebuild the fields dictionary in Firestore REST structure
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

def post_next_question(project_id, question_id, question_text, options):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/questions?documentId={question_id}"
    
    # Deactivate other questions first by querying and patching (omitted for brevity, or we clean up)
    
    doc_payload = {
        'fields': {
            'id': {'stringValue': question_id},
            'question': {'stringValue': question_text},
            'options': {
                'arrayValue': {
                    'values': [{'stringValue': opt} for opt in options]
                }
            },
            'active': {'booleanValue': True},
            'createdAt': {'integerValue': str(int(urllib.parse.time.time() * 1000) if hasattr(urllib.parse, 'time') else 1700000000000)}
        }
    }
    
    # Quick fix for time in pure python without importing time
    import time
    doc_payload['fields']['createdAt']['integerValue'] = str(int(time.time() * 1000))
    
    return make_firestore_request(url, data=doc_payload, method='PATCH') # PATCH allows overwrite if exists

def main():
    project_id = get_project_id()
    if not project_id:
        print("\n=== OFFLINE DEMO MODE ===")
        print("VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        print("The browser web app will run in offline LocalStorage mode.")
        print("Create a Firebase project and fill .env to enable synchronization.")
        print("=========================\n")
        return
        
    print(f"Connecting to Firestore Project: {project_id}...")
    answers = fetch_unprocessed_answers(project_id)
    
    if not answers:
        print("No new user answers found.")
        return
        
    print(f"\nFound {len(answers)} unprocessed user choice(s):")
    for i, ans in enumerate(answers, 1):
        print(f"{i}. Question ID: {ans['questionId']}")
        print(f"   Selection: [{ans['selectedOptionIndex']}] {ans['selectedOptionText']}")
        print(f"   Submitted at: {ans['submittedAt']}")
        print("-" * 40)
        
    # Example action: Process the first one
    ans = answers[0]
    confirm = input("Would you like to mark this answer as processed? (y/N): ")
    if confirm.lower() == 'y':
        mark_answer_processed(project_id, ans['path'], ans)
        print("Marked as processed in Firestore.")

if __name__ == '__main__':
    main()
