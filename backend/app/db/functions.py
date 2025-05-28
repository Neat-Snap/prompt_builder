import logging
from typing import Dict, List, Optional, Union, Any
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.exc import NoResultFound

from datetime import datetime, timedelta
from app.db.session import get_db_session
from app.db.models import User, Project, Prompt, PromptVersion, Run, TestSet
import loguru
import traceback
from app.utils.auth import hash_password
from sqlalchemy.orm.attributes import flag_modified


logger = loguru.logger

def get_user(user_id: int) -> dict:
    try:
        with get_db_session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            return user.to_dict()
    except Exception as e:
        logger.error(f"Error getting user: {traceback.format_exc()}")
        return False


def get_users() -> List[dict]:
    try:
        with get_db_session() as db:
            users = db.query(User).all()
            return [user.to_dict() for user in users]
    except Exception as e:
        logger.error(f"Error getting users: {traceback.format_exc()}")
        return []


def create_user(user_data):
    try:
        name = user_data.get("name")
        email = user_data.get("email")
        password = user_data.get("password")
        with get_db_session() as db:
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return False
            hashed_pw = hash_password(password)
            user = User(name=name, email=email, hashed_password=hashed_pw)
            db.add(user)
            db.commit()
            db.refresh(user)
            return True
    except Exception as e:
        logger.error(f"Error creating user: {traceback.format_exc()}")
        return False



def get_user_keys(email: str) -> dict:
    try:
        with get_db_session() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return {}
            logger.debug(f"User keys: {user.keys}")
            return user.keys if user.keys else {}
    except Exception as e:
        logger.error(f"Error getting user keys: {traceback.format_exc()}")
        return False

def set_user_keys(email: str, keys: dict) -> bool:
    try:
        with get_db_session() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return False
            user.keys = keys
            db.add(user)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting user keys: {traceback.format_exc()}")
        return False

def set_user(user_data: dict) -> bool:
    try:
        user_id = user_data.get("id")
        if user_id is None:
            logger.error("No user ID provided in user_data")
            return False

        with get_db_session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                user = User(**user_data)
                db.add(user)
                db.commit()
                return True

            for key, value in user_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)

            db.add(user)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting user: {traceback.format_exc()}")
        return False


def set_users(users_data: List[dict]) -> bool:
    try:
        with get_db_session() as db:
            for user_data in users_data:
                set_user(user_data)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting users: {traceback.format_exc()}")
        return False


def get_user_by_email(email: str) -> dict:
    try:
        logger.debug(f"Getting user by email: {email}")
        with get_db_session() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return False
            return user.to_dict()
    except Exception as e:
        logger.error(f"Error finding user by email: {traceback.format_exc()}")
        return False

def delete_user(user_id: int) -> bool:
    try:
        with get_db_session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            db.delete(user)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting user: {traceback.format_exc()}")
        return False

