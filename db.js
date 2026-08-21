// Supabase database configuration and operations module
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Default Supabase credentials for the project (fallback)
const DEFAULT_URL = 'https://vrkvqxlzuaxupfxwajzr.supabase.co';
const DEFAULT_KEY = 'sb_publishable_8vkn-jVX6VlurrUAAIXYhA_Bul-IYCM';

const isDisconnected = localStorage.getItem('FITNESS_DISCONNECTED') === 'true';
const cachedUrl = isDisconnected ? localStorage.getItem('FITNESS_SUPABASE_URL') : (localStorage.getItem('FITNESS_SUPABASE_URL') || DEFAULT_URL);
const cachedKey = isDisconnected ? localStorage.getItem('FITNESS_SUPABASE_KEY') : (localStorage.getItem('FITNESS_SUPABASE_KEY') || DEFAULT_KEY);

if (cachedUrl && cachedKey) {
  try {
    supabase = createClient(cachedUrl, cachedKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export function isConfigured() {
  return supabase !== null || isDemoActive();
}

export function setConfig(url, key) {
  if (!url || !key) return false;
  try {
    createClient(url, key); // Test initialization
    localStorage.setItem('FITNESS_SUPABASE_URL', url);
    localStorage.setItem('FITNESS_SUPABASE_KEY', key);
    localStorage.setItem('FITNESS_DISCONNECTED', 'false'); // Reset disconnect flag
    supabase = createClient(url, key);
    return true;
  } catch (e) {
    console.error('Invalid Supabase credentials:', e);
    return false;
  }
}

export function clearConfig() {
  localStorage.removeItem('FITNESS_SUPABASE_URL');
  localStorage.removeItem('FITNESS_SUPABASE_KEY');
  localStorage.removeItem('FITNESS_DEMO_MODE');
  localStorage.removeItem('MOCK_PARTICIPANTS');
  localStorage.removeItem('MOCK_CHALLENGES');
  localStorage.removeItem('MOCK_ACTIVITIES');
  localStorage.setItem('FITNESS_DISCONNECTED', 'true'); // Set disconnect flag
  supabase = null;
}

// Helper to hash password on client-side using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ----------------------------------------------------
// Demo / Mock Mode Handlers
// ----------------------------------------------------

export function isDemoActive() {
  return localStorage.getItem('FITNESS_DEMO_MODE') === 'true';
}

const DEFAULT_MOCK_PARTICIPANTS = [
  { id: 'p1', name: 'Alan', created_at: new Date().toISOString() },
  { id: 'p2', name: 'João', created_at: new Date().toISOString() },
  { id: 'p3', name: 'Carlos', created_at: new Date().toISOString() },
  { id: 'p4', name: 'Renata', created_at: new Date().toISOString() }
];

const DEFAULT_MOCK_CHALLENGES = [
  {
    id: 'c1',
    name: 'Desafio de Primavera',
    start_date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    end_date: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_MOCK_ACTIVITIES = [
  {
    id: 'a1',
    challenge_id: 'c1',
    participant_id: 'p2',
    type: 'running',
    amount: 15.2,
    duration: 5120, // ~1h 25m
    pace: 5.61,
    validator_id: null,
    status: 'approved',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
  },
  {
    id: 'a2',
    challenge_id: 'c1',
    participant_id: 'p1',
    type: 'running',
    amount: 18.5,
    duration: 6100,
    pace: 5.50,
    validator_id: null,
    status: 'approved',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
    created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
  },
  {
    id: 'a3',
    challenge_id: 'c1',
    participant_id: 'p3',
    type: 'pushup',
    amount: 250,
    duration: null,
    pace: null,
    validator_id: 'p1',
    status: 'approved',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
    created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
  },
  {
    id: 'a4',
    challenge_id: 'c1',
    participant_id: 'p4',
    type: 'pushup',
    amount: 190,
    duration: null,
    pace: null,
    validator_id: 'p2',
    status: 'approved',
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  },
  {
    id: 'a5',
    challenge_id: 'c1',
    participant_id: 'p1',
    type: 'pushup',
    amount: 320,
    duration: null,
    pace: null,
    validator_id: 'p3',
    status: 'approved',
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  }
];

function initMockData() {
  if (!localStorage.getItem('MOCK_PARTICIPANTS')) {
    localStorage.setItem('MOCK_PARTICIPANTS', JSON.stringify(DEFAULT_MOCK_PARTICIPANTS));
  }
  if (!localStorage.getItem('MOCK_CHALLENGES')) {
    localStorage.setItem('MOCK_CHALLENGES', JSON.stringify(DEFAULT_MOCK_CHALLENGES));
  }
  if (!localStorage.getItem('MOCK_ACTIVITIES')) {
    localStorage.setItem('MOCK_ACTIVITIES', JSON.stringify(DEFAULT_MOCK_ACTIVITIES));
  }
}

// ----------------------------------------------------
// Admin Operations
// ----------------------------------------------------

export async function hasAdminCredentials() {
  if (isDemoActive()) return true;
  if (!supabase) return false;
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .in('key', ['admin_username', 'admin_password_hash']);
      
    if (error) {
      console.error('Error checking admin credentials status:', error);
      return false;
    }
    return data && data.length >= 2;
  } catch (e) {
    return false;
  }
}

export async function setAdminCredentials(username, password) {
  if (isDemoActive()) return true;
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const hash = await hashPassword(password);
  
  const { error: err1 } = await supabase
    .from('settings')
    .upsert([{ key: 'admin_username', value: username.trim() }]);
    
  if (err1) throw err1;
  
  const { error: err2 } = await supabase
    .from('settings')
    .upsert([{ key: 'admin_password_hash', value: hash }]);
    
  if (err2) throw err2;
  
  return true;
}

export async function verifyCredentials(username, password) {
  if (isDemoActive()) {
    // In demo mode, user 'admin' and password 'admin' are pre-configured
    return username.trim() === 'admin' && password === 'admin';
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const hash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['admin_username', 'admin_password_hash']);
    
  if (error) throw error;
  if (!data || data.length < 2) return false;
  
  const dbUsername = data.find(item => item.key === 'admin_username')?.value;
  const dbHash = data.find(item => item.key === 'admin_password_hash')?.value;
  
  return dbUsername === username.trim() && dbHash === hash;
}

// ----------------------------------------------------
// Challenges
// ----------------------------------------------------

export async function getChallenges() {
  if (isDemoActive()) {
    initMockData();
    return JSON.parse(localStorage.getItem('MOCK_CHALLENGES'));
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function getActiveChallenge() {
  if (isDemoActive()) {
    initMockData();
    const list = JSON.parse(localStorage.getItem('MOCK_CHALLENGES'));
    return list.find(c => c.status === 'active') || null;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .maybeSingle();
    
  if (error) throw error;
  return data;
}

export async function createChallenge(name, startDate, endDate) {
  if (isDemoActive()) {
    initMockData();
    const list = JSON.parse(localStorage.getItem('MOCK_CHALLENGES'));
    list.forEach(c => c.status = 'finished');
    
    const newCh = {
      id: 'c_' + Date.now(),
      name,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      created_at: new Date().toISOString()
    };
    list.push(newCh);
    localStorage.setItem('MOCK_CHALLENGES', JSON.stringify(list));
    return newCh;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  // 1. Mark all existing challenges as finished
  const { error: finishError } = await supabase
    .from('challenges')
    .update({ status: 'finished' })
    .eq('status', 'active');
    
  if (finishError) throw finishError;
  
  // 2. Insert new active challenge
  const { data, error } = await supabase
    .from('challenges')
    .insert([{
      name,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    }])
    .select();
    
  if (error) throw error;
  return data[0];
}

export async function finishChallenge(challengeId) {
  if (isDemoActive()) {
    initMockData();
    const list = JSON.parse(localStorage.getItem('MOCK_CHALLENGES'));
    const ch = list.find(c => c.id === challengeId);
    if (ch) ch.status = 'finished';
    localStorage.setItem('MOCK_CHALLENGES', JSON.stringify(list));
    return ch;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const { data, error } = await supabase
    .from('challenges')
    .update({ status: 'finished' })
    .eq('id', challengeId)
    .select();
    
  if (error) throw error;
  return data[0];
}

// ----------------------------------------------------
// Participants
// ----------------------------------------------------

export async function getParticipants() {
  if (isDemoActive()) {
    initMockData();
    return JSON.parse(localStorage.getItem('MOCK_PARTICIPANTS'));
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) throw error;
  return data;
}

export async function createParticipant(name) {
  if (isDemoActive()) {
    initMockData();
    const list = JSON.parse(localStorage.getItem('MOCK_PARTICIPANTS'));
    
    if (list.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('unique constraint error: participant exists');
    }
    
    const newP = {
      id: 'p_' + Date.now(),
      name: name.trim(),
      created_at: new Date().toISOString()
    };
    list.push(newP);
    localStorage.setItem('MOCK_PARTICIPANTS', JSON.stringify(list));
    return newP;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  const { data, error } = await supabase
    .from('participants')
    .insert([{ name }])
    .select();
    
  if (error) throw error;
  return data[0];
}

// ----------------------------------------------------
// Activities
// ----------------------------------------------------

export async function logActivity({ challengeId, participantId, type, amount, duration, validatorId, date }) {
  if (isDemoActive()) {
    initMockData();
    const list = JSON.parse(localStorage.getItem('MOCK_ACTIVITIES'));
    
    let pace = null;
    if (type === 'running' && duration > 0) {
      pace = parseFloat(((duration / 60) / amount).toFixed(2));
    }
    
    const newA = {
      id: 'a_' + Date.now(),
      challenge_id: challengeId,
      participant_id: participantId,
      type,
      amount: parseFloat(amount),
      duration: type === 'running' ? parseInt(duration) : null,
      pace,
      validator_id: type === 'pushup' ? validatorId : null,
      status: 'approved',
      date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    list.push(newA);
    localStorage.setItem('MOCK_ACTIVITIES', JSON.stringify(list));
    return newA;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  if (!challengeId) throw new Error('O ID do Desafio é obrigatório.');
  
  let pace = null;
  if (type === 'running' && duration > 0) {
    pace = parseFloat(((duration / 60) / amount).toFixed(2));
  }
  
  const payload = {
    challenge_id: challengeId,
    participant_id: participantId,
    type,
    amount: parseFloat(amount),
    duration: type === 'running' ? parseInt(duration) : null,
    pace,
    validator_id: type === 'pushup' ? validatorId : null,
    status: 'approved',
    date: date || new Date().toISOString().split('T')[0]
  };
  
  const { data, error } = await supabase
    .from('activities')
    .insert([payload])
    .select();
    
  if (error) throw error;
  return data[0];
}

export async function getRecentActivities(challengeId, limit = 30) {
  if (isDemoActive()) {
    initMockData();
    let list = JSON.parse(localStorage.getItem('MOCK_ACTIVITIES'));
    const participants = JSON.parse(localStorage.getItem('MOCK_PARTICIPANTS'));
    
    if (challengeId) {
      list = list.filter(a => a.challenge_id === challengeId);
    }
    
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    list = list.slice(0, limit);
    
    list.forEach(a => {
      a.participant = { name: participants.find(p => p.id === a.participant_id)?.name || 'Deletado' };
      if (a.validator_id) {
        a.validator = { name: participants.find(p => p.id === a.validator_id)?.name || '' };
      }
    });
    
    return list;
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  
  let query = supabase
    .from('activities')
    .select(`
      *,
      participant:participants!activities_participant_id_fkey(name),
      validator:participants!activities_validator_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }
    
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ----------------------------------------------------
// Rankings / Stats
// ----------------------------------------------------

export async function getRankings(challengeId) {
  if (isDemoActive()) {
    initMockData();
    if (!challengeId) {
      return {
        pushupsRanking: [],
        runningRanking: [],
        stats: { totalPushups: 0, totalDistance: 0, participantsCount: 0 }
      };
    }
    
    const participants = JSON.parse(localStorage.getItem('MOCK_PARTICIPANTS'));
    const activities = JSON.parse(localStorage.getItem('MOCK_ACTIVITIES'))
      .filter(a => a.challenge_id === challengeId && a.status === 'approved');
      
    const rankingMap = {};
    participants.forEach(p => {
      rankingMap[p.id] = {
        id: p.id,
        name: p.name,
        pushups: 0,
        runningDistance: 0,
        runningDuration: 0,
        runCount: 0,
        bestPace: null
      };
    });
    
    activities.forEach(act => {
      const userStats = rankingMap[act.participant_id];
      if (!userStats) return;
      
      if (act.type === 'pushup') {
        userStats.pushups += act.amount;
      } else if (act.type === 'running') {
        userStats.runningDistance += act.amount;
        userStats.runningDuration += act.duration || 0;
        userStats.runCount += 1;
        
        if (act.pace) {
          if (userStats.bestPace === null || act.pace < userStats.bestPace) {
            userStats.bestPace = act.pace;
          }
        }
      }
    });
    
    const pushupsRanking = Object.values(rankingMap).sort((a, b) => b.pushups - a.pushups);
    const runningRanking = Object.values(rankingMap).sort((a, b) => b.runningDistance - a.runningDistance);
    
    const totalPushups = activities
      .filter(a => a.type === 'pushup')
      .reduce((sum, a) => sum + a.amount, 0);
      
    const totalDistance = activities
      .filter(a => a.type === 'running')
      .reduce((sum, a) => sum + a.amount, 0);
      
    return {
      pushupsRanking,
      runningRanking,
      stats: {
        totalPushups,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        participantsCount: participants.length
      }
    };
  }
  
  if (!supabase) throw new Error('Supabase client not configured.');
  if (!challengeId) {
    return {
      pushupsRanking: [],
      runningRanking: [],
      stats: { totalPushups: 0, totalDistance: 0, participantsCount: 0 }
    };
  }
  
  // Get all participants
  const participants = await getParticipants();
  
  // Get all approved activities for this challenge
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('status', 'approved');
    
  if (error) throw error;
  
  // Initialize scores map
  const rankingMap = {};
  participants.forEach(p => {
    rankingMap[p.id] = {
      id: p.id,
      name: p.name,
      pushups: 0,
      runningDistance: 0,
      runningDuration: 0,
      runCount: 0,
      bestPace: null
    };
  });
  
  // Aggregate activities
  activities.forEach(act => {
    const userStats = rankingMap[act.participant_id];
    if (!userStats) return; // In case participant was deleted
    
    if (act.type === 'pushup') {
      userStats.pushups += act.amount;
    } else if (act.type === 'running') {
      userStats.runningDistance += act.amount;
      userStats.runningDuration += act.duration || 0;
      userStats.runCount += 1;
      
      if (act.pace) {
        if (userStats.bestPace === null || act.pace < userStats.bestPace) {
          userStats.bestPace = act.pace;
        }
      }
    }
  });
  
  // Convert map to arrays and sort
  const pushupsRanking = Object.values(rankingMap)
    .sort((a, b) => b.pushups - a.pushups);
    
  const runningRanking = Object.values(rankingMap)
    .sort((a, b) => b.runningDistance - a.runningDistance);
    
  // Overall statistics
  const totalPushups = activities
    .filter(a => a.type === 'pushup')
    .reduce((sum, a) => sum + a.amount, 0);
    
  const totalDistance = activities
    .filter(a => a.type === 'running')
    .reduce((sum, a) => sum + a.amount, 0);
    
  return {
    pushupsRanking,
    runningRanking,
    stats: {
      totalPushups,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      participantsCount: participants.length
    }
  };
}

// Subscribe to database changes (realtime integration)
export function subscribeToChanges(callback) {
  if (isDemoActive()) return null; // No server events in demo mode
  if (!supabase) return null;
  
  return supabase
    .channel('fitness-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, callback)
    .subscribe();
}
