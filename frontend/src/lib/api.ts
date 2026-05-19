import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Document {
  id: string;
  name: string;
  mime_type: string;
  web_view_link: string;
  modified_time: string;
  snippet: string;
}

export interface SearchResponse {
  ai_answer: string;
  documents: Document[];
}

export async function searchDrive(
  query: string,
  token: string,
  file_type?: string
): Promise<SearchResponse> {
  const { data } = await axios.post<SearchResponse>(`${API_URL}/search`, {
    query,
    token,
    file_type: file_type || null,
  });
  return data;
}

export function getMimeLabel(mime: string): string {
  if (mime.includes("document")) return "DOC";
  if (mime.includes("spreadsheet")) return "SHEET";
  if (mime.includes("presentation")) return "SLIDES";
  if (mime.includes("pdf")) return "PDF";
  return "FILE";
}

export function getMimeColor(mime: string): string {
  if (mime.includes("document")) return "#4285f4";
  if (mime.includes("spreadsheet")) return "#0f9d58";
  if (mime.includes("presentation")) return "#f4b400";
  if (mime.includes("pdf")) return "#ea4335";
  return "#8a9bb5";
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}
