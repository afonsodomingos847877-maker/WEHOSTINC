import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';
import { ModuleModel } from '@/lib/models/ModuleModel';
import { LessonModel } from '@/lib/models/LessonModel';

export async function ensureAcademySeeded() {
  try {
    await connectDB();

    let course = await CourseModel.findOne({ title: { $regex: /Criação de Página de Vendas/i } });

    if (!course) {
      course = new CourseModel({
        id: 'COURSE-1001',
        title: 'Criação de Página de Vendas Profissional',
        shortDescription: 'Aprenda a criar páginas de vendas do zero, desde a ideia até ao lançamento online',
        description: 'Este curso ensina, passo a passo, como criar uma Página de Vendas Profissional de alta conversão. Módulo 1 gratuito para degustação. Módulos avançados com certificado oficial por apenas 500 MT.',
        duration: '12 horas',
        outcome: 'Será capaz de criar páginas de vendas profissionais do zero e publicá-las online',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
        accessType: 'preview', // Degustação: Módulo 1 grátis, Módulos 2+ pagos
        price: 500,
        currency: 'MZN',
        order: 1,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await course.save();
    } else {
      // Garantir que está como preview e com preço 500 MT
      if (course.accessType === 'free' || !course.price) {
        course.accessType = 'preview';
        course.price = 500;
        course.currency = 'MZN';
        await course.save();
      }
    }

    const existingModulesCount = await ModuleModel.countDocuments({ courseId: course.id });

    if (existingModulesCount === 0) {
      console.log('[ServerSeedAcademy] A semear 13 módulos no MongoDB para o curso:', course.id);

      const modulesData = [
        {
          title: 'Introdução e Conceitos Fundamentais (Aula Aberta)',
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
          title: 'Estruturação do Negócio e Copywriting',
          description: 'Criar todas as informações e textos persuasivos para apresentar o negócio na página',
          objective: 'Ter todo o conteúdo necessário para inserir na página',
          order: 3
        },
        {
          title: 'Planeamento Visual da Página de Vendas',
          description: 'Criar a estrutura visual e estratégica antes do desenvolvimento',
          objective: 'Ter o mapa completo da página antes de programar',
          order: 4
        },
        {
          title: 'Preparação do Ambiente de Desenvolvimento',
          description: 'Instalar e configurar todas as ferramentas necessárias (Node.js, NPM, Git)',
          objective: 'Ambiente preparado para iniciar o projeto',
          order: 5
        },
        {
          title: 'Criação do Projeto Inicial',
          description: 'Criar a estrutura inicial da página de vendas com Next.js e TailwindCSS',
          objective: 'Primeira versão do projeto criada',
          order: 6
        },
        {
          title: 'Desenvolvimento da Página de Vendas',
          description: 'Transformar a estrutura planeada numa página funcional de alta conversão',
          objective: 'Página de vendas funcional criada',
          order: 7
        },
        {
          title: 'Versionamento com Git e GitHub',
          description: 'Guardar e controlar o código do projeto com segurança',
          objective: 'Projeto guardado online no GitHub',
          order: 8
        },
        {
          title: 'Publicação e Hospedagem na Nuvem',
          description: 'Colocar a página disponível na internet com alta performance',
          objective: 'Página disponível online para o mundo',
          order: 9
        },
        {
          title: 'Compra e Conexão do Domínio Profissional',
          description: 'Substituir o endereço temporário por um domínio personalizado na WEHOSTHERE',
          objective: 'Página disponível no seu domínio oficial .co.mz / .com',
          order: 10
        },
        {
          title: 'Testes e Otimização Mobile',
          description: 'Garantir que a página é rápida e funciona perfeitamente em telemóveis',
          objective: 'Checklist completo de testes realizado',
          order: 11
        },
        {
          title: 'Lançamento Oficial e Tráfego',
          description: 'Estratégias para atrair os primeiros visitantes e converter clientes',
          objective: 'Página oficialmente lançada com visitas',
          order: 12
        },
        {
          title: 'Manutenção, Métricas e Certificação',
          description: 'Análise de conversão, otimizações contínuas e emissão do certificado',
          objective: 'Emissão do Certificado Oficial de Conclusão',
          order: 13
        }
      ];

      for (let i = 0; i < modulesData.length; i++) {
        const m = modulesData[i];
        const moduleId = `MODULE-${1001 + i}`;
        
        const newMod = new ModuleModel({
          id: moduleId,
          courseId: course.id,
          title: m.title,
          description: m.description,
          objective: m.objective,
          hasVideo: true,
          videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
          videoTitle: m.title,
          hasMaterial: true,
          materialTitle: `Material de Apoio - ${m.title}`,
          materialType: 'pdf',
          order: m.order,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await newMod.save();

        // Criar lição para o módulo
        const newLesson = new LessonModel({
          id: `LESSON-${1001 + i}`,
          moduleId: moduleId,
          title: m.title,
          content: `Bem-vindo a esta aula!\n\n**Objetivo:** ${m.objective}\n\n**Resumo:** ${m.description}\n\nSiga os passos apresentados no vídeo acima para aplicar este conteúdo na prática no seu próprio projeto.`,
          hasVideo: true,
          videoUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
          videoTitle: m.title,
          videoDescription: m.description,
          hasMaterial: true,
          materialTitle: `Guia em PDF - ${m.title}`,
          materialType: 'pdf',
          order: 1,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await newLesson.save();
      }
      console.log('[ServerSeedAcademy] 13 módulos e lições criados com sucesso!');
    }

    return course;
  } catch (error) {
    console.error('[ServerSeedAcademy] Erro ao verificar/semear academia:', error);
    return null;
  }
}
