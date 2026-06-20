#!/usr/bin/env python3
import os
import re
import sys
import json
import argparse
import urllib.request
import base64

def load_env():
    env_vars = {}
    # Search for .env in root directory
    possible_paths = [
        os.path.join(os.path.dirname(__file__), '../../../.env'),
        os.path.join(os.path.dirname(__file__), '../../.env'),
        os.path.join(os.getcwd(), '.env')
    ]
    for env_path in possible_paths:
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
            break
    return env_vars

def make_request(url, method="GET", payload=None, auth_b64=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if auth_b64:
        req.add_header("Authorization", f"Basic {auth_b64}")
    
    if payload:
        req.data = json.dumps(payload).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_content = response.read().decode("utf-8")
            return json.loads(res_content) if res_content else {}
    except Exception as e:
        print(f"[JIRA ERROR] Request failed: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Jira Issue Creator & State Manager Helper Script")
    parser.add_argument("--action", default="create", choices=["create", "comment", "transition"], 
                        help="Action to perform (create issue, post comment, transition state)")
    
    # Create arguments
    parser.add_argument("--project", default="KAN", help="Jira Project Key (e.g. PROJ)")
    parser.add_argument("--summary", help="Issue Title/Summary")
    parser.add_argument("--desc", help="Issue Description")
    parser.add_argument("--type", default="Task", help="Issue Type (Task, Story, Bug)")
    parser.add_argument("--priority", default="Medium", help="Issue Priority (High, Medium, Low)")
    
    # Comment & Transition arguments
    parser.add_argument("--issue", help="Jira Issue Key (e.g. KAN-101)")
    parser.add_argument("--comment", help="Comment body text")
    parser.add_argument("--transition", help="Transition name or status to apply (e.g. Done)")
    
    args = parser.parse_args()
    
    env = load_env()
    jira_url = env.get("JIRA_URL")
    jira_email = env.get("JIRA_EMAIL")
    jira_token = env.get("JIRA_API_TOKEN")
    
    if not jira_url or not jira_email or not jira_token:
        # Offline Mock Mode
        print("\n=== OFFLINE JIRA MOCK MODE ===")
        print("JIRA credentials not configured in .env.")
        if args.action == "create":
            print(f"Project:    {args.project}")
            print(f"Summary:    {args.summary}")
            print(f"Desc:       {args.desc}")
            print("Result:     Created mock issue KAN-MOCK-101 successfully.")
        elif args.action == "comment":
            print(f"Issue:      {args.issue}")
            print(f"Comment:    {args.comment}")
            print("Result:     Mock comment added successfully.")
        elif args.action == "transition":
            print(f"Issue:      {args.issue}")
            print(f"Transition: {args.transition}")
            print("Result:     Mock transition applied successfully.")
        print("==============================\n")
        return
        
    # Normalize URL
    if not jira_url.startswith(("http://", "https://")):
        jira_url = "https://" + jira_url
    jira_url = jira_url.rstrip("/")
    
    auth_str = f"{jira_email}:{jira_token}"
    auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
    
    if args.action == "create":
        if not args.summary or not args.desc:
            print("Error: --summary and --desc are required for creating an issue.")
            sys.exit(1)
            
        api_url = f"{jira_url}/rest/api/2/issue"
        payload = {
            "fields": {
                "project": {"key": args.project},
                "summary": args.summary,
                "description": args.desc,
                "issuetype": {"name": args.type},
                "priority": {"name": args.priority}
            }
        }
        res = make_request(api_url, "POST", payload, auth_b64)
        if res:
            print(f"Successfully created Jira Issue: {res.get('key')}")
            print(f"Link: {res.get('self')}")
        else:
            print("Failed to create Jira issue.")
            sys.exit(1)
            
    elif args.action == "comment":
        if not args.issue or not args.comment:
            print("Error: --issue and --comment are required for posting a comment.")
            sys.exit(1)
            
        api_url = f"{jira_url}/rest/api/2/issue/{args.issue}/comment"
        payload = {
            "body": args.comment
        }
        res = make_request(api_url, "POST", payload, auth_b64)
        if res:
            print(f"Successfully posted comment to Jira Issue {args.issue}")
        else:
            print(f"Failed to post comment to Jira Issue {args.issue}")
            sys.exit(1)
            
    elif args.action == "transition":
        if not args.issue or not args.transition:
            print("Error: --issue and --transition are required for transitioning an issue.")
            sys.exit(1)
            
        # Get transitions to locate the ID for the target transition
        transitions_url = f"{jira_url}/rest/api/2/issue/{args.issue}/transitions"
        res = make_request(transitions_url, "GET", None, auth_b64)
        if not res:
            print(f"Failed to fetch transitions for issue {args.issue}")
            sys.exit(1)
            
        transitions = res.get("transitions", [])
        transition_id = None
        target_name = args.transition.lower()
        
        for t in transitions:
            name = t.get("name", "").lower()
            if name == target_name:
                transition_id = t.get("id")
                break
        
        # Fallback heuristic if exact transition name not matched
        if not transition_id:
            for t in transitions:
                name = t.get("name", "").lower()
                if target_name in name or name in target_name:
                    transition_id = t.get("id")
                    break
        
        # Default fallback to the last transition if not found
        if not transition_id and transitions:
            transition_id = transitions[-1].get("id")
            
        if not transition_id:
            print(f"Could not locate transition ID for '{args.transition}' on issue {args.issue}")
            sys.exit(1)
            
        payload = {
            "transition": {
                "id": transition_id
            }
        }
        req_post = urllib.request.Request(transitions_url, method="POST")
        req_post.add_header("Content-Type", "application/json")
        req_post.add_header("Authorization", f"Basic {auth_b64}")
        req_post.data = json.dumps(payload).encode("utf-8")
        
        try:
            with urllib.request.urlopen(req_post, timeout=10) as response:
                print(f"Successfully transitioned Jira Issue {args.issue} to '{args.transition}'")
        except Exception as e:
            print(f"Error transitioning Jira issue: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
