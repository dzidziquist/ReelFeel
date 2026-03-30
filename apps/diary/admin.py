from django.contrib import admin
from .models import DiaryEntry


@admin.register(DiaryEntry)
class DiaryEntryAdmin(admin.ModelAdmin):
    list_display = ("media", "watched_on", "rating", "rewatch", "created_at")
    list_filter = ("rewatch", "watched_on")
    search_fields = ("media__title",)
    filter_horizontal = ("emotions",)
    readonly_fields = ("created_at",)
