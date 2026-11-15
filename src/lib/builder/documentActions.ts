// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER - MUTADORES & OPERAÇÕES IMUTÁVEIS DE DOCUMENTO
// ============================================================================

import { SiteDocument, VisualComponent, PageDocument } from './types';
import { generateComponentId } from './defaultComponents';

/**
 * Procura recursivamente um componente pelo ID na lista de nós
 */
export function findNodeById(nodes: VisualComponent[], id: string): VisualComponent | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Localiza o componente no documento ativo
 */
export function findComponentInDocument(doc: SiteDocument, id: string): VisualComponent | null {
  const activePage = doc.pages.find((p) => p.id === doc.activePageId) || doc.pages[0];
  if (!activePage) return null;
  return findNodeById(activePage.rootComponents, id);
}

/**
 * Clona profundamente um componente gerando novos IDs para o nó e todos os filhos
 */
export function cloneComponentWithNewIds(comp: VisualComponent, newParentId: string | null = comp.parentId): VisualComponent {
  const newId = generateComponentId(comp.type);
  const cloned: VisualComponent = {
    ...JSON.parse(JSON.stringify(comp)),
    id: newId,
    name: `${comp.name} (Cópia)`,
    parentId: newParentId,
    children: [],
  };

  if (comp.children && comp.children.length > 0) {
    cloned.children = comp.children.map((child) => cloneComponentWithNewIds(child, newId));
  }

  return cloned;
}

/**
 * Insere um novo componente na árvore da página ativa
 */
export function insertComponentIntoDocument(
  doc: SiteDocument,
  newComponent: VisualComponent,
  targetParentId: string | null = null,
  targetIndex?: number
): SiteDocument {
  const updatedDoc: SiteDocument = JSON.parse(JSON.stringify(doc));
  const activePage = updatedDoc.pages.find((p) => p.id === updatedDoc.activePageId) || updatedDoc.pages[0];
  if (!activePage) return doc;

  newComponent.parentId = targetParentId;

  if (!targetParentId) {
    // Insere no nível raiz da página
    if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= activePage.rootComponents.length) {
      activePage.rootComponents.splice(targetIndex, 0, newComponent);
    } else {
      activePage.rootComponents.push(newComponent);
    }
  } else {
    // Insere como filho de um nó existente
    const insertRecursive = (nodes: VisualComponent[]): boolean => {
      for (const node of nodes) {
        if (node.id === targetParentId) {
          if (!node.children) node.children = [];
          if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= node.children.length) {
            node.children.splice(targetIndex, 0, newComponent);
          } else {
            node.children.push(newComponent);
          }
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (insertRecursive(node.children)) return true;
        }
      }
      return false;
    };

    const inserted = insertRecursive(activePage.rootComponents);
    if (!inserted) {
      // Se não encontrou o pai, insere na raiz
      newComponent.parentId = null;
      activePage.rootComponents.push(newComponent);
    }
  }

  updatedDoc.metadata.updatedAt = new Date().toISOString();
  return updatedDoc;
}

/**
 * Remove recursivamente um componente pelo ID
 */
export function removeComponentFromDocument(doc: SiteDocument, componentId: string): SiteDocument {
  const updatedDoc: SiteDocument = JSON.parse(JSON.stringify(doc));
  const activePage = updatedDoc.pages.find((p) => p.id === updatedDoc.activePageId) || updatedDoc.pages[0];
  if (!activePage) return doc;

  const removeRecursive = (nodes: VisualComponent[]): boolean => {
    const idx = nodes.findIndex((n) => n.id === componentId);
    if (idx !== -1) {
      nodes.splice(idx, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (removeRecursive(node.children)) return true;
      }
    }
    return false;
  };

  removeRecursive(activePage.rootComponents);
  updatedDoc.metadata.updatedAt = new Date().toISOString();
  return updatedDoc;
}

/**
 * Atualiza um componente específico via função mutadora
 */
