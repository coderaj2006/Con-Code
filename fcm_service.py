import firebase_admin
from firebase_admin import credentials, messaging
import logging

logger = logging.getLogger(__name__)

# Try to initialize Firebase if credentials exist. Allow graceful fallback if not.
try:
    # Notice: In a real environment, you'd point to your serviceAccountKey.json
    # cred = credentials.Certificate("firebase_credentials.json")
    # firebase_admin.initialize_app(cred)
    firebase_initialized = False # Set to true when you add your real JSON
except Exception as e:
    logger.warning(f"Firebase Init failed: {e}")
    firebase_initialized = False

async def send_fcm_notification(token: str, title: str, body: str):
    """
    Sends a push notification to a specific farmer's device.
    If firebase isn't initialized yet (hackathon mock), gracefully logs success to console.
    """
    if not token:
        logger.warning("Attempted to send FCM but Farmer has no fcm_token registered.")
        return False

    if not firebase_initialized:
        logger.info(f"🟢 [MOCK PUSH NOTIFICATION SENT] To: {token} | Title: '{title}' | Body: '{body}'")
        return True

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=token,
        )
        response = messaging.send(message)
        logger.info(f"Successfully sent FCM push message: {response}")
        return True
    except Exception as e:
        logger.error(f"Error sending FCM message: {e}")
        return False
