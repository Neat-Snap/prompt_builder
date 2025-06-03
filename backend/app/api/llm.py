from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
import loguru
from app.utils.openrouter import *

router = APIRouter(
    prefix="/llm",
    tags=["llm"]
)

logger = loguru.logger


@router.get("/search")
async def search_models_endpoint(request: Request):
    query = request.query_params.get("q")
    if not query:
        return {"error": "No query provided", "success": False}
    
    return {"models": openrouter_model_search(query), "success": True}


@router.post("/openrouter_key")
async def update_openrouter_key(request: Request):
    email = request.state.email
    data = await request.json()
    openrouter_key = data["openrouter_key"]

    current_keys = get_user_keys(email)
    
    current_keys["openrouter"] = openrouter_key

    set_user_keys(email, current_keys)

    return {"message": "OpenRouter key updated", "success": True}


@router.get("/keys")
async def get_keys(request: Request):
    email = request.state.email
    keys = get_user_keys(email)
    if not keys:
        return {"error": "No keys found", "success": False}
    
    return {"keys": keys, "success": True}


@router.post("/request")
async def make_llm_request_endpoint(request: Request):
    email = request.state.email
    data = await request.json()

    system_prompt = data["system_prompt"]
    user_prompt = data["user_prompt"]
    model = data["model"]

    user_keys = get_user_keys(email)
    if not user_keys:
        return {"error": "No keys found", "success": False}
    
    openrouter_key = user_keys["openrouter"]

    result = make_llm_request(openrouter_key, system_prompt, user_prompt, model)

    # with get_db_session() as db:
    #     project_id = db.query(Project).filter(Project.prompts == email).first().id
    # if result:
    #     log_action(project_id, f"Finished running playground test with {model}", "success")
    # else:
    #     log_action(project_id, f"Error running playground test with {model}", "error")
    
    return {"result": result, "success": True}


