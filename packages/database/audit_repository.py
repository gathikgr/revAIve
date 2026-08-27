"""
revAIve — Immutable Audit Event Repository
Append-oriented interface capturing actor, entity, state transitions, and metadata.
Strictly forbids UPDATE and DELETE operations.
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from packages.database.models import AuditEvent


class AuditRepository:
    @staticmethod
    def log_event(
        db: Session,
        actor_type: str,
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        """Appends an immutable audit event record."""
        audit_entry = AuditEvent(
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before_state,
            after_state=after_state,
            metadata_json=metadata
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def get_entity_history(db: Session, entity_type: str, entity_id: str) -> List[AuditEvent]:
        """Retrieves chronological audit trail for a specific entity."""
        return (
            db.query(AuditEvent)
            .filter(AuditEvent.entity_type == entity_type, AuditEvent.entity_id == entity_id)
            .order_by(AuditEvent.timestamp.asc())
            .all()
        )
