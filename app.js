// Final Project - COP 5818
// Team 7
// Henry Gibson-Garcia – henry.gibson@ucf.edu
// Katherine Mendez Zambrano – ka523884@ucf.edu

// app.js
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  addExpense,
  getSpendingByCategory,
  getSpendingByEmotion,
  getExpenses,
  updateExpense
} from './emotispendApi.js';


/* ============================
   DOM ELEMENTS
============================ */
const authStatus = document.getElementById('auth-status');
const signOutBtn = document.getElementById('signout-btn');
const loginForm = document.getElementById('login-form');

const expenseSection = document.getElementById('expense-section');
const dashboardSection = document.getElementById('dashboard-section');

const expenseForm = document.getElementById('expense-form');
const expenseStatus = document.getElementById('expense-status');

// Step containers for the expense flow
const stepCategoryAmount = document.getElementById('step-category-amount');
const stepValence = document.getElementById('step-valence');
const stepEmotion = document.getElementById('step-emotion');
const stepIntensity = document.getElementById('step-intensity');

// Controls for each step
const categoryButtonsContainer = document.getElementById('category-buttons');
const amountInput = document.getElementById('amount');
const amountSlider = document.getElementById('amount-slider');
const valenceButtonsContainer = document.getElementById('valence-buttons');
const emotionButtonsContainer = document.getElementById('emotion-buttons');

const intensitySlider = document.getElementById('intensity');
const intensityValue = document.getElementById('intensityValue');
const emojiDisplay = document.getElementById('emojiDisplay');

// Summary elements that show current selections
const summaryAmount = document.getElementById('summary-amount');
const summaryAmountValue = document.getElementById('summary-amount-value');
const editAmountBtn = document.getElementById('edit-amount-btn');

const summaryCategory = document.getElementById('summary-category');
const summaryCategoryValue = document.getElementById('summary-category-value');
const editCategoryBtn = document.getElementById('edit-category-btn');

const summaryValence = document.getElementById('summary-valence');
const summaryValenceValue = document.getElementById('summary-valence-value');
const editValenceBtn = document.getElementById('edit-valence-btn');

const summaryEmotion = document.getElementById('summary-emotion');
const summaryEmotionValue = document.getElementById('summary-emotion-value');
const editEmotionBtn = document.getElementById('edit-emotion-btn');

// In-memory state for the current expense being created
let selectedAmount = null;
let selectedCategory = null;
let selectedValence = null;
let selectedEmotion = null;

// Transactions table elements (dashboard)
const transactionsSection = document.getElementById('transactions-section');
const transactionsTableBody = document.querySelector('#transactions-table tbody');
const transactionsFilterLabel = document.getElementById('transactions-filter-label');
const viewAllTransactionsBtn = document.getElementById('view-all-transactions-btn');

let allExpenses = []; // cache of expenses for table/filter/sort
let currentFilter = null; // { type: 'category' | 'emotion' | null, value: string | null }
let currentSort = { key: 'spent_at', direction: 'desc' }; // default sort by latest


/* ============================
   DATA (plain names; UI adds emojis)
============================ */
const emotions = {
  Good: [
    "Rewarded",
    "Goal Driven",
    "Proud",
    "Relieved",
    "Connected",
    "Excited",
    "Peaceful"
  ],
  Bad: [
    "Stressed",
    "Anxious",
    "Bored",
    "Lonely",
    "Guilty",
    "Overwhelmed",
    "Impulsive"
  ]
};


/* ============================
   UTILITIES
============================ */
// Map plain emotion name to label with emoji for the UI
function emotionLabelWithEmoji(name) {
  switch (name) {
    case "Rewarded": return "Rewarded 😃";
    case "Goal Driven": return "Goal Driven 🎯";
    case "Proud": return "Proud 🏆";
    case "Relieved": return "Relieved 😌";
    case "Connected": return "Connected 🤝";
    case "Excited": return "Excited 🤩";
    case "Peaceful": return "Peaceful 🕊️";
    case "Stressed": return "Stressed 😫";
    case "Anxious": return "Anxious 😟";
    case "Bored": return "Bored 😐";
    case "Lonely": return "Lonely 😔";
    case "Guilty": return "Guilty 😳";
    case "Overwhelmed": return "Overwhelmed 😵";
    case "Impulsive": return "Impulsive ⚡";
    default: return name;
  }
}

