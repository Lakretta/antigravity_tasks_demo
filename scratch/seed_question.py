import os
import sys

# Ensure we can load env
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from fetch_user_answers import post_next_question, get_project_id, get_database_id

def main():
    project_id = get_project_id()
    database_id = get_database_id()
    
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID is not configured in .env")
        return
        
    question_id = "feature_selection_v4"
    question_text = "Which capability would you like Antigravity to build next?"
    options = [
        "Calendar view integration",
        "Collaborative shared lists with real-time sync",
        "Export tasks to Google Sheets / CSV format",
        "Dark mode theme toggle"
    ]
    
    print(f"Seeding question to Project: {project_id} (Database: {database_id})...")
    res = post_next_question(project_id, question_id, question_text, options, database_id)
    if res:
        print(f"Successfully seeded question '{question_id}' to Firestore!")
    else:
        print("Failed to seed question.")

if __name__ == '__main__':
    main()
