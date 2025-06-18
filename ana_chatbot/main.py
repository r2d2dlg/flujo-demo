from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
from chatbot import AnaChatbot

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Load Ana's knowledge base
with open("../vertex_ai_db_context.md", "r", encoding="utf-8") as f:
    ANA_CONTEXT = f.read()

# Initialize the chatbot
chatbot = AnaChatbot(ANA_CONTEXT)

class ChatMessage(BaseModel):
    message: str

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        "chat.html",
        {"request": request}
    )

@app.post("/chat")
async def chat(message: ChatMessage):
    response = await chatbot.get_response(message.message)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 