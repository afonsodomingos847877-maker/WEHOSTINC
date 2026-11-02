'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Server, ShieldCheck, Lock, Check, CreditCard, 
  Smartphone, Bitcoin, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, XCircle,
  Landmark, Paperclip, FileText, Image as ImageIcon, Upload, Loader2, Lock as LockIcon,
  Globe, MessageCircle, Copy, ArrowRight, User, Mail, Edit3, Sparkles, Clock
} from 'lucide-react';
import { hostingPlans, HostingPlan, dataManager } from '@/lib/data';
import { auth } from '@/lib/auth';
import { getDomainPrice, sanitizeDomainName } from '@/lib/domains';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';
import { apiEndpoint } from '@/lib/siteConfig';
import { soundEffects } from '@/lib/soundEffects';
import FacebookPixel from '@/lib/facebookPixel';
import { useTranslation, getLanguage, setLanguage, Language } from '@/lib/i18n';
import { useAnalytics } from '@/lib/analytics';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguageState] = useState<Language>('pt');
  const t = useTranslation('pt');
  const analytics = useAnalytics();
  const rawPlanId = searchParams.get('plan');
  const planIdParam = rawPlanId === 'none' ? 'none' : (rawPlanId || 'pro');
  const domainParam = searchParams.get('domain');
  const domainPriceParam = searchParams.get('domainPrice');
  const siteTypeParam = searchParams.get('siteType');
  const siteTypeName = searchParams.get('siteTypeName');
  const siteTypePrice = searchParams.get('siteTypePrice');
  
  // Parâmetros para verificação de afiliado
  const serviceParam = searchParams.get('service');
  const isAffiliateVerification = serviceParam === 'affiliate_verification';
  const verificationAmount = Number(searchParams.get('amount')) || 2;
  const affiliateUserIdParam = searchParams.get('userId');

  // Parâmetros para pagamento de curso
  const isCoursePayment = serviceParam === 'course';
  const courseIdParam = searchParams.get('courseId');
  const courseNameParam = searchParams.get('name');
  const [courseClaimToken, setCourseClaimToken] = useState<string>('');
  const courseAmountParam = Number(searchParams.get('amount')) || 500;

  // Parâmetro para continuar pagamento de encomenda existente
  const continuePaymentParam = searchParams.get('continuePayment');

  const domainCost = domainParam 
    ? (domainPriceParam ? Number(domainPriceParam) : getDomainPrice(sanitizeDomainName(domainParam).extension))
    : 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(planIdParam);

  const selectedPlan = hostingPlans.find(p => p.id === selectedPlanId) || null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ddi, setDdi] = useState('+258');
  const [whatsapp, setWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'bank_transfer'>('mpesa');
  
  // Phone for M-Pesa / eMola push payment
  const [phonePayment, setPhonePayment] = useState('');
  // Phone for affiliate commission payments
  const [affiliatePhone, setAffiliatePhone] = useState('');
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Comprovativo de Pagamento Bancário
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  // Estado para copiar Nameservers
  const [copiedNs, setCopiedNs] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNs(text);
      setTimeout(() => setCopiedNs(null), 2500);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingProof(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/upload'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setProofUrl(data.url);
          setProofName(data.name || file.name);
        }
      }
    } catch (err) {
      console.error('Erro no upload do comprovativo:', err);
    } finally {
      setUploadingProof(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shakeBtn, setShakeBtn] = useState(false);
  const [orderWithoutPayment, setOrderWithoutPayment] = useState(false);

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const errors: Record<string, string> = {};

    if (isAffiliateVerification) {
      if (!name.trim()) errors.name = t.nameRequired || 'Nome completo é obrigatório.';
      if (!email.trim() || !email.includes('@')) errors.email = t.emailRequired || 'E-mail válido é obrigatório.';
      if (!affiliatePhone.trim()) errors.affiliatePhone = t.affiliatePhoneRequired || 'Número de telefone é obrigatório.';
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setShakeBtn(true);
        setTimeout(() => setShakeBtn(false), 600);
        return;
      }
      setPhonePayment(affiliatePhone);
    } else {
      if (!name.trim()) { errors.name = t.nameRequired || 'Nome completo é obrigatório.'; analytics.trackFormError('name', 'Name required'); }
      if (!email.trim() || !email.includes('@')) { errors.email = t.emailRequired || 'E-mail válido é obrigatório.'; analytics.trackFormError('email', 'Invalid email'); }
      if (!isCoursePayment && !isAffiliateVerification && !whatsapp.trim()) { errors.whatsapp = t.whatsappRequired || 'Número de WhatsApp é obrigatório.'; analytics.trackFormError('whatsapp', 'WhatsApp required'); }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setShakeBtn(true);
        setTimeout(() => setShakeBtn(false), 600);
        return;
      }
      if (!phonePayment && whatsapp.trim()) setPhonePayment(whatsapp.trim());
    }

    // Capturar Lead Imediato no Início do Checkout para Recuperação
    if (isCoursePayment && email && name) {
      const leadOrderId = 'LEAD_' + Date.now().toString().slice(-6);
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: leadOrderId,
            clientName: name,
            clientEmail: email.toLowerCase().trim(),
            clientPhone: `${ddi} ${phonePayment || whatsapp}`,
            serviceName: `Curso: ${courseNameParam || 'Curso WEHOSTHERE'}`,
            amount: courseAmountParam,
            paymentMethod: paymentMethod || 'mpesa',
            status: 'pending'
          }
        })
      }).catch(() => {});
    }

    setFieldErrors({});
    setCheckoutStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const cycleParam = searchParams.get('billingCycle');
  const [durationMonths, setDurationMonths] = useState<number>(cycleParam === 'annual' ? 12 : 1);

  useEffect(() => {
    if (planIdParam) {
      setSelectedPlanId(planIdParam);
    }
  }, [planIdParam]);

  const calculatePlanCost = () => {
    if (isCoursePayment) {
      return courseAmountParam;
    }
    if (isAffiliateVerification) {
      return verificationAmount;
    }
    if (!selectedPlan) return 0;
    if (selectedPlan.id === 'website_creation') {
      return siteTypePrice ? Number(siteTypePrice) : selectedPlan.price;
    }
    if (durationMonths === 12) {
      return selectedPlan.priceAnnual;
    } else if (durationMonths === 6) {
      return Math.round(selectedPlan.price * 6 * 0.90);
    } else if (durationMonths === 3) {
      return Math.round(selectedPlan.price * 3 * 0.95);
    }
    return selectedPlan.price * durationMonths;
  };

  const basePrice = calculatePlanCost();
  const grandTotal = isCoursePayment 
    ? courseAmountParam 
    : (isAffiliateVerification ? verificationAmount : (basePrice + domainCost));

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      analytics.setUserId(user.id);
    }
    
    // Track page view
    const serviceType = isCoursePayment ? 'course' : (isAffiliateVerification ? 'affiliate' : 'hosting');
    analytics.trackCheckoutView(serviceType, grandTotal);
    
    // Rastrear InitiateCheckout quando o usuário entra na página de checkout
    if (selectedPlan) {
      const isWebsite = selectedPlan.id === 'website_creation';
      const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
      const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
      const serviceName = selectedPlan
        ? (domainParam 
            ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
            : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
        : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;
      
      FacebookPixel.trackInitiateCheckout({
        content_ids: [selectedPlan.id],
        content_name: serviceName,
        content_category: 'Hospedagem e Serviços Web',
        value: grandTotal,
        currency: 'MZN'
      });
    }
  }, [analytics, domainParam, grandTotal, isAffiliateVerification, isCoursePayment, selectedPlan, siteTypeName, durationMonths]);

  // Carregar dados de encomenda existente se continuePayment estiver presente
  useEffect(() => {
    if (continuePaymentParam) {
      const loadExistingOrder = async () => {
        try {
          const response = await fetch(apiEndpoint(`/api/orders?orderId=${continuePaymentParam}`));
          const data = await response.json();
          
          if (data.success && data.order) {
            const order = data.order;
            setName(order.clientName || '');
            setEmail(order.clientEmail || '');
            setPhonePayment(order.clientPhone || '');
            setWhatsapp(order.clientPhone || '');
            
            // Mostrar notificação de que estamos continuando o pagamento
            setError(`Continuando pagamento da encomenda ${order.id}. Complete o processo de pagamento para ativar o serviço.`);
            
            setTimeout(() => setError(''), 5000);
          }
        } catch (err) {
          console.error('[Checkout] Erro ao carregar encomenda existente:', err);
        }
      };
      
      loadExistingOrder();
    }
  }, [continuePaymentParam]);

  // Facebook Pixel tracking
  useEffect(() => {
    if (analytics && selectedPlan && !isCoursePayment && !isAffiliateVerification) {
      const siteLabel = siteTypeName ? ` (${siteTypeName})` : '';
      const cycleLabel = durationMonths === 12 ? ' (Anual)' : ' (Mensal)';
      
      const serviceName = selectedPlan
        ? (domainParam 
            ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
            : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
        : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;
      
      FacebookPixel.trackInitiateCheckout({
        content_ids: [selectedPlan.id],
        content_name: serviceName,
        content_category: 'Hospedagem e Serviços Web',
        value: grandTotal,
        currency: 'MZN'
      });
    }
  }, [analytics, domainParam, grandTotal, isAffiliateVerification, isCoursePayment, selectedPlan, siteTypeName]);

  const [pushModal, setPushModal] = useState(false);
  const [pushStatus, setPushStatus] = useState<'initiating' | 'waiting' | 'expired' | 'failed' | 'cancelled'>('waiting');
  const [pushFailureReason, setPushFailureReason] = useState<string>('');
  const [countdown, setCountdown] = useState(60); // Aumentado de 45 para 60 segundos
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Contador de tentativas de retry

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pushModal && pushStatus === 'waiting' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (pushModal && pushStatus === 'waiting' && countdown === 0) {
      setPushStatus('expired');
      setIsPollingPayment(false);
      setLoading(false);
      
      // Disparar e-mail automático de notificação de tempo expirado ao cliente
      if (email) {
        fetch(apiEndpoint('/api/payments/mpesa/timeout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: email,
            clientName: name,
            amount: grandTotal,
            orderRef: `ORD-${Date.now().toString().slice(-5)}`
          })
        }).catch(err => console.warn('Erro ao notificar timeout M-Pesa por e-mail:', err));
      }
    }
    return () => clearInterval(timer);
  }, [pushModal, pushStatus, countdown, email, name, grandTotal]);

  // 🔒 ACESSIBILIDADE: Suporte a teclado para fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pushModal) {
        setPushModal(false);
        setIsPollingPayment(false);
        setLoading(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pushModal]);

  // 🔒 SEGURANÇA: Polling de status de pagamento - verificar confirmação do webhook
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let stopped = false; // 🔧 Flag para evitar race condition no primeiro poll imediato

    if (isPollingPayment && currentReference) {
      console.log('[PAYMENT POLLING] Iniciando verificação de status para reference:', currentReference);
      
      // Exponential backoff: começa com 5s, aumenta gradualmente
      const getPollingInterval = (attempt: number) => {
        return Math.min(5000 * Math.pow(1.5, attempt), 15000); // Max 15s
      };
      
      let attempt = 0;
      
      const pollWithRetry = async () => {
        try {
          const response = await fetch(apiEndpoint(`/api/payments/status?reference=${encodeURIComponent(currentReference)}`));
          const data = await response.json();
          
          console.log('[PAYMENT POLLING] Status:', data.status, 'Attempt:', attempt + 1);
          
          if (data.status === 'completed') {
            console.log('[PAYMENT POLLING] Pagamento confirmado pelo webhook!');
            stopped = true;
            clearInterval(pollingInterval);
            setIsPollingPayment(false);
            setPushModal(false);
            setRetryCount(0);
            
            // Track successful payment
            const serviceType = isCoursePayment ? 'course' : (isAffiliateVerification ? 'affiliate' : 'hosting');
            analytics.trackPaymentCompleted(paymentMethod, grandTotal, currentReference || '');
            analytics.trackConversion(serviceType, grandTotal);

            // 📊 Evento GTM — compra concluída (ecommerce)
            if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
              (window as any).dataLayer.push({
                event: 'purchase',
                transaction_id: currentReference || `TXN-${Date.now()}`,
                value: grandTotal,
                currency: 'MZN',
                payment_method: paymentMethod,
                service_type: serviceType,
                domain: domainParam || undefined,
              });
            }

            // 🔗 Atualizar status do lead de domínio para completed
            if (domainParam) {
              fetch(apiEndpoint('/api/admin/domain-search-logs'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  domain: domainParam,
                  userName: name,
                  userEmail: email,
                  userPhone: phonePayment || whatsapp,
                  checkoutStatus: 'completed',
                  checkoutOrderId: currentReference || undefined
                })
              }).catch(() => {});
            }
            
            // Criar pedido com status completed e finalizar
            await finalizeOrder();
          } else if (data.status === 'cancelled' || data.status === 'failed') {
            console.log('[PAYMENT POLLING] Pagamento falhou/cancelado:', data.failureReason);
            stopped = true;
            clearInterval(pollingInterval);
            setIsPollingPayment(false);
            setLoading(false);
            setPushStatus(data.status === 'cancelled' ? 'cancelled' : 'failed');
            setPushFailureReason(data.failureReason || 'PIN incorreto, saldo insuficiente ou cancelado no telemóvel');
            setRetryCount(0);
            setError(data.failureReason || 'Pagamento não foi confirmado. Por favor, tente novamente.');
          } else {
            // Continua polling com exponential backoff
            attempt++;
            const nextInterval = getPollingInterval(attempt);
            console.log('[PAYMENT POLLING] Próxima verificação em', nextInterval/1000, 'segundos');
            
            clearInterval(pollingInterval);
            if (!stopped) {
              pollingInterval = setInterval(pollWithRetry, nextInterval);
            }
          }
        } catch (err) {
          console.error('[PAYMENT POLLING] Erro ao verificar status:', err);
          attempt++;
          
          // Retry automático até 3 tentativas
          if (attempt < 3) {
            const nextInterval = getPollingInterval(attempt);
            console.log('[PAYMENT POLLING] Retry', attempt, 'em', nextInterval/1000, 'segundos');
            
            clearInterval(pollingInterval);
            if (!stopped) {
              pollingInterval = setInterval(pollWithRetry, nextInterval);
            }
          } else {
            console.error('[PAYMENT POLLING] Máximo de retries atingido');
            stopped = true;
            clearInterval(pollingInterval);
            setIsPollingPayment(false);
            setLoading(false); // 🔧 CORREÇÃO: desbloquear botão após máximo de retries
            setPushStatus('expired');
            setRetryCount(0);
            setError('Erro de conexão. Verifique sua internet e tente novamente.');
          }
        }
      };
      
      // Iniciar polling — primeira verificação imediata, depois de 5s em diante
      pollWithRetry().then(() => {
        // Só inicia o intervalo se o primeiro poll não resolveu o pagamento
        if (!stopped) {
          pollingInterval = setInterval(pollWithRetry, 5000);
        }
      });
      
      // Parar polling após 3 minutos (timeout aumentado)
      const timeout = setTimeout(() => {
        clearInterval(pollingInterval);
        stopped = true;
        setIsPollingPayment(false);
        setLoading(false); // 🔧 CORREÇÃO: desbloquear botão após timeout
        setPushStatus('expired');
        setRetryCount(0);
        setError('Tempo de verificação expirado. Se você pagou, aguarde o e-mail de confirmação.');
      }, 180000); // 3 minutos
      
      return () => {
        stopped = true;
        clearInterval(pollingInterval);
        clearTimeout(timeout);
      };
    }
  }, [isPollingPayment, currentReference, analytics, grandTotal, isAffiliateVerification, isCoursePayment, paymentMethod]);


  const handleRetryPush = async () => {
    setPushStatus('initiating');
    setPushFailureReason('');
    setRetryCount(prev => prev + 1);
    
    const phone = isAffiliateVerification 
      ? affiliatePhone 
      : (phonePayment || whatsapp);
    
    const isWebsite = selectedPlan?.id === 'website_creation';
    const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
    const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
    const retryServiceName = isCoursePayment
      ? `Curso: ${courseNameParam || 'Curso WEHOSTHERE'}`
      : isAffiliateVerification
      ? 'Verificação de Afiliado'
      : selectedPlan
      ? (domainParam 
          ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
          : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
      : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;

    const newPaymentRef = `REF_${Date.now().toString().slice(-6)}`;
    setCurrentReference(newPaymentRef);

    const retryApiUrl = paymentMethod === 'mpesa' 
      ? '/api/payments/mpesa/c2b'
      : '/api/payments/emola/c2b';

    try {
      const response = await fetch(apiEndpoint(retryApiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn: phone,
          amount: grandTotal,
          reference: newPaymentRef,
          thirdPartyReference: `ORDER_${Date.now().toString().slice(-6)}`,
          clientName: name,
          clientEmail: email,
          serviceName: retryServiceName
        })
      });
      
      const data = await response.json();
      console.log('[PUSH RETRY] Nova solicitação enviada:', data);
      
      if (response.ok) {
        setCountdown(60);
        setPushStatus('waiting');
        setIsPollingPayment(true);
      } else {
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }
    } catch (err) {
      console.error('[PUSH RETRY] Erro ao retry:', err);
      
      // Mensagens de erro específicas
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      if (errorMessage.includes('saldo') || errorMessage.includes('insufficient')) {
        setError(t.insufficientBalance);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        setError(t.connectionError);
      } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
        setError(t.invalidPhone);
      } else {
        setError(`${t.paymentError}: ${errorMessage}. ${t.tryAgain}`);
      }
      
      setPushStatus('expired');
    }
  };

  const [checkoutAccountStatus, setCheckoutAccountStatus] = useState<'logged_in' | 'account_exists' | 'no_account'>('logged_in');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [currentOrderData, setCurrentOrderData] = useState<ReceiptData | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  // Rastrear visita ao checkout com código de afiliado
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const code = getCookie('affiliate_code');
    if (code) {
      setAffiliateCode(code);
      console.log('[Checkout] Código de afiliado detectado:', code);
      
      // Registrar visita ao checkout
      fetch('/api/affiliates/checkout-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateCode: code })
      }).catch(err => console.error('[Checkout] Erro ao registrar visita ao checkout:', err));
    }

    // Rastrear cancelamento de checkout (quando usuário sai da página)
    const handleBeforeUnload = () => {
      if (code && !success) {
        fetch('/api/affiliates/checkout-abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affiliateCode: code })
        }).catch(err => console.error('[Checkout] Erro ao registrar abandono de checkout:', err));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [success]);

  const finalizeOrder = async (paymentAlreadyConfirmed = false) => {
    console.log('[Checkout] Iniciando processamento de pedido');
    console.log('[Checkout] Método de pagamento:', paymentMethod);
    console.log('[Checkout] Valor total:', grandTotal);
    console.log('[Checkout] É verificação de afiliado:', isAffiliateVerification);
    console.log('[Checkout] Plano selecionado:', selectedPlan?.name);
    console.log('[Checkout] Duração:', durationMonths, 'meses');
    console.log('[Checkout] Domínio:', domainParam);
    console.log('[Checkout] Pagamento já confirmado pelo webhook:', paymentAlreadyConfirmed);
    
    // Gerar referência única para este pagamento (se não foi confirmado pelo webhook)
    const paymentReference = paymentAlreadyConfirmed && currentReference 
      ? currentReference 
      : `REF_${Date.now().toString().slice(-6)}`;
    
    try {
      const currentUser = auth.getCurrentUser();
      let accountStatus: 'logged_in' | 'account_exists' | 'no_account' = 'logged_in';

      if (currentUser) {
        if (selectedPlan && selectedPlan.id !== 'website_creation') {
          auth.updatePlan(currentUser.id, selectedPlan.id as 'basic' | 'pro' | 'enterprise');
        }
        accountStatus = 'logged_in';
      } else {
        const allUsers = auth.getUsers();
        const existingUser = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (existingUser) {
          accountStatus = 'account_exists';
        } else {
          accountStatus = 'no_account';
        }
      }

      console.log('[Checkout] Status da conta:', accountStatus);
      setCheckoutAccountStatus(accountStatus);

      const isWebsite = selectedPlan?.id === 'website_creation';
      const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
      const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
      const serviceName = isCoursePayment
        ? `Curso: ${courseNameParam || 'Curso WEHOSTHERE'}`
        : isAffiliateVerification 
        ? 'Verificação de Afiliado'
        : (selectedPlan
            ? (domainParam 
                ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
                : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
            : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`);

      const orderId = `ORD-${Date.now().toString().slice(-5)}`;
      // 🔒 SEGURANÇA: Se confirmado pelo webhook, usar 'completed', senão usar status apropriado
      // Se orderWithoutPayment é true, usar 'pending' (encomenda sem pagamento)
      const orderStatus = orderWithoutPayment
        ? 'pending'
        : (paymentAlreadyConfirmed 
          ? 'completed'
          : (paymentMethod === 'bank_transfer' || paymentMethod === 'card' || (selectedPlan && selectedPlan.id === 'website_creation')) ? 'in_progress' : 'pending');
      
      // Salvar orderId e reference para polling
      setCurrentOrderId(orderId);
      setCurrentReference(paymentReference);

      // Se for verificação de afiliado, registrar o afiliado após pagamento
      // O número de comissões = o mesmo número usado para pagar os 2 MZN (M-Pesa/eMola)
      if (isAffiliateVerification) {
        // Usar o número digitado pelo usuário
        const affiliatePhoneFinal = affiliatePhone;
        // Usar userId do parâmetro ou do usuário atual
        const userIdForAffiliate = affiliateUserIdParam || currentUser?.id;
        console.log('[Checkout] Registrando/Atualizando afiliado com telefone digitado:', affiliatePhoneFinal, 'userId:', userIdForAffiliate);
        
        try {
          const affiliateResponse = await fetch('/api/affiliates/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userIdForAffiliate,
              phone: affiliatePhoneFinal,
              verificationPayment: true,
              paymentReference
            })
          });
          
          const affiliateData = await affiliateResponse.json();
          console.log('[Checkout] Resposta do registro de afiliado:', affiliateData);
          
          if (!affiliateData.success) {
            console.error('[Checkout] Erro ao registrar afiliado:', affiliateData.error);
          }
        } catch (err) {
          console.error('[Checkout] Erro ao chamar API de registro de afiliado:', err);
        }
      }

      // Registra pedido de serviço para gestão no Admin (incluindo verificação de afiliado)
      const phoneFinal = isAffiliateVerification 
        ? `${ddi} ${affiliatePhone || phonePayment || whatsapp}`
        : `${ddi} ${phonePayment || whatsapp}`;

      dataManager.addOrder({
        clientName: name,
        clientEmail: email,
        clientPhone: phoneFinal,
        serviceName,
        amount: grandTotal,
        valorFaturado: orderStatus === 'completed' ? grandTotal : 0,
        valorPorFaturar: orderStatus === 'completed' ? 0 : grandTotal,
        paymentMethod: paymentMethod,
        proofUrl: proofUrl || undefined,
        proofName: proofName || undefined,
        status: orderStatus,
        reference: paymentReference // Usar a mesma referência gerada antes do pagamento
      });

      // Cadastra o domínio na lista de sites do cliente associado ao e-mail com status 'pending'
      if (domainParam) {
        await dataManager.addSiteAsync({
          name: domainParam,
          domain: domainParam,
          status: 'pending',
          storage: selectedPlan ? selectedPlan.features.storage : 10,
          bandwidth: 100,
          userEmail: email.trim().toLowerCase()
        });
      }

      setCurrentOrderData({
        id: orderId,
        clientName: name,
        clientEmail: email,
        clientPhone: phoneFinal,
        serviceName,
        amount: grandTotal,
        valorFaturado: orderStatus === 'completed' ? grandTotal : 0,
        valorPorFaturar: orderStatus === 'completed' ? 0 : grandTotal,
        paymentMethod: paymentMethod,
        status: orderStatus,
        createdAt: new Date().toISOString()
      });

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
      const subject = `🛒 Novo Pedido: ${name} - ${serviceName}`;
      const message = `Olá Administrador,\n\nNovo pedido recebido:\n\n• Cliente: ${name} (${email})\n• Telefone: ${ddi} ${phonePayment || whatsapp}\n• Serviço: ${serviceName}\n• Valor: ${grandTotal.toLocaleString('pt-MZ')} MZN\n• Método: ${paymentMethod}\n• Status: ${orderStatus}\n• Referência: ${paymentReference}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`;

      fetch(apiEndpoint('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          subject,
          text: message
        })
      }).catch(err => console.error('[Checkout] Erro ao notificar admin:', err));

      // Se for compra de curso, gerar matrícula imediata no backend com claimToken
      let generatedClaimToken = '';
      if (isCoursePayment || serviceParam === 'course' || serviceName.toLowerCase().includes('curso')) {
        try {
          const enrRes = await fetch('/api/academy/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'enroll',
              courseId: courseIdParam || 'course-landing-page',
              courseTitle: courseNameParam || serviceName,
              studentEmail: email.trim().toLowerCase(),
              studentName: name,
              studentPhone: phoneFinal,
              userId: currentUser?.id,
              orderId: orderId,
              paymentReference: paymentReference,
              amountPaid: grandTotal,
              paymentMethod: paymentMethod
            })
          });
          const enrData = await enrRes.json();
          if (enrData?.enrollment?.claimToken) {
            generatedClaimToken = enrData.enrollment.claimToken;
            setCourseClaimToken(generatedClaimToken);
          }
        } catch (enrErr) {
          console.warn('[Checkout] Erro ao registrar matrícula preliminar:', enrErr);
        }
      }

      // Se o pedido for de curso, enviar e-mail de confirmação de curso ao aluno
      if (serviceParam === 'course' || serviceName.toLowerCase().includes('curso')) {
        fetch(apiEndpoint('/api/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'course_purchase',
            to: email,
            userName: name,
            courseTitle: serviceName,
            amount: grandTotal,
            claimToken: generatedClaimToken
          })
        }).catch(err => console.error('[Checkout] Erro ao enviar email de curso:', err));
      }

      // Se o pagamento foi concluído, enviar e-mail com fatura oficial para o cliente
      if (orderStatus === 'completed') {
        fetch(apiEndpoint('/api/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'invoice',
            to: email,
            userName: name,
            invoiceRef: paymentReference,
            amount: grandTotal,
            plan: serviceName
          })
        }).catch(err => console.error('[Checkout] Erro ao enviar fatura ao cliente:', err));
      } else if (orderWithoutPayment) {
        // Se é encomenda sem pagamento, enviar email de encomenda pendente
        fetch(apiEndpoint('/api/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order-pending',
            to: email,
            userName: name,
            orderRef: orderId,
            amount: grandTotal,
            plan: serviceName
          })
        }).catch(err => console.error('[Checkout] Erro ao enviar email de encomenda pendente:', err));
      }

      setPushModal(false);
      setLoading(false);
      soundEffects.playPaymentSuccessSound();
      
      // Rastrear Purchase no Facebook Pixel
      FacebookPixel.trackPurchase({
        content_ids: selectedPlan ? [selectedPlan.id] : [],
        content_name: serviceName,
        content_category: 'Hospedagem e Serviços Web',
        value: grandTotal,
        currency: 'MZN',
        transaction_id: orderId
      });
      
      // 🔒 Apenas definir success se não for encomenda sem pagamento
      // O handleOrderWithoutPayment vai definir success separadamente
      if (!orderWithoutPayment) {
        setSuccess(true);
      }

      // Se for verificação de afiliado, redirecionar para dashboard de afiliados após sucesso
      if (isAffiliateVerification) {
        setTimeout(() => {
          router.push('/dashboard/affiliates');
        }, 2000);
      }

      // Atualizar conversão de afiliado se houver código
      if (affiliateCode) {
        console.log('[Checkout] Atualizando conversão de afiliado:', affiliateCode);
        fetch('/api/affiliates/conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateCode,
            orderId,
            amount: grandTotal,
            customerEmail: email,
            customerName: name
          })
        }).catch(err => console.error('[Checkout] Erro ao atualizar conversão de afiliado:', err));
      }

      // Enviar notificação de venda realizada
      try {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
          await fetch('/api/notifications/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              orderId: orderId,
              orderNumber: orderId,
              type: 'new_sale',
              title: 'Nova Venda Realizada',
              message: `Pedido #${orderId} confirmado com sucesso. Valor: ${grandTotal.toLocaleString('pt-MZ')} MZN`,
              amount: grandTotal,
              currency: 'MZN',
              items: selectedPlan ? [{
                name: serviceName,
                quantity: 1,
                price: grandTotal
              }] : [],
              metadata: {
                customerName: name,
                customerEmail: email,
                paymentMethod: paymentMethod
              },
              channels: { email: true, push: true, sms: false }
            })
          });
        }
      } catch (notificationErr) {
        console.error('[Checkout] Erro ao enviar notificação de venda:', notificationErr);
      }
    } catch (err) {
      setPushModal(false);
      setLoading(false);
      soundEffects.playPaymentErrorSound();
      setError(err instanceof Error ? err.message : 'Erro ao processar o pagamento.');
    }
  };

  const handleOrderWithoutPayment = async () => {
    setError('');
    setOrderWithoutPayment(true);

    // Validação específica para verificação de afiliado
    if (isAffiliateVerification) {
      if (!affiliatePhone.trim()) {
        setError(t.affiliatePhoneRequired);
        setOrderWithoutPayment(false);
        return;
      }
      
      // Usar o número digitado pelo usuário
      setPhonePayment(affiliatePhone);
      console.log('[Checkout] Usando número digitado pelo afiliado:', affiliatePhone);
    } else {
      // Validações normais para checkout de serviços
      if (!name.trim()) {
        setError(t.nameRequired);
        analytics.trackFormError('name', 'Name required');
        setOrderWithoutPayment(false);
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError(t.emailRequired);
        analytics.trackFormError('email', 'Invalid email');
        setOrderWithoutPayment(false);
        return;
      }
      // WhatsApp não é obrigatório para pagamento de cursos nem para verificação de afiliado
      if (!isCoursePayment && !isAffiliateVerification && !whatsapp.trim()) {
        setError(t.whatsappRequired);
        analytics.trackFormError('whatsapp', 'WhatsApp required');
        setOrderWithoutPayment(false);
        return;
      }
    }

    // Validar limite de sites por plano
    const currentUser = auth.getCurrentUser();
    if (currentUser && selectedPlan && selectedPlan.id !== 'website_creation') {
      const currentSites = dataManager.getSites(currentUser.email);
      const planLimits: Record<string, number> = { basic: 1, pro: 5, enterprise: -1 };
      const maxSites = planLimits[selectedPlan.id] || 1;
      
      if (maxSites !== -1 && currentSites.length >= maxSites) {
        setError(`O seu plano ${selectedPlan.name} permite apenas ${maxSites} site${maxSites > 1 ? 's' : ''}. Você já tem ${currentSites.length} site${currentSites.length > 1 ? 's' : ''} ativo${currentSites.length > 1 ? 's' : ''}. Faça upgrade para adicionar mais sites.`);
        setOrderWithoutPayment(false);
        return;
      }
    }

    setLoading(true);

    try {
      // Criar encomenda sem iniciar pagamento
      await finalizeOrder(false);
      
      // Redirecionar para página de sucesso com indicador de pagamento pendente
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setOrderWithoutPayment(false);
      soundEffects.playPaymentErrorSound();
      setError(err instanceof Error ? err.message : 'Erro ao criar encomenda.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação específica para verificação de afiliado
    if (isAffiliateVerification) {
      if (!affiliatePhone.trim()) {
        setError(t.affiliatePhoneRequired);
        return;
      }
      
      // Usar o número digitado pelo usuário
      setPhonePayment(affiliatePhone);
      console.log('[Checkout] Usando número digitado pelo afiliado:', affiliatePhone);
    } else {
      // Validações normais para checkout de serviços
      if (!name.trim()) {
        setError(t.nameRequired);
        analytics.trackFormError('name', 'Name required');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError(t.emailRequired);
        analytics.trackFormError('email', 'Invalid email');
        return;
      }
      // WhatsApp não é obrigatório para pagamento de cursos nem para verificação de afiliado
      if (!isCoursePayment && !isAffiliateVerification && !whatsapp.trim()) {
        setError(t.whatsappRequired);
        analytics.trackFormError('whatsapp', 'WhatsApp required');
        return;
      }
    }

    // Validar limite de sites por plano
    const currentUser = auth.getCurrentUser();
    if (currentUser && selectedPlan && selectedPlan.id !== 'website_creation') {
      const currentSites = dataManager.getSites(currentUser.email);
      const planLimits: Record<string, number> = { basic: 1, pro: 5, enterprise: -1 };
      const maxSites = planLimits[selectedPlan.id] || 1;
      
      if (maxSites !== -1 && currentSites.length >= maxSites) {
        setError(`O seu plano ${selectedPlan.name} permite apenas ${maxSites} site${maxSites > 1 ? 's' : ''}. Você já tem ${currentSites.length} site${currentSites.length > 1 ? 's' : ''} ativo${currentSites.length > 1 ? 's' : ''}. Faça upgrade para adicionar mais sites.`);
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMethod === 'emola') {
        setError('O pagamento automático via e-Mola encontra-se temporariamente em desenvolvimento. Por favor, utilize M-Pesa ou Transferência / Comprovativo.');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'mpesa') {
        // Para verificação de afiliado, usar o número digitado pelo usuário
        const phone = isAffiliateVerification 
          ? affiliatePhone 
          : (phonePayment || whatsapp);
        
        if (!phone) {
          setError(t.phoneRequired);
          setLoading(false);
          return;
        }
        
        // Validação de valor mínimo e máximo
        if (grandTotal < 1) {
          setError(t.minAmount);
          setLoading(false);
          return;
        }
        
        if (grandTotal > 1000000) {
          setError(t.maxAmount);
          setLoading(false);
          return;
        }
        
        const apiUrl = '/api/payments/mpesa/c2b';
        
        // Gerar referência única e mais segura para este pagamento
        const generateSecureReference = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 8);
          const checksum = (timestamp + random).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
          return `REF_${timestamp}_${random}_${checksum}`.toUpperCase();
        };
        const paymentReference = generateSecureReference();
        
        // Calcular serviceName para metadados
        const isWebsite = selectedPlan?.id === 'website_creation';
        const siteLabel = isWebsite && siteTypeName ? ` — ${siteTypeName}` : '';
        const cycleLabel = isWebsite ? '' : ` (${durationMonths} ${durationMonths === 1 ? 'Mês' : 'Meses'})`;
        const serviceName = isCoursePayment
          ? `Curso: ${courseNameParam || 'Curso WEHOSTHERE'}`
          : selectedPlan
          ? (domainParam 
              ? `${selectedPlan.name}${siteLabel}${cycleLabel} + Domínio (${domainParam})` 
              : `${selectedPlan.name}${siteLabel}${cycleLabel}`)
          : `Registo de Domínio: ${domainParam || 'Domínio Avulso'}`;
        
        console.log('[Checkout] Iniciando pagamento com telefone:', phone, 'Valor:', grandTotal);
        
        // Track payment initiation
        analytics.trackPaymentInitiated(paymentMethod, grandTotal);
        
        // 🚀 Feedback visual imediato: abre o modal de imediato enquanto conecta à rede M-Pesa
        setPushStatus('initiating');
        setPushFailureReason('');
        setPushModal(true);
        setLoading(true);

        try {
          const payResponse = await fetch(apiEndpoint(apiUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              msisdn: phone,
              amount: grandTotal,
              reference: paymentReference,
              thirdPartyReference: `ORDER_${Date.now().toString().slice(-6)}`,
              clientName: name,
              clientEmail: email,
              serviceName: serviceName
            })
          });

          const payData = await payResponse.json().catch(() => ({}));
          if (!payResponse.ok) {
            throw new Error(payData.error || 'Falha ao iniciar cobrança junto da operadora');
          }

          // 🔒 SEGURANÇA: Salvar reference para polling - transição suave para PIN
          setCurrentReference(paymentReference);
          setCountdown(60);
          setPushStatus('waiting');
          setIsPollingPayment(true);
        } catch (payErr: any) {
          console.error('[Checkout Push Error]:', payErr);
          setPushStatus('failed');
          setPushFailureReason(payErr.message || 'Erro ao comunicar com a operadora');
          setError(payErr.message || 'Erro ao comunicar com a operadora');
        } finally {
          setLoading(false);
        }
      } else if (paymentMethod === 'bank_transfer') {
        // 🔗 Registrar lead de checkout para transferência bancária
        if (domainParam) {
          fetch(apiEndpoint('/api/admin/domain-search-logs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: domainParam,
              userName: name,
              userEmail: email,
              userPhone: phonePayment || whatsapp,
              checkoutStatus: 'bank_transfer_pending',
              checkoutOrderId: `BANK_${Date.now().toString().slice(-6)}`
            })
          }).catch(() => {});
        }
        // 🔒 SEGURANÇA: Para transferência bancária, apenas criar pedido como 'in_progress'
        // Admin deve aprovar manualmente após verificar comprovativo
        await finalizeOrder(false);
      } else if (paymentMethod === 'card') {
        // 🔒 CARTÃO NÃO IMPLEMENTADO - Não permitir pagamento por cartão
        setError('Pagamento por cartão ainda não disponível. Por favor, use M-Pesa ou Transferência / Comprovativo.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setLoading(false);
      soundEffects.playPaymentErrorSound();
      
      // Tratamento de erros específicos
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
        setError(t.connectionError);
      } else if (errorMessage.includes('saldo') || errorMessage.includes('insufficient')) {
        setError(t.insufficientBalance);
      } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
        setError(t.invalidPhone);
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        setError(t.serverError);
      } else {
        setError(`${t.paymentError}: ${errorMessage}. ${t.tryAgain}`);
      }
      
      console.error('[CHECKOUT ERROR]', err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-gray-100 animate-in fade-in zoom-in duration-200">
          <div className={`w-16 h-16 ${orderWithoutPayment ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {orderWithoutPayment ? <Clock className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            {orderWithoutPayment ? 'Encomenda Recebida!' : (isCoursePayment ? t.coursePaymentConfirmed : (isAffiliateVerification ? t.verificationConfirmed : t.paymentConfirmed))}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-5">
            {orderWithoutPayment 
              ? 'Obrigado por escolher a WEHOSTHERE. Registámos a sua encomenda. O pagamento ainda não foi efetuado.'
              : (isCoursePayment 
                ? t.coursePaymentSuccess
                : isAffiliateVerification 
                ? t.verificationSuccess
                : t.paymentSuccess)}
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left border border-gray-200 space-y-2 text-xs text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Cliente:</span>
              <span className="font-bold text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">E-mail:</span>
              <span className="font-semibold text-gray-900 font-mono">{email}</span>
            </div>
            {currentOrderData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Referência:</span>
                  <span className="font-bold text-gray-900 font-mono">{currentOrderData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Estado:</span>
                  <span className={`font-bold ${orderWithoutPayment ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {orderWithoutPayment ? 'Pagamento Pendente' : 'Pago'}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-extrabold text-sm">
              <span>{orderWithoutPayment ? 'Valor a Pagar:' : 'Total Pago:'}</span>
              <span className={`${orderWithoutPayment ? 'text-amber-600' : 'text-emerald-600'} font-black text-base`}>{grandTotal.toLocaleString('pt-MZ')} MT</span>
            </div>
          </div>

          {/* Botão para Continuar Pagamento (se encomenda sem pagamento) */}
          {orderWithoutPayment && currentOrderData && (
            <button
              type="button"
              onClick={() => {
                // Redirecionar para checkout com dados pré-preenchidos para continuar pagamento
                const params = new URLSearchParams();
                if (selectedPlan) params.set('plan', selectedPlan.id);
                if (domainParam) params.set('domain', domainParam);
                if (domainPriceParam) params.set('domainPrice', domainPriceParam);
                if (siteTypeParam) params.set('siteType', siteTypeParam);
                if (siteTypeName) params.set('siteTypeName', siteTypeName);
                if (siteTypePrice) params.set('siteTypePrice', siteTypePrice);
                if (cycleParam) params.set('billingCycle', cycleParam);
                params.set('continuePayment', currentOrderData.id);
                router.push(`/checkout?${params.toString()}`);
              }}
              className="w-full mb-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-md cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Continuar para Pagamento</span>
            </button>
          )}

          {/* Botão para Baixar/Ver Recibo Oficial em PDF */}
          {currentOrderData && (
            <button
              type="button"
              onClick={() => setSelectedReceipt(currentOrderData)}
              className="w-full mb-4 py-3 bg-white border-2 border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold rounded-2xl transition flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Baixar / Imprimir Recibo Oficial (PDF)</span>
            </button>
          )}

          {/* Guia de Primeiros Passos & DNS do Domínio */}
          {domainParam && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 mb-4 text-left border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Ativação & DNS do Domínio</span>
              </div>
              <p className="text-xs text-slate-300">
                O domínio <strong className="text-emerald-400 font-mono">{domainParam}</strong> foi registrado! Configure os Nameservers da WEHOSTHERE:
              </p>

              <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NS1:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-bold">ns1.wehosthere.com</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('ns1.wehosthere.com')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded cursor-pointer transition"
                    >
                      {copiedNs === 'ns1.wehosthere.com' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NS2:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-bold">ns2.wehosthere.com</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('ns2.wehosthere.com')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded cursor-pointer transition"
                    >
                      {copiedNs === 'ns2.wehosthere.com' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>⚡ Propagação de DNS estimada:</span>
                <span className="text-amber-400 font-semibold">15min a 2h</span>
              </div>
            </div>
          )}

          {/* FLUXO DE MENSAGEM SEGUNDO O E-MAIL DO CLIENTE */}
          {checkoutAccountStatus === 'logged_in' && (
            <button
              type="button"
              onClick={() => isCoursePayment ? router.push('/dashboard/academy') : router.push('/dashboard')}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer text-sm"
            >
              <span>{isCoursePayment ? 'Ir para a Academia' : 'Ir para o meu Painel'}</span>
            </button>
          )}

          {checkoutAccountStatus === 'account_exists' && (
            <div className="space-y-3 bg-blue-50/80 border border-blue-200 p-4 rounded-2xl text-left">
              <div className="flex items-start space-x-2.5">
                <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-extrabold text-blue-900 uppercase tracking-wider">Já possui uma conta cadastrada!</strong>
                  <p className="text-xs text-blue-800 mt-1">
                    Identificámos que o e-mail <strong className="font-mono text-blue-950">{email}</strong> já tem uma conta na WEHOSTHERE. Faça login para aceder ao seu painel e visualizar os seus serviços sincronizados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Fazer Login para Sincronizar</span>
              </button>
            </div>
          )}

          {checkoutAccountStatus === 'no_account' && (
            <div className="space-y-3 bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl text-left">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                    {isCoursePayment ? 'Matrícula Criada com Sucesso!' : 'Criar Conta para Aceder ao Painel'}
                  </strong>
                  <p className="text-xs text-emerald-900 mt-1">
                    {isCoursePayment
                      ? 'O teu curso está pronto. Define a tua senha em 1 passo para começares a assistir de imediato às tuas aulas!'
                      : <>Registámos a compra para o e-mail <strong className="font-mono text-emerald-950">{email}</strong>. Crie a sua conta usando este mesmo e-mail.</>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isCoursePayment && courseClaimToken) {
                    router.push(`/academy/claim?token=${encodeURIComponent(courseClaimToken)}`);
                  } else if (isCoursePayment) {
                    router.push(`/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&redirect=/dashboard/academy`);
                  } else {
                    router.push(`/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
                  }
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow transition text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{isCoursePayment ? 'Ativar Acesso & Começar Curso Agora →' : 'Criar Conta Agora com este E-mail'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal de Recibo PDF */}
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* PUSH Modal Overlay */}
      {pushModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 text-center border border-gray-100 animate-in fade-in zoom-in duration-200">
            {pushStatus === 'initiating' ? (
              <div className="py-2">
                <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-tr from-red-600 to-rose-500 text-white rounded-full flex items-center justify-center shadow-md">
                    <Smartphone className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  A Enviar Pedido M-Pesa
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {phonePayment || whatsapp}
                </p>

                <div className="my-3.5 py-2 px-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-600 border-t-transparent shrink-0"></div>
                  <span className="font-medium text-[11px] sm:text-xs">Mantenha o ecrã desbloqueado</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPushModal(false);
                    setLoading(false);
                  }}
                  className="w-full py-1 text-xs text-gray-400 hover:text-gray-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : pushStatus === 'waiting' ? (
              <div className="py-2">
                <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md">
                    <Smartphone className="h-6 w-6" />
                  </div>
                </div>

                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  Introduza o PIN
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 mb-3">
                  {phonePayment || whatsapp} • <strong className="text-gray-900">{grandTotal.toLocaleString('pt-MZ')} MT</strong>
                </p>

                <div className="mb-4">
                  <div className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-red-600 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPollingPayment(true)}
                    disabled={isPollingPayment}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPollingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>A verificar...</span>
                      </>
                    ) : (
                      <span>Já confirmei o PIN</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPushModal(false);
                      setIsPollingPayment(false);
                      setLoading(false);
                    }}
                    className="w-full py-1 text-xs text-gray-400 hover:text-gray-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100">
                  {pushStatus === 'expired' ? (
                    <Clock className="h-6 w-6 text-amber-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {pushStatus === 'expired' 
                    ? 'Tempo Limite Excedido' 
                    : pushStatus === 'cancelled' 
                    ? 'Pagamento Cancelado' 
                    : 'Pagamento Não Concluído'}
                </h3>
                
                <p className="text-xs text-gray-500 mb-3">
                  {pushStatus === 'expired'
                    ? `Não recebemos a confirmação no ${ddi} ${phonePayment || whatsapp} a tempo.`
                    : `A transação no ${ddi} ${phonePayment || whatsapp} não foi aprovada.`}
                </p>

                {pushFailureReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg py-1.5 px-3 mb-4 text-[11px] font-medium text-red-700">
                    {pushFailureReason}
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    onClick={handleRetryPush}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Tentar Novamente</span>
                  </button>

                  <a
                    href={`https://wa.me/258848335618?text=${encodeURIComponent(
                      `Olá WeHost! Tive dificuldades no pagamento M-Pesa/e-Mola (${ddi} ${phonePayment || whatsapp}) de ${grandTotal.toLocaleString('pt-MZ')} MT. Podem ajudar-me?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Ajuda pelo WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setPushModal(false);
                      setIsPollingPayment(false);
                      setLoading(false);
                    }}
                    className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-700 transition"
                  >
                    Alterar número ou método
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Brand Accent Line */}
      <div className="h-1.5 bg-red-600 w-full" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-2.5">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <BrandLogo />
          <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Ambiente 100% Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container — fills remaining height, no page scroll */}
      <main className="max-w-2xl mx-auto px-4 pt-3 pb-4 flex flex-col" style={{height: 'calc(100dvh - 56px)', overflow: 'hidden'}}>
        <div className="mb-2 flex items-center justify-between">
          {checkoutStep === 2 ? (
            <button
              type="button"
              onClick={() => {
                setCheckoutStep(1);
                if (typeof window !== 'undefined') window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Voltar aos Dados</span>
            </button>
          ) : (
            <Link href="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Voltar ao Início</span>
            </Link>
          )}
          <span className="text-xs text-gray-400 font-mono font-medium">Checkout Seguro • Passo {checkoutStep} de 2</span>
        </div>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Stepper Visual de 2 Etapas */}
          <div className="bg-gray-50/90 border-b border-gray-200 px-4 sm:px-6 py-2.5 sm:py-3">
            <div className="flex items-center justify-between max-w-sm mx-auto relative">
              {/* Linha de conexão */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
              <div
                className={`absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-300 -z-0 ${
                  checkoutStep === 2 ? 'right-8' : 'w-0'
                }`}
              />

              {/* Passo 1 */}
              <button
                type="button"
                onClick={() => setCheckoutStep(1)}
                className="relative z-10 flex items-center space-x-2 bg-gray-50/90 px-1.5 cursor-pointer group"
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-xs ${
                    checkoutStep === 1
                      ? 'bg-primary-600 text-white ring-2 sm:ring-4 ring-primary-100'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {checkoutStep === 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </div>
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block leading-tight">Passo 1</span>
                  <span className={`text-xs font-bold ${checkoutStep === 1 ? 'text-primary-700' : 'text-gray-700'}`}>
                    Seus Dados
                  </span>
                </div>
              </button>

              {/* Passo 2 */}
              <button
                type="button"
                onClick={() => {
                  if (checkoutStep === 1) {
                    handleProceedToPayment();
                  }
                }}
                className="relative z-10 flex items-center space-x-2 bg-gray-50/90 px-1.5 cursor-pointer group"
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-xs ${
                    checkoutStep === 2
                      ? 'bg-primary-600 text-white ring-2 sm:ring-4 ring-primary-100'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  2
                </div>
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block leading-tight">Passo 2</span>
                  <span className={`text-xs font-bold ${checkoutStep === 2 ? 'text-primary-700' : 'text-gray-400'}`}>
                    Pagamento
                  </span>
                </div>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (checkoutStep === 1) {
                handleProceedToPayment();
              } else {
                handleSubmit(e);
              }
            }}
            className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 min-h-0"
          >
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl flex items-center space-x-2.5 text-xs sm:text-sm animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* ETAPA 1: Identificação Rápida */}
            {checkoutStep === 1 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {/* Resumo Rápido do Item Selecionado */}
                <div className="bg-gradient-to-r from-gray-50 via-primary-50/20 to-emerald-50/30 p-2.5 sm:p-3 rounded-xl border border-gray-200/80 flex items-center justify-between shadow-xs">
                  <div className="min-w-0 pr-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Item Selecionado</span>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 block truncate">
                      {isCoursePayment
                        ? (courseNameParam || 'Curso WEHOSTHERE')
                        : isAffiliateVerification
                        ? 'Verificação de Afiliado'
                        : domainParam
                        ? `Domínio: ${domainParam}${selectedPlan ? ` + Plano ${selectedPlan.name}` : ''}`
                        : selectedPlan
                        ? `Plano ${selectedPlan.name}`
                        : 'Serviço Web'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Total</span>
                    <span className="text-sm sm:text-base font-black text-emerald-600">
                      {(isCoursePayment ? courseAmountParam : (isAffiliateVerification ? verificationAmount : grandTotal)).toLocaleString('pt-MZ')} MT
                    </span>
                  </div>
                </div>

                {/* Campos Pessoais */}
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="name" className={`block text-xs sm:text-sm font-semibold mb-1 flex items-center space-x-1.5 ${fieldErrors.name ? 'text-red-600' : 'text-gray-800'}`}>
                      <User className={`w-3.5 h-3.5 ${fieldErrors.name ? 'text-red-400' : 'text-gray-500'}`} />
                      <span>Nome Completo <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' })); }}
                      placeholder="Ex: Manuel Silva"
                      required
                      className={`w-full px-3 py-2 border rounded-xl outline-none transition text-gray-900 placeholder-gray-400 text-sm shadow-xs ${
                        fieldErrors.name
                          ? 'border-red-400 bg-red-50/60 ring-2 ring-red-200 focus:ring-red-400 focus:border-red-400'
                          : 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className={`block text-xs sm:text-sm font-semibold mb-1 flex items-center space-x-1.5 ${fieldErrors.email ? 'text-red-600' : 'text-gray-800'}`}>
                      <Mail className={`w-3.5 h-3.5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-500'}`} />
                      <span>E-mail <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
                      placeholder="seu.email@exemplo.com"
                      required
                      className={`w-full px-3 py-2 border rounded-xl outline-none transition text-gray-900 placeholder-gray-400 text-sm shadow-xs ${
                        fieldErrors.email
                          ? 'border-red-400 bg-red-50/60 ring-2 ring-red-200 focus:ring-red-400 focus:border-red-400'
                          : 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                      }`}
                    />
                    {fieldErrors.email ? (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">Enviaremos os dados de acesso e fatura para este e-mail.</p>
                    )}
                  </div>

                  {/* Número de WhatsApp — apenas em checkouts normais */}
                  {!isAffiliateVerification && !isCoursePayment && (
                    <div>
                      <label htmlFor="whatsapp" className={`block text-xs sm:text-sm font-semibold mb-1 flex items-center space-x-1.5 ${fieldErrors.whatsapp ? 'text-red-600' : 'text-gray-800'}`}>
                        <MessageCircle className={`w-3.5 h-3.5 ${fieldErrors.whatsapp ? 'text-red-400' : 'text-emerald-600'}`} />
                        <span>Número do WhatsApp <span className="text-red-500">*</span></span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={ddi}
                          onChange={(e) => setDdi(e.target.value)}
                          className={`w-full sm:w-auto px-3 py-2 border rounded-xl outline-none text-gray-900 font-semibold text-sm shadow-xs cursor-pointer ${
                            fieldErrors.whatsapp
                              ? 'border-red-400 bg-red-50/60 ring-2 ring-red-200'
                              : 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500'
                          }`}
                        >
                          <option value="+258">+258 (Moçambique)</option>
                          <option value="+244">+244 (Angola)</option>
                          <option value="+351">+351 (Portugal)</option>
                          <option value="+55">+55 (Brasil)</option>
                          <option value="+1">+1 (EUA)</option>
                        </select>
                        <input
                          id="whatsapp"
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => { setWhatsapp(e.target.value); if (fieldErrors.whatsapp) setFieldErrors(prev => ({ ...prev, whatsapp: '' })); }}
                          placeholder="Número sem DDI (ex: 84 123 4567)"
                          required
                          className={`w-full sm:flex-1 px-3 py-2 border rounded-xl outline-none transition text-gray-900 placeholder-gray-400 text-sm shadow-xs ${
                            fieldErrors.whatsapp
                              ? 'border-red-400 bg-red-50/60 ring-2 ring-red-200 focus:ring-red-400 focus:border-red-400'
                              : 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                          }`}
                        />
                      </div>
                      {fieldErrors.whatsapp ? (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {fieldErrors.whatsapp}
                        </p>
                      ) : (
                        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">Utilizado para suporte prioritário e avisos de ativação/renovação.</p>
                      )}
                    </div>
                  )}

                  {/* Se for verificação de afiliado, campo do telefone */}
                  {isAffiliateVerification && (
                    <div>
                      <label htmlFor="affiliatePhone" className={`block text-xs sm:text-sm font-semibold mb-1 ${fieldErrors.affiliatePhone ? 'text-red-600' : 'text-gray-800'}`}>
                        Número de Telefone M-Pesa / eMola <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="affiliatePhone"
                        type="tel"
                        value={affiliatePhone}
                        onChange={(e) => { setAffiliatePhone(e.target.value); if (fieldErrors.affiliatePhone) setFieldErrors(prev => ({ ...prev, affiliatePhone: '' })); }}
                        placeholder="84 123 4567 ou 86 123 4567"
                        required
                        className={`w-full px-3 py-2 border rounded-xl outline-none transition text-gray-900 placeholder-gray-400 text-sm shadow-xs ${
                          fieldErrors.affiliatePhone
                            ? 'border-red-400 bg-red-50/60 ring-2 ring-red-200 focus:ring-red-400 focus:border-red-400'
                            : 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        }`}
                      />
                      {fieldErrors.affiliatePhone && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {fieldErrors.affiliatePhone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Vantagens / Garantias no Passo 1 */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <div className="flex items-center space-x-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                    <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Criptografado</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Ativação Imediata</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                    <MessageCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Suporte 24/7</span>
                  </div>
                </div>

                {/* Botão de Avanço para a Etapa 2 */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 hover:scale-[1.01] ${
                    shakeBtn ? 'animate-[shake_0.5s_ease]' : ''
                  }`}
                  style={shakeBtn ? { animation: 'shake 0.5s ease' } : {}}
                >
                  <span>Continuar para Pagamento</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="text-center pt-0.5">
                  <Link
                    href="/"
                    className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Voltar à página inicial</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ETAPA 2: Pagamento e Finalização */}
            {checkoutStep === 2 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {/* Resumo dos Dados do Cliente com botão Editar */}
                <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2.5 text-xs sm:text-sm min-w-0 pr-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900 truncate text-xs sm:text-sm">{name}</div>
                      <div className="text-gray-600 text-[11px] flex items-center gap-1.5 flex-wrap truncate">
                        <span className="truncate">{email}</span>
                        {!isAffiliateVerification && !isCoursePayment && whatsapp && (
                          <span className="shrink-0 font-medium">• {ddi} {whatsapp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep(1);
                      if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs shrink-0"
                    title="Editar informações pessoais"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>

                {/* 2. Método de Pagamento */}
                <div className="pt-1">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                    Método de Pagamento
                  </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {/* M-Pesa Option */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Checkout] Método de pagamento selecionado: M-Pesa');
                    setPaymentMethod('mpesa');
                  }}
                  className={`p-2 sm:p-2.5 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'border-red-600 bg-red-50/50 shadow-sm ring-2 ring-red-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <img src="/mpesa.jpg" alt="M-Pesa" className="h-5 sm:h-6 w-auto object-contain mb-0.5" />
                  <span className="text-[11px] sm:text-xs font-bold text-gray-800">M-Pesa</span>
                </button>

                {/* eMola Option */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Checkout] Método de pagamento selecionado: eMola');
                    setPaymentMethod('emola');
                  }}
                  className={`relative p-2 sm:p-2.5 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'emola'
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wide">Em Breve</span>
                  <img src="/emola.png" alt="eMola" className="h-5 sm:h-6 w-auto object-contain mb-0.5" />
                  <span className="text-[11px] sm:text-xs font-bold text-gray-800">eMola</span>
                </button>

                {/* Credit Card Option - Desativado temporariamente - NÃO mostrar para verificação de afiliado */}
                {!isAffiliateVerification && (
                  <div
                    className="relative p-2 sm:p-2.5 border-2 rounded-xl text-center flex flex-col items-center justify-center border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed select-none"
                    title="Pagamento por cartão ainda não disponível. Em breve!"
                  >
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wide">Em Breve</span>
                    <img src="/visa.png" alt="Visa" className="h-5 sm:h-5.5 w-auto object-contain mb-0.5" />
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400">Cartão</span>
                    <Lock className="h-2.5 w-2.5 text-gray-400 mt-0.5" />
                  </div>
                )}

                {/* Bank Transfer Option - NÃO mostrar para verificação de afiliado */}
                {!isAffiliateVerification && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[Checkout] Método de pagamento selecionado: Transferência / Comprovativo');
                      setPaymentMethod('bank_transfer');
                    }}
                    className={`p-2 sm:p-2.5 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  >
                    <div className="flex items-center space-x-1 mb-0.5 text-emerald-600">
                      <Landmark className="h-5 sm:h-5.5 w-5 sm:w-5.5" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 leading-tight">Transferência / Comprovativo</span>
                  </button>
                )}
              </div>

              {/* Dynamic Payment Details Input */}
              {paymentMethod === 'mpesa' && (
                <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Número M-Pesa para cobrança
                    {isAffiliateVerification && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={isAffiliateVerification ? affiliatePhone : phonePayment}
                      onChange={(e) => isAffiliateVerification ? setAffiliatePhone(e.target.value) : setPhonePayment(e.target.value)}
                      placeholder="84 123 4567 ou 85 123 4567"
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[40px]"
                    />
                  </div>
                  {isAffiliateVerification ? (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Digite o número M-Pesa para receber o pagamento de verificação e suas comissões futuras.
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Ao clicar em comprar, receberá um pedido PUSH no seu celular para introduzir o PIN do M-Pesa.
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'emola' && (
                <div className="mt-2.5 p-4 bg-amber-50/90 rounded-xl border border-amber-300 text-amber-900 shadow-sm animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm text-amber-900">
                          Pagamento via e-Mola em Desenvolvimento
                        </span>
                        <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Em Breve
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        A integração de cobrança automática via <strong>e-Mola</strong> encontra-se atualmente em fase de desenvolvimento.
                      </p>
                      <p className="text-xs text-amber-900 font-medium">
                        Para ativação imediata do seu serviço, por favor escolha <strong>M-Pesa</strong> ou opte por <strong>Transferência / Comprovativo</strong>.
                      </p>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('mpesa')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                        >
                          <img src="/mpesa.jpg" alt="M-Pesa" className="h-3.5 w-auto rounded-sm object-contain brightness-110" />
                          <span>Pagar com M-Pesa (Recomendado)</span>
                        </button>
                        {!isAffiliateVerification && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                          >
                            <Landmark className="h-3.5 w-3.5" />
                            <span>Transferência / Comprovativo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isAffiliateVerification && paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[48px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Validade</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isAffiliateVerification && paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-4">
                  <div className="space-y-2 text-xs text-emerald-900">
                    <span className="font-bold block text-sm text-emerald-950">🏦 Contas Bancárias Oficiais para Transferência:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px]">
                      <div>
                        <strong className="text-gray-900">Millennium BIM:</strong><br />
                        NIB: 433372004293948
                      </div>
                      <div>
                        <strong className="text-gray-900">BCI:</strong><br />
                        <span className="text-gray-400 italic">NIB em breve</span>
                      </div>
                      <div>
                        <strong className="text-gray-900">Standard Bank:</strong><br />
                        <span className="text-gray-400 italic">NIB em breve</span>
                      </div>
                      <div>
                        <strong className="text-gray-900">M-Pesa Manual:</strong><br />
                        <a
                          href="https://wa.me/258848335618?text=Olá%2C%20quero%20confirmar%20o%20meu%20pagamento%20via%20M-Pesa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold transition"
                        >+258 84 833 5618 (WEHOSTHERE)</a>
                      </div>
                      <div>
                        <strong className="text-gray-900">E-Mola Manual:</strong><br />
                        <span className="text-gray-400 italic font-sans">Indisponível de momento</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Anexar Comprovativo de Pagamento (Imagem ou PDF)</span>
                      {uploadingProof && (
                        <span className="text-emerald-700 font-normal flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>A carregar no Cloudinary...</span>
                        </span>
                      )}
                    </label>

                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold rounded-xl transition border border-emerald-300 shadow-sm">
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                        <span>{proofName ? 'Substituir Comprovativo' : 'Carregar Comprovativo'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={handleProofUpload}
                          disabled={uploadingProof}
                        />
                      </label>
                      <span className="text-[11px] text-emerald-700">Formatos aceites: PDF, JPG, PNG</span>
                    </div>

                    {proofUrl && (
                      <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-emerald-300 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold text-gray-900 truncate">{proofName || 'Comprovativo Anexado'}</span>
                        </div>
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold underline flex-shrink-0"
                        >
                          Ver Ficheiro
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seleção de Duração / Período da Hospedagem - NÃO mostrar para verificação de afiliado nem cursos */}
            {!isAffiliateVerification && !isCoursePayment && selectedPlan ? (
              selectedPlan.id !== 'website_creation' && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-800">
                      Período de Contratação (Duração da Assinatura)
                    </label>
                    {domainParam && !isCoursePayment && !isAffiliateVerification && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlanId('none')}
                        className="text-xs text-red-600 hover:text-red-700 font-medium underline cursor-pointer"
                      >
                        Remover Hospedagem (Comprar apenas domínio)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1 Mês */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 1 mês');
                        setDurationMonths(1);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 1
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">1 Mês</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {selectedPlan.price.toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-gray-400 block font-normal">Mensal regular</span>
                    </button>

                    {/* 3 Meses */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 3 meses (5% desconto)');
                        setDurationMonths(3);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 3
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                        -5% OFF
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">3 Meses</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {Math.round(selectedPlan.price * 3 * 0.95).toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">5% Desconto</span>
                    </button>

                    {/* 6 Meses */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 6 meses (10% desconto)');
                        setDurationMonths(6);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 6
                          ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                        -10% OFF
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">6 Meses</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {Math.round(selectedPlan.price * 6 * 0.90).toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">10% Desconto</span>
                    </button>

                    {/* 12 Meses / 1 Ano */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[Checkout] Duração selecionada: 12 meses (2 meses grátis)');
                        setDurationMonths(12);
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition cursor-pointer relative ${
                        durationMonths === 12
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                        2 Mês Grátis
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 block uppercase">1 Ano (12M)</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {selectedPlan.priceAnnual.toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-[10px] text-amber-700 block font-bold">2 Meses OFF</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              !isCoursePayment && !isAffiliateVerification && (
                <div className="px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between gap-2 my-1.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wide block">Apenas Registo de Domínio</span>
                    <span className="text-[10px] text-blue-600 block leading-tight">Sem hospedagem. Adicionar plano?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId('pro')}
                    className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] rounded-md transition whitespace-nowrap cursor-pointer shadow-sm flex-shrink-0"
                  >
                    + Plano Pro
                  </button>
                </div>
              )
            )}

            {/* 3. Resumo da Compra (Collapsible Order Summary) */}
            <div className="pt-2 sm:pt-3 border-t border-gray-200">
              {/* Toggle header */}
              <button
                type="button"
                onClick={() => setSummaryOpen(prev => !prev)}
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-800 py-1 focus:outline-none group"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Resumo da compra
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 group-hover:text-primary-600 transition-colors">
                  <span className="text-[11px] font-normal">{summaryOpen ? 'Ocultar' : 'Ver resumo'}</span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${summaryOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {/* Always-visible total */}
              {!summaryOpen && (
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-normal">Total a Pagar</span>
                  <span className="text-base text-emerald-600 font-black">{(isCoursePayment ? courseAmountParam : (isAffiliateVerification ? verificationAmount : grandTotal)).toLocaleString('pt-MZ')} MT</span>
                </div>
              )}

              {/* Collapsible detail */}
              {summaryOpen && (
                <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-200 mt-1.5 animate-[fadeIn_0.15s_ease]">
                  {isCoursePayment ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Curso: {courseNameParam || 'Curso WEHOSTHERE'}
                        </span>
                        <span className="font-bold text-gray-900">{courseAmountParam.toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Acesso vitalício ao curso completo • Certificado de conclusão
                      </div>
                    </>
                  ) : isAffiliateVerification ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Verificação de Telefone para Comissões
                        </span>
                        <span className="font-bold text-gray-900">{verificationAmount.toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Teste de segurança para confirmar propriedade do número M-Pesa
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedPlan ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              {selectedPlan.id === 'website_creation'
                                ? (siteTypeName ? siteTypeName : 'Criação de Site Profissional')
                                : `Plano ${selectedPlan.name} (${durationMonths === 1 ? '1 Mês' : `${durationMonths} Meses`})`}
                            </span>
                            <span className="font-bold text-gray-900">{basePrice.toLocaleString('pt-MZ')} MT</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedPlan.id === 'website_creation'
                              ? `Investimento único • Entrega estimada`
                              : `${selectedPlan.features.sites === -1 ? 'Sites ilimitados' : `${selectedPlan.features.sites} site(s)`} • ${selectedPlan.features.storage}GB Armazenamento`}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 font-medium italic">
                          Nenhum plano de hospedagem selecionado (Registro de Domínio Avulso).
                        </div>
                      )}

                      {domainParam && (
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                          <div>
                            <span className="font-semibold text-gray-900 block">Registo de Domínio</span>
                            <span className="text-xs font-mono text-primary-700 font-bold">{domainParam}</span>
                          </div>
                          <span className="font-bold text-emerald-700">{domainCost.toLocaleString('pt-MZ')} MT/ano</span>
                        </div>
                      )}

                      {selectedPlan && selectedPlan.id !== 'website_creation' && durationMonths > 1 && (
                        <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs font-semibold border border-emerald-200 mt-2 flex items-center justify-between">
                          <span>🎉 Desconto Especial para {durationMonths} Meses Aplicado!</span>
                          <span className="font-bold text-emerald-700">
                            {durationMonths === 12
                              ? `Economia de ${(selectedPlan.price * 2).toLocaleString('pt-MZ')} MT`
                              : (durationMonths === 6
                                  ? `Economia de ${Math.round(selectedPlan.price * 6 * 0.10).toLocaleString('pt-MZ')} MT`
                                  : `Economia de ${Math.round(selectedPlan.price * 3 * 0.05).toLocaleString('pt-MZ')} MT`)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3 font-bold text-base text-gray-900">
                    <span>Total a Pagar</span>
                    <span className="text-xl text-emerald-600 font-black">{(isCoursePayment ? courseAmountParam : (isAffiliateVerification ? verificationAmount : grandTotal)).toLocaleString('pt-MZ')} MT</span>
                  </div>
                </div>
              )}
            </div>

            {/* Security Guarantee Notice */}
            <div className="text-center text-[11px] text-gray-500 flex items-center justify-center space-x-1.5 pt-0.5">
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <span>Nós protegemos seus dados de pagamento com criptografia de ponta a ponta.</span>
            </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={loading || paymentMethod === 'emola'}
                  onClick={() => console.log('[Checkout] Botão de compra clicado')}
                  className="w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </>
                  ) : paymentMethod === 'emola' ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span>e-Mola em Desenvolvimento (Selecione M-Pesa ou Transferência)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Finalizar Pagamento ({(isCoursePayment ? courseAmountParam : (isAffiliateVerification ? verificationAmount : grandTotal)).toLocaleString('pt-MZ')} MT)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Botão Encomendar e Pagar Depois */}
                {!isAffiliateVerification && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleOrderWithoutPayment}
                    className="w-full py-2.5 sm:py-3 bg-white border-2 border-amber-500 hover:bg-amber-50 text-amber-700 font-bold text-sm sm:text-base rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Encomendar e Pagar Depois</span>
                      </>
                    )}
                  </button>
                )}

                {/* Botão Secundário para Voltar ao Passo 1 */}
                <div className="pt-0.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep(1);
                      if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Voltar para alterar dados do cliente</span>
                  </button>
                </div>
              </div>
            )}

            {/* Suporte WhatsApp no Checkout */}
            <div className="pt-1 text-center">
              <a
                href={`https://wa.me/258848335618?text=${encodeURIComponent(
                  `Olá WeHost! Estou no checkout a finalizar o pedido para ${
                    domainParam ? `o domínio ${domainParam}` : selectedPlan?.name || 'serviço'
                  } (Valor: ${(isCoursePayment ? courseAmountParam : (isAffiliateVerification ? verificationAmount : grandTotal)).toLocaleString('pt-MZ')} MT) e gostaria de apoio.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dúvidas ou dificuldades no pagamento? Fale no WhatsApp</span>
              </a>
            </div>

          </form>
        </div>
      </main>

      {/* Modal de Recibo PDF */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar checkout seguro..." />}>
      <CheckoutContent />
    </Suspense>
  );
}
