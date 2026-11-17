'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Server,
  Layout,
  Cpu,
  GraduationCap,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  BadgePercent,
} from 'lucide-react';
import { DOMAIN_PRICES } from '@/lib/domains';
import { hostingPlans, websiteTypes } from '@/lib/data';
import { auth } from '@/lib/auth';
import { useCurrency } from '@/context/CurrencyContext';

const COMMISSION_RATE = 0.3;

const VPS_PLANS = [
  { name: 'VPS Basic', price: 2500, specs: '1 vCPU · 2 GB RAM · 40 GB NVMe · IP Dedicado' },
  { name: 'VPS Pro', price: 5000, specs: '2 vCPU · 4 GB RAM · 80 GB NVMe · IP Dedicado' },
  { name: 'VPS Enterprise', price: 10000, specs: '4 vCPU · 8 GB RAM · 160 GB NVMe · IP Dedicado' },
];

export default function AffiliateServicesGuidePage() {
  const { formatPrice } = useCurrency();
  const [affiliateLink, setAffiliateLink] = useState('https://www.wehosthere.com/?ref=SEU_CODIGO');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user?.id) return;
    fetch(`/api/affiliates/dashboard?userId=${encodeURIComponent(user.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.affiliate?.affiliateLink) {
          setAffiliateLink(data.affiliate.affiliateLink);
        } else if (data?.affiliate?.affiliateCode) {
          setAffiliateLink(`https://www.wehosthere.com/?ref=${data.affiliate.affiliateCode}`);
        }
      })
      .catch(() => {});
  }, []);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const formatCommission = (amount: number) =>
    formatPrice(Math.round(amount * COMMISSION_RATE));

  const pitchScripts = [
    {
      id: 'pitch-domain',
      title: 'Para empresas que ainda usam @gmail.com',
      text: `Olá! Sabia que pode ter um domínio .co.mz ou .com e e-mail profissional com o nome da sua empresa (ex: info@suaempresa.co.mz) com ativação rápida e pagamento via M-Pesa ou Cartão? Veja aqui os planos na WEHOSTHERE: ${affiliateLink}`,
    },
    {
      id: 'pitch-site',
      title: 'Para negócios que precisam de Website ou Loja Online',
      text: `Se precisa de um site profissional ou loja online com integração M-Pesa em Moçambique, recomendo a WEHOSTHERE. Pode simular o orçamento online em minutos aqui: ${affiliateLink}`,
    },
    {
      id: 'pitch-hosting',
      title: 'Para programadores e agências (Hospedagem & VPS)',
      text: `Para alojar sites WordPress, sistemas ou lojas com SSL gratuito, cPanel e pagamento local em MT, uso a WEHOSTHERE. Confira os planos aqui: ${affiliateLink}`,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Topo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/affiliates"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-950 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel de Afiliados</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 text-white text-xs font-bold">
            <BadgePercent className="w-3.5 h-3.5" />
            <span>30% de Comissão em Tudo</span>
          </span>
        </div>

        {/* Hero / Link do Afiliado */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              Guia de Serviços, Preços &amp; Comissões
            </h1>
            <p className="text-sm text-neutral-600 max-w-2xl">
              Conheça todos os produtos da <strong>WEHOSTHERE</strong>, os preços oficiais em Meticais e exatamente quanto você ganha (<strong>30%</strong>) por cada venda confirmada através do seu link.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 block">
                O seu link de divulgação
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-neutral-900 truncate block">
                {affiliateLink}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyText('main-link', affiliateLink)}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-full inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition"
            >
              {copiedId === 'main-link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'main-link' ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* 1. Domínios */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-950">1. Registo de Domínios (Anual)</h2>
              <p className="text-xs text-neutral-500">Para empresas, lojas, ONG&apos;s e profissionais que querem presença própria online.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DOMAIN_PRICES.map((d) => (
              <div key={d.extension} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-neutral-950 font-mono">{d.extension}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600">
                    {d.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Preço: <strong className="text-neutral-900">{formatPrice(d.price)}/ano</strong>
                </p>
                <p className="text-xs font-extrabold text-emerald-700">
                  Sua comissão: +{formatCommission(d.price)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Hospedagem & E-mail Corporativo */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-950">2. Hospedagem Web &amp; E-mail Corporativo</h2>
              <p className="text-xs text-neutral-500">Inclui cPanel, SSL gratuito, contas de e-mail profissionais e suporte 24/7.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hostingPlans
              .filter((p) => p.id !== 'website_creation')
              .map((plan) => (
                <div key={plan.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-neutral-950">{plan.name}</h3>
                    <p className="text-xs text-neutral-600">
                      {plan.features.sites === -1 ? 'Sites ilimitados' : `${plan.features.sites} site(s)`} ·{' '}
                      {plan.features.emails === -1 ? 'E-mails ilimitados' : `${plan.features.emails} e-mails`} ·{' '}
                      {plan.features.storage}GB SSD
                    </p>
                  </div>
                  <div className="space-y-1 text-xs border-t border-neutral-200 pt-2.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Mensal:</span>
                      <span className="font-bold text-neutral-900">{formatPrice(plan.price)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Comissão (Mensal):</span>
                      <span>+{formatCommission(plan.price)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-neutral-500">Anual:</span>
                      <span className="font-bold text-neutral-900">{formatPrice(plan.priceAnnual)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-extrabold">
                      <span>Comissão (Anual):</span>
                      <span>+{formatCommission(plan.priceAnnual)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* 3. Criação de Sites */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-950">3. Desenvolvimento de Websites &amp; Lojas</h2>
              <p className="text-xs text-neutral-500">Maiores comissões por venda — ideal para empresas, lojas, clínicas e instituições.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {websiteTypes.map((wt) => (
              <div key={wt.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-neutral-950">{wt.name}</h3>
                  <p className="text-xs text-neutral-500">
                    Preço base: <strong className="text-neutral-800">{formatPrice(wt.basePrice)}</strong> · {wt.deliveryDays} dias úteis
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 block">Comissão 30%</span>
                  <span className="text-sm font-black text-emerald-700">+{formatCommission(wt.basePrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. VPS & Academia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-neutral-950">4. Servidores VPS</h2>
            </div>
            <div className="space-y-2">
              {VPS_PLANS.map((v) => (
                <div key={v.name} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <strong className="text-neutral-950 block">{v.name}</strong>
                    <span className="text-neutral-500 text-[11px]">{v.specs}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-bold text-neutral-900">{formatPrice(v.price)}/mês</span>
                    <span className="font-extrabold text-emerald-700">+{formatCommission(v.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-base font-extrabold text-neutral-950">5. Academia &amp; Cursos</h2>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cada aluno que se inscrever e confirmar o pagamento em qualquer curso da <strong>Academia WEHOSTHERE</strong> pelo seu link também gera <strong>30% de comissão</strong> automaticamente.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-neutral-950">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Regras de Saque</span>
              </div>
              <p>Comissões ficam disponíveis após confirmação do pagamento. Saque mínimo de <strong>{formatPrice(1000)}</strong> via M-Pesa ou conversão em saldo na plataforma.</p>
            </div>
          </section>
        </div>

        {/* 6. Mensagens prontas */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-950">Mensagens Prontas para Partilhar</h2>
              <p className="text-xs text-neutral-500">Copie e envie no WhatsApp, Instagram ou LinkedIn já com o seu link incluído.</p>
            </div>
          </div>

          <div className="space-y-3">
            {pitchScripts.map((script) => (
              <div key={script.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-neutral-900">{script.title}</span>
                  <button
                    type="button"
                    onClick={() => copyText(script.id, script.text)}
                    className="px-3 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    {copiedId === script.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === script.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{script.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
