import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import type { Match } from '../lib/types';
import { useAuth } from '../providers/AuthProvider';
import { createSocket } from '../lib/socket';
import { Button } from '../components/ui/button';

interface ChatMessageDto {
  _id: string;
  match: string;
  item: string;
  sender: { _id: string; name: string; userId: string } | string;
  text: string;
  createdAt: string;
}

export function ChatPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!itemId) return;
      setLoading(true);
      try {
        const resMatch = await api.get(`/matches/by-item/${itemId}`);
        if (!resMatch.data.match) {
          setMatch(null);
          setMessages([]);
          return;
        }
        setMatch(resMatch.data.match);

        const resChat = await api.get(`/chat/${resMatch.data.match._id}`);
        setMessages(resChat.data.messages);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [itemId]);

  useEffect(() => {
    if (!user || !match) return;
    const socket = createSocket(user.userId);
    socketRef.current = socket;

    socket.emit('chat:join', { matchId: match._id });

    socket.on('chat:message', (msg: ChatMessageDto) => {
      if (msg.match !== match._id) return;
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, match]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!input.trim() || !user || !match || !socketRef.current) return;
    socketRef.current.emit('chat:message', {
      matchId: match._id,
      itemId,
      senderId: user._id,
      text: input.trim()
    });
    setInput('');
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-20 md:pb-6 text-xs text-slate-500">
        Loading chat…
      </div>
    );
  }

  if (!match) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-20 md:pb-6 text-xs text-slate-500">
        No active match chat found for this item yet.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-130px)] w-full max-w-5xl flex-col px-4 py-3 pb-20 md:pb-6">
      <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-slate-200 flex flex-col flex-1">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            <p className="text-[11px] font-semibold text-slate-900">Match chat</p>
            <p>
              {match.lostItem.title} ↔ {match.foundItem.title}
            </p>
          </div>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            {match.matchScore}% match
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 px-3 py-3 text-xs">
          {messages.map((m) => {
            const senderId = typeof m.sender === 'string' ? m.sender : m.sender._id;
            const isMe = user && senderId === user._id;
            return (
              <div key={m._id} className={isMe ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[70%] rounded-2xl px-3 py-2 ' +
                    (isMe
                      ? 'bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-soft'
                      : 'bg-white text-slate-800 shadow-sm')
                  }
                >
                  <p>{m.text}</p>
                  <p className="mt-1 text-[9px] opacity-70">
                    {typeof m.sender !== 'string' ? m.sender.name : ''}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message to coordinate handoff…"
            className="h-9 flex-1 rounded-full border border-slate-200 px-3 text-xs focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <Button type="button" size="default" className="h-9 px-4" onClick={sendMessage}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
