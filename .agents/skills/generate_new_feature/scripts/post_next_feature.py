#!/usr/bin/env python3
import sys
import os
import argparse

# Ensure we can import from feature_implementation_workflow/scripts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../feature_implementation_workflow/scripts')))
try:
    from fetch_user_answers import post_next_question, get_project_id, get_database_id
except ImportError as e:
    print(f"Error importing firestore utilities: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Post next feature poll question to Firestore.')
    parser.add_argument('--id', required=True, help='Question ID (e.g. feature_selection_v3)')
    parser.add_argument('--question', required=True, help='The question text')
    parser.add_argument('--options', required=True, nargs='+', help='The list of option strings')
    
    args = parser.parse_args()
    
    project_id = get_project_id()
    database_id = get_database_id()
    
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        sys.exit(1)
        
    print(f"[POLL] Posting question '{args.id}' to Firestore...")
    res = post_next_question(project_id, args.id, args.question, args.options, database_id)
    if res:
        print("[POLL] Question successfully posted!")
    else:
        print("[POLL] Failed to post question.")
        sys.exit(1)

if __name__ == '__main__':
    main()
