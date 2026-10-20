"""
Audit Service for AIOps OpsPages.
Records all system mutations (projects, builds, approvals, locks, permissions, tokens)
and provides filtered forensic audit logs.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple
from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.meta_models import AuditLog

logger = logging.getLogger("aiops.opspages.audit")


class AuditService:
    @classmethod
    def extract_client_info(cls, request: Optional[Request]) -> Tuple[Optional[str], Optional[str]]:
        if not request:
            return None, None
        ip = request.headers.get("x-forwarded-for")
        if ip:
            ip = ip.split(",")[0].strip()
        elif request.client:
            ip = request.client.host
        user_agent = request.headers.get("user-agent")
        return ip, user_agent

    @classmethod
    def log_request(
        cls,
        request: Optional[Request],
        db: Session,
        action: str,
        resource_type: str,
        actor_id: Optional[int] = None,
        actor_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        project_id: Optional[int] = None,
        diff: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        ip, ua = cls.extract_client_info(request)
        return cls.log(
            db=db,
            action=action,
            resource_type=resource_type,
            actor_id=actor_id,
            actor_email=actor_email,
            resource_id=resource_id,
            project_id=project_id,
            ip_address=ip,
            user_agent=ua,
            diff=diff,
        )

    @staticmethod
    def log(
        db: Session,
        action: str,
        resource_type: str,
        actor_id: Optional[int] = None,
        actor_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        project_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        diff: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """Records a forensic audit log entry in the metadata database."""
        if request:
            req_ip, req_ua = AuditService.extract_client_info(request)
            if not ip_address:
                ip_address = req_ip
            if not user_agent:
                user_agent = req_ua

        res_id_str = str(resource_id) if resource_id is not None else None
        entry = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=res_id_str,
            project_id=project_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        if diff:
            entry.set_diff(diff)

        try:
            db.add(entry)
            db.commit()
            return entry
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record audit log: {e}")
            return entry

    @staticmethod
    def list_logs(
        db: Session,
        project_id: Optional[int] = None,
        actor_id: Optional[int] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[AuditLog], int]:
        """Queries audit logs with filtering and pagination."""
        query = db.query(AuditLog)

        if project_id is not None:
            query = query.filter(AuditLog.project_id == project_id)
        if actor_id is not None:
            query = query.filter(AuditLog.actor_id == actor_id)
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)

        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
        return logs, total
