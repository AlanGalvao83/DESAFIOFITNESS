import * as db from './db.js';

// Application State
const state = {
  isAdmin: sessionStorage.getItem('FITNESS_ADMIN') === 'true',
  challenges: [],
  selectedChallengeId: null,
  activeChallenge: null,
  participants: [],
  rankings: { 
    pushupsRanking: [], 
    runningRanking: [], 
    cyclingRanking: [], 
    stats: { totalPushups: 0, totalDistance: 0, totalCycling: 0, participantsCount: 0 } 
  },
  recentActivities: [],
  challengeActivities: [],
  activeTab: 'pushup', // 'pushup', 'running', or 'cycling'
  activeSection: 'dashboard',
  raceChartInstance: null,
  evolutionChartInstance: null,
  hasAdminCredentials: false,
  selectedParticipantId: null,
  selectedParticipantActivities: [],
  raceTimer: null,
  raceIsRunning: false,
  raceCurrentIndex: 0,
  raceDates: [],
  raceDataByDate: {},
  participantColors: {},
  participantsSearchTerm: '',
  previousSection: 'dashboard',
  profileActiveTab: 'badges',
  badgeActiveFilter: 'all',
  pushupAI: {
    poseInstance: null,
    videoStream: null,
    isPlaying: false,
    repCount: 0,
    stage: 'IDLE',
    dominantSide: 'right',
    cameraMode: 'Detectando...',
    lastAngle: 180,
    depthPercent: 0,
    animationFrameId: null,
    isProcessingFrame: false,
    cameraActive: false,
    leftTracker: { stage: 'UP', downTime: 0, smoothAngle: null, history: [] },
    rightTracker: { stage: 'UP', downTime: 0, smoothAngle: null, history: [] },
    dispTracker: { stage: 'UP', downTime: 0, smoothDisp: null },
    lastRepTimestamp: 0,
    historyTorsoDx: [],
    historyShDx: [],
    historyLVis: [],
    historyRVis: []
  }
};

// ----------------------------------------------------
// UI Elements Mapping
// ----------------------------------------------------
const el = {
  setupOverlay: () => document.getElementById('setup-overlay'),
  setupForm: () => document.getElementById('setup-form'),
  
  adminBanner: () => document.getElementById('admin-banner'),
  btnAdminTrigger: () => document.getElementById('btn-admin-trigger'),
  adminBtnText: () => document.getElementById('admin-btn-text'),
  
  challengeSelector: () => document.getElementById('challenge-selector'),
  btnResetConfig: () => document.getElementById('btn-reset-config'),
  
  challengeGoalsCard: () => document.getElementById('challenge-goals-card'),
  noChallengeCard: () => document.getElementById('no-challenge-card'),
  btnNoChallengeCreate: () => document.getElementById('btn-no-challenge-create'),
  statsSummaryGrid: () => document.getElementById('stats-summary-grid'),
  dashboardMainLayout: () => document.getElementById('dashboard-main-layout'),
  
  totalPushups: () => document.getElementById('total-pushups-value'),
  totalDistance: () => document.getElementById('total-distance-value'),
  totalCycling: () => document.getElementById('total-cycling-value'),
  activeParticipants: () => document.getElementById('active-participants-value'),
  
  // Leaders / Prize elements
  pushupLeaderName: () => document.getElementById('pushup-leader-name'),
  pushupLeaderValue: () => document.getElementById('pushup-leader-value'),
  runningLeaderName: () => document.getElementById('running-leader-name'),
  runningLeaderValue: () => document.getElementById('running-leader-value'),
  cyclingLeaderName: () => document.getElementById('cycling-leader-name'),
  cyclingLeaderValue: () => document.getElementById('cycling-leader-value'),
  topDayLeaderName: () => document.getElementById('top-day-leader-name'),
  topDayLeaderValue: () => document.getElementById('top-day-leader-value'),
  
  tabPushups: () => document.getElementById('tab-pushups'),
  tabRunning: () => document.getElementById('tab-running'),
  tabCycling: () => document.getElementById('tab-cycling'),
  leaderboardList: () => document.getElementById('leaderboard-list'),
  
  recentActivitiesList: () => document.getElementById('recent-activities-list'),
  
  // Modals & Buttons
  modalAdminLogin: () => document.getElementById('modal-admin-login'),
  btnCloseAdminLogin: () => document.getElementById('btn-close-admin-login'),
  formAdminLogin: () => document.getElementById('form-admin-login'),
  loginCredentialsGroup: () => document.getElementById('login-credentials-group'),
  setupCredentialsInfo: () => document.getElementById('setup-credentials-info'),
  btnAdminSubmit: () => document.getElementById('btn-admin-submit'),
  
  modalManageChallenges: () => document.getElementById('modal-manage-challenges'),
  btnOpenChallenge: () => document.getElementById('btn-open-challenge'),
  btnCloseChallenge: () => document.getElementById('btn-close-challenge'),
  activeChallengeAdminInfo: () => document.getElementById('active-challenge-admin-info'),
  activeChallengeAdminName: () => document.getElementById('active-challenge-admin-name'),
  activeChallengeAdminDates: () => document.getElementById('active-challenge-admin-dates'),
  btnFinishChallenge: () => document.getElementById('btn-finish-challenge'),
  formCreateChallenge: () => document.getElementById('form-create-challenge'),
  
  modalCreateParticipant: () => document.getElementById('modal-create-participant'),
  btnOpenParticipant: () => document.getElementById('btn-open-participant'),
  btnCloseParticipant: () => document.getElementById('btn-close-participant'),
  formCreateParticipant: () => document.getElementById('form-create-participant'),
  
  modalLog: () => document.getElementById('modal-log-activity'),
  btnOpenLog: () => document.getElementById('btn-open-log'),
  btnCloseLog: () => document.getElementById('btn-close-log'),
  formLog: () => document.getElementById('form-log-activity'),
  logParticipantSelect: () => document.getElementById('log-participant'),
  logValidatorSelect: () => document.getElementById('log-validator'),
  logDateInput: () => document.getElementById('log-date'),
  logTypeSelect: () => document.getElementById('log-type'),
  logPushupFields: () => document.getElementById('log-pushup-fields'),
  logRunningFields: () => document.getElementById('log-running-fields'),
  
  sectionParticipantProfile: () => document.getElementById('section-participant-profile'),
  btnBackFromProfile: () => document.getElementById('btn-back-from-profile'),
  participantDetailsNameText: () => document.getElementById('participant-details-name-text'),
  btnEditParticipantNameTrigger: () => document.getElementById('btn-edit-participant-name-trigger'),
  participantNameEditContainer: () => document.getElementById('participant-name-edit-container'),
  editParticipantNameInput: () => document.getElementById('edit-participant-name-input'),
  btnSaveParticipantName: () => document.getElementById('btn-save-participant-name'),
  btnCancelParticipantName: () => document.getElementById('btn-cancel-participant-name'),
  participantTotalActivities: () => document.getElementById('participant-total-activities'),
  participantTotalPushups: () => document.getElementById('participant-total-pushups'),
  participantTotalRunning: () => document.getElementById('participant-total-running'),
  participantTotalCycling: () => document.getElementById('participant-total-cycling'),
  participantActivitiesList: () => document.getElementById('participant-activities-list'),
  btnDetailsAddActivity: () => document.getElementById('btn-details-add-activity'),
  participantBadgesContainer: () => document.getElementById('participant-badges-container'),
  participantBadgesUnlockedCount: () => document.getElementById('participant-badges-unlocked-count'),
  btnTabBadges: () => document.getElementById('btn-tab-badges'),
  btnTabHistory: () => document.getElementById('btn-tab-history'),
  participantCardBadges: () => document.getElementById('participant-card-badges'),
  participantCardHistory: () => document.getElementById('participant-card-history'),
  
  toastContainer: () => document.getElementById('toast-container'),
  
  // Bar Chart Race elements
  btnPlayRace: () => document.getElementById('btn-play-race'),
  btnResetRace: () => document.getElementById('btn-reset-race'),
  raceCurrentDate: () => document.getElementById('race-current-date'),
  raceProgressSlider: () => document.getElementById('race-progress-slider'),
  
  // Sidebar elements
  linkDashboard: () => document.getElementById('link-dashboard'),
  linkParticipants: () => document.getElementById('link-participants'),
  linkRace: () => document.getElementById('link-race'),
  linkHistory: () => document.getElementById('link-history'),
  sectionDashboard: () => document.getElementById('section-dashboard'),
  sectionParticipants: () => document.getElementById('section-participants'),
  sectionRace: () => document.getElementById('section-race'),
  sectionHistory: () => document.getElementById('section-history'),
  btnToggleSidebar: () => document.getElementById('btn-toggle-sidebar'),
  sidebar: () => document.querySelector('.sidebar'),

  // Participants section
  participantsGrid: () => document.getElementById('participants-grid'),
  participantsSearchInput: () => document.getElementById('participants-search-input'),
  participantsCountSummary: () => document.getElementById('participants-count-summary'),

  // Dashboard Recent Achievements
  recentAchievementsCard: () => document.getElementById('recent-achievements-card'),
  recentAchievementsList: () => document.getElementById('recent-achievements-list'),
  btnDashboardViewAchievements: () => document.getElementById('btn-dashboard-view-achievements'),

  // Mobile Header Profile Elements
  mainTopBar: () => document.getElementById('main-top-bar'),
  mobileHeaderDefault: () => document.getElementById('mobile-header-default'),
  mobileHeaderProfile: () => document.getElementById('mobile-header-profile'),
  btnBackFromProfileMobile: () => document.getElementById('btn-back-from-profile-mobile'),
  mobileParticipantNameText: () => document.getElementById('mobile-participant-name-text'),

  // Push-up AI Counter Elements
  linkPushupAI: () => document.getElementById('link-pushup-ai'),
  sectionPushupAI: () => document.getElementById('section-pushup-ai'),
  pushupVideoInput: () => document.getElementById('pushup-video-input'),
  pushupVideoInputDrop: () => document.getElementById('pushup-video-input-drop'),
  pushupDropzone: () => document.getElementById('pushup-dropzone'),
  pushupWorkspace: () => document.getElementById('pushup-workspace'),
  pushupVideo: () => document.getElementById('pushup-video'),
  pushupCanvas: () => document.getElementById('pushup-canvas'),
  pushupLoadingOverlay: () => document.getElementById('pushup-loading-overlay'),
  pushupLoadingText: () => document.getElementById('pushup-loading-text'),
  repFeedbackFlash: () => document.getElementById('rep-feedback-flash'),
  btnCtrlPlay: () => document.getElementById('btn-ctrl-play'),
  iconCtrlPlay: () => document.getElementById('icon-ctrl-play'),
  btnCtrlRestart: () => document.getElementById('btn-ctrl-restart'),
  pushupTimeline: () => document.getElementById('pushup-timeline'),
  pushupTimeDisplay: () => document.getElementById('pushup-time-display'),
  btnChangeVideo: () => document.getElementById('btn-change-video'),
  btnPushupWebcam: () => document.getElementById('btn-pushup-webcam'),
  pushupRepNumber: () => document.getElementById('pushup-rep-number'),
  pushupStagePill: () => document.getElementById('pushup-stage-pill'),
  pushupFeedbackText: () => document.getElementById('pushup-feedback-text'),
  pushupDepthFill: () => document.getElementById('pushup-depth-fill'),
  pushupDepthVal: () => document.getElementById('pushup-depth-val'),
  pushupElbowAngle: () => document.getElementById('pushup-elbow-angle'),
  pushupBodyAngle: () => document.getElementById('pushup-body-angle'),
  pushupSideTracked: () => document.getElementById('pushup-side-tracked'),
  btnPushupRegister: () => document.getElementById('btn-pushup-register'),
  pushupRegisterCount: () => document.getElementById('pushup-register-count')
};

// ----------------------------------------------------
// Badge / Achievement Definitions
// ----------------------------------------------------
const BADGE_DEFINITIONS = {
  pushups: [
    { id: 'pushup_100', name: '100 Flexões', desc: 'Acumule 100 flexões no desafio', threshold: 100, image: 'imagens/FLEXÕES/100.png' },
    { id: 'pushup_250', name: '250 Flexões', desc: 'Acumule 250 flexões no desafio', threshold: 250, image: 'imagens/FLEXÕES/250.png' },
    { id: 'pushup_500', name: '500 Flexões', desc: 'Acumule 500 flexões no desafio', threshold: 500, image: 'imagens/FLEXÕES/500.png' },
    { id: 'pushup_750', name: '750 Flexões', desc: 'Acumule 750 flexões no desafio', threshold: 750, image: 'imagens/FLEXÕES/750.png' },
    { id: 'pushup_1000', name: '1.000 Flexões', desc: 'Acumule 1.000 flexões no desafio', threshold: 1000, image: 'imagens/FLEXÕES/1000.png' },
    { id: 'pushup_1500', name: '1.500 Flexões', desc: 'Acumule 1.500 flexões no desafio', threshold: 1500, image: 'imagens/FLEXÕES/1500.png' },
    { id: 'pushup_2000', name: '2.000 Flexões', desc: 'Acumule 2.000 flexões no desafio', threshold: 2000, image: 'imagens/FLEXÕES/2000.png' },
    { id: 'pushup_5000', name: '5.000 Flexões', desc: 'Acumule 5.000 flexões no desafio', threshold: 5000, image: 'imagens/FLEXÕES/5000.png' }
  ],
  running: [
    { id: 'run_single_5', name: '5km de Corrida', desc: 'Complete um treino de 5 km de corrida', threshold: 5, type: 'single', image: 'imagens/CORRIDA/5km corrida.png' },
    { id: 'run_single_10', name: '10km de Corrida', desc: 'Complete um treino de 10 km de corrida', threshold: 10, type: 'single', image: 'imagens/CORRIDA/10km corrida.png' },
    { id: 'run_single_15', name: '15km de Corrida', desc: 'Complete um treino de 15 km de corrida', threshold: 15, type: 'single', image: 'imagens/CORRIDA/15km corrida.png' },
    { id: 'run_single_21', name: '21km Meia Maratona', desc: 'Complete 21 km em um único treino', threshold: 21, type: 'single', image: 'imagens/CORRIDA/21km corrida.png' },
    { id: 'run_single_42', name: '42km Maratona', desc: 'Complete 42 km em um único treino', threshold: 42, type: 'single', image: 'imagens/CORRIDA/42km corrida.png' },
    { id: 'run_total_100', name: '100km de Corrida', desc: 'Acumule 100 km de corrida no desafio', threshold: 100, type: 'total', image: 'imagens/CORRIDA/100km corrida.png' },
    { id: 'run_total_200', name: '200km de Corrida', desc: 'Acumule 200 km de corrida no desafio', threshold: 200, type: 'total', image: 'imagens/CORRIDA/200km corrida.png' },
    { id: 'run_total_500', name: '500km de Corrida', desc: 'Acumule 500 km de corrida no desafio', threshold: 500, type: 'total', image: 'imagens/CORRIDA/500km corrida.png' },
    { id: 'run_total_1000', name: '1.000km de Corrida', desc: 'Acumule 1.000 km de corrida no desafio', threshold: 1000, type: 'total', image: 'imagens/CORRIDA/1000km corrida.png' }
  ],
  cycling: [
    { id: 'bike_single_10', name: '10km de Bike', desc: 'Complete um pedal de 10 km', threshold: 10, type: 'single', image: 'imagens/BIKE/10km bike.png' },
    { id: 'bike_single_25', name: '25km de Bike', desc: 'Complete um pedal de 25 km', threshold: 25, type: 'single', image: 'imagens/BIKE/25km bike.png' },
    { id: 'bike_single_50', name: '50km de Bike', desc: 'Complete um pedal de 50 km', threshold: 50, type: 'single', image: 'imagens/BIKE/50km bike.png' },
    { id: 'bike_single_100', name: '100km de Bike', desc: 'Complete um pedal de 100 km (Centúria)', threshold: 100, type: 'single', image: 'imagens/BIKE/100km bike.png' },
    { id: 'bike_total_200', name: '200km de Bike', desc: 'Acumule 200 km de bike no desafio', threshold: 200, type: 'total', image: 'imagens/BIKE/200km bike.png' },
    { id: 'bike_total_500', name: '500km de Bike', desc: 'Acumule 500 km de bike no desafio', threshold: 500, type: 'total', image: 'imagens/BIKE/500km bike.png' },
    { id: 'bike_total_750', name: '750km de Bike', desc: 'Acumule 750 km de bike no desafio', threshold: 750, type: 'total', image: 'imagens/BIKE/750km bike.png' },
    { id: 'bike_total_1000', name: '1.000km de Bike', desc: 'Acumule 1.000 km de bike no desafio', threshold: 1000, type: 'total', image: 'imagens/BIKE/1000km bike.png' }
  ],
  dailyAndCombos: [
    { id: 'daily_max_pushups', name: 'Mais Flexões do Dia', desc: 'Líder diário de flexões no desafio', image: 'imagens/DIARIOS/mais flexao.png' },
    { id: 'daily_min_pushups', name: 'Menos Flexões do Dia', desc: 'Menor marca diária positiva (> 0)', image: 'imagens/DIARIOS/menos flexao.png' },
    { id: 'daily_max_running', name: 'Mais KM Corrida do Dia', desc: 'Líder diário de distância de corrida', image: 'imagens/CORRIDA/mais km corrida.png' },
    { id: 'daily_max_cycling', name: 'Mais KM Bike do Dia', desc: 'Líder diário de distância de bike', image: 'imagens/BIKE/mais km bike.png' },
    { id: 'combo_pushup_bike', name: 'Flexão & Bike', desc: 'Flexão e bike no mesmo dia', image: 'imagens/DIARIOS/flexão e bike.png' },
    { id: 'combo_pushup_run', name: 'Flexão & Corrida', desc: 'Flexão e corrida no mesmo dia', image: 'imagens/DIARIOS/flexão e corrida.png' },
    { id: 'combo_run_bike', name: 'Corrida & Bike', desc: 'Corrida e bike no mesmo dia', image: 'imagens/DIARIOS/corrida e bike.png' },
    { id: 'combo_triatlo', name: 'Super Combo', desc: 'Flexão, corrida e bike no mesmo dia', image: 'imagens/DIARIOS/flexao, bike e corrida.png' }
  ]
};

