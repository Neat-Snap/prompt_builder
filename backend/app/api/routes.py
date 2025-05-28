from fastapi import FastAPI
import loguru

logger = loguru.logger


def register_routes(app: FastAPI):
    from app.api.auth import router as auth_router
    from app.api.users import router as users_router
    from app.api.llm import router as llm_router
    from app.api.tests import router as tests_router
    
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(llm_router)
    app.include_router(tests_router)

    logger.info(f"Registered auth router: {auth_router.prefix}")
    logger.info(f"Registered users router: {users_router.prefix}")
    logger.info(f"Registered llm router: {llm_router.prefix}")
    logger.info(f"Registered tests router: {tests_router.prefix}")
    
    return app