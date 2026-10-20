"""
User Management Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.core.security import hash_password
from app.db.session import get_meta_db
from app.models.meta_models import Group, User
from app.schemas.auth import UserCreate, UserResponse, UserUpdate
from app.services.audit_service import AuditService
from app.services.auth_service import get_current_user, require_superuser

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> List[UserResponse]:
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserCreate,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
) -> UserResponse:
    existing = (
        db.query(User)
        .filter((User.username == req.username.strip()) | (User.email == req.email.strip()))
        .first()
    )
    if existing:
        raise ConflictError("User with this username or email already exists.")

    new_user = User(
        username=req.username.strip().lower(),
        email=req.email.strip().lower(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
        is_active=req.is_active,
        is_superuser=req.is_superuser,
    )

    if req.group_ids:
        groups = db.query(Group).filter(Group.id.in_(req.group_ids)).all()
        new_user.groups = groups
    elif req.role:
        grp = db.query(Group).filter(Group.role_level == req.role).first()
        if grp:
            new_user.groups = [grp]

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CREATE_USER",
        resource_type="user",
        resource_id=str(new_user.id),
        diff={
            "username": new_user.username,
            "email": new_user.email,
            "is_superuser": new_user.is_superuser,
            "group_ids": req.group_ids,
        },
    )
    return UserResponse.model_validate(new_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found.")
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    req: UserUpdate,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found.")

    diff = {}
    if req.email is not None:
        diff["email"] = {"old": user.email, "new": req.email}
        user.email = req.email.strip().lower()
    if req.full_name is not None:
        user.full_name = req.full_name.strip()
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.is_superuser is not None:
        user.is_superuser = req.is_superuser
        diff["is_superuser"] = req.is_superuser
    if req.password:
        user.hashed_password = hash_password(req.password)
        diff["password"] = "changed"
    if req.group_ids is not None:
        groups = db.query(Group).filter(Group.id.in_(req.group_ids)).all()
        user.groups = groups
        diff["group_ids"] = req.group_ids
    elif req.role is not None:
        grp = db.query(Group).filter(Group.role_level == req.role).first()
        if grp:
            user.groups = [grp]
            diff["role"] = req.role

    db.commit()
    db.refresh(user)

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="UPDATE_USER",
        resource_type="user",
        resource_id=str(user.id),
        diff=diff,
    )
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_superuser),
    db: Session = Depends(get_meta_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found.")
    if user.id == current_user.id:
        raise ConflictError("You cannot delete your own user account.")

    username = user.username
    db.delete(user)
    db.commit()

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="DELETE_USER",
        resource_type="user",
        resource_id=str(user_id),
        diff={"username": username},
    )
    return {"success": True, "message": f"User '{username}' deleted successfully."}
