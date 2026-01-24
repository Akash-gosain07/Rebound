import { useState } from 'react';

export default function MatchChat({ status = 'active', onSendMessage }) {
    const [minimized, setMinimized] = useState(false);
    const [msgInput, setMsgInput] = useState('');

    // Dummy messages for showcase
    const messages = [
        { id: 1, sender: 'them', text: 'Hey, I am at the location.' },
        { id: 2, sender: 'me', text: 'Great, coming in 2 mins.' },
    ];

    if (status === 'closed') return null;

    return (
        <div
            className={`fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 z-50 ${minimized ? 'h-14' : 'h-96'}`}
        >
            {/* Header */}
            <div
                className={`px-4 py-3 flex items-center justify-between cursor-pointer ${status === 'grace_period' ? 'bg-amber-500' : 'bg-teal-600'}`}
                onClick={() => setMinimized(!minimized)}
            >
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <span>{status === 'grace_period' ? '⏳ Grace Period' : '💬 Chat'}</span>
                    {status === 'grace_period' && <span className="text-white/80 font-mono text-xs ml-1">09:42</span>}
                </div>
                <button
                    className="text-white/80 hover:text-white transition-colors p-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMinimized(!minimized);
                    }}
                >
                    {minimized ? '+' : '−'}
                </button>
            </div>

            {/* Body */}
            {!minimized && (
                <div className="flex flex-col h-[calc(100%-3.5rem)]">
                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 text-xs">
                        {status === 'grace_period' && (
                            <div className="text-center text-[10px] text-slate-400 my-2">
                                Grace period active. Chat closes automatically in 10 minutes.
                            </div>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${m.sender === 'me'
                                    ? 'bg-teal-500 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
                        />
                        <button className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
