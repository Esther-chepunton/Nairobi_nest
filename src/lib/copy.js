export const BRAND = {
  name: "Kijiji",
  tagline: "Experiences worth remembering.",
  metaDescription:
    "Find experiences worth remembering. Curated for your mood, your time, and the people you're with.",
  copyright: (year) => `© ${year} Kijiji — Explore Kenya, your way.`,
};

export const onboarding = {
  eyebrow: "Kijiji",
  slides: [
    {
      title: "Kenya, the way locals live it",
      body: "Kijiji finds experiences worth remembering — forest mornings, market afternoons, ridge-top sunsets. Not hotel listings. Real moments.",
    },
    {
      title: "Recommendations that feel personal",
      body: "Tell us your mood, your time, who's with you. We'll suggest experiences the way a friend who knows Nairobi would.",
    },
    {
      title: "Explore freely. Commit when you're ready.",
      body: "Save what speaks to you. Build a day you'll talk about. Book a local guide only when you want one.",
    },
  ],
  cta: {
    primary: "Start exploring",
    secondary: "Sign in for better picks",
    skip: "Skip for now",
  },
};

export const home = {
  heroTitle: "What will today become?",
  heroSubtitle:
    "Discover experiences worth remembering — curated for your mood, your time, and the people you're with.",
  searchPlaceholder: "Where are you exploring from?",
  primaryCta: "Find experiences",
  secondaryCta: "Surprise me",
  weatherRain: "Rain today — perfect for cafés, museums, and cozy corners.",
  carousels: {
    trending: "Gathering momentum this weekend",
    becauseYouLiked: "More of what you loved",
    hiddenGems: "Off the beaten path",
    hiddenGemsSubtitle: "Where locals actually go",
  },
  moodSelector: "Match your mood",
  map: {
    title: "See it on the map",
    cta: "View the map",
  },
  itinerary: {
    title: "Shape your day",
    bodyTitle: "Plan a day you'll remember",
    body: "String together a forest walk, a coffee stop, and a ridge sunset. Save what you love. Build a day that fits.",
    cta: "Plan your day",
  },
  resume: {
    title: "Continue where you left off",
    continue: "Continue",
    dismiss: "Dismiss",
    summary: ({ mood, time, location }) =>
      [mood, time, location].filter(Boolean).join(" · "),
  },
};

export const discover = {
  title: "What kind of experience are you after?",
  subtitle:
    "Share your intent — mood, time, budget, company — and we'll find experiences made for this moment.",
  browseCategories: "Explore by interest",
  labels: {
    location: "Starting from",
    mood: "How are you feeling?",
    time: "How much time do you have?",
    budget: "What feels comfortable?",
    companions: "Who's coming along?",
    category: "Any particular interest? (optional)",
  },
  categoryDefault: "Open to anything",
  submit: "Show me experiences",
  searchAriaLabel: "Discover experiences",
};

export const results = {
  title: "Curated for you",
  loading: "Finding experiences for you…",
  loadingSlow: "Waking up the server — the first visit after a quiet spell can take up to a minute.",
  error: "We couldn't load recommendations. Check your connection and try again.",
  retry: "Try again",
  filters: "Refine your search",
  filterLabels: {
    mood: "Feeling",
    time: "Time you have",
    budget: "Comfort zone",
  },
  empty: "Nothing quite matched — try widening your mood or budget. The right experience might be one filter away.",
  matchBadge: (score) => `${score}% fit`,
  priceFree: "Free",
  priceFrom: (amount) => `From KSh ${amount.toLocaleString()}`,
};

