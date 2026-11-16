"""
AstroKites / AgriNova - Chatbot Router
FastAPI endpoints for conversational climate intelligence, streaming, history, and feedback.
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from schemas.chatbot_schemas import (
    ChatRequest,
    ChatResponse,
    ChatFeedbackRequest
)
from ai.agent import climate_agent
from ai.conversation_manager import conversation_manager

router = APIRouter(prefix="/api/chat", tags=["Climate Intelligence Chatbot"])


@router.post("", response_model=ChatResponse)
def handle_chat_message(req: ChatRequest):
    """
    Main conversational endpoint. Evaluates query against website context,
    triggers real backend tools, and returns evidence-grounded answers with citations.
    """
    try:
        response = climate_agent.process_chat(
            user_message=req.message,
            context=req.context,
            conversation_id=req.conversation_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.post("/stream")
def handle_chat_stream(req: ChatRequest):
    """
    Streaming endpoint. Executes tools and streams the final grounded response tokens.
    """
    # For robust tool-calling with multiple steps, we process tools first and stream the structured result
    def event_stream():
        try:
            resp = climate_agent.process_chat(
                user_message=req.message,
                context=req.context,
                conversation_id=req.conversation_id
            )
            # Emit token chunks
            text = resp.message
            chunk_size = 20
            for i in range(0, len(text), chunk_size):
                token = text[i:i + chunk_size]
                data = json.dumps({"delta": token, "conversation_id": resp.conversation_id})
                yield f"data: {data}\n\n"

            # Emit final payload with verified metadata & sources
            final_data = json.dumps({
                "done": True,
                "conversation_id": resp.conversation_id,
                "sources": resp.sources,
                "metrics": resp.metrics,
                "evidence_data": resp.evidence_data,
                "visualization_type": resp.visualization_type,
                "tool_calls_executed": resp.tool_calls_executed
            })
            yield f"data: {final_data}\n\n"
        except Exception as e:
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history/{conversation_id}")
def get_chat_history(conversation_id: str):
    """
    Retrieves previous conversation messages for an active session.
    """
    messages = conversation_manager.get_messages(conversation_id)
    return {
        "status": "success",
        "conversation_id": conversation_id,
        "count": len(messages),
        "messages": messages
    }


@router.delete("/history/{conversation_id}")
def delete_chat_history(conversation_id: str):
    """
    Deletes session memory for the specified conversation.
    """
    deleted = conversation_manager.clear(conversation_id)
    return {
        "status": "success",
        "conversation_id": conversation_id,
        "cleared": deleted
    }


@router.post("/feedback")
def submit_chat_feedback(req: ChatFeedbackRequest):
    """
    Records user satisfaction feedback on AI responses.
    """
    session = conversation_manager.get_or_create(req.conversation_id)
    session.feedback.append({
        "message_id": req.message_id,
        "rating": req.rating,
        "comment": req.comment
    })
    return {"status": "success", "message": "Feedback recorded. Thank you!"}
