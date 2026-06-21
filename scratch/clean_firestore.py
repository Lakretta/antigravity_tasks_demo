import os
import sys
import json
import urllib.request

# Ensure we can load env
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from fetch_user_answers import load_env, get_project_id, get_database_id, make_firestore_request

def clean_collection(project_id, database_id, collection_id):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/{collection_id}"
    result = make_firestore_request(url)
    
    if not result or 'documents' not in result:
        print(f"Collection '{collection_id}': No documents found or collection is empty.")
        return
        
    docs = result['documents']
    print(f"Collection '{collection_id}': Found {len(docs)} document(s) to delete.")
    
    for doc in docs:
        doc_path = doc['name']
        delete_url = f"https://firestore.googleapis.com/v1/{doc_path}"
        
        # Firestore REST delete is a DELETE request
        req = urllib.request.Request(delete_url, method='DELETE')
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                print(f"  Deleted: {doc_path.split('/')[-1]}")
        except Exception as e:
            print(f"  Error deleting {doc_path.split('/')[-1]}: {e}")

def main():
    project_id = get_project_id()
    database_id = get_database_id()
    
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        return
        
    print(f"=== CLEANING FIRESTORE ===")
    print(f"Project:  {project_id}")
    print(f"Database: {database_id}")
    print("==========================")
    
    collections = ['lists', 'tasks', 'questions', 'answers']
    for col in collections:
        clean_collection(project_id, database_id, col)
        
    print("Firestore cleaning completed.")

if __name__ == '__main__':
    main()
