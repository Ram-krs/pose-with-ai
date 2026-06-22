"""AI analysis services using MediaPipe and OpenCV."""

import math
from dataclasses import dataclass, field

import cv2
import numpy as np
import mediapipe as mp
mp_face = mp.solutions.face_mesh
mp_pose = mp.solutions.pose

MEDIA_PIPE_AVAILABLE = mp_face is not None and mp_pose is not None

OUTFIT_TYPES = [
    "Formal", "Casual", "Traditional", "Party Wear",
    "Business Wear", "Sports Wear", "Fashion Wear",
]

FACE_SHAPES = ["Oval", "Round", "Square", "Heart", "Oblong", "Diamond"]

POSE_CATEGORIES = {
    "Formal": ["Confident Business Pose", "Professional Standing Pose", "Corporate Portrait Pose"],
    "Casual": ["Relaxed Standing Pose", "Casual Lean Pose", "Natural Smile Pose"],
    "Traditional": ["Traditional Standing Pose", "Elegant Saree Pose", "Cultural Portrait Pose"],
    "Party Wear": ["Fashion Model Pose", "Instagram Glam Pose", "Dynamic Party Pose"],
    "Business Wear": ["Interview Pose", "Corporate Headshot Pose", "Executive Standing Pose"],
    "Sports Wear": ["Athletic Power Pose", "Active Standing Pose", "Dynamic Sports Pose"],
    "Fashion Wear": ["Runway Pose", "Editorial Fashion Pose", "High Fashion Angle Pose"],
}



@dataclass
class OutfitAnalysis:
    outfit_type: str
    dominant_colors: list[str]
    patterns: list[str]
    accessories: list[str]
    fashion_style: str
    confidence: float


@dataclass
class FaceAnalysis:
    face_shape: str
    expression: str
    smile_confidence: float
    head_angle: dict
    best_camera_angle: str
    recommended_poses: list[str]


@dataclass
class BodyPoseAnalysis:
    landmarks_detected: bool
    posture_alignment: float
    shoulder_position: str
    neck_angle: float
    position: str
    pose_confidence: float
    corrections: list[str] = field(default_factory=list)


@dataclass
class PoseRecommendation:
    recommended_pose: str
    category: str
    match_percentage: float
    suggestions: list[str]
    guidance_messages: list[str]


@dataclass
class PhotoReview:
    overall_score: float
    pose_score: float
    outfit_score: float
    expression_score: float
    angle_score: float
    lighting_score: float
    feedback: list[str]


def _decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return img


def _rgb(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def _dominant_colors(img: np.ndarray, k: int = 5) -> list[str]:
    small = cv2.resize(img, (100, 100))
    pixels = small.reshape(-1, 3).astype(np.float32)
    _, labels, centers = cv2.kmeans(
        pixels, k, None,
        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0),
        3, cv2.KMEANS_PP_CENTERS,
    )
    counts = np.bincount(labels.flatten())
    order = counts.argsort()[::-1]
    color_names = []
    for idx in order[:3]:
        b, g, r = centers[idx]
        color_names.append(_name_color(r, g, b))
    return color_names


def _name_color(r: float, g: float, b: float) -> str:
    colors = {
        "Black": (0, 0, 0), "White": (255, 255, 255), "Red": (255, 0, 0),
        "Blue": (0, 0, 255), "Green": (0, 128, 0), "Yellow": (255, 255, 0),
        "Pink": (255, 192, 203), "Purple": (128, 0, 128), "Orange": (255, 165, 0),
        "Brown": (139, 69, 19), "Gray": (128, 128, 128), "Navy": (0, 0, 128),
        "Beige": (245, 245, 220), "Gold": (255, 215, 0),
    }
    best, best_dist = "Mixed", float("inf")
    for name, (cr, cg, cb) in colors.items():
        dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if dist < best_dist:
            best_dist = dist
            best = name
    return best


