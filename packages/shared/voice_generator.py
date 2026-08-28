"""
revAIve — Hinglish & Multilingual Voice Recovery Script Generator
Generates recovery scripts based on context, reason, tone, and language preference.
"""

from typing import Dict, Any


class MultilingualVoiceGenerator:
    """Generates and previews English, Hindi, and Hinglish recovery calls/notifications."""

    TEMPLATES = {
        "en": {
            "insufficient_funds": (
                "Hello {customer_name}, this is an automated reminder from {merchant_name}. "
                "Your payment of {amount} could not be processed due to insufficient funds. "
                "You can complete your payment securely using the link sent to your device."
            ),
            "bank_maintenance_outage": (
                "Hello {customer_name}, your recent transaction of {amount} with {merchant_name} failed "
                "due to temporary bank maintenance at {issuer_bank}. We will retry this transaction "
                "automatically once maintenance concludes."
            ),
            "gateway_timeout": (
                "Hello {customer_name}, we encountered a temporary gateway timeout for your payment of {amount}. "
                "No funds were debited. You can click the recovery link below to retry securely."
            ),
            "instrument_expired": (
                "Hello {customer_name}, your billing card for {merchant_name} has expired. "
                "To prevent subscription halt, please update your details using the link provided."
            ),
            "overdue_receivable": (
                "Hello, this is {merchant_name} calling regarding invoice number {invoice_id} for {amount} "
                "which is now {days_overdue} days overdue. Please complete the payment or request a promise-to-pay date."
            ),
            "broken_promise": (
                "Hello {customer_name}, your promise-to-pay date for {merchant_name} has elapsed. "
                "Please click the link below to resolve the overdue balance of {amount} immediately."
            ),
            "default": (
                "Hello {customer_name}, your payment of {amount} with {merchant_name} could not be completed. "
                "Please use the link below to complete your transaction."
            )
        },
        "hi": {
            "insufficient_funds": (
                "नमस्ते {customer_name}, यह {merchant_name} से एक स्वचालित संदेश है। "
                "आपके खाते में पर्याप्त राशि न होने के कारण {amount} का भुगतान पूरा नहीं हो सका। "
                "आप नीचे दिए गए लिंक से भुगतान पूरा कर सकते हैं।"
            ),
            "bank_maintenance_outage": (
                "नमस्ते {customer_name}, {issuer_bank} में चल रहे रख-रखाव के कारण {merchant_name} पर "
                "आपका {amount} का भुगतान विफल रहा। हम इसे जल्द ही पुनः प्रयास करेंगे।"
            ),
            "gateway_timeout": (
                "नमस्ते {customer_name}, आपके भुगतान के दौरान नेटवर्क कनेक्शन टूट गया। "
                "हमारा सिस्टम इसे स्वतः री-ट्राई कर रहा है, कृपया प्रतीक्षा करें।"
            ),
            "instrument_expired": (
                "नमस्ते {customer_name}, आपके भुगतान कार्ड की वैधता समाप्त हो गई है। "
                "अपनी सेवाओं को जारी रखने के लिए कृपया लिंक पर जाकर विवरण अपडेट करें।"
            ),
            "overdue_receivable": (
                "नमस्ते, {merchant_name} से कॉल है। आपका {amount} का इनवॉइस {days_overdue} दिनों से बकाया है। "
                "कृपया जल्द से जल्द भुगतान पूरा करें।"
            ),
            "broken_promise": (
                "नमस्ते {customer_name}, भुगतान करने का आपका वादा समय सीमा से बाहर हो गया है। "
                "कृपया बकाया {amount} का तुरंत भुगतान करें।"
            ),
            "default": (
                "नमस्ते {customer_name}, {merchant_name} पर आपका {amount} का भुगतान पूरा नहीं हो सका। "
                "कृपया दिए गए विकल्प से पुनः प्रयास करें।"
            )
        },
        "hinglish": {
            "insufficient_funds": (
                "Hello {customer_name}, {merchant_name} से automated call है। "
                "आपके account में balance कम होने की वजह से {amount} का payment complete nahi ho paya. "
                "Aap message check kijiye aur link se payment complete kar sakte hain."
            ),
            "bank_maintenance_outage": (
                "Hi {customer_name}, {issuer_bank} bank ke maintenance window ke karan aapka {amount} payment failed ho gaya. "
                "Hum thodi der mein automatically retry karenge, aapko fikar karne ki jarurat nahi hai."
            ),
            "gateway_timeout": (
                "Hi {customer_name}, payment network timeout ho gaya tha. aapke account se paise nahi kate hain. "
                "Aap niche diye option se dobara payment try kar sakte hain."
            ),
            "instrument_expired": (
                "Hi {customer_name}, aapka card expire ho chuka hai. Services continue rakhne ke liye "
                "please link open karke details update kar dijiye."
            ),
            "overdue_receivable": (
                "Hi, {merchant_name} se call hai. Aapka invoice number {invoice_id} {days_overdue} days se overdue hai. "
                "Aap niche link se payment clear kar dijiye."
            ),
            "broken_promise": (
                "Hi {customer_name}, payment karne ka aapka promise date nikal chuka hai. "
                "Bacha hua {amount} ka payment kripya jaldi complete kijiye."
            ),
            "default": (
                "Hello {customer_name}, aapka {merchant_name} payment complete nahi ho paya. "
                "Aap niche diye option se dobara try kar sakte hain."
            )
        }
    }

    @classmethod
    def generate_script(
        cls,
        language: str,
        customer_name: str,
        merchant_name: str,
        amount_str: str,
        cause_code: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, str]:
        lang_key = language.lower()
        if lang_key not in cls.TEMPLATES:
            lang_key = "en"

        cause_key = cause_code.lower()
        if "insufficient_funds" in cause_key:
            tmpl_key = "insufficient_funds"
        elif "outage" in cause_key or "maintenance" in cause_key:
            tmpl_key = "bank_maintenance_outage"
        elif "timeout" in cause_key:
            tmpl_key = "gateway_timeout"
        elif "expired" in cause_key:
            tmpl_key = "instrument_expired"
        elif "overdue" in cause_key:
            tmpl_key = "overdue_receivable"
        elif "broken" in cause_key or "promise" in cause_key:
            tmpl_key = "broken_promise"
        else:
            tmpl_key = "default"

        template = cls.TEMPLATES[lang_key].get(tmpl_key, cls.TEMPLATES[lang_key]["default"])

        # Populate context placeholders
        script = template.format(
            customer_name=customer_name or "Customer",
            merchant_name=merchant_name or "Merchant",
            amount=amount_str,
            issuer_bank=metadata.get("issuer_bank", "HDFC Bank"),
            days_overdue=metadata.get("days_overdue", 15),
            invoice_id=metadata.get("invoice_id", "INV-9901")
        )

        return {
            "language": language,
            "script": script,
            "voice_status": "VOICE SIMULATION ONLY",
            "audio_url": f"https://api.revaive.ai/simulated-audio?lang={lang_key}&text_hash={hash(script)}"
        }
