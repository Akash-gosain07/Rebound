import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../providers/ToasterProvider';
import { MapLocationPicker } from '../map/MapLocationPicker';
import { useNavigate } from 'react-router-dom';

const categories = ['wallet', 'phone', 'keys', 'pet', 'bag', 'docs', 'other'];

interface ReportItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'LOST' | 'FOUND';
}

export function ReportItemModal({ isOpen, onClose, initialType }: ReportItemModalProps) {
  const [type, setType] = useState<'LOST' | 'FOUND'>(initialType);
  const [category, setCategory] = useState('wallet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(20.2961);
  const [lng, setLng] = useState<number>(85.8245);
  const [address, setAddress] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleLocationSelect = (newLat: number, newLng: number, newAddress?: string) => {
    setLat(newLat);
    setLng(newLng);
    if (newAddress) setAddress(newAddress);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('photos', file));

      const res = await api.post('/upload/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotos((prev) => [...prev, ...res.data.urls]);
      push({ title: 'Photo uploaded', description: 'Your photo has been added.' });
    } catch (err: any) {
      push({ title: 'Upload failed', description: err?.response?.data?.message || 'Try again.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields
    if (!title.trim()) {
      push({ title: 'Failed to create item', description: 'Title is required' });
      setLoading(false);
      return;
    }
    
    if (!description.trim()) {
      push({ title: 'Failed to create item', description: 'Description is required' });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Submitting item:', {
        type,
        category,
        title,
        description,
        photos,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
          address
        }
      });
      
      const response = await api.post('/items', {
        type,
        category,
        title,
        description,
        photos,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
          address
        }
      });
      
      console.log('Item created successfully:', response.data);
      push({ title: '✅ Item posted', description: 'Your item will appear on the map within seconds.' });
      
      // Reset form
      setTitle('');
      setDescription('');
      setPhotos([]);
      onClose();
      
      // Reload or navigate
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      console.error('Error posting item:', err);
      console.error('Error response:', err?.response);
      
      let errorMessage = 'Try again.';
      
      if (err?.response?.status === 401) {
        errorMessage = 'You need to be logged in to post items';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      push({ title: 'Failed to create item', description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 pointer-events-auto"
        onClick={onClose}
        style={{ 
          background: 'rgba(0, 0, 0, 0.35)', 
          backdropFilter: 'blur(10px)', 
          zIndex: 9998 
        }}
      />
      
      {/* Centered Modal Overlay */}
      <div
        className="fixed bg-white shadow-2xl overflow-y-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          maxHeight: '80vh',
          borderRadius: '24px',
          zIndex: 9999 
        }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Report an item</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tell us what you {type === 'LOST' ? 'lost' : 'found'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold w-full">
            <button
              type="button"
              onClick={() => setType('LOST')}
              className={
                'rounded-full px-3 py-2 flex-1 ' +
                (type === 'LOST' ? 'bg-white shadow-soft text-slate-900' : 'text-slate-500')
              }
            >
              I lost something
            </button>
            <button
              type="button"
              onClick={() => setType('FOUND')}
              className={
                'rounded-full px-3 py-2 flex-1 ' +
                (type === 'FOUND' ? 'bg-white shadow-soft text-slate-900' : 'text-slate-500')
              }
            >
              I found something
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  'rounded-2xl border px-2 py-2 capitalize transition-colors ' +
                  (category === c
                    ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-soft'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100')
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder={type === 'LOST' ? 'Lost black wallet near library…' : 'Found keys by parking lot…'}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="Details that help match your item: colors, stickers, case, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Photos (optional)</label>
            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-slate-200">
                      <img src={photo} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700">
                <Camera className="h-4 w-4" />
                {uploadingPhoto ? 'Uploading...' : 'Add photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Location *</label>
            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              initialLat={lat}
              initialLng={lng}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-white shadow-card hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Posting…' : 'Post item to map'}
          </button>
        </form>
      </div>
    </>,
    document.body
  );
}
