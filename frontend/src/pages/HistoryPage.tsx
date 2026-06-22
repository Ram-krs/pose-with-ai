import { useEffect, useState } from 'react';
import { historyApi } from '../api';
import type { PoseHistoryItem } from '../types';

export default function HistoryPage() {
  const [history, setHistory] = useState<PoseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyApi.list()
      .then((r) => setHistory(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading history...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Pose History</h1>
      <p className="page-subtitle">Previous poses, scores, and AI recommendations</p>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No pose history yet. Capture photos to build your history.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.recommended_pose}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="score-ring">
                  <span className="score-value">{item.current_match}%</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {item.outfit_type && <span className="tag">{item.outfit_type}</span>}
                {item.face_shape && <span className="tag">{item.face_shape}</span>}
              </div>
              {item.suggestions && (
                <ul style={{ listStyle: 'none', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {item.suggestions.split('\n').map((s, i) => (
                    <li key={i} style={{ padding: '0.2rem 0' }}>→ {s}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
