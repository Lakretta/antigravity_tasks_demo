import os
import re
import json
import urllib.request
import time
import sys

def load_env():
    env_vars = {}
    env_path = os.path.join(os.getcwd(), '.env')
    if os.path.exists(env_path):
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

def make_request(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error {method} {url}: {e}")
        return None

def delete_document(doc_path):
    url = f"https://firestore.googleapis.com/v1/{doc_path}"
    req = urllib.request.Request(url, method='DELETE')
    try:
        with urllib.request.urlopen(req) as response:
            return True
    except Exception as e:
        print(f"Error deleting {doc_path}: {e}")
        return False

def create_document(project_id, database_id, collection, doc_id, fields):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/{collection}/{doc_id}"
    doc_payload = {
        'fields': fields
    }
    return make_request(url, method='PATCH', data=doc_payload)

def delete_all_in_collection(project_id, database_id, collection):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/{collection}"
    res = make_request(url)
    if res and 'documents' in res:
        print(f"Found {len(res['documents'])} documents in '{collection}' to delete...")
        for doc in res['documents']:
            name = doc.get('name', '')
            print(f"Deleting doc in {collection}: {name}")
            delete_document(name)
    else:
        print(f"No documents in '{collection}' to delete.")

def main():
    env = load_env()
    project_id = env.get('VITE_FIREBASE_PROJECT_ID')
    database_id = env.get('VITE_FIREBASE_DATABASE_ID', '(default)')
    
    if not project_id:
        print("VITE_FIREBASE_PROJECT_ID not found in .env")
        return
        
    print(f"Cleaning up Firestore database: {database_id} in project: {project_id}")
    
    # 1. Delete all answers
    delete_all_in_collection(project_id, database_id, 'answers')

    # 2. Delete all tasks
    delete_all_in_collection(project_id, database_id, 'tasks')

    # 3. Delete all lists
    delete_all_in_collection(project_id, database_id, 'lists')

    # Recreate the default list
    print("Recreating default 'My Tasks' list...")
    create_document(
        project_id, 
        database_id, 
        'lists', 
        'default', 
        {
            'id': {'stringValue': 'default'},
            'name': {'stringValue': 'My Tasks'},
            'createdAt': {'integerValue': str(int(time.time() * 1000))}
        }
    )

    # 4. Delete old questions collection
    delete_all_in_collection(project_id, database_id, 'questions')

    # 5. Delete feature_selection collection
    delete_all_in_collection(project_id, database_id, 'feature_selection')

    # 6. Re-seed feature_selection with 3 active features using post_next_feature.py
    print("Seeding initial active features...")
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.agents/skills/generate_new_feature/scripts/post_next_feature.py'))
    
    # Run the replenishment script
    try:
        import subprocess
        subprocess.run([sys.executable, script_path], check=True)
        print("Successfully replenished features pool!")
    except Exception as e:
        print(f"Failed to run replenishment script: {e}")

    print("Firestore cleanup completed successfully!")

if __name__ == '__main__':
    main()
