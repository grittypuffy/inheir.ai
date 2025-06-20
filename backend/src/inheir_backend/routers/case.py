import json
import logging
from datetime import datetime
from fastapi import APIRouter, Request, UploadFile, Body
from fastapi.responses import JSONResponse
from ..config import AppConfig, get_config
from ..models.case import CaseDetails, CaseSummary, CaseMetaResponse
from ..models.case import CaseResponse, Case, Remarks, ChatMetaResponse
from ..models.chat import Chat, ChatData
from typing import Optional, List
from ..services.rag import process_upload_document
from ..services.storage import upload_user_file, upload_knowledge_base_file
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.chains.llm import LLMChain
from ..helpers.serializer import serializer
from fastapi import HTTPException
from bson import ObjectId

router = APIRouter(tags=["Case Analysis"])

config: AppConfig = get_config()


case_summary_system_template = """You are a legal assistant specialized in property and title resolution."""
case_summary_user_template = """\
### Document:
{{{{ document }}}}

### Supporting document:
{{{{ supporting_documents }}}}

{{{{
  "valid": boolean, # should be only true or false
  "legitimate": boolean, # should be only true or false
  "case_type": string, # no null
  "entity": [
    {{
      "name": string,
      "entity_type": "person" | "organization",
      "valid": boolean
    }}
  ],
  "asset": [
    {{
      "name": string,
      "location": string | null,
      "asset_type": string,
      "net_worth": string | null,
      "coordinates": string | null
    }}
  ],
  "summary": string,
  "recommendations": [ string ],
  "references": [ string ]
}}}}

Guidelines:
- Use plain English.
- Use null if information is missing.
- Return ONLY JSON, without any formatting. No surrounding text, no markdown.
"""

case_summary_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(case_summary_system_template),
    HumanMessagePromptTemplate.from_template(case_summary_user_template)
])


@router.get("/is_admin")
async def is_admin(req: Request):
    user = req.state.user
    is_admin = False
    if user and user.get("role") == "Admin":
        is_admin = True
    return JSONResponse(
        status_code=200,
        content={"is_admin": is_admin}
    )



@router.post("/create")
async def create_case(
    req: Request,
    document: UploadFile,
    supporting_documents: Optional[List[UploadFile]] = None,
    title: Optional[str] = "Title",
    address: Optional[str] = None
):
    logging.info(req.state.user)
    user_id = config.env.anonymous_user_id
    if req.state.user:
        user_id = req.state.user.get("user_id")
    case_details_collection = config.db['case_details']
    case_summary_collection = config.db['case_summary']
    date = str(datetime.now())
    case_details = {"user_id": user_id, "title": title or f"Case - {date}"}
    case_details = CaseDetails(**case_details)
    case_insert_result = await case_details_collection.insert_one(case_details.dict())
    case_id = case_insert_result.inserted_id
    case_id = str(case_id)

    user_document = await upload_user_file(document, user_id=user_id, case_id=case_id, chat_id=None, case=True)
    document_url = user_document.get("url")

    supporting_documents_urls = []
    if supporting_documents is not None:
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
        supporting_doc_content = process_upload_document(supporting_document_url)
        if supporting_doc_content is not None:
            supporting_doc_content = str(0+1) + ". " + supporting_doc_content
            supporting_document_content.append(supporting_doc_content.strip())
    try:
        client = config.langchain_llm
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
        case_summ_dict = json.loads(response.pop("text"))
        case_summ_dict["case_id"] = case_id
        case_summ_dict["document_content"] = response.pop("document")
        case_summ_dict["supporting_document_content"] = response.pop("supporting_documents")
        case_summ_dict["document"] = document_url
        case_summ_dict["supporting_documents"] = supporting_documents_urls

        if valid := case_summ_dict.get("valid") is None:
            case_summ_dict["valid"] = False
        if legitimate := case_summ_dict.get("legitimate") is None:
            case_summ_dict["legitimate"] = False
        
        if summary := case_summ_dict.get("summary") is None:
            case_summ_dict["summary"] = "No summary generated"

        if case_type := case_summ_dict.get("case_type") is None:
            case_summ_dict["case_type"] = "Dispute"
        

        case_summary = CaseSummary(**case_summ_dict)
        case_summary_id = await case_summary_collection.insert_one(case_summ_dict)
        return JSONResponse(
            status_code=200,
            content=case_summary.dict()
        )

    except Exception as e:
        logging.error(e)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}") 


