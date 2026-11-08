"""
AgentChain AI - Root API Launcher
Allows starting the FastAPI backend directly from the repository root.
"""
import sys
import os
import importlib.util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(BASE_DIR, "services", "api")

if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

os.chdir(API_DIR)

spec = importlib.util.spec_from_file_location("api_main", os.path.join(API_DIR, "main.py"))
api_module = importlib.util.module_from_spec(spec)
sys.modules["api_main"] = api_module
spec.loader.exec_module(api_module)

app = api_module.app
settings = api_module.settings

if __name__ == "__main__":
    import uvicorn
    print(f"Starting AgentChain AI API on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
