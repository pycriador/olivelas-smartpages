"""
Hierarchical Based Access Control (HBAC) Service for AIOps OpsPages.
Handles role inheritance and permission evaluations across users, groups, and projects.
Roles:
  - admin (Rank 3): Full control over project, lock/unlock versions, settings, permissions, tokens, quotas.
  - editor (Rank 2): Upload builds, approve/publish releases (when unlocked), rollback, sync Git.
  - viewer (Rank 1): Read-only access to project dashboard, builds, file explorer, Git history, and previews.
"""
from __future__ import annotations

from typing import Dict, Optional
from app.models.meta_models import User

ROLE_HIERARCHY: Dict[str, int] = {
    "admin": 3,
    "editor": 2,
    "developer": 2,  # Alias compatibility
    "viewer": 1,
}


class HBACService:
    @staticmethod
    def normalize_role(role_name: str) -> str:
        clean = (role_name or "").strip().lower()
        if clean in ("developer", "editor", "write"):
            return "editor"
        if clean in ("admin", "superadmin", "owner"):
            return "admin"
        return "viewer"

    @classmethod
    def get_role_rank(cls, role_name: str) -> int:
        return ROLE_HIERARCHY.get(cls.normalize_role(role_name), 0)

    @classmethod
    def get_effective_project_role(
        cls,
        user: User,
        project_id: int,
        created_by: Optional[int] = None,
    ) -> Optional[str]:
        """
        Determines the highest effective role for a user on a given project,
        taking into account superuser status, project creator ownership,
        global group role levels, direct project permissions, and group project permissions.
        """
        if user.is_superuser:
            return "admin"

        if created_by is not None and user.id == created_by:
            return "admin"

        highest_rank = 0
        effective_role = None

        # Check global group membership role_level (admin, editor, viewer)
        for group in user.groups:
            norm_role = cls.normalize_role(group.role_level)
            group_rank = cls.get_role_rank(norm_role)
            if group_rank > highest_rank:
                highest_rank = group_rank
                effective_role = norm_role

        # Check direct user permissions on project
        for perm in user.permissions:
            if perm.project_id == project_id:
                norm_role = cls.normalize_role(perm.role)
                rank = cls.get_role_rank(norm_role)
                if rank > highest_rank:
                    highest_rank = rank
                    effective_role = norm_role

        # Check group-level permissions on project
        for group in user.groups:
            for perm in group.permissions:
                if perm.project_id == project_id:
                    norm_role = cls.normalize_role(perm.role)
                    rank = cls.get_role_rank(norm_role)
                    if rank > highest_rank:
                        highest_rank = rank
                        effective_role = norm_role

        return effective_role

    @classmethod
    def has_project_access(
        cls,
        user: User,
        project_id: int,
        required_role: str = "viewer",
        created_by: Optional[int] = None,
    ) -> bool:
        """
        Returns True if the user has at least the required role on the project.
        """
        if user.is_superuser:
            return True

        effective_role = cls.get_effective_project_role(user, project_id, created_by=created_by)
        if not effective_role:
            return False

        effective_rank = cls.get_role_rank(effective_role)
        required_rank = cls.get_role_rank(required_role)
        return effective_rank >= required_rank
