"""
Centralized Error Handling — Step 14
Global exception handlers for FastAPI to return clean JSON error responses
with structured logging.
"""

import logging
import traceback
from typing import Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("alphaai.errors")


class AlphaAIException(Exception):
    """Base exception for AlphaAI application errors."""

    def __init__(self, message: str, status_code: int = 500, detail: str = ""):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class InvalidTickerError(AlphaAIException):
    """Raised when a stock ticker is invalid or not found."""

    def __init__(self, ticker: str):
        super().__init__(
            message=f"Invalid ticker symbol: {ticker}",
            status_code=404,
            detail=f"No data found for ticker '{ticker}'. Please verify the symbol.",
        )


class RateLimitError(AlphaAIException):
    """Raised when an external API rate limit is hit."""

    def __init__(self, service: str = "external API"):
        super().__init__(
            message=f"Rate limit exceeded for {service}",
            status_code=429,
            detail=f"Too many requests to {service}. Please wait and try again.",
        )


class ExternalAPIError(AlphaAIException):
    """Raised when an external API call fails."""

    def __init__(self, service: str, original_error: str = ""):
        super().__init__(
            message=f"External API error from {service}",
            status_code=502,
            detail=f"Failed to connect to {service}: {original_error}",
        )


def _error_response(status_code: int, error: str, detail: str = "") -> JSONResponse:
    """Build a standardized JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error,
            "detail": detail,
            "status_code": status_code,
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    """
    Register all global exception handlers on the FastAPI app instance.
    Call this once during app startup.
    """

    @app.exception_handler(AlphaAIException)
    async def alphaai_exception_handler(request: Request, exc: AlphaAIException):
        logger.error(f"AlphaAI Error [{exc.status_code}]: {exc.message} | {exc.detail}")
        return _error_response(exc.status_code, exc.message, exc.detail)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTP {exc.status_code}: {exc.detail} | Path: {request.url.path}")
        return _error_response(
            exc.status_code,
            str(exc.detail),
            f"Request to {request.url.path} failed.",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        logger.warning(f"Validation error on {request.url.path}: {errors}")
        detail_parts = []
        for err in errors:
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "Invalid value")
            detail_parts.append(f"{loc}: {msg}")
        return _error_response(
            422,
            "Validation error",
            "; ".join(detail_parts),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.critical(
            f"Unhandled exception on {request.method} {request.url.path}: "
            f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        )
        return _error_response(
            500,
            "Internal server error",
            "An unexpected error occurred. Please try again later.",
        )
