from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
import loguru
from openai import OpenAI
import requests
from app.utils.agents import get_agent


router = APIRouter(
    prefix="/tests",
    tags=["tests"]
)

logger = loguru.logger


@router.get("/testsets/{testset_id}")
async def get_testset_endpoint(request: Request, testset_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return get_project_testsets(testset_id)


@router.post("/testsets/{project_id}")
async def create_testset_endpoint(request: Request, project_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    testset_data = await request.json()
    testset_data["project_id"] = project_id
    return create_testset(testset_data)


@router.post("/testsets/{testset_id}/tests")
async def add_test_to_testset_endpoint(request: Request, testset_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    test_prompt = await request.json()
    return add_test_to_testset(testset_id, test_prompt["prompt"])


@router.delete("/testsets/{testset_id}/tests/{test_id}")
async def delete_test_from_testset_endpoint(request: Request, testset_id: int, test_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return delete_test_from_testset(testset_id, test_id)


@router.delete("/testsets/{testset_id}")
async def delete_testset_endpoint(request: Request, testset_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")