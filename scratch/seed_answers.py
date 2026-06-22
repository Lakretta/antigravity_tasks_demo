import os
import sys
import json
import urllib.request
import time

# Ensure we can load env
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.agents/skills/feature_implementation_workflow/scripts/')))
from fetch_user_answers import load_env, get_project_id, get_database_id, make_firestore_request

def seed_answers():
    project_id = get_project_id()
    database_id = get_database_id()
    
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        return
        
    print(f"Seeding answers to Project: {project_id} (Database: {database_id})...")
    
    initial_choices = [
        {"index": 0, "text": "Add reminders and due time alerts"},
        {"index": 1, "text": "Enable Drag & Drop task reordering"},
        {"index": 2, "text": "Collapsible sidebar lists"}
    ]
    
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/answers"
    
    for i, choice in enumerate(initial_choices):
        payload = {
            "fields": {
                "questionId": {"stringValue": "feature_selection"},
                "selectedOptionIndex": {"integerValue": str(choice["index"])},
                "selectedOptionText": {"stringValue": choice["text"]},
                "submittedAt": {"integerValue": str(int(time.time() * 1000) + i)},
                "processed": {"booleanValue": False}
            }
        }
        res = make_firestore_request(url, data=payload, method='POST')
        if res:
            print(f"Successfully seeded: {choice['text']}")
        else:
            print(f"Failed to seed: {choice['text']}")

if __name__ == '__main__':
    seed_answers()