@router.get("/history", response_model=CaseMetaResponse)
async def get_cases(req: Request):
    user_id = None
    if req.state.user:
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
    case_details_collection = config.db["case_details"]
    cursor = case_details_collection.find(
        {"user_id": user_id},
        {"_id": 1, "title": 1, "status": 1, "created_at": 1}
    )
    cases = []
    async for doc in cursor:
        doc["_id"] = doc["_id"].__str__()
        doc["case_id"] = doc["_id"]
        doc["created_at"] = doc["created_at"].__str__()
        doc.pop("_id", None)
        cases.append(CaseResponse(**doc)) 
    cases.sort(key=lambda x: x.created_at, reverse=True)
    cases_dict = {"cases": cases}
    case_response = CaseMetaResponse(**cases_dict)
    return JSONResponse(
        status_code=200,
        content={
            "cases": case_response.model_dump(),
        }
    )
        
@router.get("/{case_id}", response_model=Case)
async def get_summary(req: Request, case_id: str):
    user_id = None
    if req.state.user:
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
            {"user_id": user_id, "_id": ObjectId(case_id)},
            {"title": 1, "status": 1, "created_at": 1}
        )
        if not case_doc:
            return JSONResponse(
                status_code=404,
                content={
                    "message": "Case not found"
                }
            )
        case_doc["created_at"] = case_doc["created_at"].__str__()
        case_doc["case_id"] = case_doc["_id"].__str__()
        case_doc.pop("_id", None)
        case_summary_doc = await case_summary_collection.find_one(
            {"case_id": case_id}
        )
        if not case_summary_doc:
            return JSONResponse(
                status_code=404,
                content={
                    "message": "Case summary not found"
                }
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
            content=case_response.model_dump()
        )

@router.post("/{case_id}/resolve")
async def resolve_case(req: Request, case_id: str, remarks: Remarks = Body(default=Remarks())):
    user_id = None
    if req.state.user:
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

        case_summary_collection = config.db['case_summary']
        case_summary_doc = await case_summary_collection.find_one_and_update(
            {"case_id": case_id},
            {"$set": {"remarks": remarks.remarks}}
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Successfully resolved",
                "success": True
            }
        )


@router.post("/{case_id}/abort")
async def abort_case(req: Request, case_id: str, remarks: Remarks = Body(default=Remarks())):
    user_id = None
    if req.state.user:
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
            { "$set": { "status": "Aborted" } }
        )
        case_summary_collection = config.db['case_summary']
        case_summary_doc = await case_summary_collection.find_one_and_update(
            {"case_id": case_id},
            {"$set": {"remarks": remarks.remarks}}
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Successfully resolved",
                "success": True
            }
        )

@router.get("/{case_id}/chats", response_model=ChatMetaResponse)
async def get_chats(req: Request, case_id: str):
    if not req.state.user:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    user_id = req.state.user.get("user_id")
    case_details_collection = config.db["chat_history"]
    cursor = case_details_collection.find(
        {"user_id": user_id, "case_id": case_id}
    )
    chats = []
    async for doc in cursor:
        doc["_id"] = doc["_id"].__str__()
        doc["chat_id"] = doc["_id"]
        doc.pop("_id", None)
        query = doc.pop("query")
        doc["query"] = ChatData(**query)
        response = doc.pop("response")
        doc["response"] = ChatData(**response)
        chats.append(Chat(**doc)) 
    chats_dict = {"chats": chats}

    chat_response = ChatMetaResponse(**chats_dict)
    return JSONResponse(
        status_code=200,
        content={
            "chats": chat_response.model_dump(),
        }
    )