def analyze_outfit(image_bytes: bytes) -> OutfitAnalysis:
    img = _decode_image(image_bytes)
    h, w = img.shape[:2]
    torso = img[int(h * 0.25):int(h * 0.75), int(w * 0.2):int(w * 0.8)]
    colors = _dominant_colors(torso)

    gray = cv2.cvtColor(torso, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.mean(edges > 0)
    saturation = np.mean(cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)[:, :, 1])
    brightness = np.mean(cv2.cvtColor(torso, cv2.COLOR_BGR2GRAY))

    patterns, accessories, style = [], [], "Classic"
    if edge_density > 0.08:
        patterns.append("Textured/Patterned")
    else:
        patterns.append("Solid")

    if saturation > 120 and brightness > 100:
        outfit_type = "Party Wear"
        style = "Bold & Vibrant"
    elif brightness < 80 and "Black" in colors or "Navy" in colors:
        if edge_density < 0.05:
            outfit_type = "Business Wear"
            style = "Professional"
        else:
            outfit_type = "Formal"
            style = "Elegant"
    elif saturation < 60:
        outfit_type = "Casual"
        style = "Minimalist"
    elif "Gold" in colors or "Red" in colors:
        outfit_type = "Traditional"
        style = "Cultural"
        accessories.append("Traditional elements detected")
    elif saturation > 80 and edge_density > 0.06:
        outfit_type = "Fashion Wear"
        style = "Trendy"
    else:
        hsv = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
        if np.mean(hsv[:, :, 1]) > 100 and np.std(hsv[:, :, 0]) > 30:
            outfit_type = "Sports Wear"
            style = "Athletic"
        else:
            outfit_type = "Casual"
            style = "Everyday"

    return OutfitAnalysis(
        outfit_type=outfit_type,
        dominant_colors=colors,
        patterns=patterns,
        accessories=accessories,
        fashion_style=style,
        confidence=min(0.95, 0.6 + edge_density * 2),
    )


