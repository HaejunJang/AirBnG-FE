import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import LoginRequired from '../components/chat/LoginRequired';
import '../styles/chat.css';
import Header from '../components/Header/Header';

export default function ChatListPage() {
  const { ready, isLoggedIn } = useAuth();
  return (
    <div className="airbng-chat">
      <div className="container">
        <Header 
          headerTitle="채팅"
          showBackButton={true}
          showHomeButton={true}
          homeUrl="/"
        />
        <main className="main-content">
          {!ready ? (
            <div>불러오는 중…</div>
          ) : isLoggedIn ? (
            <ChatList />
          ) : (
            <LoginRequired kind="채팅" />
          )}
        </main>
      </div>
    </div>
  );
}
