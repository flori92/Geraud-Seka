from __future__ import annotations

from typing import Dict, List, Optional
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.contact import Contact, ContactCreate, ContactUpdate

router = APIRouter()


_contacts_by_tenant: Dict[str, Dict[str, dict]] = {}


def _tenant_key(user: User) -> str:
    if not user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant introuvable pour l'utilisateur")
    return str(user.tenant_id)


@router.get("/", response_model=List[Contact])
async def list_contacts(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
) -> List[Contact]:
    tenant_id = _tenant_key(current_user)
    items = list(_contacts_by_tenant.get(tenant_id, {}).values())

    if search:
        s = search.lower()
        items = [
            c
            for c in items
            if (c.get("first_name") or "").lower().find(s) != -1
            or (c.get("last_name") or "").lower().find(s) != -1
            or (c.get("email") or "").lower().find(s) != -1
        ]

    return [Contact(**c) for c in items]


@router.post("/", response_model=Contact)
async def create_contact(
    payload: ContactCreate,
    current_user: User = Depends(get_current_user),
) -> Contact:
    tenant_id = _tenant_key(current_user)

    now = datetime.utcnow()

    contact_id = uuid4()
    data = payload.model_dump()
    data.update(
        {
            "id": contact_id,
            "full_name": f"{payload.first_name} {payload.last_name}".strip(),
            "tenant_id": UUID(tenant_id),
            "email_bounced": False,
            "created_at": now,
            "updated_at": now,
        }
    )

    _contacts_by_tenant.setdefault(tenant_id, {})[str(contact_id)] = data
    return Contact(**data)


@router.get("/{contact_id}", response_model=Contact)
async def get_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
) -> Contact:
    tenant_id = _tenant_key(current_user)
    contact = _contacts_by_tenant.get(tenant_id, {}).get(str(contact_id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    return Contact(**contact)


@router.put("/{contact_id}", response_model=Contact)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    current_user: User = Depends(get_current_user),
) -> Contact:
    tenant_id = _tenant_key(current_user)
    contact = _contacts_by_tenant.get(tenant_id, {}).get(str(contact_id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact non trouvé")

    update_data = payload.model_dump(exclude_unset=True)
    contact.update(update_data)

    contact["updated_at"] = datetime.utcnow()

    if "first_name" in update_data or "last_name" in update_data:
        first_name = contact.get("first_name") or ""
        last_name = contact.get("last_name") or ""
        contact["full_name"] = f"{first_name} {last_name}".strip()

    _contacts_by_tenant.setdefault(tenant_id, {})[str(contact_id)] = contact
    return Contact(**contact)


@router.delete("/{contact_id}", response_model=dict)
async def delete_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
) -> dict:
    tenant_id = _tenant_key(current_user)
    bucket = _contacts_by_tenant.get(tenant_id, {})
    if str(contact_id) not in bucket:
        raise HTTPException(status_code=404, detail="Contact non trouvé")
    del bucket[str(contact_id)]
    return {"ok": True}