// ----------------------------------------------------
// Toast Notification
// ----------------------------------------------------
function showToast(message, type = 'success') {
  const container = el.toastContainer();
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconClass = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${iconClass}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------------------------------------------
// Helper formatters
// ----------------------------------------------------
function formatPace(pace) {
  if (!pace) return '-';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
}

function formatDuration(seconds) {
  if (!seconds) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
}

function getLocalDateStr(date = new Date()) {
  const d = (typeof date === 'string') ? new Date(date) : date;
  return d.toLocaleDateString('en-CA');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const date = new Date(clean + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function formatActivityTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'agora mesmo';
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `há ${interval} ano${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `há ${interval} mê${interval > 1 ? 'ses' : 's'}`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `há ${interval} dia${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `há ${interval} hora${interval > 1 ? 's' : ''}`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `há ${interval} minuto${interval > 1 ? 's' : ''}`;
  
  return 'agora mesmo';
}

// ----------------------------------------------------
// Modals Control
// ----------------------------------------------------
function toggleModal(modal, show) {
  if (!modal) return;
  if (show) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

// ----------------------------------------------------
// Admin Mode Management
// ----------------------------------------------------
function updateAdminUI() {
  if (state.isAdmin) {
    document.body.classList.add('admin-active');
    el.adminBtnText().textContent = 'Sair do Admin';
  } else {
    document.body.classList.remove('admin-active');
    el.adminBtnText().textContent = 'Área do Admin';
  }
  lucide.createIcons();
}

async function checkAdminCredentialsStatus() {
  if (!db.isConfigured()) return;
  try {
    state.hasAdminCredentials = await db.hasAdminCredentials();
    if (!state.hasAdminCredentials) {
      // First run: set up credentials (username & password)
      el.loginCredentialsGroup().style.display = 'none';
      el.setupCredentialsInfo().style.display = 'block';
      document.getElementById('admin-setup-username').setAttribute('required', 'true');
      document.getElementById('admin-setup-password').setAttribute('required', 'true');
      document.getElementById('admin-setup-password-confirm').setAttribute('required', 'true');
      document.getElementById('admin-username').removeAttribute('required');
      document.getElementById('admin-password').removeAttribute('required');
      el.btnAdminSubmit().textContent = 'Cadastrar Admin e Acessar';
    } else {
      // Regular login
      el.loginCredentialsGroup().style.display = 'block';
      el.setupCredentialsInfo().style.display = 'none';
      document.getElementById('admin-setup-username').removeAttribute('required');
      document.getElementById('admin-setup-password').removeAttribute('required');
      document.getElementById('admin-setup-password-confirm').removeAttribute('required');
      document.getElementById('admin-username').setAttribute('required', 'true');
      document.getElementById('admin-password').setAttribute('required', 'true');
      el.btnAdminSubmit().textContent = 'Entrar';
    }
  } catch (e) {
    console.error('Error checking admin configuration:', e);
  }
}

// ----------------------------------------------------
// Core Data Fetch & Render
// ----------------------------------------------------

async function refreshData(forceReloadChallenges = false) {
  if (!db.isConfigured()) return;
  
  try {
    // 1. Fetch Challenges if empty or forced
    if (state.challenges.length === 0 || forceReloadChallenges) {
      state.challenges = await db.getChallenges();
      state.activeChallenge = state.challenges.find(c => c.status === 'active') || null;
      
      // Populate challenge selector dropdown
      populateChallengeSelector();
      
      // Auto select active challenge, or the most recent challenge
      if (state.activeChallenge) {
        state.selectedChallengeId = state.activeChallenge.id;
      } else if (state.challenges.length > 0) {
        state.selectedChallengeId = state.challenges[0].id;
      } else {
        state.selectedChallengeId = null;
      }
      
      if (state.selectedChallengeId) {
        el.challengeSelector().value = state.selectedChallengeId;
      }
    }
    
    // 2. Handle state when no challenges exist
    if (!state.selectedChallengeId) {
      el.challengeGoalsCard().style.display = 'none';
      el.statsSummaryGrid().style.display = 'none';
      el.dashboardMainLayout().style.display = 'none';
      el.noChallengeCard().style.display = 'block';
      return;
    }
    
    // Show components
    el.challengeGoalsCard().style.display = 'block';
    el.statsSummaryGrid().style.display = 'grid';
    el.dashboardMainLayout().style.display = 'grid';
    el.noChallengeCard().style.display = 'none';
    
    const currentChallenge = state.challenges.find(c => c.id === state.selectedChallengeId);
    
    // 3. Fetch participants
    state.participants = await db.getParticipants();
    populateFormSelectors();
    
    // 4. Fetch rankings & recent activities for selected challenge
    state.rankings = await db.getRankings(state.selectedChallengeId);
    state.recentActivities = await db.getRecentActivities(state.selectedChallengeId);
    state.challengeActivities = await db.getRecentActivities(state.selectedChallengeId, 5000);
    
    // 5. Update overall metrics
    const stats = state.rankings.stats;
    el.totalPushups().textContent = stats.totalPushups.toLocaleString('pt-BR');
    el.totalDistance().textContent = `${stats.totalDistance.toLocaleString('pt-BR')} km`;
    el.totalCycling().textContent = `${stats.totalCycling.toLocaleString('pt-BR')} km`;
    el.activeParticipants().textContent = stats.participantsCount;
    
    // 6. Calculate & Render Leaders (Prizes Highlight)
    renderLeadersPodium();
    
    // Update dates and countdown
    updateChallengeDatesCountdown(currentChallenge);
    
    // 7. Render dynamic lists & charts
    renderLeaderboard();
    renderRecentActivities();
    renderRecentAchievements();
    if (state.activeSection === 'race') {
      await initRaceControls(currentChallenge);
      renderCharts(currentChallenge);
    } else if (state.activeSection === 'history') {
      renderEvolutionChart(currentChallenge);
    } else if (state.activeSection === 'participants') {
      renderParticipantsSection();
    }
    
    // If participant profile page is active, refresh their badges & activities
    if (state.selectedParticipantId && state.activeSection === 'participant-profile') {
      const pActivities = await db.getParticipantActivities(state.selectedParticipantId, state.selectedChallengeId);
      state.selectedParticipantActivities = pActivities;
      renderParticipantActivities();
    }
    
    // Update admin challenge management modal values
    updateChallengeModalAdminPanel();
    
    lucide.createIcons();
  } catch (error) {
    console.error('Error refreshing data:', error);
    showToast('Erro ao atualizar dados do painel.', 'error');
  }
}

// Calculate leaders for pushups, running, and cycling, and render the podium
function renderLeadersPodium() {
  const pushupsRanking = state.rankings.pushupsRanking;
  const runningRanking = state.rankings.runningRanking;
  const cyclingRanking = state.rankings.cyclingRanking || [];
  
  // 1. Find pushups leader(s)
  let maxPushups = 0;
  let pushupLeaders = [];
  
  pushupsRanking.forEach(user => {
    if (user.pushups > 0) {
      if (user.pushups > maxPushups) {
        maxPushups = user.pushups;
        pushupLeaders = [user.name];
      } else if (user.pushups === maxPushups) {
        pushupLeaders.push(user.name);
      }
    }
  });
  
  if (pushupLeaders.length > 0) {
    el.pushupLeaderName().textContent = pushupLeaders.join(', ');
    el.pushupLeaderValue().innerHTML = `Total: <strong>${maxPushups.toLocaleString('pt-BR')}</strong> reps`;
  } else {
    el.pushupLeaderName().textContent = 'Ninguém ainda';
    el.pushupLeaderValue().innerHTML = `Total: <strong>0</strong> reps`;
  }
  
  // 2. Find running leader(s)
  let maxDistance = 0;
  let runningLeaders = [];
  
  runningRanking.forEach(user => {
    if (user.runningDistance > 0) {
      if (user.runningDistance > maxDistance) {
        maxDistance = user.runningDistance;
        runningLeaders = [user.name];
      } else if (user.runningDistance === maxDistance) {
        runningLeaders.push(user.name);
      }
    }
  });
  
  if (runningLeaders.length > 0) {
    el.runningLeaderName().textContent = runningLeaders.join(', ');
    el.runningLeaderValue().innerHTML = `Total: <strong>${maxDistance.toFixed(1).toLocaleString('pt-BR')}</strong> km`;
  } else {
    el.runningLeaderName().textContent = 'Ninguém ainda';
    el.runningLeaderValue().innerHTML = `Total: <strong>0</strong> km`;
  }

  // 3. Find cycling leader(s)
  let maxCyclingDistance = 0;
  let cyclingLeaders = [];
  
  cyclingRanking.forEach(user => {
    if (user.cyclingDistance > 0) {
      if (user.cyclingDistance > maxCyclingDistance) {
        maxCyclingDistance = user.cyclingDistance;
        cyclingLeaders = [user.name];
      } else if (user.cyclingDistance === maxCyclingDistance) {
        cyclingLeaders.push(user.name);
      }
    }
  });
  
  if (cyclingLeaders.length > 0) {
    el.cyclingLeaderName().textContent = cyclingLeaders.join(', ');
    el.cyclingLeaderValue().innerHTML = `Total: <strong>${maxCyclingDistance.toFixed(1).toLocaleString('pt-BR')}</strong> km`;
  } else {
    el.cyclingLeaderName().textContent = 'Ninguém ainda';
    el.cyclingLeaderValue().innerHTML = `Total: <strong>0</strong> km`;
  }

  // 4. Calculate TOP OF THE DAY (Relative Effort points for TODAY)
  const todayStr = getLocalDateStr();
  const dailyPointsMap = {};
  
  state.participants.forEach(p => {
    dailyPointsMap[p.id] = {
      name: p.name,
      points: 0
    };
  });
  
  state.recentActivities.forEach(act => {
    if (act.date === todayStr) {
      const userEffort = dailyPointsMap[act.participant_id];
      if (!userEffort) return;
      
      let points = 0;
      if (act.type === 'pushup') {
        points = act.amount;
      } else if (act.type === 'running') {
        points = act.amount * 100;
      } else if (act.type === 'cycling') {
        points = act.amount * 25;
      }
      userEffort.points += points;
    }
  });
  
  let maxPoints = 0;
  let topDayLeaders = [];
  
  Object.values(dailyPointsMap).forEach(user => {
    if (user.points > 0) {
      if (user.points > maxPoints) {
        maxPoints = user.points;
        topDayLeaders = [user.name];
      } else if (user.points === maxPoints) {
        topDayLeaders.push(user.name);
      }
    }
  });
  
  if (topDayLeaders.length > 0) {
    el.topDayLeaderName().textContent = topDayLeaders.join(', ');
    el.topDayLeaderValue().innerHTML = `Total: <strong>${maxPoints.toLocaleString('pt-BR')}</strong> pts`;
  } else {
    el.topDayLeaderName().textContent = 'Ninguém ainda';
    el.topDayLeaderValue().innerHTML = `Total: <strong>0</strong> pts`;
  }
}

// Calculate challenge start/end dates and remaining days countdown
function updateChallengeDatesCountdown(challenge) {
  const container = document.getElementById('challenge-dates-countdown');
  if (!container) return;
  
  if (!challenge) {
    container.innerHTML = '';
    return;
  }
  
  const start = formatDate(challenge.start_date);
  const end = formatDate(challenge.end_date);
  
  let countdownText = '';
  if (challenge.status === 'active') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(challenge.end_date + 'T23:59:59');
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysRemaining > 1) {
      countdownText = ` • <span style="color: var(--accent-cyan); font-weight: 700;">${daysRemaining} dias restantes</span>`;
    } else if (daysRemaining === 1) {
      countdownText = ` • <span style="color: var(--accent-amber); font-weight: 700;">Último dia!</span>`;
    } else if (daysRemaining === 0) {
      countdownText = ` • <span style="color: var(--accent-rose); font-weight: 700;">Termina hoje!</span>`;
    } else {
      countdownText = ` • <span style="color: var(--text-muted);">Encerrado</span>`;
    }
  } else {
    countdownText = ` • <span style="color: var(--text-muted);">Encerrado</span>`;
  }
  
  container.innerHTML = `
    <i data-lucide="clock" style="width: 14px; height: 14px; color: var(--text-secondary); margin-right: 0.25rem;"></i>
    <span>Duração: <strong>${start}</strong> até <strong>${end}</strong>${countdownText}</span>
  `;
}

// Populate the challenge filter selector dropdown
function populateChallengeSelector() {
  const select = el.challengeSelector();
  select.innerHTML = '';
  
  if (state.challenges.length === 0) {
    select.innerHTML = '<option value="">Nenhum Desafio</option>';
    return;
  }
  
  state.challenges.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    const statusText = c.status === 'active' ? '🟢 Ativo' : '🔴 Encerrado';
    opt.textContent = `${c.name} (${statusText})`;
    select.appendChild(opt);
  });
}

