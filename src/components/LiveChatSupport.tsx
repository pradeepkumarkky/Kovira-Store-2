import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import {
  MessageSquare,
  X,
  Send,
  Mail,
  Bot,
  User,
  Package,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const LiveChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_1',
      sender: 'support',
      text: "Namaste! Welcome to Kovira Store Concierge. I'm here to assist you with genuine products, PAN-India express delivery, instant UPI payments (QR, UPI ID & 1-click apps), and live order status.",
      timestamp: 'Just now',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.success) {
        const supportMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'support',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          orderAction: data.orderAction,
        };
        setMessages((prev) => [...prev, supportMsg]);
      } else {
        throw new Error('Support service unavailable');
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'support',
          text: "Our concierge desk is briefly experiencing high volume. Please check your order status using Track Order or try asking about your PIN code.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Track my order',
    'Do you deliver to my PIN code?',
    'Instant UPI Payment info',
    '7-day replacement warranty',
  ];

  return (
    <>
      {/* Floating Chat Trigger Button - Positioned above mobile bottom bar */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          id="toggle-live-chat-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:p-4 rounded-full shadow-2xl border border-slate-700 hover:border-cyan-400 transition-all duration-300 flex items-center justify-center active:scale-95 cursor-pointer"
          aria-label="Open Kovira Customer Support Chat"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </>
          )}
          {!isOpen && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:inline">
              Need Help? Chat with Us
            </span>
          )}
        </button>
      </div>

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          id="live-chat-window"
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-40 w-[calc(100vw-24px)] sm:w-[380px] bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh] h-[520px] animate-in slide-in-from-bottom-4 duration-200 text-slate-900"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sky-400">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  Kovira Customer Assistant
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                    Online
                  </span>
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 mt-0.5 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 24/7 Verified Customer Concierge
                </div>
              </div>
            </div>

            <button
              id="close-live-chat-panel-btn"
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close chat"
              aria-label="Close live chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-50 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between border-b border-slate-200 shrink-0">
            <span>Customer service & order assistance</span>
            <span className="text-emerald-700 font-bold">Fast Reply</span>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 overscroll-contain">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'support' && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Embedded Order Card if order was found */}
                  {msg.orderAction && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <Package className="w-3.5 h-3.5 text-sky-600" />
                        <span>Order #{msg.orderAction.orderNumber}</span>
                      </div>
                      <div className="text-slate-600">
                        Status: <strong className="text-emerald-700">{msg.orderAction.status}</strong>
                      </div>
                      <div className="text-slate-600">
                        Carrier: <strong>{msg.orderAction.carrier}</strong>
                      </div>
                      <div className="text-slate-600 font-mono text-[10px]">
                        Tracking: {msg.orderAction.trackingNumber}
                      </div>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                <span>Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about delivery, PIN code (e.g. 560001), or Order ID..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
