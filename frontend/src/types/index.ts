export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  gender?: string;
  height_cm?: number;
  photography_style?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AnalysisResult {
  outfit: {
    type: string;
    colors: string[];
    patterns: string[];
    accessories: string[];
    style: string;
    confidence: number;
  };
  face: {
    shape: string;
    expression: string;
    smile_confidence: number;
    head_angle: { yaw: number; pitch: number; roll: number };
    best_camera_angle: string;
    recommended_poses: string[];
  };
  body: {
    landmarks_detected: boolean;
    posture_alignment: number;
    shoulder_position: string;
    neck_angle: number;
    position: string;
    pose_confidence: number;
    corrections: string[];
  };
  recommendation: {
    recommended_pose: string;
    category: string;
    match_percentage: number;
    suggestions: string[];
    guidance_messages: string[];
  };
  review: {
    overall_score: number;
    pose_score: number;
    outfit_score: number;
    expression_score: number;
    angle_score: number;
    lighting_score: number;
    feedback: string[];
  };
}

export interface Photo {
  id: number;
  filename: string;
  local_path: string;
  cloud_url?: string;
  overall_score?: number;
  pose_score?: number;
  outfit_score?: number;
  expression_score?: number;
  angle_score?: number;
  lighting_score?: number;
  analysis_json?: AnalysisResult;
  created_at: string;
}

export interface PoseHistoryItem {
  id: number;
  recommended_pose: string;
  current_match: number;
  suggestions?: string;
  outfit_type?: string;
  face_shape?: string;
  scores_json?: Record<string, number>;
  image_path?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_photos: number;
  total_analyses: number;
  avg_pose_score: number;
  avg_overall_score: number;
}
