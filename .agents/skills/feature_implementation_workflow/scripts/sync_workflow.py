#!/usr/bin/env python3
import os
import sys
import subprocess
import argparse

# Ensure we can import fetch_user_answers from current directory
sys.path.append(os.path.dirname(__file__))
try:
    from fetch_user_answers import (
        fetch_active_features,
        fetch_answers_for_feature,
        update_feature_status,
        complete_feature,
        mark_answer_processed,
        get_project_id,
        get_database_id,
        load_env
    )
except ImportError as e:
    print(f"Error importing fetch_user_answers: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Sync user choices and manage implementation workflow.')
    parser.add_argument('--action', choices=['start', 'complete'], default='start',
                        help='Action to perform: "start" (find active feature with max votes and start implementation) or "complete" (mark feature status as implemented).')
    parser.add_argument('--question_id', help='Question/Feature ID (alias for --feature_id).')
    parser.add_argument('--feature_id', help='Feature ID to mark as implemented (required for "complete" action).')
    parser.add_argument('--feature_text', help='Feature text/name (optional for logging).')
    args = parser.parse_args()

    # Normalize ID input
    target_id = args.feature_id or args.question_id

    project_id = get_project_id()
    database_id = get_database_id()
    if not project_id:
        print("[SYNC] Error: VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        sys.exit(1)

    if args.action == 'start':
        print(f"[SYNC] Connecting to Firestore Project: {project_id} (Database: {database_id})...")
        print("[SYNC] Fetching active features...")
        features = fetch_active_features(project_id, database_id)
        
        # Filter for features currently in voting state
        voting_features = [f for f in features if f['status'] == 'voting']
        if not voting_features:
            print("[SYNC] No active features in 'voting' status found in Firestore.")
            return

        print(f"[SYNC] Found {len(voting_features)} feature(s) currently open for voting.")
        
        # Tally votes for each voting feature
        feature_votes = {}
        all_votes_to_process = []
        for f in voting_features:
            votes = fetch_answers_for_feature(project_id, f['id'], database_id)
            # Filter unprocessed votes
            unprocessed = [v for v in votes if not v['processed']]
            feature_votes[f['id']] = {
                'feature': f,
                'count': len(unprocessed),
                'votes': unprocessed
            }
            all_votes_to_process.extend(unprocessed)
            print(f"  - '{f['name']}' (ID: {f['id']}): {len(unprocessed)} vote(s)")

        if not all_votes_to_process:
            print("[SYNC] No new unprocessed answers/votes found for any active features.")
            return

        # Find option with maximum votes
        winning_feature_id = None
        max_votes = -1
        for f_id, data in feature_votes.items():
            if data['count'] > max_votes:
                max_votes = data['count']
                winning_feature_id = f_id

        if not winning_feature_id:
            print("[SYNC] Could not determine a winning feature.")
            return

        winner = feature_votes[winning_feature_id]['feature']
        print(f"\n[SYNC] Winner: '{winner['name']}' (ID: {winner['id']}) with {max_votes} vote(s)")

        # 1. Launch Jira Issue Helper to create the corresponding task
        print(f"[SYNC] Creating Jira task for feature: '{winner['name']}'...")
        helper_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../jira_items_manager/scripts/jira_helper.py'))
        
        desc = (
            f"Implement the user-selected feature: '{winner['name']}'\n\n"
            f"Requirements:\n"
            f"- Decompose the feature implementation into logical steps.\n"
            f"- Ensure the code changes conform to the Tasks Design System guidelines.\n"
            f"- Run end-to-end-testing verification once complete.\n"
            f"- Deploy updates to Firebase hosting."
        )
        
        env = load_env()
        jira_project = env.get('JIRA_PROJECT_KEY', 'AGENT')
        try:
            subprocess.run([
                sys.executable,
                helper_path,
                '--project', jira_project,
                '--summary', f"Implement feature: {winner['name']}",
                '--desc', desc,
                '--type', 'Task',
                '--priority', 'Medium'
            ], check=True)
            print("[SYNC] Jira task successfully created.")
        except Exception as e:
            print(f"[SYNC ERROR] Failed to run Jira helper script: {e}")

        # 2. Update winning feature status to 'implementing'
        print(f"[SYNC] Updating status of '{winner['id']}' to 'implementing' in Firestore...")
        update_feature_status(project_id, winner['id'], 'implementing', database_id=database_id)

        # 3. Mark all unprocessed votes for active features as processed
        print("[SYNC] Marking answers as processed in Firestore...")
        for vote in all_votes_to_process:
            mark_answer_processed(project_id, vote['path'], vote)
        print("[SYNC] All votes successfully processed.")

    elif args.action == 'complete':
        if not target_id:
            print("[SYNC ERROR] Feature ID (--feature_id or --question_id) is required when action is 'complete'.")
            sys.exit(1)

        print(f"[SYNC] Marking feature '{target_id}' as implemented...")
        res = complete_feature(project_id, target_id, database_id=database_id)
        if res:
            print(f"[SYNC] Feature '{target_id}' successfully marked as implemented (status: 'implemented').")
        else:
            print(f"[SYNC ERROR] Failed to update status for feature '{target_id}'.")
            sys.exit(1)

if __name__ == '__main__':
    main()
