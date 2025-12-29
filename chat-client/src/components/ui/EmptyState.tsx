interface EmptyStateProps {
    icon: string;
    message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4 opacity-50">{icon}</div>
            <p className="text-lg">{message}</p>
        </div>
    );
}
