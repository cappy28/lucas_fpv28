```js
'use strict';
// Même script depuis /accueil/ et /stats/. Aucune clé dans le navigateur.
(() => {
  const note = document.querySelector('[data-status]');
  if (!note) return;
  const source = document.querySelector('[data-source]').href;
  const button = document.querySelector('[data-reload]');
  const keys = ['youtube', 'instagram', 'tiktok'];
  const fmt = new Intl.NumberFormat('fr-FR');
  let busy = false, previous = '';
  async function read() {
    if (busy) return;
    busy = true;
    if (button) button.disabled = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(source, {cache:'no-store',signal:ctrl.signal});
      if (!res.ok) throw Error();
      const d = await res.json();
      const valid = keys.filter(k => Number.isSafeInteger(d.stats?.[k]) && d.stats[k] >= 0);
      if (!valid.length) throw Error();
      document.querySelectorAll('[data-network]').forEach(el => {
        const k = el.dataset.network;
        el.textContent = valid.includes(k) ? fmt.format(d.stats[k]) + (d.stats[k] > 1 ? ' abonnés' : ' abonné') : 'Indisponible';
      });
      document.querySelector('[data-total]').textContent = fmt.format(valid.reduce((n,k) => n+d.stats[k],0));
      document.querySelector('[data-label]').textContent = valid.length === 3 ? 'Abonnements cumulés' : `Sous-total · ${valid.length}/3 réseaux`;
      const date = new Date(d.at);
      previous = Number.isFinite(d.at) && !Number.isNaN(date.valueOf()) ? 'Dernier relevé : ' + date.toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}) : 'Date du relevé indisponible';
      note.textContent = previous;
    } catch {
      note.textContent = previous ? previous + ' · actualisation indisponible' : 'Relevé indisponible. Les liens vers les réseaux restent accessibles.';
    } finally { clearTimeout(timer); busy=false; if(button) button.disabled=false; }
  }
  if(button){button.hidden=false; button.addEventListener('click',read);}
  read();
  setInterval(() => {if (!document.hidden) read();},300000);
})();
```
