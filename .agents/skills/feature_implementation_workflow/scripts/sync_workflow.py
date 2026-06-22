#!/usr/bin/env python3
import os
import sys
import subprocess
import argparse

# Ensure we can import fetch_user_answers from current directory
sys.path.append(os.path.dirname(__file__))
try:
    from fetch_user_answers import (
        fetch_active_question,
        fetch_answers_for_question,
        update_question_status,
        replenish_and_complete_question,
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
    parser.add_argument('--question_id', help='Question ID to mark as implemented (required for "complete" action).')
    parser.add_argument('--feature_text', help='Feature text to mark as implemented (required for "complete" action).')
    args = parser.parse_args()

    project_id = get_project_id()
    database_id = get_database_id()
    if not project_id:
        print("[SYNC] Error: VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        sys.exit(1)

    if args.action == 'start':
        print(f"[SYNC] Connecting to Firestore Project: {project_id} (Database: {database_id})...")
        print("[SYNC] Fetching active question...")
        question = fetch_active_question(project_id, database_id)
        if not question:
            print("[SYNC] No active question found in Firestore.")
            return

        print(f"[SYNC] Active Question: '{question['question']}' (ID: {question['id']})")
        print("[SYNC] Fetching answers/votes...")
        answers = fetch_answers_for_question(project_id, question['id'], database_id)
        if not answers:
            print("[SYNC] No answers/votes found for this question yet.")
            return

        print(f"[SYNC] Found {len(answers)} total vote(s).")

        # Aggregate votes
        vote_counts = {opt: 0 for opt in question['options']}
        for ans in answers:
            opt_text = ans['selectedOptionText']
            if opt_text in vote_counts:
                vote_counts[opt_text] += 1
            else:
                vote_counts[opt_text] = 1 # custom options

        print("[SYNC] Voting Results:")
        for opt_text, count in vote_counts.items():
            print(f"  - '{opt_text}': {count} vote(s)")

        # Find option with maximum votes
        max_votes = -1
        winning_feature = None
        for opt_text, count in vote_counts.items():
            if count > max_votes:
                max_votes = count
                winning_feature = opt_text

        if not winning_feature:
            print("[SYNC] Could not determine a winning feature.")
            return

        print(f"\n[SYNC] Winner: '{winning_feature}' ({max_votes} vote(s))")

        # 1. Launch Jira Issue Helper to create the corresponding task
        print(f"[SYNC] Creating Jira task for feature: '{winning_feature}'...")
        helper_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../jira_items_manager/scripts/jira_helper.py'))
        
        desc = (
            f"Implement the user-selected feature: '{winning_feature}'\n\n"
            f"Requirements:\n"
            f"- Decompose the feature implementation into logical steps.\n"
            f"- Ensure the code changes conform to the Google Tasks Design System guidelines.\n"
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
                '--summary', f"Implement feature: {winning_feature}",
                '--desc', desc,
                '--type', 'Task',
                '--priority', 'Medium'
            ], check=True)
            print("[SYNC] Jira task successfully created.")
        except Exception as e:
            print(f"[SYNC ERROR] Failed to run Jira helper script: {e}")

        # 2. Update active question status to 'implementing'
        print("[SYNC] Updating question status to 'implementing' in Firestore...")
        update_question_status(project_id, question['id'], active=True, status='implementing', database_id=database_id)

        # 3. Mark all answers as processed
        print("[SYNC] Marking answers as processed in Firestore...")
        for ans in answers:
            if not ans['processed']:
                mark_answer_processed(project_id, ans['path'], ans)
        print("[SYNC] All votes successfully processed.")

    elif args.action == 'complete':
        if not args.question_id:
            print("[SYNC ERROR] Question ID (--question_id) is required when action is 'complete'.")
            sys.exit(1)
        if not args.feature_text:
            print("[SYNC ERROR] Feature text (--feature_text) is required when action is 'complete'.")
            sys.exit(1)

        print(f"[SYNC] Marking feature '{args.feature_text}' as implemented and replenishing active options...")
        res = replenish_and_complete_question(project_id, args.question_id, args.feature_text, database_id=database_id)
        if res:
            print(f"[SYNC] Feature '{args.feature_text}' successfully implemented. Active poll updated and status set to 'voting'.")
        else:
            print(f"[SYNC ERROR] Failed to complete feature implementation and replenish active options.")
            sys.exit(1)

if __name__ == '__main__':
    main()
