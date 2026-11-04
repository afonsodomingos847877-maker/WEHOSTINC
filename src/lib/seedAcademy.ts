import { dataManager, Course, Module, Lesson } from '@/lib/data';

export async function seedAcademyData() {
  console.log('[SeedAcademy] A criar dados iniciais da Academia Web...');

  // Limpar dados existentes para evitar duplicatas
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wehosthere_courses');
    localStorage.removeItem('wehosthere_modules');
    localStorage.removeItem('wehosthere_lessons');
    localStorage.removeItem('wehosthere_course_enrollments');
    localStorage.removeItem('wehosthere_course_progress');
    console.log('[SeedAcademy] Dados antigos limpos do localStorage');
  }

  // Criar o curso principal
  const courseData = {
    title: 'Criação de Página de Vendas Profissional',
    shortDescription: 'Aprenda a criar páginas de vendas do zero, desde a ideia até ao lançamento online',
    description: 'Este curso ensina, passo a passo, como criar uma Página de Vendas Profissional, começando desde a ideia inicial do negócio até ao lançamento oficial online. Durante o curso, você aprenderá a estruturar um negócio digital, preparar o ambiente de desenvolvimento, criar o projeto, publicar na internet e conectar um domínio profissional.',
    duration: '12 horas',
    outcome: 'Será capaz de criar páginas de vendas profissionais do zero e publicá-las online',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    accessType: 'free' as const,
    order: 1,
    active: true
  };

  // Salvar no localStorage (MongoDB não está configurado na Vercel)
  const course = await dataManager.createCourse(courseData);
  if (!course) {
    console.error('[SeedAcademy] Erro ao criar curso');
    return;
  }
  console.log('[SeedAcademy] Curso criado no localStorage:', course.id);

  // Criar módulos
  const modules = [
    {
      title: 'Introdução e Conceitos Fundamentais',
      description: 'Compreender o que é uma página de vendas, a sua importância e como ela funciona dentro de uma estratégia digital',
      objective: 'Compreender a estrutura necessária antes de iniciar a criação',
      order: 1
    },
    {
      title: 'Definição do Nicho e Público-Alvo',
      description: 'Definir claramente para quem a página será criada e qual problema irá resolver',
      objective: 'Ter definido a base estratégica da página',
      order: 2
    },
    {
      title: 'Estruturação do Negócio',
      description: 'Criar todas as informações necessárias para apresentar o negócio na página',
      objective: 'Ter todo o conteúdo necessário para inserir na página',
      order: 3
    },
    {
      title: 'Planeamento da Página de Vendas',
      description: 'Criar a estrutura visual e estratégica antes do desenvolvimento',
      objective: 'Ter o mapa completo da página antes de programar',
      order: 4
    },
    {
      title: 'Preparação do Ambiente de Desenvolvimento',
      description: 'Instalar e configurar todas as ferramentas necessárias (Antigravity, Node.js, NPM, Git)',
      objective: 'Ambiente preparado para iniciar o projeto',
      order: 5
    },
    {
      title: 'Criação do Projeto Inicial',
      description: 'Criar a estrutura inicial da página de vendas',
      objective: 'Primeira versão do projeto criada',
      order: 6
    },
    {
      title: 'Desenvolvimento da Página de Vendas',
      description: 'Transformar a estrutura planeada numa página funcional',
      objective: 'Página de vendas funcional criada',
      order: 7
    },
    {
      title: 'Versionamento com Git e GitHub',
      description: 'Guardar e controlar o projeto',
      objective: 'Projeto guardado online no GitHub',
      order: 8
    },
    {
      title: 'Publicação com Vercel',
      description: 'Colocar a página disponível na internet',
      objective: 'Página disponível online',
      order: 9
    },
    {
      title: 'Compra e Configuração do Domínio',
      description: 'Substituir o endereço temporário por um domínio profissional',
      objective: 'Página disponível no endereço oficial',
      order: 10
    },
    {
      title: 'Testes Antes do Lançamento',
      description: 'Garantir que tudo funciona corretamente em todos os dispositivos',
      objective: 'Checklist completo de testes realizado',
      order: 11
    },
    {
      title: 'Lançamento Oficial',
      description: 'Publicar oficialmente a página de vendas',
      objective: 'Página oficialmente lançada',
      order: 12
    },
    {
      title: 'Manutenção e Evolução',
      description: 'Garantir que a página continua atualizada',
      objective: 'Estratégia de manutenção definida',
      order: 13
    }
  ];

  const createdModules = await Promise.all(modules.map(async (mod, index) => {
    const moduleData = {
      courseId: course.id,
      ...mod,
      hasVideo: false,
      hasMaterial: false,
      active: true
    };
    
    // Salvar no localStorage (MongoDB não está configurado na Vercel)
    const courseModule = await dataManager.createModule(moduleData);
    console.log(`[SeedAcademy] Módulo ${index + 1} criado no localStorage:`, courseModule?.id);
    
    return courseModule;
  }));

  // Criar lições para cada módulo
  const lessonsData = [
    // Módulo 1
    [
      {
        title: 'O que é uma Página de Vendas?',
        content: 'Uma página de vendas é uma página web desenhada especificamente para converter visitantes em clientes. Diferente de um website tradicional, a página de vendas tem um objetivo claro: levar o visitante a realizar uma ação específica, geralmente uma compra.\n\n**Conceito de página de vendas:**\n- Página focada em conversão\n- Objetivo principal claro\n- Elimina distrações\n- Guia o visitante para ação\n\n**Diferença entre página de vendas e website tradicional:**\n- Website: Informação geral, navegação múltipla\n- Página de vendas: Foco único, ação específica\n\n**Como uma página ajuda a vender:**\n- Apresenta solução clara\n- Remove objeções\n- Cria urgência\n- Facilita decisão',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Introdução às Páginas de Vendas',
        videoDescription: 'Vídeo explicativo sobre o conceito de páginas de vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/material-mod1-licao1.pdf',
        materialTitle: 'Guia de Introdução às Páginas de Vendas',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Estrutura de uma Página de Vendas',
        content: 'Uma página de vendas eficaz tem uma estrutura específica:\n\n1. **Cabeçalho** - Logo e navegação mínima\n2. **Proposta de valor** - O que você oferece\n3. **Apresentação do produto** - Detalhes da oferta\n4. **Benefícios** - O que o cliente ganha\n5. **Provas sociais** - Testemunhos e casos\n6. **Depoimentos** - Validação de clientes\n7. **Oferta** - Preço e valor\n8. **Chamada para ação** - CTA claro\n9. **Contacto** - Informações de contacto\n\nEsta estrutura guia o visitante do interesse à ação.',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Estrutura de Página de Vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/checklist-estrutura.pdf',
        materialTitle: 'Checklist de Estrutura',
        materialType: 'pdf' as const,
        order: 2
      }
    ],
    // Módulo 2
    [
      {
        title: 'Escolha do Nicho',
        content: 'Identificar a área de atuação é fundamental:\n\n**Áreas de atuação:**\n- Educação\n- Tecnologia\n- Saúde\n- Construção\n- Marketing\n- Consultoria\n\n**Como identificar seu nicho:**\n1. Avalie suas competências\n2. Analise o mercado\n3. Identifique oportunidades\n4. Valide a demanda\n\n**Segmento:**\n- B2B (Business to Business)\n- B2C (Business to Consumer)\n- Serviços\n- Produtos digitais\n- Produtos físicos',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Escolha do Nicho',
        hasMaterial: true,
        materialUrl: 'https://example.com/nicho-mercado.pdf',
        materialTitle: 'Guia de Escolha de Nicho',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Definição do Público-Alvo',
        content: 'Criar o perfil do cliente ideal:\n\n**Informações demográficas:**\n- Idade\n- Género\n- Localização\n- Renda\n- Profissão\n\n**Necessidades e problemas:**\n- O que eles precisam?\n- Quais problemas têm?\n- O que os frustra?\n\n**Objetivos:**\n- O que querem alcançar?\n- Quais são seus sonhos?\n\n**Dificuldades:**\n- O que os impede?\n- Quais barreiras enfrentam?',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/publico-alvo.pdf',
        materialTitle: 'Template de Público-Alvo',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Definição da Oferta',
        content: 'Responder às perguntas fundamentais:\n\n**O que será vendido?**\n- Produto ou serviço\n- Formato (digital, físico, serviço)\n- Entrega (imediato, programado)\n\n**Qual problema resolve?**\n- Dor específica\n- Solução clara\n- Resultado tangível\n\n**Qual benefício entrega?**\n- Transformação\n- Economia de tempo/dinheiro\n- Melhoria de qualidade de vida\n\n**Por que alguém compraria?**\n- Urgência\n- Exclusividade\n- Credibilidade\n- Garantia',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Definição da Oferta',
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 3
    [
      {
        title: 'Informações da Marca',
        content: 'Criar identidade da empresa:\n\n**Nome da empresa:**\n- Fácil de lembrar\n- Fácil de pronunciar\n- Disponível como domínio\n- Reflete o negócio\n\n**Logo:**\n- Simples e reconhecível\n- Funciona em diferentes tamanhos\n- Cores consistentes\n- Versão monocromática\n\n**Descrição do negócio:**\n- O que faz\n- Para quem serve\n- Como é diferente\n\n**Missão, Visão, Valores:**\n- Missão: Por que existimos\n- Visão: Para onde vamos\n- Valores: O que acreditamos',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Informações da Marca',
        hasMaterial: true,
        materialUrl: 'https://example.com/branding.pdf',
        materialTitle: 'Guia de Branding',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Serviços ou Produtos',
        content: 'Estruturar sua oferta:\n\n**Nome do serviço/produto:**\n- Descritivo\n- Atraente\n- Memorável\n\n**Descrição:**\n- O que é\n- Como funciona\n- Para quem é\n\n**Benefícios:**\n- Transformação\n- Resultados\n- Vantagens\n\n**Características:**\n- Especificações técnicas\n- Incluídos\n- Duração\n\n**Preço:**\n- Valor justo\n- Estrutura de pagamento\n- Opções\n\n**Promoções:**\n- Descontos\n- Bônus\n- Ofertas limitadas',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/produtos.pdf',
        materialTitle: 'Template de Produtos',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Informações de Contacto',
        content: 'Configurar canais de comunicação:\n\n**WhatsApp:**\n- Número com DDI\n- Horário de atendimento\n- Mensagem automática\n\n**Email:**\n- Email profissional\n- Assunto padrão\n- Tempo de resposta\n\n**Redes sociais:**\n- Links diretos\n- Consistência visual\n- Conteúdo relevante\n\n**Localização:**\n- Endereço físico (se aplicável)\n- Mapa\n- Área de cobertura\n\n**Horário de atendimento:**\n- Dias da semana\n- Horas\n- Fuso horário',
        hasVideo: false,
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 4
    [
      {
        title: 'Organização das Secções',
        content: 'Definir a estrutura da página:\n\n1. **Banner principal**\n- Headline impactante\n- Imagem/vídeo\n- CTA principal\n\n2. **Apresentação da oferta**\n- O que é\n- Para quem\n- Problema resolvido\n\n3. **Benefícios**\n- Lista clara\n- Ícones\n- Descrições\n\n4. **Serviços/produtos**\n- Cards\n- Preços\n- Detalhes\n\n5. **Depoimentos**\n- Fotos\n- Nomes\n- Citações\n\n6. **Perguntas frequentes**\n- Perguntas comuns\n- Respostas claras\n\n7. **Contacto**\n- Formulário\n- Informações\n- Mapa\n\n8. **Botão de ação**\n- Repetido em pontos estratégicos',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Organização das Secções',
        hasMaterial: true,
        materialUrl: 'https://example.com/estrutura.pdf',
        materialTitle: 'Template de Estrutura',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Criação do Wireframe',
        content: 'Planeamento visual:\n\n**Posicionamento dos elementos:**\n- Hierarquia visual\n- Espaçamento\n- Alinhamento\n\n**Organização das informações:**\n- Fluxo de leitura\n- Grupos lógicos\n- Navegação\n\n**Experiência do visitante:**\n- Facilidade de uso\n- Clareza\n- Acessibilidade\n\n**Ferramentas de wireframe:**\n- Caneta e papel\n- Figma\n- Sketch\n- Adobe XD\n\n**Dicas:**\n- Comece simples\n- Foque na funcionalidade\n- Teste antes de programar',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/wireframe.pdf',
        materialTitle: 'Guia de Wireframe',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Preparação dos Recursos',
        content: 'Selecionar materiais:\n\n**Imagens:**\n- Alta qualidade\n- Relevantes\n- Otimizadas para web\n- Direitos de uso\n\n**Vídeos:**\n- Curtos e impactantes\n- Legendas\n- Formato web\n\n**Ícones:**\n- Consistentes\n- Reconhecíveis\n- Leves\n\n**Textos:**\n- Revisados\n- Persuasivos\n- Focados no benefício\n\n**Ferramentas de recursos:**\n- Unsplash (imagens gratuitas)\n- Pexels (vídeos gratuitos)\n- Flaticon (ícones)\n- Canva (design)',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Preparação dos Recursos',
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 5
    [
      {
        title: 'Antigravity',
        content: 'Ferramenta de desenvolvimento:\n\n**O que é:**\n- Plataforma de desenvolvimento\n- Ambiente integrado\n- Ferramentas de IA\n\n**Instalação:**\n1. Aceda ao site oficial\n2. Faça download\n3. Siga o instalador\n4. Configure suas preferências\n\n**Configuração inicial:**\n- Selecionar tema\n- Configurar atalhos\n- Instalar extensões\n\n**Preparação para desenvolvimento:**\n- Criar conta\n- Sincronizar configurações\n- Configurar projetos',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Antigravity',
        hasMaterial: true,
        materialUrl: 'https://example.com/antigravity.pdf',
        materialTitle: 'Guia de Antigravity',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Node.js',
        content: 'Ambiente de execução JavaScript:\n\n**Instalação:**\n1. Aceda a nodejs.org\n2. Download versão LTS\n3. Execute o instalador\n4. Siga as instruções\n\n**Verificação:**\n```bash\nnode -v\n```\n\n**Configuração:**\n- Variáveis de ambiente\n- Caminhos\n- Permissões\n\n**Para que serve:**\n- Executar JavaScript no servidor\n- Gerir pacotes\n- Criar aplicações web',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      },
      {
        title: 'NPM',
        content: 'Gestor de pacotes Node:\n\n**Conceito:**\n- Node Package Manager\n- Biblioteca de pacotes\n- Gestão de dependências\n\n**Verificação:**\n```bash\nnpm -v\n```\n\n**Comandos básicos:**\n- npm install\n- npm init\n- npm run\n- npm update\n\n**Para que serve:**\n- Instalar bibliotecas\n- Gerir versões\n- Automatizar tarefas',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'NPM',
        hasMaterial: true,
        materialUrl: 'https://example.com/npm.pdf',
        materialTitle: 'Guia de NPM',
        materialType: 'pdf' as const,
        order: 3
      },
      {
        title: 'Git',
        content: 'Sistema de controle de versão:\n\n**Instalação:**\n1. Aceda a git-scm.com\n2. Download\n3. Execute o instalador\n4. Configure\n\n**Verificação:**\n```bash\ngit --version\n```\n\n**Configuração:**\n```bash\ngit config --global user.name "Seu Nome"\ngit config --global user.email "seu@email.com"\n```\n\n**Para que serve:**\n- Controlar versões\n- Colaborar\n- Reverter mudanças\n- Histórico de alterações',
        hasVideo: false,
        hasMaterial: false,
        order: 4
      }
    ],
    // Módulo 6
    [
      {
        title: 'Criar Pasta do Projeto',
        content: 'Organização inicial:\n\n**Escolha do local:**\n- Pasta de documentos\n- Área de trabalho\n- Pasta dedicada a projetos\n\n**Nome do projeto:**\n- Sem espaços\n- Minúsculas\n- Descritivo\n\n**Exemplo:**\n```\npagina-vendas\nmeu-negocio\nlanding-page\n```\n\n**Boas práticas:**\n- Nome consistente\n- Fácil de identificar\n- Organização por cliente',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Criar Pasta do Projeto',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Inicialização do Projeto',
        content: 'Criar estrutura base:\n\n**Passos:**\n1. Abrir terminal na pasta\n2. Inicializar projeto\n3. Configurar tecnologia\n4. Instalar dependências\n\n**Comandos iniciais:**\n```bash\nnpm init\n# ou\nnpm create\n```\n\n**Configuração de tecnologia:**\n- Framework (React, Vue, etc.)\n- Estilização (Tailwind, CSS)\n- Ferramentas de build\n\n**Estrutura inicial criada automaticamente**',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/inicializacao.pdf',
        materialTitle: 'Guia de Inicialização',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Estrutura Inicial',
        content: 'Organização de arquivos:\n\n**Estrutura padrão:**\n```\nProjeto\n├── src/\n│   ├── components/\n│   ├── pages/\n│   ├── styles/\n│   └── assets/\n├── public/\n│   ├── images/\n│   └── videos/\n├── package.json\n├── README.md\n└── .gitignore\n```\n\n**Propósito de cada pasta:**\n- src: código fonte\n- public: arquivos estáticos\n- components: componentes reutilizáveis\n- assets: imagens, ícones',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Estrutura Inicial',
        hasMaterial: false,
        order: 3
      },
      {
        title: 'Criação do Prompt Inicial',
        content: 'Definir o projeto:\n\n**Objetivo da página:**\n- Qual conversão quer?\n- Para quem é?\n- Que problema resolve?\n\n**Estrutura desejada:**\n- Secções necessárias\n- Funcionalidades\n- Integrações\n\n**Funcionalidades:**\n- Formulários\n- Pagamentos\n- Chat\n- Analytics\n\n**Estilo visual:**\n- Cores\n- Tipografia\n- Estilo (moderno, clássico, minimalista)\n\n**Prompt para IA:**\n"Quero criar uma página de vendas para [produto] que [objetivo]. O estilo deve ser [estilo] com cores [cores]."',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/prompts.pdf',
        materialTitle: 'Templates de Prompts',
        materialType: 'pdf' as const,
        order: 4
      }
    ],
    // Módulo 7
    [
      {
        title: 'Construção das Secções',
        content: 'Desenvolver cada parte:\n\n**Header:**\n- Logo\n- Navegação\n- CTA\n\n**Banner principal:**\n- Headline\n- Subheadline\n- Imagem/vídeo\n- CTA\n\n**Serviços:**\n- Cards\n- Ícones\n- Descrições\n- Preços\n\n**Benefícios:**\n- Lista\n- Ícones\n- Descrições\n\n**Testemunhos:**\n- Fotos\n- Nomes\n- Citações\n\n**Contacto:**\n- Formulário\n- Informações\n- Mapa',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Construção das Secções',
        hasMaterial: true,
        materialUrl: 'https://example.com/secoes.pdf',
        materialTitle: 'Guia de Secções',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Implementação Visual',
        content: 'Estilização da página:\n\n**Cores:**\n- Paleta consistente\n- Contraste adequado\n- Psicologia das cores\n\n**Tipografia:**\n- Fontes legíveis\n- Hierarquia visual\n- Tamanhos apropriados\n\n**Responsividade:**\n- Mobile-first\n- Breakpoints\n- Teste em dispositivos\n\n**Animações:**\n- Transições suaves\n- Não excessivas\n- Melhoram UX\n\n**Ferramentas:**\n- Tailwind CSS\n- CSS Modules\n- Styled Components',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      },
      {
        title: 'Funcionalidades',
        content: 'Adicionar interatividade:\n\n**Botões:**\n- Estados (hover, active)\n- Feedback visual\n- Links corretos\n\n**Formulários:**\n- Validação\n- Feedback\n- Envio\n\n**Links:**\n- Âncoras internas\n- Links externos\n- Abertura\n\n**Integrações:**\n- WhatsApp\n- Email\n- Redes sociais\n- Analytics\n- Pixel',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Funcionalidades',
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 8
    [
      {
        title: 'Criar Conta GitHub',
        content: 'Configurar perfil:\n\n**Passos:**\n1. Aceda a github.com\n2. Clique em "Sign up"\n3. Preencha informações\n4. Verifique email\n\n**Configurar perfil:**\n- Foto\n- Bio\n- Localização\n- Website\n\n**Para que serve:**\n- Hospedar código\n- Colaborar\n- Portfolio\n- Versionamento',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Criar Conta GitHub',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Criar Repositório',
        content: 'Hospedar projeto:\n\n**Passos:**\n1. Clique em "+"\n2. "New repository"\n3. Nome do repositório\n4. Descrição\n5. Público ou privado\n6. Criar\n\n**Exemplo de nome:**\n```\npagina-vendas-profissional\nmeu-projeto-web\nlanding-page-cliente\n```\n\n**Boas práticas:**\n- Nome descritivo\n- README.md\n- Licença',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/github.pdf',
        materialTitle: 'Guia de GitHub',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Conectar Projeto',
        content: 'Enviar código para GitHub:\n\n**Comandos:**\n```bash\ngit init\ngit add .\ngit commit -m "Projeto inicial"\ngit branch -M main\ngit remote add origin URL-DO-REPOSITORIO\ngit push -u origin main\n```\n\n**Passo a passo:**\n1. Inicializar Git\n2. Adicionar arquivos\n3. Commit inicial\n4. Conectar ao repositório\n5. Enviar código\n\n**Resultado:**\nProjeto guardado online, acessível de qualquer lugar.',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Conectar Projeto',
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 9
    [
      {
        title: 'Criar Conta Vercel',
        content: 'Plataforma de hosting:\n\n**Registo:**\n1. Aceda a vercel.com\n2. "Sign up"\n3. Use GitHub para login\n4. Configure perfil\n\n**Configuração inicial:**\n- Nome da equipe\n- Plano (grátis inicial)\n- Notificações\n\n**Para que serve:**\n- Hosting gratuito\n- Deploy automático\n- SSL gratuito\n- Domínios personalizados\n- CDN global',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Criar Conta Vercel',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Ligação com GitHub',
        content: 'Conectar repositório:\n\n**Passos:**\n1. "Add New Project"\n2. Autorize GitHub\n3. Selecione repositório\n4. Importar\n\n**Configurações:**\n- Framework Preset\n- Build Command\n- Output Directory\n- Environment Variables\n\n**Deploy automático:**\n- Cada push no GitHub\n- Deploy automático\n- Preview URLs',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/vercel.pdf',
        materialTitle: 'Guia de Vercel',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Deploy',
        content: 'Publicar online:\n\n**Configurar:**\n- Framework detectado automaticamente\n- Build command\n- Output directory\n\n**Variáveis de ambiente:**\n- Chaves de API\n- URLs de serviços\n- Configurações específicas\n\n**Publicação:**\n- Clique em "Deploy"\n- Aguarda build\n- URL gerada automaticamente\n\n**Resultado:**\n```\nprojeto.vercel.app\n```\n\n**Pronto para acessar!**',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Deploy',
        hasMaterial: false,
        order: 3
      }
    ],
    // Módulo 10
    [
      {
        title: 'Escolha do Domínio',
        content: 'Endereço profissional:\n\n**Exemplos:**\n```\nminhaempresa.com\nminamarca.co.mz\nmeunegocio.net\n```\n\n**Dicas:**\n- Curto e memorável\n- Fácil de escrever\n- Sem hífens/números\n- Extensão apropriada\n\n**Extensões:**\n- .com (global)\n- .co.mz (Moçambique)\n- .net (tecnologia)\n- .org (organizações)\n\n**Verificar disponibilidade:**\n- Namecheap\n- GoDaddy\n- Registro.br',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Escolha do Domínio',
        hasMaterial: true,
        materialUrl: 'https://example.com/dominio.pdf',
        materialTitle: 'Guia de Domínios',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Processo de Compra',
        content: 'Adquirir domínio:\n\n**Escolha do fornecedor:**\n- Comparar preços\n- Verificar reputação\n- Suporte técnico\n\n**Registo:**\n- Criar conta\n- Pesquisar domínio\n- Adicionar ao carrinho\n- Preencher dados\n\n**Pagamento:**\n- Cartão de crédito\n- PayPal\n- Transferência\n\n**Duração:**\n- 1 ano (mínimo)\n- Renovação anual\n- Multi-ano (desconto)',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      },
      {
        title: 'Ligação com Vercel',
        content: 'Configurar DNS:\n\n**No Vercel:**\n1. Settings > Domains\n2. Add domain\n3. Digite seu domínio\n\n**No registrador:**\n- Aceda DNS settings\n- Adicionar registros\n- Configurar nameservers\n\n**Registros DNS:**\n- A record: @ → IP do Vercel\n- CNAME: www → vercel.app\n\n**Verificação:**\n- Aguarda propagação\n- SSL automático\n- Domínio ativo\n\n**Resultado:**\nPágina no endereço oficial!',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Ligação com Vercel',
        hasMaterial: true,
        materialUrl: 'https://example.com/dns.pdf',
        materialTitle: 'Guia de DNS',
        materialType: 'pdf' as const,
        order: 3
      }
    ],
    // Módulo 11
    [
      {
        title: 'Teste em Computador',
        content: 'Verificar desktop:\n\n**Navegadores:**\n- Chrome\n- Firefox\n- Safari\n- Edge\n\n**Verificar:**\n- Layout correto\n- Funcionalidades\n- Links\n- Formulários\n- Imagens\n- Velocidade\n\n**Resoluções:**\n- 1920x1080\n- 1366x768\n- 1440x900\n\n**Ferramentas:**\n- DevTools\n- Responsiveness check\n- Lighthouse',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Teste em Computador',
        hasMaterial: true,
        materialUrl: 'https://example.com/testes-desktop.pdf',
        materialTitle: 'Checklist Desktop',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Teste em Tablet',
        content: 'Verificar tablet:\n\n**Dispositivos:**\n- iPad\n- Android tablets\n\n**Verificar:**\n- Touch\n- Layout adaptado\n- Navegação\n- Performance\n\n**Orientações:**\n- Portrait\n- Landscape\n\n**Resoluções:**\n- 768x1024\n- 1024x768',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      },
      {
        title: 'Teste em Telemóvel',
        content: 'Verificar mobile:\n\n**Dispositivos:**\n- iPhone\n- Android\n\n**Verificar:**\n- Touch\n- Performance\n- Layout\n- Navegação\n- Velocidade 3G/4G\n\n**Resoluções:**\n- 375x667\n- 414x896\n- 360x640\n\n**Ferramentas:**\n- Chrome DevTools (device mode)\n- BrowserStack\n- Teste real em dispositivos',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Teste em Telemóvel',
        hasMaterial: true,
        materialUrl: 'https://example.com/testes-mobile.pdf',
        materialTitle: 'Checklist Mobile',
        materialType: 'pdf' as const,
        order: 3
      },
      {
        title: 'Checklist Final',
        content: 'Verificação completa:\n\n**Funcionalidades:**\n✅ Todos os links funcionam\n✅ Formulários enviam\n✅ Botões respondem\n✅ Integrações ativas\n\n**Performance:**\n✅ Velocidade aceitável\n✅ Imagens otimizadas\n✅ Código minificado\n✅ Cache configurado\n\n**Segurança:**\n✅ SSL ativo\n✅ HTTPS funcionando\n✅ Proteção contra ataques\n✅ Dados protegidos\n\n**SEO básico:**\n✅ Meta tags\n✅ Títulos descritivos\n✅ Descrições\n✅ Sitemap',
        hasVideo: false,
        hasMaterial: false,
        order: 4
      }
    ],
    // Módulo 12
    [
      {
        title: 'Preparação Final',
        content: 'Últimos ajustes:\n\n**Confirmar domínio:**\n- DNS propagado\n- SSL ativo\n- Acessível\n\n**Publicar versão final:**\n- Último commit\n- Deploy de produção\n- Verificar online\n\n**Ativar SSL:**\n- Certificado gratuito\n- Forçar HTTPS\n- Redirecionamento\n\n**Testes finais:**\n- Todos os dispositivos\n- Todos os navegadores\n- Todas as funcionalidades',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Preparação Final',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Pós-Lançamento',
        content: 'Configurações adicionais:\n\n**Google Analytics:**\n- Criar conta\n- Adicionar tracking code\n- Configurar objetivos\n\n**Pixel de anúncios:**\n- Facebook Pixel\n- Google Ads\n- Eventos de conversão\n\n**SEO básico:**\n- Meta tags otimizadas\n- Sitemap.xml\n- Robots.txt\n- Indexação no Google\n\n**Estratégia de divulgação:**\n- Redes sociais\n- Email marketing\n- WhatsApp\n- Parcerias',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/pos-lancamento.pdf',
        materialTitle: 'Guia Pós-Lançamento',
        materialType: 'pdf' as const,
        order: 2
      }
    ],
    // Módulo 13
    [
      {
        title: 'Atualização de Conteúdos',
        content: 'Manter conteúdo fresco:\n\n**Quando atualizar:**\n- Mudanças de preço\n- Novos serviços\n- Promoções sazonais\n- Feedback de clientes\n\n**Como atualizar:**\n- Editar texto\n- Substituir imagens\n- Adicionar testemunhos\n- Atualizar informações\n\n**Processo:**\n1. Editar localmente\n2. Testar mudanças\n3. Commit no Git\n4. Deploy automático',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Atualização de Conteúdos',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Melhorias de Desempenho',
        content: 'Otimizar continuamente:\n\n**Monitorar:**\n- PageSpeed Insights\n- Lighthouse\n- Analytics\n\n**Melhorias:**\n- Otimizar imagens\n- Minificar código\n- Cache\n- CDN\n\n**Testes A/B:**\n- Testar headlines\n- Testar CTAs\n- Testar layouts\n- Analisar resultados',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/performance.pdf',
        materialTitle: 'Guia de Performance',
        materialType: 'pdf' as const,
        order: 2
      },
      {
        title: 'Segurança e Backup',
        content: 'Proteger o projeto:\n\n**Segurança:**\n- Atualizar dependências\n- Monitorar vulnerabilidades\n- Proteger formulários\n- Configurar CORS\n\n**Backup:**\n- Git como backup\n- Backup de banco de dados\n- Backup de arquivos\n\n**Recuperação:**\n- Plano de disaster recovery\n- Teste de restore\n- Documentação',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
        videoTitle: 'Segurança e Backup',
        hasMaterial: false,
        order: 3
      },
      {
        title: 'Novas Funcionalidades',
        content: 'Evoluir o projeto:\n\n**Planejar:**\n- Ouvir feedback\n- Analisar métricas\n- Identificar oportunidades\n\n**Implementar:**\n- Novas secções\n- Integrações\n- Automações\n- Chat ao vivo\n\n**Testar:**\n- Beta testing\n- Feedback de usuários\n- Ajustes\n\n**Lançar:**\n- Comunicação\n- Anúncios\n- Promoções',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/evolucao.pdf',
        materialTitle: 'Guia de Evolução',
        materialType: 'pdf' as const,
        order: 4
      }
    ]
  ];

  // Criar lições para cada módulo
  for (let moduleIndex = 0; moduleIndex < lessonsData.length; moduleIndex++) {
    const moduleLessons = lessonsData[moduleIndex];
    const courseModule = createdModules[moduleIndex];
    if (!courseModule) continue;
    
    for (let lessonIndex = 0; lessonIndex < moduleLessons.length; lessonIndex++) {
      const lessonData = moduleLessons[lessonIndex];
      const lessonDataWithModule = {
        moduleId: courseModule.id,
        ...lessonData,
        active: true
      };
      
      // Salvar no localStorage (MongoDB não está configurado na Vercel)
      const lesson = await dataManager.createLesson(lessonDataWithModule);
      console.log(`[SeedAcademy] Lição ${lessonIndex + 1} do módulo ${moduleIndex + 1} criada no localStorage:`, lesson?.id);
    }
  }

  console.log('[SeedAcademy] Dados da Academia Web criados com sucesso!');
  console.log('[SeedAcademy] Curso ID:', course.id);
  console.log('[SeedAcademy] Total de módulos:', createdModules.length);
  
  let totalLessons = 0;
  for (const mod of createdModules) {
    if (mod) {
      const moduleLessons = dataManager.getLessons(mod.id);
      totalLessons += moduleLessons.length;
      console.log(`[SeedAcademy] Módulo ${mod.id} tem ${moduleLessons.length} lições`);
    }
  }
  console.log('[SeedAcademy] Total de lições:', totalLessons);
  
  // Verificar dados no localStorage
  if (typeof window !== 'undefined') {
    const courses = localStorage.getItem('wehosthere_courses');
    const modules = localStorage.getItem('wehosthere_modules');
    const lessons = localStorage.getItem('wehosthere_lessons');
    console.log('[SeedAcademy] Verificação localStorage:');
    console.log('[SeedAcademy] - Cursos no localStorage:', courses ? JSON.parse(courses).length : 0);
    console.log('[SeedAcademy] - Módulos no localStorage:', modules ? JSON.parse(modules).length : 0);
    console.log('[SeedAcademy] - Lições no localStorage:', lessons ? JSON.parse(lessons).length : 0);
  }

  return course;
}

// Função para executar o seed no browser
if (typeof window !== 'undefined') {
  (window as any).seedAcademyData = seedAcademyData;
}
