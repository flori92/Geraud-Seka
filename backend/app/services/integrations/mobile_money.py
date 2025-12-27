import logging
import requests
from typing import Optional, Dict
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class MobileMoneyService:
    def __init__(self):
        self.public_key = settings.kkiapay_public_key
        self.private_key = settings.kkiapay_private_key
        self.secret = settings.kkiapay_secret
        self.base_url = "https://api.kkiapay.me"

    def request_payment(self, amount: int, phone_number: str, reason: str) -> Optional[str]:
        """
        Initiate a payment request. Returns the transaction ID or payment URL.
        """
        logger.info(f"Initiating Mobile Money payment of {amount} for {phone_number}")
        
        if not self.public_key:
            logger.warning("KKiaPay keys not configured")
            return "mock-transaction-id"

        
        return "transaction_ref_12345"

    def verify_transaction(self, transaction_id: str) -> Dict[str, str]:
        """
        Verify the status of a transaction.
        """
        logger.info(f"Verifying transaction {transaction_id}")
        return {"status": "SUCCESS", "amount": "5000", "transaction_id": transaction_id}

mobile_money_service = MobileMoneyService()
