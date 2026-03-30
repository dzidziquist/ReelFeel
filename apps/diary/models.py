from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class DiaryEntry(models.Model):
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diary_entries"
    )
    media      = models.ForeignKey(
        "media.MediaItem", on_delete=models.CASCADE, related_name="entries"
    )
    watched_on = models.DateField()
    rating     = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    emotions   = models.ManyToManyField("emotions.Emotion", blank=True)
    review     = models.TextField(blank=True)
    rewatch    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-watched_on", "-created_at"]

    def __str__(self):
        return f"{self.media.title} — {self.watched_on} ({self.rating}/5)"

    @property
    def rating_float(self):
        return float(self.rating)

    @property
    def full_stars(self):
        return int(self.rating_float)

    @property
    def half_star(self):
        return (self.rating_float % 1) >= 0.25

    @property
    def empty_stars(self):
        total = self.full_stars + (1 if self.half_star else 0)
        return max(0, 5 - total)
