"""
File validation utilities for uploaded images.
Checks file extension, MIME type via magic bytes, and file size.
"""

from fastapi import UploadFile, HTTPException, status

# ── Magic byte signatures for supported image formats ────────────
MAGIC_BYTES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",  # WebP starts with RIFF....WEBP
}


async def validate_image(file: UploadFile, max_size_bytes: int, allowed_extensions: list[str]) -> bytes:
    """
    Validate an uploaded image file for type, size, and content integrity.

    Args:
        file: The uploaded file from FastAPI
        max_size_bytes: Maximum allowed file size in bytes
        allowed_extensions: List of allowed file extensions (e.g., ['jpg', 'png'])

    Returns:
        The raw file bytes if validation passes

    Raises:
        HTTPException: If validation fails (400 for type, 413 for size)
    """
    # ── Check filename extension ────────────────────────────────
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided.",
        )

    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{extension}' not allowed. Accepted: {', '.join(allowed_extensions)}",
        )

    # ── Read file content ───────────────────────────────────────
    contents = await file.read()

    # ── Check file size ─────────────────────────────────────────
    if len(contents) > max_size_bytes:
        size_mb = max_size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {size_mb:.0f} MB.",
        )

    # ── Check empty file ────────────────────────────────────────
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ── Verify magic bytes match an image format ────────────────
    is_valid_image = False
    for magic, fmt in MAGIC_BYTES.items():
        if contents[:len(magic)] == magic:
            is_valid_image = True
            break

    if not is_valid_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not appear to be a valid image.",
        )

    return contents