// Normalize emotion keys so charts do not get duplicates
function normalizeEmotionKey(key) {
  const base = (key || "").replace(/[^\w\s-]/g, "").trim();

  const known = new Set([
    "Rewarded","Goal Driven","Proud","Relieved","Connected",
    "Excited","Peaceful","Stressed","Anxious","Bored",
    "Lonely","Guilty","Overwhelmed","Impulsive"
  ]);
  if (known.has(base)) return base;

  const parts = base.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    const single = parts[i];
    if (known.has(single)) return single;
    if (i + 1 < parts.length) {
      const pair = `${parts[i]} ${parts[i+1]}`;
      if (known.has(pair)) return pair;
    }
  }
  return parts[0] || base || key;
}

// Combine emotion totals using normalized keys
function aggregateEmotionTotals(rawTotals) {
  const aggregated = {};
  for (const [key, value] of Object.entries(rawTotals || {})) {
    const normalized = normalizeEmotionKey(key);
    aggregated[normalized] = (aggregated[normalized] || 0) + Number(value || 0);
  }
  return aggregated;
}

// Small helpers for showing and hiding steps
function showStep(stepEl) {
  if (stepEl) stepEl.style.display = 'block';
}

function hideStep(stepEl) {
  if (stepEl) stepEl.style.display = 'none';
}

// When editing an earlier step, clear later selections and UI
function clearSelectionsFrom(stepName) {
  if (stepName === 'amountOrCategory') {
    // We are re-deciding the basics, so clear valence and emotion
    selectedValence = null;
    selectedEmotion = null;

    hideStep(stepValence);
    hideStep(stepEmotion);
    hideStep(stepIntensity);

    if (summaryValence) summaryValence.style.display = 'none';
    if (summaryEmotion) summaryEmotion.style.display = 'none';
  } else if (stepName === 'valence') {
    // Keep amount and category, but clear emotion
    selectedEmotion = null;

    hideStep(stepEmotion);
    hideStep(stepIntensity);

    if (summaryEmotion) summaryEmotion.style.display = 'none';
  } else if (stepName === 'emotion') {
    selectedEmotion = null;

    hideStep(stepIntensity);
    if (summaryEmotion) summaryEmotion.style.display = 'none';
  }
}

// Reset the whole expense flow to the starting state
function resetExpenseFlow() {
  selectedAmount = null;
  selectedCategory = null;
  selectedValence = null;
  selectedEmotion = null;

  if (expenseForm) expenseForm.reset();

  if (amountSlider) amountSlider.value = 0;
  if (amountInput) amountInput.value = '';

  if (intensitySlider) intensitySlider.value = 50;
  if (intensityValue) intensityValue.textContent = 50;
  if (emojiDisplay) {
    emojiDisplay.textContent = '😊';
    emojiDisplay.style.color = 'green';
  }

  if (summaryAmount) summaryAmount.style.display = 'none';
  if (summaryCategory) summaryCategory.style.display = 'none';
  if (summaryValence) summaryValence.style.display = 'none';
  if (summaryEmotion) summaryEmotion.style.display = 'none';

  showStep(stepCategoryAmount);
  hideStep(stepValence);
  hideStep(stepEmotion);
  hideStep(stepIntensity);

  if (categoryButtonsContainer) {
    categoryButtonsContainer.querySelectorAll('button').forEach(b =>
      b.classList.remove('selected')
    );
  }
  if (valenceButtonsContainer) {
    valenceButtonsContainer.querySelectorAll('button').forEach(b =>
      b.classList.remove('selected')
    );
  }
  if (emotionButtonsContainer) {
    emotionButtonsContainer.innerHTML = '';
  }

  if (expenseStatus) expenseStatus.textContent = '';
}


/* ============================
   INIT
============================ */
window.addEventListener('DOMContentLoaded', init);

