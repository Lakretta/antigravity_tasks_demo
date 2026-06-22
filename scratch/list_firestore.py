import os
import re
import json
import urllib.request

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

def make_request(url, method='GET'):
    req = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error {method} {url}: {e}")
        return None

def main():
    env = load_env()
    project_id = env.get('VITE_FIREBASE_PROJECT_ID')
    database_id = env.get('VITE_FIREBASE_DATABASE_ID', '(default)')
    
    if not project_id:
        print("VITE_FIREBASE_PROJECT_ID not found in .env")
        return
        
    print(f"Project: {project_id}, Database: {database_id}")
    
    for coll in ['lists', 'tasks', 'questions', 'answers']:
        url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/{coll}"
        res = make_request(url)
        if res and 'documents' in res:
            print(f"\nCollection '{coll}' has {len(res['documents'])} documents:")
            for doc in res['documents']:
                name = doc.get('name', '')
                doc_id = name.split('/')[-1]
                fields = doc.get('fields', {})
                print(f"  - ID: {doc_id}")
                if coll == 'lists':
                    print(f"    Name: {fields.get('name', {}).get('stringValue')}")
                elif coll == 'tasks':
                    print(f"    Title: {fields.get('title', {}).get('stringValue')}")
                    print(f"    ListId: {fields.get('listId', {}).get('stringValue')}")
                elif coll == 'questions':
                    print(f"    Question: {fields.get('question', {}).get('stringValue')}")
                    print(f"    Active: {fields.get('active', {}).get('booleanValue')}")
                elif coll == 'answers':
                    print(f"    questionId: {fields.get('questionId', {}).get('stringValue')}")
                    print(f"    option: {fields.get('selectedOptionText', {}).get('stringValue')}")
                    print(f"    processed: {fields.get('processed', {}).get('booleanValue')}")
        else:
            print(f"\nCollection '{coll}': no documents or failed to fetch")

if __name__ == '__main__':
    main()
