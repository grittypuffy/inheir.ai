import os
import logging
import datetime
from urllib.parse import urlparse
import azure.functions as func
from azure.storage.blob.aio import BlobServiceClient
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.environ["MONGO_URI"]
MONGO_DB = os.environ["MONGO_DB"]
CASE_DETAILS_COLLECTION = "case_details"
CASE_SUMMARY_COLLECTION = "case_summary"
BLOB_CONNECTION_STRING = os.environ["BLOB_CONNECTION_STRING"]
BLOB_CONTAINER_NAME = os.environ["BLOB_CONTAINER_NAME"]
ANONYMOUS_USER_ID = os.environ["ANONYMOUS_USER_ID"]


def extract_blob_name(blob_url: str) -> str:
    try:
        return urlparse(blob_url).path.lstrip(f'/{BLOB_CONTAINER_NAME}/')
    except Exception as e:
        logging.error(f"Error parsing blob URL '{blob_url}': {e}")
        return None

async def delete_old_entries():
    mongo_client = AsyncIOMotorClient(MONGO_URI)
    db = mongo_client[MONGO_DB]
    details_col = db[CASE_DETAILS_COLLECTION]
    summary_col = db[CASE_SUMMARY_COLLECTION]

    blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)
    container_client = blob_service_client.get_container_client(BLOB_CONTAINER_NAME)

    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=1)

    cursor = details_col.find({"user_id": ANONYMOUS_USER_ID, "created_at": {"$lt": cutoff}})
    async for case in cursor:
        case_id = case["_id"]

        await details_col.delete_one({"_id": case_id})
        logging.info(f"Deleted case_details with ID: {case_id}")

        summary = await summary_col.find_one({"case_id": str(case_id)})
        if summary:
            blob_urls = []

            if "document" in summary:
                blob_urls.append(summary["document"])

            if "supporting_documents" in summary:
                blob_urls.extend(summary.get("supporting_documents", []))

            for blob_url in blob_urls:
                blob_name = extract_blob_name(blob_url)
                if blob_name:
                    try:
                        await container_client.delete_blob(blob_name)
                        logging.info(f"Deleted blob: {blob_name}")
                    except Exception as e:
                        logging.warning(f"Could not delete blob '{blob_name}': {e}")

            await summary_col.delete_one({"_id": summary["_id"]})
            logging.info(f"Deleted case_summary with case_id: {case_id}")

    await mongo_client.close()

async def main(mytimer: func.TimerRequest) -> None:
    logging.info("Timer function started")
    await delete_old_entries()