// Populate select elements in forms
function populateFormSelectors() {
  const pSelect = el.logParticipantSelect();
  pSelect.innerHTML = '<option value="" disabled selected>Quem treinou?</option>';
  
  const valSelect = el.logValidatorSelect();
  valSelect.innerHTML = '<option value="" selected>Sem testemunha</option>';
  
  state.participants.forEach(p => {
    // Participant dropdown
    const opt1 = document.createElement('option');
    opt1.value = p.id;
    opt1.textContent = p.name;
    pSelect.appendChild(opt1);
    
    // Witness dropdown
    const opt2 = document.createElement('option');
    opt2.value = p.id;
    opt2.textContent = p.name;
    valSelect.appendChild(opt2);
  });
}

function updateChallengeModalAdminPanel() {
  const panel = el.activeChallengeAdminInfo();
  if (state.activeChallenge) {
    panel.style.display = 'flex';
    el.activeChallengeAdminName().textContent = `Desafio Ativo: ${state.activeChallenge.name}`;
    el.activeChallengeAdminDates().textContent = `Período: ${formatDate(state.activeChallenge.start_date)} até ${formatDate(state.activeChallenge.end_date)}`;
  } else {
    panel.style.display = 'none';
  }
}

// Render Leaderboard list
function renderLeaderboard() {
  const listContainer = el.leaderboardList();
  listContainer.innerHTML = '';
  
  let list = [];
  if (state.activeTab === 'pushup') {
    list = state.rankings.pushupsRanking;
  } else if (state.activeTab === 'running') {
    list = state.rankings.runningRanking;
  } else if (state.activeTab === 'cycling') {
    list = state.rankings.cyclingRanking || [];
  }
  
  if (list.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="award"></i>
        <p>Nenhum participante com marca registrada ainda.</p>
      </div>
    `;
    return;
  }
  
  list.forEach((item, index) => {
    let value = 0;
    let subtext = '';
    let unit = '';
    
    if (state.activeTab === 'pushup') {
      value = item.pushups;
      unit = 'flexões';
      if (item.pushups > 0) {
        subtext = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
          Treino de força
        </div>`;
      }
    } else if (state.activeTab === 'running') {
      value = item.runningDistance;
      unit = 'km';
      if (item.runningDistance > 0) {
        subtext = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
          Melhor Pace: ${formatPace(item.bestPace)} • ${item.runCount} corrida${item.runCount > 1 ? 's' : ''}
        </div>`;
      }
    } else if (state.activeTab === 'cycling') {
      value = item.cyclingDistance;
      unit = 'km';
      if (item.cyclingDistance > 0) {
        subtext = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
          Melhor Vel.: ${item.bestSpeed.toFixed(1)} km/h • ${item.cyclingCount} pedalada${item.cyclingCount > 1 ? 's' : ''}
        </div>`;
      }
    }
    
    // Badges row below athlete name
    const ach = calculateParticipantAchievements(item.id, state.challengeActivities);
    let badgesHTML = '';
    if (ach && ach.unlockedBadges && ach.unlockedBadges.length > 0) {
      badgesHTML = `
        <div class="rank-badges-row">
          ${ach.unlockedBadges.map(b => `
            <img class="rank-badge-item" src="${encodeURI(b.image)}" alt="${b.name}" title="${b.name}: ${b.desc} (${b.progressText})">
          `).join('')}
        </div>
      `;
    }

    const rankEl = document.createElement('div');
    rankEl.className = 'leaderboard-item';
    rankEl.innerHTML = `
      <div class="leaderboard-item-main">
        <div class="rank-number">${index + 1}</div>
        <div class="rank-name">
          <div class="rank-athlete-name">${item.name}</div>
          ${subtext}
        </div>
        <div class="rank-score">
          ${state.activeTab === 'pushup' ? value.toLocaleString('pt-BR') : value.toFixed(1).toLocaleString('pt-BR')}
          <span class="rank-unit">${unit}</span>
        </div>
      </div>
      ${badgesHTML}
    `;
    
    rankEl.addEventListener('click', () => {
      openParticipantDetails(item.id);
    });
    
    listContainer.appendChild(rankEl);
  });
}

// ----------------------------------------------------
// Achievements / Badges Engine
// ----------------------------------------------------
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function calculateParticipantAchievements(participantId, activities = []) {
  const pActivities = activities.filter(a => a.participant_id === participantId && a.status === 'approved');
  
  // 1. Total por modalidade do participante e recordes em treino único
  let totalPushups = 0;
  let totalRunning = 0;
  let totalCycling = 0;
  let maxSingleRunning = 0;
  let maxSingleCycling = 0;

  pActivities.forEach(a => {
    const val = parseFloat(a.amount) || 0;
    if (a.type === 'pushup') {
      totalPushups += val;
    } else if (a.type === 'running') {
      totalRunning += val;
      if (val > maxSingleRunning) maxSingleRunning = val;
    } else if (a.type === 'cycling') {
      totalCycling += val;
      if (val > maxSingleCycling) maxSingleCycling = val;
    }
  });

  // 2. Mapas diários de todos os participantes no desafio
  const dailyPushupsMap = {}; // date -> { [pid]: amount }
  const dailyRunningMap = {}; // date -> { [pid]: amount }
  const dailyCyclingMap = {}; // date -> { [pid]: amount }
  const pDailyTypes = {}; // date -> Set of types

  activities.forEach(a => {
    if (a.status !== 'approved') return;
    const d = a.date;
    const pid = a.participant_id;
    const val = parseFloat(a.amount) || 0;

    if (!dailyPushupsMap[d]) dailyPushupsMap[d] = {};
    if (!dailyPushupsMap[d][pid]) dailyPushupsMap[d][pid] = 0;
    if (!dailyRunningMap[d]) dailyRunningMap[d] = {};
    if (!dailyRunningMap[d][pid]) dailyRunningMap[d][pid] = 0;
    if (!dailyCyclingMap[d]) dailyCyclingMap[d] = {};
    if (!dailyCyclingMap[d][pid]) dailyCyclingMap[d][pid] = 0;

    if (a.type === 'pushup') dailyPushupsMap[d][pid] += val;
    else if (a.type === 'running') dailyRunningMap[d][pid] += val;
    else if (a.type === 'cycling') dailyCyclingMap[d][pid] += val;

    if (pid === participantId) {
      if (!pDailyTypes[d]) pDailyTypes[d] = new Set();
      pDailyTypes[d].add(a.type);
    }
  });

  // 3. Contagem de líderes do dia (flexões, corrida e bike)
  let maxPushupsDaysCount = 0;
  let minPushupsDaysCount = 0;
  let maxRunningDaysCount = 0;
  let maxCyclingDaysCount = 0;

  // Mais e menos flexões do dia
  Object.keys(dailyPushupsMap).forEach(d => {
    const dayData = dailyPushupsMap[d];
    const participantsWithPushups = Object.entries(dayData).filter(([_, amount]) => amount > 0);
    if (participantsWithPushups.length === 0) return;

    let maxVal = 0;
    participantsWithPushups.forEach(([_, amount]) => {
      if (amount > maxVal) maxVal = amount;
    });
    if (dayData[participantId] && dayData[participantId] === maxVal && maxVal > 0) {
      maxPushupsDaysCount++;
    }

    if (participantsWithPushups.length >= 2) {
      let minVal = Infinity;
      participantsWithPushups.forEach(([_, amount]) => {
        if (amount < minVal) minVal = amount;
      });
      if (dayData[participantId] && dayData[participantId] === minVal && minVal > 0) {
        minPushupsDaysCount++;
      }
    }
  });

  // Mais km de corrida do dia
  Object.keys(dailyRunningMap).forEach(d => {
    const dayData = dailyRunningMap[d];
    const participantsWithRun = Object.entries(dayData).filter(([_, amount]) => amount > 0);
    if (participantsWithRun.length === 0) return;

    let maxVal = 0;
    participantsWithRun.forEach(([_, amount]) => {
      if (amount > maxVal) maxVal = amount;
    });
    if (dayData[participantId] && dayData[participantId] === maxVal && maxVal > 0) {
      maxRunningDaysCount++;
    }
  });

  // Mais km de bike do dia
  Object.keys(dailyCyclingMap).forEach(d => {
    const dayData = dailyCyclingMap[d];
    const participantsWithBike = Object.entries(dayData).filter(([_, amount]) => amount > 0);
    if (participantsWithBike.length === 0) return;

    let maxVal = 0;
    participantsWithBike.forEach(([_, amount]) => {
      if (amount > maxVal) maxVal = amount;
    });
    if (dayData[participantId] && dayData[participantId] === maxVal && maxVal > 0) {
      maxCyclingDaysCount++;
    }
  });

  // 4. Combos diários do participante
  let pushupBikeCount = 0;
  let pushupRunCount = 0;
  let runBikeCount = 0;
  let triathlonCount = 0;

  Object.values(pDailyTypes).forEach(typeSet => {
    const hasPushup = typeSet.has('pushup');
    const hasRunning = typeSet.has('running');
    const hasCycling = typeSet.has('cycling');

    if (hasPushup && hasCycling) pushupBikeCount++;
    if (hasPushup && hasRunning) pushupRunCount++;
    if (hasRunning && hasCycling) runBikeCount++;
    if (hasPushup && hasRunning && hasCycling) triathlonCount++;
  });

  // 5. Badges de Marcos de Flexão
  const pushupBadges = BADGE_DEFINITIONS.pushups.map(b => {
    const isUnlocked = totalPushups >= b.threshold;
    return {
      id: b.id,
      name: b.name,
      desc: b.desc,
      image: b.image,
      category: 'flexao',
      unlocked: isUnlocked,
      count: isUnlocked ? 1 : 0,
      current: totalPushups,
      threshold: b.threshold,
      progressText: isUnlocked ? 'Alcançado!' : `${totalPushups.toLocaleString('pt-BR')} / ${b.threshold.toLocaleString('pt-BR')}`
    };
  });

  // 6. Badges de Marcos de Corrida (Treinos Únicos & Acumulado)
  const runningBadges = BADGE_DEFINITIONS.running.map(b => {
    const isSingle = b.type === 'single';
    const isUnlocked = isSingle ? (maxSingleRunning >= b.threshold) : (totalRunning >= b.threshold);
    const progressText = isUnlocked 
      ? 'Alcançado!' 
      : (isSingle 
          ? `Maior: ${maxSingleRunning.toFixed(1)} / ${b.threshold} km` 
          : `${totalRunning.toFixed(1)} / ${b.threshold} km`);
    return {
      id: b.id,
      name: b.name,
      desc: b.desc,
      image: b.image,
      category: 'corrida',
      unlocked: isUnlocked,
      count: isUnlocked ? 1 : 0,
      current: isSingle ? maxSingleRunning : totalRunning,
      threshold: b.threshold,
      progressText
    };
  });

  // 7. Badges de Marcos de Bike (Treinos Únicos & Acumulado)
  const cyclingBadges = BADGE_DEFINITIONS.cycling.map(b => {
    const isSingle = b.type === 'single';
    const isUnlocked = isSingle ? (maxSingleCycling >= b.threshold) : (totalCycling >= b.threshold);
    const progressText = isUnlocked 
      ? 'Alcançado!' 
      : (isSingle 
          ? `Maior: ${maxSingleCycling.toFixed(1)} / ${b.threshold} km` 
          : `${totalCycling.toFixed(1)} / ${b.threshold} km`);
    return {
      id: b.id,
      name: b.name,
      desc: b.desc,
      image: b.image,
      category: 'bike',
      unlocked: isUnlocked,
      count: isUnlocked ? 1 : 0,
      current: isSingle ? maxSingleCycling : totalCycling,
      threshold: b.threshold,
      progressText
    };
  });

  // 8. Badges Diárias e Combos
  const dailyBadges = [
    {
      id: 'daily_max_pushups',
      name: 'Mais Flexões do Dia',
      desc: 'Líder de flexões em um dia',
      image: 'imagens/DIARIOS/mais flexao.png',
      category: 'diario',
      unlocked: maxPushupsDaysCount > 0,
      count: maxPushupsDaysCount,
      progressText: maxPushupsDaysCount > 0 ? `${maxPushupsDaysCount}x no desafio` : 'Não conquistado'
    },
    {
      id: 'daily_min_pushups',
      name: 'Menos Flexões do Dia',
      desc: 'Menor marca diária (> 0)',
      image: 'imagens/DIARIOS/menos flexao.png',
      category: 'diario',
      unlocked: minPushupsDaysCount > 0,
      count: minPushupsDaysCount,
      progressText: minPushupsDaysCount > 0 ? `${minPushupsDaysCount}x no desafio` : 'Não conquistado'
    },
    {
      id: 'daily_max_running',
      name: 'Mais KM Corrida do Dia',
      desc: 'Líder diário de distância de corrida',
      image: 'imagens/CORRIDA/mais km corrida.png',
      category: 'diario',
      unlocked: maxRunningDaysCount > 0,
      count: maxRunningDaysCount,
      progressText: maxRunningDaysCount > 0 ? `${maxRunningDaysCount}x no desafio` : 'Não conquistado'
    },
    {
      id: 'daily_max_cycling',
      name: 'Mais KM Bike do Dia',
      desc: 'Líder diário de distância de bike',
      image: 'imagens/BIKE/mais km bike.png',
      category: 'diario',
      unlocked: maxCyclingDaysCount > 0,
      count: maxCyclingDaysCount,
      progressText: maxCyclingDaysCount > 0 ? `${maxCyclingDaysCount}x no desafio` : 'Não conquistado'
    },
    {
      id: 'combo_pushup_bike',
      name: 'Flexão & Bike',
      desc: 'Flexão e bike no mesmo dia',
      image: 'imagens/DIARIOS/flexão e bike.png',
      category: 'combo',
      unlocked: pushupBikeCount > 0,
      count: pushupBikeCount,
      progressText: pushupBikeCount > 0 ? `${pushupBikeCount}x realizado` : 'Não conquistado'
    },
    {
      id: 'combo_pushup_run',
      name: 'Flexão & Corrida',
      desc: 'Flexão e corrida no mesmo dia',
      image: 'imagens/DIARIOS/flexão e corrida.png',
      category: 'combo',
      unlocked: pushupRunCount > 0,
      count: pushupRunCount,
      progressText: pushupRunCount > 0 ? `${pushupRunCount}x realizado` : 'Não conquistado'
    },
    {
      id: 'combo_run_bike',
      name: 'Corrida & Bike',
      desc: 'Corrida e bike no mesmo dia',
      image: 'imagens/DIARIOS/corrida e bike.png',
      category: 'combo',
      unlocked: runBikeCount > 0,
      count: runBikeCount,
      progressText: runBikeCount > 0 ? `${runBikeCount}x realizado` : 'Não conquistado'
    },
    {
      id: 'combo_triatlo',
      name: 'Super Combo',
      desc: 'Flexão, corrida e bike no mesmo dia',
      image: 'imagens/DIARIOS/flexao, bike e corrida.png',
      category: 'combo',
      unlocked: triathlonCount > 0,
      count: triathlonCount,
      progressText: triathlonCount > 0 ? `${triathlonCount}x realizado` : 'Não conquistado'
    }
  ];

  const allBadges = [...pushupBadges, ...runningBadges, ...cyclingBadges, ...dailyBadges];
  const unlockedBadges = allBadges.filter(b => b.unlocked);

  return {
    totalPushups,
    totalRunning,
    totalCycling,
    maxSingleRunning,
    maxSingleCycling,
    totalActivities: pActivities.length,
    allBadges,
    unlockedBadges,
    unlockedCount: unlockedBadges.length,
    totalBadgesCount: allBadges.length
  };
}

