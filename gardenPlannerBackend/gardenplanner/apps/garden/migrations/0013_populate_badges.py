from django.db import migrations

def create_all_badges(apps, schema_editor):
    Badge = apps.get_model('garden', 'Badge')

    badges_data = [
        # Welcome & Onboarding
        {
            "key": "tiny_sprout",
            "name": "Tiny Sprout",
            "description": "Welcome to the garden! Every great plant starts from a seed.",
            "category": "Welcome & Onboarding",
            "requirement": {"signed_up": 1},
        },
        # Garden Creation
        {
            "key": "seed_planter",
            "name": "Seed Planter",
            "description": "You planted your first garden — your roots are growing!",
            "category": "Garden Creation",
            "requirement": {"gardens_created": 1},
        },
        {
            "key": "urban_gardener",
            "name": "Urban Gardener",
            "description": "You’ve helped many gardens come to life!",
            "category": "Garden Creation",
            "requirement": {"gardens_created": 10},
        },
        # Forum Posts
        {
            "key": "talkative_tulip",
            "name": "Talkative Tulip",
            "description": "Shared your first thought with the community.",
            "category": "Forum Posts",
            "requirement": {"posts_count": 1},
        },
        {
            "key": "friendly_fern",
            "name": "Friendly Fern",
            "description": "You’re growing into a regular contributor.",
            "category": "Forum Posts",
            "requirement": {"posts_count": 10},
        },
        {
            "key": "voice_of_the_garden",
            "name": "Voice of the Garden",
            "description": "Your words help the garden flourish.",
            "category": "Forum Posts",
            "requirement": {"posts_count": 100},
        },
        # Forum Answers / Replies
        {
            "key": "helpful_seedling",
            "name": "Helpful Seedling",
            "description": "Offered your first helping hand.",
            "category": "Forum Answers / Replies",
            "requirement": {"comments_count": 1},
        },
        {
            "key": "supportive_stem",
            "name": "Supportive Stem",
            "description": "You’re the kind of friend every gardener needs.",
            "category": "Forum Answers / Replies",
            "requirement": {"comments_count": 10},
        },
        {
            "key": "wise_willow",
            "name": "Wise Willow",
            "description": "You’ve shared deep roots of knowledge.",
            "category": "Forum Answers / Replies",
            "requirement": {"comments_count": 100},
        },
        # Task Creation
        {
            "key": "tiny_toolbelt",
            "name": "Tiny Toolbelt",
            "description": "Took your first step toward garden care!",
            "category": "Task Creation",
            "requirement": {"tasks_created": 1},
        },
        {
            "key": "garden_guardian",
            "name": "Garden Guardian",
            "description": "You keep things neat and thriving.",
            "category": "Task Creation",
            "requirement": {"tasks_created": 10},
        },
        {
            "key": "garden_deputy",
            "name": "Garden Deputy",
            "description": "You’ve tended to more tasks than anyone!",
            "category": "Task Creation",
            "requirement": {"tasks_created": 100},
        },
        # Task Completion
        {
            "key": "task_tiller",
            "name": "Task Tiller",
            "description": "You reaped your first fruits of labor.",
            "category": "Task Completion",
            "requirement": {"tasks_completed": 1},
        },
        {
            "key": "busy_bee",
            "name": "Busy Bee",
            "description": "You’re always buzzing around helping!",
            "category": "Task Completion",
            "requirement": {"tasks_completed": 10},
        },
        {
            "key": "bloom_keeper",
            "name": "Bloom Keeper",
            "description": "You’ve brought so many things to bloom.",
            "category": "Task Completion",
            "requirement": {"tasks_completed": 100},
        },
        # Garden Joining
        {
            "key": "new_seedling",
            "name": "New Seedling",
            "description": "You’ve joined your first patch of green friends.",
            "category": "Garden Joining",
            "requirement": {"gardens_joined": 1},
        },
        {
            "key": "garden_hopper",
            "name": "Garden Hopper",
            "description": "Exploring all corners of the garden world!",
            "category": "Garden Joining",
            "requirement": {"gardens_joined": 10},
        },
        # People Followed
        {
            "key": "curious_sprout",
            "name": "Curious Sprout",
            "description": "You reached out to connect with someone new.",
            "category": "People Followed",
            "requirement": {"following_count": 1},
        },
        {
            "key": "friendly_vine",
            "name": "Friendly Vine",
            "description": "Your connections are spreading like ivy.",
            "category": "People Followed",
            "requirement": {"following_count": 10},
        },
        {
            "key": "social_sunflower",
            "name": "Social Sunflower",
            "description": "Everyone turns toward you!",
            "category": "People Followed",
            "requirement": {"following_count": 100},
        },
        # Followers Gained
        {
            "key": "spotted_seed",
            "name": "Spotted Seed",
            "description": "Someone noticed your growth!",
            "category": "Followers Gained",
            "requirement": {"followers_count": 1},
        },
        {
            "key": "blooming_buddy",
            "name": "Blooming Buddy",
            "description": "You’re becoming a favorite in the garden.",
            "category": "Followers Gained",
            "requirement": {"followers_count": 10},
        },
        {
            "key": "garden_star",
            "name": "Garden Star",
            "description": "You’re the heart of the community.",
            "category": "Followers Gained",
            "requirement": {"followers_count": 100},
        },
        # Garden Event — Participation Badges
        {
            "key": "event_1",
            "name": "Festival Sprout",
            "description": "Joined your first big garden gathering!",
            "category": "Event Participation",
            "requirement": {"events_attended": 1},
        },
        {
            "key": "event_5",
            "name": "Gathering Spirit",
            "description": "You show up rain or shine — the garden loves you!",
            "category": "Event Participation",
            "requirement": {"events_attended": 5},
        },
        {
            "key": "event_10",
            "name": "Heart of the Garden",
            "description": "You’re a bright part of every celebration.",
            "category": "Event Participation",
            "requirement": {"events_attended": 10},
        },
        # Seasonal Event Badges
        {
            "key": "event_spring",
            "name": "Pink Blossom",
            "description": "Celebrated new beginnings this spring.",
            "category": "Event Seasonal",
            "requirement": {"season": "spring"},
        },
        {
            "key": "event_summer",
            "name": "Sunny Petal",
            "description": "Danced under the summer sun.",
            "category": "Event Seasonal",
            "requirement": {"season": "summer"},
        },
        {
            "key": "event_autumn",
            "name": "Harvest Spirit",
            "description": "Helped the garden through harvest time.",
            "category": "Event Seasonal",
            "requirement": {"season": "autumn"},
        },
        {
            "key": "event_winter",
            "name": "Frost Guardian",
            "description": "Kept the warmth alive through winter.",
            "category": "Event Seasonal",
            "requirement": {"season": "winter"},
        },
    ]

    for badge_data in badges_data:
        Badge.objects.update_or_create(key=badge_data["key"], defaults=badge_data)

class Migration(migrations.Migration):

    dependencies = [
        ('garden', '0012_badge_userbadge'),  
    ]

    operations = [
        migrations.RunPython(create_all_badges),
    ]
