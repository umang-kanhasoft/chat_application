import { useState } from 'react';
import { MessageStatus, type Message } from '../../types/chat.types';
import { cn, formatMessageTime, getStatusIcon } from '../../utils/helpers';
import { ImageModal } from './ImageModal';
import { UploadingPlaceholder } from './UploadingPlaceholder';
import { AttachmentGalleryModal } from './AttachmentGalleryModal';

interface MessageBubbleProps {
    message: Message;
    isSent: boolean;
    onMediaLoad?: () => void;
    onReply?: (message: Message) => void;
    onReaction?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({ message, isSent, onMediaLoad, onReply, onReaction }: MessageBubbleProps) {
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
    const [showGallery, setShowGallery] = useState(false);

    // ...

    // Update onTouchEnd to differentiate double tap if needed, or just use onDoubleClick for desktop/web.
    // For mobile double tap, we might need a custom hook or library, but for now standard onDoubleClick works on most mobile browsers.

    const handleDoubleTap = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onReaction) {
            onReaction(message.id, '❤️'); // Default heart
        }
    };

    // Swipe state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const minSwipeDistance = 50;

    const messageUploadProgress =
        typeof message.uploadProgress === 'number' ? message.uploadProgress : 0;
    const messageUploadEtaSeconds = message.uploadEtaSeconds ?? null;

    const attachments = message.attachments || [];
    const imageAttachments = attachments.filter((a) => a.mime_type.startsWith('image/'));
    const nonImageAttachments = attachments.filter((a) => !a.mime_type.startsWith('image/'));

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // Only allow Right Swipe (and only if not sent by me? Actually WhatsApp allows swipe reply on all)
        if (diff > 0 && diff < 100) {
            setSwipeOffset(diff);
        }
    };

    const onTouchEnd = () => {
        if (!touchStart) return;
        if (swipeOffset > minSwipeDistance) {
            // Trigger Reply
            onReply?.(message);
        }
        setSwipeOffset(0);
        setTouchStart(null);
    };

    const renderImageGrid = () => {
        if (imageAttachments.length === 0) return null;

        const displayCount = Math.min(imageAttachments.length, 4);
        const displayImages = imageAttachments.slice(0, displayCount);
        const remainingCount = imageAttachments.length - 4;

        // Grid configurations based on count
        let gridClass = 'grid gap-1';
        if (displayCount === 1) gridClass += ' grid-cols-1';
        else if (displayCount === 2) gridClass += ' grid-cols-2';
        else if (displayCount === 3)
            gridClass += ' grid-cols-2'; // Special handling for 3
        else gridClass += ' grid-cols-2'; // 2x2 for 4

        return (
            <div className={cn('overflow-hidden rounded-xl', gridClass)}>
                {displayImages.map((attachment, index) => {
                    const imageUrl = attachment.url.startsWith('http')
                        ? attachment.url
                        : `${window.location.protocol}//${window.location.hostname}:4000${attachment.url}`;

                    const isOverlay = index === 3 && remainingCount > 0;

                    // Layout style for 3 images: First image spans 2 cols
                    const isThreeImages = displayCount === 3;
                    const style = isThreeImages && index === 0 ? { gridColumn: 'span 2' } : {};

                    const attachmentUploadProgress =
                        typeof attachment.uploadProgress === 'number'
                            ? attachment.uploadProgress
                            : messageUploadProgress;

                    const attachmentUploadEtaSeconds =
                        attachment.uploadEtaSeconds ?? messageUploadEtaSeconds;

                    const isFinishing =
                        attachment.url === 'uploading' && attachmentUploadProgress >= 100;

                    const isUploading = attachment.url === 'uploading';

                    // Special case: Single image needs timestamp overlay
                    const isSingleImage = displayCount === 1;

                    return (
                        <div
                            key={attachment.id}
                            className="relative aspect-square cursor-pointer active:opacity-90 transition-opacity bg-black/5"
                            style={style}
                            onClick={() => {
                                if (isUploading) return;
                                if (isOverlay) {
                                    setShowGallery(true);
                                } else {
                                    setSelectedImage({ url: imageUrl, name: attachment.file_name });
                                }
                            }}
                        >
                            {isUploading ? (
                                <UploadingPlaceholder
                                    progress={isFinishing ? 100 : attachmentUploadProgress}
                                    estimatedTime={isFinishing ? null : attachmentUploadEtaSeconds}
                                    statusText={isFinishing ? 'Finishing…' : undefined}
                                />
                            ) : (
                                <img
                                    src={imageUrl}
                                    alt={attachment.file_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onLoad={onMediaLoad}
                                />
                            )}

                            {isOverlay && !isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-2xl font-medium">
                                        +{remainingCount + 1}
                                    </span>
                                </div>
                            )}

                            {/* Timestamp Overlay for Single Image */}
                            {isSingleImage && !isUploading && !message.content && (
                                <div className="absolute bottom-0 right-0 left-0 p-2 bg-lienar-to-t from-black/60 to-transparent flex justify-end items-end rounded-b-xl">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-white/90 select-none">
                                            {formatMessageTime(
                                                message.createdAt || message.timestamp!,
                                            )}
                                        </span>
                                        {isSent && (
                                            <span
                                                className={cn(
                                                    'text-sm select-none',
                                                    message.status === MessageStatus.READ
                                                        ? 'text-blue-400'
                                                        : 'text-white/80',
                                                )}
                                            >
                                                {getStatusIcon(message.status)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const hasSingleImageNoText =
        imageAttachments.length === 1 && !message.content && nonImageAttachments.length === 0;

    return (
        <div
            className={cn(
                'flex w-full select-none touch-pan-y',
                isSent ? 'justify-end' : 'justify-start',
            )}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                transform: `translateX(${swipeOffset}px)`,
                transition:
                    swipeOffset === 0 ? 'transform 0.2s cubic-bezier(0.2, 0.9, 0.42, 1)' : 'none',
            }}
        >
            <div
                className={`
                        max-w-[85%] md:max-w-[70%] rounded-xl shadow-sm relative group
                        ${isSent
                        ? 'bg-primary text-white rounded-tr-none' // WhatsApp-like: Sent top-right corner square? Usually Sent is Right-side. Rounded corners usually: Top-Left, Bottom-Left, Bottom-Right (Tip).
                        : 'bg-white text-gray-900 rounded-tl-none shadow' // Received: Left-side. Top-Right, Bottom-Right, Bottom-Left.
                    // Actually sticking to current rounding style but tightening padding
                    }
                     ${hasSingleImageNoText ? 'p-1' : 'px-1.5 py-1.5'}
                    `}
                onDoubleClick={handleDoubleTap}
            >
                <div className="flex flex-col gap-1">
                    {/* Reply Preview */}
                    {message.replyTo && (
                        <div
                            className="mb-1 rounded bg-black/5 p-1 text-[11px] border-l-[3px] border-primary/50 cursor-pointer overflow-hidden max-w-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Could scroll to message here
                            }}
                        >
                            <div className="font-medium text-primary-dark opacity-80 truncate">
                                {message.replyTo.sender.name}
                            </div>
                            <div className="text-gray-500 truncate line-clamp-1">
                                {message.replyTo.content || 'Photo'}
                            </div>
                        </div>
                    )}

                    {/* Image Grid */}
                    {renderImageGrid()}

                    {/* Non-image attachments (Docs, etc) */}
                    {nonImageAttachments.length > 0 && (
                        <div className="flex flex-col gap-1 px-1 pt-1">
                            {nonImageAttachments.map((attachment) => {
                                const fileUrl = attachment.url.startsWith('http')
                                    ? attachment.url
                                    : `${window.location.protocol}//${window.location.hostname}:4000${attachment.url}`;

                                return (
                                    <div
                                        key={attachment.id}
                                        className="rounded-lg overflow-hidden bg-black/5"
                                    >
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-2 hover:bg-black/10 transition-colors"
                                        >
                                            <span className="text-2xl">📄</span>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium truncate">
                                                    {attachment.file_name}
                                                </p>
                                                <p className="text-xs opacity-70">
                                                    {(attachment.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Text Content + Floating Timestamp */}
                    {message.content && (
                        <div
                            className={cn(
                                'relative text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap px-1.5',
                                // Padding adjustments for inline timestamp look
                                'pb-1',
                            )}
                        >
                            <span className="inline-block">{message.content}</span>

                            {/* Invisible spacer to push timestamp if needed? No, float triggers wrap. 
                           WhatsApp style: Text....       12:00 PM (Float Right)
                           If text overlaps, it wraps and time stays bottom right.
                           We use a span float-right with positive relative positioning to sit on the last line if space.
                           */}
                            <span className="float-right inline-flex items-center gap-1 ml-3 relative top-1.25">
                                <span
                                    className={cn(
                                        'text-[11px] select-none',
                                        isSent ? 'text-white/70' : 'text-gray-500',
                                    )}
                                >
                                    {formatMessageTime(message.createdAt || message.timestamp!)}
                                </span>
                                {isSent && (
                                    <span
                                        className={cn(
                                            'text-sm select-none',
                                            message.status === MessageStatus.READ
                                                ? 'text-white' // Check ticks color. Usually Blue for Read.
                                                : 'text-white/60',
                                        )}
                                    >
                                        {getStatusIcon(message.status)}
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Meta (Time & Status) - ONLY render if NOT handled by SingleImage overlay OR Text float */}
                    {!hasSingleImageNoText && !message.content && (
                        <div className="flex items-center justify-end gap-1 px-1 pb-1">
                            <span
                                className={cn(
                                    'text-[11px] select-none',
                                    isSent ? 'text-white/80' : 'text-gray-500',
                                )}
                            >
                                {formatMessageTime(message.createdAt || message.timestamp!)}
                            </span>
                            {isSent && (
                                <span
                                    className={cn(
                                        'text-sm select-none',
                                        message.status === MessageStatus.READ
                                            ? 'text-white'
                                            : 'text-white/60',
                                    )}
                                >
                                    {getStatusIcon(message.status)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Reactions Overlay */}
            {message.reactions && message.reactions.length > 0 && (
                <div
                    className={cn(
                        "absolute -bottom-2 z-10 flex gap-0.5",
                        isSent ? "right-2" : "left-2"
                    )}
                >
                    <div className="bg-white rounded-full shadow-sm border border-gray-100 px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-gray-700">
                        {message.reactions.map((reaction, i) => (
                            <span key={i} className="flex items-center gap-0.5">
                                <span>{reaction.emoji}</span>
                                {reaction.count > 1 && <span className="font-medium">{reaction.count}</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedImage && (
                <ImageModal
                    imageUrl={selectedImage.url}
                    fileName={selectedImage.name}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            {showGallery && (
                <AttachmentGalleryModal
                    attachments={imageAttachments}
                    onClose={() => setShowGallery(false)}
                    onImageClick={(url, name) => {
                        setSelectedImage({ url, name });
                    }}
                />
            )}
        </div>
    );
}
