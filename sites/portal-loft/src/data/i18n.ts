import {
  ArticleLocalizedFields,
  BreakingNewsItem,
  CategorySlug,
  PortalLocale,
  PortalUiStrings,
} from '../types';

export const UI_TRANSLATIONS: Record<PortalLocale, PortalUiStrings> = {
  'pt-BR': {
    htmlTitle: 'Portal Loft v1.1.0 — Notícias de Tecnologia, IA, Engenharia de Software & Cloud',
    versionBadge: 'Release v1.1.0 • Multilíngue (PT/EN/ES)',
    radarTechLabel: 'RADAR TECH:',
    logoSubtitle: 'Tecnologia • IA • Engenharia • Cloud',
    searchPlaceholder: 'Buscar notícias sobre IA, TypeScript, Kubernetes, Rust, Chips... (Pressione /)',
    savedFilterLabel: 'Salvos',
    darkModeLabel: 'Modo Escuro',
    lightModeLabel: 'Modo Claro',
    dailyBriefingCta: 'Briefing Diário',
    plantaoBadge: 'PLANTÃO TECH',
    trendingTopicsLabel: 'TÓPICOS EM ALTA:',
    clearTagFilter: 'Limpar filtro',
    feedDefaultTitle: 'Últimas Notícias de Tecnologia, IA & Desenvolvimento',
    feedSavedTitle: 'Sua Lista de Leitura Salva (Favoritos)',
    feedSearchPrefix: 'Resultados para',
    feedCategoryPrefix: 'Editoria:',
    articleSingular: 'reportagem',
    articlePlural: 'reportagens',
    emptyStateTitle: 'Nenhuma notícia encontrada para os filtros selecionados',
    emptyStateDesc:
      'Tente buscar por termos como MCP, TypeScript, Kubernetes, Rust ou 2nm, ou limpe os filtros ativos.',
    emptyStateResetBtn: 'Limpar filtros e voltar à capa',
    byAuthorPrefix: 'Por',
    readingTimeSuffix: 'min de leitura',
    heroBadgePrefix: 'MANCHETE DO DIA',
    tldrButtonLabel: '⚡ Resumo IA',
    saveButtonLabel: 'Salvar',
    savedButtonLabel: 'Salvo',
    mostReadKicker: 'RANKING DE AUDIÊNCIA',
    mostReadTitle: 'Mais Lidas Agora',
    pollKicker: 'TERMÔMETRO DE ENGENHARIA',
    pollTitle: 'Enquete da Semana',
    pollQuestion:
      'Qual tendência tecnológica terá maior impacto no seu time de engenharia nos próximos 12 meses?',
    pollTotalLabel: 'Total:',
    pollVotesUnit: 'votos',
    pollVotedStatus: '✓ Voto computado',
    pollClickToVote: 'Clique em uma opção para votar',
    pollToastVoted: 'Seu voto foi registrado na Enquete Tech do Portal Loft!',
    radarKicker: 'MINUTO A MINUTO',
    radarTitle: 'Radar da Redação',
    savedWidgetKicker: 'BIBLIOTECA PESSOAL',
    savedWidgetTitle: 'Matérias Salvas',
    savedWidgetEmpty: 'Clique em "🔖 Salvar" em qualquer notícia para guardar na sua lista de leitura.',
    newsletterKicker: 'NEWSLETTER OFICIAL',
    newsletterTitle: 'Briefing Tech Loft',
    newsletterDesc:
      'Receba todas as manhãs a curadoria técnica sobre IA Generativa, Arquitetura Cloud, TypeScript e Segurança direto no seu e-mail.',
    newsletterPlaceholder: 'seu.nome@empresa.com.br',
    newsletterSubmitBtn: 'Assinar Gratuitamente',
    newsletterToastPrefix: 'Inscrição confirmada no Briefing Diário Portal Loft para:',
    dialogTopbarTitle: 'PORTAL LOFT • REPORTAGEM COMPLETA',
    dialogCloseBtn: '✕ Fechar (ESC)',
    dialogListenBtn: '🎧 Ouvir Matéria',
    dialogStopListenBtn: '⏹ Parar Áudio',
    dialogShareBtn: '🔗 Compartilhar',
    dialogTakeawaysTitle: '⚡ Resumo Executivo (Key Takeaways)',
    dialogRelatedTitle: 'Leia também no Portal Loft',
    footerSubtitle: 'Jornalismo Técnico & Engenharia Digital',
    footerAboutText:
      'O Portal Loft é a publicação editorial de tecnologia construída com o Design System Copan e publicada via AIOps OpsPages. Cobertura independente em Português, Inglês e Espanhol sobre IA, Engenharia de Software, Cloud Computing, Segurança e Semicondutores.',
    footerCategoriesTitle: 'Editorias',
    footerArchitectureTitle: 'Expediente & Arquitetura',
    footerLocation: 'Redação: São Paulo, SP • Brasil',
    footerHosting: 'Hospedagem Estática: AIOps OpsPages',
    footerVersion: 'Versão Publicada: Release 1.1.0',
    footerCopyright:
      '© 2026 Portal Loft • Todos os direitos reservados. Conteúdo jornalístico de tecnologia e engenharia.',
    footerStaticCompat: 'Compatível com execução 100% estática local (HTML/CSS/JS/IMG).',
    toastSavedAdded: 'Reportagem salva na sua Lista de Leitura!',
    toastSavedRemoved: 'Reportagem removida da sua Lista de Leitura.',
    toastLinkCopied: 'Link da reportagem copiado para a área de transferência!',
    toastLanguageChanged: 'Idioma alterado para Português (PT-BR)',
    toastAudioUnsupported: 'Síntese de voz não disponível neste navegador.',
  },
  en: {
    htmlTitle: 'Portal Loft v1.1.0 — Tech News, AI, Software Engineering & Cloud',
    versionBadge: 'Release v1.1.0 • Multilingual (PT/EN/ES)',
    radarTechLabel: 'TECH RADAR:',
    logoSubtitle: 'Technology • AI • Engineering • Cloud',
    searchPlaceholder: 'Search news about AI, TypeScript, Kubernetes, Rust, Chips... (Press /)',
    savedFilterLabel: 'Saved',
    darkModeLabel: 'Dark Mode',
    lightModeLabel: 'Light Mode',
    dailyBriefingCta: 'Daily Briefing',
    plantaoBadge: 'BREAKING TECH',
    trendingTopicsLabel: 'TRENDING TOPICS:',
    clearTagFilter: 'Clear filter',
    feedDefaultTitle: 'Latest Technology, AI & Engineering News',
    feedSavedTitle: 'Your Saved Reading List (Bookmarks)',
    feedSearchPrefix: 'Results for',
    feedCategoryPrefix: 'Section:',
    articleSingular: 'story',
    articlePlural: 'stories',
    emptyStateTitle: 'No stories found for the selected filters',
    emptyStateDesc:
      'Try searching for terms like MCP, TypeScript, Kubernetes, Rust, or 2nm, or reset active filters.',
    emptyStateResetBtn: 'Reset filters and return to front page',
    byAuthorPrefix: 'By',
    readingTimeSuffix: 'min read',
    heroBadgePrefix: 'TOP STORY',
    tldrButtonLabel: '⚡ AI Summary',
    saveButtonLabel: 'Save',
    savedButtonLabel: 'Saved',
    mostReadKicker: 'AUDIENCE RANKING',
    mostReadTitle: 'Most Read Now',
    pollKicker: 'ENGINEERING PULSE',
    pollTitle: 'Weekly Tech Poll',
    pollQuestion:
      'Which technology trend will have the biggest impact on your engineering team over the next 12 months?',
    pollTotalLabel: 'Total:',
    pollVotesUnit: 'votes',
    pollVotedStatus: '✓ Vote recorded',
    pollClickToVote: 'Click an option to vote',
    pollToastVoted: 'Your vote has been recorded in the Portal Loft Tech Poll!',
    radarKicker: 'MINUTE BY MINUTE',
    radarTitle: 'Newsroom Radar',
    savedWidgetKicker: 'PERSONAL LIBRARY',
    savedWidgetTitle: 'Saved Stories',
    savedWidgetEmpty: 'Click "🔖 Save" on any story to bookmark it in your reading list.',
    newsletterKicker: 'OFFICIAL NEWSLETTER',
    newsletterTitle: 'Loft Tech Briefing',
    newsletterDesc:
      'Get our daily morning curation on Generative AI, Cloud Architecture, TypeScript, and Cybersecurity straight to your inbox.',
    newsletterPlaceholder: 'your.name@company.com',
    newsletterSubmitBtn: 'Subscribe Free',
    newsletterToastPrefix: 'Subscription confirmed to Portal Loft Daily Briefing for:',
    dialogTopbarTitle: 'PORTAL LOFT • FULL REPORT',
    dialogCloseBtn: '✕ Close (ESC)',
    dialogListenBtn: '🎧 Listen to Story',
    dialogStopListenBtn: '⏹ Stop Audio',
    dialogShareBtn: '🔗 Share',
    dialogTakeawaysTitle: '⚡ Executive Summary (Key Takeaways)',
    dialogRelatedTitle: 'Read also on Portal Loft',
    footerSubtitle: 'Technical Journalism & Digital Engineering',
    footerAboutText:
      'Portal Loft is the technology news publication built with the Copan Design System and published via AIOps OpsPages. Independent coverage in Portuguese, English, and Spanish on AI, Software Engineering, Cloud Computing, Security, and Semiconductors.',
    footerCategoriesTitle: 'Sections',
    footerArchitectureTitle: 'Masthead & Architecture',
    footerLocation: 'Newsroom: São Paulo, SP • Brazil',
    footerHosting: 'Static Hosting: AIOps OpsPages',
    footerVersion: 'Published Version: Release 1.1.0',
    footerCopyright:
      '© 2026 Portal Loft • All rights reserved. Technology and software engineering journalism.',
    footerStaticCompat: '100% compatible with local standalone static execution (HTML/CSS/JS/IMG).',
    toastSavedAdded: 'Story saved to your Reading List!',
    toastSavedRemoved: 'Story removed from your Reading List.',
    toastLinkCopied: 'Story link copied to clipboard!',
    toastLanguageChanged: 'Language switched to English (EN)',
    toastAudioUnsupported: 'Speech synthesis is not available in this browser.',
  },
  es: {
    htmlTitle: 'Portal Loft v1.1.0 — Noticias de Tecnología, IA, Ingeniería de Software y Cloud',
    versionBadge: 'Release v1.1.0 • Multilingüe (PT/EN/ES)',
    radarTechLabel: 'RADAR TECH:',
    logoSubtitle: 'Tecnología • IA • Ingeniería • Cloud',
    searchPlaceholder: 'Buscar noticias sobre IA, TypeScript, Kubernetes, Rust, Chips... (Pulsa /)',
    savedFilterLabel: 'Guardados',
    darkModeLabel: 'Modo Oscuro',
    lightModeLabel: 'Modo Claro',
    dailyBriefingCta: 'Briefing Diario',
    plantaoBadge: 'ÚLTIMA HORA TECH',
    trendingTopicsLabel: 'TEMAS EN TENDENCIA:',
    clearTagFilter: 'Limpiar filtro',
    feedDefaultTitle: 'Últimas Noticias de Tecnología, IA y Desarrollo',
    feedSavedTitle: 'Tu Lista de Lectura Guardada (Favoritos)',
    feedSearchPrefix: 'Resultados para',
    feedCategoryPrefix: 'Sección:',
    articleSingular: 'reportaje',
    articlePlural: 'reportajes',
    emptyStateTitle: 'No se encontraron noticias con los filtros seleccionados',
    emptyStateDesc:
      'Intenta buscar términos como MCP, TypeScript, Kubernetes, Rust o 2nm, o restablece los filtros.',
    emptyStateResetBtn: 'Limpiar filtros y volver a portada',
    byAuthorPrefix: 'Por',
    readingTimeSuffix: 'min de lectura',
    heroBadgePrefix: 'TITULAR DEL DÍA',
    tldrButtonLabel: '⚡ Resumen IA',
    saveButtonLabel: 'Guardar',
    savedButtonLabel: 'Guardado',
    mostReadKicker: 'RANKING DE AUDIENCIA',
    mostReadTitle: 'Más Leídas Ahora',
    pollKicker: 'TERMÓMETRO DE INGENIERÍA',
    pollTitle: 'Encuesta de la Semana',
    pollQuestion:
      '¿Qué tendencia tecnológica tendrá mayor impacto en tu equipo de ingeniería en los próximos 12 meses?',
    pollTotalLabel: 'Total:',
    pollVotesUnit: 'votos',
    pollVotedStatus: '✓ Voto registrado',
    pollClickToVote: 'Haz clic en una opción para votar',
    pollToastVoted: '¡Tu voto fue registrado en la Encuesta Tech de Portal Loft!',
    radarKicker: 'MINUTO A MINUTO',
    radarTitle: 'Radar de la Redacción',
    savedWidgetKicker: 'BIBLIOTECA PERSONAL',
    savedWidgetTitle: 'Noticias Guardadas',
    savedWidgetEmpty: 'Haz clic en "🔖 Guardar" en cualquier noticia para añadirla a tu lista.',
    newsletterKicker: 'BOLETÍN OFICIAL',
    newsletterTitle: 'Briefing Tech Loft',
    newsletterDesc:
      'Recibe cada mañana la curaduría técnica sobre IA Generativa, Arquitectura Cloud, TypeScript y Ciberseguridad directo en tu correo.',
    newsletterPlaceholder: 'tu.nombre@empresa.com',
    newsletterSubmitBtn: 'Suscribirse Gratis',
    newsletterToastPrefix: 'Suscripción confirmada al Briefing Diario Portal Loft para:',
    dialogTopbarTitle: 'PORTAL LOFT • REPORTAJE COMPLETO',
    dialogCloseBtn: '✕ Cerrar (ESC)',
    dialogListenBtn: '🎧 Escuchar Nota',
    dialogStopListenBtn: '⏹ Detener Audio',
    dialogShareBtn: '🔗 Compartir',
    dialogTakeawaysTitle: '⚡ Resumen Ejecutivo (Key Takeaways)',
    dialogRelatedTitle: 'Lee también en Portal Loft',
    footerSubtitle: 'Periodismo Técnico e Ingeniería Digital',
    footerAboutText:
      'Portal Loft es la publicación editorial de tecnología construida con el Design System Copan y publicada vía AIOps OpsPages. Cobertura independiente en Portugués, Inglés y Español sobre IA, Ingeniería de Software, Cloud Computing, Seguridad y Semiconductores.',
    footerCategoriesTitle: 'Secciones',
    footerArchitectureTitle: 'Créditos y Arquitectura',
    footerLocation: 'Redacción: São Paulo, SP • Brasil',
    footerHosting: 'Hosting Estático: AIOps OpsPages',
    footerVersion: 'Versión Publicada: Release 1.1.0',
    footerCopyright:
      '© 2026 Portal Loft • Todos los derechos reservados. Contenido periodístico de tecnología e ingeniería.',
    footerStaticCompat: 'Compatible con ejecución 100% estática local (HTML/CSS/JS/IMG).',
    toastSavedAdded: '¡Reportaje guardado en tu Lista de Lectura!',
    toastSavedRemoved: 'Reportaje eliminado de tu Lista de Lectura.',
    toastLinkCopied: '¡Enlace del reportaje copiado al portapapeles!',
    toastLanguageChanged: 'Idioma cambiado a Español (ES)',
    toastAudioUnsupported: 'La síntesis de voz no está disponible en este navegador.',
  },
};

