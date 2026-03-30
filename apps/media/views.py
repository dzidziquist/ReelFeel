import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from apps.media.models import MediaItem
from apps.media.services import tmdb as tmdb_service


def library(request):
    media_type = request.GET.get("type", "")
    items = MediaItem.objects.all()
    if media_type in ("film", "tv"):
        items = items.filter(media_type=media_type)
    return render(request, "library.html", {"items": items, "media_type": media_type})


def media_detail(request, tmdb_id):
    item = get_object_or_404(MediaItem, tmdb_id=tmdb_id)
    entries = item.entries.prefetch_related("emotions").order_by("-watched_on")
    avg_rating = None
    if entries.exists():
        total = sum(float(e.rating) for e in entries)
        avg_rating = round(total / entries.count(), 1)
    return render(request, "media_detail.html", {
        "item": item,
        "entries": entries,
        "avg_rating": avg_rating,
    })


def search(request):
    query = request.GET.get("q", "").strip()
    results = []
    error = None
    if query:
        try:
            results = tmdb_service.search_multi(query)
        except Exception as exc:
            error = str(exc)
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return JsonResponse({"results": results, "error": error})
    return render(request, "search.html", {"query": query, "results": results, "error": error})
