#!/usr/bin/env python3

PREFERABLE_FEATURES = [
    "Calendar view",
    "Export tasks",
    "Recurring tasks",
    "Task search",
    "Category tags",
    "Task notes",
    "Shared collaboration"
]

def get_next_available_feature(current_options, implemented_features):
    """
    Returns the first feature in PREFERABLE_FEATURES that is not currently in 
    current_options or implemented_features.
    If all are used, returns a custom generic feature.
    """
    # Normalize inputs for case-insensitive and whitespace comparison
    used = set()
    for opt in current_options:
        used.add(opt.strip().lower())
    for imp in implemented_features:
        used.add(imp.strip().lower())
        
    for feature in PREFERABLE_FEATURES:
        if feature.strip().lower() not in used:
            return feature
            
    # Fallback to custom feature generation
    fallback_index = len(implemented_features) + 1
    return f"Custom Feature Addition v{fallback_index}"
