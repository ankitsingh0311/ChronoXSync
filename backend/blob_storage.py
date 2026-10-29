# =============================================================================
# EduTrack 3D — Azure Blob Storage Module (blob_storage.py)
# =============================================================================
# SUBJECT 3 (DP-900 Azure Data): Hybrid Cloud Storage Integration
#   - Stores structured information in Azure SQL using a relational 3NF schema.
#   - Keeps unstructured PDF rubrics in Azure Blob Storage.
#   - Saves the PDF's Blob URL in the Deadlines table (pdf_blob_url) for easy access.
# =============================================================================

import os
import uuid
import logging
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("edutrack.blob")

AZURE_BLOB_CONNECTION = os.getenv("AZURE_BLOB_CONNECTION_STRING", "")
AZURE_BLOB_CONTAINER = os.getenv("AZURE_BLOB_CONTAINER_NAME", "edutrack-pdfs")

# Local fallback directory for PDF storage when Azure is not configured
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


def upload_pdf_to_blob(file_bytes: bytes, original_filename: str) -> str:
    """
    SUBJECT 3 (DP-900): Upload PDF binary to Azure Blob Storage.
    Returns the Blob URL for storage in Azure SQL Deadlines.pdf_blob_url.

    Falls back to local file storage if Azure Blob is not configured.
    """
    # Generate unique filename to prevent collisions
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    safe_name = f"{timestamp}_{unique_id}_{original_filename}"

    if AZURE_BLOB_CONNECTION:
        return _upload_to_azure(file_bytes, safe_name)
    else:
        return _upload_to_local(file_bytes, safe_name)


def _upload_to_azure(file_bytes: bytes, blob_name: str) -> str:
    """
    SUBJECT 3 (DP-900): Upload to Azure Blob Storage using azure-storage-blob SDK.
    Creates container if it doesn't exist, uploads blob, returns public URL.
    """
    try:
        from azure.storage.blob import BlobServiceClient, ContentSettings

        blob_service = BlobServiceClient.from_connection_string(AZURE_BLOB_CONNECTION)

        # Create container if not exists (Subject 3: Azure provisioning)
        container_client = blob_service.get_container_client(AZURE_BLOB_CONTAINER)
        try:
            container_client.get_container_properties()
        except Exception:
            container_client.create_container()
            logger.info(f"Created Azure Blob container: {AZURE_BLOB_CONTAINER}")

        # Upload with PDF content type
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(
            file_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="application/pdf")
        )

        blob_url = blob_client.url
        logger.info(f"PDF uploaded to Azure Blob: {blob_url}")
        return blob_url

    except ImportError:
        logger.warning("azure-storage-blob not installed. Falling back to local storage.")
        return _upload_to_local(file_bytes, blob_name)
    except Exception as e:
        logger.error(f"Azure Blob upload failed: {e}. Falling back to local storage.")
        return _upload_to_local(file_bytes, blob_name)


def _upload_to_local(file_bytes: bytes, filename: str) -> str:
    """
    Local fallback: Save PDF to uploads/ directory.
    Returns a local file path that mimics a Blob URL structure.
    """
    filepath = os.path.join(LOCAL_UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    # Return a local URL-like path for the API
    local_url = f"/uploads/{filename}"
    logger.info(f"PDF saved locally: {local_url}")
    return local_url


def get_blob_url(filename: str) -> str:
    """Construct the full Blob URL for a given filename."""
    if AZURE_BLOB_CONNECTION:
        return f"https://{AZURE_BLOB_CONTAINER}.blob.core.windows.net/{AZURE_BLOB_CONTAINER}/{filename}"
    return f"/uploads/{filename}"