export const CATEGORY_LABELS_BY_LOCALE: Record<PortalLocale, Record<CategorySlug, string>> = {
  'pt-BR': {
    todas: 'Capa • Todas',
    ia: 'IA & Agentes',
    engenharia: 'Engenharia & Dev',
    cloud: 'Cloud & DevOps',
    seguranca: 'Cibersegurança',
    hardware: 'Chips & Hardware',
    web: 'Frontend & Web',
  },
  en: {
    todas: 'Front Page • All',
    ia: 'AI & Agents',
    engenharia: 'Engineering & Dev',
    cloud: 'Cloud & DevOps',
    seguranca: 'Cybersecurity',
    hardware: 'Chips & Hardware',
    web: 'Frontend & Web',
  },
  es: {
    todas: 'Portada • Todas',
    ia: 'IA y Agentes',
    engenharia: 'Ingeniería y Dev',
    cloud: 'Cloud y DevOps',
    seguranca: 'Ciberseguridad',
    hardware: 'Chips y Hardware',
    web: 'Frontend y Web',
  },
};

export const POLL_LABELS_BY_LOCALE: Record<PortalLocale, Record<string, string>> = {
  'pt-BR': {
    'opt-agents': 'Agentes de IA & Automação via MCP',
    'opt-ts': 'Compiladores Nativos (TypeScript em Go / Rust)',
    'opt-k8s': 'Cloud Native, Kubernetes & FinOps com eBPF',
    'opt-sec': 'Segurança Zero-Trust & Governança HBAC',
  },
  en: {
    'opt-agents': 'Autonomous AI Agents & MCP Automation',
    'opt-ts': 'Native Compilers (TypeScript in Go / Rust)',
    'opt-k8s': 'Cloud Native, Kubernetes & eBPF FinOps',
    'opt-sec': 'Zero-Trust Security & HBAC Governance',
  },
  es: {
    'opt-agents': 'Agentes de IA Autónomos y Automatización MCP',
    'opt-ts': 'Compiladores Nativos (TypeScript en Go / Rust)',
    'opt-k8s': 'Cloud Native, Kubernetes y FinOps con eBPF',
    'opt-sec': 'Seguridad Zero-Trust y Gobernanza HBAC',
  },
};

