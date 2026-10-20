"""
HBAC Groups Management Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.db.session import get_meta_db
from app.models.meta_models import Group, User
from app.schemas.auth import GroupCreate, GroupResponse, GroupUpdate
from app.services.audit_service import AuditService
from app.services.auth_service import get_current_user, require_superuser
from app.services.hbac_service import HBACService

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.get("", response_model=List[GroupResponse])
def list_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> List[GroupResponse]:
    groups = db.query(Group).order_by(Group.id.asc()).all()
    return [GroupResponse.model_validate(g) for g in groups]


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    req: GroupCreate,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
) -> GroupResponse:
    existing = db.query(Group).filter(Group.name == req.name.strip()).first()
    if existing:
        raise ConflictError("A group with this name already exists.")

    group = Group(
        name=req.name.strip(),
        description=req.description.strip(),
        role_level=HBACService.normalize_role(req.role_level),
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CREATE_GROUP",
        resource_type="group",
        resource_id=str(group.id),
        diff={"name": group.name, "role_level": group.role_level},
    )
    return GroupResponse.model_validate(group)


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    req: GroupUpdate,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
) -> GroupResponse:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise NotFoundError("Group not found.")

    diff = {}
    if req.name is not None:
        diff["name"] = {"old": group.name, "new": req.name}
        group.name = req.name.strip()
    if req.description is not None:
        group.description = req.description.strip()
    if req.role_level is not None:
        norm = HBACService.normalize_role(req.role_level)
        diff["role_level"] = {"old": group.role_level, "new": norm}
        group.role_level = norm

    db.commit()
    db.refresh(group)

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="UPDATE_GROUP",
        resource_type="group",
        resource_id=str(group.id),
        diff=diff,
    )
    return GroupResponse.model_validate(group)


@router.delete("/{group_id}", status_code=status.HTTP_200_OK)
def delete_group(
    group_id: int,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise NotFoundError("Group not found.")

    group_name = group.name
    db.delete(group)
    db.commit()

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="DELETE_GROUP",
        resource_type="group",
        resource_id=str(group_id),
        diff={"deleted_group": group_name},
    )
    return {"success": True, "message": f"Group '{group_name}' deleted successfully."}
