# 📋 Estructura de Archivos Markdown - RetailManager

## ✅ Estado: Organizado Correctamente

Todos los archivos markdown están organizados de forma jerárquica para que los agentes accedan correctamente a la información y skills.

---

## 🎯 Mapa de Archivos

### 📍 Global Level (Accesible desde cualquier proyecto)

```
RetailManager/
├── .copilot-instructions.md              ⭐ ENTRADA GLOBAL
│   ├─ Descripción: Guía para todos los agentes
│   ├─ Contiene: Cómo acceder a skills y proyectos
│   ├─ References: Todas las skills disponibles
│   └─ Use: Primera lectura para agentes
│
├── docs/agents/AGENTS.md                 🔗 HUB CENTRAL
│   ├─ Descripción: Coordinación de proyectos
│   ├─ Contiene: Routing a cada proyecto + quick commands
│   ├─ References: Links a ecommerce/, web-client/, backend/
│   └─ Use: Encontrar guía específica de proyecto
│
└── .agents/skills/                       🧠 SKILLS GLOBALES
    ├── frontend-design/SKILL.md          → UI components, pages
    ├── accessibility/SKILL.md            → WCAG AA audits
    └── seo/SKILL.md                      → SEO optimization
```

### 🛍️ Frontend - E-commerce Project

```
frontend/ecommerce/
├── AGENTS.md                             📘 GUÍA DEL PROYECTO
│   ├─ Descripción: Contexto específico e-commerce
│   ├─ Contiene: Task categories, code standards, API integration
│   ├─ References: Skills aplicables (frontend-design, accessibility)
│   └─ Use: Entender proyecto antes de trabajar
│
└── .instructions.md                      ✨ ESTÁNDARES DE CÓDIGO
    ├─ Descripción: Patrones de desarrollo específicos
    ├─ Contiene: TypeScript strict, Angular components, signals
    ├─ Contiene: Accessibility requirements (WCAG AA)
    └─ Use: Verificar durante implementación
```

**Agentes en este proyecto pueden acceder a:**
- `.copilot-instructions.md` ← Información global
- `AGENTS.md` ← Guía del proyecto
- `.instructions.md` ← Estándares
- `../../.agents/skills/frontend-design/` ← Para UI design
- `../../.agents/skills/accessibility/` ← Para A11y audits
- `../../.agents/skills/seo/` ← Para SEO metadata

### 🖥️ Frontend - Web Client Project

```
frontend/web-client/
├── AGENTS.md                             📘 GUÍA DEL PROYECTO
│   ├─ Descripción: Contexto SSR + Tailwind
│   ├─ Contiene: Dashboard features, SSR considerations
│   ├─ References: Skills aplicables
│   └─ Use: Entender proyecto SSR
│
└── (No .instructions.md - usar AGENTS.md como referencia)
```

**Agentes en este proyecto pueden acceder a:**
- `.copilot-instructions.md` ← Información global
- `AGENTS.md` ← Guía del proyecto
- `../../.agents/skills/frontend-design/` ← Para UI design
- `../../.agents/skills/accessibility/` ← Para A11y audits

### 🔧 Backend Project

```
backend/
└── AGENTS.md                             📘 GUÍA DEL PROYECTO
    ├─ Descripción: Microservicios, Spring Boot
    ├─ Contiene: 17+ servicios, patrones, DB strategy
    ├─ Contiene: Java best practices, testing
    └─ Use: Desarrollar microservicios
```

**Agentes en este proyecto pueden acceder a:**
- `.copilot-instructions.md` ← Información global
- `AGENTS.md` ← Guía del proyecto backend

---

## 🔄 Flujo de Acceso de Agentes

### Escenario 1: Crear un Componente en E-commerce

