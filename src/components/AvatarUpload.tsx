import { useState } from 'react';
import { api } from '../services/api';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload?: (avatarData: string) => void;
}

export function AvatarUpload({ currentAvatar, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string>(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError('图片太大，最大支持 1MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('只支持 jpg/png/webp 格式');
      return;
    }

    setError('');
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const avatarData = event.target?.result as string;
      setPreview(avatarData);

      try {
        const result = await api.uploadAvatar(avatarData);
        onUpload?.(result.avatar_data);
      } catch {
        setError('上传失败，请重试');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('文件读取失败');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        style={{
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: preview ? `url(${preview}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6rem',
          color: 'white',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!preview && '👤'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
          disabled={uploading}
        />
        {uploading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ...
          </div>
        )}
      </div>
      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>
      )}
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        点击上传头像 (最大 1MB)
      </div>
    </div>
  );
}