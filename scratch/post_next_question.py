import sys
import os

# Include root directory for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from fetch_user_answers import post_next_question, get_project_id, make_firestore_request

def deactivate_question(project_id, question_id):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/questions/{question_id}?updateMask.fieldPaths=active"
    payload = {
        'fields': {
            'active': {'booleanValue': False}
        }
    }
    return make_firestore_request(url, data=payload, method='PATCH')

def main():
    project_id = get_project_id()
    if not project_id:
        print("Error: VITE_FIREBASE_PROJECT_ID not set in .env")
        sys.exit(1)

    print(f"Deactivating old question 'feature_selection'...")
    res1 = deactivate_question(project_id, 'feature_selection')
    print("Response:", res1)

    print("\nPosting next question 'feature_selection_v2'...")
    res2 = post_next_question(
        project_id=project_id,
        question_id='feature_selection_v2',
        question_text='Which capability would you like Antigravity to build next?',
        options=[
            'Advanced tags and categorization system',
            'Calendar view integration',
            'Subtasks dependency and blocker warnings'
        ]
    )
    print("Response:", res2)
    print("\nSuccess! Firestore has been updated to the next feature selection cycle.")

if __name__ == '__main__':
    main()
