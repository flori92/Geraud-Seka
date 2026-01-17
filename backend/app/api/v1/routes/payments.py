from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.services.payment import stripe_service, kkiapay_service
from app.schemas import payment as schemas
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.post("/stripe/customer")
async def create_stripe_customer(
    data: schemas.StripeCustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe customer and link it to the tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if tenant.stripe_customer_id:
        return {"id": tenant.stripe_customer_id, "email": data.email, "name": data.name}

    metadata = data.metadata or {}
    metadata["tenant_id"] = str(tenant.id)

    customer = await stripe_service.create_customer(
        email=data.email,
        name=data.name,
        metadata=metadata
    )
    
    if customer.get("id"):
        tenant.stripe_customer_id = customer["id"]
        db.commit()
        
    return customer

@router.post("/stripe/subscribe")
async def create_stripe_subscription(
    data: schemas.StripeSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe subscription."""
    subscription = await stripe_service.create_subscription(
        customer_id=data.customer_id,
        price_id=data.price_id,
        trial_days=data.trial_days
    )
    
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if tenant and subscription.get("status") == "active":
        plan_map = {
            "price_starter": "starter",
            "price_business": "business",
            "price_enterprise": "enterprise"
        }
        tenant.plan = plan_map.get(data.price_id, "basic")
        tenant.subscription_status = "active"
        db.commit()
        
    return subscription

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Handle Stripe webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    
    event = await request.json()
    print(f"Received Stripe webhook: {event.get('type')}")
    
    if event.get("type") == "invoice.payment_succeeded":
        data = event["data"]["object"]
        customer_id = data.get("customer")
        
        tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
        if tenant:
            tenant.subscription_status = "active"
            db.commit()
            print(f"Updated subscription status for tenant {tenant.id}")
        
    return {"status": "success"}


@router.post("/kkiapay/link")
async def create_kkiapay_link(
    data: schemas.KKiaPayLinkCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a KKiaPay payment link."""
    return await kkiapay_service.create_payment_link(
        amount=data.amount,
        reason=data.reason,
        callback_url=data.callback_url
    )

@router.post("/kkiapay/verify")
async def verify_kkiapay_transaction(
    data: schemas.KKiaPayVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify a KKiaPay transaction."""
    verification = await kkiapay_service.verify_payment(data.transaction_id)
    
    if verification.get("status") == "SUCCESS":
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        if tenant:
            tenant.subscription_status = "active"
            db.commit()
            
    return verification

@router.post("/kkiapay/webhook")
async def kkiapay_webhook(request: Request):
    """Handle KKiaPay webhooks."""
    event = await request.json()
    print(f"Received KKiaPay webhook: {event}")
    
    if event.get("status") == "SUCCESS":
        pass
        
    return {"status": "success"}


@router.get("/kkiapay/transactions")
async def get_kkiapay_transactions(
    current_user: User = Depends(get_current_user)
):
    """Récupérer les transactions KKIAPAY."""
    try:
        # Appeler l'API KKIAPAY pour récupérer les transactions
        transactions = await kkiapay_service.get_transactions()
        return {
            "transactions": transactions,
            "total": len(transactions)
        }
    except Exception as e:
        print(f"Erreur récupération transactions KKIAPAY: {e}")
        return {
            "transactions": [],
            "total": 0,
            "error": str(e)
        }
