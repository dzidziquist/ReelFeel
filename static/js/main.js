/* ── Star display ───────────────────────────────────────────────────── */
document.querySelectorAll('.star-display').forEach(el => {
  const rating = parseFloat(el.dataset.rating || 0);
  el.innerHTML = buildStarHTML(rating);
});

function buildStarHTML(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span class="text-yellow-400">★</span>';
    } else if (rating >= i - 0.5) {
      // half star via gradient trick
      html += '<span style="background: linear-gradient(90deg,#facc15 50%,#4b5563 50%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">★</span>';
    } else {
      html += '<span class="text-gray-600">★</span>';
    }
  }
  return html;
}

/* ── Star picker (add/edit entry form) ──────────────────────────────── */
const starPicker = document.getElementById('star-picker');
const ratingInput = document.getElementById('rating-input');

if (starPicker && ratingInput) {
  const buttons = starPicker.querySelectorAll('.star-btn');

  // Initialise from existing value
  syncStarPicker(parseFloat(ratingInput.value) || 0);

  buttons.forEach(btn => {
    const val = parseInt(btn.dataset.value);

    btn.addEventListener('click', () => {
      const current = parseFloat(ratingInput.value) || 0;
      // click same star twice → half star
      const newVal = (current === val) ? val - 0.5 : val;
      ratingInput.value = newVal;
      syncStarPicker(newVal);
    });

    btn.addEventListener('mouseenter', () => syncStarPicker(parseInt(btn.dataset.value), true));
    btn.addEventListener('mouseleave', () => syncStarPicker(parseFloat(ratingInput.value) || 0));
  });

  ratingInput.addEventListener('input', () => {
    syncStarPicker(parseFloat(ratingInput.value) || 0);
  });
}

function syncStarPicker(rating, hover = false) {
  if (!starPicker) return;
  starPicker.querySelectorAll('.star-btn').forEach(btn => {
    const val = parseInt(btn.dataset.value);
    if (rating >= val) {
      btn.classList.remove('text-gray-600');
      btn.classList.add('text-yellow-400');
    } else if (rating >= val - 0.5) {
      btn.classList.remove('text-gray-600');
      btn.classList.add('text-yellow-300');
    } else {
      btn.classList.remove('text-yellow-400', 'text-yellow-300');
      btn.classList.add('text-gray-600');
    }
  });
}

/* ── Emotion pill toggle ─────────────────────────────────────────────── */
document.querySelectorAll('.emotion-pill').forEach(pill => {
  const checkbox = pill.querySelector('input[type="checkbox"]');
  const span = pill.querySelector('span');
  const activeBg = span.dataset.activeBg;
  const activeBorder = span.dataset.activeBorder;
  const activeColor = span.dataset.activeColor;

  function applyState() {
    if (checkbox.checked) {
      span.style.backgroundColor = activeBg;
      span.style.borderColor = activeBorder;
      span.style.color = activeColor;
      span.style.fontWeight = '600';
    } else {
      span.style.backgroundColor = '';
      span.style.borderColor = activeBorder + '55';
      span.style.color = activeColor + 'aa';
      span.style.fontWeight = '';
    }
  }

  applyState();
  checkbox.addEventListener('change', applyState);
  // Allow clicking the span itself to toggle
  span.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    applyState();
  });
});