export const BREAKING_BY_LOCALE: Record<PortalLocale, BreakingNewsItem[]> = {
  'pt-BR': [
    {
      time: '14:32',
      category: 'IA & AGENTES',
      headline:
        'Protocolo MCP consolida padrão aberto para conectar agentes de IA a bancos de dados e repositórios Git',
      articleId: 'art-mcp-agents',
    },
    {
      time: '13:50',
      category: 'TYPESCRIPT',
      headline:
        'Compilador TypeScript portado para Go reduz tempo de build de grandes monorepos de 65s para 6s',
      articleId: 'art-ts-native',
    },
    {
      time: '12:45',
      category: 'LINUX & RUST',
      headline:
        'Kernel Linux aprova nova camada de abstração em Rust para drivers PCI, NVMe e subsistemas de rede',
      articleId: 'art-rust-linux',
    },
    {
      time: '11:20',
      category: 'CLOUD NATIVE',
      headline:
        'Adoção de eBPF e Service Mesh sem sidecars derruba consumo de CPU em clusters Kubernetes de produção',
      articleId: 'art-k8s-ebpf',
    },
    {
      time: '10:05',
      category: 'SEGURANÇA',
      headline:
        'Relatório aponta que tokens de máquina superam credenciais humanas em 14 para 1 nas empresas de tecnologia',
      articleId: 'art-zerotrust-api',
    },
  ],
  en: [
    {
      time: '14:32',
      category: 'AI & AGENTS',
      headline:
        'MCP Protocol consolidates open standard to connect AI agents with SQL databases and Git repositories',
      articleId: 'art-mcp-agents',
    },
    {
      time: '13:50',
      category: 'TYPESCRIPT',
      headline:
        'Native Go-ported TypeScript compiler slashes large monorepo typecheck times from 65s to 6s',
      articleId: 'art-ts-native',
    },
    {
      time: '12:45',
      category: 'LINUX & RUST',
      headline:
        'Linux Kernel approves new Rust abstraction layer for PCI, NVMe drivers and high-speed networking',
      articleId: 'art-rust-linux',
    },
    {
      time: '11:20',
      category: 'CLOUD NATIVE',
      headline:
        'Sidecarless eBPF Service Mesh adoption drops CPU overhead across production Kubernetes clusters by 38%',
      articleId: 'art-k8s-ebpf',
    },
    {
      time: '10:05',
      category: 'SECURITY',
      headline:
        'Report reveals machine tokens outnumber human credentials 14-to-1 across enterprise cloud platforms',
      articleId: 'art-zerotrust-api',
    },
  ],
  es: [
    {
      time: '14:32',
      category: 'IA Y AGENTES',
      headline:
        'El protocolo MCP consolida el estándar abierto para conectar agentes de IA a bases de datos y repositorios Git',
      articleId: 'art-mcp-agents',
    },
    {
      time: '13:50',
      category: 'TYPESCRIPT',
      headline:
        'El compilador TypeScript portado a Go reduce el tiempo de build en grandes monorepos de 65s a 6s',
      articleId: 'art-ts-native',
    },
    {
      time: '12:45',
      category: 'LINUX Y RUST',
      headline:
        'El Kernel de Linux aprueba una nueva capa de abstracción en Rust para drivers PCI, NVMe y subredes',
      articleId: 'art-rust-linux',
    },
    {
      time: '11:20',
      category: 'CLOUD NATIVE',
      headline:
        'La adopción de eBPF y Service Mesh sin sidecars reduce el consumo de CPU en clústeres Kubernetes',
      articleId: 'art-k8s-ebpf',
    },
    {
      time: '10:05',
      category: 'SEGURIDAD',
      headline:
        'Informe señala que los tokens de máquina superan a las credenciales humanas en 14 a 1 en empresas tech',
      articleId: 'art-zerotrust-api',
    },
  ],
};