export const placeDetail = {
  highlyRated: "Loved by explorers",
  findYourWay: "Find Your Way",
  nearbyDiscoveries: "Nearby Discoveries",
  distanceKm: (n) => `${n.toFixed(1)} km from here`,
  authModal: "Sign in to save this experience and connect with local guides.",
  sections: {
    story: "The Story",
    whyYoullLoveIt: "Why You'll Love It",
    whatToExpect: "What to Expect",
    localTips: "Local Tips",
    beforeYouGo: "Before You Go",
    bestTime: "Best Time to Visit",
    inPictures: "In Pictures",
  },
  quickInfo: {
    travelTime: "Close by",
    free: "Free",
    difficulty: "Easy going",
    bestTime: "Anytime works",
  },
  sticky: {
    directions: "Get there",
    bookGuide: "Meet a local guide",
  },
  sidebar: {
    guides: "Go with someone who knows",
    stories: "Stories to spark you",
    newsletterTitle: "Stay curious",
    newsletterBody: "Weekly hidden gems and stories from across Kenya.",
    newsletterPlaceholder: "your@email.com",
    newsletterCta: "Subscribe",
  },
};

export const emptyStates = {
  results: "Nothing matched this time — but Kenya always has more. Try a different mood or widen your budget.",
  favorites: {
    message:
      "Your collection is empty — for now. Every great list starts with one moment that stopped you scrolling.",
    cta: "Start exploring",
  },
  itineraries: {
    message:
      "No day plans yet. The best days aren't planned in one sitting — start with one experience you love.",
    cta: "Create a day plan",
  },
  itineraryNoStops: "Add experiences from your saved list below.",
  profile: "Sign in to save experiences, build day plans, and get recommendations that learn what you love.",
  map: "No experiences in view — try zooming out or changing filters.",
  guides: "Local guides coming soon to this area.",
};

export const favorites = {
  title: "Your collection",
  subtitle: "Experiences you've saved — ready when you are.",
  authPrompt: "Sign in to build your collection of experiences.",
  empty: {
    message:
      "Your collection is empty — for now. Every great list starts with one moment that stopped you scrolling.",
    cta: "Start exploring",
  },
  toast: {
    saved: "Saved to your collection",
    removed: "Removed from your collection",
  },
};

export const auth = {
  eyebrow: "Kijiji",
  signIn: {
    title: "Welcome back",
    subtitle: "Pick up where you left off — your saved experiences and day plans are waiting.",
  },
  signUp: {
    title: "Join Kijiji",
    subtitle:
      "Create an account and we'll learn what you love — better recommendations, saved collections, and day plans that grow with you.",
  },
  labels: {
    name: "Your name",
    email: "Email",
    password: "Password",
  },
  submit: {
    signIn: "Sign in",
    signUp: "Create account",
    loading: "One moment…",
  },
  toggle: {
    toSignUp: "New here? Create an account",
    toSignIn: "Already exploring? Sign in",
  },
  guest: "Continue without an account",
  toast: {
    welcomeBack: "Welcome back — let's explore.",
    accountCreated: "You're in. Your recommendations just got smarter.",
    failed: "Something didn't work — check your details and try again.",
  },
};

export const modal = {
  title: "Sign in to continue",
  defaultMessage: "Save experiences, build day plans, and get recommendations tailored to you.",
  cancel: "Not now",
  confirm: "Sign in",
};

export const nav = {
  explore: "Explore",
  interests: "Interests",
  nearMe: "Near me",
  dayPlans: "Day plans",
  localGuides: "Local guides",
  saved: "Saved",
  you: "You",
  signIn: "Sign in",
  menu: "Menu",
};

export const footer = {
  tagline: "Experiences worth remembering.",
  discover: "Discover",
  links: {
    findExperiences: "Find experiences",
    forYou: "For you",
    collection: "Your collection",
    dayPlans: "Day plans",
  },
  about: "About",
  ourStory: "Our story",
  newsletterTitle: "Stay curious",
  newsletterPlaceholder: "your@email.com",
  newsletterCta: "Subscribe",
};

export const loading = {
  generic: "Just a moment…",
  place: "Loading this experience…",
  favorites: "Gathering your collection…",
  itineraries: "Loading your day plans…",
  results: "Finding experiences for you…",
  auth: "One moment…",
  payment: "Processing your payment…",
  sharedItinerary: "Loading shared plan…",
};

export const searching = {
  active: "Searching for experiences…",
  submit: "Discover",
};

export const saving = {
  inProgress: "Saving…",
  saved: "Saved to your collection",
  removed: "Removed from your collection",
  authRequired: "Sign in to save experiences",
};

