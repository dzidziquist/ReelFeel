import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from apps.diary.models import DiaryEntry
from apps.emotions.models import Emotion
from apps.media.models import MediaItem
from apps.media.services import tmdb as tmdb_service


# ── Helpers ──────────────────────────────────────────────────────────────────

def _entry_dict(entry):
    return {
        "id": entry.pk,
        "media": {
            "id": entry.media.pk,
            "tmdb_id": entry.media.tmdb_id,
            "media_type": entry.media.media_type,
            "title": entry.media.title,
            "year": entry.media.year,
            "poster_path": entry.media.poster_path,
            "poster_url": entry.media.poster_url,
            "genres": entry.media.genres,
            "tmdb_rating": entry.media.tmdb_rating,
        },
        "watched_on": entry.watched_on.isoformat(),
        "rating": float(entry.rating),
        "rewatch": entry.rewatch,
        "review": entry.review,
        "emotions": [
            {"id": e.pk, "name": e.name, "slug": e.slug, "color": e.color, "icon": e.icon}
            for e in entry.emotions.all()
        ],
        "user": {"id": entry.user.pk, "username": entry.user.username},
        "created_at": entry.created_at.isoformat(),
    }


# ── Diary endpoints ───────────────────────────────────────────────────────────

@api_view(["GET"])
def diary(request):
    """Return the current user's diary entries."""
    entries = (
        DiaryEntry.objects
        .filter(user=request.user)
        .select_related("media", "user")
        .prefetch_related("emotions")
        .order_by("-watched_on", "-created_at")
    )
    return Response([_entry_dict(e) for e in entries])


@api_view(["POST"])
def create_entry(request):
    tmdb_id = request.data.get("tmdb_id")
    media_type = request.data.get("media_type", "film")
    rating_raw = request.data.get("rating")
    watched_on_str = request.data.get("watched_on", "")
    review = request.data.get("review", "")
    rewatch = bool(request.data.get("rewatch", False))
    emotion_ids = request.data.get("emotion_ids", [])

    if not tmdb_id:
        return Response({"error": "tmdb_id is required."}, status=400)
    try:
        rating = float(rating_raw)
        if not (0 <= rating <= 5):
            raise ValueError
    except (TypeError, ValueError):
        return Response({"error": "Rating must be 0–5."}, status=400)
    try:
        watched_on = datetime.date.fromisoformat(watched_on_str)
    except (ValueError, TypeError):
        return Response({"error": "watched_on must be YYYY-MM-DD."}, status=400)

    try:
        media = tmdb_service.get_or_create_media_item(int(tmdb_id), media_type)
    except Exception as exc:
        return Response({"error": str(exc)}, status=502)

    entry = DiaryEntry.objects.create(
        user=request.user,
        media=media,
        watched_on=watched_on,
        rating=round(rating, 1),
        review=review,
        rewatch=rewatch,
    )
    if emotion_ids:
        entry.emotions.set(Emotion.objects.filter(pk__in=emotion_ids))

    return Response(_entry_dict(entry), status=201)


@api_view(["GET", "PUT", "DELETE"])
def entry_detail(request, pk):
    try:
        entry = (
            DiaryEntry.objects
            .select_related("media", "user")
            .prefetch_related("emotions")
            .get(pk=pk, user=request.user)
        )
    except DiaryEntry.DoesNotExist:
        return Response(status=404)

    if request.method == "GET":
        return Response(_entry_dict(entry))

    if request.method == "DELETE":
        entry.delete()
        return Response(status=204)

    # PUT
    if "rating" in request.data:
        try:
            rating = float(request.data["rating"])
            if not (0 <= rating <= 5):
                raise ValueError
            entry.rating = round(rating, 1)
        except (TypeError, ValueError):
            return Response({"error": "Rating must be 0–5."}, status=400)
    if "watched_on" in request.data:
        try:
            entry.watched_on = datetime.date.fromisoformat(request.data["watched_on"])
        except ValueError:
            return Response({"error": "watched_on must be YYYY-MM-DD."}, status=400)
    if "review" in request.data:
        entry.review = request.data["review"]
    if "rewatch" in request.data:
        entry.rewatch = bool(request.data["rewatch"])
    entry.save()
    if "emotion_ids" in request.data:
        entry.emotions.set(Emotion.objects.filter(pk__in=request.data["emotion_ids"]))
    return Response(_entry_dict(entry))


# ── Social feed ───────────────────────────────────────────────────────────────

@api_view(["GET"])
def friends_feed(request):
    """Recent entries from users that the current user follows."""
    from apps.accounts.models import Follow
    following_ids = Follow.objects.filter(follower=request.user).values_list("following_id", flat=True)
    entries = (
        DiaryEntry.objects
        .filter(user_id__in=following_ids)
        .select_related("media", "user")
        .prefetch_related("emotions")
        .order_by("-watched_on", "-created_at")
    )[:50]
    return Response([_entry_dict(e) for e in entries])


# ── Emotions list ─────────────────────────────────────────────────────────────

@api_view(["GET"])
def emotions_list(request):
    emotions = Emotion.objects.all()
    return Response([
        {"id": e.pk, "name": e.name, "slug": e.slug, "color": e.color, "icon": e.icon}
        for e in emotions
    ])
