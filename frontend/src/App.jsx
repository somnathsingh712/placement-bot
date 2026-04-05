import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";

const API = "http://127.0.0.1:8000";
const CHAT_HISTORY_KEY = "placement-ai-chat-history-v1";

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdown(text) {
  const normalized = String(text || "")
    .replaceAll("\\r\\n", "\n")
    .replaceAll("\\n", "\n")
    .replaceAll("\\t", "\t");

  try {
    const html = marked.parse(normalized, { breaks: true, gfm: true });
    return DOMPurify.sanitize(html);
  } catch {
    return escapeHtml(normalized).replaceAll("\n", "<br>");
  }
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

function useSalary(defaultValue = 12) {
  const [salary, setSalary] = useState(defaultValue);
  const salaryValue = useMemo(() => {
    const n = Number(salary);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [salary]);
  return { salary, setSalary, salaryValue };
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

function MessageBubble({ role, text }) {
  const isUser = role === "user";
  const html = renderMarkdown(text || "");

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} animate-rise`}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-xs font-bold text-white shadow">
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow transition-all duration-300 ${
          isUser
            ? "bg-ink text-white rounded-br-md shadow-[0_12px_26px_-14px_rgba(17,24,39,0.9)]"
            : "bg-white text-slate-900 rounded-bl-md border border-slate-200 shadow-[0_16px_30px_-22px_rgba(2,132,199,0.5)]"
        }`}
      >
        {isUser ? text : <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start animate-rise">
      <div className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-xs font-bold text-white shadow">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Thinking...</div>
        <div className="flex items-center gap-1 text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, to, buttonText, colorClass }) {
  return (
    <article className="group rounded-2xl border border-white/50 bg-white/80 p-4 shadow-panel backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-26px_rgba(15,23,42,0.55)]">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <Link to={to} className={`mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white transition group-hover:scale-[1.02] ${colorClass}`}>
        {buttonText}
      </Link>
    </article>
  );
}

function PageShell({ title, subtitle, children }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4 md:p-6 animate-rise">
      <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-5 shadow-panel backdrop-blur md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-200/70 blur-2xl" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Placement AI Copilot</p>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <Link to="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Back to Home
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}

function HomePage() {
  function getInitialMessages() {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      if (!raw) {
        return [
          {
            id: "welcome",
            role: "assistant",
            text: "Welcome. Use quick actions to open dedicated pages, or ask anything about placements here."
          }
        ];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : [];
    } catch {
      return [];
    }
  }

  function createMessage(role, text) {
    return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text };
  }

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(() => {
    const loaded = getInitialMessages();
    return loaded.length
      ? loaded
      : [{ id: "welcome", role: "assistant", text: "Welcome. Use quick actions to open dedicated pages, or ask anything about placements here." }];
  });
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  function animateAssistantReply(fullText) {
    return new Promise((resolve) => {
      const typed = createMessage("assistant", "");
      setMessages((prev) => [...prev, typed]);

      let cursor = 0;
      const step = Math.max(1, Math.floor(fullText.length / 80));
      const interval = setInterval(() => {
        cursor = Math.min(fullText.length, cursor + step);
        const nextText = fullText.slice(0, cursor);
        setMessages((prev) => prev.map((m) => (m.id === typed.id ? { ...m, text: nextText } : m)));
        if (cursor >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, 20);
    });
  }

  async function sendMessage() {
    const message = chatInput.trim();
    if (!message) return;

    setChatInput("");
    setMessages((prev) => [...prev, createMessage("user", message)]);

    try {
      setIsLoading(true);
      setStatus("Thinking...");
      const data = await fetchJson(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      await animateAssistantReply(data.reply || "No reply.");
      setStatus("Ready");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function clearChatHistory() {
    const base = [{ id: "welcome", role: "assistant", text: "Welcome. Use quick actions to open dedicated pages, or ask anything about placements here." }];
    setMessages(base);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(base));
    setStatus("Chat history cleared");
  }

  return (
    <main className="ui-grid relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="pointer-events-none absolute -left-20 top-8 h-40 w-40 animate-float-slow rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-48 w-48 animate-float-fast rounded-full bg-blue-200/50 blur-3xl" />

      <header className="relative rounded-3xl border border-white/40 bg-white/70 p-4 shadow-panel backdrop-blur md:p-6 animate-rise">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
          Live Chat Workspace
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Placement AI Copilot</p>
        <h1 className="mt-1 text-2xl font-bold md:text-4xl">Ask Naturally, Plan Precisely</h1>
        <p className="mt-1 text-sm text-slate-600">A focused chatbot interface with quick tools for roadmap, daily prep, and resume improvement.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard title="Basic Roadmap" description="Structured roadmap by salary target with DSA, subjects, and project direction." to="/roadmap" buttonText="Open Roadmap" colorClass="bg-ink hover:opacity-90" />
        <ActionCard title="AI Roadmap" description="Generate an AI-powered plan tuned to your target package and current level." to="/ai-roadmap" buttonText="Open AI Roadmap" colorClass="bg-blue-600 hover:bg-blue-700" />
        <ActionCard title="Daily Tasks" description="Get daily checkpoints and habits to keep your prep process consistent." to="/daily" buttonText="Open Daily Tasks" colorClass="bg-emerald-600 hover:bg-emerald-700" />
        <ActionCard title="Resume Analyzer" description="Upload resume and receive actionable analysis for placement readiness." to="/resume" buttonText="Open Resume Page" colorClass="bg-orange-500 hover:bg-orange-600" />
      </section>

      <section className="rounded-3xl border border-white/40 bg-white/70 shadow-panel backdrop-blur animate-rise">
        <div className="flex min-h-[50vh] flex-col">
          <div className="border-b border-slate-200/80 bg-white/60 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Mentor Chat</p>
                <p className="text-xs text-slate-500">Status: {status}</p>
              </div>
              <button onClick={clearChatHistory} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Clear History
              </button>
            </div>
          </div>
          <div className="chat-scroll flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white/20 to-cyan-50/20 px-4 py-4 md:px-6">
            <div className="mb-2 flex flex-wrap gap-2">
              {["Give me a 30-day DSA sprint", "Review my interview weak spots", "How to target 15 LPA in 6 months"].map((prompt) => (
                <button key={prompt} onClick={() => setChatInput(prompt)} className="rounded-full border border-slate-300/90 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700">
                  {prompt}
                </button>
              ))}
            </div>
            {messages.map((msg) => <MessageBubble key={msg.id} role={msg.role} text={msg.text} />)}
            {isLoading && <ThinkingBubble />}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-slate-200/80 bg-white/70 p-3 md:p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about DSA plan, resume gaps, or interview strategy..."
                rows="2"
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-cyan-400 transition focus:ring"
              />
              <button onClick={sendMessage} disabled={isLoading} className="rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-60">
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function RoadmapPage() {
  const { salary, setSalary, salaryValue } = useSalary(12);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Ready");

  async function generate() {
    try {
      setStatus("Generating roadmap...");
      const data = await fetchJson(`${API}/roadmap/${salaryValue}`);
      const lines = [
        `Level: ${data.level || "N/A"}`,
        `DSA: ${(data.dsa || data.topics || []).join(", ")}`,
        `Subjects: ${(data.subjects || []).join(", ")}`,
        `Projects: ${(data.projects || []).join(", ")}`,
        `Timeline: ${data.timeline || "N/A"}`
      ];
      setResult(lines.join("\n"));
      setStatus("Ready");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <PageShell title="Basic Roadmap" subtitle="Dedicated page for structured placement roadmap output.">
      <Panel title="Inputs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-700">
            Target CTC (LPA)
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min="1" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <button onClick={generate} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Generate</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Status: {status}</p>
      </Panel>
      <Panel title="Roadmap Result"><pre className="whitespace-pre-wrap font-mono text-sm text-slate-800">{result || "No result yet."}</pre></Panel>
    </PageShell>
  );
}

function AIRoadmapPage() {
  const { salary, setSalary, salaryValue } = useSalary(12);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Ready");

  async function generate() {
    try {
      setStatus("Generating AI roadmap...");
      const data = await fetchJson(`${API}/ai-roadmap/${salaryValue}`);
      setResult(data.roadmap || "No roadmap returned.");
      setStatus("Ready");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <PageShell title="AI Roadmap" subtitle="Dedicated page for AI-generated preparation plans.">
      <Panel title="Inputs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-700">
            Target CTC (LPA)
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min="1" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <button onClick={generate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Generate</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Status: {status}</p>
      </Panel>
      <Panel title="AI Roadmap Result">
        {result ? <div className="markdown-content text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} /> : <p className="font-mono text-sm text-slate-800">No result yet.</p>}
      </Panel>
    </PageShell>
  );
}

function DailyPage() {
  const { salary, setSalary, salaryValue } = useSalary(12);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Ready");

  async function generate() {
    try {
      setStatus("Generating daily tasks...");
      const data = await fetchJson(`${API}/daily/${salaryValue}`);
      setResult((data.tasks || data.plan || "").toString());
      setStatus("Ready");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <PageShell title="Daily Tasks" subtitle="Dedicated page for your day-by-day prep checklist.">
      <Panel title="Inputs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-700">
            Target CTC (LPA)
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min="1" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <button onClick={generate} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Generate</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Status: {status}</p>
      </Panel>
      <Panel title="Daily Tasks Result"><pre className="whitespace-pre-wrap font-mono text-sm text-slate-800">{result || "No result yet."}</pre></Panel>
    </PageShell>
  );
}

function ResumePage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Ready");

  async function analyze() {
    if (!file) {
      setStatus("Pick a resume file first.");
      return;
    }

    try {
      setStatus("Analyzing resume...");
      const formData = new FormData();
      formData.append("file", file);
      const data = await fetchJson(`${API}/resume`, { method: "POST", body: formData });
      setResult(data.analysis || "No analysis returned.");
      setStatus("Ready");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <PageShell title="Resume Analyzer" subtitle="Dedicated page for resume upload and feedback.">
      <Panel title="Upload Resume">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button onClick={analyze} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Analyze</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Status: {status}</p>
      </Panel>
      <Panel title="Resume Analysis Result">
        {result ? <div className="markdown-content text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} /> : <p className="font-mono text-sm text-slate-800">No result yet.</p>}
      </Panel>
    </PageShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/ai-roadmap" element={<AIRoadmapPage />} />
      <Route path="/daily" element={<DailyPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
