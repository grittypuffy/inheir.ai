import json
from datetime import datetime
from fastapi import APIRouter, Request, UploadFile
from fastapi.responses import JSONResponse
from ..config import AppConfig, get_config
from ..models.case import CaseDetails, CaseSummary, CaseMetaResponse, CaseResponse, Case
from typing import Optional, List
from ..services.rag import process_upload_document
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.chains.llm import LLMChain
from ..helpers.serializer import serializer

router = APIRouter(tags=["Case Analysis"])

config: AppConfig = get_config()

case_summary_system_template = """You are a legal assistant specialized in property and title resolution."""
case_summary_user_template = """\
Analyze the following legal document and supporting docs and return structured data in JSON
### Document:
{{ document }}

### Supporting document:
{{ supporting_documents }}

{
  "valid": boolean,
  "legitimate": boolean,
  "case_type": string,
  "entity": [
    {
      "name": string,
      "entity_type": "person" | "organization",
      "valid": boolean
    }
  ],
  "asset": [
    {
      "name": string,
      "location": string | null,
      "asset_type": string,
      "net_worth": string | null,
      "coordinates": string | null
    }
  ],
  "summary": string,
  "recommendations": [ string ],
  "references": [ string ]
}
Guidelines:
- Use plain English.
- Use null if information is missing.
- Return ONLY JSON, without any formatting. No surrounding text, no markdown.
"""

case_summary_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(case_summary_system_template),
    HumanMessagePromptTemplate.from_template(case_summary_user_template)
])


@router.post("/create")
async def create_case(
    req: Request,
    document: UploadFile,
    supporting_documents: Optional[List[UploadFile]],
    title: Optional[str] = "",
    address: Optional[str] = ""
):
    user_id = req.state.user.get("user_id") or config.env.anonymous_user_id
    case_details_collection = config.db['case_details']
    case_summary_collection = config.db['case_summary']
    date = str(datetime.now())
    case_details = {"user_id": user_id, "title": title or f"Case - {date}"}
    case_details = CaseDetails(**case_details)
    case_insert_result = await case_details_collection.insert_one(case_details.dict())
    case_id = case_insert_result.inserted_id
    case_id = str(case_inserted_id)

    user_document = await upload_user_file(document, user_id=user_id, case_id=case_id, chat_id=None, case=True)
    document_url = user_document.get("url")

    supporting_documents_urls = []
    for supporting_document in supporting_documents:
        user_supporting_document = await upload_user_file(supporting_document, user_id=user_id, case_id=case_id, chat_id=None, case=True)
        supporting_document_url = user_supporting_document.get("url")
        supporting_documents_urls.append(supporting_document_url)
    
    document_content = process_upload_document(document_url)
    if document_content is None:
        return JSONResponse(
            status_code=422,
            content={
                "status": "failed",
                "success": False,
                "reason": "Invalid document. Document contains no readable text."
            }
        )
    else:
        document_content = document_content.strip()
    supporting_document_content = []
    for idx, supporting_doc_url in enumerate(supporting_documents_urls):
        supporting_doc_content = process_upload_document(document_url)
        if supporting_doc_content is not None:
            supporting_doc_content = str(0+1) + ". " + supporting_doc_content
            supporting_document_content.append(supporting_doc_content.strip())
    try:
        client = config.llm
        chain = LLMChain(
            llm=client,
            prompt=case_summary_prompt_template
        )
        logging.info("Executing chain")
        chain_info = {
            "document": document_content,
            "supporting_documents": "\n".join(supporting_document_content)
        }
        response = chain.invoke(chain_info)
        result = json.loads(response)
        result["id"] = case_id

        case_summary = CaseSummary(**result)
        case_summary_id = await case_summary_collection.insert_one(case_details.dict())
        return JSONResponse(
            status_code=200,
            content=case_summary.dict()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing location: {str(e)}") 


@router.get("/", response_model=CaseMetaResponse)
async def get_cases(req: Request):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        cursor = case_details_collection.find(
            {"user_id": user_id},
            {"_id": 1, "title": 1, "status": 1, "created_at": 1}
        ).sort("created_at", -1)
        cases = []
        async for doc in cursor:
            doc["_id"] = serializer(doc) 
            doc["case_id"] = doc.pop("_id")
            doc["created_at"] = str(doc["created_at"])
            cases.append(CaseResponse(**doc))
        cases_dict = {"cases": cases}
        case_response = CaseMetaResponse(**cases_dict)
        return JSONResponse(
            status_code=200,
            content={
                "cases": cases
            }
        )
        
@router.get("/{case_id}", response_model=Case)
async def get_summary(req: Request, case_id: str):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_summary_collection = config.db['case_summary']
        case_doc = await case_details_collection.find_one(
            {"user_id": user_id, "case_id": case_id},
            {"title": 1, "status": 1, "created_at": 1}
        )
        case_doc["created_at"] = str(case_doc["created_at"])
        case_summary_doc = await case_summary_collection.find_one(
            {"case_id": case_id}
        )
        case_summary_doc.pop("_id")
        case_meta_dict = CaseResponse(**case_doc)
        case_summary_dict = CaseSummary(**case_summary_doc)
        case_dict = {
            "meta": case_meta_dict,
            "summary": case_summary_dict           
        }
        case_response = Case(**case_dict)
        return JSONResponse(
            status_code=200,
            content=case_response
        )

@router.get("/{case_id}/resolve", response_model=Case)
async def resolve_case(req: Request, case_id: str):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_doc = await case_details_collection.find_one_and_update(
            {"user_id": user_id, "case_id": case_id},
            { "$set": { "status": "Resolved" } }
        )
        return JSONResponse(
            status_code=200
        )


@router.get("/{case_id}/abort", response_model=Case)
async def abort_case(req: Request, case_id: str):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_doc = await case_details_collection.find_one_and_update(
            {"user_id": user_id, "case_id": case_id},
            { "$set": { "status": "Abort" } }
        )
        return JSONResponse(
            status_code=200
        )