```
1️⃣  Lee .copilot-instructions.md (GLOBAL)
    ↓ Aprende que existen skills frontend-design, accessibility, seo
    
2️⃣  Lee frontend/ecommerce/AGENTS.md (PROJECT)
    ↓ Entiende estructura de e-commerce, categories, code standards
    
3️⃣  Lee frontend/ecommerce/.instructions.md (PROJECT DETAILS)
    ↓ Aprende patrones exactos de componentes, accessibility requirements
    
4️⃣  Abre .agents/skills/frontend-design/SKILL.md (SKILL)
    ↓ Usa la skill para crear el componente
    
5️⃣  Usa .agents/skills/accessibility/SKILL.md (SKILL)
    ↓ Verifica WCAG AA compliance
    
✅ Resultado: Componente creado con máxima calidad
```

### Escenario 2: Auditar Accesibilidad

```
1️⃣  Lee .copilot-instructions.md
    ↓ Encuentra accessibility skill
    
2️⃣  Lee frontend/{project}/AGENTS.md
    ↓ Entiende requisitos de A11y del proyecto
    
3️⃣  Abre .agents/skills/accessibility/SKILL.md
    ↓ Ejecuta auditoría WCAG AA
    
✅ Resultado: Lista de issues + fixes
```

### Escenario 3: Agregar Microservicio Nuevo

```
1️⃣  Lee .copilot-instructions.md
    ↓ Encuentra backend/AGENTS.md reference
    
2️⃣  Lee docs/agents/AGENTS.md
    ↓ Encuentra backend quick commands
    
3️⃣  Lee backend/AGENTS.md
    ↓ Aprende service structure patterns
    
4️⃣  Implementa siguiendo patrones
    
✅ Resultado: Nuevo microservicio listo
```

---

## 📊 Matriz de Acceso - ¿Qué Lee un Agente?

| Agent Location | Reads First | Reads Second | Reads Third | Acceso a Skills |
|---|---|---|---|---|
| `frontend/ecommerce/` | `.copilot-instructions.md` | `AGENTS.md` | `.instructions.md` | frontend-design, accessibility, seo |
| `frontend/web-client/` | `.copilot-instructions.md` | `AGENTS.md` | N/A | frontend-design, accessibility |
| `backend/` | `.copilot-instructions.md` | `AGENTS.md` | N/A | N/A |
| Root | `.copilot-instructions.md` | `docs/agents/AGENTS.md` | Project-specific | frontend-design, accessibility, seo |

---

## ✅ Skills Accesibles

### ✨ frontend-design
```
Ubicación: .agents/skills/frontend-design/SKILL.md
Accesible desde: frontend/ecommerce/, frontend/web-client/
Uso: Crear UI componentes, pages, layouts de alta calidad
```

### ♿ accessibility
```
Ubicación: .agents/skills/accessibility/SKILL.md
Accesible desde: frontend/ecommerce/, frontend/web-client/
Uso: Auditar WCAG AA compliance, fix accessibility issues
```

### 🔍 seo
```
Ubicación: .agents/skills/seo/SKILL.md
Accesible desde: frontend/ecommerce/, frontend/web-client/
Uso: Optimizar meta tags, structured data, OpenGraph
```

---

## 📝 Contenido Resumido

### `.copilot-instructions.md` (GLOBAL)
- ✅ Descripción del monorepo
- ✅ Lista de skills con links
- ✅ Referencia a cada proyecto (AGENTS.md)
- ✅ Checklist antes de usar skills
- ✅ Ejemplos de tasks
- ✅ Quick task mapping

### `frontend/ecommerce/AGENTS.md`
- ✅ Task categories (Products, Cart, Account, UI)
- ✅ Code standards (TypeScript, Angular, Accessibility)
- ✅ Estructura del proyecto
- ✅ API integration patterns
- ✅ Backend endpoints
- ✅ Cuando usar cada skill

### `frontend/ecommerce/.instructions.md`
- ✅ Angular best practices
- ✅ Component patterns exactos
- ✅ TypeScript strict requirements
- ✅ Accessibility requirements (WCAG AA)
- ✅ State management con signals
- ✅ Template control flow (@if, @for, @switch)

### `frontend/web-client/AGENTS.md`
- ✅ SSR considerations
- ✅ Tailwind CSS setup
- ✅ Platform detection para browser APIs
- ✅ Component patterns para SSR
- ✅ Backend integration

