from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path


def load_env_file(path: str | None = None) -> None:
    base_dir = Path(__file__).resolve().parent
    candidate_paths = []

    if path:
        candidate_paths.append(Path(path))
    candidate_paths.extend([base_dir / ".env", Path(".env")])

    seen = set()
    for env_path in candidate_paths:
        if env_path in seen:
            continue
        seen.add(env_path)

        if not env_path.is_absolute():
            env_path = base_dir / env_path

        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        break


load_env_file()


def get_smtp_config() -> dict:
    load_env_file()
    to_email = os.environ.get("TO_EMAIL", "kesavchandworks@gmail.com").strip()
    from_email = os.environ.get("SMTP_FROM_EMAIL", to_email).strip()
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_username = os.environ.get("SMTP_USERNAME", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip().replace(" ", "")
    smtp_use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
    return {
        "to_email": to_email,
        "from_email": from_email,
        "smtp_host": smtp_host,
        "smtp_port": smtp_port,
        "smtp_username": smtp_username,
        "smtp_password": smtp_password,
        "smtp_use_tls": smtp_use_tls,
    }


def is_valid_phone(phone: str) -> bool:
    if not phone:
        return False
    cleaned = re.sub(r"[^0-9+]", "", phone)
    if not cleaned:
        return False
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    return len(cleaned) >= 8 and len(cleaned) <= 15


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

        if not is_valid_phone(phone):
            response = {"ok": False, "sent": False, "error": "Please enter a valid phone number."}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        subject = f"New chat inquiry from {name or 'a client'}"
        body_text = (
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Company: {company}\n"
            f"Phone: {phone}\n\n"
            f"Project Description:\n{description}"
        )

        try:
            config = get_smtp_config()
            if not config["smtp_host"] or not config["smtp_username"] or not config["smtp_password"]:
                raise RuntimeError("SMTP credentials are not configured. Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in your environment.")

            message = EmailMessage()
            message["Subject"] = subject
            message["From"] = config["from_email"]
            message["To"] = config["to_email"]
            message.set_content(body_text)

            with smtplib.SMTP(config["smtp_host"], config["smtp_port"]) as smtp:
                if config["smtp_use_tls"]:
                    smtp.starttls(context=ssl.create_default_context())
                smtp.login(config["smtp_username"], config["smtp_password"])
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
