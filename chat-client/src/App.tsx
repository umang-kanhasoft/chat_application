import { useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { ChatLayout } from './components/layout/ChatLayout';
import { useAuthStore } from './store/authStore';
import { useWebSocket } from './hooks/useWebSocket';
import { useConnectionStore } from './store/connectionStore';
import { ConnectionStatus } from './types/chat.types';

function App() {
  const { isAuthenticated, currentUserId } = useAuthStore();
  const { connect, loadProjects, isConnected } = useWebSocket();
  const { status } = useConnectionStore();

  // Handle auto-connect on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && currentUserId && !isConnected) {
      connect(currentUserId);
    }
  }, [isAuthenticated, currentUserId, isConnected, connect]);

  // Load projects when authenticated and connected
  useEffect(() => {
    if (isAuthenticated && status === ConnectionStatus.CONNECTED) {
      loadProjects();
    }
  }, [isAuthenticated, status, loadProjects]);

  // Show connection status banner
  const showConnectionBanner = status === ConnectionStatus.RECONNECTING || status === ConnectionStatus.CONNECTING;

  return (
    <>
      {showConnectionBanner && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50 text-sm font-medium">
          {status === ConnectionStatus.RECONNECTING ? '🔄 Reconnecting...' : '🔌 Connecting...'}
        </div>
      )}

      <div className={showConnectionBanner ? 'pt-10' : ''}>
        {isAuthenticated ? <ChatLayout /> : <AuthScreen />}
      </div>
    </>
  );
}

export default App;
