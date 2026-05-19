from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError

MIME_TYPE_MAP = {
    "doc": "application/vnd.google-apps.document",
    "pdf": "application/pdf",
    "sheet": "application/vnd.google-apps.spreadsheet",
    "presentation": "application/vnd.google-apps.presentation",
}

class DriveService:
    def __init__(self, access_token):
        credentials = Credentials(token=access_token)
        self.service = build("drive", "v3", credentials=credentials)

    def search(self, query, file_type=None):
        try:
            q = "fullText contains '%s' and trashed=false" % query
            if file_type and file_type in MIME_TYPE_MAP:
                q += " and mimeType='%s'" % MIME_TYPE_MAP[file_type]
            results = self.service.files().list(
                q=q,
                fields="files(id, name, mimeType, webViewLink, modifiedTime)",
                orderBy="modifiedTime desc",
                pageSize=10,
                corpora="allDrives",
                includeItemsFromAllDrives=True,
                supportsAllDrives=True,
            ).execute()
            return results.get("files", [])
        except HttpError as e:
            print("Drive search error:", e)
            return []

    def get_content(self, file_id, mime_type):
        try:
            if "google-apps.document" in mime_type:
                content = self.service.files().export(fileId=file_id, mimeType="text/plain").execute()
                return content.decode("utf-8") if isinstance(content, bytes) else str(content)
            elif "google-apps.spreadsheet" in mime_type:
                content = self.service.files().export(fileId=file_id, mimeType="text/csv").execute()
                return content.decode("utf-8") if isinstance(content, bytes) else str(content)
            elif "google-apps.presentation" in mime_type:
                content = self.service.files().export(fileId=file_id, mimeType="text/plain").execute()
                return content.decode("utf-8") if isinstance(content, bytes) else str(content)
            return ""
        except HttpError as e:
            print("Content fetch error:", e)
            return ""
