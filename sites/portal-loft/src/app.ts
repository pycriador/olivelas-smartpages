import { CategorySlug, NewsArticle, PollOption, PortalLocale, PortalUiStrings } from './types';
import { UI_TRANSLATIONS } from './data/i18n';
import {
  getLocalizedArticles,
  getLocalizedCategories,
  getLocalizedPlantao,
  getLocalizedPollOptions,
  INITIAL_POLL_OPTIONS,
  TECH_TICKER,
} from './data/articles';

let supportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
}

async function closeTopLayer(element: HTMLDialogElement): Promise<void> {
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  element.close();
}

class PortalLoftApp {
  private locale: PortalLocale = 'pt-BR';
  private activeCategory: CategorySlug = 'todas';
  private activeTag: string = '';
  private showOnlySaved: boolean = false;
  private searchQuery: string = '';
  private isDarkMode: boolean = false;
  private articleFontSizeRem: number = 1.08;
  private pollOptions: PollOption[] = [...INITIAL_POLL_OPTIONS];
  private votedPollOptionId: string | null = null;
  private savedArticleIds: Set<string> = new Set<string>();
  private expandedTldrIds: Set<string> = new Set<string>();
  private currentlyOpenArticleId: string | null = null;
  private isSpeaking: boolean = false;

  public init(): void {
    this.restorePreferences();
    this.applyStaticTranslations();
    this.renderTopTicker();
    this.renderCategoryNav();
    this.renderPlantaoStrip();
    this.renderTrendingTagsBar();
    this.renderAllSections();
    this.renderSidebar();
    this.bindGlobalEvents();
    this.startLiveClock();
  }

  private get ui(): PortalUiStrings {
    return UI_TRANSLATIONS[this.locale] || UI_TRANSLATIONS['pt-BR'];
  }

  private restorePreferences(): void {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') as PortalLocale | null;
      const savedLang = localStorage.getItem('portal_loft_locale') as PortalLocale | null;

      if (langParam && (langParam === 'pt-BR' || langParam === 'en' || langParam === 'es')) {
        this.locale = langParam;
      } else if (savedLang && (savedLang === 'pt-BR' || savedLang === 'en' || savedLang === 'es')) {
        this.locale = savedLang;
      }

      const savedTheme = localStorage.getItem('portal_loft_theme');
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        this.isDarkMode = false;
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const savedVote = localStorage.getItem('portal_loft_poll_vote');
      if (savedVote) {
        this.votedPollOptionId = savedVote;
      }

      const savedBookmarksRaw = localStorage.getItem('portal_loft_bookmarks');
      if (savedBookmarksRaw) {
        const parsed = JSON.parse(savedBookmarksRaw);
        if (Array.isArray(parsed)) {
          this.savedArticleIds = new Set(parsed.filter((x) => typeof x === 'string'));
        }
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  public setLocale(newLocale: PortalLocale): void {
    if (this.locale === newLocale) return;
    this.stopSpeech();
    this.locale = newLocale;
    try {
      localStorage.setItem('portal_loft_locale', newLocale);
    } catch {
      // Ignore
    }

    this.applyStaticTranslations();
    this.renderCategoryNav();
    this.renderPlantaoStrip();
    this.renderTrendingTagsBar();
    this.renderAllSections();
    this.renderSidebar();
    this.updateClockOnce();

    if (this.currentlyOpenArticleId) {
      this.openArticleModal(this.currentlyOpenArticleId);
    }

    this.showToast(this.ui.toastLanguageChanged);
  }

  private applyStaticTranslations(): void {
    const t = this.ui;
    document.documentElement.setAttribute('lang', this.locale);
    document.title = t.htmlTitle;

    // Update language buttons active state
    document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', btnLang === this.locale);
      btn.setAttribute('aria-pressed', btnLang === this.locale ? 'true' : 'false');
    });

    this.setText('topbar-version-tag', t.versionBadge);
    this.setText('radar-tech-label', t.radarTechLabel);
    this.setText('portal-logo-subtitle', t.logoSubtitle);
    this.setText('saved-filter-label', t.savedFilterLabel);
    this.setText('header-briefing-cta', t.dailyBriefingCta);
    this.setText('plantao-badge-label', t.plantaoBadge);
    this.setText('trending-topics-label', t.trendingTopicsLabel);
    this.setText('most-read-kicker', t.mostReadKicker);
    this.setText('most-read-title', t.mostReadTitle);
    this.setText('saved-widget-kicker', t.savedWidgetKicker);
    this.setText('saved-widget-title', t.savedWidgetTitle);
    this.setText('poll-widget-kicker', t.pollKicker);
    this.setText('poll-widget-title', t.pollTitle);
    this.setText('radar-widget-kicker', t.radarKicker);
    this.setText('radar-widget-title', t.radarTitle);
    this.setText('newsletter-kicker', t.newsletterKicker);
    this.setText('newsletter-title', t.newsletterTitle);
    this.setText('newsletter-desc', t.newsletterDesc);
    this.setText('newsletter-submit-btn', t.newsletterSubmitBtn);
    this.setText('dialog-topbar-title', t.dialogTopbarTitle);
    this.setText('close-article-dialog-btn', t.dialogCloseBtn);
    this.setText('footer-logo-subtitle', t.footerSubtitle);
    this.setText('footer-about-text', t.footerAboutText);
    this.setText('footer-categories-title', t.footerCategoriesTitle);
    this.setText('footer-architecture-title', t.footerArchitectureTitle);
    this.setText('footer-location', t.footerLocation);
    this.setText('footer-hosting', t.footerHosting);
    this.setText('footer-version', t.footerVersion);
    this.setText('footer-copyright', t.footerCopyright);
    this.setText('footer-static-compat', t.footerStaticCompat);

    const searchInput = document.getElementById('portal-search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.placeholder = t.searchPlaceholder;
    }

    const emailInput = document.getElementById('newsletter-email-input') as HTMLInputElement | null;
    if (emailInput) {
      emailInput.placeholder = t.newsletterPlaceholder;
    }

    // Update footer category buttons
    const cats = getLocalizedCategories(this.locale);
    document.querySelectorAll<HTMLButtonElement>('[data-footer-cat]').forEach((btn) => {
      const slug = btn.getAttribute('data-footer-cat') as CategorySlug;
      const found = cats.find((c) => c.slug === slug);
      if (found) {
        btn.textContent = found.label;
      }
    });

    this.updateThemeToggleButton();
    this.updateSavedCountBadge();
  }

