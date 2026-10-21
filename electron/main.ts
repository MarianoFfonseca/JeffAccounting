import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient, type Client } from "@libsql/client";

app.setName("JeffAccounting");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

// Storage path in user's AppData/UserData
function getDataFilePath(): string {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "jeffaccounting-data.json");
}

function readDataFile(): string {
  const filePath = getDataFilePath();
  if (!fs.existsSync(filePath)) {
    const initialData = JSON.stringify(
      {
        movements: [
          {
            id: "mov-1",
            date: "2026-10-03",
            description: "Aporte de capital",
            amount: 1000,
            type: "ingreso_capital",
            method: "banco",
            applyVat: false,
            createdAt: "2026-10-03T08:00:00.000Z",
          },
          {
            id: "mov-2",
            date: "2026-10-03",
            description: "Venta producto",
            amount: 100,
            type: "venta",
            method: "banco",
            applyVat: true,
            createdAt: "2026-10-03T10:00:00.000Z",
          },
          {
            id: "mov-3",
            date: "2026-10-03",
            description: "Compra material",
            amount: 30,
            type: "compra",
            method: "banco",
            applyVat: true,
            createdAt: "2026-10-03T11:00:00.000Z",
          },
          {
            id: "mov-4",
            date: "2026-10-04",
            description: "Software",
            amount: 20,
            type: "gasto",
            method: "banco",
            applyVat: true,
            createdAt: "2026-10-04T09:00:00.000Z",
          },
          {
            id: "mov-5",
            date: "2026-10-04",
            description: "Préstamo bancario",
            amount: 500,
            type: "prestamo",
            method: "banco",
            applyVat: false,
            createdAt: "2026-10-04T12:00:00.000Z",
          },
        ],
      },
      null,
      2,
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, initialData, "utf-8");
    return initialData;
  }
  return fs.readFileSync(filePath, "utf-8");
}

function writeDataFile(content: string): boolean {
  const filePath = getDataFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

let win: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, "preload.mjs"))
    ? path.join(__dirname, "preload.mjs")
    : path.join(__dirname, "preload.js");

  const appRoot = process.env.APP_ROOT || path.join(__dirname, "..");
  const icoPath = path.join(appRoot, "public", "Logo.ico");
  const pngPath = path.join(appRoot, "public", "Logo.png");
  const windowIcon = fs.existsSync(icoPath)
    ? icoPath
    : fs.existsSync(pngPath)
      ? pngPath
      : undefined;

  win = new BrowserWindow({
    title: "JeffAccounting",
    icon: windowIcon,
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#f9fafb",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(
      path.join(
        process.env.APP_ROOT || path.join(__dirname, ".."),
        "dist",
        "index.html",
      ),
    );
  }
}

// Turso Config and Database Management
function getTursoConfigFilePath(): string {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "turso-config.json");
}

function readTursoConfig(): { url: string; authToken: string } {
  try {
    const configPath = getTursoConfigFilePath();
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return {
        url: data.url || process.env.TURSO_DATABASE_URL || "",
        authToken: data.authToken || process.env.TURSO_AUTH_TOKEN || "",
      };
    }
  } catch (err) {
    console.error("Error reading turso-config.json:", err);
  }
  return {
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || "",
  };
}

