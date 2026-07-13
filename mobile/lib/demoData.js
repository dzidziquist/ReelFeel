// Fictional films and TV shows — no real franchise artwork.
// Poster URLs use picsum.photos (abstract nature/landscape photos).

const p = (seed, w = 500, h = 750) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

export const DEMO_MEDIA = [
  { id: 1,  tmdb_id: 9001, media_type: 'film', title: 'Drifting Parallel',    year: 2024, poster_path: '', poster_url: p('drift'),    backdrop_url: p('drift-b', 1280, 720),   overview: 'Two strangers discover their lives are entangled across different timelines.',   genres: ['Drama', 'Sci-Fi'],       runtime: 112, tmdb_rating: 7.8 },
  { id: 2,  tmdb_id: 9002, media_type: 'film', title: 'The Amber Coast',      year: 2023, poster_path: '', poster_url: p('amber'),    backdrop_url: p('amber-b', 1280, 720),   overview: 'A coastal town is transformed when a mysterious ship arrives at dawn.',         genres: ['Drama', 'Mystery'],      runtime: 98,  tmdb_rating: 7.2 },
  { id: 3,  tmdb_id: 9003, media_type: 'film', title: 'Hollow Signal',        year: 2024, poster_path: '', poster_url: p('hollow'),   backdrop_url: p('hollow-b', 1280, 720),  overview: 'A radio operator picks up a transmission that should be impossible.',          genres: ['Thriller', 'Sci-Fi'],    runtime: 105, tmdb_rating: 7.5 },
  { id: 4,  tmdb_id: 9004, media_type: 'film', title: 'Before We Disappear',  year: 2023, poster_path: '', poster_url: p('before'),   backdrop_url: p('before-b', 1280, 720),  overview: 'Two old friends reunite the night before one of them leaves forever.',         genres: ['Drama', 'Romance'],      runtime: 94,  tmdb_rating: 8.1 },
  { id: 5,  tmdb_id: 9005, media_type: 'film', title: 'Echo Protocol',        year: 2024, poster_path: '', poster_url: p('echo'),     backdrop_url: p('echo-b', 1280, 720),    overview: 'A linguist decodes an ancient language that reorders reality.',               genres: ['Sci-Fi', 'Adventure'],   runtime: 127, tmdb_rating: 7.6 },
  { id: 6,  tmdb_id: 9006, media_type: 'film', title: 'Salt & Shadow',        year: 2023, poster_path: '', poster_url: p('salt'),     backdrop_url: p('salt-b', 1280, 720),    overview: 'A documentary crew follows a deep-sea fisherman through a brutal winter.',    genres: ['Documentary', 'Drama'],  runtime: 88,  tmdb_rating: 7.9 },
  { id: 7,  tmdb_id: 9007, media_type: 'film', title: 'The Glass Conductor',  year: 2024, poster_path: '', poster_url: p('glass'),    backdrop_url: p('glass-b', 1280, 720),   overview: 'A prodigy conductor uncovers the dark history of the symphony he inherits.',  genres: ['Drama', 'Music'],        runtime: 118, tmdb_rating: 8.3 },
  { id: 8,  tmdb_id: 9008, media_type: 'film', title: 'Night Cartography',    year: 2023, poster_path: '', poster_url: p('night'),    backdrop_url: p('night-b', 1280, 720),   overview: 'A cartographer maps cities that only exist after midnight.',                  genres: ['Fantasy', 'Drama'],      runtime: 102, tmdb_rating: 7.4 },
  { id: 9,  tmdb_id: 9009, media_type: 'tv',   title: 'Fracture Season',      year: 2024, poster_path: '', poster_url: p('fracture'), backdrop_url: p('fracture-b', 1280, 720), overview: 'Six strangers must cooperate to survive a series of impossible dilemmas.',   genres: ['Thriller', 'Drama'],     runtime: 45,  tmdb_rating: 8.0 },
  { id: 10, tmdb_id: 9010, media_type: 'film', title: 'A Map of Quiet',       year: 2023, poster_path: '', poster_url: p('mapquiet'), backdrop_url: p('mapquiet-b', 1280, 720), overview: 'After losing her voice, a singer finds new ways to communicate her art.',    genres: ['Drama', 'Music'],        runtime: 91,  tmdb_rating: 7.7 },
  { id: 11, tmdb_id: 9011, media_type: 'film', title: 'Velvet Undertow',      year: 2024, poster_path: '', poster_url: p('velvet'),   backdrop_url: p('velvet-b', 1280, 720),  overview: 'A jazz club in 1960s Havana becomes the centre of a political storm.',        genres: ['Drama', 'History'],      runtime: 134, tmdb_rating: 8.2 },
  { id: 12, tmdb_id: 9012, media_type: 'film', title: 'Last Known Position',  year: 2023, poster_path: '', poster_url: p('lastpos'),  backdrop_url: p('lastpos-b', 1280, 720),  overview: 'A search-and-rescue pilot hunts for a missing plane above frozen terrain.',  genres: ['Action', 'Thriller'],    runtime: 109, tmdb_rating: 7.3 },
  { id: 13, tmdb_id: 9013, media_type: 'film', title: 'The Featherweight',    year: 2024, poster_path: '', poster_url: p('feather'),  backdrop_url: p('feather-b', 1280, 720),  overview: 'A retired boxer trains a teenager who reminds him of his younger self.',      genres: ['Drama', 'Sport'],        runtime: 107, tmdb_rating: 7.9 },
  { id: 14, tmdb_id: 9014, media_type: 'film', title: 'Bloom Protocol',       year: 2023, poster_path: '', poster_url: p('bloom'),    backdrop_url: p('bloom-b', 1280, 720),   overview: 'Scientists race to contain a rapidly evolving plant-based intelligence.',    genres: ['Sci-Fi', 'Thriller'],    runtime: 116, tmdb_rating: 7.1 },
  { id: 15, tmdb_id: 9015, media_type: 'tv',   title: 'Meridian',             year: 2024, poster_path: '', poster_url: p('meridian'), backdrop_url: p('meridian-b', 1280, 720), overview: 'A geologist stumbles on evidence that rewrites human history.',              genres: ['Drama', 'Adventure'],    runtime: 52,  tmdb_rating: 8.4 },
]

