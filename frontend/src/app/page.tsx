"use client";

import { useState, useRef } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { searchDrive, getMimeLabel, getMimeColor, formatDate, Document } from "@/lib/api";

type FilterType = "" | "doc" | "pdf" | "sheet";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("");
  const [loading, setLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const login = useGoogleLogin({
    onSuccess: async (res) => {
      setToken(res.access_token);
      // Fetch user info
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${res.access_token}` },
      });
      const info = await r.json();
      setUserEmail(info.email);
    },
    onError: () => setError("Google sign-in failed. Please try again."),
    scope: "email profile https://www.googleapis.com/auth/drive.readonly",
    prompt: "none",
  });

  const handleSearch = async () => {
    if (!query.trim() || !token) return;
    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const result = await searchDrive(query, token, filter || undefined);
      setAiAnswer(result.ai_answer);
      setDocs(result.documents);
      setSearched(true);
    } catch (e: any) {
      if (e.response?.status === 401) {
        setToken(null);
        setError("Session expired. Please sign in again.");
      } else {
        setError("Search failed. Please check that the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── NOT LOGGED IN ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ marginBottom: "2rem" }}>
            <span style={{
              display: "inline-block",
              background: "rgba(0,201,177,0.12)",
              border: "1px solid rgba(0,201,177,0.3)",
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--teal)",
              marginBottom: "1.5rem"
            }}>
              Coastal Dental Arts
            </span>
            <h1 className="serif" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.1, marginBottom: "1rem" }}>
              Knowledge<br /><em>Agent</em>
            </h1>
            <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
              Search every SOP, training manual, and HR document in your Google Drive — answered by AI.
            </p>
          </div>

          <button
            onClick={() => login()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "var(--cream)",
              color: "#0a1628",
              border: "none",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "DM Sans, sans-serif",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {error && (
            <p style={{ marginTop: "1rem", color: "#ff6b6b", fontSize: 14 }}>{error}</p>
          )}

          <p style={{ marginTop: "2rem", color: "var(--text-dim)", fontSize: 13 }}>
            Staff only · cdentalarts.com accounts
          </p>
        </div>
      </main>
    );
  }

  // ── LOGGED IN ──────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      {/* Header */}
      <header style={{
        maxWidth: 800, margin: "0 auto 2.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--teal), var(--teal-dim))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🦷</span>
          <div>
            <div className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>CDA Knowledge Agent</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{userEmail}</div>
          </div>
        </div>
        <button
          onClick={() => { setToken(null); setUserEmail(""); setSearched(false); }}
          style={{
            background: "var(--card-bg)", border: "1px solid var(--card-border)",
            borderRadius: 8, padding: "6px 14px", color: "var(--text-dim)",
            fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif"
          }}
        >
          Sign out
        </button>
      </header>

      {/* Search box */}
      <section style={{ maxWidth: 800, margin: "0 auto 2rem" }}>
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 16,
          padding: "1.25rem",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ask anything… e.g. 'what is the new patient check-in SOP?'"
              style={{
                flex: 1, minWidth: 200,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "12px 16px",
                color: "var(--text)", fontSize: 15,
                fontFamily: "DM Sans, sans-serif",
                outline: "none",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                background: loading ? "var(--teal-dim)" : "var(--teal)",
                color: "#0a1628", border: "none",
                borderRadius: 10, padding: "12px 24px",
                fontWeight: 600, fontSize: 15, cursor: loading ? "wait" : "pointer",
                fontFamily: "DM Sans, sans-serif",
                opacity: (!query.trim() && !loading) ? 0.5 : 1,
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([["", "All files"], ["doc", "Docs"], ["pdf", "PDFs"], ["sheet", "Sheets"]] as [FilterType, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  padding: "5px 14px", fontSize: 13, borderRadius: 20,
                  border: filter === val ? "1px solid var(--teal)" : "1px solid var(--card-border)",
                  background: filter === val ? "rgba(0,201,177,0.12)" : "transparent",
                  color: filter === val ? "var(--teal)" : "var(--text-dim)",
                  cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "12px 16px",
            background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: 10, color: "#ff6b6b", fontSize: 14
          }}>{error}</div>
        )}
      </section>

      {/* Results */}
      {searched && (
        <section style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* AI Answer */}
          <div style={{
            background: "rgba(0,201,177,0.06)",
            border: "1px solid rgba(0,201,177,0.2)",
            borderRadius: 14, padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--teal)", letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Answer</span>
            </div>
            <p style={{ lineHeight: 1.7, fontSize: 15 }}>{aiAnswer}</p>
          </div>

          {/* Document list */}
          {docs.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12, paddingLeft: 2 }}>
                {docs.length} document{docs.length !== 1 ? "s" : ""} found
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {docs.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block", textDecoration: "none", color: "inherit",
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: 12, padding: "1rem 1.25rem",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--card-border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{
                        flexShrink: 0,
                        background: getMimeColor(doc.mime_type) + "22",
                        color: getMimeColor(doc.mime_type),
                        border: `1px solid ${getMimeColor(doc.mime_type)}44`,
                        borderRadius: 6, padding: "2px 8px",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                        marginTop: 2
                      }}>
                        {getMimeLabel(doc.mime_type)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {doc.name}
                        </div>
                        <div style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.5 }}>
                          {doc.snippet}
                        </div>
                        {doc.modified_time && (
                          <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>
                            Last modified {formatDate(doc.modified_time)}
                          </div>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, color: "var(--text-dim)", marginTop: 2, fontSize: 18 }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {docs.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-dim)" }}>
              No documents found. Try different keywords or a broader search.
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div style={{ maxWidth: 800, margin: "3rem auto", textAlign: "center", color: "var(--text-dim)" }}>
          <div style={{ fontSize: 48, marginBottom: "1rem" }}>🔍</div>
          <p style={{ fontSize: 16, marginBottom: "0.5rem" }}>Ask a question to search your company documents</p>
          <p style={{ fontSize: 14 }}>SOPs · Training Manuals · HR Docs · Protocols</p>
        </div>
      )}
    </main>
  );
}
