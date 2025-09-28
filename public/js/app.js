// BookClub Platform - Complete JavaScript Application
// Optimized for Netlify deployment

class BookClubApp {
  constructor() {
    // Application state
    this.currentUser = null;
    this.currentSection = 'feed';
    this.theme = localStorage.getItem('bookclub_theme') || 'auto';
    this.userBooks = new Map();
    this.userClubs = new Set();
    this.userAchievements = new Set();
    this.notifications = [];
    this.tourStep = 0;
    this.gdprAccepted = localStorage.getItem('bookclub_gdpr') === 'accepted';

    // Configuration from environment
    this.config = {
      apiUrl: window.ENV?.API_URL || '/api',
      supabaseUrl: window.ENV?.SUPABASE_URL,
      supabaseKey: window.ENV?.SUPABASE_KEY,
      isDev: window.ENV?.NODE_ENV === 'development'
    };

    console.log('BookClub App initializing...', {
      env: window.ENV?.NODE_ENV,
      hasSupabase: !!(this.config.supabaseUrl && this.config.supabaseKey)
    });

    // Initialize data and setup
    this.initializeData();
    this.init();
  }

  // Initialize the application
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApplication());
    } else {
      this.setupApplication();
    }
  }

  // Setup application after DOM is ready
  async setupApplication() {
    try {
      this.setupEventListeners();
      this.applyTheme();
      this.showGDPRBanner();
      this.setupErrorBoundary();

      // Check authentication
      await this.checkAuthentication();

      this.hideOverlay();

      console.log('BookClub App ready!');
    } catch (error) {
      console.error('Application setup failed:', error);
      this.showErrorMessage('Ошибка инициализации приложения');
    }
  }

  // Error boundary setup
  setupErrorBoundary() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showToast('Произошла ошибка в приложении', 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showToast('Ошибка обработки данных', 'error');
    });
  }

  // Authentication check
  async checkAuthentication() {
    // For demo purposes, check localStorage
    const savedUser = localStorage.getItem('bookclub_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.showAuthenticatedView();
        console.log('User authenticated:', this.currentUser.firstName);
      } catch (error) {
        localStorage.removeItem('bookclub_user');
        this.showWelcomeView();
      }
    } else {
      this.showWelcomeView();
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // GDPR banner
    const acceptGdpr = document.getElementById('acceptGdpr');
    const declineGdpr = document.getElementById('declineGdpr');
    if (acceptGdpr) acceptGdpr.addEventListener('click', () => this.acceptGdpr());
    if (declineGdpr) declineGdpr.addEventListener('click', () => this.declineGdpr());

    // Auth form tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
    });

    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    // Navigation
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToSection(e.currentTarget.dataset.section);
      });
    });

    // Global search
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', this.debounce((e) => {
        this.handleGlobalSearch(e.target.value);
      }, 300));

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.global-search')) {
          this.hideSearchSuggestions();
        }
      });
    }

    // Notifications
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsClose = document.getElementById('notificationsClose');
    if (notificationsBtn) notificationsBtn.addEventListener('click', () => this.toggleNotifications());
    if (notificationsClose) notificationsClose.addEventListener('click', () => this.closeNotifications());

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

    // Onboarding tour
    const skipTour = document.getElementById('skipTour');
    const nextTour = document.getElementById('nextTour');
    if (skipTour) skipTour.addEventListener('click', () => this.skipOnboarding());
    if (nextTour) nextTour.addEventListener('click', () => this.nextOnboardingStep());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Window resize
    window.addEventListener('resize', this.debounce(() => this.handleWindowResize(), 250));

    // Online/offline status
    window.addEventListener('online', () => {
      this.showToast('Подключение восстановлено', 'success');
    });

    window.addEventListener('offline', () => {
      this.showToast('Нет подключения к интернету', 'warning');
    });
  }

  // Theme management
  applyTheme() {
    const theme = this.theme === 'auto' ?
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
      this.theme;

    document.documentElement.setAttribute('data-theme', theme);

    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = theme === 'dark' ? '#1f2937' : '#6366f1';
    }
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.theme);
    this.theme = themes[(currentIndex + 1) % themes.length];
    localStorage.setItem('bookclub_theme', this.theme);
    this.applyTheme();

    const themeNames = {
      light: 'светлую',
      dark: 'тёмную',
      auto: 'автоматическую'
    };

    this.showToast(`Тема изменена на ${themeNames[this.theme]}`, 'info');
  }

  // GDPR compliance
  showGDPRBanner() {
    if (!this.gdprAccepted) {
      const banner = document.getElementById('gdprBanner');
      if (banner) banner.classList.remove('hidden');
    }
  }

  acceptGdpr() {
    localStorage.setItem('bookclub_gdpr', 'accepted');
    this.gdprAccepted = true;
    const banner = document.getElementById('gdprBanner');
    if (banner) banner.classList.add('hidden');
    this.showToast('Настройки cookies сохранены', 'success');
  }

  declineGdpr() {
    localStorage.setItem('bookclub_gdpr', 'declined');
    const banner = document.getElementById('gdprBanner');
    if (banner) banner.classList.add('hidden');
    this.showToast('Cookies отклонены. Некоторые функции могут быть недоступны', 'warning');
  }

  // Authentication forms
  switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.auth-form__content').forEach(form => {
      const isActive = form.dataset.form === tab;
      form.classList.toggle('active', isActive);
    });
  }

  // Login handler
  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      this.showToast('Пожалуйста, заполните все поля', 'error');
      return;
    }

    this.showLoading(true);

    try {
      // Demo login - replace with real API call
      setTimeout(() => {
        const user = {
          id: Date.now(),
          email: email,
          firstName: email.split('@')[0],
          lastName: '',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'user',
          booksRead: 5,
          joinedClubs: 2,
          points: 120,
          level: 'Читатель'
        };

        this.currentUser = user;
        localStorage.setItem('bookclub_user', JSON.stringify(user));

        this.showLoading(false);
        this.showAuthenticatedView();
        this.showToast(`Добро пожаловать, ${user.firstName}!`, 'success');

        // Start onboarding for new users
        if (!localStorage.getItem('bookclub_onboarding_completed')) {
          setTimeout(() => this.startOnboarding(), 1000);
        }
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      this.showLoading(false);
      this.showToast('Ошибка входа. Попробуйте позже.', 'error');
    }
  }

  // Registration handler
  async handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
      this.showToast('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showToast('Введите корректный email', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      this.showToast('Пароли не совпадают', 'error');
      return;
    }

    if (password.length < 6) {
      this.showToast('Пароль должен содержать минимум 6 символов', 'error');
      return;
    }

    if (!agreeTerms) {
      this.showToast('Необходимо согласиться с правилами сервиса', 'error');
      return;
    }

    this.showLoading(true);

    try {
      // Demo registration - replace with real API call
      setTimeout(() => {
        const user = {
          id: Date.now(),
          username,
          email,
          firstName: firstName || username,
          lastName: lastName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || username)}&background=6366f1&color=fff`,
          role: 'user',
          booksRead: 0,
          joinedClubs: 0,
          points: 10,
          level: 'Новичок'
        };

        this.currentUser = user;
        localStorage.setItem('bookclub_user', JSON.stringify(user));

        this.showLoading(false);
        this.showAuthenticatedView();
        this.showToast(`Регистрация завершена! Добро пожаловать, ${user.firstName}!`, 'success');

        // Start onboarding
        setTimeout(() => this.startOnboarding(), 1000);
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      this.showLoading(false);
      this.showToast('Ошибка регистрации. Попробуйте позже.', 'error');
    }
  }

  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // View management
  showWelcomeView() {
    this.toggleElements([
      { selector: '#welcomeSection', show: true },
      { selector: '#mainContent', show: false },
      { selector: '#mainNav', show: false },
      { selector: '#userInfo', show: false },
      { selector: '#globalSearch', show: false }
    ]);
  }

  showAuthenticatedView() {
    this.toggleElements([
      { selector: '#welcomeSection', show: false },
      { selector: '#mainContent', show: true },
      { selector: '#mainNav', show: true },
      { selector: '#userInfo', show: true },
      { selector: '#globalSearch', show: true }
    ]);

    this.updateUserInterface();
    this.navigateToSection('feed');
  }

  toggleElements(elements) {
    elements.forEach(({ selector, show }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.toggle('hidden', !show);
      }
    });
  }

  updateUserInterface() {
    if (!this.currentUser) return;

    // Update user name
    const userName = document.getElementById('userName');
    if (userName) userName.textContent = this.currentUser.firstName;

    // Update user avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
      const img = userAvatar.querySelector('img');
      if (img) {
        img.src = this.currentUser.avatar;
        img.alt = `Аватар пользователя ${this.currentUser.firstName}`;
      }
    }

    // Load initial data
    this.loadNotifications();
  }

  // Navigation
  navigateToSection(section) {
    // Update active navigation link
    document.querySelectorAll('.nav__link').forEach(link => {
      const isActive = link.dataset.section === section;
      link.classList.toggle('active', isActive);
    });

    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(sectionEl => {
      sectionEl.classList.toggle('active', sectionEl.dataset.section === section);
    });

    this.currentSection = section;
    this.loadSectionContent(section);
  }

  async loadSectionContent(section) {
    try {
      switch (section) {
        case 'feed':
          await this.loadFeedContent();
          break;
        case 'catalog':
          this.showToast('Каталог книг - в разработке', 'info');
          break;
        case 'clubs':
          this.showToast('Книжные клубы - в разработке', 'info');
          break;
        case 'events':
          this.showToast('События - в разработке', 'info');
          break;
        case 'profile':
          this.showToast('Профиль - в разработке', 'info');
          break;
        default:
          console.warn(`Unknown section: ${section}`);
      }
    } catch (error) {
      console.error(`Error loading section ${section}:`, error);
      this.showToast('Ошибка загрузки содержимого', 'error');
    }
  }

  // Load feed content
  async loadFeedContent() {
    const feedContent = document.getElementById('feedContent');
    if (!feedContent) return;

    // Show loading
    feedContent.innerHTML = '<div class="feed-loading">Загрузка ленты активности...</div>';

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock feed data
      const mockFeedItems = [
        {
          id: 1,
          type: 'book_added',
          user: {
            name: 'Алексей',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
          },
          action: 'добавил книгу',
          target: 'Война и мир',
          time: '2 часа назад'
        },
        {
          id: 2,
          type: 'club_joined',
          user: {
            name: 'Мария',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
          },
          action: 'присоединилась к клубу',
          target: 'Классика навсегда',
          time: '4 часа назад'
        },
        {
          id: 3,
          type: 'achievement',
          user: {
            name: 'Вы',
            avatar: this.currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
          },
          action: 'получили достижение',
          target: 'Первые шаги',
          time: '1 день назад'
        }
      ];

      this.renderFeedItems(mockFeedItems);
    } catch (error) {
      console.error('Error loading feed:', error);
      feedContent.innerHTML = '<p class="feed-loading">Ошибка загрузки ленты активности</p>';
    }
  }

  renderFeedItems(items) {
    const feedContent = document.getElementById('feedContent');
    if (!feedContent) return;

    if (items.length === 0) {
      feedContent.innerHTML = '<div class="feed-loading">Пока нет активности. Присоединитесь к клубам и добавьте книги!</div>';
      return;
    }

    feedContent.innerHTML = items.map(item => `
      <div class="feed-item card">
        <img src="${item.user.avatar}" alt="${item.user.name}" class="feed-avatar">
        <div class="feed-info">
          <p><strong>${item.user.name}</strong> ${item.action} <strong>${item.target}</strong></p>
          <div class="feed-time">${item.time}</div>
        </div>
      </div>
    `).join('');
  }

  // Search functionality
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async handleGlobalSearch(query) {
    if (query.length < 2) {
      this.hideSearchSuggestions();
      return;
    }

    // Mock search results
    const mockResults = [
      { type: 'book', title: 'Война и мир', subtitle: 'Лев Толстой' },
      { type: 'club', title: 'Классика навсегда', subtitle: 'Читаем классическую литературу' }
    ].filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
    );

    this.showSearchSuggestions(mockResults, query);
  }

  showSearchSuggestions(results, query) {
    const suggestions = document.getElementById('searchSuggestions');
    if (!suggestions) return;

    if (results.length === 0) {
      suggestions.innerHTML = '<div class="search-suggestion">Ничего не найдено</div>';
    } else {
      suggestions.innerHTML = results.map((result, index) => `
        <div class="search-suggestion" data-index="${index}">
          <strong>${this.highlightQuery(result.title, query)}</strong>
          <br><small>${this.highlightQuery(result.subtitle, query)}</small>
        </div>
      `).join('');

      // Add click handlers
      suggestions.querySelectorAll('.search-suggestion').forEach((suggestion, index) => {
        suggestion.addEventListener('click', () => {
          this.showToast(`Открытие: ${results[index].title}`, 'info');
          this.hideSearchSuggestions();
        });
      });
    }

    suggestions.classList.remove('hidden');
  }

  hideSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) suggestions.classList.add('hidden');
  }

  highlightQuery(text, query) {
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Notifications
  loadNotifications() {
    this.notifications = [
      {
        id: 1,
        title: 'Добро пожаловать!',
        message: 'Спасибо за регистрацию в BookClub',
        read: false,
        timestamp: new Date()
      }
    ];
    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;

    if (panel.classList.contains('hidden')) {
      this.showNotifications();
    } else {
      this.closeNotifications();
    }
  }

  showNotifications() {
    const panel = document.getElementById('notificationsPanel');
    const content = document.getElementById('notificationsContent');

    if (panel) panel.classList.remove('hidden');

    if (content) {
      content.innerHTML = this.notifications.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
        </div>
      `).join('');
    }
  }

  closeNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) panel.classList.add('hidden');
  }

  // Onboarding
  startOnboarding() {
    this.tourStep = 1;
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      this.updateOnboardingContent();
    }
  }

  updateOnboardingContent() {
    const content = document.getElementById('onboardingContent');
    const nextBtn = document.getElementById('nextTour');

    const tourSteps = [
      {
        title: 'Добро пожаловать в BookClub! 👋',
        content: 'Давайте познакомим вас с основными возможностями платформы.',
        isLast: false
      },
      {
        title: 'Навигация 🧭',
        content: 'Используйте меню сверху для перехода между разделами: Лента, Каталог, Клубы, События и Профиль.',
        isLast: false
      },
      {
        title: 'Готово! 🎉',
        content: 'Теперь вы готовы использовать BookClub! Приятного чтения и общения.',
        isLast: true
      }
    ];

    const currentStep = tourSteps[this.tourStep - 1];

    if (content && currentStep) {
      content.innerHTML = `
        <h2>${currentStep.title}</h2>
        <p>${currentStep.content}</p>
        <div class="tour-progress">
          Шаг ${this.tourStep} из ${tourSteps.length}
        </div>
      `;
    }

    // Toggle button text
    if (nextBtn) {
      nextBtn.textContent = currentStep?.isLast ? 'Завершить' : 'Далее';
    }
  }

  nextOnboardingStep() {
    const tourSteps = 3; // Total steps

    if (this.tourStep >= tourSteps) {
      this.finishOnboarding();
    } else {
      this.tourStep++;
      this.updateOnboardingContent();
    }
  }

  skipOnboarding() {
    this.finishOnboarding();
  }

  finishOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.classList.add('hidden');

    localStorage.setItem('bookclub_onboarding_completed', 'true');
    this.showToast('Добро пожаловать в BookClub! 🎉', 'success');
  }

  // Logout
  logout() {
    localStorage.removeItem('bookclub_user');
    localStorage.removeItem('bookclub_token');

    this.currentUser = null;
    this.userBooks.clear();
    this.userClubs.clear();
    this.userAchievements.clear();
    this.notifications = [];

    this.showWelcomeView();
    this.showToast('Вы успешно вышли из аккаунта', 'success');
  }

  // Utility methods
  hideOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      if (show) {
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;

    return timestamp.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  }

  showErrorMessage(message) {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container">
          <div class="error-message">
            <h2>Ошибка</h2>
            <p>${message}</p>
            <button class="btn btn--primary" onclick="window.location.reload()">Обновить страницу</button>
          </div>
        </div>
      `;
      mainContent.classList.remove('hidden');
    }
  }

  // Initialize sample data
  initializeData() {
    this.booksData = [
      {
        id: 1,
        title: "Война и мир",
        author: "Лев Толстой",
        genre: "Классическая литература",
        rating: 4.8,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop"
      }
    ];

    this.clubsData = [
      {
        id: 1,
        name: "Классика навсегда",
        description: "Читаем и обсуждаем произведения классической литературы",
        members: 156
      }
    ];
  }

  // Keyboard shortcuts
  handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) searchInput.focus();
    }

    if (e.key === 'Escape') {
      this.hideSearchSuggestions();
      this.closeNotifications();
    }
  }

  // Window resize handler
  handleWindowResize() {
    this.hideSearchSuggestions();
  }
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BookClubApp();
});

// Export for global access
window.BookClubApp = BookClubApp;