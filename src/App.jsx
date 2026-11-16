import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  RotateCcw,
  User,
  Bot,
  AlertCircle,
  Send,
  FileText,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import './App.css';

export default function CampusChatbot() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [docInfo, setDocInfo] = useState({ fileName: 'Loading...', status: 'loading' });
  const sendingRef = useRef(false);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: '👋 **Welcome to CampusGuide AI!**\n\nI am your intelligent document assistant. I can read, summarize, and answer questions directly from your reference PDF.\n\nTry clicking one of the suggested prompts below or ask any specific question!',
      isWelcome: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: 'Executive Summary', prompt: 'Provide a comprehensive executive summary of this document.' },
    { label: 'Key Case Studies', prompt: 'What are the main real-life case studies and applications discussed in this PDF?' },
    { label: 'Challenges & Issues', prompt: 'What key challenges and open issues does this document identify?' },
    { label: 'Future Research', prompt: 'What are the future research directions and trends highlighted in this paper?' }
  ];

  // Fetch document info on mount
  useEffect(() => {
    fetchDocInfo();
  }, []);

  const fetchDocInfo = async () => {
    try {
      const res = await fetch('/api/document-info');
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setDocInfo({ fileName: data.fileName, status: 'ready', model: data.model });
      } else {
        setDocInfo({ fileName: 'No PDF detected', status: 'error', error: data.error });
      }
    } catch {
      setDocInfo({ fileName: 'Backend offline', status: 'offline' });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async (customText) => {
    const question = (customText ?? input).trim();
    if (!question || sendingRef.current) return;

    sendingRef.current = true;
    setError(null);
    setIsLoading(true);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Filter out synthetic welcome for Gemini history
    const history = messages
      .filter((m) => !m.isWelcome)
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [...prev, { role: 'user', text: question, time: currentTime }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      if (!data.reply || typeof data.reply !== 'string') {
        throw new Error('Gemini returned an empty response. Please try rephrasing your question.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server. Make sure it is running on port 3001.');
      // Keep question in input so user doesn't lose what they typed
      setInput(question);
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const resetChat = () => {
    if (sendingRef.current) return;
    setMessages([
      {
        role: 'model',
        text: '👋 **Chat reset!**\n\nAsk me anything about your loaded PDF document.',
        isWelcome: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
    setInput('');
    setError(null);
    fetchDocInfo();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 antialiased overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-slate-800 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">CampusGuide</h1>
              <span className="text-[11px] font-medium text-indigo-400 tracking-wider uppercase">Doc Intelligence</span>
            </div>
          </div>

          {/* Active PDF Badge */}
          <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                Active Document
              </span>
              <span className={`h-2 w-2 rounded-full ${docInfo.status === 'ready' ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-400 animate-pulse'}`} />
            </div>
            <p className="text-xs font-medium text-slate-200 line-clamp-3 leading-snug break-words" title={docInfo.fileName}>
              {docInfo.fileName}
            </p>
            {docInfo.status === 'ready' && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>Ready for queries</span>
              </div>
            )}
            {docInfo.status === 'error' && (
              <div className="pt-1 text-[11px] text-rose-400">
                {docInfo.error || 'Failed to locate PDF'}
              </div>
            )}
          </div>

          {/* Quick Guidance */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Document Topics
            </p>
            <div className="space-y-1.5">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/50 hover:bg-indigo-950/60 hover:border-indigo-500/50 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="truncate pr-2">{item.label}</span>
                  <Search className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Powered by Gemini AI
          </p>
          <p className="text-[11px] text-slate-500">Zero data hallucinations strict grounding mode.</p>
        </div>
      </aside>

      {/* Main Chat View */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 backdrop-blur px-5 py-3.5 z-10">
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">CampusGuide</span>
            </div>

            {/* Document preview chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 max-w-xs md:max-w-md">
              <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-300 truncate" title={docInfo.fileName}>
                {docInfo.fileName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetChat}
              disabled={isLoading}
              title="Reset conversation"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3.5 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md text-xs font-bold ${
                      isUser
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-600/30'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`group relative max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                        isUser
                          ? 'rounded-tr-none bg-indigo-600 text-white'
                          : 'rounded-tl-none border border-slate-800 bg-slate-800/90 text-slate-200'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:my-1 [&>strong]:text-indigo-300">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Meta info & actions */}
                    <div className="flex items-center gap-2 mt-1 px-1">
                      {msg.time && (
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      )}
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.text, index)}
                          title="Copy response"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200 p-0.5 rounded"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-800/90 px-5 py-4 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    Consulting document & formulating response...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 mx-auto max-w-3xl w-full">
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 backdrop-blur p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Error generating answer</p>
                <p className="mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-200 text-xs underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills (Mobile & Tablet) */}
        <div className="lg:hidden px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Prompts:
            </span>
            {quickPrompts.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.prompt)}
                disabled={isLoading}
                className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-white transition disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-lg">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask any question about your PDF (Shift+Enter for new line)..."
                className="flex-1 max-h-32 resize-none bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              CampusGuide AI answers strictly based on your PDF contents. Press Enter to send.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
