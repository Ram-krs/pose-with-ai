import { useEffect, useState } from 'react';
import { Trash2, Share2, Download, Eye } from 'lucide-react';
import { photosApi } from '../api';
import type { Photo } from '../types';
import './GalleryPage.css';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Photo | null>(null);

  useEffect(() => {
    photosApi.list()
      .then((r) => setPhotos(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this photo?')) return;
    await photosApi.delete(id);
    setPhotos((p) => p.filter((ph) => ph.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const sharePhoto = async (photo: Photo) => {
    const url = window.location.origin + (photo.cloud_url ?? '');
    if (navigator.share) {
      await navigator.share({ title: 'Pose With AI', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const downloadPhoto = (photo: Photo) => {
    if (!photo.cloud_url) return;
    const a = document.createElement('a');
    a.href = photo.cloud_url;
    a.download = photo.filename;
    a.click();
  };

  if (loading) return <div className="loading-spinner">Loading gallery...</div>;

  return (
    <div className="page">
      <h1 className="page-title">My Gallery</h1>
      <p className="page-subtitle">Your captured photos with AI scores</p>

      {photos.length === 0 ? (
        <div className="empty-state card">
          <p>No photos yet. Head to the camera to capture your first pose!</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="gallery-item card">
              {photo.cloud_url && (
                <img src={photo.cloud_url} alt={photo.filename} loading="lazy" />
              )}
              <div className="gallery-item-info">
                <span className="gallery-score">{photo.overall_score?.toFixed(0) ?? '—'}/100</span>
                <div className="gallery-actions">
                  <button onClick={() => setSelected(photo)} title="View"><Eye size={16} /></button>
                  <button onClick={() => sharePhoto(photo)} title="Share"><Share2 size={16} /></button>
                  <button onClick={() => downloadPhoto(photo)} title="Download"><Download size={16} /></button>
                  <button onClick={() => handleDelete(photo.id)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="photo-modal" onClick={() => setSelected(null)}>
          <div className="photo-modal-content card" onClick={(e) => e.stopPropagation()}>
            {selected.cloud_url && <img src={selected.cloud_url} alt="" />}
            <div className="modal-scores grid-3">
              <div className="stat-card"><div className="stat-value">{selected.overall_score?.toFixed(0)}</div><div className="stat-label">Overall</div></div>
              <div className="stat-card"><div className="stat-value">{selected.pose_score?.toFixed(0)}%</div><div className="stat-label">Pose</div></div>
              <div className="stat-card"><div className="stat-value">{selected.outfit_score?.toFixed(0)}%</div><div className="stat-label">Outfit</div></div>
              <div className="stat-card"><div className="stat-value">{selected.expression_score?.toFixed(0)}%</div><div className="stat-label">Expression</div></div>
              <div className="stat-card"><div className="stat-value">{selected.angle_score?.toFixed(0)}%</div><div className="stat-label">Angle</div></div>
              <div className="stat-card"><div className="stat-value">{selected.lighting_score?.toFixed(0)}%</div><div className="stat-label">Lighting</div></div>
            </div>
            {selected.analysis_json?.review.feedback && (
              <ul className="feedback-list">
                {selected.analysis_json.review.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
