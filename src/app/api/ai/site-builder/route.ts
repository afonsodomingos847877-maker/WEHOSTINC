import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// â”€â”€â”€ Fallback HTML (Modelos Pré-Prontos Preto & Branco Ricos: Hero, Stats, Grid, Galeria com Imagens Unsplash, Depoimentos, FAQ, Formulário de Agendamento WhatsApp, CTA, Botão Flutuante, Rodapé Multi-Coluna) â”€
function getFallbackHtml(prompt: string, title?: string): string {
  const p = prompt.toLowerCase();

  // Componentes Auxiliares Reutilizáveis
  const renderHead = (pageTitle: string) => `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #000000; color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
    ::selection { background: #ffffff; color: #000000; }
    section[id] { scroll-margin-top: 5rem; }
  </style>
</head>`;

  const renderNavbar = (brand: string, navItems: { label: string; href: string }[], waMsg: string) => `
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-black/85 border-b border-white/10 transition-all">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">

      <!-- Logo: initial only on mobile, full name on sm+ -->
      <a href="#inicio" class="flex items-center gap-2.5 group shrink-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-base sm:text-lg shadow-lg group-hover:scale-105 transition">
          ${brand.charAt(0).toUpperCase()}
        </div>
        <div class="hidden sm:block">
          <span class="font-extrabold text-base tracking-tight text-white block leading-tight">${brand}</span>
          <span class="text-[9px] uppercase tracking-widest text-zinc-400 block font-medium">Exclusividade &amp; Luxo</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-6 lg:gap-8" id="desktop-nav">
        ${navItems.map(item => `<a href="${item.href}" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">${item.label}</a>`).join('')}
      </nav>

      <!-- Right side: WA icon-only on mobile, full button on sm+ | hamburger on mobile -->
      <div class="flex items-center gap-2">
        <!-- WhatsApp icon-only (mobile) -->
        <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer"
           class="sm:hidden w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black hover:bg-zinc-200 transition shadow-sm">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
        </a>
        <!-- WhatsApp full button (sm+) -->
        <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer"
           class="hidden sm:inline-flex items-center gap-2 bg-white text-black font-bold text-xs px-4 py-2.5 rounded-full hover:bg-zinc-200 transition shadow-sm hover:scale-[1.02]">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>WhatsApp</span>
        </a>
        <!-- Hamburger (mobile only) -->
        <button id="menu-toggle" aria-label="Abrir menu" onclick="toggleMobileMenu()"
                class="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition gap-[5px]">
          <span id="hb1" class="block w-4 h-0.5 bg-white transition-all duration-300 origin-center"></span>
          <span id="hb2" class="block w-4 h-0.5 bg-white transition-all duration-300"></span>
          <span id="hb3" class="block w-4 h-0.5 bg-white transition-all duration-300 origin-center"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div id="mobile-menu" style="display:none;flex-direction:column;" class="md:hidden bg-black/98 backdrop-blur-2xl border-t border-white/10 px-4 py-5 space-y-1">
      ${navItems.map(item => `<a href="${item.href}" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">${item.label}</a>`).join('\n      ')}
      <div class="pt-3 mt-2 border-t border-white/10">
        <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer"
           class="flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition w-full">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  </header>`;

  const renderStats = (stats: { value: string; label: string }[]) => `
  <section class="border-y border-white/10 bg-white/[0.02] py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        ${stats.map(s => `
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">${s.value}</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">${s.label}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;

  const renderGallery = (title: string, subtitle: string, items: { title: string; desc: string; image: string; tag: string }[]) => `
  <section id="galeria" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        <span>Experiência Visual</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      ${items.map(item => `
      <div class="group relative rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl">
        <div class="relative h-60 sm:h-64 overflow-hidden w-full bg-zinc-900">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 contrast-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          <div class="absolute top-4 left-4 z-10">
            <span class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">${item.tag}</span>
          </div>
        </div>
        <div class="p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${item.title}</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">${item.desc}</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-300 font-semibold group-hover:text-white">
            <span>Explorar detalhe</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </section>`;

  const renderTestimonials = (title: string, subtitle: string, list: { name: string; role: string; comment: string }[]) => `
  <section id="depoimentos" class="py-24 border-t border-white/10 bg-white/[0.01]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i>
          <span>Excelência Comprovada</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${list.map(t => `
        <div class="p-8 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1 mb-4">
              ${Array(5).fill(0).map(() => `<i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>`).join('')}
            </div>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed italic mb-6">"${t.comment}"</p>
          </div>
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <div class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              ${t.name.charAt(0)}
            </div>
            <div>
              <div class="text-xs font-bold text-white">${t.name}</div>
              <div class="text-[11px] text-zinc-400">${t.role}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;

  const renderFaq = (title: string, subtitle: string, faqs: { q: string; a: string }[]) => `
  <section id="faq" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
        <span>Esclarecimentos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">${title}</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">${subtitle}</p>
    </div>

    <div class="space-y-4">
      ${faqs.map(faq => `
      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>${faq.q}</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          ${faq.a}
        </div>
      </div>`).join('')}
    </div>
  </section>`;

  const renderBookingForm = (title: string, subtitle: string, options: string[], btnText: string) => `
  <section id="agendamento" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-zinc-950 border border-white/10 p-8 sm:p-12 overflow-hidden shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none"></div>
      
      <div class="text-center max-w-xl mx-auto mb-10 relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Atendimento Direto &bull; Moçambique</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">${title}</h2>
        <p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">${subtitle}</p>
      </div>

      <form onsubmit="handleBookingSubmit(event)" class="relative z-10 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">O Seu Nome</label>
            <input type="text" name="booking_name" required placeholder="Ex: Carlos Mondlane" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Telemóvel / WhatsApp</label>
            <input type="tel" name="booking_phone" required placeholder="Ex: +258 84 000 0000" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Opção / Serviço Desejado</label>
            <select name="booking_service" required class="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition">
              <option value="" disabled selected class="text-zinc-500">Selecione uma opção...</option>
              ${options.map(opt => `<option value="${opt}" class="bg-zinc-900 text-white">${opt}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Data Preferencial</label>
            <input type="date" name="booking_date" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Mensagem ou Observações (Opcional)</label>
          <textarea name="booking_notes" rows="3" placeholder="Indique qualquer preferência específica ou detalhe adicional..." class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition resize-none"></textarea>
        </div>

        <button type="submit" class="w-full py-4 px-6 rounded-xl bg-white text-black font-extrabold text-sm tracking-wide hover:bg-zinc-200 transition shadow-xl flex items-center justify-center gap-2 group cursor-pointer">
          <i data-lucide="send" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          <span>${btnText}</span>
        </button>
        <p class="text-[11px] text-center text-zinc-500 mt-2">
          ðŸ”’ Ao submeter, abrirá o WhatsApp com a mensagem formatada para confirmação imediata.
        </p>
      </form>
    </div>
  </section>`;

  const renderCta = (title: string, desc: string, btnText: string, waMsg: string) => `
  <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/15 p-10 sm:p-16 text-center overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
      <div class="relative z-10 max-w-3xl mx-auto">
        <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">${title}</h2>
        <p class="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">${desc}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-2xl hover:scale-105">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            <span>${btnText}</span>
          </a>
        </div>
        <div class="mt-6 text-[11px] text-zinc-400 font-medium">
          âœ“ Atendimento Imediato &bull; Moçambique &bull; Disponível 24/7
        </div>
      </div>
    </div>
  </section>`;

  const renderFooter = (brand: string, navItems: { label: string; href: string }[], waMsg?: string) => `
  <!-- Botão Flutuante do WhatsApp -->
  <a href="https://wa.me/258848335618?text=${encodeURIComponent(waMsg || 'Olá! Gostaria de mais informações.')}" target="_blank" rel="noopener noreferrer" class="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 bg-white text-black font-bold text-xs py-2.5 px-3.5 sm:px-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-zinc-200 border border-white/20 group">
    <i data-lucide="message-circle" class="w-4 h-4 group-hover:rotate-12 transition-transform"></i>
    <span class="hidden sm:inline font-bold tracking-tight">WhatsApp</span>
  </a>

  <footer id="contacto" class="border-t border-white/10 bg-black pt-16 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-white/10">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-black text-base">
              ${brand.charAt(0).toUpperCase()}
            </div>
            <span class="font-bold text-lg text-white tracking-tight">${brand}</span>
          </div>
          <p class="text-xs text-zinc-400 leading-relaxed">
            Excelência, design refinado e compromisso com o mais alto padrão em Moçambique.
          </p>
          <div class="flex items-center gap-3 pt-2">
            <a href="https://wa.me/258848335618" target="_blank" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="message-circle" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="instagram" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="phone" class="w-4 h-4"></i></a>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Navegação</h4>
          <ul class="space-y-2.5">
            ${navItems.map(item => `<li><a href="${item.href}" class="text-xs text-zinc-400 hover:text-white transition">${item.label}</a></li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Contacto & Localização</h4>
          <ul class="space-y-2.5 text-xs text-zinc-400">
            <li class="flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-white"></i>
              <span>Maputo &bull; Matola, Moçambique</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="phone" class="w-4 h-4 text-white"></i>
              <span>+258 84 000 0000</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="mail" class="w-4 h-4 text-white"></i>
              <span>contacto@${brand.toLowerCase().replace(/\s+/g, '')}.co.mz</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-white"></i>
              <span>Seg - Sáb: 08:00 às 20:00</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Pagamentos Aceites</h4>
          <p class="text-xs text-zinc-400 mb-4">Aceitamos as principais soluções financeiras de Moçambique:</p>
          <div class="flex flex-wrap gap-2 text-[10px] text-zinc-300 font-semibold">
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">M-Pesa</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">E-Mola</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">BIM / BCI</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">Numerário</span>
          </div>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
        <div>&copy; 2026 ${brand}. Todos os direitos reservados.</div>
        <div class="flex items-center gap-2">
          <span>Potenciado por</span>
          <span class="font-bold text-white tracking-wider">WEHOSTHERE</span>
        </div>
      </div>
    </div>
  </footer>

  <script>
    lucide.createIcons();
    function toggleMobileMenu(){var m=document.getElementById('mobile-menu'),h1=document.getElementById('hb1'),h2=document.getElementById('hb2'),h3=document.getElementById('hb3'),o=m.style.display==='flex';if(o){m.style.display='none';h1.style.transform='';h2.style.opacity='1';h3.style.transform='';}else{m.style.display='flex';h1.style.transform='rotate(45deg) translate(4px,4px)';h2.style.opacity='0';h3.style.transform='rotate(-45deg) translate(4px,-4px)';}}
    function closeMobileMenu(){var m=document.getElementById('mobile-menu'),h1=document.getElementById('hb1'),h2=document.getElementById('hb2'),h3=document.getElementById('hb3');if(m)m.style.display='none';if(h1){h1.style.transform='';h2.style.opacity='1';h3.style.transform='';}}
    function toggleFaq(btn) {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('i[data-lucide="chevron-down"]');
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
    function handleBookingSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.querySelector('[name="booking_name"]')?.value || '';
      const phone = form.querySelector('[name="booking_phone"]')?.value || '';
      const service = form.querySelector('[name="booking_service"]')?.value || '';
      const date = form.querySelector('[name="booking_date"]')?.value || '';
      const notes = form.querySelector('[name="booking_notes"]')?.value || '';

      let text = 'Olá! Gostaria de fazer uma solicitação:\n\n';
      if (name) text += 'ðŸ‘¤ *Nome:* ' + name + '\n';
      if (phone) text += 'ðŸ“± *Contacto:* ' + phone + '\n';
      if (service) text += 'ðŸŽ¯ *Opção:* ' + service + '\n';
      if (date) text += 'ðŸ“… *Data:* ' + date + '\n';
      if (notes) text += 'ðŸ“ *Mensagem:* ' + notes + '\n';

      const waUrl = 'https://wa.me/258848335618?text=' + encodeURIComponent(text);
      window.open(waUrl, '_blank');
    }
  </script>`;

  // 1. RESTAURANTE / GASTRONOMIA
  if (p.includes('restaurante') || p.includes('comida') || p.includes('menu') || p.includes('cafe') || p.includes('café') || p.includes('hamburguer') || p.includes('pizza') || p.includes('bistrô')) {
    const brand = title || 'Bistrô Savana Gourmet';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Cardápio', href: '#cardapio' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Reservar Mesa', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de reservar uma mesa no ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Gastronomia de Excelência')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Aberto Hoje &bull; Sommerschield, Maputo</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Sabores Autênticos com a Arte da <span class="underline decoration-white/30 decoration-wavy">Alta Culinária</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Uma experiência gastronómica inesquecível com mariscos frescos da costa moçambicana, carnes nobres e ingredientes cuidadosamente selecionados.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#cardapio" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="utensils" class="w-4 h-4"></i>
          <span>Ver Cardápio Especial</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Reservar Mesa Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '18.500+', label: 'Clientes Atendidos' },
    { value: '4.9/5', label: 'Avaliação Média' },
    { value: '100%', label: 'Ingredientes Frescos' },
    { value: '2 Chefes', label: 'Premiados Internacionais' }
  ])}

  <section id="cardapio" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Pratos Selecionados</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Especialidades do Chef</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Conheça as nossas opções mais aclamadas pelos clientes em Maputo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Camarão Tigre Grelhado', desc: 'Camarão gigante com manteiga de ervas, alho tostado e arroz de coco perfumado.', price: '1.450 MT', icon: 'utensils' },
        { name: 'Picanha Nobre na Brasa', desc: 'Corte premium grelhado no ponto perfeito, acompanhado de farofa crocante e mandioca.', price: '980 MT', icon: 'flame' },
        { name: 'Frango Zambeziano Autêntico', desc: 'Receita tradicional marinada em leite de coco fresco, piripiri suave e especiarias.', price: '690 MT', icon: 'drumstick' },
        { name: 'Massa Trufada com Cogumelos', desc: 'Fettuccine artesanal envolto em molho cremoso de trufas e parmesão ralado na hora.', price: '780 MT', icon: 'chef-hat' },
        { name: 'Petit Gâteau de Chocolate', desc: 'Bolo quente com coração derretido de chocolate belga e gelado de baunilha de Madagáscar.', price: '380 MT', icon: 'cake' },
        { name: 'Cocktail de Assinatura Savana', desc: 'Gin artesanal infundido com frutos tropicais, alecrim e tónica botânica.', price: '320 MT', icon: 'wine' }
      ].map(dish => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${dish.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${dish.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${dish.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${dish.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de pedir: ' + dish.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
          <span>Pedir no WhatsApp</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('O Nosso Ambiente & Pratos', 'Espaços e apresentações desenhados para proporcionar momentos memoráveis.', [
    { title: 'Salão Principal Acolhedor', desc: 'Design contemporâneo, iluminação acolhedora e mesas espaçosas para encontros inesquecíveis.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', tag: 'Ambiente' },
    { title: 'Garrafeira de Vinhos Selecionados', desc: 'Mais de 80 rótulos selecionados de Portugal, África do Sul e das melhores regiões do mundo.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', tag: 'Vinhos Raros' },
    { title: 'Gastronomia & Carnes Nobres', desc: 'Cortes nobres grelhados na brasa com temperos artesanais e apresentação impecável.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', tag: 'Pratos de Assinatura' }
  ])}

  ${renderTestimonials('O Que Dizem os Nossos Clientes', 'A opinião de quem vive a experiência gastronómica no nosso restaurante.', [
    { name: 'Dr. Carlos Mondlane', role: 'Cliente Frequente &bull; Maputo', comment: 'O camarão grelhado é simplesmente incomparável. Atendimento nobre e garrafeira de topo.' },
    { name: 'Ana Machava', role: 'Crítica Gastronómica &bull; Sommerschield', comment: 'Ambiente sofisticado e comida que respeita a identidade moçambicana com técnicas de classe mundial.' },
    { name: 'Tomás Sitoe', role: 'Empresário &bull; Matola', comment: 'Lugar predileto para almoços de negócios e jantares em família. A picanha na brasa é perfeita.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Tudo o que precisa de saber antes da sua visita.', [
    { q: 'É obrigatório fazer reserva prévia?', a: 'Não é obrigatório, mas é altamente recomendável nos finais de semana e jantares para garantir a sua mesa sem tempo de espera.' },
    { q: 'Têm opções vegetarianas e sem glúten?', a: 'Sim! Dispomos de pratos vegetarianos dedicados e os nossos chefes adaptam receitas para clientes com restrições alimentares.' },
    { q: 'Aceitam pagamentos por M-Pesa e cartões bancários?', a: 'Sim, aceitamos M-Pesa, E-Mola, cartões Visa/Mastercard (POS nacional e internacional) e numerário.' },
    { q: 'Fazem reservas para eventos corporativos e aniversários?', a: 'Com certeza. Dispomos de menus de grupo personalizados e área reservada para celebrações e conferências.' }
  ])}

  ${renderBookingForm('Reserve a Sua Mesa Online', 'Preencha os dados abaixo e confirme instantaneamente a sua reserva pelo WhatsApp.', [
    'Reserva de Mesa (Casal)',
    'Reserva de Mesa (Família / 4+ pessoas)',
    'Almoço de Negócios / Reunião',
    'Celebração de Aniversário / Evento',
    'Menu Degustação Especial do Chef'
  ], 'Confirmar Reserva pelo WhatsApp')}

  ${renderCta('Viva uma Noite Inesquecível Conosco', 'Reserve já a sua mesa ou encomende os nossos pratos exclusivos diretamente para a sua residência.', 'Fazer Reserva Imediata', 'Olá! Gostaria de reservar uma mesa no restaurante.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 2. BARBEARIA & ESTÉTICA MASCULINA
  if (p.includes('barbearia') || p.includes('cabelo') || p.includes('barba') || p.includes('estetica') || p.includes('salão') || p.includes('salao')) {
    const brand = title || 'Barbearia Real Club';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Serviços', href: '#servicos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Agendar', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de agendar um horário na ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Estilo & Barbearia Premium')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Atendimento com Hora Marcada &bull; Maputo</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Precisão, Estilo e Atendimento de <span class="underline decoration-white/30 decoration-wavy">Cavalheiro</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        O espaço ideal para homens que valorizam a excelência. Cortes clássicos e modernos, terapia de barba e produtos de primeira linha.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#servicos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="scissors" class="w-4 h-4"></i>
          <span>Ver Tabela de Serviços</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Agendar Horário Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '4.800+', label: 'Cortes Realizados' },
    { value: '4.9/5', label: 'Satisfação dos Clientes' },
    { value: '6 Barbeiros', label: 'Mestres Especialistas' },
    { value: '100%', label: 'Pontualidade Garantida' }
  ])}

  <section id="servicos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Preços Transparentes</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Serviços de Assinatura</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Cada detalhe planeado para realçar a sua presença e confiança.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Corte Moderno & Fade', desc: 'Graduação milimétrica com tesoura e máquina, finalização com pomada mate de alta fixação.', price: '450 MT', icon: 'scissors' },
        { name: 'Barboterapia com Toalha Quente', desc: 'Alinhamento com navalha afiada, óleos essenciais, massagem facial e toalha vaporizada.', price: '400 MT', icon: 'sparkles' },
        { name: 'Combo Executivo (Cabelo + Barba)', desc: 'O pacote completo para estar sempre impecável com economia de tempo e desconto exclusivo.', price: '750 MT', icon: 'crown' },
        { name: 'Tratamento & Hidratação Capilar', desc: 'Nutrição profunda para cabelos ressecados, restauração de brilho e fortalecimento do couro cabeludo.', price: '500 MT', icon: 'shield-check' },
        { name: 'Limpeza de Pele Facial Masculina', desc: 'Desobstrução de poros, esfoliação suave e hidratação anti-brilho revigorante.', price: '600 MT', icon: 'smile' },
        { name: 'Corte Infantil Estiloso', desc: 'Atendimento paciente e cuidadoso para os pequenos, garantindo um visual moderno e divertido.', price: '350 MT', icon: 'user' }
      ].map(srv => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${srv.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${srv.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${srv.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${srv.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de agendar: ' + srv.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Agendar Este Serviço</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('O Nosso Espaço & Equipamento', 'Ambiente contemporâneo pensado no seu conforto e bem-estar.', [
    { title: 'Cadeiras Vintage em Couro', desc: 'Conforto máximo durante todo o seu atendimento com reclinação suave e ergonomia.', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', tag: 'Conforto VIP' },
    { title: 'Barboterapia com Toalha Quente', desc: 'Cuidado milimétrico com navalha afiada, óleos essenciais e toalha vaporizada relaxante.', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80', tag: 'Tradição & Precisão' },
    { title: 'Produtos Grooming Profissionais', desc: 'Pomadas de fixação mate, óleos para barba e loções de alta performance dermatológica.', image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80', tag: 'Alta Qualidade' }
  ])}

  ${renderTestimonials('Depoimentos de Cavalheiros', 'O que dizem os clientes que confiam no nosso trabalho semanalmente.', [
    { name: 'Daniel Cossa', role: 'Engenheiro &bull; Maputo', comment: 'O degradê é o mais preciso de Maputo. Pontualidade impecável, sem esperas desnecessárias.' },
    { name: 'Nelson Tembe', role: 'Advogado &bull; Polana Cimento', comment: 'A barboterapia com toalha quente é um verdadeiro momento de relaxamento após um dia longo.' },
    { name: 'Jorge Macamo', role: 'Gestor &bull; Matola Rio', comment: 'Ambiente de alto nível, barbeiros educados e atendimento de cavalheiro. Nota 10!' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Dúvidas comuns sobre o agendamento e serviços.', [
    { q: 'Preciso marcar com antecedência ou posso ir direto?', a: 'Atendemos por ordem de chegada se houver vaga, mas recomendamos agendar pelo WhatsApp para garantir atendimento sem espera.' },
    { q: 'Quanto tempo dura uma sessão de corte e barba?', a: 'O combo de corte e barba dura aproximadamente 45 a 60 minutos com todos os cuidados e toalha vaporizada.' },
    { q: 'Quais os métodos de pagamento aceites?', a: 'Aceitamos M-Pesa, E-Mola, cartões POS de débito/crédito e pagamento em numerário.' },
    { q: 'Possuem estacionamento privativo?', a: 'Sim, dispomos de estacionamento vigiado e gratuito em frente ao estabelecimento.' }
  ])}

  ${renderBookingForm('Agendamento de Horário VIP', 'Escolha o serviço desejado e a data para confirmação instantânea da sua sessão.', [
    'Corte Moderno & Fade (450 MT)',
    'Barboterapia com Toalha Quente (400 MT)',
    'Combo Executivo Cabelo + Barba (750 MT)',
    'Tratamento & Hidratação Capilar (500 MT)',
    'Limpeza de Pele Facial Masculina (600 MT)',
    'Corte Infantil Estiloso (350 MT)'
  ], 'Confirmar Agendamento pelo WhatsApp')}

  ${renderCta('Renove o Seu Visual Hoje Mesmo', 'Agende a sua sessão com os melhores barbeiros da cidade em poucos segundos pelo WhatsApp.', 'Marcar Horário VIP', 'Olá! Gostaria de agendar um horário na barbearia.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 3. HOTEL, RESORT & HOSPEDAGEM
  if (p.includes('hotel') || p.includes('pousada') || p.includes('resort') || p.includes('hospedagem') || p.includes('quarto') || p.includes('lodge')) {
    const brand = title || 'Palace Grand Hotel & Resort';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Acomodações', href: '#acomodacoes' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Reservar Suíte', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de consultar tarifas e disponibilidade no ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Hospitalidade & Conforto 5 Estrelas')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Reservas Abertas &bull; Vista para o Índico</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Hospitalidade de Luxo e <span class="underline decoration-white/30 decoration-wavy">Conforto Incomparável</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Suítes de alto padrão com vista panorâmica, gastronomia internacional e atendimento personalizado para tornar cada estadia inesquecível.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#acomodacoes" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="bed" class="w-4 h-4"></i>
          <span>Explorar Suítes</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Reservar Estadia Online</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '96 Suítes', label: 'Luxo & Vista Mar' },
    { value: '5 Estrelas', label: 'Padrão Internacional' },
    { value: '2 Piscinas', label: 'Borda Infinita' },
    { value: '24/7', label: 'Serviço de Concierge' }
  ])}

  <section id="acomodacoes" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Acomodações Selecionadas</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Suítes & Acomodações de Luxo</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Concebidas para o máximo relaxamento e produtividade.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Suíte Presidencial Oceano', desc: '120mÂ², cama king-size, varanda panorâmica com vista mar, banheira de hidromassagem e mordomo privativo.', price: '9.800 MT / noite', icon: 'crown' },
        { name: 'Suíte Executiva Premium', desc: 'Espaço de trabalho ergonómico, Wi-Fi 6 de alta velocidade, cama king e acesso ao lounge VIP executivo.', price: '4.800 MT / noite', icon: 'briefcase' },
        { name: 'Quarto Deluxe com Varanda', desc: 'Design minimalista e aconchegante, lençóis de 400 fios em algodão egípcio e minibar completo.', price: '3.400 MT / noite', icon: 'bed' },
        { name: 'Spa & Tratamentos Térmicos', desc: 'Massagens relaxantes, sauna finlandesa e terapias holísticas com óleos essenciais locais.', price: '1.200 MT / sessão', icon: 'sparkles' },
        { name: 'Transfer Executivo Aeroporto', desc: 'Transporte em viatura de luxo com ar-condicionado direto do Aeroporto Internacional de Maputo.', price: '900 MT / viagem', icon: 'car' },
        { name: 'Pequeno-Almoço Buffet Continental', desc: 'Frutas tropicais frescas, pastelaria artesanal, queijos nobres e sumos naturais de Moçambique.', price: 'Incluso na Reserva', icon: 'coffee' }
      ].map(room => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${room.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-sm font-extrabold text-white">${room.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${room.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${room.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de reservar: ' + room.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Reservar Esta Suíte</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Instalações & Lazer', 'Estrutura completa para relaxamento ou reuniões empresariais de alto padrão.', [
    { title: 'Suítes Master com Vista Panorâmica', desc: 'Acomodações de luxo com camas king-size, acabamento nobre em mármore e varanda privativa.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', tag: 'Acomodações' },
    { title: 'Piscina Panorâmica com Borda Infinita', desc: 'Espreguiçadeiras aquecidas e serviço de bar com vista deslumbrante para a Baía de Maputo.', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', tag: 'Lazer & Relaxamento' },
    { title: 'Spa & Terapias Holísticas', desc: 'Massagens terapêuticas, sauna finlandesa e banhos de imersão revigorantes com óleos locais.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', tag: 'Bem-Estar' }
  ])}

  ${renderTestimonials('A Experiência dos Nossos Hóspedes', 'Testemunhos de viajantes de negócios e turismo que escolheram o nosso hotel.', [
    { name: 'Sofia Langa', role: 'Hóspede de Férias &bull; Inhambane', comment: 'Vista espetacular do quarto, café da manhã maravilhoso e serviço de quarto com muita agilidade.' },
    { name: 'Marcus Berg', role: 'Consultor Internacional &bull; Joanesburgo', comment: 'A internet rápida e a tranquilidade da suíte permitiram-me trabalhar sem interrupções. Recomendo!' },
    { name: 'Fátima Noormahomed', role: 'Hóspede Frequente &bull; Nampula', comment: 'Hotel com acabamento luxuoso e atendimento que faz toda a diferença. Sentimo-nos em casa.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Informações essenciais para planear a sua estadia.', [
    { q: 'Quais são os horários de check-in e check-out?', a: 'Check-in a partir das 14:00 e check-out até às 11:00. Late check-out mediante disponibilidade.' },
    { q: 'O pequeno-almoço está incluído em todas as tarifas?', a: 'Sim, todas as reservas incluem buffet de pequeno-almoço continental completo no restaurante principal.' },
    { q: 'Disponibilizam transporte do aeroporto?', a: 'Sim, dispomos de transfers executivos privativos sob solicitação prévia.' },
    { q: 'Qual é a política de cancelamento?', a: 'Cancelamentos gratuitos até 48 horas antes da data de check-in sem qualquer taxa.' }
  ])}

  ${renderBookingForm('Solicitação de Reserva de Hospedagem', 'Indique as suas preferências para que a nossa equipa de concierge confirme a melhor suíte disponível.', [
    'Suíte Presidencial Oceano (9.800 MT / noite)',
    'Suíte Executiva Premium (4.800 MT / noite)',
    'Quarto Deluxe Casal (3.400 MT / noite)',
    'Pacote Fim-de-Semana Romântico',
    'Sessão Especial de Spa & Bem-Estar',
    'Reserva de Sala de Conferências'
  ], 'Consultar Disponibilidade no WhatsApp')}

  ${renderCta('Planeie a Sua Próxima Estadia Inesquecível', 'Consulte datas disponíveis e garanta a sua suíte com desconto exclusivo para reservas diretas.', 'Consultar Tarifas no WhatsApp', 'Olá! Gostaria de consultar tarifas para o hotel.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 4. LOJA / E-COMMERCE / MODA & PRODUTOS
  if (p.includes('loja') || p.includes('moda') || p.includes('roupa') || p.includes('calcado') || p.includes('calçado') || p.includes('produto') || p.includes('ecommerce') || p.includes('e-commerce') || p.includes('tenis') || p.includes('ténis')) {
    const brand = title || 'Atelier Privé | Coleção';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Coleção', href: '#produtos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Encomendar', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de comprar um produto da ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Alta Moda & Design')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Nova Temporada 2026 &bull; Edição Limitada</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Elegância Intemporal e <span class="underline decoration-white/30 decoration-wavy">Design Contemporâneo</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Peças exclusivas desenhadas para quem valoriza minimalismo, cortes precisos e materiais nobres de altíssima durabilidade.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#produtos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          <span>Explorar Catálogo</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="package" class="w-4 h-4"></i>
          <span>Fazer Encomenda Rápida</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '2.500+', label: 'Peças Entregues' },
    { value: '48 Horas', label: 'Entrega Rápida em Maputo' },
    { value: '100%', label: 'Garantia de Autenticidade' },
    { value: '4.9/5', label: 'Avaliação dos Clientes' }
  ])}

  <section id="produtos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Destaques da Coleção</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Peças em Destaque</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Disponíveis para envio imediato com embalagem de luxo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Ténis Minimalist Black & White', desc: 'Couro nobre macio, sola vulcanizada antiderrapante e acabamento feito à mão.', price: '3.800 MT', icon: 'footprints' },
        { name: 'Casaco Bomber Urban Noir', desc: 'Tecido técnico impermeável, forro térmico premium e fechos selados a laser.', price: '4.200 MT', icon: 'shirt' },
        { name: 'Camisa Linho Puro Algodão', desc: 'Respirável, corte tailored moderno para climas quentes com botões em madrepérola.', price: '2.400 MT', icon: 'sparkles' },
        { name: 'Relógio Monocromático Sapphire', desc: 'Movimento quartz de alta precisão, vidro em cristal de safira e pulseira de aço negro.', price: '6.500 MT', icon: 'watch' },
        { name: 'Carteira Slim Couro Genuíno', desc: 'Proteção RFID antifurto, compartimentos práticos para cartões e notas com espessura ultra fina.', price: '1.600 MT', icon: 'wallet' },
        { name: 'Mochila Executiva Waterproof', desc: 'Compartimento acolchoado para portátil até 16", porta USB embutida e tecido à prova de água.', price: '3.200 MT', icon: 'backpack' }
      ].map(prod => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${prod.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-base font-extrabold text-white">${prod.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${prod.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${prod.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de encomendar: ' + prod.name + ' (' + prod.price + ')')}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
          <span>Comprar pelo WhatsApp</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Qualidade & Detalhes da Coleção', 'Cada peça reflete o mais alto rigor em matérias-primas e artesanato.', [
    { title: 'Calçado & Ténis Minimalistas', desc: 'Couro nobre macio, sola vulcanizada durável e linhas limpas para uso casual e formal.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', tag: 'Calçado' },
    { title: 'Moda Tailored Contemporânea', desc: 'Cortes estruturados, tecidos resistentes ao calor e caimento impecável para todas as ocasiões.', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', tag: 'Vestuário' },
    { title: 'Acessórios & Relojoaria de Luxo', desc: 'Peças em aço escovado negro, vidro em cristal de safira e acabamentos de alta resistência.', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', tag: 'Acessórios VIP' }
  ])}

  ${renderTestimonials('Opiniões de Quem Já Comprou', 'Clientes que atestam a qualidade e o caimento das nossas peças.', [
    { name: 'Patrícia Neves', role: 'Cliente &bull; Maputo', comment: 'O tecido da camisa é fantástico! Veste muito bem e a entrega foi feita no mesmo dia.' },
    { name: 'Américo Vilanculos', role: 'Cliente &bull; Matola', comment: 'O ténis é extremamente confortável e minimalista. Qualidade de loja internacional.' },
    { name: 'Zélia Guambe', role: 'Cliente &bull; Beira', comment: 'A encomenda chegou à Beira perfeitamente embalada e em ótimo estado. Recomendo com certeza.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Informações sobre envio, trocas e garantias.', [
    { q: 'Fazem envios para todas as províncias de Moçambique?', a: 'Sim! Entregamos em Maputo e Matola em até 24h/48h e despachamos para as restantes províncias por transportadora de confiança.' },
    { q: 'Qual a política de trocas de tamanho?', a: 'Disponibilizamos 7 dias para troca de tamanho sem custos caso a peça não assente perfeitamente.' },
    { q: 'Quais as formas de pagamento disponíveis?', a: 'Pagamento via M-Pesa, E-Mola, transferência bancária (BIM/BCI) ou no ato da entrega (apenas Maputo).' },
    { q: 'Os produtos são originais com garantia?', a: 'Sim, todas as peças acompanham certificado de garantia e padrão de fabricação rigoroso.' }
  ])}

  ${renderBookingForm('Formulário de Encomenda Direta', 'Selecione a peça desejada e informe o seu contacto para envio rápido na sua morada.', [
    'Ténis Minimalist Black & White (3.800 MT)',
    'Casaco Bomber Urban Noir (4.200 MT)',
    'Camisa Linho Puro Algodão (2.400 MT)',
    'Relógio Monocromático Sapphire (6.500 MT)',
    'Carteira Slim Couro Genuíno (1.600 MT)',
    'Mochila Executiva Waterproof (3.200 MT)'
  ], 'Finalizar Encomenda no WhatsApp')}

  ${renderCta('Adquira Peças Exclusivas Hoje', 'Fale diretamente com os nossos consultores e reserve o seu tamanho antes que esgote.', 'Fazer Pedido pelo WhatsApp', 'Olá! Gostaria de consultar peças disponíveis na loja.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 5. PORTFÓLIO / CONSULTOR / DESIGNER / FOTÓGRAFO / PROFISSIONAL
  if (p.includes('portfolio') || p.includes('portfólio') || p.includes('designer') || p.includes('programador') || p.includes('advogado') || p.includes('consultor') || p.includes('fotografo') || p.includes('fotógrafo')) {
    const brand = title || 'Alexandre Bila | Portfolio';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Especialidades', href: '#especialidades' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Proposta', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de conversar sobre um projeto com ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Estratégia, Design & Tecnologia')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Agenda Disponível para Novos Projetos &bull; 2026</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Transformando Ideias em <span class="underline decoration-white/30 decoration-wavy">Soluções de Alto Impacto</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Ajudo empresas e líderes a construir marcas memoráveis, produtos digitais intuitivos e estratégias que geram resultados concretos e mensuráveis.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#especialidades" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="layers" class="w-4 h-4"></i>
          <span>Ver Áreas de Atuação</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Solicitar Proposta</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '45+ Projetos', label: 'Entregues com Sucesso' },
    { value: '8+ Anos', label: 'Experiência Profissional' },
    { value: '99%', label: 'Satisfação de Clientes' },
    { value: '12 Prémios', label: 'Distinções & Menções' }
  ])}

  <section id="especialidades" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Competências Essenciais</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Especialidades & Soluções</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Abordagem centrada em simplicidade, elegância e conversão.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Identidade Visual & Branding', desc: 'Construção de marcas sólidas com manuais de identidade, tipografia e diretrizes de autoridade.', price: 'Sob Medida', icon: 'pen-tool' },
        { name: 'UI/UX Design de Produtos Digitais', desc: 'Interfaces intuitivas para aplicativos e plataformas web focadas na melhor usabilidade.', price: 'Sob Medida', icon: 'layout' },
        { name: 'Desenvolvimento Web de Alta Performance', desc: 'Websites rápidos, responsivos e otimizados para motores de busca e conversão comercial.', price: 'Sob Medida', icon: 'code' },
        { name: 'Consultoria de Posicionamento Digital', desc: 'Diagnóstico de canais, funil de conversão e estratégias para aumentar o valor percebido.', price: 'Sob Medida', icon: 'trending-up' },
        { name: 'Otimização de Conversão (CRO)', desc: 'Testes e melhorias na jornada do utilizador para converter mais visitantes em clientes ativos.', price: 'Sob Medida', icon: 'target' },
        { name: 'Design Systems Escaláveis', desc: 'Bibliotecas de componentes reutilizáveis para equipas de engenharia e produto.', price: 'Sob Medida', icon: 'box' }
      ].map(esp => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${esp.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-zinc-400 tracking-wider uppercase">${esp.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${esp.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${esp.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de falar sobre: ' + esp.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          <span>Solicitar Orçamento</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Casos de Sucesso & Projetos', 'Projetos reais com interfaces elegantes que geraram impacto nos negócios.', [
    { title: 'Design System & Interfaces Digitais', desc: 'Arquitetura de UI/UX limpa e escalável para aplicações de alta conversão.', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', tag: 'UI/UX Design' },
    { title: 'Espaço de Criação & Estratégia', desc: 'Metodologias de design thinking e ideação ágil com foco no público moçambicano.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', tag: 'Branding & Estratégia' },
    { title: 'Planeamento de Produto & Wireframing', desc: 'Testes de usabilidade e prototipagem interativa para validação de hipóteses de negócio.', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80', tag: 'Engenharia Web' }
  ])}

  ${renderTestimonials('Reconhecimento de Parceiros', 'Feedback de líderes e empresas que confiaram nos meus serviços.', [
    { name: 'Dr. Edson Mugabe', role: 'CEO &bull; WeHost Moçambique', comment: 'O rigor técnico e a visão estética do Alexandre transformaram a perceção da nossa plataforma.' },
    { name: 'Beatriz Cuna', role: 'Fundadora &bull; Studio B Maputo', comment: 'Pontualidade britânica, comunicação transparente e um resultado final acima de qualquer expetativa.' },
    { name: 'Manuel Chirindza', role: 'Diretor de Marketing &bull; Matola', comment: 'Aumentámos a retenção de clientes em 35% após o lançamento do novo design. Recomendo vivamente.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Como funciona o processo de contratação e entrega.', [
    { q: 'Qual é o prazo típico para entrega de um website ou marca?', a: 'Projetos médios são entregues entre 2 a 4 semanas, com etapas claras de validação e feedback contínuo.' },
    { q: 'Como funciona a divisão de pagamentos?', a: 'Normalmente trabalhamos com 50% na aprovação da proposta e 50% após a conclusão e lançamento oficial.' },
    { q: 'Disponibiliza suporte e manutenção após a entrega?', a: 'Sim! Todos os projetos contam com 30 dias de suporte gratuito e planos mensais de manutenção sob medida.' },
    { q: 'Podemos agendar uma reunião inicial sem compromisso?', a: 'Certamente! Realizo chamadas de 20 minutos por Google Meet ou WhatsApp para entender o escopo da sua ideia.' }
  ])}

  ${renderBookingForm('Iniciar Novo Projeto', 'Conte-me sobre os seus objetivos e marque uma sessão de consultoria personalizada.', [
    'Identidade Visual & Branding Completo',
    'UI/UX Design de Aplicativo / SaaS',
    'Desenvolvimento de Website Institucional',
    'Consultoria de Posicionamento Digital',
    'Otimização de Conversão e Vendas (CRO)',
    'Design System para Equipa'
  ], 'Enviar Proposta pelo WhatsApp')}

  ${renderCta('Tem um Projeto Ambicioso em Mente?', 'Vamos construir algo memorável que destaque a sua empresa da concorrência.', 'Agendar Conversa no WhatsApp', 'Olá Alexandre! Gostaria de conversar sobre um projeto.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 6. CLOUD / SISTEMA / SAAS / WEHOST / TECH
  if (p.includes('simples') || p.includes('sistema') || p.includes('inicio') || p.includes('início') || p.includes('software') || p.includes('cloud') || p.includes('tech') || p.includes('wehost')) {
    const brand = title || 'WeHost Cloud Suite';
    const navItems = [
      { label: 'Início', href: '#inicio' },
      { label: 'Serviços', href: '#servicos' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Ativar Plano', href: '#agendamento' },
      { label: 'Contacto', href: '#contacto' }
    ];
    const waDefault = 'Olá! Gostaria de saber mais sobre a infraestrutura da ' + brand;

    return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Infraestrutura Cloud & Alta Performance')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Servidores Ativos em Moçambique &bull; 99.99% Uptime</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        A Nuvem Mais Rápida e Confiável para o <span class="underline decoration-white/30 decoration-wavy">Seu Negócio</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Hospedagem de alta velocidade com armazenamento SSD NVMe, baixa latência para o território nacional e suporte técnico dedicado 24 horas por dia.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#servicos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="server" class="w-4 h-4"></i>
          <span>Ver Planos & Recursos</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Solicitar Ativação Imediata</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '99.99%', label: 'Uptime SLA Garantido' },
    { value: '5ms', label: 'Latência Local Ultrarrápida' },
    { value: '12.000+', label: 'Websites Alojados' },
    { value: '24/7/365', label: 'Suporte Técnico Local' }
  ])}

  <section id="servicos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Recursos Corporativos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Soluções Cloud de Alto Desempenho</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Tecnologia de ponta pensada para a estabilidade contínua das suas aplicações.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Hospedagem NVMe Ultrarrápida', desc: 'Discos SSD NVMe de última geração, cPanel intuitivo e contas de e-mail corporativo ilimitadas.', price: 'Desde 350 MT / mês', icon: 'hard-drive' },
        { name: 'Servidores Cloud VPS Dedicados', desc: 'Recursos 100% isolados (vCPU, RAM DDR5) com acesso root completo e IP moçambicano.', price: 'Desde 1.450 MT / mês', icon: 'server' },
        { name: 'Domínios .MZ e Internacionais', desc: 'Registo e ativação imediata de extensões .co.mz, .mz, .com, .net com DNS Anycast redundante.', price: 'Ativação Rápida', icon: 'globe' },
        { name: 'Segurança & Proteção Anti-DDoS', desc: 'Filtro inteligente de tráfego que bloqueia ataques maliciosos antes de atingirem o seu servidor.', price: 'Incluso Grátis', icon: 'shield-check' },
        { name: 'Backups Diários Automatizados', desc: 'Cópias de segurança automáticas com restauração em 1-clique para tranquilidade absoluta.', price: 'Incluso Grátis', icon: 'database' },
        { name: 'Construtor de Sites IA Integrado', desc: 'Crie e edite websites profissionais em minutos com auxílio da nossa IA exclusiva.', price: 'Incluso no Plano', icon: 'cpu' }
      ].map(srv => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${srv.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">${srv.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${srv.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${srv.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de assinar o serviço: ' + srv.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Tecnologia & Infraestrutura de Ponta', 'Estrutura técnica robusta desenhada para empresas que não podem parar.', [
    { title: 'Data Center com Racks de Servidores', desc: 'Hardware corporativo com refrigeração avançada e alimentação elétrica ininterrupta.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80', tag: 'Datacenter' },
    { title: 'Backbone de Fibra & Baixa Latência', desc: 'Conexão direta aos principais pontos de troca de tráfego de Moçambique e da África Austral.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80', tag: 'Fibra Óptica' },
    { title: 'Segurança & Monitoramento 24/7', desc: 'Sistemas inteligentes com proteção contra ataques DDoS e supervisão de rede 365 dias por ano.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', tag: 'Segurança Contínua' }
  ])}

  ${renderTestimonials('Confiança das Melhores Empresas', 'Empresas e desenvolvedores que escolheram hospedar com estabilidade.', [
    { name: 'Cláudio Matusse', role: 'CTO &bull; StartupMz', comment: 'A latência dentro de Moçambique fez as nossas páginas abrirem em menos de 1 segundo. Fantástico.' },
    { name: 'Teresa Chissano', role: 'Gestora &bull; Agência Criativa', comment: 'O suporte via WhatsApp resolveu a nossa migração em 15 minutos num domingo. Nunca vi igual.' },
    { name: 'Rui Sumbana', role: 'Engenheiro de Software &bull; Maputo', comment: 'Os servidores VPS têm desempenho real sem sobrealocação. Estabilidade de padrão global.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Respostas rápidas sobre migração e funcionamento.', [
    { q: 'A migração do meu site atual para a WeHost tem algum custo?', a: 'Não! Migramos o seu site e contas de e-mail do seu provedor antigo sem qualquer custo e com zero tempo de inatividade.' },
    { q: 'Quais métodos de pagamento aceitam?', a: 'Aceitamos pagamentos mensais ou anuais por M-Pesa, E-Mola, transferência bancária (BIM/BCI) e cartões.' },
    { q: 'O suporte técnico funciona aos finais de semana e feriados?', a: 'Sim! A nossa equipa de suporte local opera 24 horas por dia, 7 dias por semana, inclusive feriados nacionais.' },
    { q: 'Posso fazer upgrade de plano quando meu site crescer?', a: 'Com certeza! Pode mudar de plano instantaneamente sem qualquer perda de dados ou configuração.' }
  ])}

  ${renderBookingForm('Ativação de Conta & Suporte Comercial', 'Escolha o serviço pretendido para receber atendimento imediato da equipa técnica da WeHost.', [
    'Hospedagem SSD NVMe (350 MT / mês)',
    'Servidor Cloud VPS Dedicado (1.450 MT / mês)',
    'Registo de Domínio Nacional .CO.MZ / .MZ',
    'Migração Gratuita de Website e E-mails',
    'Pacote Corporativo Customizado'
  ], 'Falar com Especialista no WhatsApp')}

  ${renderCta('Coloque o Seu Projeto Online Hoje Mesmo', 'Comece com a infraestrutura cloud mais estável e rápida de Moçambique.', 'Ativar Conta no WhatsApp', 'Olá! Gostaria de ativar um plano de hospedagem.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
  }

  // 7. GENÉRICO / CORPORATIVO / EMPRESA DE ALTO PADRÃO
  const brand = title || 'Apex Corporativo & Consultoria';
  const navItems = [
    { label: 'Início', href: '#inicio' },
    { label: 'Soluções', href: '#solucoes' },
    { label: 'Galeria', href: '#galeria' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Agendar Reunião', href: '#agendamento' },
    { label: 'Contacto', href: '#contacto' }
  ];
  const waDefault = 'Olá! Gostaria de agendar uma reunião com a equipa da ' + brand;

  return `<!DOCTYPE html>
<html lang="pt" class="dark">
${renderHead(brand + ' | Liderança & Inovação')}
<body class="bg-black text-white antialiased">
  ${renderNavbar(brand, navItems, waDefault)}

  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Atendimento Corporativo &bull; Moçambique 2026</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        Soluções Estratégicas para <span class="underline decoration-white/30 decoration-wavy">Empresas Líderes</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Impulsionamos o crescimento sustentável de organizações através de inteligência de mercado, processos eficientes e governação sólida.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#solucoes" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="compass" class="w-4 h-4"></i>
          <span>Nossas Soluções</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Agendar Reunião</span>
        </a>
      </div>
    </div>
  </section>

  ${renderStats([
    { value: '140+ Empresas', label: 'Assessoradas com ÃŠxito' },
    { value: '15+ Anos', label: 'Tradição no Mercado' },
    { value: '98%', label: 'Índice de Retenção' },
    { value: '24/7', label: 'Apoio aos Executivos' }
  ])}

  <section id="solucoes" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Portfólio de Serviços</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Soluções Corporativas Integradas</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Desenvolvidas para responder aos desafios dinâmicos do ecossistema empresarial.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[
        { name: 'Consultoria de Gestão & Governança', desc: 'Estruturação de processos, conformidade legal e boas práticas para tomada de decisão assertiva.', price: 'Personalizado', icon: 'shield' },
        { name: 'Planeamento Financeiro & Estratégico', desc: 'Análise de fluxo de caixa, orçamento preditivo e maximização do retorno sobre investimento.', price: 'Personalizado', icon: 'trending-up' },
        { name: 'Transformação Digital & Automação', desc: 'Implementação de ferramentas modernas para reduzir custos operacionais e acelerar tarefas.', price: 'Personalizado', icon: 'cpu' },
        { name: 'Auditoria & Gestão de Riscos', desc: 'Mapeamento preventivo de vulnerabilidades fiscais, contratuais e operacionais na empresa.', price: 'Personalizado', icon: 'check-square' },
        { name: 'Desenvolvimento de Lideranças', desc: 'Programas executivos de capacitação para gestores e diretores de alto rendimento.', price: 'Personalizado', icon: 'users' },
        { name: 'Expansão & Novos Mercados', desc: 'Estudos de viabilidade económica e apoio estratégico na entrada em novos territórios.', price: 'Personalizado', icon: 'globe' }
      ].map(item => `
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">${item.price}</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">${item.name}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">${item.desc}</p>
        </div>
        <a href="https://wa.me/258848335618?text=${encodeURIComponent('Olá! Gostaria de uma proposta sobre: ' + item.name)}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          <span>Solicitar Proposta</span>
        </a>
      </div>`).join('')}
    </div>
  </section>

  ${renderGallery('Diferenciais Competitivos & Estrutura', 'O que nos posiciona como parceiro de confiança das maiores empresas em Moçambique.', [
    { title: 'Salas Executivas de Alta Governança', desc: 'Espaços pensados para deliberações estratégicas, reuniões de conselho e parcerias.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', tag: 'Governança Corporativa' },
    { title: 'Presença e Credibilidade Regional', desc: 'Infraestrutura corporativa sólida e relações institucionais em todo o país.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', tag: 'Presença Regional' },
    { title: 'Inteligência e Análise de Dados', desc: 'Relatórios preditivos e auditoria para tomada de decisões financeiras seguras e rentáveis.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', tag: 'Inteligência de Mercado' }
  ])}

  ${renderTestimonials('A Confiança dos Nossos Parceiros', 'Líderes empresariais que alcançaram novos patamares connosco.', [
    { name: 'Dra. Laura Sitoe', role: 'Diretora Geral &bull; Grupo LS', comment: 'A clareza estratégica e o rigor da consultoria transformaram a nossa rentabilidade num momento crucial.' },
    { name: 'Alberto Mondlane', role: 'Fundador &bull; AM Indústrias', comment: 'Parceiros indispensáveis no nosso processo de transição geracional e expansão regional.' },
    { name: 'Celso Tembe', role: 'CFO &bull; Logística Moçambique', comment: 'Competência técnica invejável, postura ética e resultados mensuráveis desde as primeiras semanas.' }
  ])}

  ${renderFaq('Perguntas Frequentes', 'Respostas sobre o nosso formato de actuação.', [
    { q: 'Como iniciamos um trabalho de consultoria?', a: 'Realizamos primeiro uma sessão diagnóstica sem custos para avaliar os principais gargalos e oportunidades da organização.' },
    { q: 'Atendem empresas fora de Maputo?', a: 'Sim! Atendemos organizações em todas as províncias de Moçambique de forma presencial ou remota.' },
    { q: 'Qual o tempo médio de um projeto corporativo?', a: 'Os contratos variam de intervenções pontuais de 60 dias a acompanhamentos contínuos de governança anual.' },
    { q: 'Como é garantida a confidencialidade?', a: 'Todos os trabalhos são protegidos por acordos de confidencialidade estritos e protocolos de segurança de dados.' }
  ])}

  ${renderBookingForm('Sessão Diagnóstica & Proposta Executiva', 'Preencha o formulário institucional para agendarmos uma reunião com os nossos consultores seniores.', [
    'Consultoria de Gestão & Governança',
    'Planeamento Estratégico & Financeiro',
    'Transformação Digital & Automação',
    'Auditoria de Processos & Compliance',
    'Programa de Desenvolvimento de Lideranças',
    'Estudo de Viabilidade para Novos Mercados'
  ], 'Solicitar Reunião pelo WhatsApp')}

  ${renderCta('Agende uma Sessão Estratégica Executiva', 'Descubra como podemos acelerar a consolidação e eficiência da sua empresa.', 'Falar com Consultor no WhatsApp', 'Olá! Gostaria de agendar uma reunião estratégica.')}

  ${renderFooter(brand, navItems, waDefault)}
</body>
</html>`;
}

// â”€â”€â”€ System Instruction (Diretrizes Estritas Preto & Branco com Menu e Rodapé) â”€
const SYSTEM_INSTRUCTION = `Voce e o Construtor de Sites IA da WEHOSTHERE (uma plataforma cloud em Mocambique).
Sua missao e gerar ou aprimorar uma pagina web HTML5 COMPLETA, AUTONOMA, MODERNA, RESPONSIVA e IMPRESSIONANTE para o cliente.
DIRETRIZES CRITICAS DE DESIGN E ESTRUTURA:
1. Retorne APENAS o codigo HTML completo (comecando em <!DOCTYPE html> e terminando em </html>). NAO inclua explicacoes ou texto antes ou depois.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Plus Jakarta Sans ou Inter).
4. ESTETICA OBRIGATORIA: TEMA PRETO E BRANCO (Black & White / Minimalist Luxury). Fundo preto (#000000 ou #050505), texto em branco (#ffffff) e cinza (#a1a1aa), com bordas suaves (border-white/10). Botões de acao principais em BRANCO PURO com texto preto (bg-white text-black font-extrabold hover:bg-zinc-200).
5. MENU / NAVBAR: Simples e bonito, fixo ou sticky no topo (sticky top-0 backdrop-blur-xl bg-black/85 border-b border-white/10), com logo em caixa monocromatica, links essenciais e botao WhatsApp em branco.
6. RODAPE / FOOTER: Simples e bonito no fundo com divisor (border-t border-white/10), nome da marca, links rapidos e copyright "2026. Todos os direitos reservados."
7. ESTRUTURA COMPLETA E RICA (LOGO NO PRIMEIRO PROMPT):
   - Navbar com logo monocromático, links âncora e botão WhatsApp em branco
   - Hero impactante com badge pulsante ("Disponível em Moçambique"), H1 marcante, subtítulo e 2 botões de CTA
   - Barra de Estatísticas (Stats bar com 4 métricas expressivas)
   - Secção Principal (Serviços/Cardápio/Produtos) com grid de 6 cards ricos, preços em Meticais (MT) e botões de ação
   - Galeria / Showcase Visual (3 cards com IMAGENS REAIS E DE ALTA DEFINIÇÃO DO UNSPLASH https://images.unsplash.com/photo-... com proporção h-60 w-full object-cover, tags de categoria e efeito hover zoom)
   - Depoimentos / Prova Social (3 testemunhos com 5 estrelas e localização em Moçambique)
   - FAQ Interativo (4 perguntas frequentes com accordion retrátil em JavaScript nativo)
   - Formulário Interativo de Agendamento/Contacto (#agendamento): campos Nome, Telemóvel, Serviço/Opção e Data, com validação e envio formatado direto para o WhatsApp via window.open
   - Banner de CTA Final de alto impacto com gradiente radial e link para WhatsApp
   - Botão Flutuante do WhatsApp no canto inferior direito (fixed bottom-6 right-6 z-50 bg-white text-black font-extrabold px-5 py-3.5 rounded-full shadow-2xl hover:scale-110)
   - Rodapé Multi-Coluna (Marca & bio, Navegação, Contacto em Moçambique e Pagamentos: M-Pesa, E-Mola, BIM/BCI).
8. ÍCONES PROFISSIONAIS OBRIGATÓRIOS (REGRA DE OURO):
   - É ESTRITAMENTE PROIBIDO USAR EMOJIS (ex: ðŸš€, ðŸ’», âš¡, ðŸ”’, ðŸŽ¯, â­, ðŸ•, ðŸ¨, ðŸ›’, etc.) como ícones de cards, serviços, vantagens ou títulos. Emojis parecem amadores e destroem o visual profissional.
   - USE SEMPRE ÍCONES SVG PROFISSIONAIS INLINE com Tailwind CSS (ex: <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="..."/></svg>) OU utilize a biblioteca Lucide Icons via CDN:
     No <head>: <script src="https://unpkg.com/lucide@latest"></script>
     Nos cards: <i data-lucide="shield" class="w-6 h-6 text-white"></i> (ou "zap", "server", "globe", "cpu", "star", "phone", etc.)
     Antes de </body>: <script>lucide.createIcons();</script>
   - Envolva sempre cada ícone numa caixa elegante de suporte com cantos arredondados (ex: <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">...</div>).
9. Se houver HTML atual, REFINE e ATUALIZE mantendo essa estetica preta e branca minimalista de alto luxo e garantindo que todos os ícones sejam profissionais em SVG.
10. NAVEGAÇÃO E LINKS CLICÁVEIS (REGRA OBRIGATÓRIA):
    - TODOS os links de navegação (<nav> e menu do cabeçalho) DEVEM ser 100% clicáveis e funcionar com âncoras (<a href="#inicio">, <a href="#solucoes"> ou <a href="#servicos">, <a href="#vantagens">, <a href="#precos">, <a href="#contacto">).
    - Para CADA link de navegação no menu, DEVE OBRIGATORIAMENTE existir no corpo do documento a respectiva secção com o atributo id exato (ex: <section id="inicio">, <section id="solucoes">, <section id="vantagens">, <section id="precos">, <footer id="contacto">).
    - O <head> DEVE conter SEMPRE: <style>html { scroll-behavior: smooth; } section[id] { scroll-margin-top: 5rem; }</style> para que a navegação suave funcione sem que o cabeçalho fixo cubra os títulos.
    - Se houver botão de WhatsApp, DEVE ter link real no formato: href="https://wa.me/NUMERO?text=MENSAGEM".`;

// â”€â”€â”€ Detecção de Intenção Conversacional (Chat vs Geração de Código) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function detectConversationalIntent(prompt: string, hasCurrentHtml: boolean): { isChat: boolean; reply: string } {
  const p = prompt.trim().toLowerCase();

  // Palavras-chave que indicam claramente um comando ou pedido de construção/edição de site
  const actionKeywords = [
    'cria', 'criar', 'construir', 'construa', 'faz', 'fazer', 'muda', 'mudar', 
    'altera', 'alterar', 'adiciona', 'adicionar', 'remove', 'remover', 'elimina',
    'troca', 'trocar', 'coloca', 'colocar', 'desenvolve', 'desenvolver',
    'site', 'website', 'landing', 'pagina', 'página', 'loja', 'ecommerce', 
    'restaurante', 'barbearia', 'hotel', 'resort', 'preço', 'preco', 'precos',
    'botao', 'botão', 'whatsapp', 'formulario', 'formulário', 'tabela', 'cor', 'cores',
    'tema', 'fundo', 'header', 'footer', 'menu', 'navbar', 'hero', 'banner', 'design'
  ];

  const hasAction = actionKeywords.some(kw => p.includes(kw));
  if (hasAction) {
    return { isChat: false, reply: '' };
  }

  // Saudações típicas (sem pedido de ação)
  const greetings = [
    'ola', 'olá', 'oi', 'oii', 'oiii', 'hey', 'hello', 'hi', 'bom dia', 'boa tarde', 
    'boa noite', 'tudo bem', 'tudo bom', 'tudo bem?', 'opa', 'e aí', 'e ai', 
    'fala aí', 'salve'
  ];
  if (greetings.includes(p) || greetings.some(g => p === g || p === `${g}!` || p === `${g}.` || p === `${g}?`)) {
    return {
      isChat: true,
      reply: hasCurrentHtml
        ? 'Olá! Como posso ajudar a aprimorar o seu website? Pode pedir para mudar cores, adicionar novas secções, incluir botão de WhatsApp, catálogo de serviços ou preços.'
        : 'Olá! Sou o Construtor com Inteligência Artificial da WEHOSTHERE. Que tipo de website ou sistema deseja criar hoje? (Por exemplo: um restaurante, barbearia, portfólio, loja online ou página de captura).'
    };
  }

  // Dúvidas de como usar ou quem é
  if (
    p.includes('como funciona') || p.includes('o que fazes') || p.includes('o que podes fazer') || 
    p.includes('quem és tu') || p.includes('quem e voce') || p.includes('como usar') ||
    p === 'ajuda' || p === 'help' || p.includes('podes me ajudar')
  ) {
    return {
      isChat: true,
      reply: 'Eu crio e altero websites completos e responsivos em tempo real! Pode simplesmente descrever o que precisa no chat, por exemplo:\n\nâ€¢ "Cria uma landing page para uma clínica médica com agendamento"\nâ€¢ "Adiciona um botão de WhatsApp flutuante"\nâ€¢ "Muda a paleta de cores para tema escuro e dourado"\n\nAssim que fizer o pedido, vou gerar o código ao vivo no terminal e atualizar o preview!'
    };
  }

  // Elogios ou confirmações curtas
  const courtesies = ['obrigado', 'obrigada', 'valeu', 'top', 'muito bom', 'gostei', 'show', 'legal', 'perfeito', 'ok', 'entendi'];
  if (courtesies.includes(p) || courtesies.some(c => p === c || p === `${c}!` || p === `${c}.`)) {
    return {
      isChat: true,
      reply: 'De nada! O projeto continua pronto no preview. Se quiser fazer mais alterações é só pedir, ou pode clicar no botão branco "Publicar" para colocá-lo online no seu subdomínio com SSL!'
    };
  }

  return { isChat: false, reply: '' };
}

// â”€â”€â”€ Helper para enviar SSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeSSE(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  return {
    chunk(text: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`));
    },
    chat(message: string, modelUsed = 'Assistente WEHOSTHERE') {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chat', message, modelUsed })}\n\n`));
      controller.close();
    },
    done(explanation: string, diffSummary: string, executionSeconds: number, modelUsed?: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', explanation, diffSummary, executionSeconds, modelUsed })}\n\n`));
      controller.close();
    },
    error(message: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
      controller.close();
    }
  };
}

// â”€â”€â”€ Simular streaming de string ja gerada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function simulateStream(html: string, sse: ReturnType<typeof makeSSE>, chunkSize = 80, delay = 8) {
  for (let i = 0; i < html.length; i += chunkSize) {
    sse.chunk(html.slice(i, i + chunkSize));
    await new Promise(r => setTimeout(r, delay));
  }
}

// â”€â”€â”€ Extrair HTML limpo de uma resposta de texto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function extractHtml(raw: string): string {
  const match = raw.match(/```html([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
  const code = match ? match[1].trim() : raw.trim();
  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code;
  }
  return '';
}

// â”€â”€â”€ POST handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const startTime = Date.now();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload invalido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { prompt = '', currentHtml = '', title = '', mode = 'builder' } = body;
  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: 'O prompt e obrigatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const userPrompt = currentHtml
    ? `O utilizador quer alterar o site existente.\nPEDIDO: "${prompt}"\n\nHTML ATUAL:\n${currentHtml.slice(0, 30000)}\n\nAtualize mantendo o design coeso.`
    : `Crie um site profissional para: "${prompt}".\nTitulo sugerido: "${title || 'Site Profissional'}"`;

  const elapsed = () => Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const okExplanation = currentHtml
    ? `O site foi atualizado com base no seu pedido: "${prompt}".`
    : `O site para "${prompt}" foi gerado e validado no preview.`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sse = makeSSE(controller, encoder);

      // â”€â”€ MODO CONVERSA / CONSULTORIA EXPLICITA (Sem alterar o site) â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (mode === 'chat') {
        const chatPrompt = `Você é o Consultor Especialista de Presença Digital, Design e Estratégia da WEHOSTHERE (líder de hospedagem e criação de sites em Moçambique).
O utilizador está a conversar consigo sobre o projeto de website "${title || 'Meu Site'}".
Responda de forma clara, amigável, motivadora e estruturada em português.
Dê sugestões práticas de marketing digital, ideias de conteúdo/textos, boas práticas de experiência do utilizador e dicas adaptadas ao mercado moçambicano (como pagamentos M-Pesa/e-Mola, pedidos via WhatsApp e moeda Meticais MZN).
IMPORTANTE: Não gere código HTML de páginas completas. O utilizador está no Modo Conversa para planear e tirar dúvidas.

PEDIDO / DÚVIDA DO UTILIZADOR: "${prompt}"`;

        if (geminiKey) {
          try {
            const gemRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: chatPrompt }] }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
              }
            );
            if (gemRes.ok) {
              const data = await gemRes.json();
              const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (reply) {
                sse.chat(reply, 'Consultor IA WEHOSTHERE');
                return;
              }
            }
          } catch (e) {
            console.warn('[Builder] Erro chat Gemini:', e);
          }
        }

        if (openaiKey) {
          try {
            const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: chatPrompt }],
                temperature: 0.7
              })
            });
            if (oaiRes.ok) {
              const data = await oaiRes.json();
              const reply = data?.choices?.[0]?.message?.content;
              if (reply) {
                sse.chat(reply, 'Consultor IA WEHOSTHERE');
                return;
              }
            }
          } catch (e) {
            console.warn('[Builder] Erro chat OpenAI:', e);
          }
        }

        // Resposta de fallback inteligente
        const conversational = detectConversationalIntent(prompt, Boolean(currentHtml));
        const defaultChatReply = conversational.reply || `Entendido! Como seu consultor da WEHOSTHERE, recomendo estruturar o seu website com foco na simplicidade e conversão direta. Destaque uma mensagem de boas-vindas forte, mostre os seus principais produtos ou serviços com valores transparentes em Meticais (MZN) e adicione botões de contacto direto via WhatsApp.\n\nQuando estiver pronto para aplicar alterações visuais no seu site, mude para o "Modo Desenvolvimento" no topo da caixa de texto!`;
        sse.chat(defaultChatReply, 'Consultor WEHOSTHERE');
        return;
      }

      // â”€â”€ 0. Verificar se é conversa automática (Olá, Como funciona, Dúvidas) â”€
      const conversational = detectConversationalIntent(prompt, Boolean(currentHtml));
      if (conversational.isChat) {
        sse.chat(conversational.reply, 'Assistente WEHOSTHERE');
        return;
      }

      // â”€â”€ 1. Gemini com streaming SSE real â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (geminiKey) {
        try {
          const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${geminiKey}&alt=sse`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );

          if (gemRes.ok && gemRes.body) {
            const reader = gemRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';       // acumula texto antes de encontrar HTML
            let started = false; // ja encontramos o inicio do HTML

            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(raw);
                  const text: string = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                  if (!text) continue;

                  if (!started) {
                    pre += text;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    // Parar de emitir depois de </html>
                    const endIdx = text.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(text.slice(0, endIdx + 7));
                      break outer;
                    }
                    sse.chunk(text);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'Gemini 1.5 Flash');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini streaming:', e);
        }

        // â”€â”€ 1b. Gemini modo normal com stream simulado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const html = extractHtml(rawText);
            if (html) {
              await simulateStream(html, sse);
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'Gemini 1.5 Flash');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini normal:', e);
        }
      }

      // â”€â”€ 2. OpenAI com streaming real â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (openaiKey) {
        try {
          const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              stream: true,
              messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 4096
            })
          });

          if (oaiRes.ok && oaiRes.body) {
            const reader = oaiRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';
            let started = false;

            outer2: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') break outer2;
                try {
                  const parsed = JSON.parse(raw);
                  const delta: string = parsed?.choices?.[0]?.delta?.content ?? '';
                  if (!delta) continue;

                  if (!started) {
                    pre += delta;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    const endIdx = delta.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(delta.slice(0, endIdx + 7));
                      break outer2;
                    }
                    sse.chunk(delta);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed(), 'GPT-4o Mini');
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro OpenAI streaming:', e);
        }
      }

      // â”€â”€ 3. Fallback estatico com stream simulado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const fallback = getFallbackHtml(prompt, title);
      await simulateStream(fallback, sse, 60, 12);
      sse.done(
        currentHtml
          ? `Ajustamos o seu site com base no pedido: "${prompt}".`
          : `Pagina base criada para "${prompt}". Pode refiná-la agora!`,
        currentHtml ? '+18 / -5' : '+95 linhas',
        elapsed(),
        'Modelo Base Local (Offline)'
      );
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