  private setText(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  private toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const mode = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    try {
      localStorage.setItem('portal_loft_theme', mode);
    } catch {
      // Ignore
    }
    this.updateThemeToggleButton();
  }

  private updateThemeToggleButton(): void {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.innerHTML = this.isDarkMode
      ? `<span class="theme-icon">☀️</span> <span>${this.escapeHtml(this.ui.lightModeLabel)}</span>`
      : `<span class="theme-icon">🌙</span> <span>${this.escapeHtml(this.ui.darkModeLabel)}</span>`;
  }

  private updateSavedCountBadge(): void {
    const countPill = document.getElementById('saved-count-pill');
    if (countPill) {
      countPill.textContent = String(this.savedArticleIds.size);
    }
    const filterBtn = document.getElementById('saved-filter-btn');
    if (filterBtn) {
      filterBtn.classList.toggle('active', this.showOnlySaved);
      filterBtn.setAttribute('aria-pressed', this.showOnlySaved ? 'true' : 'false');
    }
  }

  private toggleSaveArticle(articleId: string): void {
    if (this.savedArticleIds.has(articleId)) {
      this.savedArticleIds.delete(articleId);
      this.showToast(this.ui.toastSavedRemoved);
    } else {
      this.savedArticleIds.add(articleId);
      this.showToast(this.ui.toastSavedAdded);
    }
    try {
      localStorage.setItem(
        'portal_loft_bookmarks',
        JSON.stringify(Array.from(this.savedArticleIds))
      );
    } catch {
      // Ignore
    }
    this.updateSavedCountBadge();
    this.renderAllSections();
    this.renderSavedSidebarWidget();
  }