def analyze_face(image_bytes: bytes) -> FaceAnalysis:
    if not MEDIA_PIPE_AVAILABLE:
        return FaceAnalysis(
            face_shape="Oval", expression="Neutral", smile_confidence=0.0,
            head_angle={"yaw": 0, "pitch": 0, "roll": 0},
            best_camera_angle="Straight-on, eye level",
            recommended_poses=["Natural Standing Pose", "Relaxed Portrait Pose"],
        )

    img = _decode_image(image_bytes)
    rgb = _rgb(img)
    h, w = img.shape[:2]

    with mp_face.FaceMesh(
        static_image_mode=True, max_num_faces=1,
        refine_landmarks=True, min_detection_confidence=0.5,
    ) as face_mesh:
        results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return FaceAnalysis(
            face_shape="Oval", expression="Neutral", smile_confidence=0.0,
            head_angle={"yaw": 0, "pitch": 0, "roll": 0},
            best_camera_angle="Straight-on, eye level",
            recommended_poses=["Natural Standing Pose", "Relaxed Portrait Pose"],
        )

    lm = results.multi_face_landmarks[0].landmark

    def pt(idx):
        return np.array([lm[idx].x * w, lm[idx].y * h])

    jaw_left, jaw_right = pt(234), pt(454)
    forehead = pt(10)
    chin = pt(152)
    left_cheek, right_cheek = pt(50), pt(280)
    nose_tip = pt(1)

    face_width = np.linalg.norm(jaw_left - jaw_right)
    face_height = np.linalg.norm(forehead - chin)
    cheek_width = np.linalg.norm(left_cheek - right_cheek)
    ratio = face_height / (face_width + 1e-6)
    jaw_ratio = face_width / (cheek_width + 1e-6)

    if ratio > 1.5:
        face_shape = "Oblong"
    elif jaw_ratio > 1.1:
        face_shape = "Square"
    elif ratio < 1.2 and jaw_ratio < 0.95:
        face_shape = "Round"
    elif jaw_ratio < 0.85:
        face_shape = "Heart"
    elif cheek_width > face_width * 0.85:
        face_shape = "Diamond"
    else:
        face_shape = "Oval"

    mouth_left, mouth_right = pt(61), pt(291)
    mouth_top, mouth_bottom = pt(13), pt(14)
    mouth_width = np.linalg.norm(mouth_left - mouth_right)
    mouth_open = np.linalg.norm(mouth_top - mouth_bottom)
    smile_ratio = mouth_width / (face_width + 1e-6)
    smile_confidence = min(1.0, max(0.0, (smile_ratio - 0.35) * 3 + mouth_open / 20))

    if smile_confidence > 0.6:
        expression = "Smiling"
    elif smile_confidence > 0.3:
        expression = "Slight Smile"
    else:
        expression = "Neutral"

    nose_offset = (nose_tip[0] - w / 2) / w
    yaw = nose_offset * 60
    pitch = (nose_tip[1] - (forehead[1] + chin[1]) / 2) / h * 40
    roll = math.degrees(math.atan2(jaw_right[1] - jaw_left[1], jaw_right[0] - jaw_left[0]))

    if abs(yaw) > 15:
        best_angle = "Three-quarter view (15° turn)"
    elif face_shape in ("Round", "Square"):
        best_angle = "Slightly elevated, 10° angle"
    elif face_shape == "Oblong":
        best_angle = "Straight-on, chin slightly down"
    else:
        best_angle = "Eye level, straight-on"

    pose_map = {
        "Oval": ["Classic Portrait Pose", "Soft Angle Pose"],
        "Round": ["Three-Quarter Turn Pose", "Chin Down Pose"],
        "Square": ["Soft Smile Pose", "Angled Shoulder Pose"],
        "Heart": ["Chin Forward Pose", "Over-Shoulder Glance"],
        "Oblong": ["Level Camera Pose", "Wide Smile Pose"],
        "Diamond": ["Head Tilt Pose", "Editorial Angle Pose"],
    }

    return FaceAnalysis(
        face_shape=face_shape,
        expression=expression,
        smile_confidence=round(smile_confidence, 2),
        head_angle={"yaw": round(yaw, 1), "pitch": round(pitch, 1), "roll": round(roll, 1)},
        best_camera_angle=best_angle,
        recommended_poses=pose_map.get(face_shape, ["Natural Portrait Pose"]),
    )


