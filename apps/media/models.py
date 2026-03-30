from django.db import models


class MediaItem(models.Model):
    FILM = "film"
    TV = "tv"
    MEDIA_TYPES = [(FILM, "Film"), (TV, "TV Show")]

    tmdb_id       = models.IntegerField(unique=True)
    media_type    = models.CharField(max_length=4, choices=MEDIA_TYPES)
    title         = models.CharField(max_length=255)
    year          = models.IntegerField(null=True, blank=True)
    poster_path   = models.CharField(max_length=255, blank=True)
    backdrop_path = models.CharField(max_length=255, blank=True)
    overview      = models.TextField(blank=True)
    genres        = models.JSONField(default=list)
    runtime       = models.IntegerField(null=True, blank=True)
    tmdb_rating   = models.FloatField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        year_str = f" ({self.year})" if self.year else ""
        return f"{self.title}{year_str}"

    @property
    def poster_url(self):
        if self.poster_path:
            return f"https://image.tmdb.org/t/p/w500{self.poster_path}"
        return None

    @property
    def backdrop_url(self):
        if self.backdrop_path:
            return f"https://image.tmdb.org/t/p/original{self.backdrop_path}"
        return None
