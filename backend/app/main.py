from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import loguru
import os
import threading
import uvicorn
from sqlalchemy import inspect
from app.middleware.auth import JWTAuthMiddleware

from app.db.session import engine
from app.db.functions import get_db_session

logger = loguru.logger

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import register_routes

register_routes(app)

app.add_middleware(JWTAuthMiddleware)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/debug/routes")
async def debug_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": [method for method in route.methods] if route.methods else [],
        })
    return routes

@app.get("/debug/db")
async def debug_db(db = Depends(get_db_session)):
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    table_info = {}
    
    for table in tables:
        columns = inspector.get_columns(table)
        table_info[table] = [column['name'] for column in columns]
    
    row_counts = {}
    for table in tables:
        try:
            result = db.execute(f"SELECT COUNT(*) FROM {table}")
            count = result.scalar()
            row_counts[table] = count
        except Exception as e:
            row_counts[table] = f"Error: {str(e)}"
    
    return {
        "tables": tables,
        "table_info": table_info,
        "row_counts": row_counts
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)