def get_user_projects(user_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            projects = db.query(Project).filter(Project.user_id == user_id).all()
            return [project.to_dict() for project in projects]
    except Exception as e:
        logger.error(f"Error getting user projects: {traceback.format_exc()}")
        return []

# Project functions
def get_project(project_id: int) -> dict:
    try:
        with get_db_session() as db:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                return False
            return project.to_dict()
    except Exception as e:
        logger.error(f"Error getting project: {traceback.format_exc()}")
        return False

def get_projects_by_user(user_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            projects = db.query(Project).filter(Project.user_id == user_id).all()
            return [project.to_dict() for project in projects]
    except Exception as e:
        logger.error(f"Error getting projects by user: {traceback.format_exc()}")
        return []

def set_project(project_data: dict) -> bool:
    try:
        project_id = project_data.get("id")
        with get_db_session() as db:
            project = db.query(Project).filter(Project.id == project_id).first() if project_id else None
            if not project:
                project = Project(**project_data)
                db.add(project)
                db.commit()
                return True
            for key, value in project_data.items():
                if hasattr(project, key):
                    setattr(project, key, value)
            db.add(project)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting project: {traceback.format_exc()}")
        return False

def set_projects(projects_data: List[dict]) -> bool:
    try:
        with get_db_session() as db:
            for project_data in projects_data:
                set_project(project_data)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting projects: {traceback.format_exc()}")
        return False

def delete_project(project_id: int) -> bool:
    try:
        with get_db_session() as db:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                return False
            db.delete(project)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting project: {traceback.format_exc()}")
        return False

def get_project_prompts(project_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            prompts = db.query(Prompt).filter(Prompt.project_id == project_id).all()
            return [prompt.to_dict() for prompt in prompts]
    except Exception as e:
        logger.error(f"Error getting project prompts: {traceback.format_exc()}")
        return []


def get_project_prompt_versions(project_id: int, prompt_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            prompt = db.query(Prompt).filter(Prompt.project_id == project_id, Prompt.id == prompt_id).first()
            if not prompt:
                return []
            return [version.to_dict() for version in prompt.versions]
    except Exception as e:
        logger.error(f"Error getting project prompt versions: {traceback.format_exc()}")
        return []


# Prompt functions
def get_prompt(prompt_id: int, include_runs = False) -> dict:
    try:
        with get_db_session() as db:
            prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                return False
            prompt_dict = prompt.to_dict()

            versions = db.query(PromptVersion).filter(PromptVersion.prompt_id == prompt_id).order_by(PromptVersion.version_number.desc()).all()
            if not versions:
                prompt_dict['versions'] = []
                return prompt_dict
            
            if "versions" not in prompt_dict:
                prompt_dict['versions'] = []
            for version in versions:
                version_dict = version.to_dict()
                # if include_runs:
                #     version_dict['runs'] = [run.to_dict() for run in version.runs]
                # else:
                #     del version_dict['runs']
                prompt_dict['versions'].append(version_dict)
            return prompt_dict
    except Exception as e:
        logger.error(f"Error getting prompt: {traceback.format_exc()}")
        return False

def get_prompts_by_project(project_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            prompts = db.query(Prompt).filter(Prompt.project_id == project_id).all()
            return [prompt.to_dict() for prompt in prompts]
    except Exception as e:
        logger.error(f"Error getting prompts by project: {traceback.format_exc()}")
        return []

def get_prompts_by_user_email(email: str) -> List[dict]:
    try:
        with get_db_session() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return []
            projects = db.query(Project).filter(Project.user_id == user.id).all()
            project_ids = [p.id for p in projects]
            prompts = db.query(Prompt).filter(Prompt.project_id.in_(project_ids)).all()
            return [prompt.to_dict() for prompt in prompts]
    except Exception as e:
        logger.error(f"Error getting prompts by user email: {traceback.format_exc()}")
        return []
    
def create_prompt(prompt_data: dict, project_id: int) -> bool:
    try:
        with get_db_session() as db:
            prompt_data['project_id'] = project_id
            prompt = Prompt(**prompt_data)
            db.add(prompt)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error creating prompt: {traceback.format_exc()}")
        return False


def create_prompt_with_version(prompt_data: dict) -> bool:
    try:
        with get_db_session() as db:
            prompt = Prompt(**prompt_data)
            db.add(prompt)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error creating prompt with version: {traceback.format_exc()}")
        return False

def set_prompt_version(prompt_data: dict) -> bool:
    try:
        prompt_id = prompt_data.get("id")
        with get_db_session() as db:
            prompt_version = db.query(PromptVersion).filter(PromptVersion.id == prompt_id).first() if prompt_id else None
            if not prompt_version:
                prompt_version = PromptVersion(**prompt_data)
                db.add(prompt_version)
                db.commit()
                return True
            for key, value in prompt_data.items():
                if hasattr(prompt_version, key):
                    setattr(prompt_version, key, value)
            db.add(prompt_version)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting prompt: {traceback.format_exc()}")
        return False

# def set_prompts(prompts_data: List[dict]) -> bool:
#     try:
#         with get_db_session() as db:
#             for prompt_data in prompts_data:
#                 set_prompt(prompt_data)
#             db.commit()
#             return True
#     except Exception as e:
#         logger.error(f"Error setting prompts: {traceback.format_exc()}")
#         return False

def delete_prompt(prompt_id: int) -> bool:
    try:
        with get_db_session() as db:
            prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
            if not prompt:
                return False
            db.delete(prompt)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting prompt: {traceback.format_exc()}")
        return False

def get_prompt_versions(prompt_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            versions = db.query(PromptVersion).filter(PromptVersion.prompt_id == prompt_id).all()
            return [version.to_dict() for version in versions]
    except Exception as e:
        logger.error(f"Error getting prompt versions: {traceback.format_exc()}")
        return []

# PromptVersion functions
def get_prompt_version(version_id: int) -> dict:
    try:
        with get_db_session() as db:
            version = db.query(PromptVersion).filter(PromptVersion.id == version_id).first()
            if not version:
                return False
            return version.to_dict()
    except Exception as e:
        logger.error(f"Error getting prompt version: {traceback.format_exc()}")
        return False

def get_prompt_versions_by_prompt(prompt_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            versions = db.query(PromptVersion).filter(PromptVersion.prompt_id == prompt_id).all()
            return [version.to_dict() for version in versions]
    except Exception as e:
        logger.error(f"Error getting prompt versions by prompt: {traceback.format_exc()}")
        return []

def set_prompt_version(version_data: dict, latest_version: bool = True) -> bool:
    try:
        version_id = version_data.get("id")
        logger.debug(f"Setting prompt version: {version_id}")
        with get_db_session() as db:
            if latest_version:
                version = db.query(PromptVersion).filter(PromptVersion.prompt_id == version_data.get("prompt_id")).order_by(PromptVersion.version_number.desc()).first()
            else:
                version = db.query(PromptVersion).filter(PromptVersion.id == version_id).first() if version_id else None
            if not version:
                logger.debug(f"Creating new prompt version: {version_data}")
                version = PromptVersion(**version_data)
                db.add(version)
                db.commit()
                return True
            logger.debug(f"Updating existing prompt version: {version_data}")
            for key, value in version_data.items():
                if hasattr(version, key):
                    setattr(version, key, value)
            db.add(version)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting prompt version: {traceback.format_exc()}")
        return False

def set_prompt_versions(versions_data: List[dict]) -> bool:
    try:
        with get_db_session() as db:
            for version_data in versions_data:
                set_prompt_version(version_data)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting prompt versions: {traceback.format_exc()}")
        return False

def delete_prompt_version(version_id: int) -> bool:
    try:
        with get_db_session() as db:
            version = db.query(PromptVersion).filter(PromptVersion.id == version_id).first()
            if not version:
                return False
            db.delete(version)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting prompt version: {traceback.format_exc()}")
        return False

def get_version_runs(version_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            runs = db.query(Run).filter(Run.prompt_version_id == version_id).all()
            return [run.to_dict() for run in runs]
    except Exception as e:
        logger.error(f"Error getting version runs: {traceback.format_exc()}")
        return []

# Run functions
def get_run(run_id: int) -> dict:
    try:
        with get_db_session() as db:
            run = db.query(Run).filter(Run.id == run_id).first()
            if not run:
                return False
            return run.to_dict()
    except Exception as e:
        logger.error(f"Error getting run: {traceback.format_exc()}")
        return False

def get_runs_by_user(user_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            runs = db.query(Run).filter(Run.user_id == user_id).all()
            return [run.to_dict() for run in runs]
    except Exception as e:
        logger.error(f"Error getting runs by user: {traceback.format_exc()}")
        return []

def get_runs_by_prompt_version(version_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            runs = db.query(Run).filter(Run.prompt_version_id == version_id).all()
            return [run.to_dict() for run in runs]
    except Exception as e:
        logger.error(f"Error getting runs by prompt version: {traceback.format_exc()}")
        return []

def set_run(run_data: dict) -> bool:
    try:
        run_id = run_data.get("id")
        with get_db_session() as db:
            run = db.query(Run).filter(Run.id == run_id).first() if run_id else None
            if not run:
                run = Run(**run_data)
                db.add(run)
                db.commit()
                return True
            for key, value in run_data.items():
                if hasattr(run, key):
                    setattr(run, key, value)
            db.add(run)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting run: {traceback.format_exc()}")
        return False

def set_runs(runs_data: List[dict]) -> bool:
    try:
        with get_db_session() as db:
            for run_data in runs_data:
                set_run(run_data)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error setting runs: {traceback.format_exc()}")
        return False

def delete_run(run_id: int) -> bool:
    try:
        with get_db_session() as db:
            run = db.query(Run).filter(Run.id == run_id).first()
            if not run:
                return False
            db.delete(run)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting run: {traceback.format_exc()}")
        return False


def get_project_testsets(project_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            testsets = db.query(TestSet).filter(TestSet.project_id == project_id).all()
            result = [testset.to_dict() for testset in testsets]
            logger.debug(f"Testsets: {result}")
            return result
    except Exception as e:
        logger.error(f"Error getting project tests: {traceback.format_exc()}")
        return []


def get_tests_from_testset(testset_id: int) -> List[dict]:
    try:
        with get_db_session() as db:
            testset = db.query(TestSet).filter(TestSet.id == testset_id).first()
            if not testset:
                return []
            return testset.tests
    except Exception as e:
        logger.error(f"Error getting tests from testset: {traceback.format_exc()}")
        return []
    
def create_testset(testset_data: dict) -> bool:
    try:
        with get_db_session() as db:
            testset = TestSet(**testset_data)
            db.add(testset)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error creating testset: {traceback.format_exc()}")
        return False
    
def add_test_to_testset(testset_id: int, test_prompt) -> bool:
    """
    Creates a new test inside existing testset
    """
    try:
        with get_db_session() as db:
            testset = db.query(TestSet).filter(TestSet.id == testset_id).first()
            if not testset:
                return False
            if testset.tests is None:
                testset.tests = []
            logger.debug(f"Testset tests before adding new one {testset.tests}")
            testset.tests.append({"prompt": test_prompt, "id": len(testset.tests)})
            flag_modified(testset, "tests")
            db.commit()
            logger.debug(f"Testset after adding test: {testset.to_dict()}")
            return True
    except Exception as e:
        logger.error(f"Error adding test to testset: {traceback.format_exc()}")
        return False
    

def delete_test_from_testset(testset_id: int, test_id: int) -> bool:
    try:
        with get_db_session() as db:
            testset = db.query(TestSet).filter(TestSet.id == testset_id).first()
            if not testset:
                return False
            testset.tests = [i for i in testset.tests if i["id"] != test_id]
            flag_modified(testset, "tests")
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting test from testset: {traceback.format_exc()}")
        return False

def delete_testset(testset_id: int) -> bool:
    try:
        with get_db_session() as db:
            testset = db.query(TestSet).filter(TestSet.id == testset_id).first()
            if not testset:
                return False
            db.delete(testset)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting testset: {traceback.format_exc()}")
        return False
