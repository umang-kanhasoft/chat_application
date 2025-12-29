import { useState, useCallback } from 'react';
import { uploadService, type UploadProgressInfo } from '../services/upload.service';
import type { Attachment } from '../types/chat.types';

interface UseFileUploadReturn {
    isUploading: boolean;
    uploadProgress: number;
    uploadEtaSeconds: number | null;
    uploadFile: (
        file: File,
        onProgress?: (
            progress: number,
            etaSeconds: number | null,
            info: UploadProgressInfo,
        ) => void,
    ) => Promise<Attachment | null>;
    error: string | null;
    reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadEtaSeconds, setUploadEtaSeconds] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(
        async (
            file: File,
            onProgress?: (
                progress: number,
                etaSeconds: number | null,
                info: UploadProgressInfo,
            ) => void,
        ): Promise<Attachment | null> => {
            setIsUploading(true);
            setUploadProgress(0);
            setUploadEtaSeconds(null);
            setError(null);

            let lastTs = Date.now();
            let lastLoaded = 0;
            let smoothedBps: number | null = null;

            try {
                const result = await uploadService.uploadFile(file, (info) => {
                    const now = Date.now();
                    const dtSec = Math.max(0.001, (now - lastTs) / 1000);
                    const dLoaded = Math.max(0, info.loaded - lastLoaded);
                    const instantBps = dLoaded / dtSec;

                    if (instantBps > 0) {
                        smoothedBps =
                            smoothedBps == null ? instantBps : smoothedBps * 0.8 + instantBps * 0.2;
                    }

                    lastTs = now;
                    lastLoaded = info.loaded;

                    const percent = info.percent;
                    setUploadProgress(percent);

                    let etaSeconds: number | null = null;
                    if (smoothedBps && smoothedBps > 0 && info.total > info.loaded) {
                        etaSeconds = Math.max(
                            0,
                            Math.round((info.total - info.loaded) / smoothedBps),
                        );
                    }
                    setUploadEtaSeconds(etaSeconds);
                    onProgress?.(percent, etaSeconds, info);
                });
                return {
                    id: crypto.randomUUID(),
                    file_name: result.fileName,
                    file_size: result.fileSize,
                    mime_type: result.mimeType,
                    url: result.url,
                    public_id: result.publicId,
                };
            } catch (err) {
                console.error('Upload error:', err);
                setError(err instanceof Error ? err.message : 'Upload failed');
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [],
    );

    const reset = useCallback(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadEtaSeconds(null);
        setError(null);
    }, []);

    return { isUploading, uploadProgress, uploadEtaSeconds, uploadFile, error, reset };
}
