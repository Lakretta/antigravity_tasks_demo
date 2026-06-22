#!/usr/bin/env python3
import sys
import os
import argparse

# Ensure we can import from feature_implementation_workflow/scripts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../feature_implementation_workflow/scripts')))
try:
    from fetch_user_answers import post_feature, get_project_id, get_database_id, make_firestore_request
except ImportError as e:
    print(f"Error importing firestore utilities: {e}")
    sys.exit(1)

# Ensure we can import from current directory
sys.path.append(os.path.dirname(__file__))
try:
    from feature_pool import get_next_available_feature
except ImportError as e:
    print(f"Error importing feature_pool: {e}")
    sys.exit(1)

def get_all_features(project_id, database_id='(default)'):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/{database_id}/documents/feature_selection"
    result = make_firestore_request(url)
    if not result or 'documents' not in result:
        return []
        
    features = []
    for doc in result['documents']:
        fields = doc.get('fields', {})
        features.append({
            'id': doc.get('name', '').split('/')[-1],
            'name': fields.get('name', {}).get('stringValue', ''),
            'status': fields.get('status', {}).get('stringValue', 'voting')
        })
    return features

def main():
    parser = argparse.ArgumentParser(description='Replenish feature poll or post a specific feature to Firestore.')
    parser.add_argument('--id', help='Specific Feature ID (e.g. task_search)')
    parser.add_argument('--name', help='Specific Feature Name (e.g. Task search)')
    # Support backward compatibility/aliases
    parser.add_argument('--question', help='Obsolete parameter.')
    parser.add_argument('--options', nargs='+', help='Obsolete parameter.')
    
    args = parser.parse_args()
    
    project_id = get_project_id()
    database_id = get_database_id()
    
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        sys.exit(1)
        
    if args.id or args.name:
        feature_id = args.id or args.name.lower().replace(' ', '_').replace('/', '_')
        feature_name = args.name or args.id.replace('_', ' ').title()
        print(f"[POLL] Posting specific feature '{feature_name}' (ID: {feature_id}) to Firestore...")
        res = post_feature(project_id, feature_id, feature_name, 'voting', database_id)
        if res:
            print("[POLL] Feature successfully posted!")
        else:
            print("[POLL] Failed to post feature.")
            sys.exit(1)
    else:
        # Automated replenishment mode
        print("[POLL] Running in automated replenishment mode...")
        features = get_all_features(project_id, database_id)
        
        active_features = [f for f in features if f['status'] in ['voting', 'implementing']]
        implemented_features = [f for f in features if f['status'] == 'implemented']
        
        active_count = len(active_features)
        print(f"[POLL] Current active features in store: {active_count}")
        for f in active_features:
            print(f"  - '{f['name']}' ({f['status']})")
            
        if active_count >= 3:
            print("[POLL] There are already 3 or more active features in the store. No replenishment needed.")
            return
            
        active_names = [f['name'] for f in active_features]
        implemented_names = [f['name'] for f in implemented_features]
        
        while active_count < 3:
            next_feat_name = get_next_available_feature(active_names, implemented_names)
            next_feat_id = next_feat_name.lower().replace(' ', '_').replace('/', '_')
            
            print(f"[POLL] Replenishing active pool with: '{next_feat_name}' (ID: {next_feat_id})")
            res = post_feature(project_id, next_feat_id, next_feat_name, 'voting', database_id)
            if res:
                print(f"[POLL] Successfully added '{next_feat_name}'")
                active_names.append(next_feat_name)
                active_count += 1
            else:
                print(f"[POLL] Failed to add feature '{next_feat_name}'. Stopping.")
                sys.exit(1)
                
        print("[POLL] Automated replenishment completed. Store now has 3 active features.")

if __name__ == '__main__':
    main()
