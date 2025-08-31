import azure.functions as func
import logging
from function_app import chatbot

async def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        response = await chatbot(req)
        return response
    except Exception as e:
        logging.exception("Unhandled error in Azure Function")
        return func.HttpResponse(str(e), status_code=500)