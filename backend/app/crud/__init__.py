"""CRUD operations for all models."""

from . import (
    tenant,
    user,
    quote,
    sales_invoice,
    purchase_order,
    delivery_note,
)

__all__ = [
    "tenant",
    "user",
    "quote",
    "sales_invoice",
    "purchase_order",
    "delivery_note",
]
