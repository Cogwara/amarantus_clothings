'use client';

import * as React from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Star,
  Plus,
} from 'lucide-react';

export interface ImageUploadProps {
  label?: string;
  value?: string;
  values?: string[];
  onChange?: (url: string) => void;
  onChangeMultiple?: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Product Photos',
  value = '',
  values,
  onChange,
  onChangeMultiple,
  maxFiles = 6,
  disabled = false,
  error,
  helperText,
  className = '',
}) => {
  const [mode, setMode] = React.useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgressText, setUploadProgressText] = React.useState('');
  const [uploadError, setUploadError] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [urlInputValue, setUrlInputValue] = React.useState('');
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Derive current photos list from props
  const currentUrls: string[] = React.useMemo(() => {
    if (values && Array.isArray(values)) {
      return values.filter((u) => typeof u === 'string' && u.trim());
    }
    if (value && typeof value === 'string' && value.trim()) {
      return [value.trim()];
    }
    return [];
  }, [values, value]);

  const updateUrls = (newUrls: string[]) => {
    onChangeMultiple?.(newUrls);
    onChange?.(newUrls[0] || '');
  };

  const optimizeImageForUpload = (rawFile: File): Promise<File> => {
    return new Promise((resolve) => {
      if (
        typeof window === 'undefined' ||
        rawFile.type === 'image/svg+xml' ||
        rawFile.type === 'image/gif' ||
        rawFile.size < 250 * 1024
      ) {
        return resolve(rawFile);
      }

      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(rawFile);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(rawFile);

          ctx.drawImage(img, 0, 0, width, height);

          const targetMime = 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= rawFile.size) {
                return resolve(rawFile);
              }
              const cleanName = rawFile.name.replace(/\.[^.]+$/, '.jpg');
              const processedFile = new File([blob], cleanName, {
                type: targetMime,
                lastModified: Date.now(),
              });
              resolve(processedFile);
            },
            targetMime,
            0.85
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(rawFile);
        };
        img.src = objectUrl;
      } catch {
        resolve(rawFile);
      }
    });
  };

  const handleFilesUpload = async (rawFiles: FileList | File[]) => {
    const fileList = Array.from(rawFiles);
    if (fileList.length === 0) return;

    const remainingSlots = maxFiles - currentUrls.length;
    if (remainingSlots <= 0) {
      setUploadError(`Maximum of ${maxFiles} photos allowed per item.`);
      return;
    }

    const filesToProcess = fileList.slice(0, remainingSlots);

    // Validate mime types and sizes
    for (const f of filesToProcess) {
      if (!f.type.startsWith('image/')) {
        setUploadError(`"${f.name}" is not an image. Please upload image files only.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setUploadError(`"${f.name}" exceeds 10MB limit.`);
        return;
      }
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgressText(
      filesToProcess.length === 1
        ? 'Uploading photo from device...'
        : `Uploading ${filesToProcess.length} photos from device...`
    );

    try {
      // Optimize files concurrently
      const optimizedFiles = await Promise.all(filesToProcess.map((f) => optimizeImageForUpload(f)));

      const formData = new FormData();
      for (const optFile of optimizedFiles) {
        formData.append('files', optFile);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photos');
      }

      const uploadedUrls: string[] = Array.isArray(data.urls)
        ? data.urls
        : data.url
        ? [data.url]
        : [];

      if (uploadedUrls.length > 0) {
        const combined = [...currentUrls, ...uploadedUrls].slice(0, maxFiles);
        updateUrls(combined);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err?.message || 'Failed to upload photos from device');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    if (currentUrls.includes(trimmed)) {
      setUploadError('This photo URL has already been added.');
      return;
    }

    if (currentUrls.length >= maxFiles) {
      setUploadError(`Maximum of ${maxFiles} photos allowed.`);
      return;
    }

    setUploadError('');
    updateUrls([...currentUrls, trimmed]);
    setUrlInputValue('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const filtered = currentUrls.filter((_, i) => i !== indexToRemove);
    updateUrls(filtered);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = currentUrls[indexToPrimary];
    const remaining = currentUrls.filter((_, i) => i !== indexToPrimary);
    updateUrls([selected, ...remaining]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs sm:text-sm font-medium text-[#17211B]">
            {label}
          </label>
          <span className="text-[11px] font-semibold text-[#66736B] bg-[#F0F4F1] px-2 py-0.5 rounded-full">
            {currentUrls.length} / {maxFiles} {currentUrls.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        {currentUrls.length < maxFiles && (
          <div className="inline-flex items-center p-0.5 rounded-[8px] bg-[#F0F4F1] border border-[#DDE5DF] text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setUploadError('');
              }}
              disabled={disabled || isUploading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] font-medium transition-all ${
                mode === 'upload'
                  ? 'bg-white text-[#16803C] shadow-sm'
                  : 'text-[#66736B] hover:text-[#17211B]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Device Upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('url');
                setUploadError('');
              }}
              disabled={disabled || isUploading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] font-medium transition-all ${
                mode === 'url'
                  ? 'bg-white text-[#16803C] shadow-sm'
                  : 'text-[#66736B] hover:text-[#17211B]'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Photo URL</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesUpload(e.target.files);
          }
        }}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* URL Input Form when URL mode is active and slots available */}
      {mode === 'url' && currentUrls.length < maxFiles && (
        <div className="mb-3 p-3 rounded-[10px] bg-[#F8FAF9] border border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#66736B]">
                <ImageIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                disabled={disabled}
                className="w-full rounded-[8px] border border-[#DDE5DF] bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-[#17211B] placeholder-[#8A968F] focus:border-[#16803C] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={disabled || !urlInputValue.trim()}
              className="px-3.5 py-2 rounded-[8px] bg-[#16803C] text-white text-xs font-semibold hover:bg-[#126831] disabled:opacity-50 transition-colors shrink-0"
            >
              Add URL
            </button>
          </div>
          <p className="text-[11px] text-[#66736B] mt-1.5">
            Add direct links from Unsplash, Cloudinary, or external image hosts.
          </p>
        </div>
      )}

      {/* GALLERY GRID (When photos exist) */}
      {currentUrls.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {currentUrls.map((imgUrl, index) => {
              const isPrimary = index === 0;
              const hasError = failedImages[imgUrl];

              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative rounded-[10px] overflow-hidden border transition-all aspect-square bg-[#F8FAF9] flex flex-col justify-between ${
                    isPrimary
                      ? 'border-[#16803C] ring-2 ring-[#16803C]/20 shadow-xs'
                      : 'border-[#DDE5DF] hover:border-[#16803C]/60'
                  }`}
                >
                  {/* Image Display */}
                  {!hasError ? (
                    <img
                      src={imgUrl}
                      alt={`Product photo ${index + 1}`}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [imgUrl]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-red-500 bg-red-50">
                      <AlertCircle className="w-5 h-5 mb-1 text-red-400" />
                      <span className="text-[10px] font-medium">Failed to load</span>
                    </div>
                  )}

                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-1.5 left-1.5 bg-[#16803C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Cover</span>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    disabled={disabled || isUploading}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/65 text-white hover:bg-red-600 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove this photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Make Primary Action (for non-primary photos) */}
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      disabled={disabled || isUploading}
                      className="absolute bottom-1.5 left-1.5 right-1.5 py-1 px-1.5 rounded-[6px] bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[#16803C]"
                      title="Set as main cover photo"
                    >
                      <Star className="w-3 h-3" />
                      <span>Make Cover</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* "+ Add More" Dropzone Card in grid */}
            {currentUrls.length < maxFiles && (
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="relative rounded-[10px] border-2 border-dashed border-[#DDE5DF] hover:border-[#16803C] hover:bg-[#F8FAF9] transition-all aspect-square flex flex-col items-center justify-center p-2 text-center text-[#66736B] hover:text-[#16803C] cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#16803C]" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center mb-1">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold">Add Photo</span>
                    <span className="text-[9px] text-[#8A968F]">Device files</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EMPTY STATE: Drag & Drop Zone when 0 photos uploaded yet */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && mode === 'upload' && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[12px] cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#16803C] bg-[#EAF7EE]/60 scale-[1.005]'
              : 'border-[#DDE5DF] bg-[#FDFEFE] hover:bg-[#F8FAF9] hover:border-[#16803C]/70'
          } ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <Loader2 className="w-8 h-8 text-[#16803C] animate-spin mb-2" />
              <p className="text-xs font-semibold text-[#17211B]">{uploadProgressText || 'Uploading photos...'}</p>
              <p className="text-[11px] text-[#66736B]">Optimizing and saving to product gallery</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center mb-2.5 shadow-xs">
                <UploadCloud className="w-6 h-6 text-[#16803C]" />
              </div>
              <p className="text-xs font-semibold text-[#17211B] mb-0.5">
                Click to browse or drag & drop photos
              </p>
              <p className="text-[11px] text-[#66736B]">
                Upload up to {maxFiles} photos (front, back, label, details) • JPG, PNG, WebP up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploading progress notification */}
      {isUploading && currentUrls.length > 0 && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-[8px] bg-[#EAF7EE] text-xs font-medium text-[#0F5C2E]">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#16803C]" />
          <span>{uploadProgressText || 'Uploading photos...'}</span>
        </div>
      )}

      {/* Error Feedback */}
      {(uploadError || error) && (
        <div className="mt-2 flex items-center gap-1.5 p-2 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Helper text */}
      {!uploadError && !error && helperText && (
        <p className="mt-1 text-xs text-[#66736B]">{helperText}</p>
      )}
    </div>
  );
};
