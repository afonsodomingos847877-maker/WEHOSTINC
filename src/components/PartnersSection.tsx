'use client';

import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { dataManager, Partner } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import ScrollRevealHeading from '@/components/ScrollRevealHeading';

export default function PartnersSection() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const fetchedPartners = await dataManager.fetchPartnersAsync();
        const activePartners = (fetchedPartners || [])
          .filter(p => p.active)
          .sort((a, b) => a.order - b.order);
        setPartners(activePartners);
      } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
        const localPartners = dataManager.getActivePartners();
        setPartners(localPartners);
      } finally {
        setLoading(false);
      }
    };
    loadPartners();
  }, []);

  const handleImageError = (partnerId: string) => {
    setFailedLogos(prev => ({ ...prev, [partnerId]: true }));
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 mt-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-12">
            <ScrollRevealHeading
              text={t('partners.title')}
              subtitle={t('partners.subtitle')}
              align="center"
              showAccentLine={true}
              titleClassName="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900"
              subtitleClassName="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto"
              highlightWords={['Confiança', 'Infraestruturas', 'Tecnologias', 'Trusted', 'Infrastructure']}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <ScrollRevealHeading
            text={t('partners.title')}
            subtitle={t('partners.subtitle')}
            align="center"
            showAccentLine={true}
            titleClassName="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900"
            subtitleClassName="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto"
            highlightWords={['Confiança', 'Infraestruturas', 'Tecnologias', 'Trusted', 'Infrastructure']}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
          {partners.map((partner) => {
            const hasFailed = failedLogos[partner.id] || !partner.logoUrl;
            const content = (
              <div className="w-full h-20 sm:h-24 flex flex-col items-center justify-center bg-white rounded-lg overflow-hidden p-2 shadow-sm border border-gray-100 group-hover:border-blue-200 transition">
                {!hasFailed ? (
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition duration-300"
                    onError={() => handleImageError(partner.id)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );

            return (
              <div
                key={partner.id}
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
              >
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                    title={partner.name}
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
                <p className="text-xs text-gray-700 font-semibold mt-2 text-center truncate w-full">
                  {partner.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
