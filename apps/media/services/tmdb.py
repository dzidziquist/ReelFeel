import requests
from django.conf import settings

TMDB_BASE = "https://api.themoviedb.org/3"


def _get(path, params=None):
    params = params or {}
    params["api_key"] = settings.TMDB_API_KEY
    resp = requests.get(f"{TMDB_BASE}{path}", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def search_multi(query):
    """Search TMDB for movies and TV shows. Returns list of result dicts."""
    data = _get("/search/multi", {"query": query, "include_adult": "false"})
    results = []
    for item in data.get("results", []):
        media_type = item.get("media_type")
        if media_type not in ("movie", "tv"):
            continue
        results.append({
            "tmdb_id":     item["id"],
            "media_type":  "film" if media_type == "movie" else "tv",
            "title":       item.get("title") or item.get("name", ""),
            "year":        _extract_year(item),
            "poster_path": item.get("poster_path", ""),
            "overview":    item.get("overview", ""),
            "tmdb_rating": item.get("vote_average"),
        })
    return results


def get_movie_detail(tmdb_id):
    return _get(f"/movie/{tmdb_id}")


def get_tv_detail(tmdb_id):
    return _get(f"/tv/{tmdb_id}")


def get_or_create_media_item(tmdb_id, media_type):
    """Return existing MediaItem or fetch from TMDB and create it."""
    from apps.media.models import MediaItem

    try:
        return MediaItem.objects.get(tmdb_id=tmdb_id)
    except MediaItem.DoesNotExist:
        pass

    if media_type == "film":
        data = get_movie_detail(tmdb_id)
        title = data.get("title", "")
        year = _extract_year_from_date(data.get("release_date", ""))
        runtime = data.get("runtime")
        genres = [g["name"] for g in data.get("genres", [])]
    else:
        data = get_tv_detail(tmdb_id)
        title = data.get("name", "")
        year = _extract_year_from_date(data.get("first_air_date", ""))
        ep_runtimes = data.get("episode_run_time", [])
        runtime = ep_runtimes[0] if ep_runtimes else None
        genres = [g["name"] for g in data.get("genres", [])]

    return MediaItem.objects.create(
        tmdb_id=tmdb_id,
        media_type=media_type,
        title=title,
        year=year,
        poster_path=data.get("poster_path", "") or "",
        backdrop_path=data.get("backdrop_path", "") or "",
        overview=data.get("overview", ""),
        genres=genres,
        runtime=runtime,
        tmdb_rating=data.get("vote_average"),
    )


def _extract_year(item):
    date = item.get("release_date") or item.get("first_air_date") or ""
    return _extract_year_from_date(date)


def _extract_year_from_date(date_str):
    if date_str and len(date_str) >= 4:
        try:
            return int(date_str[:4])
        except ValueError:
            pass
    return None
