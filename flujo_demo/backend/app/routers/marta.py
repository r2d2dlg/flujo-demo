import os
import sys
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

# Add martamaria to the Python path to allow direct imports
# This navigates from backend/app/routers -> backend/app -> backend -> root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
martamaria_path = os.path.join(project_root, 'martamaria')
if martamaria_path not in sys.path:
    sys.path.insert(0, martamaria_path)

# Now attempt the import
try:
    from marta_core.agent import initialize_agent
except ImportError as e:
    print(f"CRITICAL ERROR: Could not import marta_core modules. Details: {e}")
    # Define a placeholder if the import fails so the app can still start
    def initialize_agent():
        raise RuntimeError("Agent dependencies are not correctly installed or configured.")

router = APIRouter()

# Use a simple class to hold the agent instance
class AgentSingleton:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            print("Initializing Marta agent for the first time in FastAPI...")
            try:
                cls._instance = initialize_agent()
                print("Marta agent initialized successfully.")
            except Exception as e:
                print(f"Error initializing Marta agent: {e}")
                # Raise an exception that can be caught during the request
                raise RuntimeError(f"Could not initialize AI Assistant: {e}")
        return cls._instance

class ChatRequest(BaseModel):
    input: str

@router.post("/marta/chat", tags=["AI Assistant"])
async def chat_with_marta(request: ChatRequest = Body(...)):
    try:
        marta_agent = AgentSingleton.get_instance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not request.input:
        raise HTTPException(status_code=400, detail="No input provided")

    try:
        print(f"Received for Analysis from FastAPI endpoint: {request.input}")
        # Using ainvoke for async compatibility with FastAPI
        response = await marta_agent.ainvoke({"input": request.input})
        ai_reply = response.get('output', 'Could not get a response.')
        print(f"Reply from Marta: {ai_reply}")
        return {"output": ai_reply}
    except Exception as e:
        print(f"Error processing request with Marta: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error while processing request: {e}") 