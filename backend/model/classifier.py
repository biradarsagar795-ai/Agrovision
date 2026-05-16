"""
Disease classifier — handles both simulation and real TensorFlow inference.
Provides a unified interface regardless of whether a trained model is loaded.
"""

import random
import logging
import numpy as np
from pathlib import Path

from .labels import CLASS_LABELS, NUM_CLASSES, is_healthy, get_plant_name, get_condition
from .treatments import get_treatment

logger = logging.getLogger(__name__)


class DiseaseClassifier:
    """
    Unified classifier with two modes:
      - Simulation: returns realistic mock predictions (no TensorFlow needed)
      - Real: loads a .h5 Keras model and runs actual inference
    """

    def __init__(self, use_real_model: bool = False, model_path: str = ""):
        self.use_real_model = use_real_model
        self.model_path = model_path
        self.model = None
        self._loaded = False

    def load(self) -> None:
        """Load the model (or verify simulation mode is ready)."""
        if self.use_real_model:
            self._load_real_model()
        else:
            logger.info("🧪 Running in SIMULATION mode — no TensorFlow model loaded.")
            self._loaded = True

    def _load_real_model(self) -> None:
        """Load a trained Keras .h5 model from disk."""
        try:
            import tensorflow as tf
            model_file = Path(self.model_path)
            if not model_file.exists():
                raise FileNotFoundError(f"Model not found at: {model_file}")

            self.model = tf.keras.models.load_model(str(model_file))
            self._loaded = True
            logger.info(f"✅ Loaded TensorFlow model from {model_file}")
        except ImportError:
            raise RuntimeError(
                "TensorFlow is not installed. Install it with: pip install tensorflow"
            )

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, image_array: np.ndarray) -> dict:
        """
        Run prediction on a preprocessed image array.

        Args:
            image_array: numpy array of shape (1, 224, 224, 3), normalized to [0,1]

        Returns:
            dict with disease info, confidence, treatment, and top predictions
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        if self.use_real_model and self.model is not None:
            return self._real_predict(image_array)
        else:
            return self._simulated_predict()

    def _real_predict(self, image_array: np.ndarray) -> dict:
        """Run actual TensorFlow model inference."""
        import tensorflow as tf
        predictions = self.model.predict(image_array, verbose=0)
        probabilities = predictions[0]
        return self._format_result(probabilities)

    def _simulated_predict(self) -> dict:
        """Generate a realistic simulated prediction."""
        # Pick a weighted-random primary class
        primary_idx = random.randint(0, NUM_CLASSES - 1)

        # Generate fake probability distribution
        probabilities = np.random.dirichlet(np.ones(NUM_CLASSES) * 0.3)

        # Boost the primary class to make it dominant (70-99%)
        boost = random.uniform(0.70, 0.99)
        probabilities[primary_idx] = boost
        # Re-distribute remaining probability
        remaining = 1.0 - boost
        mask = np.ones(NUM_CLASSES, dtype=bool)
        mask[primary_idx] = False
        probabilities[mask] = (probabilities[mask] / probabilities[mask].sum()) * remaining

        return self._format_result(probabilities)

    def _format_result(self, probabilities: np.ndarray) -> dict:
        """Format raw probabilities into a structured response."""
        # Get top prediction
        top_idx = int(np.argmax(probabilities))
        top_confidence = float(probabilities[top_idx]) * 100

        # Get top 3 predictions
        top3_indices = np.argsort(probabilities)[-3:][::-1]
        top3 = [
            {
                "disease": CLASS_LABELS.get(int(i), "Unknown"),
                "confidence": round(float(probabilities[int(i)]) * 100, 2),
            }
            for i in top3_indices
        ]

        # Get treatment info
        treatment_info = get_treatment(top_idx)

        return {
            "disease": CLASS_LABELS.get(top_idx, "Unknown"),
            "plant": get_plant_name(top_idx),
            "condition": get_condition(top_idx),
            "confidence": round(top_confidence, 2),
            "is_healthy": is_healthy(top_idx),
            "description": treatment_info["description"],
            "symptoms": treatment_info["symptoms"],
            "treatment": treatment_info["treatment"],
            "top_predictions": top3,
            "mode": "real" if self.use_real_model else "simulation",
        }