def analyze_body_pose(image_bytes: bytes) -> BodyPoseAnalysis:
    if not MEDIA_PIPE_AVAILABLE:
        return BodyPoseAnalysis(
            landmarks_detected=False, posture_alignment=0.0,
            shoulder_position="Unknown", neck_angle=0.0,
            position="Unknown", pose_confidence=0.0,
            corrections=["Ensure full body or upper body is visible in frame"],
        )

    img = _decode_image(image_bytes)
    rgb = _rgb(img)
    h, w = img.shape[:2]

    with mp_pose.Pose(
        static_image_mode=True, model_complexity=1,
        enable_segmentation=False, min_detection_confidence=0.5,
    ) as pose:
        results = pose.process(rgb)

    if not results.pose_landmarks:
        return BodyPoseAnalysis(
            landmarks_detected=False, posture_alignment=0.0,
            shoulder_position="Unknown", neck_angle=0.0,
            position="Unknown", pose_confidence=0.0,
            corrections=["Ensure full body or upper body is visible in frame"],
        )

    lm = results.pose_landmarks.landmark

    def vis(idx):
        return lm[idx].visibility

    def pt(idx):
        return np.array([lm[idx].x * w, lm[idx].y * h, lm[idx].visibility])

    ls, rs = pt(11), pt(12)
    lh, rh = pt(23), pt(24)
    nose = pt(0)
    le, re = pt(7), pt(8)

    shoulder_diff = abs(ls[1] - rs[1]) / h
    shoulder_tilt_deg = math.degrees(math.atan2(rs[1] - ls[1], rs[0] - ls[0]))

    if shoulder_diff < 0.02:
        shoulder_pos = "Level"
    elif ls[1] < rs[1]:
        shoulder_pos = "Left raised"
    else:
        shoulder_pos = "Right raised"

    mid_shoulder = (ls[:2] + rs[:2]) / 2
    mid_hip = (lh[:2] + rh[:2]) / 2
    spine_angle = math.degrees(math.atan2(
        mid_shoulder[0] - mid_hip[0], mid_hip[1] - mid_shoulder[1]
    ))
    alignment = max(0, 100 - abs(spine_angle) * 2 - shoulder_diff * 200)

    neck_vec = mid_shoulder - nose[:2]
    neck_angle = math.degrees(math.atan2(neck_vec[0], neck_vec[1]))

    hip_y = (lh[1] + rh[1]) / 2
    knee_vis = vis(25) + vis(26)
    position = "Sitting" if hip_y > h * 0.65 and knee_vis > 0.8 else "Standing"

    avg_vis = np.mean([vis(i) for i in [11, 12, 23, 24, 0, 7, 8]])
    pose_confidence = round(float(avg_vis) * 100, 1)

    corrections = []
    if abs(shoulder_tilt_deg) > 5:
        side = "left" if shoulder_tilt_deg > 0 else "right"
        corrections.append(f"Level your {side} shoulder")
    if alignment < 80:
        corrections.append("Stand straight")
    if neck_angle > 10:
        corrections.append("Turn head slightly to the right")
    elif neck_angle < -10:
        corrections.append("Turn head slightly to the left")
    if nose[1] > mid_shoulder[1] + h * 0.05:
        corrections.append("Lift your chin slightly")

    return BodyPoseAnalysis(
        landmarks_detected=True,
        posture_alignment=round(alignment, 1),
        shoulder_position=shoulder_pos,
        neck_angle=round(neck_angle, 1),
        position=position,
        pose_confidence=pose_confidence,
        corrections=corrections or ["Great posture! Hold steady."],
    )


def recommend_pose(
    outfit: OutfitAnalysis,
    face: FaceAnalysis,
    body: BodyPoseAnalysis,
    gender: str | None = None,
    height_cm: float | None = None,
    photography_style: str | None = None,
) -> PoseRecommendation:
    candidates = POSE_CATEGORIES.get(outfit.outfit_type, POSE_CATEGORIES["Casual"])

    if photography_style == "Professional":
        candidates = POSE_CATEGORIES.get("Business Wear", candidates)
    elif photography_style == "Instagram":
        candidates = POSE_CATEGORIES.get("Party Wear", candidates)
    elif photography_style == "Traditional":
        candidates = POSE_CATEGORIES.get("Traditional", candidates)

    if body.position == "Sitting":
        recommended = "Elegant Sitting Pose" if outfit.outfit_type == "Formal" else "Casual Sitting Pose"
    else:
        recommended = candidates[0]
        if face.face_shape in ("Round", "Square"):
            recommended = candidates[min(1, len(candidates) - 1)]

    match = (
        body.posture_alignment * 0.4
        + body.pose_confidence * 0.3
        + (face.smile_confidence * 100 if face.expression != "Neutral" else 70) * 0.15
        + outfit.confidence * 100 * 0.15
    )
    match = round(min(99, max(40, match)), 1)

    suggestions = list(body.corrections[:3])
    guidance = []

    if abs(face.head_angle.get("yaw", 0)) > 10:
        direction = "right" if face.head_angle["yaw"] > 0 else "left"
        guidance.append(f"Turn 15° to the {direction}.")
    if "chin" in " ".join(suggestions).lower() or face.head_angle.get("pitch", 0) < -5:
        guidance.append("Lift your chin slightly.")
    if "shoulder" in " ".join(suggestions).lower():
        guidance.append("Move your left shoulder back.")
    if face.smile_confidence < 0.4:
        guidance.append("Smile naturally.")
    if "straight" in " ".join(suggestions).lower():
        guidance.append("Stand straight.")

    if not guidance:
        guidance = ["Hold your pose — looking great!", "Keep shoulders relaxed."]

    return PoseRecommendation(
        recommended_pose=recommended,
        category=outfit.outfit_type,
        match_percentage=match,
        suggestions=suggestions,
        guidance_messages=guidance,
    )


