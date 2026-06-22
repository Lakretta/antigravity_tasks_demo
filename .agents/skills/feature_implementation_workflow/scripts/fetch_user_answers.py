#!/usr/bin/env python3
import os
import re
import json
import urllib.request
import urllib.parse

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
                        # Strip quotes if present
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
        
    # Query answers collection
    # Note: Using Firestore StructuredQuery REST endpoint or simple list depending on needs
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/answers"
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

def post_next_question(project_id, question_id, question_text, options, database_id='(default)'):
    if not project_id:
        return None
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/questions/{question_id}"
    
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
            'status': {'stringValue': 'voting'}
        }
    }
    
    import time
    doc_payload['fields']['createdAt'] = {'integerValue': str(int(time.time() * 1000))}
    
    return make_firestore_request(url, data=doc_payload, method='PATCH') # PATCH allows overwrite if exists

def fetch_active_question(project_id, database_id='(default)'):
    if not project_id:
        return None
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/questions"
    result = make_firestore_request(url)
    if not result or 'documents' not in result:
        return None
    
    for doc in result['documents']:
        fields = doc.get('fields', {})
        active = fields.get('active', {}).get('booleanValue', False)
        if active:
            # Parse options
            options_val = fields.get('options', {}).get('arrayValue', {}).get('values', [])
            options = [opt.get('stringValue', '') for opt in options_val]
            return {
                'id': doc.get('name', '').split('/')[-1],
                'path': doc.get('name', ''),
                'question': fields.get('question', {}).get('stringValue', ''),
                'options': options,
                'status': fields.get('status', {}).get('stringValue', 'voting')
            }
    return None

def fetch_answers_for_question(project_id, question_id, database_id='(default)'):
    if not project_id:
        return []
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/answers"
    result = make_firestore_request(url)
    if not result or 'documents' not in result:
        return []
    
    answers = []
    for doc in result['documents']:
        fields = doc.get('fields', {})
        q_id = fields.get('questionId', {}).get('stringValue', '')
        if q_id == question_id:
            answers.append({
                'id': doc.get('name', '').split('/')[-1],
                'path': doc.get('name', ''),
                'questionId': q_id,
                'selectedOptionIndex': int(fields.get('selectedOptionIndex', {}).get('integerValue', 0)),
                'selectedOptionText': fields.get('selectedOptionText', {}).get('stringValue', ''),
                'submittedAt': int(fields.get('submittedAt', {}).get('integerValue', 0)),
                'processed': fields.get('processed', {}).get('booleanValue', False)
            })
    answers.sort(key=lambda x: x['submittedAt'])
    return answers

def update_question_status(project_id, question_id, active, status, database_id='(default)'):
    if not project_id:
        return None
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/questions/{question_id}?updateMask.fieldPaths=active&updateMask.fieldPaths=status"
    doc_payload = {
        'fields': {
            'active': {'booleanValue': active},
            'status': {'stringValue': status}
        }
    }
    return make_firestore_request(url, data=doc_payload, method='PATCH')


def main():
    project_id = get_project_id()
    database_id = get_database_id()
    if not project_id:
        print("\n=== OFFLINE DEMO MODE ===")
        print("VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        print("The browser web app will run in offline LocalStorage mode.")
        print("Create a Firebase project and fill .env to enable synchronization.")
        print("=========================\n")
        return
        
    print(f"Connecting to Firestore Project: {project_id} (Database: {database_id})...")
    
    # 1. Show active question & vote tally
    active_q = fetch_active_question(project_id, database_id)
    if active_q:
        print("\n=== ACTIVE QUESTION ===")
        print(f"Question: {active_q['question']}")
        print(f"ID:       {active_q['id']}")
        print(f"Status:   {active_q['status']}")
        
        votes = fetch_answers_for_question(project_id, active_q['id'], database_id)
        print(f"Total Votes: {len(votes)}")
        vote_counts = {opt: 0 for opt in active_q['options']}
        for ans in votes:
            opt_text = ans['selectedOptionText']
            if opt_text in vote_counts:
                vote_counts[opt_text] += 1
            else:
                vote_counts[opt_text] = 1 # custom options
                
        for opt_text, count in vote_counts.items():
            print(f"  - '{opt_text}': {count} vote(s)")
        print("=======================\n")
    else:
        print("\nNo active question found in Firestore.\n")

    # 2. Show unprocessed user choices
    answers = fetch_unprocessed_answers(project_id, database_id)
    
    if not answers:
        print("No new unprocessed user answers found.")
        return
        
    print(f"Found {len(answers)} unprocessed user choice(s):")
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