const EMOTIONS_SAMPLE = [
  { id: 1,  name: 'Moved',      icon: '🥹', color: '#60a5fa', category: 'Sad' },
  { id: 2,  name: 'Joyful',     icon: '😁', color: '#facc15', category: 'Happy' },
  { id: 3,  name: 'Tense',      icon: '😬', color: '#f97316', category: 'Afraid' },
  { id: 4,  name: 'Mind-blown', icon: '🤯', color: '#a78bfa', category: 'Surprised' },
  { id: 5,  name: 'Nostalgic',  icon: '🌅', color: '#fb923c', category: 'Sad' },
  { id: 6,  name: 'Inspired',   icon: '✨', color: '#34d399', category: 'Happy' },
  { id: 7,  name: 'Sad',        icon: '😢', color: '#93c5fd', category: 'Sad' },
  { id: 8,  name: 'Obsessed',   icon: '🔥', color: '#f43f5e', category: 'Interested' },
]

export const DEMO_ENTRIES = [
  { id: 1,  media_id: 7,  watched_on: '2024-06-22', rating: 5,   rewatch: false, review: 'One of the most beautiful films I have seen in years. The score alone deserves every award.',           emotions: [EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[5]], media: DEMO_MEDIA[6] },
  { id: 2,  media_id: 14, watched_on: '2024-06-22', rating: 4.5, rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[3], EMOTIONS_SAMPLE[2]], media: { ...DEMO_MEDIA[8], media_type: 'tv' } },
  { id: 3,  media_id: 4,  watched_on: '2024-06-20', rating: 4.5, rewatch: true,  review: 'Even better on rewatch. The ending hits differently when you know what is coming.',                        emotions: [EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[4]], media: DEMO_MEDIA[3] },
  { id: 4,  media_id: 11, watched_on: '2024-06-18', rating: 5,   rewatch: false, review: 'A masterpiece. The production design is immaculate and the performances are career-best.',                 emotions: [EMOTIONS_SAMPLE[5], EMOTIONS_SAMPLE[7]], media: DEMO_MEDIA[10] },
  { id: 5,  media_id: 3,  watched_on: '2024-06-15', rating: 4,   rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[2], EMOTIONS_SAMPLE[3]], media: DEMO_MEDIA[2] },
  { id: 6,  media_id: 1,  watched_on: '2024-06-12', rating: 4,   rewatch: false, review: 'Genuinely original concept. Slow burn but worth every minute.',                                            emotions: [EMOTIONS_SAMPLE[3], EMOTIONS_SAMPLE[5]], media: DEMO_MEDIA[0] },
  { id: 7,  media_id: 13, watched_on: '2024-06-08', rating: 4,   rewatch: false, review: 'The lead performance carries the whole film.',                                                              emotions: [EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[1]], media: DEMO_MEDIA[12] },
  { id: 8,  media_id: 5,  watched_on: '2024-05-30', rating: 4,   rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[3]], media: DEMO_MEDIA[4] },
  { id: 9,  media_id: 6,  watched_on: '2024-05-25', rating: 4.5, rewatch: false, review: 'Quietly devastating. Stays with you for days.',                                                             emotions: [EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[4]], media: DEMO_MEDIA[5] },
  { id: 10, media_id: 10, watched_on: '2024-05-20', rating: 4,   rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[5]], media: DEMO_MEDIA[9] },
  { id: 11, media_id: 2,  watched_on: '2024-05-14', rating: 3.5, rewatch: false, review: 'Beautiful cinematography. The story loses steam in the third act.',                                        emotions: [EMOTIONS_SAMPLE[4]], media: DEMO_MEDIA[1] },
  { id: 12, media_id: 8,  watched_on: '2024-05-10', rating: 3.5, rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[3], EMOTIONS_SAMPLE[4]], media: DEMO_MEDIA[7] },
  { id: 13, media_id: 12, watched_on: '2024-04-28', rating: 3.5, rewatch: false, review: 'Solid genre film. Delivers exactly what it promises.',                                                     emotions: [EMOTIONS_SAMPLE[2]], media: DEMO_MEDIA[11] },
  { id: 14, media_id: 15, watched_on: '2024-04-20', rating: 5,   rewatch: false, review: 'Can\'t stop thinking about this show. The finale left me speechless.',                                    emotions: [EMOTIONS_SAMPLE[3], EMOTIONS_SAMPLE[0], EMOTIONS_SAMPLE[7]], media: { ...DEMO_MEDIA[14], media_type: 'tv' } },
  { id: 15, media_id: 9,  watched_on: '2024-04-10', rating: 4,   rewatch: false, review: null,                                                                                                        emotions: [EMOTIONS_SAMPLE[2], EMOTIONS_SAMPLE[3]], media: { ...DEMO_MEDIA[8], media_type: 'tv' } },
]