export const ARTICLE_TRANSLATIONS: Record<
  string,
  Record<'en' | 'es', ArticleLocalizedFields>
> = {
  'art-mcp-agents': {
    en: {
      kicker: 'ENGINEERING REVOLUTION',
      title:
        'Autonomous AI Agents and MCP protocol redefine the software development and operations lifecycle',
      subtitle:
        'Tech organizations move beyond isolated autocomplete assistants and adopt multi-agent architectures integrated via Model Context Protocol (MCP) with HBAC governance and forensic auditing.',
      categoryLabel: 'AI & Agents',
      authorRole: 'Artificial Intelligence & Architecture Desk',
      publishedAt: 'Oct 20, 2026 • 2:15 PM',
      imageAlt: 'Software engineering operations center displaying autonomous AI agent workflows',
      imageCaption:
        'Multi-agent systems now inspect telemetry, run test suites, and open audited pull requests in real time.',
      viewsCount: '48.2k reads',
      tags: ['AI Agents', 'MCP', 'AIOps', 'Software Engineering', 'LLMs'],
      relatedBullets: [
        {
          title: 'Native TypeScript compiler in Go accelerates typechecking up to 10x in large monorepos',
          targetArticleId: 'art-ts-native',
        },
        {
          title: 'Zero-Trust for APIs: how to secure machine tokens and autonomous agents in production',
          targetArticleId: 'art-zerotrust-api',
        },
      ],
      keyTakeaways: [
        'The open Model Context Protocol (MCP) standardized secure communication between frontier LLMs and enterprise tools like Git, SQL databases, and CI/CD pipelines.',
        'AIOps teams report up to a 62% reduction in Mean Time to Resolution (MTTR) by pairing diagnostic agents with structured runbooks.',
        'Governance powered by HBAC (Host & Role-Based Access Control) and SHA-256 forensic trails has become mandatory to approve autonomous production actions.',
      ],
      contentParagraphs: [
        'The first generation of artificial intelligence tools for developers focused almost exclusively on inline code autocomplete inside the IDE. In 2026, the landscape shifted structurally: leading engineering organizations have migrated to autonomous agent architectures capable of planning, executing tests, querying staging databases, and submitting full builds with end-to-end traceability.',
        'The primary catalyst for this transformation was the consolidation of the Model Context Protocol (MCP) as a standardized bridge between frontier models and real enterprise infrastructure. Instead of writing brittle ad-hoc integrations for every internal service, platform teams expose MCP servers with strict read and write scopes.',
        'In practice, when a latency alert fires in production, an AIOps agent can correlate Kubernetes cluster logs, pinpoint the exact Git commit that introduced the regression, generate a corrective patch in an isolated branch, and either request human approval or trigger an instant rollback to a locked release.',
        'Engineering leaders emphasize, however, that autonomy without governance creates operational risk. Modern platforms such as Loft’s AIOps ecosystem therefore combine automation with Version Locks, least-privilege tokens, and SHA-256 cryptographically chained audit logs.',
      ],
    },
    es: {
      kicker: 'REVOLUCIÓN EN INGENIERÍA',
      title:
        'Los agentes de IA autónomos y el protocolo MCP redefinen el ciclo de desarrollo y operación de software',
      subtitle:
        'Las empresas tecnológicas dejan atrás los asistentes aislados de autocompletado y adoptan arquitecturas multiagente integradas vía Model Context Protocol (MCP) con gobernanza HBAC y auditoría.',
      categoryLabel: 'IA y Agentes',
      authorRole: 'Redacción de Inteligencia Artificial y Arquitectura',
      publishedAt: '20 oct 2026 • 14:15',
      imageAlt: 'Centro de operaciones de ingeniería de software con flujos de agentes de IA autónomos',
      imageCaption:
        'Los sistemas multiagente ahora inspeccionan telemetría, ejecutan pruebas y abren pull requests auditados en tiempo real.',
      viewsCount: '48,2 mil lecturas',
      tags: ['Agentes de IA', 'MCP', 'AIOps', 'Ingeniería de Software', 'LLMs'],
      relatedBullets: [
        {
          title: 'El compilador nativo de TypeScript en Go acelera la verificación de tipos hasta 10x en monorepos',
          targetArticleId: 'art-ts-native',
        },
        {
          title: 'Zero-Trust para APIs: cómo proteger tokens de máquina y agentes en producción',
          targetArticleId: 'art-zerotrust-api',
        },
      ],
      keyTakeaways: [
        'El protocolo abierto MCP (Model Context Protocol) estandarizó la comunicación segura entre modelos de lenguaje y herramientas corporativas como Git, bases SQL y pipelines CI/CD.',
        'Los equipos de AIOps reportan una reducción de hasta el 62% en el tiempo medio de resolución de incidentes (MTTR) al combinar agentes de diagnóstico con runbooks estructurados.',
        'La gobernanza basada en HBAC y las cadenas forenses SHA-256 se volvieron obligatorias para aprobar acciones autónomas en producción.',
      ],
      contentParagraphs: [
        'La primera generación de herramientas de inteligencia artificial para desarrolladores se centraba casi exclusivamente en autocompletar líneas de código dentro del IDE. En 2026, el panorama cambió de forma estructural: las grandes organizaciones de ingeniería migraron hacia arquitecturas de agentes autónomos capaces de planificar, ejecutar pruebas, consultar bases de datos y publicar builds completas con trazabilidad de extremo a extremo.',
        'El gran catalizador de esta transformación fue la consolidación del Model Context Protocol (MCP) como puente estandarizado entre los modelos de frontera y la infraestructura real de las empresas. En lugar de crear integraciones frágiles para cada servicio interno, los equipos de plataforma exponen servidores MCP con alcances estrictos de lectura y escritura.',
        'En la práctica, cuando se dispara una alerta de latencia en producción, un agente de AIOps puede correlacionar los logs del clúster Kubernetes, identificar el commit exacto en Git que introdujo la regresión, generar el parche correctivo en una rama aislada y solicitar aprobación humana o activar el rollback instantáneo.',
        'Los especialistas destacan que la autonomía sin gobernanza genera riesgo operativo. Por ello, plataformas modernas como el ecosistema AIOps de Loft combinan automatización con bloqueo de versiones (Version Lock), tokens de mínimo privilegio y registros de auditoría encadenados mediante hash criptográfico SHA-256.',
      ],
    },
  },
  'art-ts-native': {
    en: {
      kicker: 'COMPILERS & DEVTOOLS',
      title:
        'New native TypeScript compiler delivers 10x speed boost and cuts memory footprint in half',
      subtitle:
        'Official port of the tsc typechecker to native code transforms developer experience across enterprise codebases with hundreds of thousands of lines.',
      categoryLabel: 'Engineering & Dev',
      authorRole: 'Compilers & JS/TS Ecosystem Specialist',
      publishedAt: 'Oct 20, 2026 • 1:40 PM',
      imageAlt: 'Technical visualization of TypeScript syntax trees compiling at high speed',
      imageCaption:
        'Concurrent architecture and compact memory layout eliminate the primary bottleneck in TypeScript CI/CD pipelines.',
      viewsCount: '34.9k reads',
      tags: ['TypeScript', 'Compilers', 'Go', 'Performance', 'Frontend'],
      keyTakeaways: [
        'Full semantic typechecking (tsc --noEmit), previously bound to single-threaded JavaScript execution, now leverages native parallelism across all CPU cores.',
        'IDE language servers (LSP) initialize massive enterprise projects in under 1.5 seconds.',
        '100% semantic compatibility with existing TypeScript codebases ensures a seamless drop-in upgrade for React, Vite, and Node.js projects.',
      ],
      contentParagraphs: [
        'For years, TypeScript faced a striking paradox: while bundlers like esbuild, SWC, and Rolldown transpiled files in milliseconds using Go and Rust, full semantic typechecking remained tied to the original tsc implementation running on top of a JavaScript engine.',
        'The architectural decision to port the TypeScript compiler codebase directly to native Go resolved this historic bottleneck. By preserving the exact semantics of the original typechecker while adopting OS-level concurrency and contiguous memory layouts, the native compiler achieves average 10x speedups.',
        'In benchmarks conducted on enterprise monorepos exceeding 1.2 million lines of code, continuous integration typechecking time dropped from 68 seconds to just 6.4 seconds, drastically lowering cloud runner costs and accelerating developer feedback loops.',
      ],
    },
    es: {
      kicker: 'COMPILADORES Y DEVTOOLS',
      title:
        'El nuevo compilador nativo de TypeScript entrega una mejora de 10x en velocidad y reduce el uso de memoria a la mitad',
      subtitle:
        'El porte oficial del compilador tsc a código nativo transforma la experiencia en proyectos corporativos con cientos de miles de líneas.',
      categoryLabel: 'Ingeniería y Dev',
      authorRole: 'Especialista en Compiladores y Ecosistema JS/TS',
      publishedAt: '20 oct 2026 • 13:40',
      imageAlt: 'Visualización técnica de un árbol sintáctico TypeScript compilándose a alta velocidad',
      imageCaption:
        'La arquitectura concurrente y la asignación eficiente de memoria eliminan el principal cuello de botella en pipelines CI/CD.',
      viewsCount: '34,9 mil lecturas',
      tags: ['TypeScript', 'Compiladores', 'Go', 'Rendimiento', 'Frontend'],
      keyTakeaways: [
        'La verificación completa de tipos (tsc --noEmit), que antes dependía de ejecución monohilo en JavaScript, ahora aprovecha el paralelismo nativo en todos los núcleos de la CPU.',
        'Los servidores de lenguaje (LSP) en los IDEs abren proyectos masivos en menos de 1,5 segundos.',
        'La compatibilidad semántica total con la base existente de TypeScript garantiza una migración transparente para proyectos React, Vite y Node.js.',
      ],
      contentParagraphs: [
        'Durante años, TypeScript enfrentó una paradoja curiosa: mientras empaquetadores como esbuild, SWC y Rolldown transpilaban archivos en milisegundos usando Go y Rust, la verificación semántica completa de tipos seguía atada a la implementación original ejecutándose sobre el motor JavaScript.',
        'La decisión arquitectónica de portar directamente la base de código del compilador TypeScript a Go nativo resolvió este cuello de botella histórico. Al preservar la estructura exacta del verificador original mientras adopta concurrencia a nivel de sistema operativo, el nuevo compilador alcanza ganancias medias de 10x en velocidad.',
        'En pruebas realizadas en monorepos corporativos con más de 1,2 millones de líneas de código, el tiempo de verificación en integración continua cayó de 68 segundos a solo 6,4 segundos, reduciendo drásticamente el costo en la nube.',
      ],
    },
  },
  'art-rust-linux': {
    en: {
      kicker: 'OPERATING SYSTEMS',
      title:
        'Linux Kernel consolidates Rust modules for low-latency networking and NVMe storage drivers',
      subtitle:
        'Initiative eliminates critical memory-corruption vulnerabilities without sacrificing the raw throughput demanded by hyperscale data centers.',
      categoryLabel: 'Engineering & Dev',
      authorRole: 'Systems & Core Infrastructure Reporter',
      publishedAt: 'Oct 20, 2026 • 12:30 PM',
      imageAlt: 'Systems engineering illustration representing memory-safe Linux Kernel modules',
      imageCaption:
        'New drivers written in Rust coexist seamlessly alongside historic C code inside the operating system kernel.',
      viewsCount: '29.1k reads',
      tags: ['Rust', 'Linux Kernel', 'Systems', 'Memory Safety', 'Open Source'],
      keyTakeaways: [
        'Over 65% of historical high-severity kernel vulnerabilities stem from memory safety issues (use-after-free and buffer overflows).',
        'Rust’s ownership model eliminates this entire class of bugs at compile time with zero garbage collection overhead.',
        'Major cloud providers already run hybrid C/Rust kernels across millions of production instances.',
      ],
      contentParagraphs: [
        'What began as a cautious experiment inside the official Linux source tree has grown into one of the most consequential shifts in modern systems engineering. With stabilized abstractions for PCI buses, block allocators, and 400 Gbps Ethernet subsystems, Rust in the kernel has graduated from experimental status.',
        'For maintainers of mission-critical infrastructure, the advantage is immediate: third-party drivers and subsystems handling untrusted network packets or ultra-fast storage devices now benefit from compile-time guarantees against invalid pointer dereferences and data races.',
        'According to kernel security engineers, the strategy is not to rewrite tens of millions of battle-tested C lines overnight, but to ensure that new critical components are born free of memory vulnerabilities from their very first commit.',
      ],
    },
    es: {
      kicker: 'SISTEMAS OPERATIVOS',
      title:
        'El Kernel de Linux consolida módulos en Rust para drivers de red y almacenamiento NVMe de baja latencia',
      subtitle:
        'La iniciativa reduce vulnerabilidades críticas de corrupción de memoria sin sacrificar el rendimiento bruto exigido por los centros de datos.',
      categoryLabel: 'Ingeniería y Dev',
      authorRole: 'Reportera de Sistemas e Infraestructura Base',
      publishedAt: '20 oct 2026 • 12:30',
      imageAlt: 'Ilustración de ingeniería de sistemas representando módulos seguros del Kernel Linux',
      imageCaption:
        'Los nuevos drivers escritos en Rust conviven junto al código histórico en C en el núcleo del sistema operativo.',
      viewsCount: '29,1 mil lecturas',
      tags: ['Rust', 'Linux Kernel', 'Sistemas', 'Seguridad de Memoria', 'Open Source'],
      keyTakeaways: [
        'Más del 65% de las vulnerabilidades históricas de alta severidad en kernels provienen de fallos de acceso a memoria (use-after-free y buffer overflow).',
        'El modelo de ownership de Rust elimina esta clase de errores en tiempo de compilación, sin recolector de basura.',
        'Los proveedores de nube ya ejecutan kernels híbridos C/Rust en millones de instancias de producción.',
      ],
      contentParagraphs: [
        'Lo que comenzó como un experimento cauteloso dentro del árbol oficial de Linux se ha convertido en uno de los movimientos más relevantes de la ingeniería de software moderna. Con la estabilización de las abstracciones para buses PCI, asignadores de bloques y subsistemas de red Ethernet de 400 Gbps, el uso de Rust en el kernel dejó la etapa experimental.',
        'Para los mantenedores de infraestructura crítica, la ventaja es directa: los drivers que procesan paquetes externos o dispositivos NVMe de altísima velocidad cuentan ahora con garantías matemáticas contra accesos inválidos de punteros y condiciones de carrera.',
        'Según los ingenieros de seguridad en sistemas operativos, la estrategia no es reescribir decenas de millones de líneas en C que funcionan hace décadas, sino asegurar que los nuevos componentes críticos nazcan libres de vulnerabilidades de memoria desde el primer commit.',
      ],
    },
  },
  'art-k8s-ebpf': {
    en: {
      kicker: 'CLOUD & FINOPS',
      title:
        'Kubernetes and eBPF: how sidecarless service mesh cut cloud compute costs by 38%',
      subtitle:
        'Removing per-pod injected proxies frees gigabytes of RAM and simplifies microservice observability at scale.',
      categoryLabel: 'Cloud & DevOps',
      authorRole: 'Cloud Native & SRE Columnist',
      publishedAt: 'Oct 20, 2026 • 11:15 AM',
      imageAlt: 'Modern cloud data center corridor with fiber-optic server racks',
      imageCaption:
        'Direct kernel instrumentation via eBPF replaces hundreds of auxiliary proxy containers in enterprise clusters.',
      viewsCount: '21.7k reads',
      tags: ['Kubernetes', 'eBPF', 'FinOps', 'Cloud Native', 'DevOps'],
      keyTakeaways: [
        'Sidecarless architectures move mTLS encryption and L4/L7 routing to the node kernel level via eBPF.',
        'Immediate reduction in pod startup latency and lower scheduling pressure on the Kubernetes control plane.',
        'Full visibility into HTTP, gRPC, and SQL queries without modifying application code.',
      ],
      contentParagraphs: [
        'During the first wave of Kubernetes Service Mesh adoption, the dominant pattern required injecting a proxy container alongside every application pod. While effective for standardizing mTLS and telemetry, this model exacted a steep toll on clusters running thousands of pods: dozens of vCPUs and hundreds of gigabytes of RAM consumed purely by intermediary plumbing.',
        'With eBPF (Extended Berkeley Packet Filter) maturing directly inside worker node kernels, SRE and FinOps teams found a far leaner architecture. Network packets are intercepted, authenticated, and measured directly in kernel space without extra loopback hops.',
        'Recent benchmarks across Latin American technology companies show average savings of 30% to 38% on cloud compute bills after migrating to eBPF-powered meshes, alongside sharp drops in tail latency (p99) for critical APIs.',
      ],
    },
    es: {
      kicker: 'CLOUD Y FINOPS',
      title:
        'Kubernetes y eBPF: cómo la malla de servicios sin sidecars redujo en 38% el costo computacional en la nube',
      subtitle:
        'La eliminación de proxies inyectados por pod libera gigabytes de RAM y simplifica la observabilidad de microservicios a gran escala.',
      categoryLabel: 'Cloud y DevOps',
      authorRole: 'Columnista de Cloud Native y SRE',
      publishedAt: '20 oct 2026 • 11:15',
      imageAlt: 'Pasillo de centro de datos moderno con servidores en la nube y fibra óptica',
      imageCaption:
        'La instrumentación directa en el kernel vía eBPF reemplaza cientos de contenedores auxiliares en clústeres corporativos.',
      viewsCount: '21,7 mil lecturas',
      tags: ['Kubernetes', 'eBPF', 'FinOps', 'Cloud Native', 'DevOps'],
      keyTakeaways: [
        'Las arquitecturas sin sidecars trasladan el cifrado mTLS y el enrutamiento L4/L7 al nivel del nodo mediante eBPF.',
        'Reducción inmediata en el tiempo de arranque de pods y menor presión sobre el planificador de Kubernetes.',
        'Visibilidad completa de llamadas HTTP, gRPC y consultas SQL sin necesidad de modificar el código de la aplicación.',
      ],
      contentParagraphs: [
        'Durante la primera ola de adopción de Service Mesh en Kubernetes, el patrón dominante exigía inyectar un contenedor proxy junto a cada pod de aplicación. Aunque eficaz para estandarizar mTLS y telemetría, este modelo cobraba un precio alto en clústeres con miles de pods.',
        'Con la consolidación de eBPF directamente en el kernel de los nodos de trabajo, los equipos de SRE y FinOps encontraron una alternativa mucho más ligera. Los paquetes de red son interceptados, autenticados y medidos directamente en el espacio del kernel.',
        'Estudios recientes en empresas tecnológicas muestran ahorros medios del 30% al 38% en la factura de cómputo en la nube tras migrar a mallas basadas en eBPF, además de caídas expresivas en la latencia p99 de las APIs críticas.',
      ],
    },
  },
  'art-zerotrust-api': {
    en: {
      kicker: 'CYBERSECURITY & IAM',
      title:
        'Zero-Trust for APIs and machine identities: the new critical perimeter of enterprise security',
      subtitle:
        'With the explosive growth of CI/CD pipelines, microservices, and AI agents, protecting API keys with Fernet encryption and HBAC is priority number one.',
      categoryLabel: 'Cybersecurity',
      authorRole: 'Chief Information Security Analyst',
      publishedAt: 'Oct 20, 2026 • 10:00 AM',
      imageAlt: 'Digital shield representing Zero-Trust architecture and cryptographic API protection',
      imageCaption:
        'Automated token rotation, default masking, and immutable auditing block credential leaks before they escalate.',
      viewsCount: '19.4k reads',
      tags: ['Zero Trust', 'Security', 'API Keys', 'HBAC', 'Auditing'],
      keyTakeaways: [
        'Non-human identities (CI/CD tokens, service keys, and webhooks) now account for over 90% of authenticated cloud traffic.',
        'Secrets must never be displayed in plaintext by default: revealing a token requires explicit re-authentication and generates an immediate forensic log.',
        'SHA-256 signed audit chains prevent retroactive tampering with access records.',
      ],
      contentParagraphs: [
        'The legacy security model built solely around perimeter firewalls and human user logins can no longer keep pace with modern digital platforms. Today, for every engineer signed into an admin console, dozens of deploy tokens, continuous integration keys, and service credentials operate 24/7.',
        'Modern security architectures therefore enforce Zero-Trust principles strictly on machine credentials: irreversible hashing for fast validation, strong symmetric encryption (such as Fernet AES-128) for managed secrets, and mandatory masking in the user interface.',
        'Furthermore, Host and Role-Based Access Control (HBAC/RBAC) guarantees that a token scoped strictly to upload static builds to a single repository can never alter permission rules or overwrite locked production releases.',
      ],
    },
    es: {
      kicker: 'CIBERSEGURIDAD E IAM',
      title:
        'Zero-Trust para APIs e identidades de máquina: el nuevo perímetro crítico de la seguridad corporativa',
      subtitle:
        'Con el crecimiento explosivo de pipelines CI/CD, microservicios y agentes de IA, proteger claves de API con cifrado Fernet y HBAC es la prioridad número uno.',
      categoryLabel: 'Ciberseguridad',
      authorRole: 'Analista Jefa de Seguridad de la Información',
      publishedAt: '20 oct 2026 • 10:00',
      imageAlt: 'Escudo digital representando arquitectura Zero-Trust y protección criptográfica de APIs',
      imageCaption:
        'La rotación automatizada de tokens, el enmascaramiento por defecto y la auditoría inmutable bloquean fugas de credenciales.',
      viewsCount: '19,4 mil lecturas',
      tags: ['Zero Trust', 'Seguridad', 'API Keys', 'HBAC', 'Auditoría'],
      keyTakeaways: [
        'Las identidades no humanas (tokens CI/CD, claves de servicio y webhooks) ya representan más del 90% del tráfico autenticado en la nube.',
        'Las claves nunca deben mostrarse en texto plano por defecto: revelarlas exige reautenticación explícita y genera un registro forense inmediato.',
        'Las cadenas de auditoría firmadas con SHA-256 impiden la manipulación retroactiva de los registros de acceso.',
      ],
      contentParagraphs: [
        'El antiguo modelo de seguridad basado únicamente en cortafuegos perimetrales e inicios de sesión humanos ya no responde a la realidad de las plataformas digitales modernas. Hoy, por cada ingeniero autenticado en un panel administrativo, existen docenas de tokens de despliegue y credenciales de servicio operando las 24 horas.',
        'Por esta razón, las arquitecturas modernas adoptan el principio Zero-Trust aplicado rigurosamente a las credenciales de máquina: almacenamiento con hash irreversible para validación rápida, cifrado simétrico fuerte (Fernet AES-128) y enmascaramiento obligatorio en la interfaz gráfica.',
        'Además, el control de acceso basado en roles y grupos (HBAC/RBAC) garantiza que un token creado únicamente para subir builds estáticas en un repositorio jamás pueda alterar reglas de permisos ni eliminar versiones bloqueadas en producción.',
      ],
    },
  },
  'art-chips-2nm': {
    en: {
      kicker: 'SEMICONDUCTORS & HARDWARE',
      title:
        '2-nanometer lithography and HBM4 memory usher in a new era of energy efficiency for AI',
      subtitle:
        'Gate-All-Around (GAA) transistors pack billions of neural cores with a 45% drop in power consumption per generated token.',
      categoryLabel: 'Chips & Hardware',
      authorRole: 'Hardware & Semiconductors Editor',
      publishedAt: 'Oct 20, 2026 • 9:10 AM',
      imageAlt: 'Macro photograph of a 2-nanometer silicon wafer and neural processor circuitry',
      imageCaption:
        'Next-generation 2nm wafers combine nanosheet transistors with three-dimensional memory stacking.',
      viewsCount: '26.8k reads',
      tags: ['Semiconductors', '2nm', 'NPU', 'Hardware', 'Local AI'],
      keyTakeaways: [
        'GAA (Gate-All-Around) transistors replace traditional FinFET to control electron flow at the atomic scale.',
        'Enterprise workstations and laptops now run coding and reasoning models locally with zero network latency.',
        'Energy efficiency has become the primary competitive differentiator for hyperscale data centers.',
      ],
      contentParagraphs: [
        'The global semiconductor industry has reached a physical milestone that seemed distant just a few years ago: high-volume commercial production at the 2-nanometer node. At this scale, where silicon structures measure only a few dozen atoms across, traditional FinFET architecture has given way to Gate-All-Around (GAA) nanosheet transistors.',
        'The practical impact extends far beyond cloud training supercomputers. With denser dedicated NPUs (Neural Processing Units) coupled to ultra-high-bandwidth unified memory buses, developers can now run complex reasoning models directly on their local machines.',
        'Inside data centers, combining 2nm processors with HBM4 memory directly tackles the tech sector’s biggest infrastructure challenge: electrical power draw and thermal dissipation across inference clusters.',
      ],
    },
    es: {
      kicker: 'SEMICONDUCTORES Y HARDWARE',
      title:
        'La litografía de 2 nanómetros y la memoria HBM4 inauguran una nueva era de eficiencia energética para la IA',
      subtitle:
        'Los transistores Gate-All-Around (GAA) permiten empaquetar miles de millones de núcleos. Cae un 45% el consumo eléctrico por token generado.',
      categoryLabel: 'Chips y Hardware',
      authorRole: 'Editor de Hardware y Semiconductores',
      publishedAt: '20 oct 2026 • 09:10',
      imageAlt: 'Fotografía macro de una oblea de silicio de 2 nanómetros y circuitos de procesador neural',
      imageCaption:
        'La nueva generación de obleas de 2nm combina transistores nanosheet con apilamiento tridimensional de memoria.',
      viewsCount: '26,8 mil lecturas',
      tags: ['Semiconductores', '2nm', 'NPU', 'Hardware', 'IA Local'],
      keyTakeaways: [
        'Los transistores GAA (Gate-All-Around) reemplazan al FinFET tradicional para controlar el flujo de electrones a escala atómica.',
        'Las estaciones de trabajo y portátiles corporativos ya ejecutan modelos de código y razonamiento localmente sin latencia de red.',
        'La eficiencia energética se ha convertido en el principal diferencial competitivo para los centros de datos de hiperescala.',
      ],
      contentParagraphs: [
        'La industria global de semiconductores alcanzó un hito físico que parecía lejano hace pocos años: la producción comercial en volumen en la litografía de 2 nanómetros. A esta escala, donde las estructuras de silicio miden apenas unas docenas de átomos de ancho, la arquitectura FinFET dio paso a los transistores Gate-All-Around (GAA).',
        'El impacto práctico va mucho más allá de las supercomputadoras de entrenamiento en la nube. Con NPUs dedicadas cada vez más densas e integradas a buses de memoria unificada de altísimo ancho de banda, los desarrolladores ahora pueden ejecutar modelos complejos directamente en sus máquinas locales.',
        'En los centros de datos, la combinación de chips en 2nm con memorias HBM4 aborda directamente el mayor desafío del sector tecnológico actual: el consumo de energía eléctrica y la disipación térmica de los clústeres de inferencia.',
      ],
    },
  },
  'art-web-baseline': {
    en: {
      kicker: 'WEB PLATFORM & FRONTEND',
      title:
        'Native Web on the rise: modern HTML and CSS APIs retire heavy libraries and accelerate static sites',
      subtitle:
        'Features like <dialog>, fetchpriority="high", @starting-style transitions, and content-visibility deliver rich interfaces with up to 70% smaller JS bundles.',
      categoryLabel: 'Frontend & Web',
      authorRole: 'Web Performance & Design Systems Specialist',
      publishedAt: 'Oct 20, 2026 • 8:30 AM',
      imageAlt: 'Modern high-performance web application architecture',
      imageCaption:
        'News portals and static applications achieve top Core Web Vitals scores using native browser capabilities.',
      viewsCount: '17.3k reads',
      tags: ['HTML5', 'Modern CSS', 'Web Performance', 'LCP', 'Copan Design'],
      keyTakeaways: [
        'The fetchpriority="high" attribute on the main hero image (LCP) accelerates visual rendering of the top story in news portals.',
        'The native <dialog> element handles focus trapping, ESC key dismissal, and top-layer backdrop without external modal libraries.',
        'Pure static builds (HTML, CSS, JS, and optimized images) hosted in versioned Git directories deliver the lowest possible latency.',
      ],
      contentParagraphs: [
        'For a long time, building essential UI primitives—such as an accessible modal dialog, smooth top-layer animations, or dark/light theme switching—required importing dozens of external packages that bloated the final JavaScript bundle shipped to users.',
        'With coordinated browser engine evolution under the Baseline Web initiative, the native platform now handles these responsibilities out of the box. The HTML <dialog> element paired with @starting-style and content-visibility: auto provides top-layer management, keyboard accessibility, and deferred off-screen rendering with minimal TypeScript.',
        'For technology news portals and engineering documentation, combining TypeScript compiled to lean JavaScript with Git-versioned static builds represents the ideal balance between developer ergonomics, security, and instant page load speed.',
      ],
    },
    es: {
      kicker: 'PLATAFORMA WEB Y FRONTEND',
      title:
        'Web Nativa en alza: las APIs modernas de HTML y CSS jubilan librerías pesadas y aceleran sitios estáticos',
      subtitle:
        'Recursos como <dialog>, fetchpriority="high", @starting-style y content-visibility entregan interfaces ricas con paquetes JS hasta un 70% más pequeños.',
      categoryLabel: 'Frontend y Web',
      authorRole: 'Especialista en Web Performance y Design Systems',
      publishedAt: '20 oct 2026 • 08:30',
      imageAlt: 'Arquitectura moderna de aplicaciones web de alto rendimiento',
      imageCaption:
        'Los portales de noticias y aplicaciones estáticas alcanzan la máxima puntuación en Core Web Vitals usando recursos nativos del navegador.',
      viewsCount: '17,3 mil lecturas',
      tags: ['HTML5', 'CSS Moderno', 'Web Performance', 'LCP', 'Copan Design'],
      keyTakeaways: [
        'El atributo fetchpriority="high" en la imagen principal (LCP) anticipa la carga visual del titular en portales de noticias.',
        'El elemento nativo <dialog> gestiona el foco, la tecla ESC y el backdrop sin depender de librerías externas de modales.',
        'Las builds estáticas puras (HTML, CSS, JS e imágenes optimizadas) alojadas en directorios versionados ofrecen la menor latencia posible.',
      ],
      contentParagraphs: [
        'Durante mucho tiempo, crear elementos básicos de interfaz —como un modal accesible, transiciones de capa superior o un sistema de temas claro y oscuro— exigía importar docenas de paquetes externos que inflaban el bundle final enviado al navegador.',
        'Con la evolución coordinada de los motores de renderizado bajo la iniciativa Baseline Web, la propia plataforma nativa asumió estas responsabilidades con excelencia. El elemento HTML <dialog> combinado con @starting-style y content-visibility: auto ofrece gestión nativa de top-layer y accesibilidad por teclado con pocas líneas de TypeScript.',
        'Para portales de noticias y documentación técnica, combinar TypeScript compilado a JavaScript ligero con builds estáticas versionadas vía Git representa el equilibrio ideal entre experiencia de desarrollo, seguridad y velocidad instantánea de carga.',
      ],
    },
  },
};
