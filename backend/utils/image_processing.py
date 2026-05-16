"""
Image preprocessing pipeline for the disease detection model.
Handles loading, resizing, and normalizing images for MobileNetV2 input.
"""

import io
import logging
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# MobileNetV2 expected input dimensions
TARGET_SIZE = (224, 224)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes into a preprocessed numpy array
    ready for model inference.

    Pipeline:
        1. Load image from bytes
        2. Convert to RGB (handles RGBA, grayscale, etc.)
        3. Resize to 224x224
        4. Convert to float32 numpy array
        5. Normalize pixel values to [0, 1]
        6. Add batch dimension → shape (1, 224, 224, 3)

    Args:
        image_bytes: Raw bytes of the uploaded image

    Returns:
        numpy array of shape (1, 224, 224, 3), dtype float32

    Raises:
        ValueError: If the image cannot be processed
    """
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB (handles PNG with alpha, grayscale, CMYK, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize to model input size using high-quality Lanczos resampling
        image = image.resize(TARGET_SIZE, Image.LANCZOS)

        # Convert to numpy array and normalize to [0, 1]
        image_array = np.array(image, dtype=np.float32) / 255.0

        # Add batch dimension: (224, 224, 3) → (1, 224, 224, 3)
        image_array = np.expand_dims(image_array, axis=0)

        logger.debug(f"Preprocessed image shape: {image_array.shape}")
        return image_array

    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise ValueError(f"Failed to process image: {str(e)}")