export const DEMO_WATCHLIST = [
  { id: 1,  added_at: '2024-06-25T10:00:00Z', media: DEMO_MEDIA[13] },
  { id: 2,  added_at: '2024-06-24T14:30:00Z', media: DEMO_MEDIA[7]  },
  { id: 3,  added_at: '2024-06-23T09:15:00Z', media: DEMO_MEDIA[11] },
  { id: 4,  added_at: '2024-06-21T18:45:00Z', media: DEMO_MEDIA[4]  },
  { id: 5,  added_at: '2024-06-19T11:00:00Z', media: DEMO_MEDIA[1]  },
  { id: 6,  added_at: '2024-06-17T20:30:00Z', media: DEMO_MEDIA[2]  },
  { id: 7,  added_at: '2024-06-16T16:00:00Z', media: { ...DEMO_MEDIA[14], media_type: 'tv' } },
  { id: 8,  added_at: '2024-06-13T08:00:00Z', media: DEMO_MEDIA[0]  },
  { id: 9,  added_at: '2024-06-10T19:00:00Z', media: DEMO_MEDIA[9]  },
  { id: 10, added_at: '2024-06-07T12:30:00Z', media: { ...DEMO_MEDIA[8], media_type: 'tv' } },
  { id: 11, added_at: '2024-06-04T15:00:00Z', media: DEMO_MEDIA[5]  },
  { id: 12, added_at: '2024-06-01T10:00:00Z', media: DEMO_MEDIA[12] },
]

export const DEMO_INSIGHTS = {
  totalMovies:  13,
  totalTV:      3,
  totalEntries: 15,
  avgRating:    4.2,
  thisMonth:    8,
  totalRuntime: 1486,
  streak:       5,
  topEmotion:   { name: 'Moved', icon: '🥹' },
  topEmotions: [
    { name: 'Moved',     icon: '🥹', count: 10 },
    { name: 'Nostalgic', icon: '🌅', count: 7  },
    { name: 'Inspired',  icon: '✨', count: 5  },
  ],
}

export const DEMO_PROFILE = {
  id:           'demo-user',
  username:     'dzidzi',
  display_name: 'Dzidzi',
  bio:          'Watching films and feeling things.',
  avatar_url:   null,
  created_at:   '2024-01-01T00:00:00Z',
}

export const DEMO_EMOTIONS = EMOTIONS_SAMPLE

// Home screen sections
export const DEMO_HOME = {
  nowPlaying:  DEMO_MEDIA.slice(0, 5),
  trending:    DEMO_MEDIA.slice(5, 10),
  popularTV:   [DEMO_MEDIA[8], DEMO_MEDIA[14], ...DEMO_MEDIA.slice(2, 5)],
  forYou:      DEMO_MEDIA.slice(10, 15),
  upcoming:    DEMO_MEDIA.slice(15, 20),
  airingToday: DEMO_MEDIA.slice(0, 5),
}