function writeTursoConfig(config: { url: string; authToken: string }): void {
  const configPath = getTursoConfigFilePath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

let cachedClient: Client | null = null;
let currentClientConfig = { url: "", authToken: "" };

function getTursoClient(configOverride?: { url: string; authToken: string }): Client {
  const config = configOverride || readTursoConfig();
  if (!config.url || !config.url.trim()) {
    throw new Error("No se ha configurado la URL de la base de datos de Turso. Configúrala en la aplicación.");
  }

  if (
    cachedClient &&
    !configOverride &&
    currentClientConfig.url === config.url &&
    currentClientConfig.authToken === config.authToken
  ) {
    return cachedClient;
  }

  const client = createClient({
    url: config.url.trim(),
    authToken: config.authToken ? config.authToken.trim() : undefined,
  });

  if (!configOverride) {
    cachedClient = client;
    currentClientConfig = { ...config };
  }

  return client;
}

async function initTursoSchema(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      method TEXT NOT NULL,
      subgroup TEXT,
      apply_vat INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_movements_company ON movements(company_id);
  `);
}

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "_jeff_accounting_salt_2026")
    .digest("hex");
}

// IPC Handlers
ipcMain.handle("load-data", async () => {
  try {
    const raw = readDataFile();
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading data:", err);
    return { movements: [] };
  }
});

ipcMain.handle("save-data", async (_event, data) => {
  try {
    const content = JSON.stringify(data, null, 2);
    writeDataFile(content);
    return { success: true };
  } catch (err) {
    console.error("Error saving data:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("get-storage-path", async () => {
  return getDataFilePath();
});

ipcMain.handle("open-data-folder", async () => {
  const filePath = getDataFilePath();
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
  } else {
    shell.openPath(path.dirname(filePath));
  }
  return true;
});

// Turso IPC Handlers
ipcMain.handle("turso-get-config", async () => {
  return readTursoConfig();
});

ipcMain.handle("turso-save-config", async (_event, config: { url: string; authToken: string }) => {
  try {
    writeTursoConfig(config);
    cachedClient = null;
    const client = getTursoClient(config);
    await initTursoSchema(client);
    return { success: true };
  } catch (err) {
    console.error("Error saving Turso config:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-check-connection", async (_event, configOverride?: { url: string; authToken: string }) => {
  try {
    const client = getTursoClient(configOverride);
    await client.execute("SELECT 1;");
    await initTursoSchema(client);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-login", async (_event, companyId: string, password: string) => {
  try {
    const client = getTursoClient();
    await initTursoSchema(client);
    const cleanId = companyId.trim().toLowerCase();
    const res = await client.execute({
      sql: "SELECT id, name, password_hash, created_at FROM companies WHERE id = ? LIMIT 1;",
      args: [cleanId],
    });
    if (res.rows.length === 0) {
      return { success: false, error: "La empresa con este ID no existe." };
    }
    const row = res.rows[0];
    const passwordHash = hashPassword(password);
    if (row.password_hash !== passwordHash) {
      return { success: false, error: "Contraseña incorrecta." };
    }
    return {
      success: true,
      company: {
        id: String(row.id),
        name: String(row.name),
        createdAt: String(row.created_at),
      },
    };
  } catch (err) {
    console.error("Error in turso-login:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-register", async (_event, companyId: string, name: string, password: string) => {
  try {
    const client = getTursoClient();
    await initTursoSchema(client);
    const cleanId = companyId.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanId) return { success: false, error: "El ID de la empresa es obligatorio." };
    if (!cleanName) return { success: false, error: "El nombre de la empresa es obligatorio." };
    if (!password || password.length < 4) {
      return { success: false, error: "La contraseña debe tener al menos 4 caracteres." };
    }

    const existing = await client.execute({
      sql: "SELECT id FROM companies WHERE id = ? LIMIT 1;",
      args: [cleanId],
    });
    if (existing.rows.length > 0) {
      return {
        success: false,
        error: "Ya existe una empresa registrada con ese ID. Por favor, introduce otro ID o inicia sesión.",
      };
    }

    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();
    await client.execute({
      sql: "INSERT INTO companies (id, name, password_hash, created_at) VALUES (?, ?, ?, ?);",
      args: [cleanId, cleanName, passwordHash, createdAt],
    });

    return {
      success: true,
      company: {
        id: cleanId,
        name: cleanName,
        createdAt,
      },
    };
  } catch (err) {
    console.error("Error in turso-register:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-get-movements", async (_event, companyId: string) => {
  try {
    const client = getTursoClient();
    await initTursoSchema(client);
    const res = await client.execute({
      sql: `SELECT id, company_id, date, description, amount, type, method, subgroup, apply_vat, created_at
            FROM movements WHERE company_id = ?
            ORDER BY date DESC, created_at DESC;`,
      args: [companyId.trim().toLowerCase()],
    });

    const movements = res.rows.map((row) => ({
      id: String(row.id),
      companyId: String(row.company_id),
      date: String(row.date),
      description: String(row.description),
      amount: Number(row.amount),
      type: String(row.type) as any,
      method: String(row.method) as any,
      subgroup: row.subgroup ? String(row.subgroup) : undefined,
      applyVat: Boolean(row.apply_vat),
      createdAt: row.created_at ? String(row.created_at) : undefined,
    }));

    return { success: true, movements };
  } catch (err) {
    console.error("Error in turso-get-movements:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-save-movement", async (_event, companyId: string, movement: any) => {
  try {
    const client = getTursoClient();
    await initTursoSchema(client);
    await client.execute({
      sql: `INSERT INTO movements (id, company_id, date, description, amount, type, method, subgroup, apply_vat, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              date = excluded.date,
              description = excluded.description,
              amount = excluded.amount,
              type = excluded.type,
              method = excluded.method,
              subgroup = excluded.subgroup,
              apply_vat = excluded.apply_vat,
              created_at = excluded.created_at;`,
      args: [
        movement.id,
        companyId.trim().toLowerCase(),
        movement.date,
        movement.description,
        Number(movement.amount),
        movement.type,
        movement.method,
        movement.subgroup || null,
        movement.applyVat ? 1 : 0,
        movement.createdAt || new Date().toISOString(),
      ],
    });
    return { success: true };
  } catch (err) {
    console.error("Error in turso-save-movement:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

ipcMain.handle("turso-delete-movement", async (_event, companyId: string, movementId: string) => {
  try {
    const client = getTursoClient();
    await initTursoSchema(client);
    await client.execute({
      sql: "DELETE FROM movements WHERE id = ? AND company_id = ?;",
      args: [movementId, companyId.trim().toLowerCase()],
    });
    return { success: true };
  } catch (err) {
    console.error("Error in turso-delete-movement:", err);
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
