-- ============================================================================
-- Seed de DESARROLLO (sólo se aplica con el perfil dev; ver spring.flyway.locations
-- en application-dev.yml). NO se incluye en el build de producción.
--
-- Migración repetible (R__) e idempotente (ON CONFLICT DO NOTHING).
--
-- Usuario de acceso local:
--   email:    admin@local.test
--   password: Local1234!
--   rol:      ADMIN
-- El hash es BCrypt de "Local1234!".
-- ============================================================================

-- ── Usuario + credenciales ────────────────────────────────────────────────
insert into tbl_users (id, role, status, first_name, last_name, email, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000a1', 'ADMIN', 'ACTIVE', 'Admin', 'Local',
        'admin@local.test', now(), now())
on conflict (id) do nothing;

insert into tbl_security_accounts (id, user_id, password_hash, email_verified, enabled, locked, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
        '$2y$10$AtsN1oXN9VuuwDFSqkQ8yOroUVYcwkyYOevjq0KdveZ7Y.H9BDSHm',
        true, true, false, now(), now())
on conflict (id) do nothing;

-- ── Marcas ────────────────────────────────────────────────────────────────
insert into tbl_brands (id, name, deleted) values
  ('00000000-0000-0000-0000-0000000b0001', 'Fonseca', false),
  ('00000000-0000-0000-0000-0000000b0002', 'Yamaha', false),
  ('00000000-0000-0000-0000-0000000b0003', 'Shure', false),
  ('00000000-0000-0000-0000-0000000b0004', 'Marshall', false)
on conflict (id) do nothing;

-- ── Categorías ────────────────────────────────────────────────────────────
insert into tbl_categories (id, name, slug, leaf, level) values
  ('00000000-0000-0000-0000-0000000c0001', 'Guitarras', 'guitarras', true, 1),
  ('00000000-0000-0000-0000-0000000c0002', 'Teclados', 'teclados', true, 1),
  ('00000000-0000-0000-0000-0000000c0003', 'Micrófonos', 'microfonos', true, 1),
  ('00000000-0000-0000-0000-0000000c0004', 'Amplificación', 'amplificacion', true, 1)
on conflict (id) do nothing;

-- ── Productos ─────────────────────────────────────────────────────────────
insert into tbl_products
  (id, brand_id, category_id, brand_name, model, code, sku, description,
   active, deleted, highlighted, published, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-0000000c0001',
   'Fonseca', 'Guitarra criolla 40K', 'GTR-001', 'GTR-001', 'Guitarra criolla de estudio', true, false, true, true, now(), now()),
  ('00000000-0000-0000-0000-0000000d0002', '00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000c0002',
   'Yamaha', 'PSR-E373', 'TEC-044', 'TEC-044', 'Teclado 61 teclas sensitivo', true, false, false, true, now(), now()),
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-0000000b0003', '00000000-0000-0000-0000-0000000c0003',
   'Shure', 'SM58', 'MIC-207', 'MIC-207', 'Micrófono dinámico cardioide', true, false, true, true, now(), now()),
  ('00000000-0000-0000-0000-0000000d0004', '00000000-0000-0000-0000-0000000b0004', '00000000-0000-0000-0000-0000000c0004',
   'Marshall', 'MG15', 'AMP-133', 'AMP-133', 'Amplificador de guitarra 15W', true, false, false, true, now(), now()),
  ('00000000-0000-0000-0000-0000000d0005', '00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000c0002',
   'Yamaha', 'P-45', 'TEC-051', 'TEC-051', 'Piano digital 88 teclas', true, false, false, true, now(), now()),
  ('00000000-0000-0000-0000-0000000d0006', '00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-0000000c0001',
   'Fonseca', 'Guitarra criolla 25', 'GTR-014', 'GTR-014', 'Guitarra criolla de iniciación', true, false, false, false, now(), now())
on conflict (id) do nothing;
