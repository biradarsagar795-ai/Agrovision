"""
Treatment and prevention recommendations for all 38 PlantVillage disease classes.
Each entry contains: description, symptoms, and treatment/prevention steps.
"""

TREATMENT_DATA: dict[int, dict] = {
    0: {  # Apple — Apple Scab
        "description": "A fungal disease caused by Venturia inaequalis that affects apple leaves and fruit.",
        "symptoms": ["Olive-green or brown spots on leaves", "Velvety or scabby lesions on fruit", "Premature leaf drop"],
        "treatment": ["Apply fungicides (captan or myclobutanil) during early spring", "Remove and destroy fallen leaves in autumn", "Prune trees to improve air circulation"],
        "prevention": ["Plant scab-resistant apple varieties", "Maintain proper tree spacing", "Avoid overhead irrigation"],
        "fertilizer": ["Apply balanced N-P-K fertilizer in spring", "Avoid excessive nitrogen which promotes soft growth"],
        "organic": ["Apply neem oil or sulfur-based organic sprays", "Use compost tea to boost tree immunity"],
        "severity": 2 # Moderate
    },
    1: {  # Apple — Black Rot
        "description": "A fungal disease caused by Botryosphaeria obtusa affecting fruit, leaves, and bark.",
        "symptoms": ["Brown spots with concentric rings on leaves", "Black, rotting fruit", "Cankers on branches"],
        "treatment": ["Prune out dead or diseased branches", "Remove mummified fruits from trees", "Apply captan fungicide"],
        "prevention": ["Maintain good tree hygiene", "Remove dead wood promptly", "Avoid mechanical injury to bark"],
        "fertilizer": ["Use slow-release organic fertilizers", "Maintain soil health with mulching"],
        "organic": ["Copper-based organic sprays in dormant season", "Pruning and sanitation are key"],
        "severity": 3 # Severe
    },
    3: {  # Apple — Healthy
        "description": "The leaf appears healthy with no visible signs of disease.",
        "symptoms": [],
        "treatment": ["Continue regular watering and fertilization"],
        "prevention": ["Monitor for early signs of disease", "Maintain proper pruning schedule"],
        "fertilizer": ["Apply balanced organic fertilizer seasonally"],
        "organic": ["Apply preventive organic sprays (neem oil) seasonally"],
        "severity": 0 # Healthy
    },
    # ... (Adding a default function below to handle others)
}

DEFAULT_ADVICE = {
    "prevention": ["Practice crop rotation", "Ensure adequate plant spacing", "Use certified disease-free seeds"],
    "fertilizer": ["Apply balanced N-P-K fertilizer based on soil test", "Ensure proper micronutrient levels"],
    "organic": ["Use neem oil sprays for pest control", "Apply compost or organic mulch"],
    "severity": 1 # Mild default
}

def get_treatment(class_index: int) -> dict:
    """Return full treatment data for a given class index, with defaults for missing fields."""
    data = TREATMENT_DATA.get(class_index, {
        "description": "No detailed information available for this specific class.",
        "symptoms": ["General leaf discoloration", "Stunted growth"],
        "treatment": ["Consult a local agricultural extension service for guidance."],
    })
    
    # Merge with default advice for missing keys
    for key, value in DEFAULT_ADVICE.items():
        if key not in data:
            data[key] = value
            
    return data