// Render badges wall in modal / profile
function renderParticipantBadges(participantId) {
  const container = el.participantBadgesContainer();
  if (!container) return;
  container.innerHTML = '';

  const ach = calculateParticipantAchievements(participantId, state.challengeActivities);

  if (el.participantBadgesUnlockedCount()) {
    el.participantBadgesUnlockedCount().textContent = `${ach.unlockedCount} de ${ach.totalBadgesCount} desbloqueadas`;
  }

  // Atualizar contadores das abas de filtro
  const countAll = ach.allBadges.length;
  const countCorrida = ach.allBadges.filter(b => b.category === 'corrida').length;
  const countBike = ach.allBadges.filter(b => b.category === 'bike').length;
  const countFlexao = ach.allBadges.filter(b => b.category === 'flexao').length;
  const countDiario = ach.allBadges.filter(b => b.category === 'diario' || b.category === 'combo').length;

  const elCountAll = document.getElementById('count-filter-all');
  if (elCountAll) elCountAll.textContent = countAll;
  const elCountCorrida = document.getElementById('count-filter-corrida');
  if (elCountCorrida) elCountCorrida.textContent = countCorrida;
  const elCountBike = document.getElementById('count-filter-bike');
  if (elCountBike) elCountBike.textContent = countBike;
  const elCountFlexao = document.getElementById('count-filter-flexao');
  if (elCountFlexao) elCountFlexao.textContent = countFlexao;
  const elCountDiario = document.getElementById('count-filter-diario');
  if (elCountDiario) elCountDiario.textContent = countDiario;

  // Filtrar lista conforme categoria selecionada
  const activeFilter = state.badgeActiveFilter || 'all';
  let filteredBadges = ach.allBadges;
  if (activeFilter === 'corrida') {
    filteredBadges = ach.allBadges.filter(b => b.category === 'corrida');
  } else if (activeFilter === 'bike') {
    filteredBadges = ach.allBadges.filter(b => b.category === 'bike');
  } else if (activeFilter === 'flexao') {
    filteredBadges = ach.allBadges.filter(b => b.category === 'flexao');
  } else if (activeFilter === 'diario-combo') {
    filteredBadges = ach.allBadges.filter(b => b.category === 'diario' || b.category === 'combo');
  }

  // Atualizar estado visual ativo dos botões de filtro
  document.querySelectorAll('.badge-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === activeFilter);
  });

  filteredBadges.forEach(b => {
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge-item ${b.unlocked ? 'unlocked' : 'locked'}`;

    const repeatBadge = (b.count > 1) 
      ? `<span class="badge-repeat-counter" title="Conquistado ${b.count} vezes">x${b.count}</span>` 
      : '';

    badgeEl.innerHTML = `
      <div class="badge-img-wrapper">
        <img class="badge-img" src="${encodeURI(b.image)}" alt="${b.name}">
        ${repeatBadge}
      </div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      <div class="badge-status-tag ${b.unlocked ? 'unlocked' : 'locked'}">
        ${b.unlocked ? (b.count > 1 ? `${b.count}x Conquistado` : 'Conquistado') : b.progressText}
      </div>
    `;

    container.appendChild(badgeEl);
  });
}

// Render Participants Section (cards grid & filter)
function renderParticipantsSection() {
  const container = el.participantsGrid();
  if (!container) return;
  container.innerHTML = '';

  const challenge = state.challenges.find(c => c.id === state.selectedChallengeId);
  if (!challenge || state.participants.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i data-lucide="users"></i>
        <p>Nenhum participante cadastrado ou desafio selecionado.</p>
      </div>
    `;
    lucide.createIcons();
    if (el.participantsCountSummary()) {
      el.participantsCountSummary().textContent = '0 participantes cadastrados';
    }
    return;
  }

  let list = [...state.participants];
  if (state.participantsSearchTerm) {
    list = list.filter(p => p.name.toLowerCase().includes(state.participantsSearchTerm));
  }

  if (el.participantsCountSummary()) {
    const totalCount = state.participants.length;
    const filterText = state.participantsSearchTerm ? ` (filtrando ${list.length} de ${totalCount})` : '';
    el.participantsCountSummary().textContent = `${totalCount} atleta${totalCount > 1 ? 's' : ''} participando${filterText}`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 2.5rem;">
        <i data-lucide="search-x"></i>
        <p>Nenhum participante encontrado com o termo "<strong>${escapeHtml(state.participantsSearchTerm)}</strong>".</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Calcular dados de cada participante
  const participantsWithBadges = list.map(p => {
    const ach = calculateParticipantAchievements(p.id, state.challengeActivities);
    return { participant: p, ach };
  });

  // Ordenar por quantidade de conquistas desbloqueadas (decrescente), depois por flexões
  participantsWithBadges.sort((a, b) => {
    if (b.ach.unlockedCount !== a.ach.unlockedCount) {
      return b.ach.unlockedCount - a.ach.unlockedCount;
    }
    return b.ach.totalPushups - a.ach.totalPushups;
  });

  participantsWithBadges.forEach(({ participant, ach }) => {
    const card = document.createElement('div');
    card.className = 'participant-card';
    card.setAttribute('data-id', participant.id);

    let miniBadgesHTML = '';
    if (ach.unlockedBadges.length > 0) {
      miniBadgesHTML = ach.unlockedBadges.map(b => `
        <img class="mini-badge-icon" src="${encodeURI(b.image)}" alt="${b.name}" title="${b.name}: ${b.desc} (${b.progressText})">
      `).join('');
    } else {
      miniBadgesHTML = '<span class="mini-badges-empty">Nenhuma conquista ainda</span>';
    }

    const initial = participant.name ? participant.name.trim().charAt(0).toUpperCase() : '?';

    card.innerHTML = `
      <div class="participant-card-header">
        <div class="participant-card-avatar">${initial}</div>
        <div class="participant-card-info">
          <div class="participant-card-name" title="${participant.name}">${participant.name}</div>
          <div class="participant-badges-badge">
            <i data-lucide="award" style="width: 12px; height: 12px;"></i>
            <span>${ach.unlockedCount} ${ach.unlockedCount === 1 ? 'conquista' : 'conquistas'}</span>
          </div>
        </div>
      </div>

      <div class="participant-card-stats">
        <div class="p-stat-item">
          <span class="p-stat-label">Treinos</span>
          <span class="p-stat-val">${ach.totalActivities}</span>
        </div>
        <div class="p-stat-item">
          <span class="p-stat-label">Flexões</span>
          <span class="p-stat-val" style="color: var(--accent-emerald);">${ach.totalPushups.toLocaleString('pt-BR')}</span>
        </div>
        <div class="p-stat-item">
          <span class="p-stat-label">Corrida</span>
          <span class="p-stat-val" style="color: var(--accent-cyan);">${ach.totalRunning.toFixed(1)} <small style="font-size: 0.65rem;">km</small></span>
        </div>
        <div class="p-stat-item">
          <span class="p-stat-label">Bike</span>
          <span class="p-stat-val" style="color: var(--accent-amber);">${ach.totalCycling.toFixed(1)} <small style="font-size: 0.65rem;">km</small></span>
        </div>
      </div>

      <div class="participant-card-badges-row">
        ${miniBadgesHTML}
      </div>

      <div class="participant-card-actions">
        <button class="btn-action-profile" type="button">
          <i data-lucide="award"></i> <span>Perfil</span>
        </button>
        <button class="btn-action-history" type="button">
          <i data-lucide="history"></i> <span>Histórico</span>
        </button>
      </div>
    `;

    const btnProfile = card.querySelector('.btn-action-profile');
    const btnHistory = card.querySelector('.btn-action-history');

    btnProfile?.addEventListener('click', (e) => {
      e.stopPropagation();
      openParticipantDetails(participant.id, 'badges');
    });

    btnHistory?.addEventListener('click', (e) => {
      e.stopPropagation();
      openParticipantDetails(participant.id, 'history');
    });

    card.addEventListener('click', () => {
      openParticipantDetails(participant.id, 'badges');
    });

    container.appendChild(card);
  });

  lucide.createIcons();
}

// ----------------------------------------------------
// Participant Profile & History Page
// ----------------------------------------------------
function setProfileTab(tab) {
  state.profileActiveTab = tab;
  if (el.btnTabBadges()) el.btnTabBadges().classList.toggle('active', tab === 'badges');
  if (el.btnTabHistory()) el.btnTabHistory().classList.toggle('active', tab === 'history');
  if (el.participantCardBadges()) el.participantCardBadges().style.display = (tab === 'badges') ? 'block' : 'none';
  if (el.participantCardHistory()) el.participantCardHistory().style.display = (tab === 'history') ? 'block' : 'none';
}

async function openParticipantDetails(participantId, initialTab = 'badges') {
  if (state.activeSection !== 'participant-profile') {
    state.previousSection = state.activeSection || 'dashboard';
  }
  state.selectedParticipantId = participantId;
  const participant = state.participants.find(p => p.id === participantId);
  if (!participant) return;
  
  // Set participant name text and initialize input
  el.participantDetailsNameText().textContent = participant.name;
  if (el.mobileParticipantNameText()) {
    el.mobileParticipantNameText().textContent = participant.name;
  }
  el.editParticipantNameInput().value = participant.name;
  
  // Hide edit container and show text container
  el.participantNameEditContainer().style.display = 'none';
  el.participantDetailsNameText().style.display = 'block';
  
  // Show/Hide admin triggers based on state.isAdmin
  if (state.isAdmin) {
    el.btnEditParticipantNameTrigger().style.display = 'inline-flex';
    if (el.btnDetailsAddActivity()?.parentElement) {
      el.btnDetailsAddActivity().parentElement.style.display = 'block';
    }
  } else {
    el.btnEditParticipantNameTrigger().style.display = 'none';
    if (el.btnDetailsAddActivity()?.parentElement) {
      el.btnDetailsAddActivity().parentElement.style.display = 'none';
    }
  }
  
  // Switch to participant profile page & activate chosen tab
  setProfileTab(initialTab);
  switchSection('participant-profile');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load activities
  el.participantActivitiesList().innerHTML = `
    <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
      <div style="font-size: 0.9rem;">Carregando histórico...</div>
    </div>
  `;
  
  try {
    const activities = await db.getParticipantActivities(participantId, state.selectedChallengeId);
    state.selectedParticipantActivities = activities;
    renderParticipantActivities();
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar histórico de treinos.', 'error');
  }
}

function renderParticipantActivities() {
  const container = el.participantActivitiesList();
  container.innerHTML = '';
  
  const list = state.selectedParticipantActivities;
  
  // Calculate participant statistics
  const totalActivities = list.length;
  let totalPushups = 0;
  let totalRunning = 0;
  let totalCycling = 0;
  
  list.forEach(act => {
    if (act.type === 'pushup') {
      totalPushups += parseFloat(act.amount);
    } else if (act.type === 'running') {
      totalRunning += parseFloat(act.amount);
    } else if (act.type === 'cycling') {
      totalCycling += parseFloat(act.amount);
    }
  });
  
  // Render stats summary in modal
  el.participantTotalActivities().textContent = totalActivities;
  if (el.participantTotalPushups()) {
    el.participantTotalPushups().textContent = totalPushups.toLocaleString('pt-BR');
  }
  el.participantTotalRunning().innerHTML = `${totalRunning.toFixed(1).toLocaleString('pt-BR')} <span style="font-size: 0.65rem; font-weight: 500; color: var(--text-secondary);">km</span>`;
  el.participantTotalCycling().innerHTML = `${totalCycling.toFixed(1).toLocaleString('pt-BR')} <span style="font-size: 0.65rem; font-weight: 500; color: var(--text-secondary);">km</span>`;
  
  // Render Badges in modal
  renderParticipantBadges(state.selectedParticipantId);
  
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <i data-lucide="calendar-x" style="width: 24px; height: 24px; color: var(--text-muted);"></i>
        <p>Nenhuma atividade registrada neste desafio.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  list.forEach(act => {
    const itemEl = document.createElement('div');
    itemEl.className = 'participant-activity-item';
    
    let icon = 'activity';
    let typeText = '';
    let details = '';
    
    if (act.type === 'pushup') {
      icon = 'dumbbell';
      typeText = 'Flexões';
      const witnessText = act.validator ? ` • Testemunha: ${act.validator.name}` : '';
      details = `<strong>${act.amount}</strong> reps${witnessText}`;
    } else if (act.type === 'running') {
      icon = 'footprints';
      typeText = 'Corrida';
      details = `<strong>${act.amount} km</strong> em ${formatDuration(act.duration)} (Pace: ${formatPace(act.pace)})`;
    } else if (act.type === 'cycling') {
      icon = 'bike';
      typeText = 'Bike';
      details = `<strong>${act.amount} km</strong> em ${formatDuration(act.duration)} (Vel.: ${act.pace.toFixed(1)} km/h)`;
    }
    
    const deleteBtnHTML = state.isAdmin 
      ? `<button class="btn-delete-activity" data-id="${act.id}" title="Excluir Atividade">
           <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
         </button>` 
      : '';
      
    itemEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); flex-shrink: 0;">
          <i data-lucide="${icon}" style="width: 14px; height: 14px;"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary); display: flex; justify-content: space-between; align-items: baseline;">
            <span>${typeText}</span>
            <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-muted);">${formatDate(act.date)}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-top: 0.1rem;">
            ${details}
          </div>
        </div>
      </div>
      ${deleteBtnHTML}
    `;
    
    container.appendChild(itemEl);
  });
  
  lucide.createIcons();
  
  // Add click listener to delete buttons if admin
  if (state.isAdmin) {
    container.querySelectorAll('.btn-delete-activity').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const activityId = btn.getAttribute('data-id');
        await handleDeleteActivity(activityId);
      });
    });
  }
}

async function handleDeleteActivity(activityId) {
  if (!state.isAdmin) return;
  
  if (confirm('Tem certeza de que deseja excluir esta atividade permanentemente?')) {
    try {
      await db.deleteActivity(activityId);
      showToast('Atividade excluída com sucesso!');
      
      // Update local list and re-render
      state.selectedParticipantActivities = state.selectedParticipantActivities.filter(a => a.id !== activityId);
      renderParticipantActivities();
      
      // Refresh background data to update stats and charts
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir atividade.', 'error');
    }
  }
}

async function saveParticipantName() {
  if (!state.isAdmin || !state.selectedParticipantId) return;
  
  const newName = el.editParticipantNameInput().value.trim();
  if (!newName) {
    showToast('O nome não pode estar em branco.', 'error');
    return;
  }
  
  const participant = state.participants.find(p => p.id === state.selectedParticipantId);
  if (!participant) return;
  
  if (newName === participant.name) {
    cancelParticipantNameEdit();
    return;
  }
  
  try {
    const updated = await db.updateParticipantName(state.selectedParticipantId, newName);
    showToast(`Nome atualizado para "${updated.name}"!`);
    
    // Update local state names
    participant.name = updated.name;
    el.participantDetailsNameText().textContent = updated.name;
    
    cancelParticipantNameEdit();
    
    // Refresh background data to propagate name change
    await refreshData();
  } catch (err) {
    if (err.message && err.message.includes('unique')) {
      showToast('Este nome já está cadastrado.', 'error');
    } else {
      console.error(err);
      showToast('Erro ao atualizar nome.', 'error');
    }
  }
}

function cancelParticipantNameEdit() {
  el.participantNameEditContainer().style.display = 'none';
  el.participantDetailsNameText().style.display = 'block';
  if (state.isAdmin) {
    el.btnEditParticipantNameTrigger().style.display = 'inline-flex';
  }
}

// Render Recent Activities list
function renderRecentActivities() {
  const container = el.recentActivitiesList();
  container.innerHTML = '';
  
  const list = state.recentActivities;
  
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="activity"></i>
        <p>Nenhuma atividade registrada.</p>
      </div>
    `;
    return;
  }
  
  list.forEach(act => {
    const itemEl = document.createElement('div');
    itemEl.className = `activity-item ${act.type}`;
    
    let detailsText = '';
    let subInfoHTML = '';
    let icon = 'activity';
    
    if (act.type === 'pushup') {
      icon = 'dumbbell';
      const witnessText = act.validator ? ` • Testemunha: ${act.validator.name}` : '';
      const timeText = act.created_at ? ` às ${formatActivityTime(act.created_at)}` : '';
      detailsText = `fez <strong>${act.amount} flexões</strong> de braço.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}${timeText}${witnessText}</span>
      `;
    } else if (act.type === 'running') {
      icon = 'footprints';
      const timeText = act.created_at ? ` às ${formatActivityTime(act.created_at)}` : '';
      detailsText = `correu <strong>${act.amount} km</strong> em <strong>${formatDuration(act.duration)}</strong>.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}${timeText}</span>
        <span><i data-lucide="trending-up"></i> Pace: ${formatPace(act.pace)}</span>
      `;
    } else if (act.type === 'cycling') {
      icon = 'bike';
      const timeText = act.created_at ? ` às ${formatActivityTime(act.created_at)}` : '';
      detailsText = `pedalou <strong>${act.amount} km</strong> em <strong>${formatDuration(act.duration)}</strong>.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}${timeText}</span>
        <span><i data-lucide="zap"></i> Vel. Média: ${act.pace.toFixed(1)} km/h</span>
      `;
    }
    
    const userName = act.participant ? act.participant.name : 'Deletado';
    
    itemEl.innerHTML = `
      <div class="activity-type-icon">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="activity-details">
        <div class="activity-meta">
          <span class="activity-user">${userName}</span>
          <span class="activity-time">${getTimeAgo(act.created_at)}</span>
        </div>
        <div class="activity-desc">${detailsText}</div>
        <div class="activity-sub-info">${subInfoHTML}</div>
      </div>
    `;
    
    container.appendChild(itemEl);
  });
}

