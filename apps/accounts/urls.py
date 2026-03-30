from django.urls import path
from . import views

urlpatterns = [
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("users/", views.user_list, name="user_list"),
    path("users/<int:pk>/", views.user_profile, name="user_profile"),
    path("users/<int:pk>/follow/", views.follow_toggle, name="follow_toggle"),
]
