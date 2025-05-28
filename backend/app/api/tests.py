from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
import loguru
from openai import OpenAI
import requests
from app.utils.agents import get_agent
from utils.openrouter import make_llm_request
import threading


router = APIRouter(
    prefix="/tests",
    tags=["tests"]
)

logger = loguru.logger


def run_testset(email, testset_data, prompt_id, model, version_id=-1):
    versions = get_prompt(prompt_id)["versions"]
    if version_id != -1:
        for version in versions:
            if version["id"] == version_id:
                system_prompt = version["prompt _text"]
                break
            else:
                raise HTTPException(status_code=404, detail="Version not found")
    else:
        system_prompt = versions[0]["prompt_text"]

    user_api_key = get_user_keys(email)

    number_of_tests = len(testset_data["tests"])

    run = create_run(model, version_id, email, prompt_id, number_of_tests=number_of_tests)

    test_number = 0
    for test in testset_data["tests"]:
        test_user_prompt = test["prompt"]

        result = make_llm_request(user_api_key, system_prompt, test_user_prompt, model)

        update_run_result(run["id"], result)
        test_number += 1
        update_run(run["id"], status="In Progress", current_test=test_number)
    
    update_run(run["id"], status="Finished")


@router.get("/testsets/{project_id}")
async def get_testset_endpoint(request: Request, project_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return get_project_testsets(project_id)


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
    return delete_testset(testset_id)


@router.post("/run_testset/{project_id}")
async def run_testset_endpoint(request: Request, project_id: int):
    email = request.state.email
    data = await request.json()
    testset_id = data["testset_id"]
    prompt_id = data["prompt_id"]
    model = data["model"]


    testsets = get_project_testsets(project_id)
    needed_testset = None
    for testset in testsets:
        if testset["id"] == testset_id:
            needed_testset = testset
            break
    if not needed_testset:
        raise HTTPException(status_code=404, detail="Testset not found")
    
    thread = threading.Thread(target=run_testset, args=(email, needed_testset, prompt_id, model))
    thread.start()
    return {"success": True, "message": "Testset run successfully"}



@router.get("/check_run/{prompt_version_id}")
async def check_run_endpoint(request: Request, prompt_version_id: int):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return check_run(prompt_version_id)