from django.db import migrations

EMOTIONS = [
    {"name": "amused",    "slug": "amused",    "color": "#f6c90e", "icon": "😄"},
    {"name": "bored",     "slug": "bored",     "color": "#adb5bd", "icon": "😑"},
    {"name": "comforted", "slug": "comforted", "color": "#a8dadc", "icon": "🤗"},
    {"name": "disturbed", "slug": "disturbed", "color": "#6d2b3d", "icon": "😨"},
    {"name": "excited",   "slug": "excited",   "color": "#ff6b6b", "icon": "🤩"},
    {"name": "inspired",  "slug": "inspired",  "color": "#74b9ff", "icon": "✨"},
    {"name": "moved",     "slug": "moved",     "color": "#fd79a8", "icon": "🥺"},
    {"name": "nostalgic", "slug": "nostalgic", "color": "#fdcb6e", "icon": "🌅"},
    {"name": "sad",       "slug": "sad",       "color": "#636e72", "icon": "😢"},
    {"name": "scared",    "slug": "scared",    "color": "#2d3436", "icon": "😱"},
    {"name": "tense",     "slug": "tense",     "color": "#e17055", "icon": "😬"},
    {"name": "uplifted",  "slug": "uplifted",  "color": "#55efc4", "icon": "🙌"},
]


def seed_emotions(apps, schema_editor):
    Emotion = apps.get_model("emotions", "Emotion")
    for data in EMOTIONS:
        Emotion.objects.get_or_create(slug=data["slug"], defaults=data)


def remove_emotions(apps, schema_editor):
    Emotion = apps.get_model("emotions", "Emotion")
    Emotion.objects.filter(slug__in=[e["slug"] for e in EMOTIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("emotions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_emotions, remove_emotions),
    ]