def review_photo(image_bytes: bytes) -> PhotoReview:
    outfit = analyze_outfit(image_bytes)
    face = analyze_face(image_bytes)
    body = analyze_body_pose(image_bytes)

    img = _decode_image(image_bytes)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lighting = min(100, np.std(gray) * 2.5)
    if np.mean(gray) < 60:
        lighting *= 0.7
    elif np.mean(gray) > 200:
        lighting *= 0.8

    pose_score = body.posture_alignment if body.landmarks_detected else 65.0
    outfit_score = outfit.confidence * 100
    expression_score = 60 + face.smile_confidence * 40
    angle_score = max(50, 100 - abs(face.head_angle.get("yaw", 0)) * 2)
    lighting_score = round(lighting, 1)

    overall = round(
        pose_score * 0.3 + outfit_score * 0.2 + expression_score * 0.2
        + angle_score * 0.15 + lighting_score * 0.15,
        1,
    )

    feedback = []
    if lighting_score < 70:
        feedback.append("Try facing a light source for better lighting.")
    if pose_score < 75:
        feedback.append("Adjust posture for a more confident look.")
    if expression_score < 70:
        feedback.append("A natural smile can enhance your photo.")
    if not feedback:
        feedback.append("Excellent photo! Great pose and composition.")

    return PhotoReview(
        overall_score=overall,
        pose_score=round(pose_score, 1),
        outfit_score=round(outfit_score, 1),
        expression_score=round(expression_score, 1),
        angle_score=round(angle_score, 1),
        lighting_score=lighting_score,
        feedback=feedback,
    )


def full_analysis(
    image_bytes: bytes,
    gender: str | None = None,
    height_cm: float | None = None,
    photography_style: str | None = None,
) -> dict:
    outfit = analyze_outfit(image_bytes)
    face = analyze_face(image_bytes)
    body = analyze_body_pose(image_bytes)
    recommendation = recommend_pose(outfit, face, body, gender, height_cm, photography_style)
    review = review_photo(image_bytes)

    return {
        "outfit": {
            "type": outfit.outfit_type,
            "colors": outfit.dominant_colors,
            "patterns": outfit.patterns,
            "accessories": outfit.accessories,
            "style": outfit.fashion_style,
            "confidence": round(outfit.confidence, 2),
        },
        "face": {
            "shape": face.face_shape,
            "expression": face.expression,
            "smile_confidence": face.smile_confidence,
            "head_angle": face.head_angle,
            "best_camera_angle": face.best_camera_angle,
            "recommended_poses": face.recommended_poses,
        },
        "body": {
            "landmarks_detected": body.landmarks_detected,
            "posture_alignment": body.posture_alignment,
            "shoulder_position": body.shoulder_position,
            "neck_angle": body.neck_angle,
            "position": body.position,
            "pose_confidence": body.pose_confidence,
            "corrections": body.corrections,
        },
        "recommendation": {
            "recommended_pose": recommendation.recommended_pose,
            "category": recommendation.category,
            "match_percentage": recommendation.match_percentage,
            "suggestions": recommendation.suggestions,
            "guidance_messages": recommendation.guidance_messages,
        },
        "review": {
            "overall_score": review.overall_score,
            "pose_score": review.pose_score,
            "outfit_score": review.outfit_score,
            "expression_score": review.expression_score,
            "angle_score": review.angle_score,
            "lighting_score": review.lighting_score,
            "feedback": review.feedback,
        },
    }
