const body = document.body;
const navbar = document.getElementById('navbar');
const progress = document.getElementById('scrollProgress');
const menu = document.getElementById('menu');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const themeToggle = document.getElementById('themeToggle');
const preloader = document.getElementById('preloader');
const headline = document.getElementById('typeHeadline');
const cursorGlow = document.getElementById('cursorGlow');
const particleLayer = document.getElementById('particleLayer');
const apiBase = 'http://127.0.0.1:5000/api';

let activeSection = 'hero';

function onScroll() {
  const top = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = height > 0 ? (top / height) * 100 : 0;

  progress.style.width = `${ratio}%`;

  if (top > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  applyParallax(top);
}

function closeMenuOnNavigate() {
  const links = menu.querySelectorAll('a');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
    });
  });
}

function initBackButtons() {
  document.querySelectorAll('.back-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const fallback = button.dataset.backHref || 'index.html';
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallback;
      }
    });
  });
}

// Smooth in-page section scrolling with offset for sticky navbar.
function initSmoothAnchors() {
  const links = menu.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (!target) return;

      event.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
}

function initTheme() {
  const saved = localStorage.getItem('landing-theme');
  if (saved === 'dark') {
    body.classList.add('dark');
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    localStorage.setItem('landing-theme', body.classList.contains('dark') ? 'dark' : 'light');
  });
}

// Animate headline typing once to make hero feel dynamic.
function runTypingHeadline() {
  if (!headline) return;

  const text = headline.dataset.text || headline.textContent || '';
  headline.textContent = '';
  headline.classList.add('typing');
  let index = 0;

  const timer = setInterval(() => {
    headline.textContent += text.charAt(index);
    index += 1;

    if (index >= text.length) {
      clearInterval(timer);
      setTimeout(() => headline.classList.remove('typing'), 900);
    }
  }, 45);
}

function initMobileMenu() {
  if (!mobileMenuBtn) return;

  mobileMenuBtn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}

// Highlight current section in navbar using Intersection Observer.
function initActiveSection() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = [...menu.querySelectorAll('.nav-link')];
  const navMap = new Map(navLinks.map((link) => [link.getAttribute('href')?.replace('#', ''), link]));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      activeSection = entry.target.id;
      navLinks.forEach((link) => link.classList.remove('active'));
      const activeLink = navMap.get(activeSection);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-35% 0px -45% 0px', threshold: 0.1 });

  sections.forEach((section) => observer.observe(section));
}

// Lightweight parallax translation for hero decorative elements.
function applyParallax(scrollY) {
  const orbA = document.querySelector('.orb-a');
  const orbB = document.querySelector('.orb-b');
  const heroCard = document.querySelector('.glass-card');
  if (!orbA || !orbB || !heroCard) return;

  const yA = Math.min(26, scrollY * 0.04);
  const yB = Math.min(30, scrollY * 0.06);
  const cardY = Math.min(14, scrollY * 0.02);
  orbA.style.transform = `translate3d(0, ${yA}px, 0)`;
  orbB.style.transform = `translate3d(0, ${-yB}px, 0)`;
  heroCard.style.transform = `translate3d(0, ${cardY}px, 0)`;
}

// Add ripple feedback on CTA and plan buttons.
function initRippleButtons() {
  const buttons = document.querySelectorAll('.btn, .price-card button');
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

// Subtle cursor-follow glow for desktop devices.
function initCursorGlow() {
  if (!cursorGlow || window.matchMedia('(pointer: coarse)').matches) return;

  window.addEventListener('mousemove', (event) => {
    cursorGlow.style.left = `${event.clientX - 90}px`;
    cursorGlow.style.top = `${event.clientY - 90}px`;
  });
}

// Small particle background animation using canvas.
function initParticles() {
  if (!particleLayer) return;

  const context = particleLayer.getContext('2d');
  if (!context) return;

  const particles = [];
  const total = 32;

  const resize = () => {
    particleLayer.width = window.innerWidth;
    particleLayer.height = window.innerHeight;
  };

  const resetParticle = (particle) => {
    particle.x = Math.random() * particleLayer.width;
    particle.y = Math.random() * particleLayer.height;
    particle.vx = (Math.random() - 0.5) * 0.35;
    particle.vy = (Math.random() - 0.5) * 0.35;
    particle.r = Math.random() * 2 + 1;
  };

  for (let i = 0; i < total; i += 1) {
    const p = { x: 0, y: 0, vx: 0, vy: 0, r: 0 };
    resetParticle(p);
    particles.push(p);
  }

  const draw = () => {
    context.clearRect(0, 0, particleLayer.width, particleLayer.height);
    context.fillStyle = body.classList.contains('dark') ? 'rgba(148,163,184,0.22)' : 'rgba(59,130,246,0.18)';
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > particleLayer.width || particle.y < 0 || particle.y > particleLayer.height) {
        resetParticle(particle);
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
    });
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  draw();
}

function setupDots(container, count, onSelect) {
  container.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => onSelect(i));
    container.appendChild(dot);
  }
}

