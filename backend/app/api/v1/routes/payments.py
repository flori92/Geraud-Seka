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

# --- STRIPE ---

@router.post("/stripe/customer")
async def create_stripe_customer(
    data: schemas.StripeCustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe customer and link it to the tenant."""
    # Check if tenant already has a stripe customer id
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if tenant.stripe_customer_id:
        return {"id": tenant.stripe_customer_id, "email": data.email, "name": data.name}

    # Add tenant_id to metadata
    metadata = data.metadata or {}
    metadata["tenant_id"] = str(tenant.id)

    customer = await stripe_service.create_customer(
        email=data.email,
        name=data.name,
        metadata=metadata
    )
    
    # Update tenant with stripe customer id
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
    
    # Update tenant plan based on price_id (simplified logic)
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if tenant and subscription.get("status") == "active":
        # Map price_id to plan name
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
    
    # In a real implementation, verify signature using stripe library
    # event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    
    # For now, just log the event
    event = await request.json()
    print(f"Received Stripe webhook: {event.get('type')}")
    
    if event.get("type") == "invoice.payment_succeeded":
        # Handle successful payment
        data = event["data"]["object"]
        customer_id = data.get("customer")
        
        # Find tenant by stripe_customer_id
        tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
        if tenant:
            tenant.subscription_status = "active"
            db.commit()
            print(f"Updated subscription status for tenant {tenant.id}")
        
    return {"status": "success"}

# --- KKIAPAY ---

@router.post("/kkiapay/link")
async def create_kkiapay_link(
    data: schemas.KKiaPayLinkCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a KKiaPay payment link."""
    # In a real app, we would store a pending transaction reference here
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
        # Update tenant plan (simplified, assuming amount maps to a plan)
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        if tenant:
            tenant.subscription_status = "active"
            # Logic to determine plan based on amount could go here
            db.commit()
            
    return verification

@router.post("/kkiapay/webhook")
async def kkiapay_webhook(request: Request):
    """Handle KKiaPay webhooks."""
    event = await request.json()
    print(f"Received KKiaPay webhook: {event}")
    
    # Verify transaction status and update tenant
    if event.get("status") == "SUCCESS":
        # Update tenant subscription status
        # Need a way to link transaction to tenant (e.g. custom field in payment link)
        pass
        
    return {"status": "success"}
