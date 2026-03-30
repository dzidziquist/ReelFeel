from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("log/", views.add_entry, name="add_entry"),
    path("entry/<int:pk>/edit/", views.edit_entry, name="edit_entry"),
    path("entry/<int:pk>/delete/", views.delete_entry, name="delete_entry"),
]
