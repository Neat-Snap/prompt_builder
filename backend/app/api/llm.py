from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
import loguru
from openai import OpenAI
import requests
from app.utils.agents import get_agent



router = APIRouter(
    prefix="/llm",
    tags=["llm"]
)

logger = loguru.logger

def make_llm_request(key: str, system_prompt: str, user_prompt: str, model: str = "mistralai/devstral-small:free"):
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key,
        )
    completion = client.chat.completions.create(
    #   extra_headers={
    #     "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    #     "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
    #   },
    extra_body={},
    model=model,
    messages=[
        {
        "role": "system",
        "content": system_prompt
        },
        {
        "role": "user",
        "content": user_prompt
        }
    ]
    )
    return completion.choices[0].message.content


def openrouter_model_search(query: str):
    url = f"https://openrouter.ai/api/frontend/models/find?fmt=table&q={query}"

    headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "priority": "u=1, i",
        "referer": f"https://openrouter.ai/models?fmt=table&q={query}",
        "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": get_agent(),
    }

    cookies = {
        "__client_uat": "0",
        "__client_uat_NO6jtgZM": "0",
        # "ph_phc_7ToS2jDeWBlMu4n2JoNzoA1FnArdKwFMFoHVnAqQ6O1_posthog": "%7B%22distinct_id%22%3A%220197125f-548a-73db-8abb-f17186cd51bf%22%2C%22%24sesid%22%3A%5B1748359935821%2C%220197125f-5489-70b3-989a-a7b05b703cee%22%2C1748359926921%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22%24direct%22%2C%22u%22%3A%22https%3A%2F%2Fopenrouter.ai%2Fmodels%3Ffmt%3Dtable%26q%3Dgemma%22%7D%7D"
    }

    response = requests.get(url, headers=headers, cookies=cookies)
    models = response.json()["data"]["models"]
    # print(models)

    result = []
    for model_data in models:
        result.append({
            "name": model_data["short_name"],
            "author": model_data["author"].capitalize(),
            "description": model_data["description"],
            "slug": model_data["permaslug"],
            "is_free": model_data.get("endpoint").get("variant") == "free" if model_data.get("endpoint") else False
        })

    return result


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
    
    return {"result": result, "success": True}


