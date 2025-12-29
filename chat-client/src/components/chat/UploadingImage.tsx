interface UploadingImageProps {
    url: string;
    fileName: string;
    progress: number;
    estimatedTime: number;
}

export function UploadingImage({ url, fileName, progress, estimatedTime }: UploadingImageProps) {
    return (
        <div className="relative rounded-lg overflow-hidden">
            <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-64 object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <div className="bg-white rounded-full p-3 mb-2">
                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <div className="text-white text-sm font-medium">{progress}%</div>
                <div className="text-white text-xs mt-1">{estimatedTime}s remaining</div>
            </div>
        </div>
    );
}
