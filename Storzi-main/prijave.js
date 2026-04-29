// prijave.js — vključi v index.html z <script src="prijave.js"></script>
// (postavi PRED posts.js)

const WORKER_URL = 'https://storzi.tommybeast8.workers.dev';

// Naloži prijave za en izlet in vrni seznam
async function naloziPrijave(izletId) {
  try {
    const res = await fetch(`${WORKER_URL}/prijave?izlet=${izletId}`);
    const data = await res.json();
    return data.prijave || [];
  } catch {
    return [];
  }
}

// Prijavi ime na izlet
async function prijavi(izletId, ime) {
  const res = await fetch(`${WORKER_URL}/prijave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ izlet: izletId, ime }),
  });
  return res.json();
}

// Ustvari HTML blok s prijavo za vsako kartico.
// readOnly: true → prikaži le seznam udeležencev brez vnosnega polja
// (uporabljeno za pretekle avanture, kjer prijave niso več mogoče).
async function dodajPrijaveNaKarto(el, izletId, { readOnly = false } = {}) {
  const prijave = await naloziPrijave(izletId);

  const wrap = document.createElement('div');
  wrap.className = 'prijave-wrap';
  if (readOnly) wrap.classList.add('prijave-wrap--readonly');
  wrap.dataset.izletId = izletId;

  const seznam = document.createElement('div');
  seznam.className = 'prijave-seznam';
  seznam.innerHTML = renderSeznam(prijave, { readOnly });
  wrap.appendChild(seznam);

  if (!readOnly) {
    const forma = document.createElement('div');
    forma.className = 'prijave-forma';
    forma.innerHTML = `
      <input class="prijave-input" type="text" placeholder="Tvoje ime…" maxlength="60">
      <button class="prijave-btn">Prijavi se</button>
      <span class="prijave-msg"></span>
    `;

    const input = forma.querySelector('.prijave-input');
    const btn = forma.querySelector('.prijave-btn');
    const msg = forma.querySelector('.prijave-msg');

    btn.addEventListener('click', async () => {
      const ime = input.value.trim();
      if (!ime) { msg.textContent = 'Vpiši ime.'; return; }

      btn.disabled = true;
      btn.textContent = '…';
      const result = await prijavi(izletId, ime);

      if (result.ok) {
        input.value = '';
        seznam.innerHTML = renderSeznam(result.prijave);
        msg.textContent = '';
      } else {
        msg.textContent = result.error || 'Napaka.';
      }

      btn.disabled = false;
      btn.textContent = 'Prijavi se';
    });

    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

    wrap.appendChild(forma);
  }

  el.querySelector('.card-content').appendChild(wrap);
}

function renderSeznam(prijave, { readOnly = false } = {}) {
  if (!prijave.length) {
    return readOnly
      ? '<p class="prijave-prazno">Ni zabeleženih udeležencev.</p>'
      : '<p class="prijave-prazno">Bodi prvi/-a!</p>';
  }
  const imena = prijave.map(p => {
    const avatar = getAvatar(p.ime);
    return `<span class="prijave-ime" title="${escHtml(p.ime)}">${avatar}</span>`;
  }).join('');
  const label = readOnly
    ? `${prijave.length} ${prijave.length === 1 ? 'udeleženec' : 'udeležencev'}`
    : `${prijave.length} ${prijave.length === 1 ? 'prijavljen' : 'prijavljenih'}`;
  return `<div class="prijave-glave">${label}</div><div class="prijave-lista">${imena}</div>`;
}

function getAvatar(ime) {
  const words = ime.trim().split(/\s+/);
  const initials = words.length >= 2 
    ? words[0][0] + words[words.length - 1][0] 
    : words[0].slice(0, 2);
  return `<span class="avatar">${initials.toUpperCase()}</span>`;
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
