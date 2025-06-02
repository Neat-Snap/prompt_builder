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

    logger.info(f"Registered all {len(app.routes)} routes")
    
    return app