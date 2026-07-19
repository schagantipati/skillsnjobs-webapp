"""
AI Feature 5: Chatbot / Q&A Assistant
Answers user questions about the platform, job search, training, and career guidance.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import auth_required

router = APIRouter(prefix="/api/ai/chatbot", tags=["ai"])


SYSTEM_PROMPT = """You are SkillBot, a helpful assistant for the SkillsNJobs platform — a government-aligned skills development and job placement portal in India.

You help:
- Candidates: find jobs, understand skill requirements, enroll in courses, track applications
- Trainers: manage batches, track attendance, run assessments
- Employers: post jobs, find candidates, understand match scores
- Training Vendors: onboard, manage centres, trainers, batches, and candidates
- State Government users: track training partners, candidates, disbursements, MIS reports
- CSR Organisations: manage CSR projects, beneficiaries, and disbursements
- Placement Agencies: record and track placements

Keep responses concise, helpful, and action-oriented. If you don't know something specific about the platform, say so honestly.
Do not provide legal, financial, or medical advice. Refer users to platform administrators for account issues."""


class ChatMessage(BaseModel):
    message: str
    history: list = []  # [{"role": "user"|"assistant", "content": "..."}]


@router.post("/chat")
async def chat(body: ChatMessage, user: dict = Depends(auth_required)):
    if not body.message or not body.message.strip():
        raise HTTPException(400, detail="Message cannot be empty")
    if len(body.message) > 2000:
        raise HTTPException(400, detail="Message too long (max 2000 characters)")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "reply": "I'm SkillBot! My AI capabilities require configuration. Please ask your administrator to add the ANTHROPIC_API_KEY to the server's .env file. In the meantime, please check the platform documentation or contact support.",
            "role": user["role"],
        }

    # Build conversation history (last 10 turns to stay within context)
    messages = []
    for turn in body.history[-10:]:
        if turn.get("role") in ["user", "assistant"] and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    # Add role context to the user message
    role_context = f"[User role: {user['role']}] "
    messages.append({"role": "user", "content": role_context + body.message})

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply = msg.content[0].text.strip()
        return {"reply": reply, "role": user["role"]}
    except Exception as e:
        raise HTTPException(500, detail=f"Chatbot error: {str(e)}")


@router.get("/suggestions")
async def chat_suggestions(user: dict = Depends(auth_required)):
    """Return role-appropriate starter questions for the chatbot UI."""
    suggestions = {
        "candidate": [
            "What jobs match my skills?",
            "How do I improve my match score?",
            "How do I enroll in a course?",
            "How do I track my job applications?",
        ],
        "trainer": [
            "How do I add learners to my batch?",
            "How do I mark attendance?",
            "What is the dropout risk feature?",
            "How do I create an assessment?",
        ],
        "employer": [
            "How do I post a job?",
            "How does candidate matching work?",
            "How do I shortlist candidates?",
            "What does the match score mean?",
        ],
        "training_vendor": [
            "How do I add a training centre?",
            "How do I onboard candidates?",
            "How do I schedule an assessment?",
            "What is the collaboration feature?",
        ],
        "state_government": [
            "How do I register a training partner?",
            "How do I track candidate outcomes?",
            "How do I record a disbursement?",
            "How do I view the MIS report?",
        ],
        "csr_org": [
            "How do I create a CSR project?",
            "How do I add beneficiaries?",
            "How do I track disbursements?",
            "How do I link with training partners?",
        ],
        "placement_agency": [
            "How do I record a placement?",
            "How do I track my placement stats?",
            "How do I find candidates for employers?",
        ],
    }
    default = ["How do I use this platform?", "What features are available for me?", "How do I update my profile?"]
    return {"suggestions": suggestions.get(user["role"], default)}
