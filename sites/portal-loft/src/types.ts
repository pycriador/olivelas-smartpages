export type PortalLocale = 'pt-BR' | 'en' | 'es';

export type CategorySlug =
  | 'todas'
  | 'ia'
  | 'engenharia'
  | 'cloud'
  | 'seguranca'
  | 'hardware'
  | 'web';

export interface CategoryInfo {
  slug: CategorySlug;
  label: string;
  color: string;
  badgeBg: string;
}

export interface RelatedBullet {
  title: string;
  targetArticleId: string;
}

export interface ArticleLocalizedFields {
  kicker: string;
  title: string;
  subtitle: string;
  categoryLabel: string;
  authorRole: string;
  publishedAt: string;
  imageAlt: string;
  imageCaption: string;
  viewsCount: string;
  tags: string[];
  relatedBullets?: RelatedBullet[];
  keyTakeaways: string[];
  contentParagraphs: string[];
}

export interface NewsArticle extends ArticleLocalizedFields {
  id: string;
  slug: string;
  category: CategorySlug;
  author: string;
  readingTimeMin: number;
  imageUrl: string;
  featuredRank?: 'hero' | 'subhero-1' | 'subhero-2' | 'standard';
  translations?: Partial<Record<PortalLocale, ArticleLocalizedFields>>;
}

export interface TechTickerItem {
  symbol: string;
  name: string;
  value: string;
  variation: string;
  isPositive: boolean;
}

export interface BreakingNewsItem {
  time: string;
  category: string;
  headline: string;
  articleId: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PortalUiStrings {
  htmlTitle: string;
  versionBadge: string;
  radarTechLabel: string;
  logoSubtitle: string;
  searchPlaceholder: string;
  savedFilterLabel: string;
  darkModeLabel: string;
  lightModeLabel: string;
  dailyBriefingCta: string;
  plantaoBadge: string;
  trendingTopicsLabel: string;
  clearTagFilter: string;
  feedDefaultTitle: string;
  feedSavedTitle: string;
  feedSearchPrefix: string;
  feedCategoryPrefix: string;
  articleSingular: string;
  articlePlural: string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  emptyStateResetBtn: string;
  byAuthorPrefix: string;
  readingTimeSuffix: string;
  heroBadgePrefix: string;
  tldrButtonLabel: string;
  saveButtonLabel: string;
  savedButtonLabel: string;
  mostReadKicker: string;
  mostReadTitle: string;
  pollKicker: string;
  pollTitle: string;
  pollQuestion: string;
  pollTotalLabel: string;
  pollVotesUnit: string;
  pollVotedStatus: string;
  pollClickToVote: string;
  pollToastVoted: string;
  radarKicker: string;
  radarTitle: string;
  savedWidgetKicker: string;
  savedWidgetTitle: string;
  savedWidgetEmpty: string;
  newsletterKicker: string;
  newsletterTitle: string;
  newsletterDesc: string;
  newsletterPlaceholder: string;
  newsletterSubmitBtn: string;
  newsletterToastPrefix: string;
  dialogTopbarTitle: string;
  dialogCloseBtn: string;
  dialogListenBtn: string;
  dialogStopListenBtn: string;
  dialogShareBtn: string;
  dialogTakeawaysTitle: string;
  dialogRelatedTitle: string;
  footerSubtitle: string;
  footerAboutText: string;
  footerCategoriesTitle: string;
  footerArchitectureTitle: string;
  footerLocation: string;
  footerHosting: string;
  footerVersion: string;
  footerCopyright: string;
  footerStaticCompat: string;
  toastSavedAdded: string;
  toastSavedRemoved: string;
  toastLinkCopied: string;
  toastLanguageChanged: string;
  toastAudioUnsupported: string;
}
