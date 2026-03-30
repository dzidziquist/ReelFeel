from django.db import models


class Emotion(models.Model):
    name  = models.CharField(max_length=50, unique=True)
    slug  = models.SlugField(unique=True)
    color = models.CharField(max_length=7, default="#6c757d")
    icon  = models.CharField(max_length=10, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
