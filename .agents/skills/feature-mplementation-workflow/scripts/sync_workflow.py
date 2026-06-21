#!/usr/bin/env python3
import os
import sys
import subprocess

# Ensure we can import fetch_user_answers from current directory
sys.path.append(os.path.dirname(__file__))
try:
    from fetch_user_answers import fetch_unprocessed_answers, mark_answer_processed, post_next_question, get_project_id
except ImportError as e:
    print(f"Error importing fetch_user_answers: {e}")
    sys.exit(1)

def main():
    project_id = get_project_id()
    if not project_id:
        print("[SYNC] Error: VITE_FIREBASE_PROJECT_ID is not configured in .env.")
        sys.exit(1)

    print(f"[SYNC] Connecting to Firestore Project: {project_id}...")
    answers = fetch_unprocessed_answers(project_id)

    if not answers:
        print("[SYNC] No new user answers found.")
        return

    print(f"[SYNC] Found {len(answers)} unprocessed user choice(s).")
    
    for ans in answers:
        feature = ans['selectedOptionText']
        question_id = ans['questionId']
        print(f"\n[SYNC] Processing choice: '{feature}' (Question ID: {question_id})")

        # 1. Mark as processed immediately
        print("[SYNC] Marking answer as processed in Firestore...")
        mark_answer_processed(project_id, ans['path'], ans)

        # 2. Launch Jira Issue Helper to create the corresponding task
        print(f"[SYNC] Creating Jira task for feature: '{feature}'...")
        helper_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../jira-issue-creator/scripts/jira_helper.py'))
        
        desc = (
            f"Implement the user-selected feature: '{feature}'\n\n"
            f"Requirements:\n"
            f"- Decompose the feature implementation into logical steps.\n"
            f"- Ensure the code changes conform to the Google Tasks Design System guidelines.\n"
            f"- Run browser-testing verification once complete.\n"
            f"- Deploy updates to Firebase hosting."
        )
        
        try:
            subprocess.run([
                sys.executable,
                helper_path,
                '--project', 'KAN',
                '--summary', f"Implement feature: {feature}",
                '--desc', desc,
                '--type', 'Task',
                '--priority', 'Medium'
            ], check=True)
            print("[SYNC] Jira task successfully created.")
        except Exception as e:
            print(f"[SYNC ERROR] Failed to run Jira helper script: {e}")

        # 3. Post next iteration questions to Firestore
        # Determine the next question ID based on the current one
        if question_id == 'feature_selection_v2':
            next_q_id = 'feature_selection_v3'
            next_q_text = "Which capability would you like Antigravity to build next?"
            next_options = [
                "Advanced tags and categorization system",
                "Calendar view integration",
                "Collaborative shared lists with email invites"
            ]
        elif question_id == 'feature_selection_v3':
            next_q_id = 'feature_selection_v4'
            next_q_text = "Which capability would you like Antigravity to build next?"
            next_options = [
                "Calendar view integration",
                "Collaborative shared lists with email invites",
                "Recurring tasks (Daily, Weekly, Monthly)"
            ]
        elif question_id == 'feature_selection_v5':
            next_q_id = 'feature_selection_v6'
            next_q_text = "What productivity enhancement would you like Antigravity to implement next?"
            next_options = [
                "Recurring tasks (Daily, Weekly, Monthly)",
                "Collaborative shared lists with real-time sync",
                "Export tasks to Google Sheets / CSV format"
            ]
        else:
            # Fallback incremental suffix generator
            try:
                parts = question_id.split('_v')
                if len(parts) == 2:
                    v_num = int(parts[1])
                    next_q_id = f"{parts[0]}_v{v_num + 1}"
                else:
                    next_q_id = f"{question_id}_v2"
            except Exception:
                next_q_id = f"{question_id}_next"
            
            next_q_text = "Which capability would you like Antigravity to build next?"
            next_options = [
                "Advanced tags and categorization system",
                "Calendar view integration",
                "Subtasks dependency and blocker warnings"
            ]

        print(f"[SYNC] Posting next question '{next_q_id}' to Firestore...")
        try:
            post_next_question(project_id, next_q_id, next_q_text, next_options)
            print("[SYNC] Next question posted successfully.")
        except Exception as e:
            print(f"[SYNC ERROR] Failed to post next question: {e}")

if __name__ == '__main__':
    main()
