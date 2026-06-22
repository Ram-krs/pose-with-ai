from datetime import datetime
from sqlalchemy import String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    photography_style: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    photos: Mapped[list["Photo"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    pose_history: Mapped[list["PoseHistory"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    local_path: Mapped[str] = mapped_column(String(500))
    cloud_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    pose_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    outfit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    expression_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    angle_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    lighting_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    analysis_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="photos")


class PoseHistory(Base):
    __tablename__ = "pose_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recommended_pose: Mapped[str] = mapped_column(String(200))
    current_match: Mapped[float] = mapped_column(Float)
    suggestions: Mapped[str | None] = mapped_column(Text, nullable=True)
    outfit_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    face_shape: Mapped[str | None] = mapped_column(String(50), nullable=True)
    scores_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="pose_history")
