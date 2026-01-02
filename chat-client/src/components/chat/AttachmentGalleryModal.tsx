import type { Attachment } from '../../types/chat.types';

interface AttachmentGalleryModalProps {
    attachments: Attachment[];
    onClose: () => void;
    onImageClick: (url: string, name: string) => void;
}

export function AttachmentGalleryModal({
    attachments,
    onClose,
    onImageClick,
}: AttachmentGalleryModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-lg text-gray-800">
                        {attachments.length} Photos
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {attachments.map((attachment) => {
                            const imageUrl = attachment.url.startsWith('http')
                                ? attachment.url
                                : `${window.location.protocol}//${window.location.hostname}:4000${attachment.url}`;

                            return (
                                <div
                                    key={attachment.id}
                                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-all active:scale-95"
                                    onClick={() => onImageClick(imageUrl, attachment.file_name)}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={attachment.file_name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
