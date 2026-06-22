#!/usr/bin/env python3
import os
import sys

# Ensure we can import from current directory
sys.path.append(os.path.dirname(__file__))

try:
    from firestore_client import (
        load_env,
        get_project_id,
        get_database_id,
        make_firestore_request,
        fetch_unprocessed_answers,
        mark_answer_processed,
        post_feature,
        fetch_active_features,
        fetch_answers_for_feature,
        update_feature_status,
        complete_feature
    )
except ImportError as e:
    print(f"Error importing firestore_client: {e}")
    sys.exit(1)

def main():
    project_id = get_project_id()
    database_id = get_database_id()
    if not project_id:
        print("\n=== OFFLINE DEMO MODE ===")
        print("VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        print("=========================\n")
        return
        
    print(f"Connecting to Firestore Project: {project_id} (Database: {database_id})...")
    
    active_feats = fetch_active_features(project_id, database_id)
    if active_feats:
        print("\n=== ACTIVE FEATURES ===")
        for f in active_feats:
            print(f"Feature: {f['name']} (ID: {f['id']})")
            print(f"  Status: {f['status']}")
            votes = fetch_answers_for_feature(project_id, f['id'], database_id)
            print(f"  Total Votes: {len(votes)}")
        print("=======================\n")
    else:
        print("\nNo active features found in Firestore.\n")

if __name__ == '__main__':
    main()
