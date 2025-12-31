interface UploadingPlaceholderProps {
    progress: number;
    estimatedTime: number | null;
    statusText?: string;
}

export function UploadingPlaceholder({
    progress,
    estimatedTime,
    statusText,
}: UploadingPlaceholderProps) {
    const footerText =
        statusText || (estimatedTime == null ? 'Uploading…' : `${estimatedTime}s remaining`);

    return (
        <div className="w-64 max-w-full h-48 bg-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
            <div
                className="absolute inset-0 bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%`, opacity: 0.1 }}
            ></div>
            <svg
                className="animate-spin h-8 w-8 text-blue-600 mb-3 relative z-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            <div className="text-gray-700 text-base font-semibold mb-1 relative z-10">
                {progress}%
            </div>
            <div className="text-gray-600 text-sm relative z-10">{footerText}</div>
        </div>
    );
}
