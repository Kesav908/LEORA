from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import smtplib
import ssl
from email.message import EmailMessage

TO_EMAIL = os.environ.get("TO_EMAIL", "hello@leora.agency")
FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", TO_EMAIL)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"


class ChatbotHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8")
        data = json.loads(body or "{}")

        name = data.get("name", "")
        email = data.get("email", "")
        company = data.get("company", "")
        phone = data.get("phone", "")
        description = data.get("description", "")

        subject = f"New chat inquiry from {name or 'a client'}"
        body_text = (
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Company: {company}\n"
            f"Phone: {phone}\n\n"
            f"Project Description:\n{description}"
        )

        try:
            if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
                raise RuntimeError("SMTP credentials are not configured. Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in your environment.")

            message = EmailMessage()
            message["Subject"] = subject
            message["From"] = FROM_EMAIL
            message["To"] = TO_EMAIL
            message.set_content(body_text)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
                if SMTP_USE_TLS:
                    smtp.starttls(context=ssl.create_default_context())
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
                smtp.send_message(message)

            response = {"ok": True, "sent": True}
        except Exception as exc:
            response = {"ok": False, "sent": False, "error": str(exc)}

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode("utf-8"))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8001"))
    server = HTTPServer(("127.0.0.1", port), ChatbotHandler)
    print(f"Chatbot server running on http://127.0.0.1:{port}")
    server.serve_forever()
