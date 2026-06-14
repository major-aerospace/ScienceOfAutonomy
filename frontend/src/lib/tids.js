export const TID = {
  // Navigation
  nav: "soa-nav",
  navLogo: "nav-logo",
  navLinkTracks: "nav-link-tracks",
  navLinkAssessment: "nav-link-assessment",
  navLinkStudio: "nav-link-studio",
  navLinkDashboard: "nav-link-dashboard",
  navLogin: "nav-login-button",
  navRegister: "nav-register-button",
  navLogout: "nav-logout-button",

  // Landing
  heroStart: "hero-start-learning",
  heroAssess: "hero-take-assessment",
  heroGuest: "hero-explore-guest",

  // Auth
  authEmail: "auth-email-input",
  authPassword: "auth-password-input",
  authName: "auth-name-input",
  authSubmit: "auth-submit-button",
  authError: "auth-error",
  authSwitch: "auth-switch-mode",

  // Tracks
  trackCard: (id) => `track-card-${id}`,
  trackOpen: (id) => `track-open-${id}`,
  moduleCard: (id) => `module-card-${id}`,
  lessonRow: (id) => `lesson-row-${id}`,
  lessonOpen: (id) => `lesson-open-${id}`,

  // Lesson
  lessonTitle: "lesson-title",
  lessonComplete: "lesson-complete-button",
  lessonNext: "lesson-next-button",
  lessonPrev: "lesson-prev-button",
  quizOption: (i) => `quiz-option-${i}`,
  quizSubmit: "quiz-submit-button",
  quizFeedback: "quiz-feedback",
  deepDiveToggle: "deep-dive-toggle",

  // Widgets
  pidP: "pid-p-slider",
  pidI: "pid-i-slider",
  pidD: "pid-d-slider",
  pidReset: "pid-reset-button",
  liftSpeed: "lift-speed-slider",
  liftAoa: "lift-aoa-slider",
  liftArea: "lift-area-slider",
  fusionGps: "fusion-gps-toggle",
  fusionImu: "fusion-imu-toggle",
  fusionVision: "fusion-vision-toggle",
  swarmSep: "swarm-separation-slider",
  swarmAlign: "swarm-alignment-slider",
  swarmCohesion: "swarm-cohesion-slider",
  explodedToggle: "exploded-toggle",
  explodedPart: (id) => `exploded-part-${id}`,
  rtkToggle: "rtk-toggle",
  ladderRung: (i) => `ladder-rung-${i}`,
  motorPower: "motor-power-slider",
  waypointCanvas: "waypoint-canvas",
  waypointClear: "waypoint-clear-button",

  // Dashboard
  dashXp: "dashboard-xp",
  dashStreak: "dashboard-streak",
  dashLevel: "dashboard-level",

  // Assessment
  assessStart: "assessment-start-button",
  assessNext: "assessment-next-button",
  assessSubmit: "assessment-submit-button",
  assessRetake: "assessment-retake-button",
  mrChoice: (i) => `mental-rotation-choice-${i}`,
  vigilHit: "vigilance-hit-button",
  trainTarget: "trainability-target",

  // Studio
  studioDownloadCsv: "studio-download-csv",
  studioClip: (id) => `studio-clip-${id}`,

  // Onboarding
  onboardGoal: (g) => `onboard-goal-${g}`,
  onboardContinue: "onboard-continue-button",
};
