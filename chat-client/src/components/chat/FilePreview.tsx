interface FilePreviewProps {
    file: File;
    progress: number;
    onRemove: () => void;
}

export function FilePreview({ file, progress, onRemove }: FilePreviewProps) {
    const isImage = file.type.startsWith('image/');
    const imageUrl = isImage ? URL.createObjectURL(file) : null;

    return (
        <div className="relative inline-block m-2 group">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {isImage ? (
                    <img src={imageUrl!} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-xs text-center p-1 break-all text-gray-500">
                        {file.name}
                    </div>
                )}

                {/* Progress Overlay */}
                {progress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{progress}%</span>
                    </div>
                )}
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                disabled={progress < 100 && progress > 0} // Disable remove while uploading if needed, or allow cancellation
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}
