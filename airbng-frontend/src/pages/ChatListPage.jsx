import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import LoginRequired from '../components/chat/LoginRequired';

export default function ChatListPage() {
  const { ready, isLoggedIn } = useAuth();
  if (!ready) return <main className="airbng-home">불러오는 중…</main>;

  return (
    <main className="airbng-home">
      {isLoggedIn ? <ChatList /> : <LoginRequired kind="채팅" />}
    </main>
  );
}
