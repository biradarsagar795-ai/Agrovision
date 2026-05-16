"""
CropGuard AI — FastAPI Backend
Main application entry point with API endpoints for plant disease detection.
"""

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.concurrency import run_in_threadpool

from config import get_settings, UPLOAD_DIR, FRONTEND_DIR
from model.classifier import DiseaseClassifier
from utils.validators import validate_image
from utils.image_processing import preprocess_image

# ── Import New Routes ────────────────────────────────────────────
from routes import auth, weather, farm, chatbot

# ── Logging setup ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
)
logger = logging.getLogger("cropguard")

# ── Global state ─────────────────────────────────────────────────
classifier: DiseaseClassifier | None = None
start_time: float = 0


# ── Lifespan: load model at startup ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model once at startup, clean up on shutdown."""
    global classifier, start_time

    settings = get_settings()
    start_time = time.time()

    logger.info(f"🌿 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"   Mode: {'REAL MODEL' if settings.USE_REAL_MODEL else 'SIMULATION'}")

    # Initialize and load classifier
    classifier = DiseaseClassifier(
        use_real_model=settings.USE_REAL_MODEL,
        model_path=settings.MODEL_PATH,
    )
    classifier.load()

    logger.info("🚀 Server ready to accept requests!")
    yield

    # Cleanup
    logger.info("🛑 Shutting down CropGuard AI...")


# ── FastAPI app ──────────────────────────────────────────────────
settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered plant disease detection from leaf images",
    lifespan=lifespan,
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ── CORS middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount frontend static files ─────────────────────────────────
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# ── Include Routers ──────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(weather.router)
app.include_router(farm.router)
app.include_router(chatbot.router)

# ── API Endpoints ────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """Serve the frontend index.html."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return JSONResponse({
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    })


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns server status, uptime, and model readiness.
    """
    uptime = time.time() - start_time
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "uptime_seconds": round(uptime, 2),
        "model_loaded": classifier.is_loaded if classifier else False,
        "mode": "real" if settings.USE_REAL_MODEL else "simulation",
    }


@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    Predict plant disease from an uploaded leaf image.

    Accepts: multipart/form-data with an image file.

    Returns:
        JSON with disease name, confidence, treatment recommendations,
        healthy/unhealthy status, and top-3 predictions.
    """
    if not classifier or not classifier.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Try again later.")

    settings = get_settings()

    # ── Step 1: Validate the uploaded file ───────────────────────
    image_bytes = await validate_image(
        file=file,
        max_size_bytes=settings.max_file_size_bytes,
        allowed_extensions=settings.allowed_extensions_list,
    )

    # ── Step 2: Preprocess the image ─────────────────────────────
    try:
        image_array = preprocess_image(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ── Step 3: Run inference (in thread pool to avoid blocking) ─
    try:
        result = await run_in_threadpool(classifier.predict, image_array)
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed. Please try again.")

    logger.info(
        f"🔍 Prediction: {result['disease']} "
        f"({result['confidence']:.1f}%) "
        f"[{result['mode']} mode]"
    )

    return result


# ── Global exception handlers ───────────────────────────────────
@app.exception_handler(413)
async def file_too_large_handler(request, exc):
    return JSONResponse(
        status_code=413,
        content={"detail": "File too large. Maximum upload size is 10 MB."},
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )


# ── Run with uvicorn (for development) ──────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
