// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER - SISTEMA DE TIPOS & SCHEMA DE COMPONENTES
// ============================================================================

export type ComponentType =
  // Estrutura e Layout
  | 'section'
  | 'container'
  | 'row'
  | 'column'
  | 'grid'
  | 'navbar'
  | 'footer'
  | 'hero'
  
  // Conteúdo Básico
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'video'
  | 'icon'
  | 'badge'
  | 'divider'
  | 'spacer'
  
  // Componentes Compostos / Blocos
  | 'card'
  | 'pricing-table'
  | 'contact-form'
  | 'testimonials'
  | 'features'
  | 'faq'
  | 'gallery'
  | 'whatsapp-button'
  | 'custom-html';

export type DeviceBreakpoint = 'desktop' | 'tablet' | 'mobile';

// ─── Estilos Base por Componente ─────────────────────────────────────────────
export interface StyleProps {
  // Tipografia
  fontFamily?: string;
  fontSize?: string; // ex: '16px', '1.25rem', 'text-2xl'
  fontWeight?: string; // ex: 'normal', '600', 'bold', '800'
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string; // Hex ou classe Tailwind
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';

  // Dimensões & Display
  display?: 'block' | 'flex' | 'inline-flex' | 'grid' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string; // ex: '16px', '1rem', 'gap-4'
  gridColumns?: number | string; // ex: 3 ou 'repeat(auto-fit, minmax(280px, 1fr))'

  width?: string; // ex: '100%', 'auto', 'max-w-6xl'
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;

  // Espaçamento (Padding & Margin)
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Cores de Fundo & Imagens
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundGradient?: string; // ex: 'from-blue-600 to-indigo-600'

  // Bordas & Cantos Arredondados
  borderWidth?: string;
  borderTopWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderRightWidth?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: string; // ex: '8px', '16px', '9999px', 'rounded-2xl'

  // Sombras, Opacidade & Efeitos
  boxShadow?: string; // ex: 'shadow-lg', '0 10px 25px rgba(0,0,0,0.1)'
  opacity?: number | string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  zIndex?: number;

  // Visibilidade por Dispositivo
  hiddenOnDesktop?: boolean;
  hiddenOnTablet?: boolean;
  hiddenOnMobile?: boolean;

  // Classes Livres Tailwind CSS para Máxima Flexibilidade
  customClasses?: string;
}

// ─── Conteúdo Específico de Componentes ──────────────────────────────────────
export interface PricingPlanItem {
  name: string;
  price: string;
  currency: string;
  cycle: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  buttonText: string;
  buttonLink: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  avatarUrl?: string;
  comment: string;
  rating?: number;
}

export interface FeatureItem {
  title: string;
  description: string;
  iconName?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FormFieldItem {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // para selects
}

export interface VisualComponentContent {
  // Textos
  text?: string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subtitle?: string;
  badgeText?: string;
  buttonText?: string;
  buttonLink?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  
  // Mídia & Links
  src?: string;
  alt?: string;
  href?: string;
  target?: '_self' | '_blank';
  iconName?: string;
  videoUrl?: string;
  
  // Itens compostos
  pricingPlans?: PricingPlanItem[];
  testimonials?: TestimonialItem[];
  features?: FeatureItem[];
  faqItems?: FaqItem[];
  formFields?: FormFieldItem[];
  formSubmitText?: string;
  formActionUrl?: string;
  
  // Código customizado
  htmlRaw?: string;
}

// ─── Nó de Componente Visual da Árvore ───────────────────────────────────────
export interface VisualComponent {
  id: string;
  type: ComponentType;
  name: string; // Rótulo amigável na árvore (ex: "Secção Hero", "Botão CTA")
  content: VisualComponentContent;
  styles: {
    desktop: StyleProps;
    tablet?: Partial<StyleProps>;
    mobile?: Partial<StyleProps>;
  };
  parentId: string | null;
  children: VisualComponent[];
  locked?: boolean;
  hidden?: boolean;
}

// ─── Definição da Página & SEO ──────────────────────────────────────────────
export interface PageDocument {
  id: string;
  title: string;
  slug: string; // '/' para Home, '/sobre', '/contacto'
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  rootComponents: VisualComponent[]; // Árvore hierárquica de secções
}

// ─── Tema Global do Website ─────────────────────────────────────────────────
export interface GlobalSiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string;
  borderRadius: string; // 'rounded-none' | 'rounded-lg' | 'rounded-2xl' | 'rounded-full'
  mode: 'dark' | 'light';
}

// ─── Documento Raiz do Site (JSON Document Schema) ──────────────────────────
export interface SiteDocument {
  version: number;
  schemaVersion: '1.0';
  site: {
    id: string;
    name: string;
    slug: string;
    subdomain?: string;
    customDomain?: string;
    favicon?: string;
    theme: GlobalSiteTheme;
  };
  activePageId: string;
  pages: PageDocument[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    builderVersion: string;
  };
}

// ─── Operações Cirúrgicas da IA & Editor ─────────────────────────────────────
export type DocumentOperationType =
  | 'ADD_COMPONENT'
  | 'UPDATE_CONTENT'
  | 'UPDATE_STYLES'
  | 'DELETE_COMPONENT'
  | 'MOVE_COMPONENT'
  | 'DUPLICATE_COMPONENT'
  | 'REPLACE_SECTION'
  | 'UPDATE_THEME';

export interface DocumentOperation {
  type: DocumentOperationType;
  componentId?: string;
  parentId?: string | null;
  targetIndex?: number;
  component?: VisualComponent;
  contentUpdates?: Partial<VisualComponentContent>;
  styleUpdates?: {
    breakpoint: DeviceBreakpoint;
    styles: Partial<StyleProps>;
  };
  themeUpdates?: Partial<GlobalSiteTheme>;
}
