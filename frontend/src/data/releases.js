const RELEASES = [
  {
    version: '2.0.2',
    date: 'July 2026',
    label: 'Latest',
    changes: [
      'Home screen widget — long-press to choose between Last Watch, Watchlist, or Stats; available in small, medium, and large',
      'Widget posters now load and display correctly',
      'Widget automatically refreshes when you open the app — no need to visit individual tabs first',
      'Widget adapts to system light and dark mode',
      'New app icon with automatic light and dark variants based on your home screen appearance',
      'Streaming providers now open the correct app or website — Prime Video, Disney+, Netflix, and others all work reliably',
      'Now Playing and Coming Soon no longer show the same films',
      'Tab bar collapsed pill returns to bottom-left corner',
      'Performance improvements: faster scrolling in the diary, faster home feed filtering, reduced background network usage',
    ],
  },
  {
    version: '2.0.1',
    date: 'July 2026',
    label: null,
    changes: [
      'Floating filter pills on Search, Library, Diary, and Watchlist — liquid glass style, consistent across every screen',
      'Search now has a filter pill for All / Films / TV Shows, replacing the inline tabs',
      'Diary activity calendar now filters your entries when you tap a date',
      'Genre chips on the home feed are sticky as you scroll',
      'Removed heavy neo-brutalist borders and hard-offset shadows app-wide for a cleaner, more consistent look',
      'Profile and Search titles now respect the Dynamic Island and safe area on all devices',
      'Softer shadows on poster cards, entry cards, action buttons, and media detail page',
    ],
  },
  {
    version: '2.0.0',
    date: 'June 2026',
    label: null,
    changes: [
      'Share any diary entry as a link — let people see exactly what you thought of a film',
      'Recommendations on the search page based on your viewing history',
      'Dark mode shadow refinements across the app',
      'Performance improvements and stability fixes',
    ],
  },
  {
    version: '1.0.1',
    date: 'May 2026',
    label: null,
    changes: [
      'Fixed a crash on launch for some devices',
      'Improved sign-in reliability',
      'Minor UI polish across diary and stats screens',
    ],
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    label: 'First release',
    changes: [
      'Log every film and TV show you watch',
      'Rate with up to 5 stars and tag from 30+ emotions',
      'Activity calendar to visualise your viewing history',
      'Watch stats: total hours, favourite genres, rating averages',
      'Discover trending and now-playing titles',
      'Search millions of films and TV shows via TMDB',
      'Personal watchlist',
    ],
  },
]

export default RELEASES
