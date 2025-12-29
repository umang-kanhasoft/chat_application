import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useWebSocket } from '../../hooks/useWebSocket';

const getDefaultUserId = () => {
    const port = window.location.port;

    if (port === '5173') {
        return 'c1000000-1111-4aaa-9aaa-000000000001';
    }

    if (port === '5174') {
        return 'f2000000-0001-4bbb-8bbb-000000000001';
    }

    return '';
};

export function AuthScreen() {
    const [userId, setUserId] = useState(getDefaultUserId);
    const [error, setError] = useState('');
    const { connect, isConnecting } = useWebSocket();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId.trim()) {
            setError('Please enter your User ID');
            return;
        }

        setError('');
        try {
            await connect(userId.trim());
        } catch {
            setError('Failed to connect. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2">
                        💬 Chat
                    </h1>
                    <p className="text-gray-600">Connect to start messaging</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="User ID"
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        defaultValue={'c1000000-1111-4aaa-9aaa-000000000001'}
                        placeholder="c1000000-1111-4aaa-9aaa-000000000001"
                        error={error}
                        disabled={isConnecting}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isConnecting}
                        className="w-full"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Enter your user ID to access the chat</p>
                </div>
            </div>
        </div>
    );
}
