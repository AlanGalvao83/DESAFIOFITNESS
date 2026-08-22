import * as db from './db.js';

// Application State
const state = {
  isAdmin: sessionStorage.getItem('FITNESS_ADMIN') === 'true',
  challenges: [],
  selectedChallengeId: null,
  activeChallenge: null,
  participants: [],
  rankings: { pushupsRanking: [], runningRanking: [], stats: { totalPushups: 0, totalDistance: 0, participantsCount: 0 } },
  recentActivities: [],
  activeTab: 'pushup', // 'pushup' or 'running'
  chartInstance: null,
  hasAdminCredentials: false
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
  activeParticipants: () => document.getElementById('active-participants-value'),
  
  // Leaders / Prize elements
  pushupLeaderName: () => document.getElementById('pushup-leader-name'),
  pushupLeaderValue: () => document.getElementById('pushup-leader-value'),
  runningLeaderName: () => document.getElementById('running-leader-name'),
  runningLeaderValue: () => document.getElementById('running-leader-value'),
  
  tabPushups: () => document.getElementById('tab-pushups'),
  tabRunning: () => document.getElementById('tab-running'),
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
  
  toastContainer: () => document.getElementById('toast-container')
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
    
    // 5. Update overall metrics
    const stats = state.rankings.stats;
    el.totalPushups().textContent = stats.totalPushups.toLocaleString('pt-BR');
    el.totalDistance().textContent = `${stats.totalDistance.toLocaleString('pt-BR')} km`;
    el.activeParticipants().textContent = stats.participantsCount;
    
    // 6. Calculate & Render Leaders (Prizes Highlight)
    renderLeadersPodium();
    
    // Update dates and countdown
    updateChallengeDatesCountdown(currentChallenge);
    
    // 7. Render dynamic lists & charts
    renderLeaderboard();
    renderRecentActivities();
    renderCharts(currentChallenge);
    
    // Update admin challenge management modal values
    updateChallengeModalAdminPanel();
    
    lucide.createIcons();
  } catch (error) {
    console.error('Error refreshing data:', error);
    showToast('Erro ao atualizar dados do painel.', 'error');
  }
}

// Calculate leaders for pushups and running, and render the podium
function renderLeadersPodium() {
  const pushupsRanking = state.rankings.pushupsRanking;
  const runningRanking = state.rankings.runningRanking;
  
  // Find pushups leader(s)
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
  
  // Find running leader(s)
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
  
  const isPushupTab = state.activeTab === 'pushup';
  const list = isPushupTab ? state.rankings.pushupsRanking : state.rankings.runningRanking;
  
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
    const value = isPushupTab ? item.pushups : item.runningDistance;
    
    // Subtext details
    let subtext = '';
    if (!isPushupTab && item.runningDistance > 0) {
      subtext = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
        Melhor Pace: ${formatPace(item.bestPace)} • ${item.runCount} corrida${item.runCount > 1 ? 's' : ''}
      </div>`;
    } else if (isPushupTab && item.pushups > 0) {
      subtext = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
        Treino de força
      </div>`;
    }
    
    const unit = isPushupTab ? 'flexões' : 'km';
    
    const rankEl = document.createElement('div');
    rankEl.className = 'leaderboard-item';
    rankEl.innerHTML = `
      <div class="rank-number">${index + 1}</div>
      <div class="rank-name">
        <div>${item.name}</div>
        ${subtext}
      </div>
      <div class="rank-score">
        ${isPushupTab ? value.toLocaleString('pt-BR') : value.toFixed(1).toLocaleString('pt-BR')}
        <span class="rank-unit">${unit}</span>
      </div>
    `;
    listContainer.appendChild(rankEl);
  });
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
    const isPushup = act.type === 'pushup';
    const itemEl = document.createElement('div');
    itemEl.className = `activity-item ${act.type}`;
    
    let detailsText = '';
    let subInfoHTML = '';
    
    if (isPushup) {
      const witnessText = act.validator ? ` • Testemunha: ${act.validator.name}` : '';
      detailsText = `fez <strong>${act.amount} flexões</strong> de braço.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)} ${witnessText}</span>
      `;
    } else {
      detailsText = `correu <strong>${act.amount} km</strong> em <strong>${formatDuration(act.duration)}</strong>.`;
      subInfoHTML = `
        <span><i data-lucide="calendar"></i> ${formatDate(act.date)}</span>
        <span><i data-lucide="trending-up"></i> Pace: ${formatPace(act.pace)}</span>
      `;
    }
    
    const icon = isPushup ? 'dumbbell' : 'footprints';
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
function renderCharts(challenge) {
  const ctx = document.getElementById('history-chart');
  if (!ctx || !challenge) return;
  
  if (state.chartInstance) {
    state.chartInstance.destroy();
  }
  
  // Aggregate activities daily for the last 7 challenge days
  const days = {};
  const endLimitDate = challenge.status === 'active' 
    ? new Date() 
    : new Date(challenge.end_date + 'T23:59:59');
    
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endLimitDate);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    days[dayStr] = { running: 0, pushups: 0 };
  }
  
  state.recentActivities.forEach(act => {
    if (days[act.date]) {
      if (act.type === 'running') {
        days[act.date].running += act.amount;
      } else if (act.type === 'pushup') {
        days[act.date].pushups += act.amount;
      }
    }
  });
  
  const labels = Object.keys(days).map(formatDate);
  const runningData = Object.values(days).map(d => d.running);
  const pushupsData = Object.values(days).map(d => d.pushups);
  
  state.chartInstance = new Chart(ctx, {
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
          title: { display: true, text: 'Corridas (km)', color: '#06b6d4' }
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
        showToast('Preencha a distância e tempo da corrida.', 'error');
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
    state.activeTab = 'pushup';
    renderLeaderboard();
  });
  
  el.tabRunning().addEventListener('click', () => {
    el.tabRunning().classList.add('active', 'active-cyan');
    el.tabPushups().classList.remove('active', 'active-purple');
    state.activeTab = 'running';
    renderLeaderboard();
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
