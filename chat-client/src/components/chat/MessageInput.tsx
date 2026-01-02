import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { Attachment, Message } from '../../types/chat.types';
import { Button } from '../ui/Button';
import { FilePreview } from './FilePreview';

interface MessageInputProps {
    onSendMessage: (
        content: string,
        attachments?: Attachment[],
        tempId?: string,
        replyTo?: Message | null,
    ) => void;
    onUploadProgress?: (
        clientMsgId: string,
        attachmentId: string,
        progress: number,
        etaSeconds: number | null,
    ) => void;
    onTyping: (isTyping: boolean) => void;
    disabled?: boolean;
}

export function MessageInput({
    onSendMessage,
    onUploadProgress,
    onTyping,
    disabled,
}: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<
        Array<{
            id: string;
            file: File;
            progress: number;
            etaSeconds: number | null;
            error?: string;
        }>
    >([]);
    const [isUploadingBatch, setIsUploadingBatch] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tempIdCounterRef = useRef(0);

    const { uploadFile } = useFileUpload();

    const handleSend = async () => {
        if (!message.trim() && selectedFiles.length === 0) return;
        if (disabled) return;
        if (isUploadingBatch) return;

        if (selectedFiles.length > 0) {
            const tempId = `temp_${tempIdCounterRef.current++}`;
            const messageContent = message;

            const queue = selectedFiles.map((sf) => {
                const tempAttachment: Attachment = {
                    id: sf.id,
                    file_name: sf.file.name,
                    file_size: sf.file.size,
                    mime_type: sf.file.type,
                    url: 'uploading',
                    uploadProgress: 0,
                    uploadEtaSeconds: null,
                };
                return { ...sf, tempAttachment };
            });

            onSendMessage(
                messageContent,
                queue.map((q) => q.tempAttachment),
                tempId,
            );

            setMessage('');
            onTyping(false);
            setIsUploadingBatch(true);

            let finalAttachments: Attachment[] = [...queue.map((q) => q.tempAttachment)];

            const updateFinalAttachments = (
                attachmentId: string,
                attachment: Attachment | null,
            ) => {
                const idx = finalAttachments.findIndex((a) => a.id === attachmentId);
                if (attachment) {
                    if (idx > -1) {
                        finalAttachments = finalAttachments.map((a) =>
                            a.id === attachmentId ? attachment : a,
                        );
                    } else {
                        finalAttachments = [...finalAttachments, attachment];
                    }
                } else {
                    if (idx > -1) {
                        finalAttachments = finalAttachments.filter((a) => a.id !== attachmentId);
                    }
                }

                onSendMessage(messageContent, [...finalAttachments], tempId);
            };

            const uploadOne = async (item: (typeof queue)[number]) => {
                const uploaded = await uploadFile(item.file, (progress, etaSeconds) => {
                    onUploadProgress?.(tempId, item.id, progress, etaSeconds);
                    setSelectedFiles((prev) =>
                        prev.map((sf) =>
                            sf.id === item.id ? { ...sf, progress, etaSeconds } : sf,
                        ),
                    );
                });

                const fixedUploaded = uploaded ? { ...uploaded, id: item.id } : null;
                updateFinalAttachments(item.id, fixedUploaded);
            };

            const concurrency = 3;
            let nextIndex = 0;
            const worker = async () => {
                while (nextIndex < queue.length) {
                    const idx = nextIndex;
                    nextIndex += 1;
                    await uploadOne(queue[idx]);
                }
            };

            await Promise.all(
                Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()),
            );

            setSelectedFiles([]);
            setIsUploadingBatch(false);
        } else {
            if (message.trim()) {
                onSendMessage(message, undefined, undefined, replyingToMessage);
                setMessage('');
                onTyping(false);
            }
        }

        setReplyingToMessage(null);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const picked = Array.from(e.target.files);
        setSelectedFiles((prev) => {
            const next = [...prev];
            for (const file of picked) {
                next.push({ id: crypto.randomUUID(), file, progress: 0, etaSeconds: null });
            }
            return next;
        });

        // Allow picking the same file again
        e.target.value = '';
    };

    const handleRemoveFile = (id: string) => {
        if (isUploadingBatch) return;
        setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
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

    const { replyingToMessage, setReplyingToMessage, projectUsers } = useChatStore();
    const { currentUserId } = useAuthStore();

    // Helper to get user name
    const getSenderName = (senderId: string) => {
        if (senderId === currentUserId) return 'You';
        const user = projectUsers.find((u) => u.id === senderId);
        return user?.name || 'Unknown';
    };

    return (
        <div className="px-3 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white/90 backdrop-blur border-t border-black/10">
            {/* Reply Preview */}
            {replyingToMessage && (
                <div className="flex items-center gap-3 p-2 mb-2 bg-gray-50 rounded-lg border-l-4 border-primary/60">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary/80 mb-0.5">
                            {getSenderName(replyingToMessage.sender_id)}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                            {replyingToMessage.attachments?.some((a) =>
                                a.mime_type.startsWith('image/'),
                            )
                                ? '📷 Photo'
                                : replyingToMessage.content}
                        </p>
                    </div>
                    {replyingToMessage.attachments?.find((a) =>
                        a.mime_type.startsWith('image/'),
                    ) && (
                            <div className="w-10 h-10 rounded-md overflow-hidden">
                                <img
                                    src={
                                        replyingToMessage.attachments
                                            .find((a) => a.mime_type.startsWith('image/'))
                                            ?.url.startsWith('http')
                                            ? replyingToMessage.attachments.find((a) =>
                                                a.mime_type.startsWith('image/'),
                                            )?.url
                                            : `${window.location.protocol}//${window.location.hostname}:4000${replyingToMessage.attachments.find((a) => a.mime_type.startsWith('image/'))?.url}`
                                    }
                                    alt="Reply preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    <button
                        onClick={() => setReplyingToMessage(null)}
                        className="p-1 hover:bg-black/5 rounded-full text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className="mb-2">
                    <div className="flex flex-wrap">
                        {selectedFiles.map((sf) => (
                            <FilePreview
                                key={sf.id}
                                file={sf.file}
                                progress={sf.progress}
                                onRemove={() => handleRemoveFile(sf.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="*/*"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-black/5 active:bg-black/10 rounded-full transition-colors"
                    disabled={disabled || isUploadingBatch}
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
                    placeholder={
                        selectedFiles.length > 0 ? 'Add a caption...' : 'Type a message...'
                    }
                    className="flex-1 px-4 py-2.5 border border-black/10 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    disabled={disabled || isUploadingBatch}
                />

                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && selectedFiles.length === 0) || isUploadingBatch}
                    isLoading={false}
                    className="rounded-full w-11 h-11 p-0 shadow-sm"
                    aria-label="Send"
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
