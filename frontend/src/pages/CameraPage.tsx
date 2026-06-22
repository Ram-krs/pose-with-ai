import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, FlipHorizontal, Zap, Grid3X3, Timer, Circle,
  ChevronUp, Share2, Download,
} from 'lucide-react';
import { analysisApi, photosApi } from '../api';
import type { AnalysisResult, Photo } from '../types';
import './CameraPage.css';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisInterval = useRef<ReturnType<typeof setInterval>>();

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const [grid, setGrid] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<Photo | null>(null);
  const [captureReview, setCaptureReview] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError('');
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (analysisInterval.current) clearInterval(analysisInterval.current);
    };
  }, [startCamera]);

  const runAnalysis = useCallback(async () => {
    if (analyzing || capturedPhoto) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setAnalyzing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7);
      });
      if (blob) {
        const { data } = await analysisApi.realtime(blob);
        setAnalysis(data);
      }
    } catch {
      /* silent fail for realtime */
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, capturedPhoto]);

  useEffect(() => {
    analysisInterval.current = setInterval(runAnalysis, 2500);
    return () => {
      if (analysisInterval.current) clearInterval(analysisInterval.current);
    };
  }, [runAnalysis]);

  const doCapture = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    if (flash) {
      document.body.classList.add('flash-effect');
      setTimeout(() => document.body.classList.remove('flash-effect'), 200);
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    });
    if (!blob) return;

    try {
      const { data } = await photosApi.capture(blob);
      setCapturedPhoto(data);
      setCaptureReview(data.analysis_json ?? analysis);
    } catch {
      setError('Failed to save photo');
    }
  };

  const handleCapture = () => {
    if (countdownActive > 0) {
      let count = countdownActive;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(0);
          doCapture();
        }
      }, 1000);
      setCountdown(count);
    } else {
      doCapture();
    }
  };

  const flipCamera = () => {
    setFacingMode((f) => (f === 'user' ? 'environment' : 'user'));
  };

  const sharePhoto = async () => {
    if (!capturedPhoto?.cloud_url) return;
    const url = window.location.origin + capturedPhoto.cloud_url;
    if (navigator.share) {
      await navigator.share({ title: 'Pose With AI', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const downloadPhoto = () => {
    if (!capturedPhoto?.cloud_url) return;
    const a = document.createElement('a');
    a.href = capturedPhoto.cloud_url;
    a.download = capturedPhoto.filename;
    a.click();
  };

  const dismissCapture = () => {
    setCapturedPhoto(null);
    setCaptureReview(null);
  };

  const matchPct = analysis?.recommendation.match_percentage ?? 0;
  const guidance = analysis?.recommendation.guidance_messages ?? [];

  return (
    <div className="page camera-page">
      {error && <div className="camera-error">{error}</div>}

      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {grid && (
          <div className="camera-grid">
            <div /><div /><div />
            <div /><div /><div />
            <div /><div /><div />
          </div>
        )}

        {countdown > 0 && <div className="countdown-overlay">{countdown}</div>}

        {analysis && !capturedPhoto && (
          <div className="ai-overlay">
            <div className="match-badge">
              <span className="match-label">Pose Match</span>
              <span className="match-value">{matchPct}%</span>
            </div>
            {guidance.length > 0 && (
              <div className="guidance-panel">
                {guidance.map((msg, i) => (
                  <p key={i} className="guidance-msg">{msg}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {analysis && !capturedPhoto && (
        <div className="analysis-panel card">
          <div className="analysis-row">
            <div>
              <span className="label">Recommended Pose</span>
              <p className="value">{analysis.recommendation.recommended_pose}</p>
            </div>
            <div className="match-circle" style={{ '--pct': matchPct } as React.CSSProperties}>
              <span>{matchPct}%</span>
            </div>
          </div>
          <div className="analysis-tags">
            <span className="tag">{analysis.outfit.type}</span>
            <span className="tag">{analysis.face.shape} Face</span>
            <span className="tag">{analysis.body.position}</span>
          </div>
          {analysis.recommendation.suggestions.length > 0 && (
            <ul className="suggestions-list">
              {analysis.recommendation.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="camera-controls">
        <button className="control-btn" onClick={() => setGrid(!grid)} title="Grid">
          <Grid3X3 size={20} />
        </button>
        <button className="control-btn" onClick={() => setFlash(!flash)} title="Flash">
          <Zap size={20} className={flash ? 'active' : ''} />
        </button>
        <button
          className="control-btn"
          onClick={() => setCountdownActive(countdownActive === 3 ? 0 : 3)}
          title="Timer"
        >
          <Timer size={20} />
          {countdownActive > 0 && <span className="timer-badge">{countdownActive}s</span>}
        </button>
        <button className="capture-btn" onClick={handleCapture} title="Capture (always enabled)">
          <Circle size={56} fill="white" stroke="var(--accent)" strokeWidth={3} />
        </button>
        <button className="control-btn" onClick={flipCamera} title="Flip Camera">
          <FlipHorizontal size={20} />
        </button>
        <button className="control-btn" onClick={runAnalysis} title="Analyze Now">
          <Camera size={20} />
        </button>
      </div>

      {capturedPhoto && captureReview && (
        <div className="capture-modal">
          <div className="capture-modal-content card">
            <h2>Photo Captured!</h2>
            {capturedPhoto.cloud_url && (
              <img src={capturedPhoto.cloud_url} alt="Captured" className="capture-preview" />
            )}
            <div className="review-scores">
              <div className="score-ring">
                <span className="score-value">{captureReview.review.overall_score}</span>
                <span className="score-label">Overall</span>
              </div>
              <div className="score-grid">
                <div><span>{captureReview.review.pose_score}%</span><small>Pose</small></div>
                <div><span>{captureReview.review.outfit_score}%</span><small>Outfit</small></div>
                <div><span>{captureReview.review.expression_score}%</span><small>Expression</small></div>
                <div><span>{captureReview.review.angle_score}%</span><small>Angle</small></div>
                <div><span>{captureReview.review.lighting_score}%</span><small>Lighting</small></div>
              </div>
            </div>
            <ul className="feedback-list">
              {captureReview.review.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <div className="capture-actions">
              <button className="btn btn-secondary" onClick={sharePhoto}>
                <Share2 size={16} /> Share
              </button>
              <button className="btn btn-secondary" onClick={downloadPhoto}>
                <Download size={16} /> Download
              </button>
              <button className="btn btn-primary" onClick={dismissCapture}>
                <ChevronUp size={16} /> Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
