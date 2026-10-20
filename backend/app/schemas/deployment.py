"""
Pydantic v2 Schemas for Deployments, Builds, File Explorer, and Git /repos Operations.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DeploymentResponse(BaseModel):
    id: int
    project_id: int
    version: str
    git_commit_sha: Optional[str] = None
    git_tag: Optional[str] = None
    git_branch: str
    release_notes: str
    status: str
    source: str
    file_count: int
    size_bytes: int
    checksum_sha256: Optional[str] = None
    entry_file: str
    created_by: Optional[int] = None
    created_by_email: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    preview_url: str = ""
    is_live: bool = False
    is_locked_version: bool = False
    model_config = ConfigDict(from_attributes=True)


class DeploymentApproveRequest(BaseModel):
    publish_immediately: bool = True
    notes: Optional[str] = Field(default="", max_length=500)


class DeploymentPublishRequest(BaseModel):
    lock_this_version: bool = False
    reason: Optional[str] = Field(default="", max_length=500)


class QuickHtmlDeployRequest(BaseModel):
    version: Optional[str] = Field(None, pattern="^[a-zA-Z0-9._-]+$")
    release_notes: str = Field(default="Build criada via Editor Rápido", max_length=1000)
    files: Dict[str, str] = Field(
        default_factory=dict,
        description=(
            "Map of relative file paths (e.g., 'index.html', 'assets/style.css', 'assets/logo.png') to contents. "
            "Supports UTF-8 text strings as well as binary files encoded with 'base64:<payload>' or 'data:<mime>;base64,<payload>' (P-12)."
        ),
    )
    binary_files: Optional[Dict[str, str]] = Field(
        default=None,
        description=(
            "Optional map of relative binary file paths (e.g., 'assets/hero.png', 'fonts/inter.woff2') "
            "to Base64-encoded binary payloads (P-12)."
        ),
    )


class BuildFileNode(BaseModel):
    name: str
    path: str
    type: str  # file | directory
    size_bytes: int = 0
    extension: Optional[str] = None
    children: Optional[List["BuildFileNode"]] = None


class BuildFileContentResponse(BaseModel):
    version: str
    path: str
    size_bytes: int
    is_binary: bool
    mime_type: str
    content: Optional[str] = None


class GitCommitItem(BaseModel):
    sha: str
    short_sha: str
    author_name: str
    author_email: str
    date: str
    message: str
    tags: List[str] = Field(default_factory=list)


class GitDiffItem(BaseModel):
    status: str  # A (Added), M (Modified), D (Deleted), R (Renamed)
    path: str


class GitRepoStatusResponse(BaseModel):
    project_slug: str
    repo_path: str
    github_subpath: str
    initialized: bool
    current_branch: str
    head_sha: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    total_commits: int = 0
    github_repo_url: Optional[str] = None
    auto_sync_github: bool = False
    commits: List[GitCommitItem] = Field(default_factory=list)


class GitDiffResponse(BaseModel):
    base_version: str
    target_version: str
    files_changed: List[GitDiffItem] = Field(default_factory=list)
    diff_text: str = ""


class GitSyncRequest(BaseModel):
    direction: str = Field(default="push", pattern="^(push|pull|status)$")
    remote_url: Optional[str] = None
    branch: Optional[str] = None
