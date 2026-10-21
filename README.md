# 📊 Jeff Accounting

> Contabilidad empresarial simple, rápida y bajo tu control absoluto.

**Jeff Accounting** es una herramienta pensada para freelancers, pymes y negocios que buscan llevar el control de sus finanzas sin lidiar con interfaces infladas ni suscripciones mensuales abusivas.

A diferencia de los programas tradicionales, **tú eres el único dueño de tu información**: conectas tu propia base de datos con **Turso (libSQL)** y gestionas tus movimientos con total privacidad y velocidad instantánea.

---

## ⚡ ¿Por qué Jeff Accounting?

- **Control de ingresos y egresos:** Registra movimientos, clasifica categorías y visualiza flujos de caja en segundos.
- **Tus datos te pertenecen (BYOD - Bring Your Own Database):** Conexión directa a tu base de datos Turso. Sin intermediarios ni accesos de terceros a tus balances.
- **Rápido y ligero:** Cero burocracia técnica, carga instantánea y diseño limpio.
- **Sin costes ocultos:** Aprovecha el generoso plan gratuito de Turso y mantén tus gastos en $0/mes.

---

## 🚀 Guía de inicio rápido

Para comenzar a utilizar **Jeff Accounting**, solo necesitas completar dos pasos:

### 1. Crear tu cuenta en Jeff Accounting

1. Ingresa a la plataforma y haz clic en **Registrarse**.
2. Ingresa tu correo y contraseña.
3. Al entrar por primera vez, verás el panel de **Configuración de Base de Datos**. Aquí es donde ingresarás tu `Database URL` y tu `Auth Token` de Turso.

---

### 2. Obtener tu URL y Token en Turso

Turso es un servicio de base de datos SQLite en el borde (Edge), rápido y con un plan gratuito que sobra para cualquier pequeña/mediana empresa. Puedes configurarlo desde el panel web o desde la terminal.

#### Opción A: Desde el navegador (Web Dashboard)

1. **Crea tu cuenta:**
   - Entra en [turso.tech](https://turso.tech) y haz clic en **Sign Up**.
   - Inicia sesión con tu cuenta de GitHub o correo electrónico.
2. **Crea una nueva base de datos:**
   - En tu panel principal (_Dashboard_), haz clic en **Create Database**.
   - Asigna un nombre (por ejemplo: `jeff-accounting-db`) y selecciona la región geográfica más cercana a tu negocio.
   - Haz clic en **Create**.
3. **Copia la Database URL:**
   - Dentro de la vista general de tu base de datos, verás el campo **Database URL** (empieza por `libsql://...` o `https://...`). Cópialo.
4. **Genera el Token de Autenticación:**
   - Ve a la pestaña **Auth Tokens** o **Connect** dentro de la base de datos.
   - Haz clic en **Create Token** (puedes seleccionarlo sin expiración o por tiempo prolongado).
   - Copia la cadena generada (aparece solo una vez).

---

#### Opción B: Desde la Terminal (CLI)

Si prefieres usar la terminal, el proceso toma menos de 1 minuto:

1. **Instala la CLI de Turso:**

   ```bash
   # En macOS / Linux:
   curl -sSfL [https://get.tur.so/install.sh](https://get.tur.so/install.sh) | bash

   # En Windows (PowerShell):
   irm [https://get.tur.so/install.ps1](https://get.tur.so/install.ps1) | iex
   ```

2. **Inicia sesión o regístrate:**

   ```bash
   turso auth signup   # o 'turso auth login' si ya tienes cuenta
   ```

3. **Crea tu base de datos:**

   ```bash
   turso db create jeff-accounting-db
   ```

4. **Obtén la URL:**

   ```bash
   turso db show jeff-accounting-db --url
   # Ejemplo de salida: libsql://jeff-accounting-db-[tu-usuario].turso.io
   ```

5. **Genera el Token de acceso:**
   ```bash
   turso db tokens create jeff-accounting-db
   # Copia el token largo que se imprime en pantalla
   ```

---

### 3. Conectar y empezar

1. Vuelve a la pantalla de configuración de **Jeff Accounting**.
2. Pega tu **Database URL** y tu **Auth Token**.
3. Haz clic en **Conectar base de datos**.
4. ¡Listo! Las tablas requeridas se inicializarán automáticamente y podrás empezar a registrar tus primeros movimientos contables.

---

## 🔒 Privacidad y Seguridad

Tus credenciales de Turso se almacenan de forma segura para comunicar tu sesión directamente EN LOCAL. Nadie más tiene acceso de lectura ni escritura a tu contabilidad.

---

## 💬 Soporte y Contacto

¿Tienes preguntas, sugerencias o encontraste un fallo?

Dejanoslo saber!
