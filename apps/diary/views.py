import datetime

from django.shortcuts import get_object_or_404, redirect, render

from apps.diary.models import DiaryEntry
from apps.emotions.models import Emotion
from apps.media.models import MediaItem
from apps.media.services import tmdb as tmdb_service


def home(request):
    entries = DiaryEntry.objects.select_related("media").prefetch_related("emotions").order_by(
        "-watched_on", "-created_at"
    )[:50]
    return render(request, "home.html", {"entries": entries})


def add_entry(request):
    emotions = Emotion.objects.all()
    tmdb_id = request.GET.get("tmdb_id") or request.POST.get("tmdb_id")
    media_type = request.GET.get("type") or request.POST.get("media_type", "film")
    media_item = None
    search_prefill = None

    if tmdb_id:
        try:
            media_item = tmdb_service.get_or_create_media_item(int(tmdb_id), media_type)
        except Exception:
            media_item = MediaItem.objects.filter(tmdb_id=tmdb_id).first()

    if request.method == "POST":
        rating_str = request.POST.get("rating", "").strip()
        watched_on_str = request.POST.get("watched_on", "").strip()
        review = request.POST.get("review", "").strip()
        rewatch = request.POST.get("rewatch") == "on"
        emotion_ids = request.POST.getlist("emotions")

        errors = []
        if not media_item:
            errors.append("No media selected.")
        try:
            rating = float(rating_str)
            if not (0 <= rating <= 5):
                raise ValueError
        except ValueError:
            errors.append("Rating must be between 0 and 5.")
            rating = None
        try:
            watched_on = datetime.date.fromisoformat(watched_on_str)
        except ValueError:
            errors.append("Invalid date.")
            watched_on = datetime.date.today()

        if not errors and media_item and rating is not None:
            entry = DiaryEntry.objects.create(
                media=media_item,
                watched_on=watched_on,
                rating=round(rating, 1),
                review=review,
                rewatch=rewatch,
            )
            if emotion_ids:
                entry.emotions.set(Emotion.objects.filter(id__in=emotion_ids))
            return redirect("home")

        return render(request, "add_entry.html", {
            "emotions": emotions,
            "media_item": media_item,
            "errors": errors,
            "form_data": request.POST,
            "today": datetime.date.today().isoformat(),
        })

    return render(request, "add_entry.html", {
        "emotions": emotions,
        "media_item": media_item,
        "today": datetime.date.today().isoformat(),
    })


def edit_entry(request, pk):
    entry = get_object_or_404(DiaryEntry, pk=pk)
    emotions = Emotion.objects.all()

    if request.method == "POST":
        rating_str = request.POST.get("rating", "").strip()
        watched_on_str = request.POST.get("watched_on", "").strip()
        review = request.POST.get("review", "").strip()
        rewatch = request.POST.get("rewatch") == "on"
        emotion_ids = request.POST.getlist("emotions")

        errors = []
        try:
            rating = float(rating_str)
            if not (0 <= rating <= 5):
                raise ValueError
        except ValueError:
            errors.append("Rating must be between 0 and 5.")
            rating = None
        try:
            watched_on = datetime.date.fromisoformat(watched_on_str)
        except ValueError:
            errors.append("Invalid date.")
            watched_on = entry.watched_on

        if not errors and rating is not None:
            entry.rating = round(rating, 1)
            entry.watched_on = watched_on
            entry.review = review
            entry.rewatch = rewatch
            entry.save()
            entry.emotions.set(Emotion.objects.filter(id__in=emotion_ids))
            return redirect("media_detail", tmdb_id=entry.media.tmdb_id)

    return render(request, "add_entry.html", {
        "emotions": emotions,
        "media_item": entry.media,
        "entry": entry,
        "today": entry.watched_on.isoformat(),
        "editing": True,
    })


def delete_entry(request, pk):
    entry = get_object_or_404(DiaryEntry, pk=pk)
    tmdb_id = entry.media.tmdb_id
    if request.method == "POST":
        entry.delete()
        return redirect("media_detail", tmdb_id=tmdb_id)
    return render(request, "confirm_delete.html", {"entry": entry})
