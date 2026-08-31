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
  participantColors: {}
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
  logDateInput: () => document.getElementById('log-date'),
  logTypeSelect: () => document.getElementById('log-type'),
  logPushupFields: () => document.getElementById('log-pushup-fields'),
  logRunningFields: () => document.getElementById('log-running-fields'),
  logValidatorSelect: () => document.getElementById('log-validator'),
  
  toastContainer: () => document.getElementById('toast-container'),

  // Participant Details Modal elements
  modalParticipantDetails: () => document.getElementById('modal-participant-details'),
  btnCloseParticipantDetails: () => document.getElementById('btn-close-participant-details'),
  participantDetailsNameText: () => document.getElementById('participant-details-name-text'),
  btnEditParticipantNameTrigger: () => document.getElementById('btn-edit-participant-name-trigger'),
  participantNameEditContainer: () => document.getElementById('participant-name-edit-container'),
  editParticipantNameInput: () => document.getElementById('edit-participant-name-input'),
  btnSaveParticipantName: () => document.getElementById('btn-save-participant-name'),
  btnCancelParticipantName: () => document.getElementById('btn-cancel-participant-name'),
  participantActivitiesList: () => document.getElementById('participant-activities-list'),
  btnDetailsAddActivity: () => document.getElementById('btn-details-add-activity'),
  participantTotalActivities: () => document.getElementById('participant-total-activities'),
  participantTotalRunning: () => document.getElementById('participant-total-running'),
  participantTotalCycling: () => document.getElementById('participant-total-cycling'),
  btnPlayRace: () => document.getElementById('btn-play-race'),
  btnResetRace: () => document.getElementById('btn-reset-race'),
  raceCurrentDate: () => document.getElementById('race-current-date'),
  raceProgressSlider: () => document.getElementById('race-progress-slider'),
  
  // Sidebar elements
  linkDashboard: () => document.getElementById('link-dashboard'),
  linkRace: () => document.getElementById('link-race'),
  linkHistory: () => document.getElementById('link-history'),
  sectionDashboard: () => document.getElementById('section-dashboard'),
  sectionRace: () => document.getElementById('section-race'),
  sectionHistory: () => document.getElementById('section-history')
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function getTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  
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
    await initRaceControls(currentChallenge);
    if (state.activeSection === 'race') {
      renderCharts(currentChallenge);
    } else if (state.activeSection === 'history') {
      renderEvolutionChart(currentChallenge);
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
  const todayStr = new Date().toLocaleDateString('en-CA');
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
    
    const rankEl = document.createElement('div');
    rankEl.className = 'leaderboard-item';
    rankEl.innerHTML = `
      <div class="rank-number">${index + 1}</div>
      <div class="rank-name">
        <div>${item.name}</div>
        ${subtext}
      </div>
      <div class="rank-score">
        ${state.activeTab === 'pushup' ? value.toLocaleString('pt-BR') : value.toFixed(1).toLocaleString('pt-BR')}
        <span class="rank-unit">${unit}</span>
      </div>
    `;
    
    rankEl.addEventListener('click', () => {
      openParticipantDetails(item.id);
    });
    
    listContainer.appendChild(rankEl);
  });
}

// ----------------------------------------------------
// Participant Details & History Modal
// ----------------------------------------------------
async function openParticipantDetails(participantId) {
  state.selectedParticipantId = participantId;
  const participant = state.participants.find(p => p.id === participantId);
  if (!participant) return;
  
  // Set participant name text and initialize input
  el.participantDetailsNameText().textContent = participant.name;
  el.editParticipantNameInput().value = participant.name;
  
  // Hide edit container and show text container
  el.participantNameEditContainer().style.display = 'none';
  el.participantDetailsNameText().style.display = 'block';
  
  // Show/Hide admin triggers based on state.isAdmin
  if (state.isAdmin) {
    el.btnEditParticipantNameTrigger().style.display = 'inline-flex';
    el.btnDetailsAddActivity().parentElement.style.display = 'block';
  } else {
    el.btnEditParticipantNameTrigger().style.display = 'none';
    el.btnDetailsAddActivity().parentElement.style.display = 'none';
  }
  
  // Load activities
  el.participantActivitiesList().innerHTML = `
    <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
      <div style="font-size: 0.9rem;">Carregando histórico...</div>
    </div>
  `;
  
  toggleModal(el.modalParticipantDetails(), true);
  
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
  let totalRunning = 0;
  let totalCycling = 0;
  
  list.forEach(act => {
    if (act.type === 'running') {
      totalRunning += act.amount;
    } else if (act.type === 'cycling') {
      totalCycling += act.amount;
    }
  });
  
  // Render stats summary in modal
  el.participantTotalActivities().textContent = totalActivities;
  el.participantTotalRunning().innerHTML = `${totalRunning.toFixed(1).toLocaleString('pt-BR')} <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-secondary);">km</span>`;
  el.participantTotalCycling().innerHTML = `${totalCycling.toFixed(1).toLocaleString('pt-BR')} <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-secondary);">km</span>`;
  
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
      detailsText = `fez <strong>${act.amount} flexões</strong> de braço.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)} ${witnessText}</span>
      `;
    } else if (act.type === 'running') {
      icon = 'footprints';
      detailsText = `correu <strong>${act.amount} km</strong> em <strong>${formatDuration(act.duration)}</strong>.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}</span>
        <span><i data-lucide="trending-up"></i> Pace: ${formatPace(act.pace)}</span>
      `;
    } else if (act.type === 'cycling') {
      icon = 'bike';
      detailsText = `pedalou <strong>${act.amount} km</strong> em <strong>${formatDuration(act.duration)}</strong>.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}</span>
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

// Render dynamic charts
function switchSection(sectionId) {
  pauseRace();
  state.activeSection = sectionId;
  
  el.linkDashboard().classList.toggle('active', sectionId === 'dashboard');
  el.linkRace().classList.toggle('active', sectionId === 'race');
  el.linkHistory().classList.toggle('active', sectionId === 'history');
  
  el.sectionDashboard().classList.toggle('active', sectionId === 'dashboard');
  el.sectionRace().classList.toggle('active', sectionId === 'race');
  el.sectionHistory().classList.toggle('active', sectionId === 'history');
  
  const currentChallenge = state.challenges.find(c => c.id === state.selectedChallengeId);
  if (currentChallenge) {
    if (sectionId === 'race') {
      initRaceControls(currentChallenge).then(() => renderCharts(currentChallenge));
    } else if (sectionId === 'history') {
      renderEvolutionChart(currentChallenge);
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
  const todayStr = new Date().toISOString().split('T')[0];
  const end = new Date((challenge.status === 'active' && challenge.end_date > todayStr ? todayStr : challenge.end_date) + 'T00:00:00');
  
  let current = new Date(start);
  while (current <= end) {
    state.raceDates.push(current.toISOString().split('T')[0]);
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
  el.linkRace().addEventListener('click', () => switchSection('race'));
  el.linkHistory().addEventListener('click', () => switchSection('history'));
  
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

  // Participant Details Modal Close
  el.btnCloseParticipantDetails().addEventListener('click', () => {
    toggleModal(el.modalParticipantDetails(), false);
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
    
    // Close details modal
    toggleModal(el.modalParticipantDetails(), false);
    
    // Set default date to today
    el.logDateInput().value = new Date().toISOString().split('T')[0];
    
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
    el.logDateInput().value = new Date().toISOString().split('T')[0];
    
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
