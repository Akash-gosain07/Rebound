import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { useToast } from '../providers/ToasterProvider';
import { MapLocationPicker } from '../components/map/MapLocationPicker';
import { Camera, X } from 'lucide-react';

const categories = ['wallet', 'phone', 'keys', 'pet', 'bag', 'docs', 'other'];

export function PostItemPage() {
  const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
  const [category, setCategory] = useState('wallet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(37.4275);
  const [lng, setLng] = useState<number>(-122.1697);
  const [address, setAddress] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

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
    try {
      await api.post('/items', {
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
      push({ title: '✅ Item posted', description: 'Your item will appear on the map within seconds.' });
      // Reset form
      setTitle('');
      setDescription('');
      setPhotos([]);
      // Navigate to map after short delay
      setTimeout(() => navigate('/map'), 1500);
    } catch (err: any) {
      push({ title: 'Could not post item', description: err?.response?.data?.message || 'Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-3 pb-20 md:pb-6">
      <h1 className="text-base font-semibold text-slate-900">Post an item</h1>
      <p className="text-xs text-slate-500">Tell Rebound what you lost or found.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-slate-200">
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setType('LOST')}
            className={
              'rounded-full px-3 py-1 ' + (type === 'LOST' ? 'bg-white shadow-soft text-slate-900' : 'text-slate-500')
            }
          >
            I lost something
          </button>
          <button
            type="button"
            onClick={() => setType('FOUND')}
            className={
              'rounded-full px-3 py-1 ' + (type === 'FOUND' ? 'bg-white shadow-soft text-slate-900' : 'text-slate-500')
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
        <Button type="submit" size="lg" className="w-full justify-center" disabled={loading}>
          {loading ? 'Posting…' : 'Post item to map'}
        </Button>
      </form>
    </div>
  );
}
