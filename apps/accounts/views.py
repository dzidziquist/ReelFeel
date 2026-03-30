from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Follow


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    email = request.data.get("email", "").strip()

    if not username or not password:
        return Response({"error": "Username and password are required."}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken."}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": _user_dict(user)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": _user_dict(user)})


@api_view(["POST"])
def logout_view(request):
    request.user.auth_token.delete()
    return Response(status=204)


@api_view(["GET"])
def me(request):
    return Response(_user_dict(request.user))


@api_view(["GET"])
def user_list(request):
    users = User.objects.exclude(pk=request.user.pk)
    following_ids = set(
        Follow.objects.filter(follower=request.user).values_list("following_id", flat=True)
    )
    return Response([
        {**_user_dict(u), "is_following": u.pk in following_ids}
        for u in users
    ])


@api_view(["GET"])
def user_profile(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=404)

    from apps.diary.models import DiaryEntry
    from apps.diary.views import _entry_dict
    entries = DiaryEntry.objects.filter(user=user).select_related("media").prefetch_related("emotions").order_by("-watched_on")[:20]
    is_following = Follow.objects.filter(follower=request.user, following=user).exists()

    return Response({
        "user": {**_user_dict(user), "is_following": is_following},
        "entries": [_entry_dict(e) for e in entries],
    })


@api_view(["POST", "DELETE"])
def follow_toggle(request, pk):
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=404)
    if target == request.user:
        return Response({"error": "Cannot follow yourself."}, status=400)

    if request.method == "POST":
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response({"following": True})
    else:
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response({"following": False})


def _user_dict(user):
    return {
        "id": user.pk,
        "username": user.username,
        "email": user.email,
        "date_joined": user.date_joined.isoformat(),
    }
