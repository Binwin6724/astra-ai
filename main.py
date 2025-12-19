import http.client
import base64
import json

def decode_base64url(data: str) -> str:
    """Decode Gmail base64url encoded strings safely"""
    if not data:
        return ""
    missing_padding = len(data) % 4
    if missing_padding:
        data += "=" * (4 - missing_padding)
    return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")


def extract_email_fields(message: dict):
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    subject = ""
    sender = ""
    body = ""

    # ---- Extract headers ----
    for h in headers:
        name = h.get("name", "").lower()
        if name == "subject":
            subject = h.get("value", "")
        elif name == "from":
            sender = h.get("value", "")

    # ---- Extract body ----
    # Case 1: body directly available
    if payload.get("body", {}).get("data"):
        body = decode_base64url(payload["body"]["data"])
        return sender, subject, body

    # Case 2: multipart email
    def walk_parts(parts):
        for part in parts:
            mime = part.get("mimeType", "")
            data = part.get("body", {}).get("data")

            if mime in ("text/plain", "text/html") and data:
                return decode_base64url(data)

            # nested multipart
            if part.get("parts"):
                result = walk_parts(part["parts"])
                if result:
                    return result
        return ""

    body = walk_parts(payload.get("parts", []))

    return sender, subject, body




conn = http.client.HTTPSConnection("www.googleapis.com")
payload = ''
headers = {
  'Authorization': 'Bearer ya29.a0Aa7pCA_ciRbiunUEtXkjpwm7QR7wvuMMTJ3LCIi8O0v4UyACBk1RPm-tohLCcRCdEn-wpGZJMhlqivud2CS75zwwWlWCvr3fvRtFomTdkV-dz535zNUO1ZmYC7h1jbq3nG3EPmhyYWqhe873pGT2xtlwpINKBvdIPqnb84_P7qXa9wtbIoW5NijKuApmorzFNix4dfQaCgYKAfUSARQSFQHGX2MiKsTgbH700-C2xOC8OPG2pA0206'
}
conn.request("GET", "/gmail/v1/users/me/messages/19b3518298d6bf5e?format=full", payload, headers)
res = conn.getresponse()
data = res.read()
try:
    message_json = json.loads(data.decode("utf-8"))
    dataGot = extract_email_fields(message_json)
    print(dataGot)
except json.JSONDecodeError:
    print("Failed to decode JSON response:", data.decode("utf-8"))
except Exception as e:
    print(f"An error occurred: {e}")