// Render Recent Achievements in Dashboard
function renderRecentAchievements() {
  const container = el.recentAchievementsList();
  if (!container) return;
  container.innerHTML = '';

  const activities = state.challengeActivities || [];
  if (activities.length === 0 || state.participants.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
        <p>Nenhuma conquista registrada ainda.</p>
      </div>
    `;
    return;
  }

  const pMap = {};
  state.participants.forEach(p => { pMap[p.id] = p.name; });

  const recentList = [];

  // 1. Calcular marcos alcançados (flexão, corrida e bike)
  state.participants.forEach(p => {
    // Marcos de flexão
    const pPushupActs = activities
      .filter(a => a.participant_id === p.id && a.type === 'pushup' && a.status === 'approved')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumPushups = 0;
    const reachedPushups = new Set();
    pPushupActs.forEach(act => {
      cumPushups += (parseFloat(act.amount) || 0);
      BADGE_DEFINITIONS.pushups.forEach(b => {
        if (cumPushups >= b.threshold && !reachedPushups.has(b.id)) {
          reachedPushups.add(b.id);
          recentList.push({
            participantId: p.id,
            participantName: p.name,
            badge: b,
            date: act.date,
            timestamp: act.created_at || act.date,
            subtitle: `Alcançou a marca de ${b.threshold.toLocaleString('pt-BR')} flexões!`
          });
        }
      });
    });

    // Marcos de corrida
    const pRunningActs = activities
      .filter(a => a.participant_id === p.id && a.type === 'running' && a.status === 'approved')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumRunning = 0;
    const reachedRunning = new Set();
    pRunningActs.forEach(act => {
      const val = parseFloat(act.amount) || 0;
      cumRunning += val;
      BADGE_DEFINITIONS.running.forEach(b => {
        const isSingle = b.type === 'single';
        const hit = isSingle ? (val >= b.threshold) : (cumRunning >= b.threshold);
        if (hit && !reachedRunning.has(b.id)) {
          reachedRunning.add(b.id);
          recentList.push({
            participantId: p.id,
            participantName: p.name,
            badge: b,
            date: act.date,
            timestamp: act.created_at || act.date,
            subtitle: isSingle 
              ? `Completou ${val.toFixed(1)} km em um treino de corrida!` 
              : `Acumulou ${b.threshold} km de corrida no desafio!`
          });
        }
      });
    });

    // Marcos de bike
    const pCyclingActs = activities
      .filter(a => a.participant_id === p.id && a.type === 'cycling' && a.status === 'approved')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumCycling = 0;
    const reachedCycling = new Set();
    pCyclingActs.forEach(act => {
      const val = parseFloat(act.amount) || 0;
      cumCycling += val;
      BADGE_DEFINITIONS.cycling.forEach(b => {
        const isSingle = b.type === 'single';
        const hit = isSingle ? (val >= b.threshold) : (cumCycling >= b.threshold);
        if (hit && !reachedCycling.has(b.id)) {
          reachedCycling.add(b.id);
          recentList.push({
            participantId: p.id,
            participantName: p.name,
            badge: b,
            date: act.date,
            timestamp: act.created_at || act.date,
            subtitle: isSingle 
              ? `Completou ${val.toFixed(1)} km em um treino de bike!` 
              : `Acumulou ${b.threshold} km de bike no desafio!`
          });
        }
      });
    });
  });

  // 2. Calcular conquistas diárias e combos por dia
  const dailyMap = {};
  activities.forEach(a => {
    if (a.status !== 'approved') return;
    const d = a.date;
    if (!dailyMap[d]) dailyMap[d] = { pushups: {}, running: {}, cycling: {}, types: {}, timestamps: {} };
    
    if (!dailyMap[d].pushups[a.participant_id]) dailyMap[d].pushups[a.participant_id] = 0;
    if (!dailyMap[d].running[a.participant_id]) dailyMap[d].running[a.participant_id] = 0;
    if (!dailyMap[d].cycling[a.participant_id]) dailyMap[d].cycling[a.participant_id] = 0;

    const val = parseFloat(a.amount) || 0;
    if (a.type === 'pushup') dailyMap[d].pushups[a.participant_id] += val;
    else if (a.type === 'running') dailyMap[d].running[a.participant_id] += val;
    else if (a.type === 'cycling') dailyMap[d].cycling[a.participant_id] += val;

    if (!dailyMap[d].types[a.participant_id]) dailyMap[d].types[a.participant_id] = new Set();
    dailyMap[d].types[a.participant_id].add(a.type);

    dailyMap[d].timestamps[a.participant_id] = a.created_at || a.date;
  });

  const dailyBadgesDef = {};
  BADGE_DEFINITIONS.dailyAndCombos.forEach(b => { dailyBadgesDef[b.id] = b; });

  Object.keys(dailyMap).forEach(d => {
    const day = dailyMap[d];
    const pushupEntries = Object.entries(day.pushups).filter(([_, val]) => val > 0);
    const runEntries = Object.entries(day.running).filter(([_, val]) => val > 0);
    const bikeEntries = Object.entries(day.cycling).filter(([_, val]) => val > 0);

    // Mais flexões do dia
    if (pushupEntries.length > 0) {
      let maxVal = 0;
      pushupEntries.forEach(([_, val]) => { if (val > maxVal) maxVal = val; });
      pushupEntries.forEach(([pid, val]) => {
        if (val === maxVal && maxVal > 0 && pMap[pid]) {
          recentList.push({
            participantId: pid,
            participantName: pMap[pid],
            badge: dailyBadgesDef['daily_max_pushups'],
            date: d,
            timestamp: day.timestamps[pid] || d,
            subtitle: `Maior marca do dia (${maxVal} flexões)`
          });
        }
      });

      // Menos flexões do dia
      if (pushupEntries.length >= 2) {
        let minVal = Infinity;
        pushupEntries.forEach(([_, val]) => { if (val < minVal) minVal = val; });
        pushupEntries.forEach(([pid, val]) => {
          if (val === minVal && minVal > 0 && pMap[pid]) {
            recentList.push({
              participantId: pid,
              participantName: pMap[pid],
              badge: dailyBadgesDef['daily_min_pushups'],
              date: d,
              timestamp: day.timestamps[pid] || d,
              subtitle: `Menor marca positiva do dia (${minVal} flexões)`
            });
          }
        });
      }
    }

    // Mais km de corrida do dia
    if (runEntries.length > 0) {
      let maxVal = 0;
      runEntries.forEach(([_, val]) => { if (val > maxVal) maxVal = val; });
      runEntries.forEach(([pid, val]) => {
        if (val === maxVal && maxVal > 0 && pMap[pid]) {
          recentList.push({
            participantId: pid,
            participantName: pMap[pid],
            badge: dailyBadgesDef['daily_max_running'],
            date: d,
            timestamp: day.timestamps[pid] || d,
            subtitle: `Maior marca do dia (${maxVal.toFixed(1)} km)`
          });
        }
      });
    }

    // Mais km de bike do dia
    if (bikeEntries.length > 0) {
      let maxVal = 0;
      bikeEntries.forEach(([_, val]) => { if (val > maxVal) maxVal = val; });
      bikeEntries.forEach(([pid, val]) => {
        if (val === maxVal && maxVal > 0 && pMap[pid]) {
          recentList.push({
            participantId: pid,
            participantName: pMap[pid],
            badge: dailyBadgesDef['daily_max_cycling'],
            date: d,
            timestamp: day.timestamps[pid] || d,
            subtitle: `Maior marca do dia (${maxVal.toFixed(1)} km)`
          });
        }
      });
    }

    // Combos do dia
    Object.entries(day.types).forEach(([pid, typeSet]) => {
      if (!pMap[pid]) return;
      const hasPushup = typeSet.has('pushup');
      const hasRunning = typeSet.has('running');
      const hasCycling = typeSet.has('cycling');
      const ts = day.timestamps[pid] || d;

      if (hasPushup && hasCycling) {
        recentList.push({
          participantId: pid,
          participantName: pMap[pid],
          badge: dailyBadgesDef['combo_pushup_bike'],
          date: d,
          timestamp: ts,
          subtitle: `Treinou flexão e bike no mesmo dia`
        });
      }
      if (hasPushup && hasRunning) {
        recentList.push({
          participantId: pid,
          participantName: pMap[pid],
          badge: dailyBadgesDef['combo_pushup_run'],
          date: d,
          timestamp: ts,
          subtitle: `Treinou flexão e corrida no mesmo dia`
        });
      }
      if (hasRunning && hasCycling) {
        recentList.push({
          participantId: pid,
          participantName: pMap[pid],
          badge: dailyBadgesDef['combo_run_bike'],
          date: d,
          timestamp: ts,
          subtitle: `Correu e pedalou no mesmo dia`
        });
      }
      if (hasPushup && hasRunning && hasCycling) {
        recentList.push({
          participantId: pid,
          participantName: pMap[pid],
          badge: dailyBadgesDef['combo_triatlo'],
          date: d,
          timestamp: ts,
          subtitle: `Super combo: flexão, corrida e bike!`
        });
      }
    });
  });

  if (recentList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
        <p>Nenhuma conquista registrada ainda.</p>
      </div>
    `;
    return;
  }

  // Ordenar por data/timestamp mais recente
  recentList.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

  // Limitar às 5 mais recentes para caber harmoniosamente no espaço
  const displayed = recentList.slice(0, 5);

  displayed.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'recent-achievement-item';
    itemEl.innerHTML = `
      <img class="recent-achievement-img" src="${encodeURI(item.badge.image)}" alt="${item.badge.name}">
      <div class="recent-achievement-content">
        <div class="recent-achievement-athlete">${item.participantName}</div>
        <div class="recent-achievement-badge-title">
          <i data-lucide="award" style="width: 13px; height: 13px;"></i> ${item.badge.name}
        </div>
        <div class="recent-achievement-meta">
          <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${formatDate(item.date)} • ${item.subtitle}
        </div>
      </div>
      <div class="recent-achievement-arrow">
        <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
      </div>
    `;

    itemEl.addEventListener('click', () => {
      openParticipantDetails(item.participantId);
    });

    container.appendChild(itemEl);
  });

  lucide.createIcons();
}

// Switch active section in SPA
function switchSection(sectionId) {
  pauseRace();
  if (sectionId !== 'participant-profile') {
    state.previousSection = sectionId;
  }
  state.activeSection = sectionId;
  
  el.linkDashboard().classList.toggle('active', sectionId === 'dashboard');
  if (el.linkParticipants()) el.linkParticipants().classList.toggle('active', sectionId === 'participants');
  el.linkRace().classList.toggle('active', sectionId === 'race');
  el.linkHistory().classList.toggle('active', sectionId === 'history');
  if (el.linkPushupAI()) el.linkPushupAI().classList.toggle('active', sectionId === 'pushup-ai');
  
  el.sectionDashboard().classList.toggle('active', sectionId === 'dashboard');
  if (el.sectionParticipants()) el.sectionParticipants().classList.toggle('active', sectionId === 'participants');
  if (el.sectionParticipantProfile()) el.sectionParticipantProfile().classList.toggle('active', sectionId === 'participant-profile');
  el.sectionRace().classList.toggle('active', sectionId === 'race');
  el.sectionHistory().classList.toggle('active', sectionId === 'history');
  if (el.sectionPushupAI()) el.sectionPushupAI().classList.toggle('active', sectionId === 'pushup-ai');

  // If leaving pushup-ai section, pause video if playing
  if (sectionId !== 'pushup-ai') {
    pausePushupVideo();
  }

  // Control top header and mobile header profile visibility
  if (el.mainTopBar()) {
    el.mainTopBar().style.display = (sectionId === 'participant-profile') ? 'none' : 'flex';
  }
  if (el.mobileHeaderDefault() && el.mobileHeaderProfile()) {
    if (sectionId === 'participant-profile') {
      el.mobileHeaderDefault().style.display = 'none';
      el.mobileHeaderProfile().style.display = 'flex';
    } else {
      el.mobileHeaderDefault().style.display = 'flex';
      el.mobileHeaderProfile().style.display = 'none';
    }
  }
  
  const currentChallenge = state.challenges.find(c => c.id === state.selectedChallengeId);
  if (currentChallenge) {
    if (sectionId === 'race') {
      initRaceControls(currentChallenge).then(() => renderCharts(currentChallenge));
    } else if (sectionId === 'history') {
      renderEvolutionChart(currentChallenge);
    } else if (sectionId === 'participants') {
      renderParticipantsSection();
    }
  }
  lucide.createIcons();
}

// Render dynamic charts
function renderCharts(challenge) {
  const ctx = document.getElementById('race-chart');
  if (!ctx || !challenge) return;
  
  if (state.raceChartInstance) {
    state.raceChartInstance.destroy();
  }

  // Ensure participant colors are initialized
  state.participants.forEach((p, idx) => {
    if (!state.participantColors[p.id]) {
      state.participantColors[p.id] = VIBRANT_COLORS[idx % VIBRANT_COLORS.length];
    }
  });

  // Get current race date or fallback
  let date;
  if (state.raceDates.length > 0) {
    date = state.raceDates[state.raceCurrentIndex];
  } else {
    date = challenge.end_date;
  }

  const dataForDate = state.raceDataByDate[date] || {};
  
  // Sort participants by accumulated value and limit to TOP 10
  const sorted = state.participants
    .map(p => ({
      name: p.name,
      value: dataForDate[p.id] || 0,
      color: state.participantColors[p.id]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const labels = sorted.map(s => s.name);
  const dataValues = sorted.map(s => s.value);
  const colors = sorted.map(s => s.color);

  let axisLabel = 'Flexões';
  let axisColor = '#8b5cf6';
  if (state.activeTab === 'running') {
    axisLabel = 'Distância de Corrida (km)';
    axisColor = '#06b6d4';
  } else if (state.activeTab === 'cycling') {
    axisLabel = 'Distância de Bike (km)';
    axisColor = '#f59e0b';
  }

  state.raceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: axisLabel,
          data: dataValues,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: state.raceIsRunning ? 400 : 0
      },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
          title: { display: true, text: axisLabel, color: axisColor }
        },
        y: {
          grid: { drawOnChartArea: false },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
        }
      }
    }
  });
}

