import { API_BASE_URL } from '/assets/js/config.js';
import { supabase } from '/assets/js/supabaseClient.js';

const formState = {
  nickname: { valid: false, checked: false },
  first_name: { valid: false, checked: false }
};

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const checkNicknameAvailability = debounce(async (nickname) => {
  nickname = nickname.toLowerCase();

  if (!nickname || nickname.length < 4 || /\s/.test(nickname) || !/^[a-z0-9]+$/.test(nickname)) {
    updateInputStatus('nickname', 'invalid');
    showError('nicknameError', 'Nickname must be 4-32 characters, lowercase letters/numbers only, no spaces');
    formState.nickname.valid = false;
    updateSubmitButton();
    return;
  }

  document.getElementById('nickname').value = nickname;
  updateInputStatus('nickname', 'checking');

  try {
    const response = await fetch(`${API_BASE_URL}/check-nickname?nickname=${encodeURIComponent(nickname)}`);
    const result = await response.json();

    if (result.available) {
      updateInputStatus('nickname', 'valid');
      hideError('nicknameError');
      formState.nickname.valid = true;
    } else {
      updateInputStatus('nickname', 'invalid');
      showError('nicknameError', result.message || 'This nickname is not available');
      formState.nickname.valid = false;
    }
  } catch (error) {
    updateInputStatus('nickname', 'invalid');
    showError('nicknameError', 'Could not verify nickname availability');
    formState.nickname.valid = false;
  }

  formState.nickname.checked = true;
  updateSubmitButton();
}, 500);

function updateInputStatus(fieldId, status) {
  const statusElement = document.getElementById(`${fieldId}Status`);
  if (statusElement) {
    statusElement.className = 'input-status';
    statusElement.classList.add(`status-${status}`);
  }
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function showStatus(message, isError = false) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status ${isError ? 'error' : 'success'}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateSubmitButton() {
  const btn = document.getElementById('submitButton');
  btn.disabled = !(formState.nickname.valid && formState.first_name.valid);
}

async function checkAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      showStatus('You must be logged in to create a profile.', true);
      setTimeout(() => window.location.href = '/login', 2000);
      return null;
    }
    return data.session;
  } catch (error) {
    showStatus('Authentication error. Please try again.', true);
    return null;
  }
}

async function loadCountries() {
  try {
    const response = await fetch('/assets/data/countries_list.json');
    const countries = await response.json();
    const select = document.getElementById('location');
    countries.forEach(c => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      select.appendChild(option);
    });
  } catch (e) {
    showStatus('Could not load territories list', true);
  }
}

async function initForm() {
  await checkAuth();
  await loadCountries();

  const nickname = document.getElementById('nickname');
  nickname.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '');
    e.target.value = val;
    checkNicknameAvailability(val);
  });

  const firstName = document.getElementById('first_name');
  firstName.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    formState.first_name.checked = true;
    if (!val) {
      showError('first_nameError', 'First name is required');
      formState.first_name.valid = false;
    } else if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s\-']+$/.test(val)) {
      showError('first_nameError', 'First name contains invalid characters');
      formState.first_name.valid = false;
    } else {
      hideError('first_nameError');
      formState.first_name.valid = true;
    }
    updateSubmitButton();
  });

  document.getElementById('second_name').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val && !/^[a-zA-Z]+$/.test(val)) {
      showError('second_nameError', 'Family name must contain only letters');
    } else {
      hideError('second_nameError');
    }
  });
}

document.getElementById('profileForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  document.getElementById('status').style.display = 'none';

  const nickname = document.getElementById('nickname').value.trim();
  const firstName = document.getElementById('first_name').value.trim();
  const secondName = document.getElementById('second_name').value.trim();
  const location = document.getElementById('location').value;
  const currency = document.getElementById('currency').value;

  const session = await checkAuth();
  if (!session) return;

  const formData = {
    nickname,
    first_name: firstName || null,
    second_name: secondName || null,
    location,
    currency,
    user_id: session.user.id
  };

  const submitBtn = document.getElementById('submitButton');
  const loading = document.getElementById('loadingIndicator');
  submitBtn.disabled = true;
  loading.classList.remove('hidden');
  submitBtn.textContent = ' Creating Profile...';
  submitBtn.prepend(loading);

  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(formData)
    });

    let result;
    try {
      result = await response.json();
    } catch {
      result = { detail: 'Could not parse server response' };
    }

    if (response.ok) {
      showStatus(`Welcome to the Empire, ${result.nickname || 'Citizen'}! Redirecting...`);
      setTimeout(() => window.location.href = '/domus', 2000);
    } else {
      let msg = 'Something went wrong';
      if (result?.detail) {
        if (typeof result.detail === 'object' && result.detail.message) {
          msg = result.detail.message;
        } else {
          msg = result.detail;
        }
      }
      showStatus(`Error: ${msg}`, true);
    }
  } catch (err) {
    showStatus(`Request failed: ${err.message}`, true);
  } finally {
    submitBtn.disabled = false;
    loading.classList.add('hidden');
    submitBtn.textContent = 'Create Profile';
  }
});

document.addEventListener('DOMContentLoaded', initForm);
