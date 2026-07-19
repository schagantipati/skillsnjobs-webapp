"""
AI Feature 1: Resume/CV Parser
Extracts structured profile data from uploaded PDF/DOCX resume text.
"""
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import auth_required

router = APIRouter(prefix="/api/ai/resume", tags=["ai"])


class ResumeIn(BaseModel):
    text: str  # Raw text extracted from the resume on the frontend


SYSTEM_PROMPT = """You are a resume parser. Extract structured information from the resume text and return ONLY a JSON object with these fields:
{
  "first_name": "", "last_name": "", "email": "", "phone": "",
  "skills": [],
  "experience_years": 0,
  "qualification": "",
  "city": "", "state_name": "",
  "employment_status": "",
  "preferred_sector": "",
  "bio": "",
  "experience": [{"org": "", "role": "", "from_date": "", "to_date": "", "sector": ""}],
  "education": [{"degree": "", "institution": "", "year": "", "score": ""}]
}
Return ONLY valid JSON, no markdown, no explanation."""


@router.post("/parse")
async def parse_resume(body: ResumeIn, user: dict = Depends(auth_required)):
    if not body.text or len(body.text.strip()) < 50:
        raise HTTPException(400, detail="Resume text too short to parse")

    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback: return basic extraction without AI
        return {"parsed": {}, "message": "AI API key not configured. Please add ANTHROPIC_API_KEY to .env"}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Parse this resume:\n\n{body.text[:6000]}"}],
        )
        raw = msg.content[0].text.strip()
        parsed = json.loads(raw)
        return {"parsed": parsed}
    except Exception as e:
        raise HTTPException(500, detail=f"Resume parsing failed: {str(e)}")


@router.post("/parse-url")
async def parse_resume_url(body: dict, user: dict = Depends(auth_required)):
    """Parse a resume from a base64-encoded PDF/DOCX blob sent by the frontend."""
    content_type = body.get("content_type", "")
    b64_data = body.get("data", "")
    if not b64_data:
        raise HTTPException(400, detail="No file data provided")

    # Extract text using PyPDF2 or python-docx
    import base64, io
    raw_bytes = base64.b64decode(b64_data)

    text = ""
    if "pdf" in content_type or b64_data[:10].startswith("JVBERi"):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(raw_bytes))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(400, detail=f"PDF extraction failed: {e}")
    elif "word" in content_type or "docx" in content_type:
        try:
            from docx import Document
            doc = Document(io.BytesIO(raw_bytes))
            text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise HTTPException(400, detail=f"DOCX extraction failed: {e}")
    else:
        raise HTTPException(400, detail="Only PDF and DOCX files are supported")

    if len(text.strip()) < 50:
        raise HTTPException(400, detail="Could not extract enough text from the file")

    # Reuse the text parser
    from fastapi import Request
    return await parse_resume(ResumeIn(text=text), user)