function renderEvolutionChart(challenge) {
  const ctx = document.getElementById('evolution-chart');
  if (!ctx || !challenge) return;
  
  if (state.evolutionChartInstance) {
    state.evolutionChartInstance.destroy();
  }
  
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const days = {};
  const endLimitDate = challenge.status === 'active' 
    ? new Date() 
    : new Date(challenge.end_date + 'T23:59:59');
    
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endLimitDate);
    d.setDate(d.getDate() - i);
    const dayStr = getLocalDateString(d);
    days[dayStr] = { running: 0, pushups: 0, cycling: 0 };
  }
  
  state.challengeActivities.forEach(act => {
    if (days[act.date]) {
      if (act.type === 'running') {
        days[act.date].running += act.amount;
      } else if (act.type === 'pushup') {
        days[act.date].pushups += act.amount;
      } else if (act.type === 'cycling') {
        days[act.date].cycling += act.amount;
      }
    }
  });
  
  const labels = Object.keys(days).map(formatDate);
  const runningData = Object.values(days).map(d => d.running);
  const pushupsData = Object.values(days).map(d => d.pushups);
  const cyclingData = Object.values(days).map(d => d.cycling);
  
  state.evolutionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Corrida (km)',
          data: runningData,
          backgroundColor: 'rgba(6, 182, 212, 0.4)',
          borderColor: '#06b6d4',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Bike (km)',
          data: cyclingData,
          backgroundColor: 'rgba(245, 158, 11, 0.4)',
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Flexões',
          data: pushupsData,
          type: 'line',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: '#8b5cf6',
          borderWidth: 3,
          pointBackgroundColor: '#8b5cf6',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#9ca3af',
            font: { family: 'Outfit' }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
          title: { display: true, text: 'Distância (km)', color: '#06b6d4' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
          title: { display: true, text: 'Flexões (Reps)', color: '#8b5cf6' }
        }
      }
    }
  });
}

const VIBRANT_COLORS = [
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#14b8a6', // teal
  '#f97316'  // orange
];

async function initRaceControls(challenge) {
  if (!challenge) return;

  // 1. Generate daily date array for the challenge
  state.raceDates = [];
  const start = new Date(challenge.start_date + 'T00:00:00');
  const todayStr = getLocalDateStr();
  const end = new Date((challenge.status === 'active' && challenge.end_date > todayStr ? todayStr : challenge.end_date) + 'T00:00:00');
  
  let current = new Date(start);
  while (current <= end) {
    state.raceDates.push(getLocalDateStr(current));
    current.setDate(current.getDate() + 1);
  }

  // 2. Reuse preloaded challenge activities
  const activities = state.challengeActivities || [];

  // 3. Aggreate daily cumulative data
  prepareRaceData(activities);

  // 4. Setup play controls UI
  const slider = el.raceProgressSlider();
  const dateDisplay = el.raceCurrentDate();
  const resetBtn = el.btnResetRace();
  const playBtn = el.btnPlayRace();

  if (state.raceDates.length > 1) {
    slider.max = state.raceDates.length - 1;
    slider.style.display = 'block';
    dateDisplay.style.display = 'inline-block';
    resetBtn.style.display = 'inline-flex';
    
    if (!state.raceIsRunning && (state.raceCurrentIndex === 0 || state.raceCurrentIndex >= state.raceDates.length)) {
      state.raceCurrentIndex = state.raceDates.length - 1;
    }
    slider.value = state.raceCurrentIndex;
    dateDisplay.textContent = formatDate(state.raceDates[state.raceCurrentIndex]);
  } else {
    slider.style.display = 'none';
    dateDisplay.style.display = 'none';
    resetBtn.style.display = 'none';
    state.raceCurrentIndex = 0;
  }
}

function prepareRaceData(activities) {
  state.participants.forEach((p, idx) => {
    if (!state.participantColors[p.id]) {
      state.participantColors[p.id] = VIBRANT_COLORS[idx % VIBRANT_COLORS.length];
    }
  });

  const filtered = activities.filter(act => act.type === state.activeTab && act.status === 'approved');

  const actsByDate = {};
  filtered.forEach(act => {
    if (!actsByDate[act.date]) {
      actsByDate[act.date] = [];
    }
    actsByDate[act.date].push(act);
  });

  const cumulative = {};
  state.participants.forEach(p => {
    cumulative[p.id] = 0;
  });

  state.raceDataByDate = {};
  state.raceDates.forEach(date => {
    if (actsByDate[date]) {
      actsByDate[date].forEach(act => {
        cumulative[act.participant_id] += parseFloat(act.amount);
      });
    }
    state.raceDataByDate[date] = { ...cumulative };
  });
}

function playRace() {
  if (state.raceIsRunning) {
    pauseRace();
    return;
  }

  if (state.raceCurrentIndex >= state.raceDates.length - 1) {
    state.raceCurrentIndex = 0;
  }

  state.raceIsRunning = true;
  
  const playBtn = el.btnPlayRace();
  playBtn.innerHTML = '<i data-lucide="pause" style="width: 14px; height: 14px; margin-right: 2px;"></i> <span>Pausar Corrida</span>';
  lucide.createIcons();
  
  state.raceTimer = setInterval(stepRace, 750);
}

function pauseRace() {
  state.raceIsRunning = false;
  clearInterval(state.raceTimer);
  
  const playBtn = el.btnPlayRace();
  playBtn.innerHTML = '<i data-lucide="play" style="width: 14px; height: 14px; margin-right: 2px;"></i> <span>Continuar Corrida</span>';
  lucide.createIcons();
}

function resetRace() {
  pauseRace();
  state.raceCurrentIndex = 0;
  
  const playBtn = el.btnPlayRace();
  playBtn.innerHTML = '<i data-lucide="play" style="width: 14px; height: 14px; margin-right: 2px;"></i> <span>Iniciar Corrida</span>';
  lucide.createIcons();
  
  updateRaceFrame();
}

function stepRace() {
  state.raceCurrentIndex++;
  if (state.raceCurrentIndex >= state.raceDates.length) {
    pauseRace();
    state.raceCurrentIndex = state.raceDates.length - 1;
    
    const playBtn = el.btnPlayRace();
    playBtn.innerHTML = '<i data-lucide="play" style="width: 14px; height: 14px; margin-right: 2px;"></i> <span>Iniciar Corrida</span>';
    lucide.createIcons();
    return;
  }
  
  updateRaceFrame();
}

function updateRaceFrame() {
  if (state.raceDates.length === 0) return;
  
  const date = state.raceDates[state.raceCurrentIndex];
  
  el.raceProgressSlider().value = state.raceCurrentIndex;
  el.raceCurrentDate().textContent = formatDate(date);

  const dataForDate = state.raceDataByDate[date] || {};

  const sorted = state.participants
    .map(p => ({
      name: p.name,
      value: dataForDate[p.id] || 0,
      color: state.participantColors[p.id]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (state.raceChartInstance) {
    state.raceChartInstance.data.labels = sorted.map(s => s.name);
    state.raceChartInstance.data.datasets[0].data = sorted.map(s => s.value);
    state.raceChartInstance.data.datasets[0].backgroundColor = sorted.map(s => s.color);
    state.raceChartInstance.data.datasets[0].borderColor = sorted.map(s => s.color);
    state.raceChartInstance.options.animation.duration = 400;
    state.raceChartInstance.update();
  }
}

// ----------------------------------------------------
// Events Initializers
// ----------------------------------------------------
function initEvents() {
  // DB Config Reset button
  el.btnResetConfig().addEventListener('click', () => {
    if (confirm('Tem certeza de que deseja desconectar o banco de dados? A sessão administrativa local será limpa.')) {
      db.clearConfig();
      sessionStorage.removeItem('FITNESS_ADMIN');
      location.reload();
    }
  });

  // Play/Pause Race
  el.btnPlayRace().addEventListener('click', () => {
    playRace();
  });

  // Reset Race
  el.btnResetRace().addEventListener('click', () => {
    resetRace();
  });

  // Race Progress Slider Drag
  el.raceProgressSlider().addEventListener('input', (e) => {
    pauseRace();
    state.raceCurrentIndex = parseInt(e.target.value);
    updateRaceFrame();
  });

  // Sidebar Navigation Links
  el.linkDashboard().addEventListener('click', () => switchSection('dashboard'));
  if (el.linkParticipants()) el.linkParticipants().addEventListener('click', () => switchSection('participants'));
  el.linkRace().addEventListener('click', () => switchSection('race'));
  el.linkHistory().addEventListener('click', () => switchSection('history'));

  // Participants Search Filter
  el.participantsSearchInput()?.addEventListener('input', (e) => {
    state.participantsSearchTerm = e.target.value.toLowerCase().trim();
    renderParticipantsSection();
  });

  // Dashboard Recent Achievements button (redirect to participants)
  el.btnDashboardViewAchievements()?.addEventListener('click', () => switchSection('participants'));

  // Toggle Sidebar Collapse
  el.btnToggleSidebar().addEventListener('click', () => {
    const sidebar = el.sidebar();
    const isCollapsed = sidebar.classList.toggle('collapsed');
    
    const toggleIcon = el.btnToggleSidebar().querySelector('i');
    if (isCollapsed) {
      toggleIcon.setAttribute('data-lucide', 'chevron-right');
    } else {
      toggleIcon.setAttribute('data-lucide', 'chevron-left');
    }
    lucide.createIcons();
  });
  
  // DB Config Form submit (setup overlay)
  el.setupForm().addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();
    
    if (db.setConfig(url, key)) {
      el.setupOverlay().style.display = 'none';
      showToast('Banco de dados conectado com sucesso!');
      initApp();
    } else {
      showToast('Credenciais inválidas. Verifique os dados.', 'error');
    }
  });

  // Demo Mode trigger button listener
  document.getElementById('btn-demo-mode').addEventListener('click', () => {
    localStorage.setItem('FITNESS_DEMO_MODE', 'true');
    el.setupOverlay().style.display = 'none';
    showToast('Modo de demonstração ativado com sucesso!', 'info');
    initApp();
  });
  
  // Admin button trigger (in nav)
  el.btnAdminTrigger().addEventListener('click', () => {
    if (state.isAdmin) {
      // Log out
      state.isAdmin = false;
      sessionStorage.removeItem('FITNESS_ADMIN');
      updateAdminUI();
      showToast('Você saiu do modo administrador.');
    } else {
      // Open Login Modal
      checkAdminCredentialsStatus();
      toggleModal(el.modalAdminLogin(), true);
    }
  });
  
  el.btnCloseAdminLogin().addEventListener('click', () => {
    toggleModal(el.modalAdminLogin(), false);
  });
  
  // Submit Admin Login/Setup Credentials Form
  el.formAdminLogin().addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!state.hasAdminCredentials) {
      // Credentials setup mode (First load)
      const newUsername = document.getElementById('admin-setup-username').value.trim();
      const newPwd = document.getElementById('admin-setup-password').value;
      const confirmPwd = document.getElementById('admin-setup-password-confirm').value;
      
      if (!newUsername || newUsername.length < 3) {
        showToast('O usuário deve ter pelo menos 3 caracteres.', 'error');
        return;
      }
      
      if (newPwd !== confirmPwd) {
        showToast('As senhas não coincidem.', 'error');
        return;
      }
      
      try {
        await db.setAdminCredentials(newUsername, newPwd);
        state.isAdmin = true;
        sessionStorage.setItem('FITNESS_ADMIN', 'true');
        updateAdminUI();
        toggleModal(el.modalAdminLogin(), false);
        showToast('Credenciais administrativas cadastradas com sucesso!');
        state.hasAdminCredentials = true;
        refreshData();
      } catch (err) {
        showToast('Erro ao cadastrar credenciais.', 'error');
      }
    } else {
      // Regular verification mode
      const username = document.getElementById('admin-username').value;
      const pwd = document.getElementById('admin-password').value;
      try {
        const isMatched = await db.verifyCredentials(username, pwd);
        if (isMatched) {
          state.isAdmin = true;
          sessionStorage.setItem('FITNESS_ADMIN', 'true');
          updateAdminUI();
          toggleModal(el.modalAdminLogin(), false);
          document.getElementById('admin-username').value = '';
          document.getElementById('admin-password').value = '';
          showToast('Modo administrador ativado.');
          refreshData();
        } else {
          showToast('Usuário ou senha incorretos.', 'error');
        }
      } catch (err) {
        showToast('Erro de conexão ao verificar credenciais.', 'error');
      }
    }
  });
  
  // Challenge Selector Dropdown Change
  el.challengeSelector().addEventListener('change', (e) => {
    state.selectedChallengeId = e.target.value;
    refreshData();
  });
  
  // Inactive challenge card button
  el.btnNoChallengeCreate().addEventListener('click', () => {
    if (!state.isAdmin) return;
    toggleModal(el.modalManageChallenges(), true);
  });
  
  // Manage Challenges Modal Triggers
  el.btnOpenChallenge().addEventListener('click', () => {
    if (!state.isAdmin) return;
    toggleModal(el.modalManageChallenges(), true);
  });
  
  el.btnCloseChallenge().addEventListener('click', () => {
    toggleModal(el.modalManageChallenges(), false);
  });
  
  // Finish Active Challenge
  el.btnFinishChallenge().addEventListener('click', async () => {
    if (!state.activeChallenge || !state.isAdmin) return;
    
    if (confirm(`Tem certeza de que deseja encerrar o desafio "${state.activeChallenge.name}"?`)) {
      try {
        await db.finishChallenge(state.activeChallenge.id);
        showToast('Desafio finalizado!');
        await refreshData(true);
      } catch (err) {
        showToast('Erro ao finalizar desafio.', 'error');
      }
    }
  });
  
  // Create Challenge form
  el.formCreateChallenge().addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isAdmin) return;
    
    const name = document.getElementById('new-challenge-name').value.trim();
    const start = document.getElementById('new-challenge-start').value;
    const end = document.getElementById('new-challenge-end').value;
    
    if (new Date(start) > new Date(end)) {
      showToast('A data de início deve ser anterior à data de término.', 'error');
      return;
    }
    
    try {
      const newCh = await db.createChallenge(name, start, end);
      showToast(`Desafio "${newCh.name}" iniciado!`);
      el.formCreateChallenge().reset();
      toggleModal(el.modalManageChallenges(), false);
      await refreshData(true);
    } catch (err) {
      console.error(err);
      showToast('Erro ao criar desafio.', 'error');
    }
  });
  
  // Create Participant Modal Triggers
  el.btnOpenParticipant().addEventListener('click', () => {
    if (!state.isAdmin) return;
    toggleModal(el.modalCreateParticipant(), true);
  });
  
  el.btnCloseParticipant().addEventListener('click', () => {
    toggleModal(el.modalCreateParticipant(), false);
  });

  // Participant Profile Back Button (Desktop & Mobile)
  el.btnBackFromProfile()?.addEventListener('click', () => {
    switchSection(state.previousSection || 'dashboard');
  });

  el.btnBackFromProfileMobile()?.addEventListener('click', () => {
    switchSection(state.previousSection || 'dashboard');
  });

  // Participant Profile View Switcher Tabs (Badges vs History)
  el.btnTabBadges()?.addEventListener('click', () => setProfileTab('badges'));
  el.btnTabHistory()?.addEventListener('click', () => setProfileTab('history'));

  // Badges category filter buttons in profile
  document.querySelectorAll('.badge-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category') || 'all';
      state.badgeActiveFilter = cat;
      if (state.selectedParticipantId) {
        renderParticipantBadges(state.selectedParticipantId);
      }
    });
  });
  
  // Edit Participant Name Trigger
  el.btnEditParticipantNameTrigger().addEventListener('click', () => {
    if (!state.isAdmin) return;
    el.participantDetailsNameText().style.display = 'none';
    el.btnEditParticipantNameTrigger().style.display = 'none';
    el.participantNameEditContainer().style.display = 'flex';
    el.editParticipantNameInput().focus();
  });
  
  el.btnCancelParticipantName().addEventListener('click', () => {
    cancelParticipantNameEdit();
  });
  
  el.btnSaveParticipantName().addEventListener('click', () => {
    saveParticipantName();
  });
  
  el.editParticipantNameInput().addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveParticipantName();
    }
  });
  
  // Shortcut to log activity for the participant
  el.btnDetailsAddActivity().addEventListener('click', () => {
    if (!state.isAdmin || !state.selectedParticipantId) return;
    
    // Select the current participant in the log activity form
    el.logParticipantSelect().value = state.selectedParticipantId;
    
    // Set default date to today
    el.logDateInput().value = getLocalDateStr();
    
    // Open log activity modal
    toggleModal(el.modalLog(), true);
  });
  
  // Create Participant form submit
  el.formCreateParticipant().addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isAdmin) return;
    
    const nameInput = document.getElementById('new-participant-name');
    const name = nameInput.value.trim();
    if (!name) return;
    
    try {
      const newP = await db.createParticipant(name);
      showToast(`Participante "${newP.name}" cadastrado!`);
      nameInput.value = '';
      toggleModal(el.modalCreateParticipant(), false);
      await refreshData();
    } catch (err) {
      if (err.message && err.message.includes('unique')) {
        showToast('Este nome já está cadastrado.', 'error');
      } else {
        showToast('Erro ao criar participante.', 'error');
      }
    }
  });
  
  // Log Activity Modals Triggers
  el.btnOpenLog().addEventListener('click', () => {
    if (!state.isAdmin) return;
    if (state.participants.length === 0) {
      showToast('Cadastre participantes antes de lançar treinos!', 'error');
      toggleModal(el.modalCreateParticipant(), true);
      return;
    }
    
    // Set default date to today
    el.logDateInput().value = getLocalDateStr();
    
    toggleModal(el.modalLog(), true);
  });
  
  el.btnCloseLog().addEventListener('click', () => {
    toggleModal(el.modalLog(), false);
  });
  
  // Exercise Type Switch inside Log form
  el.logTypeSelect().addEventListener('change', (e) => {
    const type = e.target.value;
    if (type === 'pushup') {
      el.logPushupFields().style.display = 'block';
      el.logRunningFields().style.display = 'none';
      document.getElementById('pushups-count').setAttribute('required', 'true');
      document.getElementById('running-distance').removeAttribute('required');
      document.getElementById('running-min').removeAttribute('required');
      document.getElementById('running-sec').removeAttribute('required');
    } else {
      el.logPushupFields().style.display = 'none';
      el.logRunningFields().style.display = 'block';
      document.getElementById('pushups-count').removeAttribute('required');
      document.getElementById('running-distance').setAttribute('required', 'true');
      document.getElementById('running-min').setAttribute('required', 'true');
      document.getElementById('running-sec').setAttribute('required', 'true');
    }
  });
  
  // Submit Log Activity Form (Admin Only)
  el.formLog().addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isAdmin || !state.selectedChallengeId) return;
    
    const participantId = el.logParticipantSelect().value;
    const date = el.logDateInput().value;
    const type = el.logTypeSelect().value;
    let amount, duration, validatorId;
    
    if (!participantId || !date) {
      showToast('Preencha os dados do participante e data.', 'error');
      return;
    }
    
    if (type === 'pushup') {
      amount = parseInt(document.getElementById('pushups-count').value);
      validatorId = el.logValidatorSelect().value || null;
      if (amount <= 0) {
        showToast('A quantidade de flexões deve ser maior que zero.', 'error');
        return;
      }
    } else {
      amount = parseFloat(document.getElementById('running-distance').value);
      const mins = parseInt(document.getElementById('running-min').value) || 0;
      const secs = parseInt(document.getElementById('running-sec').value) || 0;
      duration = (mins * 60) + secs;
      
      if (amount <= 0 || duration <= 0) {
        showToast('Preencha a distância e o tempo da atividade.', 'error');
        return;
      }
    }
    
    try {
      await db.logActivity({
        challengeId: state.selectedChallengeId,
        participantId,
        type,
        amount,
        duration,
        validatorId,
        date
      });
      
      // Reset log form values
      document.getElementById('pushups-count').value = '';
      document.getElementById('running-distance').value = '';
      document.getElementById('running-min').value = '';
      document.getElementById('running-sec').value = '';
      
      toggleModal(el.modalLog(), false);
      showToast('Treino registrado com sucesso!');
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao lançar atividade.', 'error');
    }
  });
  
  // Leaderboard Tab Selection
  el.tabPushups().addEventListener('click', () => {
    el.tabPushups().classList.add('active', 'active-purple');
    el.tabRunning().classList.remove('active', 'active-cyan');
    el.tabCycling().classList.remove('active', 'active-amber');
    state.activeTab = 'pushup';
    renderLeaderboard();
    
    // Reset race and update chart only if currently on race tab
    if (state.activeSection === 'race') {
      resetRace();
      const challenge = state.challenges.find(c => c.id === state.selectedChallengeId);
      if (challenge) {
        initRaceControls(challenge).then(() => renderCharts(challenge));
      }
    }
  });
  
  el.tabRunning().addEventListener('click', () => {
    el.tabRunning().classList.add('active', 'active-cyan');
    el.tabPushups().classList.remove('active', 'active-purple');
    el.tabCycling().classList.remove('active', 'active-amber');
    state.activeTab = 'running';
    renderLeaderboard();
    
    // Reset race and update chart only if currently on race tab
    if (state.activeSection === 'race') {
      resetRace();
      const challenge = state.challenges.find(c => c.id === state.selectedChallengeId);
      if (challenge) {
        initRaceControls(challenge).then(() => renderCharts(challenge));
      }
    }
  });

  el.tabCycling().addEventListener('click', () => {
    el.tabCycling().classList.add('active', 'active-amber');
    el.tabPushups().classList.remove('active', 'active-purple');
    el.tabRunning().classList.remove('active', 'active-cyan');
    state.activeTab = 'cycling';
    renderLeaderboard();
    
    // Reset race and update chart only if currently on race tab
    if (state.activeSection === 'race') {
      resetRace();
      const challenge = state.challenges.find(c => c.id === state.selectedChallengeId);
      if (challenge) {
        initRaceControls(challenge).then(() => renderCharts(challenge));
      }
    }
  });

  // Initialize Push-up AI Counter Events
  initPushupAIEvents();
}

