import { useState, useEffect, useRef } from 'react';
import { cn } from '@extension/ui';

type User = { id: string; email: string; name: string; picture: string; tier: string; is_developer: boolean };
type Message = { id: string; user_id: string; sender_id: string; content: string; created_at: string; sender: { name: string; is_developer: boolean } };
type ChatUser = { id: string; name: string; email: string; is_developer: boolean };

export default function ChatApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'menu' | 'userChat' | 'developerChatList' | 'developerChat'>('userChat');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'SUPABASE_GET_SESSION' }, (res) => {
      if (res && res.user) {
        setUser(res.user);
        if (res.user.is_developer) {
          setView('menu');
        } else {
          setView('userChat');
        }
      } else {
        setView('userChat'); // Anon directly to chat
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-4 text-[#8c887a] text-center mt-10">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#22211c] text-[#fdfbf6]">
      {view === 'menu' && user && (
        <MainMenu 
          user={user} 
          onSelectUserChat={() => setView('userChat')} 
          onSelectDeveloperChatList={() => setView('developerChatList')} 
        />
      )}
      {view === 'userChat' && (
        <ChatInterface 
          user={user} 
          chatUserId={user?.id || 'anon'} 
          onBack={() => {
            if (user?.is_developer) setView('menu');
          }} 
        />
      )}
      {view === 'developerChatList' && (
        <DeveloperChatList 
          onBack={() => setView('menu')} 
          onSelectUser={(u) => {
            setSelectedUser(u);
            setView('developerChat');
          }} 
        />
      )}
      {view === 'developerChat' && selectedUser && (
        <ChatInterface 
          user={user} 
          chatUserId={selectedUser.id} 
          chatUserName={selectedUser.name}
          onBack={() => setView('developerChatList')} 
        />
      )}
    </div>
  );
}

function MainMenu({ user, onSelectUserChat, onSelectDeveloperChatList }: { user: User, onSelectUserChat: () => void, onSelectDeveloperChatList: () => void }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-[0.6rem] font-bold text-[#8c887a] uppercase tracking-[0.1em] mb-2 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-55"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Chat Menu
      </h2>
      <button 
        onClick={onSelectUserChat}
        className="w-full py-2.5 px-4 bg-[#2b2a24] border border-[#3e3c33] text-[#fdfbf6] rounded-lg hover:border-[#da892b] hover:text-[#e8a351] transition-colors shadow-sm text-sm font-semibold flex items-center justify-between"
      >
        <span>Chat with Developer</span>
        <span>&rarr;</span>
      </button>

      {user.is_developer && (
        <button 
          onClick={onSelectDeveloperChatList}
          className="w-full py-2.5 px-4 bg-[#5c3d14] border border-[#da892b] text-[#e8a351] rounded-lg hover:opacity-90 transition-colors shadow-sm text-sm font-semibold flex items-center justify-between mt-2"
        >
          <span>Developer Panel (View Users)</span>
          <span>&rarr;</span>
        </button>
      )}
    </div>
  );
}

function DeveloperChatList({ onBack, onSelectUser }: { onBack: () => void, onSelectUser: (user: ChatUser) => void }) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'CHAT_GET_USERS' }, (res) => {
      if (res && res.users) {
        setUsers(res.users);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#3e3c33] flex items-center bg-[#1a1915]">
        <button onClick={onBack} className="mr-3 px-2 py-1 bg-transparent border border-[#504d41] text-[#c7c3b5] rounded hover:border-[#da892b] hover:text-[#e8a351] transition-colors text-xs font-bold">
          &larr; Back
        </button>
        <h2 className="text-[0.6rem] font-bold text-[#8c887a] uppercase tracking-[0.1em] flex-1">Active Chats</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="text-center mt-4 text-[#8c887a] text-sm">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center mt-4 text-[#8c887a] text-sm">No active chats found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <button 
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="p-3 rounded-lg text-left transition-colors bg-[#2b2a24] border border-[#3e3c33] hover:border-[#da892b]"
              >
                <div className="font-semibold text-[#fdfbf6] text-sm">{u.name || 'Anonymous User'}</div>
                <div className="text-xs text-[#8c887a] mt-0.5">{u.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInterface({ user, chatUserId, chatUserName, onBack }: { user: User | null, chatUserId: string, chatUserName?: string, onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    if (!user) {
      setLoading(false);
      return; // Anon user has no messages
    }
    chrome.runtime.sendMessage({ type: 'CHAT_GET_MESSAGES', userId: chatUserId }, (res) => {
      if (res && res.messages) {
        setMessages(res.messages);
      }
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to send a message.");
      return;
    }
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue('');

    const tempMsg: Message = {
      id: Date.now().toString(),
      user_id: chatUserId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      sender: { name: user.name, is_developer: user.is_developer }
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom(), 100);

    chrome.runtime.sendMessage({ type: 'CHAT_SEND_MESSAGE', userId: chatUserId, content }, (res) => {
      if (!res || res.error) {
        console.error('Failed to send message:', res?.error);
        fetchMessages();
      } else {
        fetchMessages();
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#22211c]">
      <div className="p-3 border-b border-[#3e3c33] flex items-center bg-[#1a1915]">
        {user?.is_developer && (
          <button onClick={onBack} className="mr-3 px-2 py-1 bg-transparent border border-[#504d41] text-[#c7c3b5] rounded hover:border-[#da892b] hover:text-[#e8a351] transition-colors text-xs font-bold">
            &larr; Back
          </button>
        )}
        <h2 className="text-[0.6rem] font-bold text-[#8c887a] uppercase tracking-[0.1em] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {chatUserName ? `Chat: ${chatUserName}` : 'Support Chat'}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {loading && messages.length === 0 ? (
          <p className="text-center mt-4 text-[#8c887a] text-sm">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="text-center mt-10 opacity-60 flex flex-col items-center">
            <p className="text-sm mb-1 text-[#c7c3b5]">No messages yet.</p>
            {user ? (
              <p className="text-xs text-[#8c887a]">Start the conversation below!</p>
            ) : (
              <p className="text-xs text-[#da892b] font-bold">Please log in to chat with the developer.</p>
            )}
          </div>
        ) : (
          messages.map(msg => {
            const isMe = user && msg.sender_id === user.id;
            const isDev = msg.sender?.is_developer;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                <div className={`text-[0.65rem] mb-1 mx-1 text-[#8c887a] font-semibold flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <span>{msg.sender?.name || 'User'}</span>}
                  {isMe && <span>You</span>}
                  {isDev && (
                    <span className="bg-[#da892b]/20 text-[#e8a351] px-1.5 py-0.5 rounded text-[0.55rem] uppercase tracking-wider">
                      Support
                    </span>
                  )}
                </div>
                <div 
                  className={cn(
                    "px-3 py-2 shadow-sm break-words text-sm leading-relaxed",
                    isMe ? "rounded-l-2xl rounded-tr-2xl rounded-br-sm" : "rounded-r-2xl rounded-tl-2xl rounded-bl-sm",
                    isMe 
                      ? "bg-[#da892b] text-[#fff] shadow-[0_3px_10px_rgba(218,137,43,.25)]" 
                      : "bg-[#2b2a24] text-[#c7c3b5] border border-[#3e3c33]"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[#3e3c33] bg-[#1a1915]">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!user}
            placeholder={user ? "Type a message..." : "Please log in to chat..."} 
            className="flex-1 px-3 py-2 rounded-lg bg-[#2b2a24] border border-[#504d41] text-[#fdfbf6] text-sm focus:outline-none focus:border-[#da892b] transition-colors placeholder-[#8c887a] disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || !user}
            className="px-3 py-2 bg-[#da892b] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_3px_10px_rgba(218,137,43,.25)] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
