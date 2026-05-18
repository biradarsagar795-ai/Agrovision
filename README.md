# 🌿 AgroVision— Plant Disease Detection

AI-powered crop disease detection from leaf images. Upload a photo, get instant diagnosis with confidence scores and treatment recommendations.

## ✨ Features

- **38 Disease Classes** — Covers 14 crop species from the PlantVillage dataset
- **Real-time Inference** — Fast prediction using MobileNetV2 deep learning model
- **Treatment Recommendations** — Actionable treatment & prevention steps for each disease
- **Modern UI** — Glassmorphism design, dark/light mode, responsive layout
- **Drag & Drop Upload** — Easy image upload with preview
- **Webcam Capture** — Take photos directly from your camera
- **Prediction History** — Local storage-based history of recent predictions
- **Simulation Mode** — Works out of the box without a trained model

## 🚀 Quick Start (Simulation Mode)

No trained model or TensorFlow needed — simulation mode works instantly.

### 1. Clone & Setup

```bash
cd crop-disease-app/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run

```bash
python main.py
```

Open **http://localhost:8000** in your browser.

## 🧠 Using a Real Trained Model

### 1. Download Dataset

Download the PlantVillage dataset from [Kaggle](https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset).

### 2. Train the Model

```bash
pip install tensorflow>=2.15.0

python train_model.py --data_dir /path/to/PlantVillage --epochs 20
```

The trained model will be saved to `backend/model/trained_model/plant_disease_model.h5`.

### 3. Enable Real Model

Create a `.env` file in the backend directory:

```env
USE_REAL_MODEL=true
MODEL_PATH=model/trained_model/plant_disease_model.h5
```

### 4. Restart the server

```bash
python main.py
```

## 🐳 Docker Deployment

```bash
cd crop-disease-app
docker-compose up --build
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Upload image, get disease prediction |
| `GET` | `/health` | Server health check |
| `GET` | `/docs` | Interactive API documentation (Swagger) |

### Example Response (`POST /predict`)

```json
{
  "disease": "Tomato — Early Blight",
  "plant": "Tomato",
  "condition": "Early Blight",
  "confidence": 94.72,
  "is_healthy": false,
  "description": "A fungal disease caused by Alternaria solani...",
  "symptoms": ["Dark brown concentric ring spots...", "..."],
  "treatment": ["Remove infected lower leaves...", "..."],
  "top_predictions": [
    {"disease": "Tomato — Early Blight", "confidence": 94.72},
    {"disease": "Tomato — Septoria Leaf Spot", "confidence": 3.15},
    {"disease": "Potato — Early Blight", "confidence": 1.02}
  ],
  "mode": "real"
}
```

## 🏗️ Project Structure

```
crop-disease-app/
├── backend/
│   ├── main.py              # FastAPI app with endpoints
│   ├── config.py             # Environment configuration
│   ├── train_model.py        # Model training script
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile
│   ├── model/
│   │   ├── classifier.py     # Inference engine (simulation + real)
│   │   ├── labels.py         # 38 class label mappings
│   │   └── treatments.py     # Treatment recommendations DB
│   └── utils/
│       ├── image_processing.py  # Image preprocessing pipeline
│       └── validators.py        # File validation utilities
├── frontend/
│   ├── index.html            # Main page
│   ├── script.js             # Application logic
│   └── styles.css            # Custom styles
├── uploads/                  # Temporary uploads
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Deployment Guides

### Render
1. Push to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set root directory to `backend`
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Railway
1. Push to GitHub
2. Connect repo on [Railway](https://railway.app)
3. Set root directory to `backend`
4. Railway auto-detects Python — add `Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Vercel (Frontend Only)
1. Deploy `frontend/` folder to Vercel
2. Update `API_BASE` in `script.js` to point to your backend URL

## 🔒 Security Best Practices

- File type validation via magic bytes (not just extension)
- File size limits enforced server-side
- CORS configured for allowed origins
- No direct filesystem path exposure
- Input sanitization on all endpoints

## 📈 Improving Accuracy

- Use the full PlantVillage dataset (54K+ images)
- Increase training epochs with early stopping
- Apply aggressive data augmentation
- Fine-tune more MobileNetV2 layers
- Try EfficientNetB0 or ResNet50 as base model
- Add test-time augmentation (TTA)

## 📄 License

MIT License — free for educational and commercial use.
