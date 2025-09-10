import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatRoom from '../components/chat/ChatRoom';

export default function ChatRoomPage() {
  const { convId } = useParams();
  const { ready, isLoggedIn, member } = useAuth();
  const location = useLocation();

  if (!ready) return <main className="airbng-home">불러오는 중…</main>;
  if (!isLoggedIn) return <Navigate to="/page/login" replace state={{ from: location }} />;

  return (
    <main className="airbng-home">
      <ChatRoom convId={convId} meId={member?.memberId} />
    </main>
  );
}