// On load, check if a user is logged in and set the UI
async function init() {
  try {
    const user = await getCurrentUser();
    if (user) {
      setAuthenticatedUI(user);
      await renderDashboard();
    } else {
      setUnauthenticatedUI();
    }
  } catch (err) {
    authStatus.textContent = `Init error: ${err.message || err}`;
  }
}


/* ============================
   UI STATE
============================ */
// Show the app for a logged in user
function setAuthenticatedUI(user) {
  if (loginForm) loginForm.style.display = 'none';
  if (signOutBtn) signOutBtn.style.display = 'inline-block';
  authStatus.textContent = `Logged in as ${user.email}`;

  expenseSection.style.display = 'block';
  dashboardSection.style.display = 'block';

  resetExpenseFlow();
}

// Hide the app when no user is logged in
function setUnauthenticatedUI() {
  if (loginForm) loginForm.style.display = 'block';
  if (signOutBtn) signOutBtn.style.display = 'none';
  authStatus.textContent = 'Not logged in';

  expenseSection.style.display = 'none';
  dashboardSection.style.display = 'none';
}


/* ============================
   TRANSACTIONS TABLE
============================ */
// Render the transactions table with current filter and sort
function renderTransactionsTable() {
  if (!transactionsTableBody) return;

  let rows = [...allExpenses];

  // Filter by category or emotion if set
  if (currentFilter) {
    if (currentFilter.type === 'category') {
      rows = rows.filter(r => r.category === currentFilter.value);
    } else if (currentFilter.type === 'emotion') {
      rows = rows.filter(r => normalizeEmotionKey(r.emotion) === currentFilter.value);
    }
  }

  // Sort rows based on currentSort
  const { key, direction } = currentSort;
  rows.sort((a, b) => {
    let va = a[key];
    let vb = b[key];

    if (key === 'amount' || key === 'intensity') {
      va = Number(va) || 0;
      vb = Number(vb) || 0;
    } else if (key === 'spent_at') {
      va = new Date(va).getTime();
      vb = new Date(vb).getTime();
    } else {
      va = (va || '').toString().toLowerCase();
      vb = (vb || '').toString().toLowerCase();
    }

    if (va < vb) return direction === 'asc' ? -1 : 1;
    if (va > vb) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  transactionsTableBody.innerHTML = '';

  rows.forEach(exp => {
    const tr = document.createElement('tr');
    tr.dataset.id = exp.id;

    const dateText = exp.spent_at
      ? new Date(exp.spent_at).toLocaleString()
      : '';

    tr.innerHTML = `
      <td>${dateText}</td>
      <td>${exp.category || ''}</td>
      <td>${Number(exp.amount).toFixed(2)}</td>
      <td>${exp.valence || ''}</td>
      <td>${exp.emotion || ''}</td>
      <td>${exp.intensity ?? ''}</td>
      <td>${exp.note || ''}</td>
      <td><button class="edit-expense-btn">Edit</button></td>
    `;

    transactionsTableBody.appendChild(tr);
  });

  // Show or hide the section based on whether we have rows
  if (transactionsSection) {
    transactionsSection.style.display = rows.length ? 'block' : 'none';
  }

  // Update filter label text
  if (transactionsFilterLabel) {
    if (!rows.length) {
      transactionsFilterLabel.textContent = currentFilter
        ? 'No transactions match this filter.'
        : 'No transactions yet.';
    } else if (!currentFilter) {
      transactionsFilterLabel.textContent = 'Showing all transactions';
    } else if (currentFilter.type === 'category') {
      transactionsFilterLabel.textContent =
        `Showing transactions in category: ${currentFilter.value}`;
    } else if (currentFilter.type === 'emotion') {
      transactionsFilterLabel.textContent =
        `Showing transactions with emotion: ${emotionLabelWithEmoji(currentFilter.value)}`;
    }
  }
}

// Turn a table row into an inline edit form
function openEditRow(tr) {
  if (!tr) return;
  const id = tr.dataset.id;
  const exp = allExpenses.find(e => String(e.id) === String(id));
  if (!exp) return;

  const dateText = exp.spent_at
    ? new Date(exp.spent_at).toLocaleString()
    : '';

  tr.innerHTML = `
    <td>${dateText}</td>
    <td>
      <select class="edit-category">
        <option value="Food" ${exp.category === 'Food' ? 'selected' : ''}>Food</option>
        <option value="Transportation" ${exp.category === 'Transportation' ? 'selected' : ''}>Transportation</option>
        <option value="Entertainment" ${exp.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
        <option value="Other" ${exp.category === 'Other' ? 'selected' : ''}>Other</option>
      </select>
    </td>
    <td><input type="number" step="0.01" class="edit-amount" value="${Number(exp.amount)}"></td>
    <td>${exp.valence || ''}</td>
    <td><input type="text" class="edit-emotion" value="${exp.emotion || ''}"></td>
    <td><input type="number" min="0" max="100" class="edit-intensity" value="${exp.intensity ?? ''}"></td>
    <td><input type="text" class="edit-note" value="${exp.note || ''}"></td>
    <td>
      <button class="save-expense-btn">Save</button>
      <button class="cancel-expense-btn">Cancel</button>
    </td>
  `;
  tr.dataset.id = id;
}

// Save edits for a single row and refresh table and charts
async function saveEditedRow(tr) {
  if (!tr) return;
  const id = tr.dataset.id;
  const expIndex = allExpenses.findIndex(e => String(e.id) === String(id));
  if (expIndex === -1) return;

  const amountEl = tr.querySelector('.edit-amount');
  const categoryEl = tr.querySelector('.edit-category');
  const emotionEl = tr.querySelector('.edit-emotion');
  const intensityEl = tr.querySelector('.edit-intensity');
  const noteEl = tr.querySelector('.edit-note');

  const updatedFields = {
    amount: parseFloat(amountEl.value),
    category: categoryEl.value,
    emotion: normalizeEmotionKey(emotionEl.value),
    intensity: intensityEl.value === '' ? null : parseInt(intensityEl.value, 10),
    note: noteEl.value.trim()
  };

  if (isNaN(updatedFields.amount) || updatedFields.amount <= 0) {
    expenseStatus.textContent = 'Please enter a valid amount.';
    return;
  }

  try {
    const updated = await updateExpense(id, updatedFields);

    // Update local cache
    allExpenses[expIndex] = updated;

    expenseStatus.textContent = 'Transaction updated.';

    // Redraw table using the current filter and sort
    renderTransactionsTable();

    // Also refresh charts so aggregates match the updated data
    await renderDashboard();
  } catch (err) {
    expenseStatus.textContent = `Error updating expense: ${err.message || err}`;
  }
}


/* ============================
   TABLE EVENT HANDLERS
============================ */
// Handle click events inside the transactions table (edit / save / cancel)
if (transactionsTableBody) {
  transactionsTableBody.addEventListener('click', async (e) => {
    const btn = e.target;

    if (btn.classList.contains('edit-expense-btn')) {
      const tr = btn.closest('tr');
      openEditRow(tr);
    }

    if (btn.classList.contains('save-expense-btn')) {
      const tr = btn.closest('tr');
      await saveEditedRow(tr);
    }

    if (btn.classList.contains('cancel-expense-btn')) {
      renderTransactionsTable();
    }
  });
}


/* ============================
   AUTH EVENTS
============================ */
// Handle sign up
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  try {
    await signUp(email, password);
    authStatus.textContent = 'Sign up successful. Now sign in.';
  } catch (err) {
    authStatus.textContent = `Sign up error: ${err.message || err}`;
  }
});

