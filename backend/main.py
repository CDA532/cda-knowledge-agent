from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
from drive_service import DriveService
from auth import verify_google_token
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class SearchRequest(BaseModel):
    query: str
    token: str
    file_type: Optional[str] = None

class SearchResponse(BaseModel):
    ai_answer: str
    documents: list

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    user = verify_google_token(req.token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    drive_service = DriveService(access_token=req.token)
    files = drive_service.search(req.query, file_type=req.file_type)
    if not files:
        return SearchResponse(ai_answer="No documents found. Try different keywords.", documents=[])
    doc_context = ""
    results = []
    for f in files[:5]:
        content = drive_service.get_content(f["id"], f["mimeType"])
        snippet = content[:800] if content else "(no preview)"
        doc_context += "\n\n--- " + f["name"] + " ---\n" + snippet
        results.append({"id": f["id"], "name": f["name"], "mime_type": f["mimeType"], "web_view_link": f.get("webViewLink",""), "modified_time": f.get("modifiedTime",""), "snippet": snippet[:200]})
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=500, messages=[{"role":"user","content":"You are the AI assistant for Coastal Dental Arts. Answer this staff question: " + req.query + "\n\nDocuments:\n" + doc_context + "\n\nGive a helpful 2-4 sentence answer using only the documents."}])
    return SearchResponse(ai_answer=message.content[0].text, documents=results)
