"""
Application Error Hierarchy and Exception Handlers.
Follows Loft Backend Foundation Vol I error handling patterns.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger("aiops.opspages.errors")


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None


class ApplicationError(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.field = field
        self.details = details or {}


class NotFoundError(ApplicationError):
    def __init__(
        self,
        message: str = "Resource not found",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            field=field,
            details=details,
        )


class ConflictError(ApplicationError):
    def __init__(
        self,
        message: str = "Resource already exists",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            field=field,
            details=details,
        )


class AuthenticationError(ApplicationError):
    def __init__(
        self,
        message: str = "Invalid credentials or token expired",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            field=field,
            details=details,
        )


class AuthorizationError(ApplicationError):
    def __init__(
        self,
        message: str = "Insufficient permissions to perform this action",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
            field=field,
            details=details,
        )


class ValidationError(ApplicationError):
    def __init__(
        self,
        message: str = "Invalid input or validation failed",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            field=field,
            details=details,
        )


class QuotaExceededError(ApplicationError):
    def __init__(
        self,
        message: str = "Project quota limit exceeded",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="QUOTA_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            field=field,
            details=details,
        )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApplicationError)
    async def application_error_handler(request: Request, exc: ApplicationError):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code=exc.code,
                    message=exc.message,
                    field=exc.field,
                    details=exc.details,
                ),
                request_id=request_id,
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", None)
        errors = exc.errors()
        first_error = errors[0] if errors else {}
        loc = ".".join(str(l) for l in first_error.get("loc", []))
        msg = first_error.get("msg", "Invalid input parameters")

        clean_errors = [
            {
                "loc": [str(x) for x in err.get("loc", [])],
                "msg": str(err.get("msg", "")),
                "type": str(err.get("type", "")),
            }
            for err in errors
        ]

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="VALIDATION_ERROR",
                    message=msg,
                    field=loc,
                    details={"validation_errors": clean_errors},
                ),
                request_id=request_id,
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        logger.exception(f"Unhandled exception occurred: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="INTERNAL_SERVER_ERROR",
                    message="An unexpected internal server error occurred",
                ),
                request_id=request_id,
            ).model_dump(),
        )
