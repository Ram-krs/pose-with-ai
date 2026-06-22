from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    gender: str | None = None
    height_cm: float | None = None
    photography_style: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str | None = None
    gender: str | None = None
    height_cm: float | None = None
    photography_style: str | None = None
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    local_path: str
    cloud_url: str | None = None
    overall_score: float | None = None
    pose_score: float | None = None
    outfit_score: float | None = None
    expression_score: float | None = None
    angle_score: float | None = None
    lighting_score: float | None = None
    analysis_json: dict | None = None
    created_at: datetime


class PoseHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recommended_pose: str
    current_match: float
    suggestions: str | None = None
    outfit_type: str | None = None
    face_shape: str | None = None
    scores_json: dict | None = None
    image_path: str | None = None
    created_at: datetime


class AnalysisRequest(BaseModel):
    gender: str | None = None
    height_cm: float | None = None
    photography_style: str | None = None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_photos: int
    total_analyses: int
    avg_pose_score: float
    avg_overall_score: float
