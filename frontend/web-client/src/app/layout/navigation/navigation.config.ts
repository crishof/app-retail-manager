import { environment } from '../../../environments/environment';
import type { User } from '../../core/auth/auth.store';

export type NavRole = User['role'];

export interface NavItem {
  label: string;
  icon: string;
  description: string;
  route?: string;
  externalUrl?: string;
  badge?: string;
  aliases?: string[];
  roles?: NavRole[];
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  caption: string;
  items: NavItem[];
}

export interface NavPaletteItem {
  label: string;
  description: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  section: string;
  trail: string[];
  badge?: string;
}

export interface NavBreadcrumb {
  label: string;
  route?: string;
}

const ALL_ROLES: NavRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export const APP_NAVIGATION: NavSection[] = [
  {
    title: 'Inicio',
    caption: 'Visión general operativa',
    items: [
      {
        label: 'Dashboard',
        icon: 'space_dashboard',
        description: 'Resumen de KPIs, caja, ventas y actividad reciente.',
        route: '/dashboard',
        aliases: ['/dashboard/analytics'],
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: 'Ventas',
    caption: 'Operación comercial del día',
    items: [
      {
        label: 'Comprobantes',
        icon: 'receipt_long',
        description: 'Alta de comprobantes con selector de tipo dentro del flujo.',
        route: '/customerInvoice',
        aliases: ['/comprobantes/nota-credito', '/comprobantes/nota-debito', '/comprobantes/ver'],
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Presupuestos',
        icon: 'request_quote',
        description: 'Cotizaciones previas a la venta y seguimiento comercial.',
        route: '/comprobantes/presupuesto',
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Clientes',
        icon: 'groups',
        description: 'Base de clientes, contacto comercial y consulta de fichas.',
        route: '/clientes',
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Recibos y pagos',
        icon: 'payments',
        description: 'Cobros, cancelaciones y movimientos asociados a comprobantes.',
        route: '/comprobantes/recibos',
        aliases: ['/comprobantes/pagos'],
        roles: ['ADMIN', 'OPERATOR'],
      },
    ],
  },
  {
    title: 'Compras',
    caption: 'Abastecimiento y proveedores',
    items: [
      {
        label: 'Proveedores',
        icon: 'storefront',
        description: 'Ficha del proveedor con cuenta corriente y datos comerciales.',
        route: '/supplier',
        aliases: ['/supplier/cuenta-corriente'],
        roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
      },
      {
        label: 'Facturas proveedor',
        icon: 'description',
        description: 'Carga y control documental de compras de proveedores.',
        route: '/supplierInvoice',
        roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
      },
      {
        label: 'Listas de precios',
        icon: 'price_check',
        description: 'Matrices de costo y actualización de precios por proveedor.',
        route: '/supplierPriceList',
        roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
      },
    ],
  },
  {
    title: 'Almacén',
    caption: 'Catálogo, stock y logística',
    items: [
      {
        label: 'Productos',
        icon: 'inventory_2',
        description: 'Catálogo central con marcas y categorías dentro del mismo dominio.',
        route: '/products',
        aliases: ['/products/', '/brand', '/category'],
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Inventario',
        icon: 'warehouse',
        description: 'Disponibilidad, movimientos y control de existencias.',
        route: '/almacen/inventario',
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Remitos',
        icon: 'local_shipping',
        description: 'Despachos, remitos y transferencias de mercadería.',
        route: '/almacen/remito',
        roles: ['ADMIN', 'OPERATOR'],
      },
    ],
  },
  {
    title: 'Finanzas',
    caption: 'Caja, fiscalidad y reporting',
    items: [
      {
        label: 'Caja diaria',
        icon: 'point_of_sale',
        description: 'Apertura, cierre y arqueos diarios por sucursal.',
        route: '/caja',
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Informes',
        icon: 'bar_chart',
        description: 'Análisis de ventas, movimientos y exportables operativos.',
        route: '/informes/ventas',
        aliases: ['/informes/movimientos', '/informes/excel'],
        roles: ['ADMIN', 'VIEWER'],
      },
      {
        label: 'Libro IVA',
        icon: 'menu_book',
        description: 'Libro IVA con foco en normativa española y fiscalidad vigente.',
        route: '/contabilidad/libro-iva',
        badge: 'ES',
        roles: ['ADMIN', 'VIEWER'],
      },
      {
        label: 'Retenciones',
        icon: 'gavel',
        description: 'Gestión de retenciones e impuestos asociados.',
        route: '/contabilidad/retenciones',
        roles: ['ADMIN', 'VIEWER'],
      },
      {
        label: 'Libro Mayor',
        icon: 'auto_stories',
        description: 'Mayor contable y trazabilidad contable avanzada.',
        route: '/contabilidad/libro-mayor',
        roles: ['ADMIN', 'VIEWER'],
      },
      {
        label: 'Facturación electrónica',
        icon: 'verified_user',
        description: 'Preparado para VeriFactu/AEAT y obligación antifraude.',
        route: '/contabilidad/facturacion-electronica',
        badge: 'AEAT',
        roles: ['ADMIN', 'VIEWER'],
      },
    ],
  },
  {
    title: 'Ecommerce',
    caption: 'Canal online y catálogo digital',
    items: [
      {
        label: 'Órdenes ecommerce',
        icon: 'shopping_cart',
        description: 'Gestión unificada de órdenes del canal online.',
        route: '/ecommerce/ordenes',
        roles: ['ADMIN'],
      },
      {
        label: 'Ver tienda',
        icon: 'store',
        description: 'Acceso rápido al storefront público.',
        externalUrl: environment.ecommerceUrl,
        roles: ['ADMIN'],
      },
      {
        label: 'SEO',
        icon: 'travel_explore',
        description: 'Optimización orgánica y visibilidad del canal ecommerce.',
        route: '/ecommerce/seo',
        roles: ['ADMIN'],
      },
      {
        label: 'Configuración',
        icon: 'tune',
        description: 'Parámetros de la tienda, etiquetas e integraciones.',
        route: '/ecommerce/config',
        aliases: ['/ecommerce/etiquetas'],
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'Servicio Técnico',
    caption: 'Posventa y soporte',
    items: [
      {
        label: 'Órdenes de trabajo',
        icon: 'build',
        description: 'Seguimiento de intervenciones y soporte técnico.',
        route: '/servicio-tecnico',
        roles: ['ADMIN', 'OPERATOR'],
      },
      {
        label: 'Turnos',
        icon: 'event',
        description: 'Agenda operativa y reservas del servicio técnico.',
        route: '/servicio-tecnico/turnos',
        roles: ['ADMIN', 'OPERATOR'],
      },
    ],
  },
  {
    title: 'Configuración',
    caption: 'Gobierno del sistema',
    items: [
      {
        label: 'General',
        icon: 'settings',
        description: 'Parámetros generales, empresas y sucursales.',
        route: '/configuracion/general',
        aliases: ['/configuracion/general/empresas', '/configuracion/general/sucursales', '/configuracion/general/depositos'],
        roles: ['ADMIN'],
      },
      {
        label: 'Usuarios',
        icon: 'manage_accounts',
        description: 'Administración de usuarios, perfiles y permisos.',
        route: '/configuracion/usuarios',
        aliases: ['/admin/roles', '/admin/auditoria'],
        roles: ['ADMIN'],
      },
      {
        label: 'Importaciones',
        icon: 'upload_file',
        description: 'Carga masiva y sincronización de datos.',
        route: '/importaciones',
        roles: ['ADMIN'],
      },
    ],
  },
];

function normalizeUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function isAllowed(itemRoles: NavRole[] | undefined, role: NavRole): boolean {
  if (!itemRoles || itemRoles.length === 0) {
    return true;
  }

  return itemRoles.includes(role);
}

function matchesRoute(url: string, candidate?: string, aliases: string[] = []): boolean {
  if (!candidate) {
    return false;
  }

  const normalizedUrl = normalizeUrl(url);
  const candidates = [candidate, ...aliases].map(normalizeUrl);

  return candidates.some((entry) => normalizedUrl === entry || normalizedUrl.startsWith(`${entry}/`));
}

function filterItemByRole(item: NavItem, role: NavRole): NavItem | null {
  if (!isAllowed(item.roles, role)) {
    return null;
  }

  const children = item.children
    ?.map((child) => filterItemByRole(child, role))
    .filter((child): child is NavItem => child !== null);

  return {
    ...item,
    children,
  };
}

export function getVisibleNavSections(role: NavRole): NavSection[] {
  return APP_NAVIGATION
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => filterItemByRole(item, role))
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((section) => section.items.length > 0);
}

function flattenItems(section: string, items: NavItem[], trail: string[] = []): NavPaletteItem[] {
  return items.flatMap((item) => {
    const currentTrail = [...trail, item.label];
    const currentItem: NavPaletteItem[] = item.route || item.externalUrl
      ? [{
          label: item.label,
          description: item.description,
          icon: item.icon,
          route: item.route,
          externalUrl: item.externalUrl,
          section,
          trail: currentTrail,
          badge: item.badge,
        }]
      : [];

    const children = item.children ? flattenItems(section, item.children, currentTrail) : [];
    return [...currentItem, ...children];
  });
}

export function getPaletteItems(role: NavRole): NavPaletteItem[] {
  return getVisibleNavSections(role).flatMap((section) => flattenItems(section.title, section.items));
}

export function searchPaletteItems(role: NavRole, query: string): NavPaletteItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  const items = getPaletteItems(role);

  if (!normalizedQuery) {
    return items.slice(0, 12);
  }

  return items
    .filter((item) => {
      const haystack = [item.label, item.description, item.section, ...item.trail].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 12);
}

function findItemBreadcrumbs(items: NavItem[], url: string, parents: NavBreadcrumb[] = []): NavBreadcrumb[] | null {
  for (const item of items) {
    const current = [...parents, { label: item.label, route: item.route }];

    if (matchesRoute(url, item.route, item.aliases)) {
      return current;
    }

    if (item.children?.length) {
      const nested = findItemBreadcrumbs(item.children, url, current);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function findNavBreadcrumbs(url: string, role: NavRole): NavBreadcrumb[] {
  const normalizedUrl = normalizeUrl(url);

  for (const section of getVisibleNavSections(role)) {
    const match = findItemBreadcrumbs(section.items, normalizedUrl);
    if (match) {
      return [{ label: section.title }, ...match];
    }
  }

  const segments = normalizedUrl.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ label: 'Inicio', route: '/dashboard' }];
  }

  return segments.map((segment, index) => ({
    label: segment
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    route: `/${segments.slice(0, index + 1).join('/')}`,
  }));
}

export function isNavItemActive(item: NavItem, url: string): boolean {
  if (matchesRoute(url, item.route, item.aliases)) {
    return true;
  }

  return item.children?.some((child) => isNavItemActive(child, url)) ?? false;
}