// Handle sign in
document.getElementById('signin-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  try {
    const user = await signIn(email, password);
    setAuthenticatedUI(user.user);
    await renderDashboard();
  } catch (err) {
    authStatus.textContent = `Sign in error: ${err.message || err}`;
  }
});

// Handle sign out
signOutBtn.addEventListener('click', async () => {
  try {
    await signOut();
    setUnauthenticatedUI();
  } catch (err) {
    authStatus.textContent = `Sign out error: ${err.message || err}`;
  }
});


/* ============================
   UI EVENT WIRING
============================ */
// Keep amount input and slider in sync
if (amountSlider && amountInput) {
  amountSlider.addEventListener('input', () => {
    amountInput.value = amountSlider.value;
  });
  amountInput.addEventListener('input', () => {
    if (amountInput.value !== '') {
      amountSlider.value = amountInput.value;
    }
  });
}

// Step 1: clicking a category confirms amount + category
if (categoryButtonsContainer) {
  categoryButtonsContainer.querySelectorAll('button[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(amountInput.value);
      if (isNaN(amount) || amount <= 0) {
        expenseStatus.textContent = 'Please enter a valid amount before continuing.';
        return;
      }

      expenseStatus.textContent = '';
      selectedAmount = amount;
      selectedCategory = btn.getAttribute('data-category');

      categoryButtonsContainer.querySelectorAll('button').forEach(b =>
        b.classList.remove('selected')
      );
      btn.classList.add('selected');

      summaryAmountValue.textContent = `$${amount.toFixed(2)}`;
      summaryCategoryValue.textContent = btn.textContent;
      summaryAmount.style.display = 'flex';
      summaryCategory.style.display = 'flex';

      hideStep(stepCategoryAmount);
      showStep(stepValence);
    });
  });
}

