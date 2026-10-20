import {
  CategoryInfo,
  NewsArticle,
  TechTickerItem,
  BreakingNewsItem,
  PollOption,
  PortalLocale,
} from '../types';
import {
  ARTICLE_TRANSLATIONS,
  BREAKING_BY_LOCALE,
  CATEGORY_LABELS_BY_LOCALE,
  POLL_LABELS_BY_LOCALE,
} from './i18n';

export const CATEGORIES: CategoryInfo[] = [
  { slug: 'todas', label: 'Capa • Todas', color: '#FF5A26', badgeBg: 'rgba(255, 90, 38, 0.14)' },
  { slug: 'ia', label: 'IA & Agentes', color: '#FF5A26', badgeBg: 'rgba(255, 90, 38, 0.14)' },
  { slug: 'engenharia', label: 'Engenharia & Dev', color: '#0284C7', badgeBg: 'rgba(2, 132, 199, 0.14)' },
  { slug: 'cloud', label: 'Cloud & DevOps', color: '#0D9488', badgeBg: 'rgba(13, 148, 136, 0.14)' },
  { slug: 'seguranca', label: 'Cibersegurança', color: '#DC2626', badgeBg: 'rgba(220, 38, 38, 0.14)' },
  { slug: 'hardware', label: 'Chips & Hardware', color: '#7C3AED', badgeBg: 'rgba(124, 58, 237, 0.14)' },
  { slug: 'web', label: 'Frontend & Web', color: '#D97706', badgeBg: 'rgba(217, 119, 6, 0.14)' },
];

export const TECH_TICKER: TechTickerItem[] = [
  { symbol: 'NASDAQ-100', name: 'Tech Index', value: '21.480 pts', variation: '+1,42%', isPositive: true },
  { symbol: 'NVDA', name: 'AI Compute', value: 'US$ 148,90', variation: '+2,85%', isPositive: true },
  { symbol: 'MSFT', name: 'Cloud & Copilot', value: 'US$ 462,10', variation: '+1,18%', isPositive: true },
  { symbol: 'TSMC', name: '2nm Foundry', value: 'US$ 204,50', variation: '+3,12%', isPositive: true },
  { symbol: 'CLOUD-LATENCY', name: 'SA-East-1 (SP)', value: '11.4 ms', variation: '-0,8 ms', isPositive: true },
  { symbol: 'GITHUB-PRs', name: 'AI Assisted', value: '68,4%', variation: '+4,1%', isPositive: true },
];

export const ARTICLES: NewsArticle[] = [
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

export const INITIAL_POLL_OPTIONS: PollOption[] = [
  { id: 'opt-agents', label: 'Agentes de IA & Automação via MCP', votes: 412 },
  { id: 'opt-ts', label: 'Compiladores Nativos (TypeScript em Go / Rust)', votes: 289 },
  { id: 'opt-k8s', label: 'Cloud Native, Kubernetes & FinOps com eBPF', votes: 194 },
  { id: 'opt-sec', label: 'Segurança Zero-Trust & Governança HBAC', votes: 165 },
];

export function getLocalizedCategories(locale: PortalLocale): CategoryInfo[] {
  const map = CATEGORY_LABELS_BY_LOCALE[locale] || CATEGORY_LABELS_BY_LOCALE['pt-BR'];
  return CATEGORIES.map((c) => ({
    ...c,
    label: map[c.slug] || c.label,
  }));
}

export function getLocalizedPlantao(locale: PortalLocale): BreakingNewsItem[] {
  return BREAKING_BY_LOCALE[locale] || BREAKING_BY_LOCALE['pt-BR'];
}

export function getLocalizedPollOptions(
  locale: PortalLocale,
  currentOptions: PollOption[]
): PollOption[] {
  const labels = POLL_LABELS_BY_LOCALE[locale] || POLL_LABELS_BY_LOCALE['pt-BR'];
  return currentOptions.map((opt) => ({
    ...opt,
    label: labels[opt.id] || opt.label,
  }));
}

export function getLocalizedArticles(locale: PortalLocale): NewsArticle[] {
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
