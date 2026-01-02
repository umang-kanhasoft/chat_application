import axios from 'axios';
import { config } from '../constants/config';

export interface UploadProgressInfo {
    loaded: number;
    total: number;
    percent: number;
}

export interface UploadProgressCallback {
    (info: UploadProgressInfo): void;
}

export class UploadService {
    private static instance: UploadService;

    private constructor() { }

    public static getInstance(): UploadService {
        if (!UploadService.instance) {
            UploadService.instance = new UploadService();
        }
        return UploadService.instance;
    }

    /**
     * Upload file using multipart/form-data
     */
    public async uploadFile(
        file: File,
        onProgress?: UploadProgressCallback,
    ): Promise<{
        url: string;
        publicId: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
    }> {
        try {
            const signUrl = `${this.getApiBaseUrl()}/cloudinary-signature`;
            const { data: sign } = await axios.get(signUrl);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', sign.apiKey);
            formData.append('timestamp', String(sign.timestamp));
            formData.append('folder', sign.folder);
            formData.append('signature', sign.signature);

            const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;
            const { data } = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (!onProgress) return;
                    if (!progressEvent.total) return;

                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    onProgress({
                        loaded: progressEvent.loaded,
                        total: progressEvent.total,
                        percent: Math.min(100, Math.max(0, percentCompleted)),
                    });
                },
            });

            return {
                url: data.secure_url,
                publicId: data.public_id,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
            };
        } catch (error) {
            console.error('UploadService Error:', error);
            throw error;
        }
    }

    // Helper to get API URL
    private getApiBaseUrl(): string {
        const configured = config.apiURL ?? '';
        const base = configured
            ? configured.replace(/\/+$/, '')
            : `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname}:4000`;
        return `${base}/chat`;
    }
}

export const uploadService = UploadService.getInstance();
