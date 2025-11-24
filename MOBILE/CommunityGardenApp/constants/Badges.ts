import { Ionicons } from '@expo/vector-icons';

export interface BadgeDefinition {
    name: string;
    nameKey: string;
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
    category: string;
    categoryKey: string;
    descriptionKey: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
    // Welcome & Onboarding
    {
        name: 'Tiny Sprout',
        nameKey: 'badges.names.tinySprout',
        iconName: 'leaf',
        color: '#66BB6A',
        category: 'Welcome & Onboarding',
        categoryKey: 'badges.categories.welcomeOnboarding',
        descriptionKey: 'badges.tinySprout'
    },

    // Garden Creation
    {
        name: 'Seed Planter',
        nameKey: 'badges.names.seedPlanter',
        iconName: 'nutrition',
        color: '#8D6E63',
        category: 'Garden Creation',
        categoryKey: 'badges.categories.gardenCreation',
        descriptionKey: 'badges.seedPlanter'
    },
    {
        name: 'Urban Gardener',
        nameKey: 'badges.names.urbanGardener',
        iconName: 'business',
        color: '#7CB342',
        category: 'Garden Creation',
        categoryKey: 'badges.categories.gardenCreation',
        descriptionKey: 'badges.urbanGardener'
    },

    // Forum Posts
    {
        name: 'Talkative Tulip',
        nameKey: 'badges.names.talkativeTulip',
        iconName: 'chatbubbles',
        color: '#EC407A',
        category: 'Forum Posts',
        categoryKey: 'badges.categories.forumPosts',
        descriptionKey: 'badges.talkativeTulip'
    },
    {
        name: 'Friendly Fern',
        nameKey: 'badges.names.friendlyFern',
        iconName: 'happy',
        color: '#26A69A',
        category: 'Forum Posts',
        categoryKey: 'badges.categories.forumPosts',
        descriptionKey: 'badges.friendlyFern'
    },
    {
        name: 'Voice of the Garden',
        nameKey: 'badges.names.voiceOfTheGarden',
        iconName: 'megaphone',
        color: '#0288D1',
        category: 'Forum Posts',
        categoryKey: 'badges.categories.forumPosts',
        descriptionKey: 'badges.voiceOfTheGarden'
    },

    // Forum Answers / Replies
    {
        name: 'Helpful Seedling',
        nameKey: 'badges.names.helpfulSeedling',
        iconName: 'thumbs-up',
        color: '#FF9800',
        category: 'Forum Answers / Replies',
        categoryKey: 'badges.categories.forumAnswers',
        descriptionKey: 'badges.helpfulSeedling'
    },
    {
        name: 'Supportive Stem',
        nameKey: 'badges.names.supportiveStem',
        iconName: 'heart',
        color: '#FFA726',
        category: 'Forum Answers / Replies',
        categoryKey: 'badges.categories.forumAnswers',
        descriptionKey: 'badges.supportiveStem'
    },
    {
        name: 'Wise Willow',
        nameKey: 'badges.names.wiseWillow',
        iconName: 'school',
        color: '#5C6BC0',
        category: 'Forum Answers / Replies',
        categoryKey: 'badges.categories.forumAnswers',
        descriptionKey: 'badges.wiseWillow'
    },

    // Task Creation
    {
        name: 'Tiny Toolbelt',
        nameKey: 'badges.names.tinyToolbelt',
        iconName: 'construct',
        color: '#8D6E63',
        category: 'Task Creation',
        categoryKey: 'badges.categories.taskCreation',
        descriptionKey: 'badges.tinyToolbelt'
    },
    {
        name: 'Garden Guardian',
        nameKey: 'badges.names.gardenGuardian',
        iconName: 'shield-checkmark',
        color: '#00ACC1',
        category: 'Task Creation',
        categoryKey: 'badges.categories.taskCreation',
        descriptionKey: 'badges.gardenGuardian'
    },
    {
        name: 'Garden Deputy',
        nameKey: 'badges.names.gardenDeputy',
        iconName: 'star',
        color: '#F9A825',
        category: 'Task Creation',
        categoryKey: 'badges.categories.taskCreation',
        descriptionKey: 'badges.gardenDeputy'
    },

    // Task Completion
    {
        name: 'Task Tiller',
        nameKey: 'badges.names.taskTiller',
        iconName: 'checkbox',
        color: '#AB47BC',
        category: 'Task Completion',
        categoryKey: 'badges.categories.taskCompletion',
        descriptionKey: 'badges.taskTiller'
    },
    {
        name: 'Busy Bee',
        nameKey: 'badges.names.busyBee',
        iconName: 'flash',
        color: '#FBC02D',
        category: 'Task Completion',
        categoryKey: 'badges.categories.taskCompletion',
        descriptionKey: 'badges.busyBee'
    },
    {
        name: 'Bloom Keeper',
        nameKey: 'badges.names.bloomKeeper',
        iconName: 'rose',
        color: '#C2185B',
        category: 'Task Completion',
        categoryKey: 'badges.categories.taskCompletion',
        descriptionKey: 'badges.bloomKeeper'
    },

    // Garden Joining
    {
        name: 'New Seedling',
        nameKey: 'badges.names.newSeedling',
        iconName: 'person-add',
        color: '#4CAF50',
        category: 'Garden Joining',
        categoryKey: 'badges.categories.gardenJoining',
        descriptionKey: 'badges.newSeedling'
    },
    {
        name: 'Garden Hopper',
        nameKey: 'badges.names.gardenHopper',
        iconName: 'walk',
        color: '#388E3C',
        category: 'Garden Joining',
        categoryKey: 'badges.categories.gardenJoining',
        descriptionKey: 'badges.gardenHopper'
    },

    // People Followed
    {
        name: 'Curious Sprout',
        nameKey: 'badges.names.curiousSprout',
        iconName: 'people',
        color: '#0288D1',
        category: 'People Followed',
        categoryKey: 'badges.categories.peopleFollowed',
        descriptionKey: 'badges.curiousSprout'
    },
    {
        name: 'Friendly Vine',
        nameKey: 'badges.names.friendlyVine',
        iconName: 'git-network',
        color: '#43A047',
        category: 'People Followed',
        categoryKey: 'badges.categories.peopleFollowed',
        descriptionKey: 'badges.friendlyVine'
    },
    {
        name: 'Social Sunflower',
        nameKey: 'badges.names.socialSunflower',
        iconName: 'sunny',
        color: '#F57F17',
        category: 'People Followed',
        categoryKey: 'badges.categories.peopleFollowed',
        descriptionKey: 'badges.socialSunflower'
    },

    // Followers Gained
    {
        name: 'Spotted Seed',
        nameKey: 'badges.names.spottedSeed',
        iconName: 'eye',
        color: '#FF5722',
        category: 'Followers Gained',
        categoryKey: 'badges.categories.followersGained',
        descriptionKey: 'badges.spottedSeed'
    },
    {
        name: 'Blooming Buddy',
        nameKey: 'badges.names.bloomingBuddy',
        iconName: 'flower-outline',
        color: '#E91E63',
        category: 'Followers Gained',
        categoryKey: 'badges.categories.followersGained',
        descriptionKey: 'badges.bloomingBuddy'
    },
    {
        name: 'Garden Star',
        nameKey: 'badges.names.gardenStar',
        iconName: 'star-half',
        color: '#FF6F00',
        category: 'Followers Gained',
        categoryKey: 'badges.categories.followersGained',
        descriptionKey: 'badges.gardenStar'
    },
];
