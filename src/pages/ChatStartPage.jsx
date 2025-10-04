import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StartConversation from '../components/chat/StartConversation';

export default function ChatStartPage() {
  const { ready, isLoggedIn } = useAuth();
  const location = useLocation();

  if (!ready) return <main className="airbng-home">불러오는 중…</main>;
  if (!isLoggedIn) return <Navigate to="/page/login" replace state={{ from: location }} />;

  return (
    <main className="airbng-home">
      <StartConversation />
    </main>
  );
}
