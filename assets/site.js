// Station Fish Bar: drop-in photos and the live open / closed status.
(() => {
  'use strict';

  // Photos. Each placeholder (.ph) holds an <img> pointing at the file it is
  // waiting for in assets/photos/. Once that file exists, the photo covers the
  // brief; until then the brief stays visible and nothing looks broken.
  document.querySelectorAll('.ph img').forEach((img) => {
    const show = () => img.closest('.ph').classList.add('has-photo');
    if (img.complete && img.naturalWidth > 0) show();
    else img.addEventListener('load', show, { once: true });
  });

  // Opening hours live in the departures board rows: data-day (0 = Sunday)
  // and data-hours, a space-separated list of "HH:MM-HH:MM" sessions.
  const rows = [...document.querySelectorAll('tr[data-day]')];
  if (!rows.length) return;

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const toMins = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const week = DAYS.map(() => []);
  rows.forEach((row) => {
    week[Number(row.dataset.day)] = (row.dataset.hours || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((session) => {
        const [open, close] = session.split('-');
        return { open, close, from: toMins(open), to: toMins(close) };
      });
  });

  // Always shop time, whatever the visitor's own time zone.
  const londonClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const now = () => {
    const p = Object.fromEntries(londonClock.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return { day: DAYS.indexOf(p.weekday), mins: Number(p.hour) * 60 + Number(p.minute), clock: `${p.hour}:${p.minute}` };
  };

  const status = ({ day, mins }) => {
    const current = week[day].find((s) => mins >= s.from && mins < s.to);
    if (current) return { open: true, text: `Open now · until ${current.close}` };

    const later = week[day].find((s) => mins < s.from);
    if (later) return { open: false, text: `Closed now · opens ${later.open}` };

    for (let i = 1; i <= 7; i += 1) {
      const d = (day + i) % 7;
      if (week[d].length) {
        return { open: false, text: `Closed now · opens ${i === 1 ? 'tomorrow' : DAYS[d]} ${week[d][0].open}` };
      }
    }
    return { open: false, text: 'Closed' };
  };

  const render = () => {
    const t = now();
    const s = status(t);
    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.textContent = s.text;
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
    });
    document.querySelectorAll('[data-clock]').forEach((el) => {
      el.textContent = t.clock;
    });
    rows.forEach((row) => row.classList.toggle('is-today', Number(row.dataset.day) === t.day));
  };

  render();
  setInterval(render, 30000);
})();
