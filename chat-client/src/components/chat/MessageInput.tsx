import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import type { Attachment } from '../../types/chat.types';
import { Button } from '../ui/Button';
import { FilePreview } from './FilePreview';

interface MessageInputProps {
    onSendMessage: (content: string, attachments?: Attachment[], tempId?: string) => void;
    onUploadProgress?: (clientMsgId: string, progress: number, etaSeconds: number | null) => void;
    onTyping: (isTyping: boolean) => void;
    disabled?: boolean;
}

export function MessageInput({ onSendMessage, onUploadProgress, onTyping, disabled }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        isUploading,
        uploadProgress,
        uploadFile,
        error: uploadError,
        reset: resetUpload,
    } = useFileUpload();

    const handleSend = async () => {
        if (!message.trim() && !selectedFile) return;
        if (disabled) return;

        if (selectedFile) {
            const tempId = `temp_${Date.now()}`;
            const tempAttachment: Attachment = {
                id: tempId,
                file_name: selectedFile.name,
                file_size: selectedFile.size,
                mime_type: selectedFile.type,
                url: 'uploading',
            };
            
            const messageContent = message;
            onSendMessage(messageContent, [tempAttachment], tempId);
            setMessage('');
            const fileToUpload = selectedFile;
            setSelectedFile(null);
            onTyping(false);

            // Upload in background and send real attachment
            const uploaded = await uploadFile(fileToUpload, (progress, etaSeconds) => {
                onUploadProgress?.(tempId, progress, etaSeconds);
            });
            if (uploaded) {
                onSendMessage(messageContent, [uploaded], tempId);
            }
        } else {
            onSendMessage(message);
            setMessage('');
            onTyping(false);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        resetUpload();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);

        if (!disabled) {
            onTyping(true);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 1000);
        }
    };

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            {selectedFile && (
                <div className="mb-2">
                    <FilePreview
                        file={selectedFile}
                        progress={uploadProgress}
                        onRemove={handleRemoveFile}
                    />
                    {uploadError && <div className="text-red-500 text-xs mt-1">{uploadError}</div>}
                </div>
            )}

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={disabled || isUploading}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>

                <input
                    type="text"
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={disabled || isUploading}
                />

                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && !selectedFile) || isUploading}
                    isLoading={false}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </Button>
            </div>
        </div>
    );
}
