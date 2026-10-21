"""
Pydantic v2 Schemas for Quotas, CORS, and Audit Logs.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer


# Quotas
class QuotaUpdateRequest(BaseModel):
    max_build_size_mb: Optional[int] = Field(None, ge=5, le=5000)
    max_storage_mb: Optional[int] = Field(None, ge=50, le=1048576)
    max_deploys_per_day: Optional[int] = Field(None, ge=1, le=10000)
    max_retained_versions: Optional[int] = Field(None, ge=1, le=1000)


class QuotaResponse(BaseModel):
    id: int
    project_id: int
    max_build_size_mb: int
    max_storage_mb: int
    max_deploys_per_day: int
    max_retained_versions: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class QuotaUsageResponse(BaseModel):
    quota: QuotaResponse
    current_versions: int
    retained_versions: int = 0
    current_storage_mb: float
    deploys_today: int
    version_usage_pct: float
    storage_usage_pct: float
    deploys_today_pct: float


# CORS & Static Headers
class CorsRuleCreateRequest(BaseModel):
    origin: Optional[str] = None
    allowed_origin: Optional[str] = None
    allowed_methods: str = Field(default="GET,HEAD,OPTIONS", max_length=255)
    allowed_headers: str = Field(default="*", max_length=255)
    allow_credentials: bool = False
    max_age_seconds: int = 3600
    cache_control: str = Field(default="public, max-age=3600", max_length=255)
    is_active: bool = True


class CorsRuleUpdateRequest(BaseModel):
    origin: Optional[str] = None
    allowed_origin: Optional[str] = None
    allowed_methods: Optional[str] = None
    allowed_headers: Optional[str] = None
    allow_credentials: Optional[bool] = None
    max_age_seconds: Optional[int] = None
    cache_control: Optional[str] = None
    is_active: Optional[bool] = None


class CorsRuleResponse(BaseModel):
    id: int
    project_id: int
    origin: str
    allowed_origin: str = ""
    allowed_methods: str
    allowed_headers: str
    allow_credentials: bool = False
    max_age_seconds: int = 3600
    cache_control: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_email: Optional[str] = None
    updated_by_email: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", "updated_at")
    def _serialize_utc_z(self, value: Optional[datetime]) -> Optional[str]:
        # On SQLite, `DateTime(timezone=True)` is written tz-aware but read back naive
        # (SQLite has no native tz-aware datetime type), so this would otherwise
        # serialize without a UTC offset/Z suffix despite the value always being UTC
        # (Item P-17).
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# Audit
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    created_at: Optional[datetime] = None
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    auth_method: str = "jwt"
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    project_id: Optional[int] = None
    status_code: int = 200
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    diff: Optional[Dict[str, Any]] = None
    details: Optional[Dict[str, Any]] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)


# Error Reporting & Telemetry (/errors & /api/v1/errors)
class ErrorReportCreateRequest(BaseModel):
    project_id: Optional[int] = None
    project_slug: Optional[str] = Field(default=None, max_length=100)
    page_url: str = Field(..., min_length=1, max_length=1000, description="Full URL or route where the error occurred")
    route_path: Optional[str] = Field(default=None, max_length=500)
    error_code: str = Field(default="ERR_FRONTEND_RUNTIME", max_length=100)
    http_status: Optional[int] = Field(default=None, ge=100, le=599)
    severity: str = Field(default="error", pattern="^(critical|error|warning|info)$")
    title: str = Field(..., min_length=2, max_length=300)
    message: str = Field(default="", max_length=5000)
    stack_trace: Optional[str] = Field(default=None, max_length=20000)
    version: Optional[str] = Field(default=None, max_length=80)
    environment: str = Field(default="production", max_length=50)
    reporter_email: Optional[str] = Field(default=None, max_length=255)


class ErrorReportUpdateRequest(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(open|investigating|resolved|ignored)$")
    severity: Optional[str] = Field(default=None, pattern="^(critical|error|warning|info)$")
    resolution_notes: Optional[str] = Field(default=None, max_length=2000)


class ErrorReportResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    project_slug: Optional[str] = None
    page_url: str
    route_path: str
    error_code: str
    http_status: Optional[int] = None
    severity: str
    title: str
    message: str
    stack_trace: Optional[str] = None
    version: Optional[str] = None
    environment: str
    status: str
    reporter_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
