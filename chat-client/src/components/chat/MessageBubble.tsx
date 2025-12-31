import { useState } from 'react';
import { MessageStatus, type Message } from '../../types/chat.types';
import { cn, formatMessageTime, getStatusIcon } from '../../utils/helpers';
import { ImageModal } from './ImageModal';
import { UploadingPlaceholder } from './UploadingPlaceholder';

interface MessageBubbleProps {
    message: Message;
    isSent: boolean;
    onMediaLoad?: () => void;
}

export function MessageBubble({ message, isSent, onMediaLoad }: MessageBubbleProps) {
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
    const messageUploadProgress =
        typeof message.uploadProgress === 'number' ? message.uploadProgress : 0;
    const messageUploadEtaSeconds = message.uploadEtaSeconds ?? null;

    return (
        <div className={cn('flex w-full', isSent ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm border border-black/5',
                    isSent
                        ? 'bg-chat-sent text-gray-900 rounded-br-md'
                        : 'bg-chat-received text-gray-900 rounded-bl-md',
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

                                const attachmentUploadProgress =
                                    typeof attachment.uploadProgress === 'number'
                                        ? attachment.uploadProgress
                                        : messageUploadProgress;
                                const attachmentUploadEtaSeconds =
                                    attachment.uploadEtaSeconds ?? messageUploadEtaSeconds;
                                const isFinishing =
                                    attachment.url === 'uploading' &&
                                    attachmentUploadProgress >= 100;

                                return (
                                    <div key={attachment.id} className="rounded-xl overflow-hidden">
                                        {attachment.url === 'uploading' ? (
                                            <UploadingPlaceholder
                                                progress={
                                                    isFinishing ? 100 : attachmentUploadProgress
                                                }
                                                estimatedTime={
                                                    isFinishing ? null : attachmentUploadEtaSeconds
                                                }
                                                statusText={isFinishing ? 'Finishing…' : undefined}
                                            />
                                        ) : attachment.mime_type.startsWith('image/') ? (
                                            <div className="w-full h-48 bg-black/5">
                                                <img
                                                    src={imageUrl}
                                                    alt={attachment.file_name}
                                                    className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                                    loading="lazy"
                                                    onLoad={() => {
                                                        onMediaLoad?.();
                                                    }}
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
                                            </div>
                                        ) : (
                                            <a
                                                href={imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 bg-black/5 p-2.5 rounded-lg hover:bg-black/10 transition-colors"
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
                            <div className="text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                                {message.content}
                            </div>
                        )}
                    </div>
                )}

                {message.content && message.content.trim() && !message.attachments?.length && (
                    <div className="text-[15px] leading-relaxed wrap-break-words whitespace-pre-wrap">
                        {message.content}
                    </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1.5">
                    <span className="text-[11px] text-gray-500 select-none">
                        {formatMessageTime(message.createdAt || message.timestamp!)}
                    </span>
                    {isSent && (
                        <span
                            className={cn(
                                'text-sm select-none',
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
