from django.urls import path
from . import views

urlpatterns = [
    path("library/", views.library, name="library"),
    path("search/", views.search, name="search"),
    path("media/<int:tmdb_id>/", views.media_detail, name="media_detail"),
]
