'use strict';
(() => {
  const get = s => document.querySelector(s);
  const status = get('[data-status]'), source = get('[data-source]');
  if (!status || !source) return;
  const fmt = new Intl.NumberFormat('fr-FR');
  const networks = ['youtube','instagram','tiktok'];
  const button = get('[data-reload]');
  let active = false, last = '';
  async function refresh() {
    if (active) return;
    active = true;
    if (button) button.disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),10000);
    try {
      const response = await fetch(source.href,{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('HTTP');
      const record = await response.json();
      const counts = record.stats || {};
      const known = networks.filter(k => Number.isSafeInteger(counts[k]) && counts[k] >= 0);
      if (!known.length) throw new Error('Relevé vide');
      document.querySelectorAll('[data-network]').forEach(el => {
        const k = el.dataset.network;
        el.textContent = known.includes(k) ? `${fmt.format(counts[k])} abonné${counts[k]>1?'s':''}` : 'Indisponible';
      });
      get('[data-label]').textContent = known.length === 3 ? 'Abonnements cumulés' : `Sous-total · ${known.length}/3 réseaux`;
      get('[data-total]').textContent = fmt.format(known.reduce((sum,k) => sum + counts[k],0));
      const date = new Date(record.at);
      last = Number.isFinite(record.at) && Number.isFinite(date.getTime()) ? `Dernier relevé : ${date.toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'})}` : 'Date du relevé inconnue';
      status.textContent = last;
    } catch { status.textContent = last ? `${last} · actualisation indisponible` : 'Compteurs indisponibles. Tu peux ouvrir le relevé brut.'; }
    finally {clearTimeout(timeout);active=false;if(button) button.disabled=false;}
  }
  if(button){button.hidden=false;button.addEventListener('click',refresh);}
  refresh();
  setInterval(() => {if(!document.hidden) refresh();},300000);
})();