// ----------------------------------------------------
// Contador Inteligente de Flexões (MediaPipe AI)
// ----------------------------------------------------

function playRepAudioBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // AudioContext não disponível ou restrito
  }
}

function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 180;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

function formatVideoTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function initMediaPipePose() {
  if (state.pushupAI.poseInstance) return state.pushupAI.poseInstance;
  
  if (typeof Pose === 'undefined') {
    showToast('Biblioteca MediaPipe Pose não carregada. Verifique sua conexão.', 'error');
    throw new Error('MediaPipe Pose CDN not available.');
  }

  if (el.pushupLoadingOverlay()) el.pushupLoadingOverlay().style.display = 'flex';
  if (el.pushupLoadingText()) el.pushupLoadingText().textContent = 'Carregando inteligência artificial...';

  try {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onPushupPoseResults);
    state.pushupAI.poseInstance = pose;
    if (el.pushupLoadingOverlay()) el.pushupLoadingOverlay().style.display = 'none';
    return pose;
  } catch (err) {
    console.error('Erro ao inicializar MediaPipe:', err);
    if (el.pushupLoadingOverlay()) el.pushupLoadingOverlay().style.display = 'none';
    showToast('Falha ao inicializar modelo de IA.', 'error');
    throw err;
  }
}

function resetPushupStats() {
  state.pushupAI.repCount = 0;
  state.pushupAI.stage = 'IDLE';
  state.pushupAI.lastAngle = 180;
  state.pushupAI.depthPercent = 0;
  state.pushupAI.cameraMode = 'Detectando...';
  state.pushupAI.leftTracker = { stage: 'UP', downTime: 0, smoothAngle: null, history: [] };
  state.pushupAI.rightTracker = { stage: 'UP', downTime: 0, smoothAngle: null, history: [] };
  state.pushupAI.dispTracker = { stage: 'UP', downTime: 0, smoothDisp: null };
  state.pushupAI.lastRepTimestamp = 0;
  state.pushupAI.historyTorsoDx = [];
  state.pushupAI.historyShDx = [];
  state.pushupAI.historyLVis = [];
  state.pushupAI.historyRVis = [];
  
  if (el.pushupRepNumber()) el.pushupRepNumber().textContent = '0';
  if (el.pushupRegisterCount()) el.pushupRegisterCount().textContent = '0';
  if (el.pushupStagePill()) {
    el.pushupStagePill().textContent = 'AGUARDANDO';
    el.pushupStagePill().className = 'stage-pill';
  }
  if (el.pushupFeedbackText()) el.pushupFeedbackText().textContent = 'Inicie o vídeo para começar a contagem';
  if (el.pushupDepthFill()) el.pushupDepthFill().style.width = '0%';
  if (el.pushupDepthVal()) el.pushupDepthVal().textContent = '0%';
  if (el.pushupElbowAngle()) el.pushupElbowAngle().textContent = '--°';
  if (el.pushupBodyAngle()) el.pushupBodyAngle().textContent = '--°';
  if (el.pushupSideTracked()) el.pushupSideTracked().textContent = 'Detectando...';
}

function handlePushupVideoFile(file) {
  if (!file) return;
  stopPushupCamera();
  resetPushupStats();

  const url = URL.createObjectURL(file);
  const video = el.pushupVideo();
  if (!video) return;

  if (el.pushupDropzone()) el.pushupDropzone().style.display = 'none';
  if (el.pushupWorkspace()) el.pushupWorkspace().style.display = 'block';

  video.src = url;
  video.load();

  video.onloadedmetadata = () => {
    const canvas = el.pushupCanvas();
    if (canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
    }
    updateVideoTimeDisplay();
    initMediaPipePose().then(() => {
      playPushupVideo();
    }).catch(err => console.error(err));
  };
}

async function startPushupWebcam() {
  stopPushupCamera();
  resetPushupStats();

  const video = el.pushupVideo();
  if (!video) return;

  try {
    if (el.pushupDropzone()) el.pushupDropzone().style.display = 'none';
    if (el.pushupWorkspace()) el.pushupWorkspace().style.display = 'block';
    if (el.pushupLoadingOverlay()) el.pushupLoadingOverlay().style.display = 'flex';
    if (el.pushupLoadingText()) el.pushupLoadingText().textContent = 'Iniciando câmera...';

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });

    state.pushupAI.videoStream = stream;
    state.pushupAI.cameraActive = true;
    video.srcObject = stream;
    await video.play();

    const canvas = el.pushupCanvas();
    if (canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    await initMediaPipePose();
    state.pushupAI.isPlaying = true;
    updatePlayPauseButtonUI(true);
    processPushupVideoLoop();
  } catch (err) {
    console.error('Erro ao acessar webcam:', err);
    showToast('Não foi possível acessar a câmera. Verifique as permissões.', 'error');
    if (el.pushupLoadingOverlay()) el.pushupLoadingOverlay().style.display = 'none';
  }
}

function stopPushupCamera() {
  if (state.pushupAI.videoStream) {
    state.pushupAI.videoStream.getTracks().forEach(t => t.stop());
    state.pushupAI.videoStream = null;
  }
  state.pushupAI.cameraActive = false;
  const video = el.pushupVideo();
  if (video && video.srcObject) {
    video.srcObject = null;
  }
}

function playPushupVideo() {
  const video = el.pushupVideo();
  if (!video) return;
  video.play().then(() => {
    state.pushupAI.isPlaying = true;
    updatePlayPauseButtonUI(true);
    processPushupVideoLoop();
  }).catch(err => console.warn('Play error:', err));
}

function pausePushupVideo() {
  const video = el.pushupVideo();
  if (video) video.pause();
  state.pushupAI.isPlaying = false;
  updatePlayPauseButtonUI(false);
  if (state.pushupAI.animationFrameId) {
    cancelAnimationFrame(state.pushupAI.animationFrameId);
    state.pushupAI.animationFrameId = null;
  }
}

function updatePlayPauseButtonUI(isPlaying) {
  if (el.iconCtrlPlay()) {
    el.iconCtrlPlay().setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
    lucide.createIcons();
  }
}

function updateVideoTimeDisplay() {
  const video = el.pushupVideo();
  if (!video || state.pushupAI.cameraActive) {
    if (el.pushupTimeDisplay()) el.pushupTimeDisplay().textContent = 'AO VIVO';
    return;
  }
  const current = video.currentTime || 0;
  const total = video.duration || 0;
  if (el.pushupTimeDisplay()) {
    el.pushupTimeDisplay().textContent = `${formatVideoTime(current)} / ${formatVideoTime(total)}`;
  }
  if (el.pushupTimeline() && total > 0) {
    el.pushupTimeline().value = (current / total) * 100;
  }
}

async function processPushupVideoLoop() {
  const video = el.pushupVideo();
  if (!video || video.paused || video.ended) {
    state.pushupAI.isPlaying = false;
    updatePlayPauseButtonUI(false);
    return;
  }

  updateVideoTimeDisplay();

  if (state.pushupAI.poseInstance && !state.pushupAI.isProcessingFrame) {
    state.pushupAI.isProcessingFrame = true;
    try {
      await state.pushupAI.poseInstance.send({ image: video });
    } catch (err) {
      console.warn('Erro em pose.send:', err);
    } finally {
      state.pushupAI.isProcessingFrame = false;
    }
  }

  state.pushupAI.animationFrameId = requestAnimationFrame(processPushupVideoLoop);
}

