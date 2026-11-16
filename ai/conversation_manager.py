"""
AstroKites / AgriNova - Conversation Session Manager
Maintains in-memory thread-safe conversation memory across website navigation.
Remembers previously referenced locations, variables, and periods.
"""

import time
import uuid
import threading
from typing import Dict, List, Optional, Any
from schemas.chatbot_schemas import PageContext

# Maximum history entries per session to avoid token exhaustion
MAX_HISTORY_MESSAGES = 20
SESSION_TTL_SECONDS = 7200  # 2 hours


class ConversationSession:
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.created_at = time.time()
        self.last_active = time.time()
        self.messages: List[Dict[str, Any]] = []
        self.last_location: Optional[str] = None
        self.last_variable: Optional[str] = None
        self.last_evidence: Optional[Dict[str, Any]] = None
        self.feedback: List[Dict[str, Any]] = []

    def touch(self):
        self.last_active = time.time()

    def add_message(
        self,
        role: str,
        content: Optional[str] = None,
        name: Optional[str] = None,
        tool_call_id: Optional[str] = None,
        tool_calls: Optional[List[Dict[str, Any]]] = None
    ):
        msg: Dict[str, Any] = {"role": role}
        if content is not None:
            msg["content"] = content
        if name:
            msg["name"] = name
        if tool_call_id:
            msg["tool_call_id"] = tool_call_id
        if tool_calls:
            msg["tool_calls"] = tool_calls

        self.messages.append(msg)
        self.touch()

        # Trim messages if history grows too long, preserving conversation sense
        if len(self.messages) > MAX_HISTORY_MESSAGES + 5:
            # Keep first 2 messages if they provide baseline context, and recent history
            self.messages = self.messages[-MAX_HISTORY_MESSAGES:]


class ConversationManager:
    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}
        self._lock = threading.Lock()

    def get_or_create(self, conversation_id: Optional[str] = None) -> ConversationSession:
        with self._lock:
            cid = conversation_id.strip() if conversation_id and conversation_id.strip() else str(uuid.uuid4())
            if cid not in self._sessions:
                self._sessions[cid] = ConversationSession(cid)
            session = self._sessions[cid]
            session.touch()
            return session

    def get_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        with self._lock:
            sess = self._sessions.get(conversation_id)
            return list(sess.messages) if sess else []

    def clear(self, conversation_id: str) -> bool:
        with self._lock:
            if conversation_id in self._sessions:
                del self._sessions[conversation_id]
                return True
            return False

    def cleanup_expired(self):
        with self._lock:
            now = time.time()
            expired = [cid for cid, s in self._sessions.items() if now - s.last_active > SESSION_TTL_SECONDS]
            for cid in expired:
                del self._sessions[cid]


# Global singleton instance
conversation_manager = ConversationManager()
