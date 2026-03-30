from django.contrib import admin
from .models import MediaItem


@admin.register(MediaItem)
class MediaItemAdmin(admin.ModelAdmin):
    list_display = ("title", "media_type", "year", "tmdb_id", "tmdb_rating")
    list_filter = ("media_type",)
    search_fields = ("title",)
    readonly_fields = ("created_at",)
