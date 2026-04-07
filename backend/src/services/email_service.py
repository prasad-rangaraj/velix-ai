import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from typing import List, Optional
import anyio
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.api_key = os.getenv("BREVO_API_KEY")
        if self.api_key:
            print(f"[INFO] Brevo API Key loaded (starts with: {self.api_key[:10]}...)")
        else:
            print("[ERROR] Brevo API Key NOT found in environment variables!")
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = self.api_key
        
        api_client = sib_api_v3_sdk.ApiClient(configuration)
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
        
        self.from_email = os.getenv("FROM_EMAIL", "prasad.ec23@bitsathy.ac.in")
        self.from_name = os.getenv("FROM_NAME", "VelixAI")

    async def send_transactional_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        to_name: Optional[str] = None
    ):
        """Sends a transactional email using Brevo."""
        sender = {"name": self.from_name, "email": self.from_email}
        to = [{"email": to_email, "name": to_name or to_email.split('@')[0]}]
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=to,
            sender=sender,
            subject=subject,
            html_content=html_content
        )

        try:
            # Run the synchronous SDK call in a thread pool
            api_response = await anyio.to_thread.run_sync(
                self.api_instance.send_transac_email, 
                send_smtp_email
            )
            print(f"[INFO] Email sent via Brevo: {api_response}")
            return api_response
        except ApiException as e:
            print(f"[ERROR] Exception when calling TransactionalEmailsApi->send_transac_email: {e}")
            raise e

# Global instance
email_service = EmailService()


