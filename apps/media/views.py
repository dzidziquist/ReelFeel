from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.media.models import MediaItem
from apps.media.services import tmdb as tmdb_service


def _media_dict(item):
    return {
        "id": item.pk,
        "tmdb_id": item.tmdb_id,
        "media_type": item.media_type,
        "title": item.title,
        "year": item.year,
        "poster_path": item.poster_path,
        "poster_url": item.poster_url,
        "backdrop_url": item.backdrop_url,
        "overview": item.overview,
        "genres": item.genres,
        "runtime": item.runtime,
        "tmdb_rating": item.tmdb_rating,
    }


@api_view(["GET"])
def library(request):
    media_type = request.query_params.get("type", "")
    qs = MediaItem.objects.all()
    if media_type in ("film", "tv"):
        qs = qs.filter(media_type=media_type)
    return Response([_media_dict(item) for item in qs])


@api_view(["GET"])
def media_detail(request, tmdb_id):
    try:
        item = MediaItem.objects.get(tmdb_id=tmdb_id)
    except MediaItem.DoesNotExist:
        return Response(status=404)

    from apps.diary.models import DiaryEntry
    from apps.diary.views import _entry_dict

    entries = (
        DiaryEntry.objects
        .filter(media=item, user=request.user)
        .prefetch_related("emotions")
        .order_by("-watched_on")
    )
    avg_rating = None
    if entries.exists():
        avg_rating = round(sum(float(e.rating) for e in entries) / entries.count(), 1)

    return Response({
        "media": _media_dict(item),
        "entries": [_entry_dict(e) for e in entries],
        "avg_rating": avg_rating,
    })


@api_view(["GET"])
def search(request):
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response({"results": []})
    try:
        results = tmdb_service.search_multi(query)
    except Exception as exc:
        return Response({"error": str(exc)}, status=502)
    return Response({"results": results})