function onPushupPoseResults(results) {
  const canvas = el.pushupCanvas();
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (results.image && (canvas.width !== results.image.width || canvas.height !== results.image.height)) {
    canvas.width = results.image.width;
    canvas.height = results.image.height;
  }

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks && results.poseLandmarks.length > 0) {
    const lms = results.poseLandmarks;

    const toPx = (lm) => ({
      x: lm.x * canvas.width,
      y: lm.y * canvas.height,
      visibility: lm.visibility || 0
    });

    const leftShoulder = toPx(lms[11]);
    const rightShoulder = toPx(lms[12]);
    const leftElbow = toPx(lms[13]);
    const rightElbow = toPx(lms[14]);
    const leftWrist = toPx(lms[15]);
    const rightWrist = toPx(lms[16]);
    const leftHip = toPx(lms[23]);
    const rightHip = toPx(lms[24]);
    const leftKnee = toPx(lms[25]);
    const rightKnee = toPx(lms[26]);
    const leftAnkle = toPx(lms[27]);
    const rightAnkle = toPx(lms[28]);

    const leftVisibility = (leftShoulder.visibility + leftElbow.visibility + leftWrist.visibility) / 3;
    const rightVisibility = (rightShoulder.visibility + rightElbow.visibility + rightWrist.visibility) / 3;

    // Ângulos articulares e geometria do torso
    const laRaw = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const raRaw = calculateAngle(rightShoulder, rightElbow, rightWrist);

    const shX = (lms[11].x + lms[12].x) / 2;
    const shY = (lms[11].y + lms[12].y) / 2;
    const hipX = (lms[23].x + lms[24].x) / 2;
    const wy = (lms[15].y + lms[16].y) / 2;

    const torsoDx = Math.abs(shX - hipX);
    const shDx = Math.abs(lms[11].x - lms[12].x);
    const dispY = wy - shY; // Maior na subida (braços esticados), menor na descida (peito no chão)

    // Acúmulo de histórico recente para classificação estável de perspectiva
    const ai = state.pushupAI;
    ai.historyTorsoDx.push(torsoDx);
    ai.historyShDx.push(shDx);
    ai.historyLVis.push(leftVisibility);
    ai.historyRVis.push(rightVisibility);
    if (ai.historyTorsoDx.length > 30) {
      ai.historyTorsoDx.shift();
      ai.historyShDx.shift();
      ai.historyLVis.shift();
      ai.historyRVis.shift();
    }

    const meanTorsoDx = ai.historyTorsoDx.reduce((a, b) => a + b, 0) / ai.historyTorsoDx.length;
    const meanShDx = ai.historyShDx.reduce((a, b) => a + b, 0) / ai.historyShDx.length;
    const meanLVis = ai.historyLVis.reduce((a, b) => a + b, 0) / ai.historyLVis.length;
    const meanRVis = ai.historyRVis.reduce((a, b) => a + b, 0) / ai.historyRVis.length;

    // Auto-identificação de Perspectiva
    const isProfile = meanTorsoDx > 0.35;
    const isFrontal = (!isProfile) && (meanShDx > 0.50 && Math.abs(meanLVis - meanRVis) < 0.20);
    const cameraMode = isProfile ? 'Perfil Lateral' : (isFrontal ? 'Frontal' : 'Diagonal / Superior');
    ai.cameraMode = cameraMode;

    // Marca temporal sincronizada (com o vídeo ou com relógio de alta precisão)
    const video = el.pushupVideo();
    const now = (video && !ai.cameraActive && !isNaN(video.currentTime) && video.currentTime > 0)
      ? (video.currentTime * 1000)
      : performance.now();

    // 1. Rastreador Braço Esquerdo
    const lt = ai.leftTracker;
    lt.smoothAngle = (lt.smoothAngle === null) ? laRaw : (0.45 * laRaw + 0.55 * lt.smoothAngle);
    lt.history.push(laRaw);
    if (lt.history.length > 50) lt.history.shift();

    let leftRepFinished = false;
    if (lt.smoothAngle <= 102.0) {
      if (lt.stage !== 'DOWN') {
        lt.stage = 'DOWN';
        lt.downTime = now;
      }
    } else if (lt.smoothAngle >= 139.0) {
      if (lt.stage === 'DOWN') {
        if ((now - lt.downTime) >= 140) {
          lt.stage = 'UP';
          leftRepFinished = true;
        } else {
          lt.stage = 'UP';
        }
      }
    }

    // 2. Rastreador Braço Direito
    const rt = ai.rightTracker;
    rt.smoothAngle = (rt.smoothAngle === null) ? raRaw : (0.45 * raRaw + 0.55 * rt.smoothAngle);
    rt.history.push(raRaw);
    if (rt.history.length > 50) rt.history.shift();

    let rightRepFinished = false;
    if (rt.smoothAngle <= 102.0) {
      if (rt.stage !== 'DOWN') {
        rt.stage = 'DOWN';
        rt.downTime = now;
      }
    } else if (rt.smoothAngle >= 139.0) {
      if (rt.stage === 'DOWN') {
        if ((now - rt.downTime) >= 140) {
          rt.stage = 'UP';
          rightRepFinished = true;
        } else {
          rt.stage = 'UP';
        }
      }
    }

    // 3. Rastreador de Deslocamento Frontal
    const dt = ai.dispTracker;
    dt.smoothDisp = (dt.smoothDisp === null) ? dispY : (0.35 * dispY + 0.65 * dt.smoothDisp);
    const minElbowAngle = Math.min(lt.smoothAngle, rt.smoothAngle);

    let dispRepFinished = false;
    if ((dt.smoothDisp <= 0.24 && minElbowAngle <= 125) || minElbowAngle <= 95) {
      if (dt.stage !== 'DOWN') {
        dt.stage = 'DOWN';
        dt.downTime = now;
      }
    } else if ((dt.smoothDisp >= 0.35 && minElbowAngle >= 135) || minElbowAngle >= 150) {
      if (dt.stage === 'DOWN') {
        if ((now - dt.downTime) >= 180) {
          dt.stage = 'UP';
          dispRepFinished = true;
        } else {
          dt.stage = 'UP';
        }
      }
    }

    // 4. Amplitude Biomecânica Dinâmica (Percentil 90 - Percentil 10)
    const calcAmp = (arr) => {
      if (arr.length < 5) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const p10 = sorted[Math.floor(sorted.length * 0.1)];
      const p90 = sorted[Math.floor(sorted.length * 0.9)];
      return p90 - p10;
    };
    const lAmp = calcAmp(lt.history);
    const rAmp = calcAmp(rt.history);

    // 5. Seleção do Rastreador Ativo de Acordo com a Câmera
    let chosenRepTriggered = false;
    let activeAngle = 180;
    let activeTrackerName = 'Esquerdo';
    let currentStage = 'UP';

    if (isProfile) {
      const useLeft = meanLVis >= meanRVis;
      activeTrackerName = useLeft ? 'Perfil (Esq)' : 'Perfil (Dir)';
      activeAngle = useLeft ? lt.smoothAngle : rt.smoothAngle;
      currentStage = useLeft ? lt.stage : rt.stage;
      chosenRepTriggered = useLeft ? leftRepFinished : rightRepFinished;
    } else if (isFrontal) {
      activeTrackerName = 'Frontal (Torso)';
      activeAngle = minElbowAngle;
      currentStage = dt.stage;
      chosenRepTriggered = dispRepFinished;
    } else {
      // Diagonal ou Superior: escolhe o braço com maior amplitude real de movimento
      const useLeft = lAmp >= rAmp;
      activeTrackerName = useLeft ? 'Diag/Sup (Esq)' : 'Diag/Sup (Dir)';
      activeAngle = useLeft ? lt.smoothAngle : rt.smoothAngle;
      currentStage = useLeft ? lt.stage : rt.stage;
      chosenRepTriggered = useLeft ? leftRepFinished : rightRepFinished;
    }

    ai.stage = currentStage;
    ai.lastAngle = activeAngle;

    // 6. Validação e Trava Anti-Repique (Mínimo 480ms entre repetições válidas)
    if (chosenRepTriggered) {
      if ((now - ai.lastRepTimestamp) >= 480) {
        ai.repCount++;
        ai.lastRepTimestamp = now;

        if (el.pushupRepNumber()) {
          el.pushupRepNumber().textContent = ai.repCount;
          el.pushupRepNumber().classList.add('pulse');
          setTimeout(() => el.pushupRepNumber()?.classList.remove('pulse'), 300);
        }
        if (el.pushupRegisterCount()) {
          el.pushupRegisterCount().textContent = ai.repCount;
        }

        playRepAudioBeep();
        if (el.repFeedbackFlash()) {
          el.repFeedbackFlash().classList.remove('flash-active');
          void el.repFeedbackFlash().offsetWidth;
          el.repFeedbackFlash().classList.add('flash-active');
        }

        if (el.pushupStagePill()) {
          el.pushupStagePill().textContent = 'SUBIDA CONCLUÍDA';
          el.pushupStagePill().className = 'stage-pill stage-up';
        }
        if (el.pushupFeedbackText()) {
          el.pushupFeedbackText().textContent = `Repetição #${ai.repCount} validada com sucesso!`;
          el.pushupFeedbackText().style.color = 'var(--accent-emerald)';
        }
      }
    } else {
      if (currentStage === 'DOWN') {
        if (el.pushupStagePill()) {
          el.pushupStagePill().textContent = 'FLEXIONADO (OK)';
          el.pushupStagePill().className = 'stage-pill stage-down';
        }
        if (el.pushupFeedbackText()) {
          el.pushupFeedbackText().textContent = 'Ótima profundidade! Agora suba!';
          el.pushupFeedbackText().style.color = 'var(--accent-emerald)';
        }
      } else {
        if (activeAngle >= 135) {
          if (el.pushupStagePill()) {
            el.pushupStagePill().textContent = 'POSIÇÃO ALTA (PRONTO)';
            el.pushupStagePill().className = 'stage-pill stage-up';
          }
          if (el.pushupFeedbackText() && !el.pushupFeedbackText().textContent.includes('Repetição #')) {
            el.pushupFeedbackText().textContent = 'Pronto para descer';
            el.pushupFeedbackText().style.color = 'var(--text-secondary)';
          }
        } else {
          if (el.pushupStagePill()) {
            el.pushupStagePill().textContent = 'DESCENDO...';
            el.pushupStagePill().className = 'stage-pill';
          }
          if (el.pushupFeedbackText() && !el.pushupFeedbackText().textContent.includes('Repetição #')) {
            el.pushupFeedbackText().textContent = 'Desça até a meta de flexão (≤100°)';
            el.pushupFeedbackText().style.color = 'var(--accent-amber)';
          }
        }
      }
    }

    // Ângulo da prancha para postura
    const dominantIsLeft = activeTrackerName.includes('Esq');
    const shoulder = dominantIsLeft ? leftShoulder : rightShoulder;
    const hip = dominantIsLeft ? leftHip : rightHip;
    const ankle = dominantIsLeft ? leftAnkle : rightAnkle;
    const knee = dominantIsLeft ? leftKnee : rightKnee;
    const bodyAngle = calculateAngle(shoulder, hip, (ankle.visibility > 0.3 ? ankle : knee));

    if (el.pushupElbowAngle()) el.pushupElbowAngle().textContent = `${Math.round(activeAngle)}°`;
    if (el.pushupBodyAngle()) el.pushupBodyAngle().textContent = `${Math.round(bodyAngle)}°`;
    if (el.pushupSideTracked()) el.pushupSideTracked().textContent = activeTrackerName;

    // Barra de Progresso de Amplitude
    let depth = 0;
    if (isFrontal) {
      const clampedDisp = Math.max(0.12, Math.min(0.40, dt.smoothDisp));
      depth = Math.round(((0.40 - clampedDisp) / (0.40 - 0.12)) * 100);
    } else {
      const clampedAngle = Math.max(85, Math.min(150, activeAngle));
      depth = Math.round(Math.max(0, Math.min(100, ((145 - clampedAngle) / (145 - 95)) * 100)));
    }
    ai.depthPercent = depth;
    if (el.pushupDepthFill()) el.pushupDepthFill().style.width = `${depth}%`;
    if (el.pushupDepthVal()) el.pushupDepthVal().textContent = `${depth}%`;

    if (bodyAngle < 135) {
      if (el.pushupFeedbackText()) {
        el.pushupFeedbackText().textContent = '⚠️ Alinhe o quadril! Evite deixar o corpo ceder.';
        el.pushupFeedbackText().style.color = '#ef4444';
      }
    }

    drawPushupSkeleton(ctx, lms, canvas.width, canvas.height, dominantIsLeft, activeAngle, bodyAngle);
  }

  ctx.restore();
}

function drawPushupSkeleton(ctx, lms, w, h, isLeft, elbowAngle, bodyAngle) {
  const connections = [
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16],
    [11, 23], [12, 24],
    [23, 24],
    [23, 25], [25, 27],
    [24, 26], [26, 28]
  ];

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';

  connections.forEach(([i, j]) => {
    const p1 = lms[i];
    const p2 = lms[j];
    if (p1 && p2 && (p1.visibility || 0) > 0.25 && (p2.visibility || 0) > 0.25) {
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
  });

  const activeArmIdx = isLeft ? [11, 13, 15] : [12, 14, 16];
  const shoulder = lms[activeArmIdx[0]];
  const elbow = lms[activeArmIdx[1]];
  const wrist = lms[activeArmIdx[2]];

  if (shoulder && elbow && wrist) {
    const colorArm = elbowAngle <= 102 ? '#10b981' : (elbowAngle <= 130 ? '#f59e0b' : '#06b6d4');
    ctx.lineWidth = 5;
    ctx.strokeStyle = colorArm;
    ctx.beginPath();
    ctx.moveTo(shoulder.x * w, shoulder.y * h);
    ctx.lineTo(elbow.x * w, elbow.y * h);
    ctx.lineTo(wrist.x * w, wrist.y * h);
    ctx.stroke();

    [shoulder, elbow, wrist].forEach(pt => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colorArm;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(elbow.x * w + 10, elbow.y * h - 22, 54, 24);
    ctx.strokeStyle = colorArm;
    ctx.lineWidth = 1;
    ctx.strokeRect(elbow.x * w + 10, elbow.y * h - 22, 54, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`${elbowAngle}°`, elbow.x * w + 16, elbow.y * h - 6);
  }
}

function initPushupAIEvents() {
  if (el.linkPushupAI()) {
    el.linkPushupAI().addEventListener('click', () => switchSection('pushup-ai'));
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handlePushupVideoFile(file);
  };

  el.pushupVideoInput()?.addEventListener('change', handleFileChange);
  el.pushupVideoInputDrop()?.addEventListener('change', handleFileChange);

  const dropzone = el.pushupDropzone();
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handlePushupVideoFile(files[0]);
      }
    });
  }

  el.btnPushupWebcam()?.addEventListener('click', () => {
    startPushupWebcam();
  });

  el.btnCtrlPlay()?.addEventListener('click', () => {
    if (state.pushupAI.isPlaying) {
      pausePushupVideo();
    } else {
      playPushupVideo();
    }
  });

  el.btnCtrlRestart()?.addEventListener('click', () => {
    const video = el.pushupVideo();
    if (video) {
      video.currentTime = 0;
      resetPushupStats();
      playPushupVideo();
    }
  });

  el.pushupTimeline()?.addEventListener('input', (e) => {
    const video = el.pushupVideo();
    if (video && video.duration) {
      video.currentTime = (e.target.value / 100) * video.duration;
    }
  });

  document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const speed = parseFloat(e.target.getAttribute('data-speed') || '1');
      const video = el.pushupVideo();
      if (video) video.playbackRate = speed;
    });
  });

  el.btnChangeVideo()?.addEventListener('click', () => {
    pausePushupVideo();
    stopPushupCamera();
    resetPushupStats();
    if (el.pushupWorkspace()) el.pushupWorkspace().style.display = 'none';
    if (el.pushupDropzone()) el.pushupDropzone().style.display = 'block';
  });

  el.btnPushupRegister()?.addEventListener('click', () => {
    const count = state.pushupAI.repCount;
    if (count <= 0) {
      showToast('Nenhuma repetição validada ainda para registrar.', 'info');
      return;
    }
    if (!state.isAdmin) {
      showToast('Entre como administrador para registrar o treino oficial.', 'warning');
      toggleModal(el.modalAdminLogin(), true);
      return;
    }

    toggleModal(el.modalLog(), true);
    if (el.logTypeSelect()) {
      el.logTypeSelect().value = 'pushup';
      el.logTypeSelect().dispatchEvent(new Event('change'));
    }
    const pushupInput = document.getElementById('pushups-count');
    if (pushupInput) {
      pushupInput.value = count;
    }
    showToast(`Total de ${count} flexões pré-preenchido! Selecione o atleta para salvar.`);
  });
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
async function initApp() {
  updateAdminUI();
  
  // Initial load
  await refreshData(true);
  
  if (db.isDemoActive()) {
    setTimeout(() => {
      showToast("Demonstração: Use o usuário 'admin' e senha 'admin' na Área do Admin para gerenciar treinos!", "info");
    }, 1000);
  }
  
  // Realtime subscription
  db.subscribeToChanges(() => {
    console.log('Database change notification received.');
    refreshData(true);
  });
}

// DOM entry point
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  
  if (db.isConfigured()) {
    el.setupOverlay().style.display = 'none';
    initApp();
  } else {
    el.setupOverlay().style.display = 'flex';
  }
});
