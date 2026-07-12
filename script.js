document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chat-toggle');
  const chatWidget = document.getElementById('chat-widget');
  const chatClose = document.getElementById('chat-close');
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  const prompts = [
    { key: 'name', question: 'What is your name?' },
    { key: 'email', question: 'What is your email address?' },
    { key: 'company', question: 'What is your company name?' },
    { key: 'phone', question: 'What is your contact number?' },
    { key: 'description', question: 'Briefly tell us what you want to build or achieve.' }
  ];

  const data = {};
  let step = 0;

  function addMessage(text, type = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openChat() {
    if (!chatWidget) return;
    chatWidget.classList.add('open');
    chatWidget.setAttribute('aria-hidden', 'false');
    chatInput?.focus();
  }

  function closeChat() {
    if (!chatWidget) return;
    chatWidget.classList.remove('open');
    chatWidget.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-chat]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openChat();
    });
  });

  chatToggle?.addEventListener('click', () => openChat());
  chatClose?.addEventListener('click', () => closeChat());

  if (chatWidget) {
    chatWidget.addEventListener('click', (e) => {
      if (e.target === chatWidget) closeChat();
    });
  }

  function askNextQuestion() {
    if (step < prompts.length) {
      addMessage(prompts[step].question);
      step += 1;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;

      const currentPrompt = prompts[step - 1];
      if (currentPrompt?.key === 'email' && !isValidEmail(value)) {
        addMessage(value, 'user');
        addMessage('Please enter a valid email address so we can reach you.', 'bot');
        chatForm.reset();
        chatInput?.focus();
        return;
      }

      addMessage(value, 'user');
      if (currentPrompt) {
        data[currentPrompt.key] = value;
      }

      if (step >= prompts.length) {
        try {
          const response = await fetch('http://127.0.0.1:8001', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await response.json();
          if (result.ok && result.sent) {
            addMessage('Thanks! Your inquiry has been sent directly to the team.', 'bot');
          } else {
            addMessage('Thanks! The chatbot captured your details, but the email delivery is not configured yet.', 'bot');
          }
        } catch (error) {
          console.error(error);
          addMessage('Thanks! The chatbot captured your details, but the email delivery could not be completed.', 'bot');
        }
        chatForm.reset();
        chatInput?.focus();
        return;
      }

      askNextQuestion();
      chatForm.reset();
      chatInput?.focus();
    });
  }

  if (chatMessages && !chatMessages.children.length) {
    addMessage('Hi! I can help you get started. I will ask a few quick questions so we can understand your project.');
    askNextQuestion();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChat();
  });

  /* ── Custom Cursor ── */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (dot && ring) {
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.left  = mouseX + 'px';
      dot.style.top   = mouseY + 'px';
      ring.style.left = mouseX + 'px';
      ring.style.top  = mouseY + 'px';
    });
    // Expand cursor on interactive elements
    const hoverables = document.querySelectorAll('a, button, .service-card, .testi-card, .vs-card');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
    });
  }
  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }, { passive: true });
  /* ── Hamburger mobile menu ── */
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  /* ── Scroll-triggered animations ── */
  const animEls = document.querySelectorAll('[data-animate]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  animEls.forEach(el => io.observe(el));
  /* ── Counter animation ── */
  const counters = document.querySelectorAll('.counter');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterIO.observe(c));
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quartic
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }
  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      if (anchor.hasAttribute('data-open-contact-modal')) return;
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = navbar.offsetHeight;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
  /* ── Service card tilt effect ── */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotX = (y - midY) / midY * -5;
      const rotY = (x - midX) / midX * 5;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
  /* ── Visual Systems card parallax on scroll ── */
  function onScroll() {
    const vsCards = document.querySelectorAll('.vs-card img');
    vsCards.forEach(img => {
      const rect = img.closest('.vs-card').getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const vh = window.innerHeight / 2;
      const diff = (center - vh) / vh;
      img.style.transform = `scale(1.08) translateY(${diff * 14}px)`;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  /* ── Play button ripple ── */
  document.querySelectorAll('.play-btn, .vs-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; border-radius:50%; background:rgba(170,255,0,0.3);
        width:60px; height:60px; top:50%; left:50%;
        transform:translate(-50%,-50%) scale(0);
        animation:ripple-anim 0.6s ease-out forwards; pointer-events:none;
      `;
      if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = '@keyframes ripple-anim { to { transform:translate(-50%,-50%) scale(3); opacity:0; } }';
        document.head.appendChild(style);
      }
      btn.style.position = 'relative';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
  /* ── Ticker pause on hover ── */
  const tickerTracks = document.querySelectorAll('.ticker-track, .cta-ticker-track');
  tickerTracks.forEach(track => {
    track.parentElement.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    track.parentElement.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  });
  /* ── Stats row animated border on hover ── */
  document.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      const val = item.querySelector('.stat-val');
      if (val) val.style.textShadow = '0 0 20px rgba(170,255,0,0.5)';
    });
    item.addEventListener('mouseleave', () => {
      const val = item.querySelector('.stat-val');
      if (val) val.style.textShadow = '';
    });
  });
  console.log('%cLeora Creative Agency 🌿', 'color:#aaff00; font-size:18px; font-weight:bold;');
  console.log('%cDesign That Turns Attention Into Revenue.', 'color:#8da08d; font-size:12px;');
});
