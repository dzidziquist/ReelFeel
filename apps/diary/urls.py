from django.urls import path
from . import views

urlpatterns = [
    path("diary/", views.diary, name="diary"),
    path("diary/entries/", views.create_entry, name="create_entry"),
    path("diary/entries/<int:pk>/", views.entry_detail, name="entry_detail"),
    path("feed/", views.friends_feed, name="friends_feed"),
    path("emotions/", views.emotions_list, name="emotions_list"),
]