// Edit amount: reopen step 1 using stored amount/category
if (editAmountBtn) {
  editAmountBtn.addEventListener('click', () => {
    clearSelectionsFrom('amountOrCategory');

    if (selectedAmount !== null) {
      amountInput.value = selectedAmount;
      amountSlider.value = selectedAmount;
    }
    if (selectedCategory && categoryButtonsContainer) {
      categoryButtonsContainer.querySelectorAll('button').forEach(b => {
        if (b.getAttribute('data-category') === selectedCategory) {
          b.classList.add('selected');
        } else {
          b.classList.remove('selected');
        }
      });
    }

    showStep(stepCategoryAmount);
  });
}

// Edit category: similar to amount, but focused on category choice
if (editCategoryBtn) {
  editCategoryBtn.addEventListener('click', () => {
    clearSelectionsFrom('amountOrCategory');

    if (selectedAmount !== null) {
      amountInput.value = selectedAmount;
      amountSlider.value = selectedAmount;
    }

    if (selectedCategory && categoryButtonsContainer) {
      categoryButtonsContainer.querySelectorAll('button').forEach(b => {
        if (b.getAttribute('data-category') === selectedCategory) {
          b.classList.add('selected');
        } else {
          b.classList.remove('selected');
        }
      });
    }

    showStep(stepCategoryAmount);
  });
}


/* ============================
   EMOTION SELECT (via buttons)
============================ */
// Build emotion buttons for the chosen valence
function populateEmotions(valence) {
  if (!emotionButtonsContainer) return;
  emotionButtonsContainer.innerHTML = '';
  selectedEmotion = null;
  hideStep(stepIntensity);

  (emotions[valence] || []).forEach(emotion => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emotionLabelWithEmoji(emotion);
    btn.addEventListener('click', () => {
      selectedEmotion = emotion;

      emotionButtonsContainer.querySelectorAll('button').forEach(b =>
        b.classList.remove('selected')
      );
      btn.classList.add('selected');

      summaryEmotionValue.textContent = btn.textContent;
      summaryEmotion.style.display = 'flex';

      hideStep(stepEmotion);
      showStep(stepIntensity);
    });
    emotionButtonsContainer.appendChild(btn);
  });
}

// Step 2: handle valence selection
if (valenceButtonsContainer) {
  valenceButtonsContainer.querySelectorAll('button[data-valence]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedValence = btn.getAttribute('data-valence');

      // default emoji based on valence
      if (selectedValence === 'Bad') {
        emojiDisplay.textContent = "😐";
        emojiDisplay.style.color = "gray";
      } else {
        emojiDisplay.textContent = "😊";
        emojiDisplay.style.color = "green";
      }

      // highlight selected
      valenceButtonsContainer.querySelectorAll('button').forEach(b =>
        b.classList.remove('selected')
      );
      btn.classList.add('selected');

      // show summary
      summaryValenceValue.textContent = btn.textContent;
      summaryValence.style.display = 'flex';

      // load emotion buttons
      populateEmotions(selectedValence);

      hideStep(stepValence);
      showStep(stepEmotion);
    });
  });
}

