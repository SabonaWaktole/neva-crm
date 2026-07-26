import { apiClient } from '../api';

/**
 * Uploads for profile photos and workspace branding.
 *
 * The four kinds map 1:1 to the backend's MEDIA_SPECS. `logo` and
 * `company-cover` are workspace-level and business-owner only; `avatar` and
 * `user-cover` always act on the signed-in user.
 */
export type MediaKind = 'logo' | 'company-cover' | 'avatar' | 'user-cover';

export interface UploadedMedia {
  url: string;
  url2x: string;
  srcSet: string;
  width: number;
  height: number;
  bytes: number;
}

/** Mirrors the server's fileFilter so bad files are rejected before upload. */
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.avif';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // keep in sync with the server

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Client-side guard. Catching these here means the user gets an instant answer
 * instead of waiting for an 8 MB upload to be refused — but the server still
 * enforces both rules independently.
 */
export const validateImage = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported format. Use a JPEG, PNG, WebP, GIF or AVIF image.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(
      MAX_UPLOAD_BYTES
    )}.`;
  }
  return null;
};

/** Turns an axios/network failure into something worth showing a user. */
const toMessage = (error: any): string => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (status === 413) return 'That image is too large.';
  if (status === 415) return 'That image format is not supported.';
  if (status === 403) return 'You do not have permission to change this image.';
  if (error?.code === 'ERR_NETWORK') {
    return 'Upload failed — check your connection and try again.';
  }
  return 'Upload failed. Please try again.';
};

export const mediaService = {
  /**
   * `onProgress` receives 0–100. Axios only reports progress when the total
   * size is known, which it is for a FormData body, so the bar is real rather
   * than simulated.
   */
  async upload(
    tenantSlug: string,
    kind: MediaKind,
    file: File | Blob,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<UploadedMedia> {
    const form = new FormData();
    // Give blobs from the cropper a filename; some servers reject unnamed parts.
    form.append('file', file, file instanceof File ? file.name : `${kind}.png`);

    try {
      const { data } = await apiClient.post<UploadedMedia>(
        `/${tenantSlug}/media/${kind}`,
        form,
        {
          signal,
          onUploadProgress: (event) => {
            if (!onProgress || !event.total) return;
            onProgress(Math.round((event.loaded / event.total) * 100));
          },
        }
      );
      return data;
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        throw error;
      }
      throw new Error(toMessage(error));
    }
  },

  async remove(tenantSlug: string, kind: MediaKind): Promise<void> {
    try {
      await apiClient.delete(`/${tenantSlug}/media/${kind}`);
    } catch (error: any) {
      throw new Error(toMessage(error));
    }
  },
};

/**
 * Stored URLs are root-relative (`/uploads/...`) and are served by the API
 * origin, which in development is a different port from the SPA. This resolves
 * them against the same base the API client uses.
 */
export const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;

  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
  if (base.startsWith('/')) return url; // same origin — a proxy handles it

  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
};

/**
 * Builds a `srcSet` from a stored @1x URL, matching the server's naming
 * convention. Returns undefined when there is no 2x sibling to point at.
 *
 * Both candidates are run through `resolveMediaUrl`. That matters more than it
 * looks: a browser picks a `srcSet` candidate in preference to `src`, so if
 * these stayed root-relative they would resolve against the SPA's origin
 * rather than the API's. In development Vite answers /uploads/* with its
 * index.html SPA fallback — a 200 carrying HTML — and the image silently
 * fails to decode while `src` looks perfectly correct in devtools.
 */
export const srcSetFor = (url: string | null | undefined): string | undefined => {
  if (!url || !url.includes('@1x.webp')) return undefined;
  const one = resolveMediaUrl(url);
  const two = resolveMediaUrl(url.replace('@1x.webp', '@2x.webp'));
  if (!one || !two) return undefined;
  return `${one} 1x, ${two} 2x`;
};
