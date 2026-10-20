// ============================================================================

// PORTAL LOFT — Build Estática Compilada a partir de TypeScript (v1.1.0)

// Multilíngue (PT-BR / EN / ES) • Design System Copan • HTML + CSS + JS + IMG

// ============================================================================

(() => {

                                          
                   
           
        
                
           
               
              
          
                        
                     
                
                
                  
 
                         
                
                          
 
                                  
                 
                
                   
                        
                     
                      
                   
                       
                     
                 
                                   
                         
                              
 
                                                      
             
               
                         
                 
                         
                   
                                                                 
                                                                       
 
                          
                 
               
                
                    
                      
 
                            
               
                   
                   
                    
 
                      
             
                
                
 
                           
                    
                       
                         
                       
                            
                           
                        
                         
                           
                       
                              
                         
                           
                         
                           
                             
                          
                        
                          
                         
                             
                         
                            
                          
                          
                          
                           
                         
                        
                     
                    
                       
                         
                        
                          
                          
                         
                      
                     
                            
                           
                           
                           
                          
                         
                                
                              
                                
                            
                         
                          
                              
                         
                               
                             
                         
                          
                                
                                  
                         
                        
                        
                          
                             
                          
                            
                          
                               
                                
 


const UI_TRANSLATIONS                                        = {
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
const CATEGORY_LABELS_BY_LOCALE                                                     = {
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
const POLL_LABELS_BY_LOCALE                                               = {
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
const BREAKING_BY_LOCALE                                           = {
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
const ARTICLE_TRANSLATIONS         
         
                                             
  = {
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


const CATEGORIES                 = [
  { slug: 'todas', label: 'Capa • Todas', color: '#FF5A26', badgeBg: 'rgba(255, 90, 38, 0.14)' },
  { slug: 'ia', label: 'IA & Agentes', color: '#FF5A26', badgeBg: 'rgba(255, 90, 38, 0.14)' },
  { slug: 'engenharia', label: 'Engenharia & Dev', color: '#0284C7', badgeBg: 'rgba(2, 132, 199, 0.14)' },
  { slug: 'cloud', label: 'Cloud & DevOps', color: '#0D9488', badgeBg: 'rgba(13, 148, 136, 0.14)' },
  { slug: 'seguranca', label: 'Cibersegurança', color: '#DC2626', badgeBg: 'rgba(220, 38, 38, 0.14)' },
  { slug: 'hardware', label: 'Chips & Hardware', color: '#7C3AED', badgeBg: 'rgba(124, 58, 237, 0.14)' },
  { slug: 'web', label: 'Frontend & Web', color: '#D97706', badgeBg: 'rgba(217, 119, 6, 0.14)' },
];
const TECH_TICKER                   = [
  { symbol: 'NASDAQ-100', name: 'Tech Index', value: '21.480 pts', variation: '+1,42%', isPositive: true },
  { symbol: 'NVDA', name: 'AI Compute', value: 'US$ 148,90', variation: '+2,85%', isPositive: true },
  { symbol: 'MSFT', name: 'Cloud & Copilot', value: 'US$ 462,10', variation: '+1,18%', isPositive: true },
  { symbol: 'TSMC', name: '2nm Foundry', value: 'US$ 204,50', variation: '+3,12%', isPositive: true },
  { symbol: 'CLOUD-LATENCY', name: 'SA-East-1 (SP)', value: '11.4 ms', variation: '-0,8 ms', isPositive: true },
  { symbol: 'GITHUB-PRs', name: 'AI Assisted', value: '68,4%', variation: '+4,1%', isPositive: true },
];
const ARTICLES                = [
  {
    id: 'art-mcp-agents',
    slug: 'agentes-ia-autonomos-protocolo-mcp-engenharia-software',
    kicker: 'REVOLUÇÃO NA ENGENHARIA',
    title: 'Agentes de IA autônomos e protocolo MCP redefinem o ciclo de desenvolvimento e operação de software',
    subtitle:
      'Empresas de tecnologia deixam para trás os assistentes de autocompletar isolados e adotam arquiteturas multi-agentes integradas via Model Context Protocol (MCP) com governança HBAC e auditoria.',
    category: 'ia',
    categoryLabel: 'IA & Agentes',
    author: 'Redação Portal Loft Tech',
    authorRole: 'Editoria de Inteligência Artificial & Arquitetura',
    publishedAt: '20 out 2026 • 14h15',
    readingTimeMin: 6,
    imageUrl: './img/hero-ai-agents.png',
    imageAlt: 'Centro de operações de engenharia de software com fluxos de agentes de IA autônomos',
    imageCaption: 'Sistemas multi-agentes agora inspecionam telemetria, executam testes e abrem pull requests auditados em tempo real.',
    featuredRank: 'hero',
    viewsCount: '48,2 mil leituras',
    tags: ['Agentes de IA', 'MCP', 'AIOps', 'Engenharia de Software', 'LLMs'],
    relatedBullets: [
      {
        title: 'TypeScript nativo em Go acelera checagem de tipos em até 10x em grandes monorepos',
        targetArticleId: 'art-ts-native',
      },
      {
        title: 'Zero-Trust para APIs: como proteger tokens de máquina e agentes em produção',
        targetArticleId: 'art-zerotrust-api',
      },
    ],
    keyTakeaways: [
      'O protocolo aberto MCP (Model Context Protocol) padronizou a comunicação segura entre modelos de linguagem e ferramentas corporativas como Git, bancos SQL e pipelines CI/CD.',
      'Equipes de AIOps relatam redução de até 62% no tempo médio de resolução de incidentes (MTTR) ao combinar agentes de diagnóstico com runbooks estruturados.',
      'Governança baseada em HBAC (Host & Role-Based Access Control) e trilhas forenses SHA-256 tornaram-se obrigatórias para aprovar ações autônomas em produção.',
    ],
    contentParagraphs: [
      'A primeira geração de ferramentas de inteligência artificial para desenvolvedores focava quase exclusivamente no autocompletar de linhas de código dentro da IDE. Em 2026, o cenário mudou de forma estrutural: grandes organizações de engenharia migraram para arquiteturas de agentes autônomos capazes de planejar, executar testes, consultar bancos de dados de homologação e submeter builds completas com rastreabilidade ponta a ponta.',
      'O grande catalisador dessa transformação foi a consolidação do Model Context Protocol (MCP) como barreira e ponte padronizada entre modelos de fronteira e a infraestrutura real das empresas. Em vez de criar integrações frágeis para cada serviço interno, times de plataforma expõem servidores MCP com escopos estritos de leitura e escrita.',
      'Na prática, quando um alerta de latência dispara em produção, um agente de AIOps pode correlacionar os logs do cluster Kubernetes, identificar o commit exato no repositório Git que introduziu a regressão, gerar o patch corretivo em uma branch isolada e solicitar aprovação humana ou acionar o rollback instantâneo da versão travada.',
      'Especialistas de engenharia destacam, porém, que autonomia sem governança gera risco operacional. Por isso, plataformas modernas como o ecossistema AIOps da Loft combinam automação com travas de versão (Version Lock), tokens com escopo mínimo e registros de auditoria encadeados por hash criptográfico SHA-256.',
    ],
  },
  {
    id: 'art-ts-native',
    slug: 'typescript-compilador-nativo-go-10x-mais-rapido',
    kicker: 'COMPILADORES & DEVTOOLS',
    title: 'Novo compilador nativo do TypeScript entrega ganho de 10x em velocidade e reduz uso de memória pela metade',
    subtitle:
      'Porte oficial do compilador tsc para código nativo transforma a experiência em projetos corporativos com centenas de milhares de linhas.',
    category: 'engenharia',
    categoryLabel: 'Engenharia & Dev',
    author: 'Lucas Andrade',
    authorRole: 'Especialista em Compiladores & Ecossistema JS/TS',
    publishedAt: '20 out 2026 • 13h40',
    readingTimeMin: 5,
    imageUrl: './img/typescript-compiler.png',
    imageAlt: 'Visualização técnica de árvore sintática TypeScript sendo compilada em alta velocidade',
    imageCaption: 'Arquitetura concorrente e alocação eficiente de memória eliminam o principal gargalo de pipelines CI/CD em TypeScript.',
    featuredRank: 'subhero-1',
    viewsCount: '34,9 mil leituras',
    tags: ['TypeScript', 'Compiladores', 'Go', 'Performance', 'Frontend'],
    keyTakeaways: [
      'A verificação completa de tipos (tsc --noEmit), que antes dependia de execução single-thread em JavaScript, agora aproveita paralelismo nativo em todos os núcleos da CPU.',
      'Servidores de linguagem (LSP) nas IDEs abrem projetos massivos em menos de 1,5 segundo.',
      'Compatibilidade total de semântica com a base existente do TypeScript garante migração transparente para projetos React, Vite e Node.js.',
    ],
    contentParagraphs: [
      'Durante anos, o TypeScript enfrentou um paradoxo curioso: enquanto bundlers como esbuild, SWC e Rolldown passaram a transpilar arquivos em milissegundos usando Go e Rust, a verificação semântica completa de tipos (typechecking) continuava presa à implementação original do tsc rodando sobre o motor JavaScript.',
      'A decisão arquitetural de portar diretamente a base de código do compilador TypeScript para Go nativo resolveu esse gargalo histórico. Ao preservar a estrutura exata do verificador de tipos original enquanto adota concorrência em nível de sistema operacional e layout contíguo de memória, o novo compilador atinge ganhos médios de 10x em velocidade.',
      'Em benchmarks realizados em monorepos corporativos com mais de 1,2 milhão de linhas de código, o tempo de checagem no pipeline de integração contínua caiu de 68 segundos para apenas 6,4 segundos, reduzindo drasticamente o custo de runners em nuvem e acelerando o feedback para desenvolvedores.',
    ],
  },
  {
    id: 'art-rust-linux',
    slug: 'linux-kernel-expande-modulos-rust-drivers-rede-nvme',
    kicker: 'SISTEMAS OPERACIONAIS',
    title: 'Linux Kernel consolida módulos em Rust para drivers de rede e armazenamento NVMe de baixa latência',
    subtitle:
      'Iniciativa reduz vulnerabilidades críticas de corrupção de memória sem abrir mão da performance bruta exigida por data centers.',
    category: 'engenharia',
    categoryLabel: 'Engenharia & Dev',
    author: 'Mariana Costa',
    authorRole: 'Repórter de Sistemas & Infraestrutura Base',
    publishedAt: '20 out 2026 • 12h30',
    readingTimeMin: 5,
    imageUrl: './img/rust-linux-kernel.png',
    imageAlt: 'Ilustração de engenharia de sistemas representando módulos seguros do Kernel Linux',
    imageCaption: 'Novos drivers escritos em Rust convivem lado a lado com o código histórico em C no núcleo do sistema operacional.',
    featuredRank: 'subhero-2',
    viewsCount: '29,1 mil leituras',
    tags: ['Rust', 'Linux Kernel', 'Sistemas', 'Segurança de Memória', 'Open Source'],
    keyTakeaways: [
      'Mais de 65% das vulnerabilidades históricas de severidade alta em kernels decorrem de falhas de acesso à memória (use-after-free e buffer overflow).',
      'O modelo de ownership do Rust elimina essa classe de bugs em tempo de compilação, sem coletor de lixo (garbage collector).',
      'Provedores de nuvem já executam kernels híbridos C/Rust em milhões de instâncias de produção.',
    ],
    contentParagraphs: [
      'O que começou como um experimento cauteloso dentro da árvore oficial do Linux tornou-se um dos movimentos mais relevantes da engenharia de software moderna. Com a estabilização das abstrações para barramentos PCI, alocadores de blocos e subsistemas de rede Ethernet de 400 Gbps, o uso de Rust no kernel deixou o estágio experimental.',
      'Para mantenedores de infraestrutura crítica, a vantagem é direta: drivers de terceiros e subsistemas que lidam com pacotes externos ou dispositivos de armazenamento de altíssima velocidade passam a contar com garantias matemáticas contra acesso inválido de ponteiros e condições de corrida.',
      'Segundo engenheiros que lideram a frente de segurança em sistemas operacionais, a estratégia não é reescrever as dezenas de milhões de linhas em C que funcionam há décadas, mas garantir que novos componentes críticos nasçam livres de vulnerabilidades de memória desde o primeiro commit.',
    ],
  },
  {
    id: 'art-k8s-ebpf',
    slug: 'kubernetes-ebpf-observabilidade-sem-sidecars-finops',
    kicker: 'CLOUD & FINOPS',
    title: 'Kubernetes e eBPF: como a malha de serviços sem sidecars reduziu em 38% o custo computacional na nuvem',
    subtitle:
      'Remoção de proxies injetados por pod libera gigabytes de RAM e simplifica a observabilidade de microsserviços em larga escala.',
    category: 'cloud',
    categoryLabel: 'Cloud & DevOps',
    author: 'Rafael Mendes',
    authorRole: 'Colunista de Cloud Native & SRE',
    publishedAt: '20 out 2026 • 11h15',
    readingTimeMin: 4,
    imageUrl: './img/cloud-kubernetes.png',
    imageAlt: 'Corredor de data center moderno com servidores em nuvem e conexões de fibra óptica',
    imageCaption: 'Instrumentação direta no kernel via eBPF substitui centenas de containers auxiliares em clusters corporativos.',
    featuredRank: 'standard',
    viewsCount: '21,7 mil leituras',
    tags: ['Kubernetes', 'eBPF', 'FinOps', 'Cloud Native', 'DevOps'],
    keyTakeaways: [
      'Arquiteturas sidecarless movem a criptografia mTLS e o roteamento L4/L7 para o nível do nó via eBPF.',
      'Redução imediata no tempo de inicialização de pods e menor pressão sobre o escalonador do Kubernetes.',
      'Visibilidade completa de chamadas HTTP, gRPC e queries SQL sem necessidade de alterar o código da aplicação.',
    ],
    contentParagraphs: [
      'Durante a primeira onda de adoção de Service Mesh em Kubernetes, o padrão dominante exigia injetar um container proxy ao lado de cada pod de aplicação. Embora eficiente para padronizar mTLS e telemetria, esse modelo cobrava um preço alto em clusters com milhares de pods: dezenas de CPUs e centenas de gigabytes de memória consumidos apenas por infraestrutura intermediária.',
      'Com a consolidação do eBPF (Extended Berkeley Packet Filter) diretamente no kernel dos nós de trabalho, as equipes de SRE e FinOps encontraram uma alternativa muito mais enxuta. Os pacotes de rede são interceptados, autenticados e medidos diretamente no espaço do kernel, sem saltos extras de rede local (loopback).',
      'Levantamentos recentes em empresas brasileiras de tecnologia mostram economia média de 30% a 38% na fatura de computação em nuvem após a migração para malhas baseadas em eBPF, além de quedas expressivas na latência de cauda (p99) das APIs críticas.',
    ],
  },
  {
    id: 'art-zerotrust-api',
    slug: 'zero-trust-apis-identidade-nao-humana-seguranca-ia',
    kicker: 'CIBERSEGURANÇA & IAM',
    title: 'Zero-Trust para APIs e identidades de máquina: o novo perímetro crítico da segurança corporativa',
    subtitle:
      'Com o crescimento explosivo de pipelines CI/CD, microsserviços e agentes de IA, proteger chaves de API com criptografia Fernet e HBAC tornou-se prioridade número um.',
    category: 'seguranca',
    categoryLabel: 'Cibersegurança',
    author: 'Helena Vasconcelos',
    authorRole: 'Analista Chefe de Segurança da Informação',
    publishedAt: '20 out 2026 • 10h00',
    readingTimeMin: 5,
    imageUrl: './img/cybersecurity-zerotrust.png',
    imageAlt: 'Escudo digital representando arquitetura Zero-Trust e proteção criptográfica de APIs',
    imageCaption: 'Rotação automatizada de tokens, mascaramento por padrão e auditoria imutável bloqueiam vazamentos de credenciais.',
    featuredRank: 'standard',
    viewsCount: '19,4 mil leituras',
    tags: ['Zero Trust', 'Segurança', 'API Keys', 'HBAC', 'Auditoria'],
    keyTakeaways: [
      'Identidades não-humanas (tokens CI/CD, chaves de serviço e webhooks) já representam mais de 90% do tráfego autenticado em nuvem.',
      'Chaves nunca devem ser exibidas em texto puro por padrão: a revelação exige reautenticação explícita e gera log forense imediato.',
      'Cadeias de auditoria assinadas com SHA-256 impedem adulteração retroativa de registros de acesso.',
    ],
    contentParagraphs: [
      'O antigo modelo de segurança baseado apenas em firewall de borda e login de usuários humanos já não dá conta da realidade das plataformas digitais modernas. Hoje, para cada engenheiro autenticado em um painel administrativo, existem dezenas de tokens de deploy, chaves de integração contínua e credenciais de serviço operando 24 horas por dia.',
      'Por essa razão, arquiteturas modernas de segurança adotam o princípio Zero-Trust aplicado rigorosamente às credenciais de máquina: armazenamento com hash irreversível para validação rápida, criptografia simétrica forte (como Fernet AES-128) para segredos gerenciados e mascaramento obrigatório na interface gráfica.',
      'Além disso, o controle de acesso baseado em papéis e grupos (HBAC/RBAC) garante que um token criado apenas para enviar builds estáticas em um repositório jamais consiga alterar regras de permissão ou remover versões travadas em produção.',
    ],
  },
  {
    id: 'art-chips-2nm',
    slug: 'guerra-chips-2nm-npus-inferencia-local-modelos-ia',
    kicker: 'SEMICONDUTORES & HARDWARE',
    title: 'Litografia de 2 nanômetros e memória HBM4 inauguram nova era de eficiência energética para IA',
    subtitle:
      'Transistores Gate-All-Around (GAA) permitem empacotar bilhões de núcleos neurais com queda de 45% no consumo elétrico por token gerado.',
    category: 'hardware',
    categoryLabel: 'Chips & Hardware',
    author: 'Carlos Eduardo Rocha',
    authorRole: 'Editor de Hardware & Semicondutores',
    publishedAt: '20 out 2026 • 09h10',
    readingTimeMin: 6,
    imageUrl: './img/chips-semiconductors.png',
    imageAlt: 'Fotografia macro de wafer de silício de 2 nanômetros e circuitos de processador neural',
    imageCaption: 'Nova geração de wafers de 2nm combina transistores nanosheet com empilhamento tridimensional de memória.',
    featuredRank: 'standard',
    viewsCount: '26,8 mil leituras',
    tags: ['Semicondutores', '2nm', 'NPU', 'Hardware', 'IA Local'],
    keyTakeaways: [
      'Transistores GAA (Gate-All-Around) substituem o FinFET tradicional para controlar o fluxo de elétrons em escala atômica.',
      'Estações de trabalho e notebooks corporativos já executam modelos de código e raciocínio localmente sem latência de rede.',
      'Eficiência energética tornou-se o principal diferencial competitivo para data centers de hiperescala.',
    ],
    contentParagraphs: [
      'A indústria global de semicondutores atingiu um marco físico que parecia distante há poucos anos: a produção comercial em volume na litografia de 2 nanômetros. Nessa escala, onde as estruturas de silício medem apenas algumas dezenas de átomos de largura, a arquitetura tradicional FinFET deu lugar aos transistores Gate-All-Around (GAA), nos quais a porta lógica envolve completamente os canais condutores.',
      'O impacto prático vai muito além dos supercomputadores de treinamento em nuvem. Com NPUs (Unidades de Processamento Neural) dedicadas cada vez mais densas e integradas a barramentos de memória unificada de altíssima largura de banda, desenvolvedores agora conseguem rodar modelos complexos diretamente em suas máquinas locais.',
      'Nos data centers, a combinação de chips em 2nm com memórias HBM4 ataca diretamente o maior desafio do setor de tecnologia atual: o consumo de energia elétrica e a dissipação térmica dos clusters de inferência.',
    ],
  },
  {
    id: 'art-web-baseline',
    slug: 'baseline-web-dialog-view-transitions-fetch-priority-html-moderno',
    kicker: 'PLATAFORMA WEB & FRONTEND',
    title: 'Web Nativa em alta: APIs modernas de HTML e CSS aposentam bibliotecas pesadas e aceleram sites estáticos',
    subtitle:
      'Recursos como <dialog>, fetchpriority="high", @starting-style e content-visibility entregam interfaces ricas com pacotes JavaScript até 70% menores.',
    category: 'web',
    categoryLabel: 'Frontend & Web',
    author: 'Beatriz Nogueira',
    authorRole: 'Especialista em Web Performance & Design Systems',
    publishedAt: '20 out 2026 • 08h30',
    readingTimeMin: 4,
    imageUrl: './img/typescript-compiler.png',
    imageAlt: 'Arquitetura moderna de aplicações web de alta performance',
    imageCaption: 'Portais de conteúdo e aplicações estáticas alcançam nota máxima no Core Web Vitals usando recursos nativos do navegador.',
    featuredRank: 'standard',
    viewsCount: '17,3 mil leituras',
    tags: ['HTML5', 'CSS Moderno', 'Web Performance', 'LCP', 'Copan Design'],
    keyTakeaways: [
      'O atributo fetchpriority="high" na imagem principal (LCP) antecipa o carregamento visual da manchete em portais de notícias.',
      'O elemento nativo <dialog> gerencia foco, tecla ESC e backdrop sem depender de bibliotecas externas de modal.',
      'Builds estáticas puras (HTML, CSS, JS e imagens otimizadas) hospedadas em diretórios versionados oferecem a menor latência possível.',
    ],
    contentParagraphs: [
      'Por muito tempo, criar elementos básicos de interface — como um modal acessível, um menu flutuante ou um sistema de temas claro e escuro — exigia importar dezenas de pacotes externos que inflavam o bundle final enviado ao navegador do usuário.',
      'Com a evolução coordenada dos motores de renderização sob a iniciativa Baseline Web, a própria plataforma nativa assumiu essas responsabilidades com excelência. O elemento HTML <dialog>, por exemplo, oferece gerenciamento nativo de camada superior (top-layer), bloqueio de rolagem e acessibilidade por teclado com poucas linhas de TypeScript.',
      'Para portais de notícias e documentações técnicas, combinar TypeScript compilado para JavaScript enxuto com builds estáticas versionadas via Git representa o equilíbrio ideal entre experiência de desenvolvimento, segurança e velocidade instantânea de carregamento.',
    ],
  },
];
const INITIAL_POLL_OPTIONS               = [
  { id: 'opt-agents', label: 'Agentes de IA & Automação via MCP', votes: 412 },
  { id: 'opt-ts', label: 'Compiladores Nativos (TypeScript em Go / Rust)', votes: 289 },
  { id: 'opt-k8s', label: 'Cloud Native, Kubernetes & FinOps com eBPF', votes: 194 },
  { id: 'opt-sec', label: 'Segurança Zero-Trust & Governança HBAC', votes: 165 },
];
function getLocalizedCategories(locale              )                 {
  const map = CATEGORY_LABELS_BY_LOCALE[locale] || CATEGORY_LABELS_BY_LOCALE['pt-BR'];
  return CATEGORIES.map((c) => ({
    ...c,
    label: map[c.slug] || c.label,
  }));
}
function getLocalizedPlantao(locale              )                     {
  return BREAKING_BY_LOCALE[locale] || BREAKING_BY_LOCALE['pt-BR'];
}
function getLocalizedPollOptions(
  locale              ,
  currentOptions              
)               {
  const labels = POLL_LABELS_BY_LOCALE[locale] || POLL_LABELS_BY_LOCALE['pt-BR'];
  return currentOptions.map((opt) => ({
    ...opt,
    label: labels[opt.id] || opt.label,
  }));
}
function getLocalizedArticles(locale              )                {
  if (locale === 'pt-BR') {
    return ARTICLES;
  }
  return ARTICLES.map((article) => {
    const localized = ARTICLE_TRANSLATIONS[article.id]?.[locale];
    if (!localized) return article;
    return {
      ...article,
      ...localized,
    };
  });
}





let supportsDisplayTransition                     ;

function canTransitionDisplay()          {
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

function supportsTopLayerExit()          {
  return Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
}

async function closeTopLayer(element                   )                {
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
  locale               = 'pt-BR';
  activeCategory               = 'todas';
  activeTag         = '';
  showOnlySaved          = false;
  searchQuery         = '';
  isDarkMode          = false;
  articleFontSizeRem         = 1.08;
  pollOptions               = [...INITIAL_POLL_OPTIONS];
  votedPollOptionId                = null;
  savedArticleIds              = new Set        ();
  expandedTldrIds              = new Set        ();
  currentlyOpenArticleId                = null;
  isSpeaking          = false;

  init()       {
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

  get ui()                  {
    return UI_TRANSLATIONS[this.locale] || UI_TRANSLATIONS['pt-BR'];
  }

  restorePreferences()       {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang')                       ;
      const savedLang = localStorage.getItem('portal_loft_locale')                       ;

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

  setLocale(newLocale              )       {
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

  applyStaticTranslations()       {
    const t = this.ui;
    document.documentElement.setAttribute('lang', this.locale);
    document.title = t.htmlTitle;

    // Update language buttons active state
    document.querySelectorAll                   ('[data-lang]').forEach((btn) => {
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

    const searchInput = document.getElementById('portal-search-input')                           ;
    if (searchInput) {
      searchInput.placeholder = t.searchPlaceholder;
    }

    const emailInput = document.getElementById('newsletter-email-input')                           ;
    if (emailInput) {
      emailInput.placeholder = t.newsletterPlaceholder;
    }

    // Update footer category buttons
    const cats = getLocalizedCategories(this.locale);
    document.querySelectorAll                   ('[data-footer-cat]').forEach((btn) => {
      const slug = btn.getAttribute('data-footer-cat')                ;
      const found = cats.find((c) => c.slug === slug);
      if (found) {
        btn.textContent = found.label;
      }
    });

    this.updateThemeToggleButton();
    this.updateSavedCountBadge();
  }

  setText(id        , value        )       {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  toggleTheme()       {
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

  updateThemeToggleButton()       {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.innerHTML = this.isDarkMode
      ? `<span class="theme-icon">☀️</span> <span>${this.escapeHtml(this.ui.lightModeLabel)}</span>`
      : `<span class="theme-icon">🌙</span> <span>${this.escapeHtml(this.ui.darkModeLabel)}</span>`;
  }

  updateSavedCountBadge()       {
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

  toggleSaveArticle(articleId        )       {
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

  updateClockOnce()       {
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

  startLiveClock()       {
    this.updateClockOnce();
    window.setInterval(() => this.updateClockOnce(), 30000);
  }

  renderTopTicker()       {
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

  renderCategoryNav()       {
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

    nav.querySelectorAll                   ('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-category')                ;
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

  renderPlantaoStrip()       {
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

  renderTrendingTagsBar()       {
    const container = document.getElementById('trending-tags-list');
    if (!container) return;

    const articles = getLocalizedArticles(this.locale);
    const uniqueTags           = [];
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

  getFilteredArticles()                {
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

  renderAllSections()       {
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
        const input = document.getElementById('portal-search-input')                           ;
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

  renderHeroBento()       {
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

  renderSidebar()       {
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

  renderSavedSidebarWidget()       {
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

  renderPollWidget()       {
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

    pollContainer.querySelectorAll                   ('[data-poll-option]').forEach((btn) => {
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

  stopSpeech()       {
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

  toggleSpeech(article             )       {
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

  openArticleModal(articleId        )       {
    const articles = getLocalizedArticles(this.locale);
    const article = articles.find((a) => a.id === articleId);
    if (!article) return;

    this.stopSpeech();
    this.currentlyOpenArticleId = article.id;

    const t = this.ui;
    const dialog = document.getElementById('article-reader-dialog')                            ;
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

  closeArticleModal()       {
    this.stopSpeech();
    this.currentlyOpenArticleId = null;
    const dialog = document.getElementById('article-reader-dialog')                            ;
    if (dialog && dialog.open) {
      void closeTopLayer(dialog);
    }
  }

  bindGlobalEvents()       {
    document.addEventListener('click', (ev) => {
      const target = ev.target                      ;
      if (!target) return;

      // Language selector buttons
      const langBtn = target.closest             ('[data-lang]');
      if (langBtn) {
        const lang = langBtn.getAttribute('data-lang')                       ;
        if (lang && (lang === 'pt-BR' || lang === 'en' || lang === 'es')) {
          this.setLocale(lang);
        }
        return;
      }

      // Toggle Save / Bookmark
      const saveBtn = target.closest             ('[data-toggle-save]');
      if (saveBtn) {
        ev.stopPropagation();
        const id = saveBtn.getAttribute('data-toggle-save');
        if (id) {
          this.toggleSaveArticle(id);
        }
        return;
      }

      // Toggle inline TL;DR drawer on card
      const tldrBtn = target.closest             ('[data-toggle-tldr]');
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
      const tagChip = target.closest             ('[data-filter-tag]');
      if (tagChip) {
        const tag = tagChip.getAttribute('data-filter-tag') || '';
        this.activeTag = this.activeTag === tag ? '' : tag;
        this.renderTrendingTagsBar();
        this.renderAllSections();
        return;
      }

      const clearTagBtn = target.closest             ('[data-clear-tag]');
      if (clearTagBtn) {
        this.activeTag = '';
        this.renderTrendingTagsBar();
        this.renderAllSections();
        return;
      }

      // Open article modal
      const articleTrigger = target.closest             ('[data-open-article]');
      if (articleTrigger) {
        const id = articleTrigger.getAttribute('data-open-article');
        if (id) {
          this.openArticleModal(id);
        }
        return;
      }

      // Footer category link
      const footerCatTrigger = target.closest             ('[data-footer-cat]');
      if (footerCatTrigger) {
        const cat = footerCatTrigger.getAttribute('data-footer-cat')                ;
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
      const input = document.getElementById('portal-search-input')                           ;
      if (input) input.value = '';
      this.updateSavedCountBadge();
      this.renderCategoryNav();
      this.renderTrendingTagsBar();
      this.renderAllSections();
    });

    // Search input + keyboard shortcut "/"
    const searchInput = document.getElementById('portal-search-input')                           ;
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
    const dialog = document.getElementById('article-reader-dialog')                            ;
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
    const newsletterForm = document.getElementById('portal-newsletter-form')                          ;
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email-input')                           ;
        if (emailInput && emailInput.value.trim()) {
          this.showToast(`${this.ui.newsletterToastPrefix} ${emailInput.value.trim()}`);
          emailInput.value = '';
        }
      });
    }
  }

  showToast(text        )       {
    const toast = document.getElementById('portal-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    window.setTimeout(() => {
      toast.classList.remove('visible');
    }, 3400);
  }

  escapeHtml(raw        )         {
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


})();