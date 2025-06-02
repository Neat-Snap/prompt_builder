from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
from app.utils.auth import generate_jwt_token, hash_password
import loguru
import hashlib

from difflib import SequenceMatcher, ndiff

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

logger = loguru.logger

"""
Here are the rules for the /users endpoints communication:
- There are several groups of endpoints, including /projects, */prompts and others.
- Communication with /project endpoints is prety straightforward. There are routes to get or create a project that are represented just by /projects path.
Then there are endpoints that allow to get, edit or delete a particular project that are also have obvious usage patterns.

- However after that we have /projects/{project_id}/prompts endpoints. 
These endpoints are divided into two groups: one for editing the prompt object (in which you can only edit the name of the prompt) and the other for editing the other prompt info (all prompt info is stored in the PromptVersion object).
- In general, the rule is that if we need to edit the prompt content, comments, version, etc - we need to call endpoints that work with PromptVersion objects, not Prompt objects. Otherwise, if we need to change the name of the intire prompt or delete it, we need to call endpoints that work with Prompt objects.
"""


def check_prompt_change(new_text: str, old_text: str): 
    logger.debug(f"Checking prompt change: {new_text} - new text, {old_text} - old text")
    if not old_text:
        return True, None

    matcher = SequenceMatcher(None, new_text, old_text)
    ratio = matcher.ratio()

    logger.debug(f"Checking prompt change: {ratio}")

    if ratio < 0.92:
        new_lines = new_text.splitlines()
        old_lines = old_text.splitlines()
        diff = ndiff(old_lines, new_lines)
        return True, "\n".join(diff)
    
    return False, None



@router.get("/me")
async def get_me_endpoint(request: Request):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


@router.get("/projects")
async def get_projects_endpoint(request: Request):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    projects = get_projects_by_user(user["id"])
    return projects


@router.post("/projects")
async def create_project_endpoint(request: Request):
    try:
        email = request.state.email
        user_id = get_user_by_email(email)["id"]
        project = await request.json()
        project["user_id"] = user_id

        result = set_project(project)

        return result
    except Exception as e:
        logger.error(f"Error creating project: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/projects/{project_id}")
async def get_project_endpoint(request: Request, project_id: str):
    email = request.state.email
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["user_id"] != get_user_by_email(email)["id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return project


@router.put("/projects/{project_id}")
async def update_project_endpoint(project_id: str, request: Request):
    email = request.state.email
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    project = await request.json()
    if project["user_id"] != user["id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return set_project(project_id, project)


@router.delete("/projects/{project_id}")
async def delete_project_endpoint(request: Request, project_id: str):
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return delete_project(project_id)


@router.get("/projects/{project_id}/prompts")
async def get_prompts_endpoint(request: Request, project_id: str):
    """
    Returns all prompts in the project including all versions of each prompt
    """
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    prompts = get_project_prompts(project_id)

    return prompts


@router.post("/projects/{project_id}/prompts")
async def create_prompt_endpoint(request: Request, project_id: str):
    """
    Creates a new prompt in the project. This endpoints is used to create a new prompt object from the sidebar menu and immediately assign a first version to it
    """
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    prompt = await request.json()
    prompt["project_id"] = project_id

    result = create_prompt_with_version(prompt)

    if result:
        log_action(project_id, "Prompt created", "new")
    else:
        log_action(project_id, "Prompt creation failed", "error")

    return result


@router.get("/projects/{project_id}/prompts/{prompt_id}")
async def get_prompt_endpoint(request: Request, project_id: str, prompt_id: str):
    """
    Get info about a particular prompt including all versions of the prompt. Also may include runs of the versions (get_prompt function has a parameter to include runs)
    """
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    prompt = get_prompt(prompt_id)
    return prompt


@router.put("/projects/{project_id}/prompts/{prompt_id}")
async def update_prompt_version_endpoint(request: Request, project_id: str, prompt_id: str):
    """
    Update info about some version of the prompt. This is used to edit the prompt text, comments, etc.
    """
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    prompt = await request.json()
    prompt["prompt_id"] = prompt_id

    if "version_number" in prompt:
        del prompt["version_number"]

    new_text = prompt.get("prompt_text")

    previous_versions = get_prompt_versions_by_prompt(prompt_id)

    old_version = previous_versions[-1] if previous_versions else None
    logger.debug(f"Old version: {old_version}")
    old_text = old_version.get("prompt_text") if old_version else None
    old_version_number = old_version.get("version_number") if old_version else None

    if "comments" in prompt:
        prompt["version_number"] = old_version_number + 1 if old_version_number else 1
        return create_prompt_version(prompt)
    else:
        is_significant_change, _ = check_prompt_change(new_text, old_text)
        if is_significant_change:
            prompt["version_number"] = old_version_number + 1 if old_version_number else 1
            return create_prompt_version(prompt)
        else:
            return set_prompt_version(prompt)


@router.delete("/projects/{project_id}/prompts/{prompt_id}")
async def delete_prompt_endpoint(request: Request, project_id: str, prompt_id: str):
    """
    Deletes a prompt and all its versions
    """
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return delete_prompt(prompt_id)


@router.get("/actions/{project_id}")
async def get_project_actions_endpoint(request: Request, project_id: str):
    email = request.state.email
    user_id = get_user_by_email(email)["id"]
    if user_id != get_project(project_id)["user_id"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return get_project_actions(project_id)