// Edit valence: reopen valence step and keep previous choice highlighted
if (editValenceBtn) {
  editValenceBtn.addEventListener('click', () => {
    clearSelectionsFrom('valence');

    if (selectedValence && valenceButtonsContainer) {
      valenceButtonsContainer.querySelectorAll('button').forEach(b => {
        if (b.getAttribute('data-valence') === selectedValence) {
          b.classList.add('selected');
        } else {
          b.classList.remove('selected');
        }
      });
    }

    showStep(stepValence);
  });
}

// Edit emotion: reopen emotion step and rebuild emotion buttons
if (editEmotionBtn) {
  editEmotionBtn.addEventListener('click', () => {
    clearSelectionsFrom('emotion');
    if (selectedValence) {
      populateEmotions(selectedValence);
    }
    showStep(stepEmotion);
  });
}

// View all transactions (clear filter)
if (viewAllTransactionsBtn) {
  viewAllTransactionsBtn.addEventListener('click', () => {
    currentFilter = null;
    renderTransactionsTable();
  });
}

// Allow sorting by clicking on table headers
const transactionsTable = document.getElementById('transactions-table');

if (transactionsTable) {
  transactionsTable.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;

      if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.direction = key === 'spent_at' ? 'desc' : 'asc';
      }

      renderTransactionsTable();
    });
  });
}


/* ============================
   EXPENSE SUBMIT
============================ */
// Handle final submit of the expense
if (expenseForm) {
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);

    if (!selectedCategory) {
      expenseStatus.textContent = 'Please choose a category.';
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      expenseStatus.textContent = 'Please enter a valid amount.';
      return;
    }
    if (!selectedValence) {
      expenseStatus.textContent = 'Please tell us whether you felt good or bad.';
      return;
    }
    if (!selectedEmotion) {
      expenseStatus.textContent = 'Please choose a specific emotion.';
      return;
    }

    const payload = {
      amount,
      category: selectedCategory,
      valence: selectedValence,
      emotion: normalizeEmotionKey(selectedEmotion),
      intensity: parseInt(intensitySlider.value, 10),
      note: document.getElementById('note').value.trim()
    };

    try {
      await addExpense(payload);
      expenseStatus.textContent = 'Expense added!';
      await renderDashboard();
      resetExpenseFlow();
    } catch (err) {
      expenseStatus.textContent = `Error adding expense: ${err.message || err}`;
    }
  });
}


/* ============================
   INTENSITY SLIDER (valence-aware)
============================ */
if (intensitySlider && intensityValue && emojiDisplay) {
  intensitySlider.addEventListener('input', () => {
    const val = Number(intensitySlider.value);
    intensityValue.textContent = val;

    let emoji;
    let color;

    // Use different scales for Good vs Bad emotions
    if (selectedValence === 'Good') {
      if (val < 20) { emoji = "🙂"; color = "gray"; }
      else if (val < 40) { emoji = "😊"; color = "blue"; }
      else if (val < 60) { emoji = "😄"; color = "green"; }
      else if (val < 80) { emoji = "🤩"; color = "purple"; }
      else { emoji = "🔥"; color = "red"; }
    } else if (selectedValence === 'Bad') {
      if (val < 20) { emoji = "😐"; color = "gray"; }
      else if (val < 40) { emoji = "😕"; color = "blue"; }
      else if (val < 60) { emoji = "😟"; color = "orange"; }
      else if (val < 80) { emoji = "😫"; color = "purple"; }
      else { emoji = "😭"; color = "red"; }
    } else {
    // Default based on valence selection
      if (selectedValence === 'Bad') {
        emoji = "😐";
        color = "gray";
      } else {
        emoji = "😊";
        color = "green";
      }
    }


    emojiDisplay.textContent = emoji;
    emojiDisplay.style.color = color;

    emojiDisplay.classList.add("bounce");
    setTimeout(() => emojiDisplay.classList.remove("bounce"), 200);
  });
}

