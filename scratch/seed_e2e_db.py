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
        os.path.join(os.path.dirname(__file__), '../.env'),
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

def make_firestore_request(url, data=None, method='GET'):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.data = json_data
        
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error making request to {url}: {e}")
        if hasattr(e, "read"):
            try:
                print(f"Details: {e.read().decode('utf-8')}")
            except Exception:
                pass
        return None

def main():
    env = load_env()
    project_id = env.get('VITE_FIREBASE_PROJECT_ID')
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        return
        
    database_id = 'tasks-e2e'
    print(f"Seeding Firestore database '{database_id}' for project '{project_id}'...")
    
    # 1. Seed default list
    list_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/lists/default"
    list_payload = {
        "fields": {
            "id": {"stringValue": "default"},
            "name": {"stringValue": "My Tasks"},
            "createdAt": {"integerValue": str(int(time.time() * 1000))}
        }
    }
    print("Seeding default list...")
    make_firestore_request(list_url, data=list_payload, method='PATCH')
    
    # 2. Seed feature options
    features = [
        {"id": "category_tags", "name": "Category tags"},
        {"id": "recurring_tasks", "name": "Recurring tasks"},
        {"id": "task_search", "name": "Task search"}
    ]
    
    for i, feat in enumerate(features):
        feat_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/feature_selection/{feat['id']}"
        feat_payload = {
            "fields": {
                "id": {"stringValue": feat['id']},
                "name": {"stringValue": feat['name']},
                "status": {"stringValue": "voting"},
                "createdAt": {"integerValue": str(int(time.time() * 1000) + i)}
            }
        }
        print(f"Seeding feature: {feat['name']}...")
        make_firestore_request(feat_url, data=feat_payload, method='PATCH')
        
    print("Database seeding completed.")

if __name__ == "__main__":
    main()
