import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  children?: NavItem[];
  expanded?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() collapsed = false;

  sections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Inicio',     icon: 'home',             route: '/inicio'    },
        { label: 'Dashboard',  icon: 'dashboard',        route: '/dashboard' },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { label: 'Productos',   icon: 'inventory_2',  route: '/products'  },
        { label: 'Marcas',      icon: 'label',        route: '/brand'     },
        { label: 'Categorías',  icon: 'category',     route: '/category'  },
      ],
    },
    {
      title: 'Ventas',
      items: [
        { label: 'Factura de venta',  icon: 'receipt',       route: '/customerInvoice'          },
        { label: 'Nota de crédito',   icon: 'note_alt',      route: '/comprobantes/nota-credito' },
        { label: 'Nota de débito',    icon: 'note',          route: '/comprobantes/nota-debito'  },
        { label: 'Presupuesto',       icon: 'request_quote', route: '/comprobantes/presupuesto'  },
        { label: 'Ver comprobantes',  icon: 'list_alt',      route: '/comprobantes/ver'          },
        { label: 'Recibos',           icon: 'receipt_long',  route: '/comprobantes/recibos'      },
        { label: 'Pagos',             icon: 'payments',      route: '/comprobantes/pagos'        },
      ],
    },
    {
      title: 'Proveedores',
      items: [
        { label: 'Listado',          icon: 'storefront',    route: '/supplier'           },
        { label: 'Factura proveedor',icon: 'description',   route: '/supplierInvoice'    },
        { label: 'Lista de precios', icon: 'price_check',   route: '/supplierPriceList'  },
        { label: 'Cuenta corriente', icon: 'account_balance',route: '/statementAccount'  },
      ],
    },
    {
      title: 'Clientes',
      items: [
        { label: 'Listado',  icon: 'people',  route: '/clientes' },
      ],
    },
    {
      title: 'Almacén',
      items: [
        { label: 'Remito',      icon: 'local_shipping', route: '/almacen/remito'     },
        { label: 'Inventario',  icon: 'warehouse',      route: '/almacen/inventario' },
      ],
    },
    {
      title: 'Caja',
      items: [
        { label: 'Caja diaria',  icon: 'point_of_sale',  route: '/caja' },
      ],
    },
    {
      title: 'Ecommerce',
      items: [
        { label: 'Ver tienda',    icon: 'storefront',     externalUrl: environment.ecommerceUrl },
        { label: 'Órdenes',       icon: 'shopping_cart',  route: '/ecommerce/ordenes' },
        { label: 'Configuración', icon: 'tune',           route: '/ecommerce/config'  },
        { label: 'SEO',           icon: 'search',         route: '/ecommerce/seo'     },
        { label: 'Etiquetas',     icon: 'sell',           route: '/ecommerce/etiquetas'},
      ],
    },
    {
      title: 'Serv. Técnico',
      items: [
        { label: 'Órdenes', icon: 'build',  route: '/servicio-tecnico'       },
        { label: 'Turnos',  icon: 'event',  route: '/servicio-tecnico/turnos'},
      ],
    },
    {
      title: 'Informes',
      items: [
        { label: 'Ventas en tiempo real', icon: 'trending_up',   route: '/informes/ventas'     },
        { label: 'Movimientos',           icon: 'swap_vert',     route: '/informes/movimientos'},
        { label: 'Exportar Excel',        icon: 'table_chart',   route: '/informes/excel'      },
      ],
    },
    {
      title: 'Contabilidad',
      items: [
        { label: 'Libro IVA',    icon: 'menu_book',    route: '/contabilidad/libro-iva'  },
        { label: 'Retenciones',  icon: 'gavel',        route: '/contabilidad/retenciones'},
        { label: 'Libro Mayor',  icon: 'auto_stories', route: '/contabilidad/libro-mayor'},
      ],
    },
    {
      title: 'Configuración',
      items: [
        { label: 'General',             icon: 'settings',        route: '/configuracion/general'           },
        { label: 'Empresas',            icon: 'business',        route: '/configuracion/general/empresas'  },
        { label: 'Sucursales y Depós.', icon: 'store',           route: '/configuracion/general/sucursales'},
        { label: 'Usuarios',            icon: 'manage_accounts', route: '/configuracion/usuarios'          },
        { label: 'Archivos maestros',   icon: 'folder_open',     route: '/configuracion/archivos'          },
        { label: 'Importaciones',       icon: 'upload_file',     route: '/importaciones'                   },
      ],
    },
  ];
}
