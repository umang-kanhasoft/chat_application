import { useState } from 'react';
import { MessageStatus, type Message } from '../../types/chat.types';
import { formatMessageTime, getStatusIcon } from '../../utils/helpers';
import { cn } from '../../utils/helpers';
import { ImageModal } from './ImageModal';
import { UploadingPlaceholder } from './UploadingPlaceholder';

interface MessageBubbleProps {
    message: Message;
    isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
    const isUploading = message.attachments?.some((a) => a.url === 'uploading');

    const uploadProgress = typeof message.uploadProgress === 'number' ? message.uploadProgress : 0;
    const uploadEtaSeconds = message.uploadEtaSeconds ?? null;
    const isFinishing = isUploading && uploadProgress >= 100;

    return (
        <div className={cn('flex w-full mb-1', isSent ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                    isSent
                        ? 'bg-chat-sent text-gray-800 rounded-br-none'
                        : 'bg-chat-received text-gray-800 rounded-bl-none',
                )}
            >
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            {message.attachments.map((attachment) => {
                                // Handle both relative and absolute URLs
                                const imageUrl = attachment.url.startsWith('http')
                                    ? attachment.url
                                    : `${window.location.protocol}//${window.location.hostname}:4000${attachment.url}`;
                                return (
                                    <div key={attachment.id} className="rounded-lg overflow-hidden">
                                        {attachment.mime_type.startsWith('image/') ? (
                                            attachment.url === 'uploading' ? (
                                                <UploadingPlaceholder
                                                    progress={isFinishing ? 100 : uploadProgress}
                                                    estimatedTime={
                                                        isFinishing ? null : uploadEtaSeconds
                                                    }
                                                    statusText={
                                                        isFinishing ? 'Finishing…' : undefined
                                                    }
                                                />
                                            ) : (
                                                <img
                                                    src={imageUrl}
                                                    alt={attachment.file_name}
                                                    className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error(
                                                            'Image load error:',
                                                            imageUrl,
                                                        );
                                                        e.currentTarget.src =
                                                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage failed%3C/text%3E%3C/svg%3E';
                                                    }}
                                                    onClick={() =>
                                                        setSelectedImage({
                                                            url: imageUrl,
                                                            name: attachment.file_name,
                                                        })
                                                    }
                                                />
                                            )
                                        ) : (
                                            <a
                                                href={imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-black/10 p-2 rounded hover:bg-black/20 transition-colors"
                                            >
                                                <span className="text-2xl">📄</span>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium truncate">
                                                        {attachment.file_name}
                                                    </p>
                                                    <p className="text-xs opacity-70">
                                                        {(attachment.file_size / 1024).toFixed(1)}{' '}
                                                        KB
                                                    </p>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {message.content && message.content.trim() && (
                            <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                {message.content}
                            </div>
                        )}
                    </div>
                )}

                {message.content && message.content.trim() && !message.attachments?.length && (
                    <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                        {message.content}
                    </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-gray-500">
                        {formatMessageTime(message.createdAt || message.timestamp!)}
                    </span>
                    {isSent && (
                        <span
                            className={cn(
                                'text-sm',
                                message.status === MessageStatus.READ
                                    ? 'text-blue-500'
                                    : 'text-gray-400',
                            )}
                        >
                            {getStatusIcon(message.status)}
                        </span>
                    )}
                </div>
            </div>
            {selectedImage && (
                <ImageModal
                    imageUrl={selectedImage.url}
                    fileName={selectedImage.name}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
}
