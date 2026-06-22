import os
import secrets
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_admin,
    get_current_user,
    get_password_hash,
    get_user_by_email,
    get_user_by_username,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.models import Photo, PoseHistory, User
from app.schemas import (
    AdminStatsResponse,
    ForgotPassword,
    PhotoResponse,
    PoseHistoryResponse,
    ResetPassword,
    TokenResponse,
    UserLogin,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
)
from app.services.ai_analysis import full_analysis

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        is_admin=data.username == "admin",
    )
    db.add(user)
    await db.flush()
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.username_or_email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, data.email)
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    await db.flush()
    return {"message": "If that email exists, a reset link has been sent.", "reset_token": token}


@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.reset_token == data.token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    return {"message": "Password updated successfully"}


profile_router = APIRouter(prefix="/api/users", tags=["users"])


@profile_router.get("/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@profile_router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.flush()
    return user


analysis_router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@analysis_router.post("/realtime")
async def realtime_analysis(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image")
    result = full_analysis(
        content,
        gender=user.gender,
        height_cm=user.height_cm,
        photography_style=user.photography_style,
    )
    return result


@analysis_router.post("/outfit")
async def outfit_analysis(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    from app.services.ai_analysis import analyze_outfit
    o = analyze_outfit(content)
    return {
        "type": o.outfit_type, "colors": o.dominant_colors,
        "patterns": o.patterns, "accessories": o.accessories,
        "style": o.fashion_style, "confidence": o.confidence,
    }


@analysis_router.post("/face")
async def face_analysis(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    from app.services.ai_analysis import analyze_face
    f = analyze_face(content)
    return {
        "shape": f.face_shape, "expression": f.expression,
        "smile_confidence": f.smile_confidence, "head_angle": f.head_angle,
        "best_camera_angle": f.best_camera_angle, "recommended_poses": f.recommended_poses,
    }


@analysis_router.post("/pose")
async def pose_analysis(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    from app.services.ai_analysis import analyze_body_pose
    b = analyze_body_pose(content)
    return {
        "landmarks_detected": b.landmarks_detected,
        "posture_alignment": b.posture_alignment,
        "shoulder_position": b.shoulder_position,
        "neck_angle": b.neck_angle,
        "position": b.position,
        "pose_confidence": b.pose_confidence,
        "corrections": b.corrections,
    }


photos_router = APIRouter(prefix="/api/photos", tags=["photos"])


def _ensure_upload_dir():
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@photos_router.post("/capture", response_model=PhotoResponse)
async def capture_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_upload_dir()
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image")

    analysis = full_analysis(
        content, gender=user.gender, height_cm=user.height_cm,
        photography_style=user.photography_style,
    )
    review = analysis["review"]
    rec = analysis["recommendation"]

    ext = Path(file.filename or "photo.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    user_dir = Path(settings.upload_dir) / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)
    filepath = user_dir / filename
    filepath.write_bytes(content)

    photo = Photo(
        user_id=user.id,
        filename=filename,
        local_path=str(filepath),
        cloud_url=f"/uploads/{user.id}/{filename}",
        overall_score=review["overall_score"],
        pose_score=review["pose_score"],
        outfit_score=review["outfit_score"],
        expression_score=review["expression_score"],
        angle_score=review["angle_score"],
        lighting_score=review["lighting_score"],
        analysis_json=analysis,
    )
    db.add(photo)

    history = PoseHistory(
        user_id=user.id,
        recommended_pose=rec["recommended_pose"],
        current_match=rec["match_percentage"],
        suggestions="\n".join(rec["suggestions"]),
        outfit_type=analysis["outfit"]["type"],
        face_shape=analysis["face"]["shape"],
        scores_json=review,
        image_path=str(filepath),
    )
    db.add(history)
    await db.flush()

    return photo


@photos_router.get("/", response_model=list[PhotoResponse])
async def list_photos(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Photo).where(Photo.user_id == user.id).order_by(Photo.created_at.desc())
    )
    return result.scalars().all()


@photos_router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(photo_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).where(Photo.id == photo_id, Photo.user_id == user.id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo


@photos_router.delete("/{photo_id}")
async def delete_photo(photo_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).where(Photo.id == photo_id, Photo.user_id == user.id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    if os.path.exists(photo.local_path):
        os.remove(photo.local_path)
    await db.delete(photo)
    return {"message": "Photo deleted"}


history_router = APIRouter(prefix="/api/history", tags=["history"])


@history_router.get("/", response_model=list[PoseHistoryResponse])
async def pose_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PoseHistory).where(PoseHistory.user_id == user.id).order_by(PoseHistory.created_at.desc())
    )
    return result.scalars().all()


admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


@admin_router.get("/stats", response_model=AdminStatsResponse)
async def admin_stats(admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0
    total_photos = (await db.execute(select(func.count(Photo.id)))).scalar() or 0
    total_analyses = (await db.execute(select(func.count(PoseHistory.id)))).scalar() or 0
    avg_pose = (await db.execute(select(func.avg(Photo.pose_score)))).scalar() or 0.0
    avg_overall = (await db.execute(select(func.avg(Photo.overall_score)))).scalar() or 0.0

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_photos=total_photos,
        total_analyses=total_analyses,
        avg_pose_score=round(float(avg_pose), 1),
        avg_overall_score=round(float(avg_overall), 1),
    )


@admin_router.get("/users", response_model=list[UserResponse])
async def list_users(admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@admin_router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: int, admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.flush()
    return {"id": user.id, "is_active": user.is_active}