  private updateClockOnce(): void {
    const el = document.getElementById('live-portal-datetime');
    if (!el) return;
    const now = new Date();
    const intlLocale =
      this.locale === 'en' ? 'en-US' : this.locale === 'es' ? 'es-ES' : 'pt-BR';
    const formatted = now.toLocaleDateString(intlLocale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = now.toLocaleTimeString(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    el.textContent = `${formatted.replace('.', '')} • ${time}`;
  }

  private startLiveClock(): void {
    this.updateClockOnce();
    window.setInterval(() => this.updateClockOnce(), 30000);
  }

  private renderTopTicker(): void {
    const container = document.getElementById('tech-ticker-track');
    if (!container) return;

    container.innerHTML = TECH_TICKER.map(
      (item) => `
      <div class="ticker-item">
        <span class="ticker-symbol">${this.escapeHtml(item.symbol)}</span>
        <span class="ticker-value">${this.escapeHtml(item.value)}</span>
        <span class="ticker-change ${item.isPositive ? 'is-up' : 'is-down'}">
          ${this.escapeHtml(item.variation)}
        </span>
      </div>
    `
    ).join('');
  }

  private renderCategoryNav(): void {
    const nav = document.getElementById('editorial-category-nav');
    if (!nav) return;

    const categories = getLocalizedCategories(this.locale);

    nav.innerHTML = categories
      .map((cat) => {
        const isActive = cat.slug === this.activeCategory && !this.showOnlySaved;
        return `
        <button
          type="button"
          class="category-pill ${isActive ? 'active' : ''}"
          data-category="${cat.slug}"
          style="${isActive ? `--cat-active-color: ${cat.color}` : ''}"
        >
          ${this.escapeHtml(cat.label)}
        </button>
      `;
      })
      .join('');

    nav.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-category') as CategorySlug;
        if (slug) {
          this.activeCategory = slug;
          this.showOnlySaved = false;
          this.updateSavedCountBadge();
          this.renderCategoryNav();
          this.renderAllSections();
        }
      });
    });
  }

  private renderPlantaoStrip(): void {
    const container = document.getElementById('plantao-items-list');
    if (!container) return;

    const plantao = getLocalizedPlantao(this.locale);

    container.innerHTML = plantao
      .slice(0, 3)
      .map(
        (item) => `
        <button type="button" class="plantao-headline-btn" data-open-article="${item.articleId}">
          <span class="plantao-time">${this.escapeHtml(item.time)}</span>
          <span class="plantao-cat">${this.escapeHtml(item.category)}</span>
          <span class="plantao-text">${this.escapeHtml(item.headline)}</span>
        </button>
      `
      )
      .join('');
  }

  private renderTrendingTagsBar(): void {
    const container = document.getElementById('trending-tags-list');
    if (!container) return;

    const articles = getLocalizedArticles(this.locale);
    const uniqueTags: string[] = [];
    for (const art of articles) {
      for (const tag of art.tags) {
        if (!uniqueTags.includes(tag) && uniqueTags.length < 9) {
          uniqueTags.push(tag);
        }
      }
    }

    container.innerHTML =
      uniqueTags
        .map((tag) => {
          const isActive = this.activeTag.toLowerCase() === tag.toLowerCase();
          return `
            <button
              type="button"
              class="trending-tag-chip ${isActive ? 'active' : ''}"
              data-filter-tag="${this.escapeHtml(tag)}"
            >
              #${this.escapeHtml(tag)}
            </button>
          `;
        })
        .join('') +
      (this.activeTag
        ? `<button type="button" class="trending-tag-chip" data-clear-tag="true">✕ ${this.escapeHtml(
            this.ui.clearTagFilter
          )}</button>`
        : '');
  }

  private getFilteredArticles(): NewsArticle[] {
    const articles = getLocalizedArticles(this.locale);
    const q = this.searchQuery.trim().toLowerCase();
    const tagFilter = this.activeTag.trim().toLowerCase();

    return articles.filter((art) => {
      if (this.showOnlySaved && !this.savedArticleIds.has(art.id)) {
        return false;
      }
      const matchesCat = this.activeCategory === 'todas' || art.category === this.activeCategory;
      if (!matchesCat) return false;

      if (tagFilter && !art.tags.some((t) => t.toLowerCase() === tagFilter)) {
        return false;
      }

      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.subtitle.toLowerCase().includes(q) ||
        art.kicker.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }

  private renderAllSections(): void {
    const t = this.ui;
    const filtered = this.getFilteredArticles();
    const heroSection = document.getElementById('hero-bento-section');
    const feedContainer = document.getElementById('editorial-news-grid');
    const resultsHeader = document.getElementById('feed-section-title');
    const countBadge = document.getElementById('feed-count-badge');

    if (countBadge) {
      countBadge.textContent = `${filtered.length} ${
        filtered.length === 1 ? t.articleSingular : t.articlePlural
      }`;
    }

    const showFullHero =
      this.activeCategory === 'todas' &&
      !this.searchQuery.trim() &&
      !this.activeTag.trim() &&
      !this.showOnlySaved;

    if (heroSection) {
      if (showFullHero) {
        heroSection.style.display = 'grid';
        this.renderHeroBento();
      } else {
        heroSection.style.display = 'none';
      }
    }

    if (resultsHeader) {
      const categories = getLocalizedCategories(this.locale);
      const catObj = categories.find((c) => c.slug === this.activeCategory);
      if (this.showOnlySaved) {
        resultsHeader.textContent = t.feedSavedTitle;
      } else if (this.searchQuery.trim()) {
        resultsHeader.textContent = `${t.feedSearchPrefix} "${this.searchQuery.trim()}"`;
      } else if (this.activeTag.trim()) {
        resultsHeader.textContent = `#${this.activeTag.trim()}`;
      } else if (this.activeCategory === 'todas') {
        resultsHeader.textContent = t.feedDefaultTitle;
      } else {
        resultsHeader.textContent = `${t.feedCategoryPrefix} ${
          catObj ? catObj.label : this.activeCategory
        }`;
      }
    }

    if (!feedContainer) return;

    const listToRender = showFullHero
      ? filtered.filter(
          (a) =>
            a.featuredRank === 'standard' ||
            a.featuredRank === 'subhero-1' ||
            a.featuredRank === 'subhero-2'
        )
      : filtered;

    if (listToRender.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-search-state">
          <h3>${this.escapeHtml(t.emptyStateTitle)}</h3>
          <p>${this.escapeHtml(t.emptyStateDesc)}</p>
          <button type="button" class="btn-reset-filters" id="reset-filters-btn">
            ${this.escapeHtml(t.emptyStateResetBtn)}
          </button>
        </div>
      `;
      document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
        this.activeCategory = 'todas';
        this.activeTag = '';
        this.showOnlySaved = false;
        this.searchQuery = '';
        const input = document.getElementById('portal-search-input') as HTMLInputElement | null;
        if (input) input.value = '';
        this.updateSavedCountBadge();
        this.renderCategoryNav();
        this.renderTrendingTagsBar();
        this.renderAllSections();
      });
      return;
    }

    const categories = getLocalizedCategories(this.locale);

    feedContainer.innerHTML = listToRender
      .map((art) => {
        const catInfo = categories.find((c) => c.slug === art.category);
        const catColor = catInfo?.color || '#FF5A26';
        const isSaved = this.savedArticleIds.has(art.id);
        const isTldrOpen = this.expandedTldrIds.has(art.id);

        return `
          <article class="news-card">
            <div class="news-card-media" data-open-article="${art.id}">
              <img
                src="${art.imageUrl}"
                alt="${this.escapeHtml(art.imageAlt)}"
                loading="lazy"
                width="640"
                height="360"
              />
              <span class="news-card-cat-badge" style="background-color: ${catColor}">
                ${this.escapeHtml(art.categoryLabel)}
              </span>
            </div>
            <div class="news-card-body">
              <div class="news-kicker" style="color: ${catColor}">
                ${this.escapeHtml(art.kicker)}
              </div>
              <h3 class="news-card-title" data-open-article="${art.id}">
                ${this.escapeHtml(art.title)}
              </h3>
              <p class="news-card-subtitle" data-open-article="${art.id}">
                ${this.escapeHtml(art.subtitle)}
              </p>
              ${
                isTldrOpen
                  ? `
                  <div class="card-tldr-drawer">
                    <ul>
                      ${art.keyTakeaways.map((k) => `<li>${this.escapeHtml(k)}</li>`).join('')}
                    </ul>
                  </div>
                `
                  : ''
              }
              <div class="news-card-footer">
                <div class="news-card-meta-inline">
                  <span>${this.escapeHtml(t.byAuthorPrefix)} <strong>${this.escapeHtml(art.author)}</strong></span>
                  <span>•</span>
                  <span>${art.readingTimeMin} ${this.escapeHtml(t.readingTimeSuffix)}</span>
                </div>
                <div class="news-card-actions">
                  <button
                    type="button"
                    class="card-action-btn"
                    data-toggle-tldr="${art.id}"
                  >
                    ${this.escapeHtml(t.tldrButtonLabel)}
                  </button>
                  <button
                    type="button"
                    class="card-action-btn ${isSaved ? 'is-saved' : ''}"
                    data-toggle-save="${art.id}"
                  >
                    ${isSaved ? '★ ' + this.escapeHtml(t.savedButtonLabel) : '🔖 ' + this.escapeHtml(t.saveButtonLabel)}
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  private renderHeroBento(): void {
    const heroSection = document.getElementById('hero-bento-section');
    if (!heroSection) return;

    const t = this.ui;
    const articles = getLocalizedArticles(this.locale);
    const mainHero = articles.find((a) => a.featuredRank === 'hero') || articles[0];
    const sub1 = articles.find((a) => a.featuredRank === 'subhero-1') || articles[1];
    const sub2 = articles.find((a) => a.featuredRank === 'subhero-2') || articles[2];

    const bulletsHtml = (mainHero.relatedBullets || [])
      .map(
        (b) => `
        <li>
          <button type="button" class="hero-related-link" data-open-article="${b.targetArticleId}">
            <span class="bullet-dot"></span>
            <span>${this.escapeHtml(b.title)}</span>
          </button>
        </li>
      `
      )
      .join('');

    heroSection.innerHTML = `
      <!-- Manchete Principal Estilo UOL / Terra -->
      <article class="hero-main-card">
        <div class="hero-main-clickable" data-open-article="${mainHero.id}">
          <div class="hero-main-image-wrap">
            <img
              src="${mainHero.imageUrl}"
              alt="${this.escapeHtml(mainHero.imageAlt)}"
              fetchpriority="high"
              width="960"
              height="540"
            />
            <div class="hero-image-overlay">
              <span class="hero-live-pill">${this.escapeHtml(t.heroBadgePrefix)} • ${this.escapeHtml(mainHero.kicker)}</span>
            </div>
          </div>
          <div class="hero-main-content">
            <div class="hero-kicker">${this.escapeHtml(mainHero.kicker)}</div>
            <h1 class="hero-main-title">${this.escapeHtml(mainHero.title)}</h1>
            <p class="hero-main-subtitle">${this.escapeHtml(mainHero.subtitle)}</p>
            <div class="hero-meta-row">
              <span>${this.escapeHtml(mainHero.author)}</span>
              <span>•</span>
              <span>${this.escapeHtml(mainHero.publishedAt)}</span>
              <span>•</span>
              <span>${mainHero.readingTimeMin} ${this.escapeHtml(t.readingTimeSuffix)}</span>
            </div>
          </div>
        </div>
        ${bulletsHtml ? `<ul class="hero-related-bullets">${bulletsHtml}</ul>` : ''}
      </article>

      <!-- Coluna de Destaques Secundários -->
      <div class="hero-secondary-column">
        <article class="hero-sub-card" data-open-article="${sub1.id}">
          <div class="hero-sub-image-wrap">
            <img
              src="${sub1.imageUrl}"
              alt="${this.escapeHtml(sub1.imageAlt)}"
              width="640"
              height="360"
            />
            <span class="hero-sub-badge">${this.escapeHtml(sub1.categoryLabel)}</span>
          </div>
          <div class="hero-sub-body">
            <span class="news-kicker">${this.escapeHtml(sub1.kicker)}</span>
            <h2 class="hero-sub-title">${this.escapeHtml(sub1.title)}</h2>
            <p class="hero-sub-desc">${this.escapeHtml(sub1.subtitle)}</p>
          </div>
        </article>

        <article class="hero-sub-card" data-open-article="${sub2.id}">
          <div class="hero-sub-image-wrap">
            <img
              src="${sub2.imageUrl}"
              alt="${this.escapeHtml(sub2.imageAlt)}"
              width="640"
              height="360"
            />
            <span class="hero-sub-badge">${this.escapeHtml(sub2.categoryLabel)}</span>
          </div>
          <div class="hero-sub-body">
            <span class="news-kicker">${this.escapeHtml(sub2.kicker)}</span>
            <h2 class="hero-sub-title">${this.escapeHtml(sub2.title)}</h2>
            <p class="hero-sub-desc">${this.escapeHtml(sub2.subtitle)}</p>
          </div>
        </article>
      </div>
    `;
  }

  private renderSidebar(): void {
    const articles = getLocalizedArticles(this.locale);
    const plantao = getLocalizedPlantao(this.locale);

    // 1. Mais Lidas
    const mostReadList = document.getElementById('most-read-list');
    if (mostReadList) {
      mostReadList.innerHTML = articles
        .slice(0, 5)
        .map(
          (art, index) => `
          <li class="most-read-item" data-open-article="${art.id}">
            <span class="most-read-rank">${index + 1}</span>
            <div class="most-read-info">
              <span class="most-read-kicker">${this.escapeHtml(art.kicker)}</span>
              <h4 class="most-read-title">${this.escapeHtml(art.title)}</h4>
              <span class="most-read-views">${this.escapeHtml(art.viewsCount)}</span>
            </div>
          </li>
        `
        )
        .join('');
    }

    // 2. Matérias Salvas (v1.1.0)
    this.renderSavedSidebarWidget();

    // 3. Enquete Interativa
    this.renderPollWidget();

    // 4. Plantão Completo na Sidebar
    const plantaoTimeline = document.getElementById('sidebar-plantao-timeline');
    if (plantaoTimeline) {
      plantaoTimeline.innerHTML = plantao
        .map(
          (item) => `
          <div class="timeline-entry" data-open-article="${item.articleId}">
            <div class="timeline-meta">
              <span class="timeline-hour">${this.escapeHtml(item.time)}</span>
              <span class="timeline-tag">${this.escapeHtml(item.category)}</span>
            </div>
            <p class="timeline-title">${this.escapeHtml(item.headline)}</p>
          </div>
        `
        )
        .join('');
    }
  }

  private renderSavedSidebarWidget(): void {
    const container = document.getElementById('saved-reading-list');
    if (!container) return;

    const articles = getLocalizedArticles(this.locale);
    const savedList = articles.filter((a) => this.savedArticleIds.has(a.id));

    if (savedList.length === 0) {
      container.innerHTML = `<p class="saved-empty-note">${this.escapeHtml(
        this.ui.savedWidgetEmpty
      )}</p>`;
      return;
    }

    container.innerHTML = savedList
      .map(
        (art) => `
        <div class="saved-reading-item">
          <button type="button" class="saved-reading-open-btn" data-open-article="${art.id}">
            ${this.escapeHtml(art.title)}
          </button>
          <button
            type="button"
            class="saved-reading-remove-btn"
            data-toggle-save="${art.id}"
            title="Remover"
          >
            ✕
          </button>
        </div>
      `
      )
      .join('');
  }

  private renderPollWidget(): void {
    const pollContainer = document.getElementById('interactive-poll-body');
    if (!pollContainer) return;

    const t = this.ui;
    const localizedOptions = getLocalizedPollOptions(this.locale, this.pollOptions);
    const totalVotes = localizedOptions.reduce((acc, item) => acc + item.votes, 0);
    const intlLocale =
      this.locale === 'en' ? 'en-US' : this.locale === 'es' ? 'es-ES' : 'pt-BR';

    pollContainer.innerHTML = `
      <p class="poll-question">
        ${this.escapeHtml(t.pollQuestion)}
      </p>
      <div class="poll-options-list">
        ${localizedOptions
          .map((opt) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const isSelected = this.votedPollOptionId === opt.id;
            return `
              <button
                type="button"
                class="poll-option-btn ${isSelected ? 'selected' : ''}"
                data-poll-option="${opt.id}"
              >
                <div class="poll-option-bar" style="width: ${this.votedPollOptionId ? pct : 0}%"></div>
                <div class="poll-option-content">
                  <span class="poll-option-label">${this.escapeHtml(opt.label)}</span>
                  ${
                    this.votedPollOptionId
                      ? `<span class="poll-option-pct">${pct}%</span>`
                      : ''
                  }
                </div>
              </button>
            `;
          })
          .join('')}
      </div>
      <div class="poll-footer-meta">
        <span>${this.escapeHtml(t.pollTotalLabel)} <strong>${totalVotes.toLocaleString(intlLocale)} ${this.escapeHtml(
      t.pollVotesUnit
    )}</strong></span>
        <span>${this.escapeHtml(
          this.votedPollOptionId ? t.pollVotedStatus : t.pollClickToVote
        )}</span>
      </div>
    `;

    pollContainer.querySelectorAll<HTMLButtonElement>('[data-poll-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const optId = btn.getAttribute('data-poll-option');
        if (!optId || this.votedPollOptionId) return;
        const target = this.pollOptions.find((o) => o.id === optId);
        if (target) {
          target.votes += 1;
          this.votedPollOptionId = optId;
          try {
            localStorage.setItem('portal_loft_poll_vote', optId);
          } catch {
            // Ignore
          }
          this.renderPollWidget();
          this.showToast(this.ui.pollToastVoted);
        }
      });
    });
  }

  private stopSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    const listenBtn = document.getElementById('listen-article-btn');
    if (listenBtn) {
      listenBtn.classList.remove('is-speaking');
      listenBtn.textContent = this.ui.dialogListenBtn;
    }
  }

  private toggleSpeech(article: NewsArticle): void {
    if (!('speechSynthesis' in window)) {
      this.showToast(this.ui.toastAudioUnsupported);
      return;
    }

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = [
      article.title,
      article.subtitle,
      ...article.keyTakeaways,
      ...article.contentParagraphs,
    ].join('. ');

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang =
      this.locale === 'en' ? 'en-US' : this.locale === 'es' ? 'es-ES' : 'pt-BR';
    utterance.rate = 1.02;

    utterance.onend = () => {
      this.isSpeaking = false;
      const btn = document.getElementById('listen-article-btn');
      if (btn) {
        btn.classList.remove('is-speaking');
        btn.textContent = this.ui.dialogListenBtn;
      }
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      const btn = document.getElementById('listen-article-btn');
      if (btn) {
        btn.classList.remove('is-speaking');
        btn.textContent = this.ui.dialogListenBtn;
      }
    };

    this.isSpeaking = true;
    const btn = document.getElementById('listen-article-btn');
    if (btn) {
      btn.classList.add('is-speaking');
      btn.textContent = this.ui.dialogStopListenBtn;
    }
    window.speechSynthesis.speak(utterance);
  }

  private openArticleModal(articleId: string): void {
    const articles = getLocalizedArticles(this.locale);
    const article = articles.find((a) => a.id === articleId);
    if (!article) return;

    this.stopSpeech();
    this.currentlyOpenArticleId = article.id;

    const t = this.ui;
    const dialog = document.getElementById('article-reader-dialog') as HTMLDialogElement | null;
    const contentBox = document.getElementById('article-dialog-body');
    const progressBar = document.getElementById('dialog-reading-progress-bar');
    if (!dialog || !contentBox) return;

    const relatedArticles = articles.filter((a) => a.id !== article.id).slice(0, 3);
    const isSaved = this.savedArticleIds.has(article.id);

    contentBox.innerHTML = `
      <div class="reader-header-meta">
        <span class="reader-category-pill">${this.escapeHtml(article.categoryLabel)}</span>
        <span class="reader-kicker">${this.escapeHtml(article.kicker)}</span>
      </div>

      <h1 class="reader-title">${this.escapeHtml(article.title)}</h1>
      <p class="reader-subtitle">${this.escapeHtml(article.subtitle)}</p>

      <div class="reader-byline-bar">
        <div class="reader-author-block">
          <div class="reader-author-avatar">${this.escapeHtml(article.author.charAt(0))}</div>
          <div>
            <div class="reader-author-name">${this.escapeHtml(t.byAuthorPrefix)} ${this.escapeHtml(
      article.author
    )}</div>
            <div class="reader-author-role">${this.escapeHtml(
              article.authorRole
            )} • ${this.escapeHtml(article.publishedAt)}</div>
          </div>
        </div>

        <div class="reader-controls">
          <button type="button" class="reader-ctrl-btn" id="listen-article-btn">
            ${this.escapeHtml(t.dialogListenBtn)}
          </button>
          <button type="button" class="reader-ctrl-btn" id="dialog-save-btn">
            ${
              isSaved
                ? '★ ' + this.escapeHtml(t.savedButtonLabel)
                : '🔖 ' + this.escapeHtml(t.saveButtonLabel)
            }
          </button>
          <button type="button" class="reader-ctrl-btn" id="font-decrease-btn" title="A-">A-</button>
          <button type="button" class="reader-ctrl-btn" id="font-increase-btn" title="A+">A+</button>
          <button type="button" class="reader-ctrl-btn" id="share-article-btn">
            ${this.escapeHtml(t.dialogShareBtn)}
          </button>
        </div>
      </div>

      <figure class="reader-figure">
        <img
          src="${article.imageUrl}"
          alt="${this.escapeHtml(article.imageAlt)}"
          width="960"
          height="540"
        />
        <figcaption>${this.escapeHtml(article.imageCaption)}</figcaption>
      </figure>

      <div class="reader-takeaways-box">
        <div class="reader-takeaways-title">${this.escapeHtml(t.dialogTakeawaysTitle)}</div>
        <ul>
          ${article.keyTakeaways.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>

      <div class="reader-article-paragraphs" id="reader-paragraphs-container" style="font-size: ${
        this.articleFontSizeRem
      }rem">
        ${article.contentParagraphs.map((p) => `<p>${this.escapeHtml(p)}</p>`).join('')}
      </div>

      <div class="reader-tags-row">
        ${article.tags
          .map((tag) => `<span class="reader-tag">#${this.escapeHtml(tag)}</span>`)
          .join('')}
      </div>

      <div class="reader-related-section">
        <h4>${this.escapeHtml(t.dialogRelatedTitle)}</h4>
        <div class="reader-related-grid">
          ${relatedArticles
            .map(
              (rel) => `
              <button type="button" class="reader-related-card" data-open-article="${rel.id}">
                <span class="reader-related-kicker">${this.escapeHtml(rel.kicker)}</span>
                <span class="reader-related-title">${this.escapeHtml(rel.title)}</span>
              </button>
            `
            )
            .join('')}
        </div>
      </div>
    `;

    document.getElementById('listen-article-btn')?.addEventListener('click', () => {
      this.toggleSpeech(article);
    });

    document.getElementById('dialog-save-btn')?.addEventListener('click', () => {
      this.toggleSaveArticle(article.id);
      const saveBtn = document.getElementById('dialog-save-btn');
      if (saveBtn) {
        const nowSaved = this.savedArticleIds.has(article.id);
        saveBtn.textContent = nowSaved
          ? '★ ' + this.ui.savedButtonLabel
          : '🔖 ' + this.ui.saveButtonLabel;
      }
    });

    document.getElementById('font-decrease-btn')?.addEventListener('click', () => {
      this.articleFontSizeRem = Math.max(0.92, Number((this.articleFontSizeRem - 0.08).toFixed(2)));
      const pBox = document.getElementById('reader-paragraphs-container');
      if (pBox) pBox.style.fontSize = `${this.articleFontSizeRem}rem`;
    });

    document.getElementById('font-increase-btn')?.addEventListener('click', () => {
      this.articleFontSizeRem = Math.min(1.4, Number((this.articleFontSizeRem + 0.08).toFixed(2)));
      const pBox = document.getElementById('reader-paragraphs-container');
      if (pBox) pBox.style.fontSize = `${this.articleFontSizeRem}rem`;
    });

    document.getElementById('share-article-btn')?.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?lang=${this.locale}#${article.slug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
      this.showToast(this.ui.toastLinkCopied);
    });

    if (!dialog.open) {
      dialog.showModal();
    }
    contentBox.scrollTop = 0;
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }

  private closeArticleModal(): void {
    this.stopSpeech();
    this.currentlyOpenArticleId = null;
    const dialog = document.getElementById('article-reader-dialog') as HTMLDialogElement | null;
    if (dialog && dialog.open) {
      void closeTopLayer(dialog);
    }
  }

  private bindGlobalEvents(): void {
    document.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      // Language selector buttons
      const langBtn = target.closest<HTMLElement>('[data-lang]');
      if (langBtn) {
        const lang = langBtn.getAttribute('data-lang') as PortalLocale | null;
        if (lang && (lang === 'pt-BR' || lang === 'en' || lang === 'es')) {
          this.setLocale(lang);
        }
        return;
      }

      // Toggle Save / Bookmark
      const saveBtn = target.closest<HTMLElement>('[data-toggle-save]');
      if (saveBtn) {
        ev.stopPropagation();
        const id = saveBtn.getAttribute('data-toggle-save');
        if (id) {
          this.toggleSaveArticle(id);
        }
        return;
      }

      // Toggle inline TL;DR drawer on card
      const tldrBtn = target.closest<HTMLElement>('[data-toggle-tldr]');
      if (tldrBtn) {
        ev.stopPropagation();
        const id = tldrBtn.getAttribute('data-toggle-tldr');
        if (id) {
          if (this.expandedTldrIds.has(id)) {
            this.expandedTldrIds.delete(id);
          } else {
            this.expandedTldrIds.add(id);
          }
          this.renderAllSections();
        }
        return;
      }

      // Trending tag filter chip
      const tagChip = target.closest<HTMLElement>('[data-filter-tag]');
      if (tagChip) {
        const tag = tagChip.getAttribute('data-filter-tag') || '';
        this.activeTag = this.activeTag === tag ? '' : tag;
        this.renderTrendingTagsBar();
        this.renderAllSections();
        return;
      }

      const clearTagBtn = target.closest<HTMLElement>('[data-clear-tag]');
      if (clearTagBtn) {
        this.activeTag = '';
        this.renderTrendingTagsBar();
        this.renderAllSections();
        return;
      }

      // Open article modal
      const articleTrigger = target.closest<HTMLElement>('[data-open-article]');
      if (articleTrigger) {
        const id = articleTrigger.getAttribute('data-open-article');
        if (id) {
          this.openArticleModal(id);
        }
        return;
      }

      // Footer category link
      const footerCatTrigger = target.closest<HTMLElement>('[data-footer-cat]');
      if (footerCatTrigger) {
        const cat = footerCatTrigger.getAttribute('data-footer-cat') as CategorySlug;
        if (cat) {
          this.activeCategory = cat;
          this.showOnlySaved = false;
          this.updateSavedCountBadge();
          this.renderCategoryNav();
          this.renderAllSections();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    // Header saved filter button
    document.getElementById('saved-filter-btn')?.addEventListener('click', () => {
      this.showOnlySaved = !this.showOnlySaved;
      this.updateSavedCountBadge();
      this.renderCategoryNav();
      this.renderAllSections();
    });

    // Logo home reset
    document.getElementById('portal-logo-home')?.addEventListener('click', () => {
      this.activeCategory = 'todas';
      this.activeTag = '';
      this.showOnlySaved = false;
      this.searchQuery = '';
      const input = document.getElementById('portal-search-input') as HTMLInputElement | null;
      if (input) input.value = '';
      this.updateSavedCountBadge();
      this.renderCategoryNav();
      this.renderTrendingTagsBar();
      this.renderAllSections();
    });

    // Search input + keyboard shortcut "/"
    const searchInput = document.getElementById('portal-search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        this.renderAllSections();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInput &&
        !(document.activeElement instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        searchInput?.focus();
      }
    });

    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Close dialog button, cancel event & backdrop click
    const dialog = document.getElementById('article-reader-dialog') as HTMLDialogElement | null;
    const contentBox = document.getElementById('article-dialog-body');
    const progressBar = document.getElementById('dialog-reading-progress-bar');

    document.getElementById('close-article-dialog-btn')?.addEventListener('click', () => {
      this.closeArticleModal();
    });

    dialog?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeArticleModal();
    });

    dialog?.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.closeArticleModal();
      }
    });

    contentBox?.addEventListener('scroll', () => {
      if (!contentBox || !progressBar) return;
      const scrollable = contentBox.scrollHeight - contentBox.clientHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.round((contentBox.scrollTop / scrollable) * 100)) : 100;
      progressBar.style.width = `${pct}%`;
    });

    // Newsletter subscription form
    const newsletterForm = document.getElementById('portal-newsletter-form') as HTMLFormElement | null;
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email-input') as HTMLInputElement | null;
        if (emailInput && emailInput.value.trim()) {
          this.showToast(`${this.ui.newsletterToastPrefix} ${emailInput.value.trim()}`);
          emailInput.value = '';
        }
      });
    }
  }

  private showToast(text: string): void {
    const toast = document.getElementById('portal-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    window.setTimeout(() => {
      toast.classList.remove('visible');
    }, 3400);
  }

  private escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PortalLoftApp();
  app.init();
});
