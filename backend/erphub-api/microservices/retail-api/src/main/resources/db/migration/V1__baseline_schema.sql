-- =============================================================================
-- V1__baseline_schema.sql  —  Baseline (squashed) schema for retail-api
--
-- Generado desde el modelo de entidades JPA (Hibernate schema export) el
-- 2026-07-16 y fijado como única fuente de verdad del esquema.
-- Sustituye a las migraciones incrementales previas V1..V4, que NO podían
-- materializar el esquema en una BD limpia (solo hacían ALTER sobre tablas base
-- que Hibernate creaba vía ddl-auto en dev). Ver docs/audit/R3-esquema-arranque.md.
--
-- Multitenancy: el MVP es mono-comercio. Las columnas tenant_id se conservan tal
-- como las genera el modelo; el cableado del aislamiento por tenant es fase posterior.
--
-- NOTA para desarrolladores con una BD local anterior al squash:
--   elimina y recrea la base de datos para que Flyway parta de este baseline
--   (el flyway_schema_history antiguo referencia migraciones ya eliminadas).
-- =============================================================================


    create table brand_projection (
        updated_at timestamp(6) with time zone,
        id uuid not null,
        name varchar(255) not null unique,
        primary key (id)
    );

    create table tbl_audit_log (
        is_for_finalized_document boolean not null,
        created_at timestamp(6) with time zone not null,
        tenant_id bigint not null,
        id uuid not null,
        entity_id varchar(36) not null,
        performed_by_user_id varchar(36),
        source_ip_address varchar(45),
        action varchar(50) not null check ((action in ('CREATE','UPDATE','DELETE','FINALIZE','CANCEL','APPROVE','REJECT','RESTORE','STATUS_CHANGE','BULK_UPDATE','SYSTEM_ACTION','DATA_EXPORT','REPORT_GENERATED'))),
        entity_type varchar(100) not null,
        performed_by_name varchar(150),
        description varchar(500),
        changes TEXT,
        metadata TEXT,
        primary key (id)
    );

    create table tbl_branch (
        active boolean not null,
        point_of_sale integer not null,
        created_at timestamp(6),
        updated_at timestamp(6),
        postal_code varchar(10),
        branch_id uuid not null,
        company_id uuid not null,
        code varchar(20) not null unique,
        phone varchar(20),
        country varchar(100),
        locality varchar(100),
        email varchar(150),
        address varchar(255),
        name varchar(255) not null,
        website varchar(255),
        primary key (branch_id)
    );

    create table tbl_brands (
        deleted boolean,
        deleted_at timestamp(6) with time zone,
        tenant_id bigint,
        id uuid not null,
        name varchar(100) not null unique,
        logo_url varchar(255),
        primary key (id)
    );

    create table tbl_cash_movement (
        amount float(53) not null,
        exchange_rate_to_ars float(53) not null,
        original_amount float(53) not null,
        created_at timestamp(6),
        branch_id uuid,
        id uuid not null,
        session_id uuid,
        currency varchar(255),
        description varchar(255),
        reference varchar(255),
        type varchar(255) check ((type in ('INCOME','EXPENSE','SALE','CUSTOMER_PAYMENT','SUPPLIER_PAYMENT','OPENING','CLOSING'))),
        primary key (id)
    );

    create table tbl_cash_session (
        closing_balance float(53) not null,
        opening_balance float(53) not null,
        session_date date,
        closed_at timestamp(6),
        opened_at timestamp(6),
        branch_id uuid,
        id uuid not null,
        user_id uuid,
        counted_totals_by_currency_json TEXT,
        exchange_rates_to_ars_json TEXT,
        notes varchar(255),
        status varchar(255) check ((status in ('OPEN','CLOSED'))),
        primary key (id)
    );

    create table tbl_categories (
        leaf boolean,
        level integer,
        tenant_id bigint,
        id uuid not null,
        parent_id uuid,
        name varchar(100) not null unique,
        slug varchar(150) not null unique,
        image_url varchar(255),
        primary key (id)
    );

    create table tbl_company (
        active boolean not null,
        start_of_activities date,
        created_at timestamp(6),
        updated_at timestamp(6),
        cuit varchar(13) not null unique,
        company_id uuid not null,
        gross_income_number varchar(20),
        iva_status varchar(50),
        name varchar(100) not null unique,
        email varchar(255),
        legal_name varchar(255),
        phone varchar(255),
        website varchar(255),
        primary key (company_id)
    );

    create table tbl_customers (
        deleted boolean,
        deleted_at timestamp(6) with time zone,
        tenant_id bigint,
        address_id uuid,
        id uuid not null,
        dni varchar(20) unique,
        tax_id varchar(20),
        phone varchar(30),
        lastname varchar(100) not null,
        name varchar(100) not null,
        email varchar(150),
        primary key (id)
    );

    create table tbl_document_version (
        is_current_version boolean not null,
        is_finalized_version boolean not null,
        version_number integer not null,
        created_at timestamp(6) with time zone not null,
        tenant_id bigint not null,
        id uuid not null,
        created_by_user_id varchar(36),
        document_id varchar(36) not null,
        snapshot_hash varchar(64),
        document_type varchar(100) not null,
        created_by_name varchar(150),
        change_reason varchar(500),
        change_summary TEXT,
        document_snapshot TEXT not null,
        primary key (id)
    );

    create table tbl_email_verification_tokens (
        used boolean not null,
        created_at timestamp(6) with time zone not null,
        expiry_date timestamp(6) with time zone not null,
        id uuid not null,
        user_id uuid not null,
        code varchar(255) not null,
        primary key (id)
    );

    create table tbl_import_job (
        failed integer not null,
        inserted integer not null,
        processed_items integer not null,
        total_items integer not null,
        update_existing boolean not null,
        updated integer not null,
        finished_at timestamp(6) with time zone,
        started_at timestamp(6) with time zone,
        id uuid not null,
        supplier_id uuid not null,
        file_name varchar(512),
        error varchar(2000),
        file_path varchar(255) not null,
        status varchar(255) not null check ((status in ('PENDING','RUNNING','COMPLETED','FAILED'))),
        primary key (id)
    );

    create table tbl_inventory_items (
        order_index integer,
        system_quantity integer,
        total_count integer,
        variance integer,
        zona_a_count integer,
        zona_b_count integer,
        zona_c_count integer,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        product_id uuid not null,
        session_id uuid not null,
        notes TEXT,
        primary key (id)
    );

    create table tbl_inventory_sessions (
        session_date date not null,
        completed_at timestamp(6),
        created_at timestamp(6) not null,
        started_at timestamp(6),
        tenant_id bigint not null,
        updated_at timestamp(6),
        branch_id uuid not null,
        confirmed_by_user_id uuid,
        deposit_id uuid not null,
        id uuid not null,
        initiated_by_user_id uuid,
        observations TEXT,
        status varchar(255) not null check ((status in ('DRAFT','IN_PROGRESS','COMPLETED','CONFIRMED'))),
        primary key (id)
    );

    create table tbl_invitation_tokens (
        used boolean not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        id uuid not null,
        role varchar(20) not null check ((role in ('ADMIN','MANAGER','USER'))),
        email varchar(150) not null,
        token varchar(200) not null unique,
        primary key (id)
    );

    create table tbl_other_concept (
        discount_rate float(53) not null,
        internal_tax_rate float(53) not null,
        price float(53) not null,
        tax_rate float(53) not null,
        id uuid not null,
        invoice_id uuid,
        description varchar(255),
        primary key (id)
    );

    create table tbl_password_reset_tokens (
        used boolean not null,
        created_at timestamp(6) with time zone not null,
        expiry_date timestamp(6) with time zone not null,
        id uuid not null,
        user_id uuid not null,
        token varchar(255) not null unique,
        primary key (id)
    );

    create table tbl_prices (
        active boolean not null,
        amount numeric(15,2) not null,
        discount_rate numeric(5,2),
        tax_rate numeric(5,2),
        created_at timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone,
        id uuid not null,
        product_id uuid not null,
        name varchar(50) not null,
        type varchar(255) not null check ((type in ('PURCHASE','LIST','OFFER','WHOLESALE','STORE','WEB','CUSTOM'))),
        primary key (id),
        unique (product_id, type, name)
    );

    create table tbl_product_images (
        product_id uuid not null,
        image_url varchar(255) not null
    );

    create table tbl_product_price_history (
        change_percent numeric(5,2),
        price_from numeric(10,2),
        price_to numeric(10,2),
        imported_at timestamp(6),
        recorded_at timestamp(6) not null,
        id uuid not null,
        link_id uuid not null,
        change_type varchar(255) not null check ((change_type in ('NEW','SAME','UP','DOWN'))),
        primary key (id)
    );

    create table tbl_product_price_link (
        last_imported_price numeric(10,2),
        previous_imported_price numeric(10,2),
        created_at timestamp(6) not null,
        last_price_change_at timestamp(6),
        updated_at timestamp(6),
        id uuid not null,
        product_id uuid not null,
        supplier_product_id varchar(36) not null,
        supplier_code varchar(100),
        price_change_status varchar(255) not null check ((price_change_status in ('NEW','SAME','UP','DOWN'))),
        primary key (id),
        unique (supplier_product_id, product_id)
    );

    create table tbl_product_prices (
        discount_rate numeric(38,2),
        price numeric(38,2),
        tax_rate numeric(38,2),
        valid_from timestamp(6) with time zone,
        valid_to timestamp(6) with time zone,
        id uuid not null,
        price_list_id uuid,
        product_id uuid,
        primary key (id),
        unique (product_id, price_list_id)
    );

    create table tbl_products (
        active boolean not null,
        deleted boolean not null,
        highlighted boolean not null,
        published boolean not null,
        created_at timestamp(6) with time zone not null,
        tenant_id bigint,
        updated_at timestamp(6) with time zone,
        upc varchar(12),
        ean varchar(13),
        isbn varchar(13),
        gtin varchar(14),
        brand_id uuid not null,
        category_id uuid,
        dimension_id uuid,
        id uuid not null,
        price_id uuid,
        supplier_id uuid,
        supplier_product_id uuid,
        mpn varchar(20),
        code varchar(100),
        sku varchar(100) unique,
        model varchar(150) not null,
        description varchar(1000),
        brand_name varchar(255) not null,
        primary key (id)
    );

    comment on column tbl_products.deleted is
        'Soft-delete indicator';

    create table tbl_purchase_invoice_items (
        discount_percentage float(53),
        line_total float(53) not null,
        order_index integer,
        quantity float(53) not null,
        tax_rate varchar(3) not null,
        unit_price float(53) not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        product_id uuid,
        purchase_invoice_id uuid not null,
        description varchar(255) not null,
        primary key (id)
    );

    create table tbl_purchase_invoices (
        due_date date not null,
        issue_date date not null,
        retention_amount numeric(38,2),
        retention_percentage numeric(38,2),
        total_price float(53) not null,
        tenant_id bigint not null,
        branch_id uuid not null,
        id uuid not null,
        location_id uuid,
        supplier_id uuid not null,
        document_type varchar(20) not null,
        number varchar(20) not null,
        supplier_invoice_number varchar(30),
        observations TEXT,
        status varchar(255) check ((status in ('DRAFT','ISSUED','PENDING_PAYMENT','PARTIALLY_PAID','PAID','CANCELLED','OVERDUE'))),
        primary key (id)
    );

    create table tbl_quote_items (
        discount_percentage float(53),
        line_total float(53) not null,
        order_index integer,
        quantity float(53) not null,
        tax_rate varchar(3) not null,
        unit_price float(53) not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        product_id uuid,
        quote_id uuid not null,
        description varchar(255) not null,
        primary key (id)
    );

    create table tbl_quotes (
        creation_date date not null,
        expiration_date date not null,
        total_price float(53) not null,
        validity_days integer,
        tenant_id bigint not null,
        branch_id uuid not null,
        customer_id uuid not null,
        id uuid not null,
        location_id uuid,
        sale_id uuid,
        number varchar(20) not null,
        observations TEXT,
        status varchar(255) check ((status in ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED','CONVERTED_TO_SALE'))),
        primary key (id)
    );

    create table tbl_refresh_tokens (
        revoked boolean not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        id uuid not null,
        user_id uuid not null,
        token varchar(500) not null unique,
        primary key (id)
    );

    create table tbl_sale_items (
        discount_rate float(53) not null,
        price float(53) not null,
        quantity integer not null,
        tax_rate float(53) not null,
        id uuid not null,
        product_id uuid,
        sale_id uuid not null,
        primary key (id)
    );

    create table tbl_sales (
        discount float(53) not null,
        interest float(53) not null,
        internal_tax float(53) not null,
        local_tax float(53) not null,
        net_value0 float(53) not null,
        net_value105 float(53) not null,
        net_value21 float(53) not null,
        net_value27 float(53) not null,
        rounding float(53) not null,
        sale_date date,
        state_tax float(53) not null,
        subtotal1 float(53) not null,
        subtotal2 float(53) not null,
        total_price float(53) not null,
        vat105 float(53) not null,
        vat21 float(53) not null,
        vat27 float(53) not null,
        withholding_gross_receipts_tax float(53) not null,
        withholding_income float(53) not null,
        withholding_suss float(53) not null,
        withholding_vat float(53) not null,
        tenant_id bigint,
        branch_id uuid,
        customer_id uuid,
        id uuid not null,
        location_id uuid,
        sales_invoice_id uuid unique,
        observations varchar(255),
        sale_number varchar(255),
        sale_type varchar(255),
        primary key (id)
    );

    create table tbl_sales_invoice_items (
        discount_percentage float(53),
        line_total float(53) not null,
        order_index integer,
        quantity float(53) not null,
        tax_rate varchar(3) not null,
        unit_price float(53) not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        product_id uuid,
        sales_invoice_id uuid not null,
        description varchar(255) not null,
        primary key (id)
    );

    create table tbl_sales_invoices (
        amount_paid float(53),
        due_date date not null,
        issue_date date not null,
        total_price float(53) not null,
        tenant_id bigint not null,
        branch_id uuid not null,
        customer_id uuid not null,
        id uuid not null,
        location_id uuid,
        sale_id uuid not null unique,
        document_type varchar(20) not null,
        number varchar(20) not null,
        payment_method varchar(20),
        observations TEXT,
        payment_status varchar(255) check ((payment_status in ('PENDING','PARTIAL','PAID'))),
        status varchar(255) check ((status in ('DRAFT','ISSUED','PENDING_PAYMENT','PARTIALLY_PAID','PAID','CANCELLED','OVERDUE'))),
        primary key (id)
    );

    create table tbl_security_accounts (
        email_verified boolean not null,
        enabled boolean not null,
        locked boolean not null,
        created_at timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone not null,
        id uuid not null,
        user_id uuid not null unique,
        password_hash varchar(100) not null,
        primary key (id)
    );

    create table tbl_stock_location (
        active boolean not null,
        branch_id uuid not null,
        id uuid not null,
        code varchar(20) not null,
        address varchar(255),
        location_type varchar(255) not null check ((location_type in ('SALES','WAREHOUSE','TRANSIT','CONSIGNMENT'))),
        name varchar(255) not null,
        primary key (id)
    );

    create table tbl_stock_movements (
        quantity integer not null,
        created_at timestamp(6) with time zone,
        branch_id uuid,
        id uuid not null,
        location_id uuid,
        product_id uuid,
        reference_id uuid,
        stock_id uuid,
        reason varchar(255) check ((reason in ('INVOICE','ORDER','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT'))),
        primary key (id)
    );

    create table tbl_stocks (
        quantity integer not null,
        tenant_id bigint,
        updated_at timestamp(6) with time zone not null,
        branch_id uuid not null,
        id uuid not null,
        location_id uuid not null,
        product_id uuid not null,
        primary key (id),
        unique (product_id, branch_id, location_id)
    );

    create table tbl_supplier_invoice (
        discount float(53),
        due_date date,
        fixed_asset boolean not null,
        interest float(53) not null,
        internal_tax float(53) not null,
        invoice_date date,
        local_tax float(53) not null,
        net_value0 float(53) not null,
        net_value105 float(53) not null,
        net_value21 float(53) not null,
        net_value27 float(53) not null,
        reception_date date,
        rounding float(53) not null,
        saved_date date,
        state_tax float(53) not null,
        subtotal1 float(53) not null,
        subtotal2 float(53) not null,
        tax_save boolean not null,
        total_price float(53) not null,
        vat105 float(53) not null,
        vat21 float(53) not null,
        vat27 float(53) not null,
        withholding_gross_receipts_tax float(53) not null,
        withholding_income float(53) not null,
        withholding_suss float(53) not null,
        withholding_vat float(53) not null,
        finalized_at timestamp(6) with time zone,
        tenant_id bigint,
        branch_id uuid,
        finalized_by_user_id uuid,
        id uuid not null,
        location_id uuid,
        supplier_id uuid,
        currency varchar(255),
        finalization_status varchar(255) not null check ((finalization_status in ('DRAFT','PENDING_APPROVAL','APPROVED','FINALIZED','CANCELED'))),
        invoice_number varchar(255),
        invoice_type varchar(255),
        location varchar(255),
        observations varchar(255),
        packing_list_number varchar(255),
        tax_regime varchar(255) not null check ((tax_regime in ('IVA_RESPONSABLE','MONOTRIBUTISTA','NO_INSCRIPTO','PEQUEÑO_CONTRIBUYENTE','EXENTO'))),
        primary key (id)
    );

    create table tbl_supplier_invoice_item (
        discount_rate float(53),
        price float(53),
        quantity integer,
        tax_rate float(53),
        id uuid not null,
        invoice_id uuid,
        product_id uuid,
        primary key (id)
    );

    create table tbl_supplier_payment (
        amount float(53) not null,
        payment_date date,
        branch_id uuid,
        id uuid not null,
        supplier_id uuid,
        description varchar(255),
        payment_method varchar(255),
        reference varchar(255),
        primary key (id)
    );

    create table tbl_supplier_price_item (
        currency varchar(3) not null,
        internal_tax numeric(5,4),
        price numeric(15,4) not null,
        suggested_price numeric(15,4),
        suggested_web_price numeric(15,4),
        tax_rate numeric(5,4),
        last_update timestamp(6) with time zone not null,
        id uuid not null,
        supplier_id uuid not null,
        stock_raw varchar(50),
        barcode varchar(100),
        brand varchar(100),
        supplier_code varchar(100) not null,
        category varchar(150),
        model varchar(150),
        description varchar(500),
        primary key (id)
    );

    create table tbl_suppliers (
        deleted boolean,
        deleted_at timestamp(6) with time zone,
        tenant_id bigint,
        address_id uuid,
        id uuid not null,
        name varchar(100) not null,
        tax_id varchar(100) not null,
        legal_name varchar(255),
        primary key (id)
    );

    create table tbl_users (
        created_at timestamp(6) with time zone not null,
        tenant_id bigint,
        updated_at timestamp(6) with time zone not null,
        id uuid not null,
        role varchar(20) not null check ((role in ('ADMIN','MANAGER','USER'))),
        status varchar(30) not null check ((status in ('PENDING_VERIFICATION','ACTIVE','INVITED','BLOCKED','INACTIVE'))),
        first_name varchar(50) not null,
        last_name varchar(50) not null,
        email varchar(150) not null unique,
        primary key (id)
    );

    create index idx_audit_tenant 
       on tbl_audit_log (tenant_id);

    create index idx_audit_entity 
       on tbl_audit_log (entity_type, entity_id);

    create index idx_audit_timestamp 
       on tbl_audit_log (created_at);

    create index idx_audit_user 
       on tbl_audit_log (performed_by_user_id);

    create index idx_brand_name 
       on tbl_brands (name);

    create index idx_category_parent 
       on tbl_categories (parent_id);

    create index idx_customer_dni 
       on tbl_customers (dni);

    create index idx_docver_tenant 
       on tbl_document_version (tenant_id);

    create index idx_docver_document 
       on tbl_document_version (document_type, document_id);

    create index idx_docver_version 
       on tbl_document_version (document_id, version_number);

    create index idx_email_verification_code 
       on tbl_email_verification_tokens (code);

    create index idx_email_verification_expiry 
       on tbl_email_verification_tokens (expiry_date);

    create index idx_inventory_item_session 
       on tbl_inventory_items (session_id);

    create index idx_inventory_item_product 
       on tbl_inventory_items (product_id);

    create index idx_inventory_branch 
       on tbl_inventory_sessions (branch_id);

    create index idx_inventory_deposit 
       on tbl_inventory_sessions (deposit_id);

    create index idx_inventory_date 
       on tbl_inventory_sessions (session_date);

    create index idx_inventory_status 
       on tbl_inventory_sessions (status);

    create index idx_invitation_token_value 
       on tbl_invitation_tokens (token);

    create index idx_invitation_token_email 
       on tbl_invitation_tokens (email);

    create index idx_invitation_token_expires_at 
       on tbl_invitation_tokens (expires_at);

    create index idx_reset_token_token 
       on tbl_password_reset_tokens (token);

    create index idx_reset_token_expiry 
       on tbl_password_reset_tokens (expiry_date);

    create index idx_price_product 
       on tbl_prices (product_id);

    create index idx_price_type 
       on tbl_prices (type);

    create index idx_price_active 
       on tbl_prices (active);

    create index idx_link_id 
       on tbl_product_price_history (link_id);

    create index idx_recorded_at 
       on tbl_product_price_history (recorded_at);

    create index idx_product_code 
       on tbl_products (code);

    create index idx_product_brand 
       on tbl_products (brand_id);

    create index idx_product_category 
       on tbl_products (category_id);

    create index idx_product_active 
       on tbl_products (active);

    create index idx_movement_product 
       on tbl_stock_movements (product_id);

    create index idx_movement_stock 
       on tbl_stock_movements (stock_id);

    create index idx_movement_reference 
       on tbl_stock_movements (reference_id);

    create index idx_stock_product 
       on tbl_stocks (product_id);

    create index idx_stock_branch 
       on tbl_stocks (branch_id);

    create index idx_stock_location 
       on tbl_stocks (location_id);

    create index idx_supplier_price_supplier 
       on tbl_supplier_price_item (supplier_id);

    create index idx_supplier_price_code 
       on tbl_supplier_price_item (supplier_code);

    create index idx_supplier_tax_id 
       on tbl_suppliers (tax_id);

    alter table if exists tbl_branch 
       add constraint FK838v2prdg8fjin7oe140b3oyb 
       foreign key (company_id) 
       references tbl_company;

    alter table if exists tbl_categories 
       add constraint FKlgcu2gtaege1gxc342yxf5p6s 
       foreign key (parent_id) 
       references tbl_categories;

    alter table if exists tbl_email_verification_tokens 
       add constraint FKf4n7lqa9904xn7mjmca5q3fl9 
       foreign key (user_id) 
       references tbl_users;

    alter table if exists tbl_inventory_items 
       add constraint FKjrwfd1mnanopd6im6w4de27p3 
       foreign key (session_id) 
       references tbl_inventory_sessions;

    alter table if exists tbl_other_concept 
       add constraint FKtc5iif80ire97k9y8tss343y1 
       foreign key (invoice_id) 
       references tbl_supplier_invoice;

    alter table if exists tbl_password_reset_tokens 
       add constraint FKastlpmqn8rfp3a7deljg4s9rq 
       foreign key (user_id) 
       references tbl_users;

    alter table if exists tbl_product_images 
       add constraint FKep0t8akj7epqe1jhlsu25xduy 
       foreign key (product_id) 
       references tbl_products;

    alter table if exists tbl_product_price_history 
       add constraint FKkmios600k91iusvnu3bga1wta 
       foreign key (link_id) 
       references tbl_product_price_link;

    alter table if exists tbl_product_price_link 
       add constraint FKi3mfxtfd6178ep03q3bsqrdl8 
       foreign key (product_id) 
       references tbl_products;

    alter table if exists tbl_purchase_invoice_items 
       add constraint FKs07lef9fb5kj2xspuh1lwm0a3 
       foreign key (purchase_invoice_id) 
       references tbl_purchase_invoices;

    alter table if exists tbl_quote_items 
       add constraint FKekq2okcnvayvw14wb4t4yso8e 
       foreign key (quote_id) 
       references tbl_quotes;

    alter table if exists tbl_refresh_tokens 
       add constraint FK9jmfuqwxrf8vt2uplm1kp4u7e 
       foreign key (user_id) 
       references tbl_users;

    alter table if exists tbl_sale_items 
       add constraint FK7q05mbq6uji0luf5qthuh7lhc 
       foreign key (sale_id) 
       references tbl_sales;

    alter table if exists tbl_sales_invoice_items 
       add constraint FKo87emnjfr24lyietd2ojyxj07 
       foreign key (sales_invoice_id) 
       references tbl_sales_invoices;

    alter table if exists tbl_security_accounts 
       add constraint FKka6u6x5c7076ng4ea6pdbfsk5 
       foreign key (user_id) 
       references tbl_users;

    alter table if exists tbl_stock_location 
       add constraint FK14uv8043s6r75uuo5gaqsfoc6 
       foreign key (branch_id) 
       references tbl_branch;

    alter table if exists tbl_supplier_invoice_item 
       add constraint FKlv3fx75spgt1c4vqwlqilnjjs 
       foreign key (invoice_id) 
       references tbl_supplier_invoice;