export const toast = {
  preferencesSaved: "Your preferences are saved",
  preferencesFailed: "Couldn't save preferences — try again.",
  dayPlanCreated: "Day plan created",
  dayPlanFailed: "Couldn't create your day plan — try again.",
  addedToDay: "Added to your day",
  addPlaceFailed: "Couldn't add that experience — try again.",
  mpesaSent: "Check your phone — M-Pesa prompt sent",
  paymentFailed: "Payment didn't go through — try again.",
  newsletter: "You're subscribed — welcome aboard",
  fillAllFields: "Fill in all fields to continue",
};

export const errors = {
  generic: "Something went wrong. Give it another try.",
  network: "Can't reach Kijiji right now — check your connection.",
  requestFailed: "Something went wrong on our end",
  loadPlaces: "Couldn't load experiences",
  placeNotFound: "This experience isn't available",
  loadFavorites: "Couldn't load your collection",
  loadGuides: "Couldn't load guides",
  loadItineraries: "Couldn't load day plans",
  itineraryNotFound: "Day plan not found",
};

export const map = {
  title: "Explore the map",
  subtitle: "Tap a pin. Discover what's waiting.",
  locationPrompt: "Share your location for experiences nearby",
  locationDenied: "Using Nairobi as your starting point — enable location for nearby picks",
  markerCta: "View experience",
};

export const offline = {
  offline: "You're offline — saved experiences are still here",
  reconnected: "You're back online",
};

export const notifications = {
  optIn: "Get a nudge when we find something perfect for your mood",
  granted: "We'll keep you inspired — no spam, just gems",
};

export const guides = {
  title: "Local guides",
  subtitle: "Explore with someone who knows the stories behind the places.",
  empty: emptyStates.guides,
  checkout: {
    title: "Book a local guide",
    subtitle: "A local expert for your adventure — on your terms.",
    selectGuide: "Choose your guide",
    date: "Date",
    duration: "How long",
    mpesaPhone: "M-Pesa number",
    durations: {
      2: "2 hours",
      4: "4 hours",
      6: "6 hours",
      8: "Full day",
    },
    total: "Total",
    pay: "Pay with M-Pesa",
    cancel: "Cancel",
    phoneHint: "Sandbox test number: 0708374149",
    status: {
      awaiting_payment: "Check your phone and enter your M-Pesa PIN…",
      confirmed: "Payment received — your guide is booked!",
      failed: "Payment didn't go through.",
      cancelled: "Payment was cancelled on the phone.",
      timeout: "We haven't heard back from M-Pesa yet. If you paid, it will show on your profile shortly.",
    },
    receipt: (code) => `M-Pesa receipt: ${code}`,
    retry: "Try again",
    viewProfile: "View my bookings",
  },
};

export const itineraries = {
  title: "Your day plans",
  newDay: "New day",
  defaultTitle: "My day in Nairobi",
  estBudget: (amount) => `Est. spend: KSh ${amount.toLocaleString()}`,
  share: (url) => `Share this day: ${url}`,
  timeSlots: {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    flexible: "Flexible",
  },
  addFromSaved: "Add from your collection",
  manageSaved: "Manage saved experiences →",
};

export const profile = {
  title: "You",
  bookings: {
    title: "Guide bookings",
    empty: "No guide bookings yet.",
    guide: "Local guide",
    status: {
      pending: "Not paid",
      awaiting_payment: "Awaiting payment",
      confirmed: "Paid",
      failed: "Payment failed",
      cancelled: "Cancelled",
    },
  },
  preferences: "What you love",
  budgetLabel: "Usual budget (KSh)",
  travelStyleLabel: "Travel style",
  travelStyles: {
    explorer: "Explorer",
    relaxed: "Relaxed",
    adventurous: "Adventurous",
  },
  savePreferences: "Save preferences",
  viewCollection: "View your collection",
  signOut: "Sign out",
  savedCount: (n) => `${n} saved experiences`,
  signInPrompt: emptyStates.profile,
};

export const sharedItinerary = {
  eyebrow: "Shared day plan",
};