function makeAutoCarousel(trackId, dotsId, intervalMs = 3500) {
  const track = document.getElementById(trackId);
  const dots = document.getElementById(dotsId);

  if (!track || !dots) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  let index = 0;
  let touchStartX = 0;

  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
    });
  };

  const next = () => {
    index = (index + 1) % slides.length;
    update();
  };

  const prev = () => {
    index = (index - 1 + slides.length) % slides.length;
    update();
  };

  setupDots(dots, slides.length, (selected) => {
    index = selected;
    update();
  });

  update();

  track.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (delta > 40) prev();
    if (delta < -40) next();
  }, { passive: true });

  let autoTimer = setInterval(next, intervalMs);

  const pause = () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  const resume = () => {
    if (!autoTimer) {
      autoTimer = setInterval(next, intervalMs);
    }
  };

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', resume);

  return { next, prev };
}

// 3D tilt effect for dashboard preview area.
function initTiltCards() {
  const tiltAreas = document.querySelectorAll('.tilt-area');
  tiltAreas.forEach((area) => {
    area.addEventListener('mousemove', (event) => {
      const rect = area.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 8;
      const rotateX = (0.5 - py) * 8;
      area.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    area.addEventListener('mouseleave', () => {
      area.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  });
}

function initPreloader() {
  const remove = () => {
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 420);
    }
    body.classList.add('loaded');
  };

  if (document.readyState === 'complete') {
    remove();
  } else {
    window.addEventListener('load', remove, { once: true });
  }
}

async function loadInlineDashboard() {
  const messageNode = document.getElementById('inlineDashboardMessage');
  const txNode = document.getElementById('inlineTotalTransactions');
  const alertNode = document.getElementById('inlineTotalAlerts');
  const riskNode = document.getElementById('inlineHighRisk');
  const amountNode = document.getElementById('inlineTotalAmount');
  const alertsListNode = document.getElementById('inlineAlertsList');
  const txBodyNode = document.getElementById('inlineTransactionsBody');

  if (!messageNode || !txNode || !alertNode || !riskNode || !amountNode || !alertsListNode || !txBodyNode) {
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    messageNode.textContent = 'Login required to display live dashboard data here.';
    alertsListNode.innerHTML = '<p class="inline-note">No session found.</p>';
    txBodyNode.innerHTML = '<tr><td colspan="5">No data</td></tr>';
    return;
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [summaryResp, txResp, alertResp] = await Promise.all([
      fetch(`${apiBase}/transactions/summary`, { headers }),
      fetch(`${apiBase}/transactions`, { headers }),
      fetch(`${apiBase}/alerts`, { headers })
    ]);

    if (!summaryResp.ok || !txResp.ok || !alertResp.ok) {
      throw new Error('Unable to load dashboard data');
    }

    const summary = await summaryResp.json();
    const txPayload = await txResp.json();
    const alertPayload = await alertResp.json();
    const transactions = txPayload.transactions || [];
    const alerts = alertPayload.alerts || [];
    const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    txNode.textContent = String(summary.total_transactions || 0);
    alertNode.textContent = String(summary.total_alerts || 0);
    riskNode.textContent = String(summary.high_risk || 0);
    amountNode.textContent = `INR ${totalAmount.toLocaleString('en-IN')}`;
    messageNode.textContent = 'Live data synced from your current signed-in session.';

    alertsListNode.innerHTML = alerts.slice(0, 4).map((alert) => {
      const level = String(alert.level || 'MEDIUM').toUpperCase();
      return `
        <article class="inline-alert-item">
          <div class="inline-alert-head">
            <strong>${level}</strong>
            <span>#${alert.id}</span>
          </div>
          <p>${alert.message || 'Alert event'}</p>
        </article>
      `;
    }).join('') || '<p class="inline-note">No alerts found.</p>';

    txBodyNode.innerHTML = transactions.slice(0, 6).map((tx) => {
      const isFraud = String(tx.risk || '').toUpperCase() === 'HIGH';
      return `
        <tr>
          <td>${tx.id}</td>
          <td>${tx.account}</td>
          <td>${Number(tx.amount || 0).toLocaleString('en-IN')}</td>
          <td>${tx.type}</td>
          <td><span class="status-pill ${isFraud ? 'fraud' : 'normal'}">${isFraud ? 'Fraud' : 'Normal'}</span></td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="5">No transactions found.</td></tr>';
  } catch (_error) {
    messageNode.textContent = 'Could not load dashboard data. Please login again.';
    alertsListNode.innerHTML = '<p class="inline-note">Load failed.</p>';
    txBodyNode.innerHTML = '<tr><td colspan="5">Load failed.</td></tr>';
  }
}

window.addEventListener('scroll', onScroll);
onScroll();
closeMenuOnNavigate();
initSmoothAnchors();
initTheme();
initMobileMenu();
initActiveSection();
runTypingHeadline();
initRippleButtons();
initCursorGlow();
initParticles();
initTiltCards();
initPreloader();
initBackButtons();
const previewCarousel = makeAutoCarousel('previewTrack', 'previewDots', 3600);
makeAutoCarousel('testimonialTrack', 'testimonialDots', 4800);
loadInlineDashboard().catch(() => {});

const previewPrev = document.getElementById('previewPrev');
const previewNext = document.getElementById('previewNext');
if (previewCarousel && previewPrev && previewNext) {
  previewPrev.addEventListener('click', previewCarousel.prev);
  previewNext.addEventListener('click', previewCarousel.next);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') previewCarousel.prev();
    if (event.key === 'ArrowRight') previewCarousel.next();
  });
}

AOS.init({
  once: false,
  duration: 700,
  easing: 'ease-out-cubic'
});
