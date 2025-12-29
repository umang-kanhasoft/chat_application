import { useEffect } from 'react';

interface ImageModalProps {
    imageUrl: string;
    fileName: string;
    onClose: () => void;
}

export function ImageModal({ imageUrl, fileName, onClose }: ImageModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
            {/* Top Bar */}
            <div
                className="flex items-center justify-between px-4 py-3 text-white bg-black/60 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-sm truncate max-w-[80%]">{fileName}</span>
                <button onClick={onClose} className="text-2xl leading-none hover:text-gray-300">
                    ✕
                </button>
            </div>

            {/* Image Area */}
            <div
                className="flex-1 flex items-center justify-center px-4"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-h-full max-w-full object-contain rounded-lg"
                />
            </div>

            {/* Bottom Action Bar */}
            <div
                className="flex justify-center gap-6 px-4 py-3 bg-black/60 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-white hover:text-gray-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="text-sm">Download</span>
                </button>
            </div>
        </div>
    );
}
