import sys
import os
import threading
import uvicorn
import loguru

logger = loguru.logger

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

if __name__ == "__main__":    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)