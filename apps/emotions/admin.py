from django.contrib import admin
from .models import Emotion


@admin.register(Emotion)
class EmotionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "color", "icon")
    prepopulated_fields = {"slug": ("name",)}