/* ============================
   LEGEND BUILDER
============================ */
// Build a custom legend for the charts
function buildLegend(containerId, labels, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  labels.forEach((label, i) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = colors[i % colors.length];

    const text = document.createElement('span');
    text.textContent = label;

    item.appendChild(colorBox);
    item.appendChild(text);
    container.appendChild(item);
  });
}


/* ============================
   DASHBOARD (Chart.js)
============================ */
// Pull totals from Supabase and draw both charts
async function renderDashboard() {
  try {
    const categoryTotals = await getSpendingByCategory() || {};
    const rawEmotionTotals = await getSpendingByEmotion() || {};
    const emotionTotals = aggregateEmotionTotals(rawEmotionTotals);

    // Load full expense list for the transactions table
    allExpenses = await getExpenses();
    renderTransactionsTable();

    // Destroy old charts if present
    if (window.categoryChartInstance) window.categoryChartInstance.destroy();
    if (window.emotionChartInstance) window.emotionChartInstance.destroy();

    const categoryKeys = Object.keys(categoryTotals);
    const categoryLabels = categoryKeys.map(cat => {
      switch (cat) {
        case "Food": return "Food 🍔";
        case "Transportation": return "Transportation 🚗";
        case "Entertainment": return "Entertainment 🎬";
        case "Other": return "Other 🛒";
        default: return cat;
      }
    });
    const categoryData = Object.values(categoryTotals);

    const emotionBaseLabels = Object.keys(emotionTotals);
    const emotionLabels = emotionBaseLabels.map(emotionLabelWithEmoji);
    const emotionData = emotionBaseLabels.map(name => emotionTotals[name]);

    const vibrantColors = [
      '#FF6F61',
      '#FFCE54',
      '#4FC1E9',
      '#AC92EC',
      '#FCB69F',
      '#FFECD2',
      '#FF9F40',
      '#36A2EB'
    ];

    // Category chart
    const categoryCanvas = document.getElementById('categoryChart');
    const categoryCtx = categoryCanvas.getContext('2d');
    window.categoryChartInstance = new Chart(categoryCtx, {
      type: 'pie',
      data: {
        labels: categoryLabels,
        datasets: [{
          label: 'Spending by Category',
          data: categoryData,
          backgroundColor: vibrantColors.slice(0, Math.max(categoryLabels.length, 1))
        }]
      },
      options: {
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000,
          easing: 'easeOutCubic'
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Clicking a category slice filters the transactions table by that category
    categoryCanvas.onclick = (evt) => {
      const points = window.categoryChartInstance.getElementsAtEventForMode(
        evt,
        'nearest',
        { intersect: true },
        true
      );
      if (!points.length) return;

      const idx = points[0].index;
      const categoryKey = categoryKeys[idx];

      currentFilter = { type: 'category', value: categoryKey };
      renderTransactionsTable();
    };

    buildLegend(
      'categoryLegend',
      window.categoryChartInstance.data.labels,
      window.categoryChartInstance.data.datasets[0].backgroundColor
    );

    // Emotion chart
    const emotionCanvas = document.getElementById('emotionChart');
    const emotionCtx = emotionCanvas.getContext('2d');
    window.emotionChartInstance = new Chart(emotionCtx, {
      type: 'pie',
      data: {
        labels: emotionLabels,
        datasets: [{
          label: 'Spending by Emotion',
          data: emotionData,
          backgroundColor: vibrantColors.slice(0, Math.max(emotionLabels.length, 1))
        }]
      },
      options: {
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000,
          easing: 'easeOutCubic'
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Clicking an emotion slice filters the transactions table by that emotion
    emotionCanvas.onclick = (evt) => {
      const points = window.emotionChartInstance.getElementsAtEventForMode(
        evt,
        'nearest',
        { intersect: true },
        true
      );
      if (!points.length) return;

      const idx = points[0].index;
      const emotionKey = emotionBaseLabels[idx];

      currentFilter = { type: 'emotion', value: emotionKey };
      renderTransactionsTable();
    };

    buildLegend(
      'emotionLegend',
      window.emotionChartInstance.data.labels,
      window.emotionChartInstance.data.datasets[0].backgroundColor
    );
  } catch (err) {
    console.error(err);
    expenseStatus.textContent = `Dashboard error: ${err.message || err}`;
  }
}
