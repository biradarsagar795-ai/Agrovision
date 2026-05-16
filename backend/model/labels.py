"""
Class labels for the PlantVillage dataset (38 classes).
Maps model output indices to human-readable names.
"""

CLASS_LABELS: dict[int, str] = {
    0:  "Apple — Apple Scab",
    1:  "Apple — Black Rot",
    2:  "Apple — Cedar Apple Rust",
    3:  "Apple — Healthy",
    4:  "Blueberry — Healthy",
    5:  "Cherry — Powdery Mildew",
    6:  "Cherry — Healthy",
    7:  "Corn — Cercospora Leaf Spot (Gray Leaf Spot)",
    8:  "Corn — Common Rust",
    9:  "Corn — Northern Leaf Blight",
    10: "Corn — Healthy",
    11: "Grape — Black Rot",
    12: "Grape — Esca (Black Measles)",
    13: "Grape — Leaf Blight (Isariopsis Leaf Spot)",
    14: "Grape — Healthy",
    15: "Orange — Huanglongbing (Citrus Greening)",
    16: "Peach — Bacterial Spot",
    17: "Peach — Healthy",
    18: "Bell Pepper — Bacterial Spot",
    19: "Bell Pepper — Healthy",
    20: "Potato — Early Blight",
    21: "Potato — Late Blight",
    22: "Potato — Healthy",
    23: "Raspberry — Healthy",
    24: "Soybean — Healthy",
    25: "Squash — Powdery Mildew",
    26: "Strawberry — Leaf Scorch",
    27: "Strawberry — Healthy",
    28: "Tomato — Bacterial Spot",
    29: "Tomato — Early Blight",
    30: "Tomato — Late Blight",
    31: "Tomato — Leaf Mold",
    32: "Tomato — Septoria Leaf Spot",
    33: "Tomato — Spider Mites (Two-Spotted Spider Mite)",
    34: "Tomato — Target Spot",
    35: "Tomato — Yellow Leaf Curl Virus",
    36: "Tomato — Mosaic Virus",
    37: "Tomato — Healthy",
}

NUM_CLASSES: int = len(CLASS_LABELS)

HEALTHY_INDICES: set[int] = {
    idx for idx, label in CLASS_LABELS.items() if "Healthy" in label
}

def is_healthy(class_index: int) -> bool:
    return class_index in HEALTHY_INDICES

def get_plant_name(class_index: int) -> str:
    label = CLASS_LABELS.get(class_index, "Unknown")
    return label.split(" — ")[0]

def get_condition(class_index: int) -> str:
    label = CLASS_LABELS.get(class_index, "Unknown")
    parts = label.split(" — ")
    return parts[1] if len(parts) > 1 else "Unknown"