### `backend/AGENTS.md`
- ✅ Arquitectura completa
- ✅ 17+ microservicios descriptos
- ✅ Service structure pattern
- ✅ Database strategy (one per service)
- ✅ Event-driven communication
- ✅ REST patterns
- ✅ Testing & debugging

### `docs/agents/AGENTS.md` (HUB)
- ✅ Routing a cada proyecto
- ✅ Quick commands (Docker, npm, Maven)
- ✅ Task routing guide
- ✅ Integration points (Frontend ↔ Backend)
- ✅ Code standards summary
- ✅ Common scenarios

---

## 🔐 Verificación de Acceso

### ✅ Test: ¿Puede un agente en ecommerce acceder a skills?

```bash
# Rutas relativas desde frontend/ecommerce/
../../.agents/skills/frontend-design/SKILL.md      ✅ ACCESIBLE
../../.agents/skills/accessibility/SKILL.md       ✅ ACCESIBLE
../../.agents/skills/seo/SKILL.md                 ✅ ACCESIBLE
../../.copilot-instructions.md                     ✅ ACCESIBLE
```

### ✅ Test: ¿Puede encontrar guía de proyecto?

```bash
# Desde frontend/ecommerce/
./AGENTS.md                                         ✅ ACCESIBLE
./.instructions.md                                  ✅ ACCESIBLE
../../docs/agents/AGENTS.md (HUB)                  ✅ ACCESIBLE
```

---

## 📊 Diagrama de Jerarquía

```
┌─────────────────────────────────────────────────────────┐
│           .copilot-instructions.md (GLOBAL)             │
│        ← Punto de entrada para todos los agentes →      │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┬─────────────┬──────────────┐
    │                 │             │              │
    ▼                 ▼             ▼              ▼
┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
│ E-commerce │  │ Web Client  │  │ Backend  │  │ Doc Hub  │
│ AGENTS.md  │  │ AGENTS.md   │  │AGENTS.md │  │AGENTS.md │
└──┬─────────┘  └────┬────────┘  └──────────┘  └──────────┘
   │                 │
   ▼                 ▼
┌────────────┐  ┌─────────────┐
│.instructions│  │ (no sub file)│
│  .md       │  └─────────────┘
└────────────┘
   │
   └─ References →─────────────────────┐
       ├─ .agents/skills/frontend-design/
       ├─ .agents/skills/accessibility/
       └─ .agents/skills/seo/
```

---

## 🎯 Resumen de Cambios

| Archivo | Estado | Propósito |
|---------|--------|----------|
| `.copilot-instructions.md` | 🆕 CREADO | Config global + skill routing |
| `frontend/ecommerce/AGENTS.md` | ✏️ MODIFICADO | Guía proyecto ecommerce |
| `frontend/ecommerce/.instructions.md` | 🆕 CREADO | Estándares código ecommerce |
| `frontend/web-client/AGENTS.md` | 🆕 CREADO | Guía proyecto web-client |
| `backend/AGENTS.md` | 🆕 CREADO | Guía proyecto backend |
| `docs/agents/AGENTS.md` | ✏️ MODIFICADO | HUB central mejorado |

---

## ✨ Beneficios de Esta Estructura

1. **Clear Navigation**: Agentes saben por dónde empezar
2. **Consistent Access**: Skills siempre en `.agents/skills/`
3. **Project-Specific Context**: Cada proyecto tiene su AGENTS.md
4. **Global Guidelines**: `.copilot-instructions.md` une todo
5. **Scalable**: Fácil agregar nuevos proyectos o skills
6. **Accessible**: Rutas relativas desde cualquier ubicación
7. **Documented**: Cada archivo explica su propósito

---

## 🚀 Próximos Pasos (Opcionales)

- [ ] Crear `.instructions.md` para web-client (si es necesario)
- [ ] Agregar ejemplos de código en AGENTS.md
- [ ] Crear skill adicional para testing
- [ ] Crear skill para performance optimization