export function updateComponentInDocument(
  doc: SiteDocument,
  componentId: string,
  updater: (comp: VisualComponent) => VisualComponent
): SiteDocument {
  const updatedDoc: SiteDocument = JSON.parse(JSON.stringify(doc));
  const activePage = updatedDoc.pages.find((p) => p.id === updatedDoc.activePageId) || updatedDoc.pages[0];
  if (!activePage) return doc;

  const updateRecursive = (nodes: VisualComponent[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === componentId) {
        nodes[i] = updater(nodes[i]);
        return true;
      }
      if (nodes[i].children && nodes[i].children.length > 0) {
        if (updateRecursive(nodes[i].children)) return true;
      }
    }
    return false;
  };

  updateRecursive(activePage.rootComponents);
  updatedDoc.metadata.updatedAt = new Date().toISOString();
  return updatedDoc;
}

/**
 * Move um componente para cima ou para baixo entre seus irmãos
 */
export function moveComponentOrder(
  doc: SiteDocument,
  componentId: string,
  direction: 'up' | 'down'
): SiteDocument {
  const updatedDoc: SiteDocument = JSON.parse(JSON.stringify(doc));
  const activePage = updatedDoc.pages.find((p) => p.id === updatedDoc.activePageId) || updatedDoc.pages[0];
  if (!activePage) return doc;

  const moveInArray = (nodes: VisualComponent[]): boolean => {
    const index = nodes.findIndex((n) => n.id === componentId);
    if (index !== -1) {
      if (direction === 'up' && index > 0) {
        const [item] = nodes.splice(index, 1);
        nodes.splice(index - 1, 0, item);
        return true;
      }
      if (direction === 'down' && index < nodes.length - 1) {
        const [item] = nodes.splice(index, 1);
        nodes.splice(index + 1, 0, item);
        return true;
      }
      return false;
    }

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (moveInArray(node.children)) return true;
      }
    }
    return false;
  };

  moveInArray(activePage.rootComponents);
  updatedDoc.metadata.updatedAt = new Date().toISOString();
  return updatedDoc;
}

/**
 * Duplica um componente e insere logo após ele
 */
export function duplicateComponentInDocument(
  doc: SiteDocument,
  componentId: string
): { updatedDoc: SiteDocument; newId: string | null } {
  const target = findComponentInDocument(doc, componentId);
  if (!target) return { updatedDoc: doc, newId: null };

  const cloned = cloneComponentWithNewIds(target);
  const updatedDoc: SiteDocument = JSON.parse(JSON.stringify(doc));
  const activePage = updatedDoc.pages.find((p) => p.id === updatedDoc.activePageId) || updatedDoc.pages[0];
  if (!activePage) return { updatedDoc: doc, newId: null };

  const insertAfterRecursive = (nodes: VisualComponent[]): boolean => {
    const idx = nodes.findIndex((n) => n.id === componentId);
    if (idx !== -1) {
      nodes.splice(idx + 1, 0, cloned);
      return true;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (insertAfterRecursive(node.children)) return true;
      }
    }
    return false;
  };

  insertAfterRecursive(activePage.rootComponents);
  updatedDoc.metadata.updatedAt = new Date().toISOString();
  return { updatedDoc, newId: cloned.id };
}

/**
 * Adiciona uma nova página ao SiteDocument
 */
export function addPageToDocument(
  doc: SiteDocument,
  title: string,
  slug: string
): SiteDocument {
  const cleanSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const pageId = `page_${Date.now().toString(36)}`;

  const newPage: PageDocument = {
    id: pageId,
    title,
    slug: cleanSlug,
    seo: {
      metaTitle: `${title} | ${doc.site.name}`,
      metaDescription: `Página ${title} de ${doc.site.name}`,
    },
    rootComponents: [],
  };

  const updatedDoc: SiteDocument = {
    ...doc,
    activePageId: pageId,
    pages: [...doc.pages, newPage],
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  return updatedDoc;
}

/**
 * Remove uma página (não permite apagar a última página)
 */
export function removePageFromDocument(doc: SiteDocument, pageId: string): SiteDocument {
  if (doc.pages.length <= 1) return doc;

  const newPages = doc.pages.filter((p) => p.id !== pageId);
  const newActiveId = doc.activePageId === pageId ? newPages[0].id : doc.activePageId;

  return {
    ...doc,
    activePageId: newActiveId,
    pages: newPages,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
