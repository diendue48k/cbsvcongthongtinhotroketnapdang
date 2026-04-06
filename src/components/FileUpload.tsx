import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Upload, X, File as FileIcon, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: (url: string, fileName: string) => void;
  onRemove: () => void;
  currentFileUrl?: string;
  currentFileName?: string;
  label?: string;
  accept?: string;
  path: string;
}

export default function FileUpload({ 
  onUploadSuccess, 
  onRemove, 
  currentFileUrl, 
  currentFileName,
  label = "Tải file lên",
  accept = "image/*,.pdf,.doc,.docx",
  path
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File quá lớn. Vui lòng chọn file < 5MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (err) => {
        console.error("Upload error:", err);
        setError("Lỗi khi tải file lên.");
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadSuccess(downloadURL, file.name);
          setUploading(false);
        } catch (err) {
          console.error("Error getting download URL:", err);
          setError("Lỗi khi lấy link file.");
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="mt-1">
      {currentFileUrl ? (
        <div className="flex items-center justify-between p-2 border border-green-200 bg-green-50 rounded-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
            <a 
              href={currentFileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:underline truncate"
            >
              {currentFileName || "Đã tải file lên"}
            </a>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
            title="Xóa file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <div className="w-full px-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Đang tải...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-brand-red h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">{label}</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              accept={accept}
              disabled={uploading}
            />
          </label>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
