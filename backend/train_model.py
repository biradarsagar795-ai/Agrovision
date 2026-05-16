"""
Model Training Script — MobileNetV2 Transfer Learning on PlantVillage Dataset

Usage:
    python train_model.py --data_dir /path/to/PlantVillage --epochs 20

Prerequisites:
    1. Download the PlantVillage dataset from Kaggle:
       https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
    2. Organize images in subdirectories by class name:
       dataset/
         Apple___Apple_scab/
         Apple___Black_rot/
         ...
    3. Install TensorFlow: pip install tensorflow>=2.15.0

The trained model will be saved to: backend/model/trained_model/plant_disease_model.h5
"""

import os
import json
import argparse
from pathlib import Path

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models, callbacks


def create_model(num_classes: int = 38, img_size: int = 224) -> models.Model:
    """
    Create a MobileNetV2 transfer learning model.
    
    - Base: MobileNetV2 pretrained on ImageNet (frozen initially)
    - Head: GlobalAveragePooling → Dropout → Dense(256) → Dropout → Dense(num_classes)
    """
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(img_size, img_size, 3),
    )
    base_model.trainable = False  # Freeze base layers

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train(data_dir: str, epochs: int = 20, batch_size: int = 32, img_size: int = 224):
    """Run the full training pipeline."""
    output_dir = Path(__file__).parent / "model" / "trained_model"
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 Loading dataset from: {data_dir}")

    # ── Data generators with augmentation ────────────────────────
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=25,
        width_shift_range=0.15,
        height_shift_range=0.15,
        horizontal_flip=True,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        validation_split=0.2,
    )

    train_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_gen = datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    num_classes = len(train_gen.class_indices)
    print(f"🏷️  Found {num_classes} classes")
    print(f"📊 Training samples: {train_gen.samples}, Validation: {val_gen.samples}")

    # Save class indices for inference
    indices_path = output_dir / "class_indices.json"
    # Invert: {class_name: index} → {index: class_name}
    inverted = {v: k for k, v in train_gen.class_indices.items()}
    with open(indices_path, "w") as f:
        json.dump(inverted, f, indent=2)
    print(f"💾 Saved class indices to {indices_path}")

    # ── Build model ──────────────────────────────────────────────
    model = create_model(num_classes=num_classes, img_size=img_size)
    model.summary()

    # ── Callbacks ────────────────────────────────────────────────
    model_path = output_dir / "plant_disease_model.h5"
    cb = [
        callbacks.ModelCheckpoint(
            str(model_path), monitor="val_accuracy",
            save_best_only=True, verbose=1
        ),
        callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5,
            restore_best_weights=True, verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5,
            patience=3, min_lr=1e-6, verbose=1
        ),
    ]

    # ── Train ────────────────────────────────────────────────────
    print("\n🚀 Starting training (frozen base)...")
    model.fit(train_gen, validation_data=val_gen, epochs=epochs, callbacks=cb)

    # ── Fine-tuning: unfreeze top layers ─────────────────────────
    print("\n🔓 Fine-tuning: unfreezing top 30 layers of MobileNetV2...")
    base = model.layers[0]
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.fit(
        train_gen, validation_data=val_gen,
        epochs=epochs // 2, callbacks=cb
    )

    print(f"\n✅ Training complete! Model saved to: {model_path}")
    print(f"   Set USE_REAL_MODEL=true in .env to use this model.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train plant disease detection model")
    parser.add_argument("--data_dir", type=str, required=True,
                        help="Path to PlantVillage dataset directory")
    parser.add_argument("--epochs", type=int, default=20,
                        help="Number of training epochs (default: 20)")
    parser.add_argument("--batch_size", type=int, default=32,
                        help="Batch size (default: 32)")
    args = parser.parse_args()

    train(data_dir=args.data_dir, epochs=args.epochs, batch_size=args.batch_size)
