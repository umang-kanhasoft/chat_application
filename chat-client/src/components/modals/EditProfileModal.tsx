import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { graphqlFetch } from '../../services/graphql.service';
import { useAuthStore } from '../../store/authStore';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { currentUserId, currentUserName, setUser } = useAuthStore();
    const [name, setName] = useState(currentUserName || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await graphqlFetch(
                `mutation updateUser($id: ID!, $data: UpdateUserInput!) {
                    updateUser(id: $id, data: $data) {
                        id
                        name
                    }
                }`,
                {
                    id: currentUserId,
                    data: { name: name.trim() }
                }
            );

            setUser(currentUserId!, name.trim());
            onClose();
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-fade-in scale-100 opacity-100">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                    <p className="text-gray-500 text-sm mt-1">Update your personal information</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSave} isLoading={isLoading}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
