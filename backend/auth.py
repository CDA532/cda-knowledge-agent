import requests

def verify_google_token(token: str):
    """Verify a Google OAuth access token and return user info."""
    try:
        resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None
