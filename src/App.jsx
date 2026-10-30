import React, { useState, useRef, useEffect } from 'react';
import {
  Key,
  Clock,
  Code,
  MapPin,
  User,
  Bot,
  AlertCircle,
  Send,
  GraduationCap
} from 'lucide-react';

// --- YOUR KNOWLEDGE BASE ---
const CAMPUS_KNOWLEDGE_BASE = `
You are CampusGuide AI, a helpful campus assistant.
Answer queries based ONLY on the following information. If a question is not covered in this guide, politely state that you do not have that information and suggest contacting the help desk.

FACILITIES & SCHEDULES:
- Computer Lab: Monday to Friday, 8:00 AM to 5:00 PM. Located in Tech Building, Room 302. Free access with student ID.
- Python Workshop: Every Friday at 2:00 PM in Innovation Hall, Room 105. Completely free. Open to beginners.
- Campus Library: 2nd Floor, Innovation Hall. Open Mon-Sat 7:00 AM - 9:00 PM.
- Student Cafeteria: Student Center Ground Floor. Serves lunch from 11:30 AM to 2:30 PM.
- Student name: Kaye Antoinette Panaligan
- Kaye has 3 cats and 1 dog.
- kaye has 2 students
`;

export default function CampusChatbot() {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'Hello! I am your CampusGuide assistant. How can I help you today?'
    }
  ]);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'When is the computer lab open?',
    'Tell me about the Python workshop',
    'Where is the campus library?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    if (!apiKey) {
      setError('Please add your Google AI Studio API key first.');
      setShowKeyInput(true);
      return;
    }

    setError(null);
    const newMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Injecting Knowledge Base & Constraints
            systemInstruction: {
              parts: [{ text: CAMPUS_KNOWLEDGE_BASE }]
            },
            contents: newMessages.map((m) => ({
              role: m.role,
              parts: [{ text: m.text }]
            }))
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch response');
      }

      const data = await response.json();
      const botResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';

      setMessages((prev) => [...prev, { role: 'model', text: botResponse }]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-24 w-24 text-indigo-600"  />
          <h1 className="text-base font-semibold text-indigo-600" style={{ color: '#4F46E5' }} >CampusGuide AI</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Key className="h-3.5 w-3.5 text-slate-500" />
            {apiKey ? 'API Key Configured' : 'Set Google AI Studio Key'}
          </button>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyInput && (
        <div className="border-b border-indigo-100 bg-indigo-50/70 px-6 py-3 transition-all">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Key className="h-4 w-4 text-indigo-600 shrink-0" />
            <input
              type="password"
              placeholder="Paste Google AI Studio API key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Computer Lab</p>
                <p className="text-slate-500">Mon-Fri, 8 AM - 5 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs">
              <Code className="h-4 w-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Python Workshop</p>
                <p className="text-slate-500">Fridays @ 2 PM (Free)</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Campus Library</p>
                <p className="text-slate-500">2nd Floor, Innovation Hall</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-tr-none bg-indigo-600 text-white'
                        : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Consulting campus records...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Suggested Queries Chips */}
      <div className="bg-slate-50 px-6 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Try asking:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <footer className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about the lab, workshop, or library..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          CampusGuide AI answers only verified institutional inquiries.
        </p>
      </footer>
    </div>
  );
}