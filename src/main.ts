interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  status: BookStatus;
  readingSeconds?: number;
  pagesRead?: number;
  pageCount?: number;
  currentPage?: number;
  addedAt?: number;
  coverUrl?: string | null;
  series?: string;
  seriesNumber?: string;
  authorLanguage?: string;
}

type BookStatus = "Pendiente" | "Leyendo" | "Terminado" | "Deseado";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface TimerState {
  bookId: string;
  elapsedSeconds: number;
  startedAt: number | null;
  startPage: number;
}

type Palette = "libreria" | "bosque" | "oceano";
type FontStyle = "modern" | "classic";
type Density = "comfortable" | "compact";
type MotionPreference = "system" | "reduced";
type ContrastPreference = "standard" | "high";
type CornerStyle = "rounded" | "square";
type ThemePreference = "light" | "dark";

interface Customization {
  fontStyle: FontStyle;
  density: Density;
  motion: MotionPreference;
  contrast: ContrastPreference;
  cornerStyle: CornerStyle;
  keepScreenOn: boolean;
  theme: ThemePreference;
}

interface AppBackup {
  format: "entre-lineas-backup";
  version: 1 | 2;
  exportedAt: string;
  palette: Palette;
  books: Book[];
  timer: TimerState | null;
  fontStyle?: FontStyle;
  density?: Density;
  motion?: MotionPreference;
  contrast?: ContrastPreference;
  cornerStyle?: CornerStyle;
  keepScreenOn?: boolean;
  theme?: ThemePreference;
}

interface BookMetadata {
  title: string;
  author: string;
  coverUrl: string | null;
  series: string;
  seriesNumber: string;
  pageCount: number | null;
}

interface OpenLibraryAuthor {
  name?: string;
  url?: string;
}

interface OpenLibraryBook {
  title?: string;
  authors?: OpenLibraryAuthor[];
  cover?: { medium?: string; large?: string; small?: string };
  series?: string[] | string;
  series_position?: string | number;
  number_of_pages?: number;
}

interface OpenLibraryAuthorRecord {
  remote_ids?: { wikidata?: string };
  personal_name?: string;
  alternate_names?: unknown[];
}

interface WikidataResponse {
  entities?: Record<string, { labels?: { es?: { value?: string } } }>;
}

interface OpenLibraryEdition {
  works?: { key?: string }[];
}

interface OpenLibraryWork {
  series?: { series?: { key?: string }; position?: string | number }[];
  subjects?: string[];
}

interface OpenLibrarySearchDoc {
  title?: string;
  author_name?: string[];
  author_key?: string[];
  isbn?: string[];
  cover_i?: number;
  language?: string[];
  number_of_pages_median?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

interface GoogleBooksVolume {
  volumeInfo?: {
    industryIdentifiers?: { identifier?: string }[];
    language?: string;
    title?: string;
    pageCount?: number;
    authors?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    series?: string[] | string;
    seriesInfo?: {
      volumeSeries?: { orderNumber?: number }[];
      shortSeriesBookTitle?: string;
      bookDisplayNumber?: string | number;
    };
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

interface BookSearchResult extends BookMetadata {
  isbn: string;
  language: string;
  source: string;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

interface ZXingControls {
  stop(): void;
}

interface ZXingResult {
  getText(): string;
}

interface ZXingReader {
  decodeFromVideoElement(
    video: HTMLVideoElement,
    callback: (result: ZXingResult | null) => void
  ): Promise<ZXingControls>;
}

interface ZXingBrowserApi {
  BrowserMultiFormatOneDReader: new () => ZXingReader;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats(): Promise<string[]>;
    };
    ZXingBrowser?: ZXingBrowserApi;
  }
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No se encontró el elemento #${id}.`);
  return element as T;
}

function isBookStatus(value: string): value is BookStatus {
  return value === "Pendiente" || value === "Leyendo" || value === "Terminado" || value === "Deseado";
}

(() => {
  "use strict";

      const STORAGE_KEY = "entre-lineas-library-v1";
      const TIMER_KEY = "entre-lineas-timer-v1";
      const PALETTE_KEY = "entre-lineas-palette-v1";
      const CUSTOMIZATION_KEY = "entre-lineas-customization-v1";
      const STORE_PRICES_KEY = "entre-lineas-store-prices-v1";
      const DEFAULT_CUSTOMIZATION: Customization = {
        fontStyle: "modern",
        density: "comfortable",
        motion: "system",
        contrast: "standard",
        cornerStyle: "rounded",
        keepScreenOn: false,
        theme: "light"
      };
      const coverColors = ["#667763", "#a76c51", "#6f7791", "#b08e56", "#597e79", "#8d6474"];
      const elements = {
        form: getElement<HTMLFormElement>("book-form"),
        bookSearchForm: getElement<HTMLFormElement>("book-search-form"),
        bookSearchInput: getElement<HTMLInputElement>("book-search-query"),
        bookSearchStatus: getElement<HTMLElement>("book-search-status"),
        amazonSearchLink: getElement<HTMLAnchorElement>("amazon-search-link"),
        bookSearchResults: getElement<HTMLElement>("book-search-results"),
        isbn: getElement<HTMLInputElement>("isbn"),
        title: getElement<HTMLInputElement>("title"),
        author: getElement<HTMLInputElement>("author"),
        status: getElement<HTMLSelectElement>("status"),
        formError: getElement<HTMLElement>("form-error"),
        formStatus: getElement<HTMLElement>("form-status"),
        grid: getElement<HTMLElement>("book-grid"),
        progressHours: getElement<HTMLElement>("progress-total-hours"),
        progressPages: getElement<HTMLElement>("progress-total-pages"),
        progressBooks: getElement<HTMLElement>("progress-active-books"),
        hoursChart: getElement<HTMLOListElement>("hours-chart"),
        pagesChart: getElement<HTMLOListElement>("pages-chart"),
        progressDialog: getElement<HTMLDialogElement>("progress-dialog"),
        progressBookTitle: getElement<HTMLElement>("progress-book-title"),
        progressForm: getElement<HTMLFormElement>("progress-form"),
        pagesRead: getElement<HTMLInputElement>("pages-read"),
        pageCount: getElement<HTMLInputElement>("page-count"),
        progressFormError: getElement<HTMLElement>("progress-form-error"),
        progressClose: getElement<HTMLButtonElement>("progress-close"),
        progressCancel: getElement<HTMLButtonElement>("progress-cancel"),
        timerStartPage: getElement<HTMLInputElement>("timer-start-page"),
        sessionDialog: getElement<HTMLDialogElement>("session-dialog"),
        sessionForm: getElement<HTMLFormElement>("session-form"),
        sessionBookTitle: getElement<HTMLElement>("session-book-title"),
        sessionStartPage: getElement<HTMLElement>("session-start-page"),
        sessionEndPage: getElement<HTMLInputElement>("session-end-page"),
        sessionFormError: getElement<HTMLElement>("session-form-error"),
        sessionClose: getElement<HTMLButtonElement>("session-close"),
        sessionCancel: getElement<HTMLButtonElement>("session-cancel"),
        search: getElement<HTMLInputElement>("search"),
        filter: getElement<HTMLSelectElement>("filter"),
        wishlistFilter: getElement<HTMLButtonElement>("wishlist-filter"),
        wishlistCount: getElement<HTMLElement>("wishlist-count"),
        storeGrid: getElement<HTMLElement>("store-grid"),
        paletteOptions: getElement<HTMLDivElement>("palette-options"),
        fontStyle: getElement<HTMLSelectElement>("font-style"),
        density: getElement<HTMLSelectElement>("library-density"),
        motion: getElement<HTMLSelectElement>("motion-preference"),
        contrast: getElement<HTMLSelectElement>("contrast-preference"),
        cornerStyle: getElement<HTMLSelectElement>("corner-style"),
        theme: getElement<HTMLSelectElement>("theme-preference"),
        keepScreenOn: getElement<HTMLInputElement>("keep-screen-on"),
        wakeLockStatus: getElement<HTMLElement>("wake-lock-status"),
        themeColor: getElement<HTMLMetaElement>("theme-color"),
        exportBackup: getElement<HTMLButtonElement>("export-backup"),
        importBackup: getElement<HTMLButtonElement>("import-backup"),
        backupFile: getElement<HTMLInputElement>("backup-file"),
        updateApp: getElement<HTMLButtonElement>("update-app"),
        settingsStatus: getElement<HTMLElement>("settings-status"),
        menuToggle: getElement<HTMLButtonElement>("menu-toggle"),
        menuClose: getElement<HTMLButtonElement>("menu-close"),
        menuBackdrop: getElement<HTMLButtonElement>("menu-backdrop"),
        sidebar: getElement<HTMLElement>("main-menu"),
        pageShell: getElement<HTMLElement>("page-shell"),
        timerBook: getElement<HTMLSelectElement>("timer-book"),
        timerDisplay: getElement<HTMLElement>("timer-display"),
        timerBookTitle: getElement<HTMLElement>("timer-book-title"),
        timerStatus: getElement<HTMLElement>("timer-status"),
        timerToggle: getElement<HTMLButtonElement>("timer-toggle"),
        timerSave: getElement<HTMLButtonElement>("timer-save"),
        timerReset: getElement<HTMLButtonElement>("timer-reset"),
        scanOpen: getElement<HTMLButtonElement>("scan-open"),
        scanClose: getElement<HTMLButtonElement>("scan-close"),
        scanCancel: getElement<HTMLButtonElement>("scan-cancel"),
        scannerDialog: getElement<HTMLDialogElement>("scanner-dialog"),
        scannerVideo: getElement<HTMLVideoElement>("scanner-video"),
        scannerMessage: getElement<HTMLElement>("scanner-message"),
        toast: getElement<HTMLElement>("toast")
      };

      let books = loadBooks();
      let timer = loadTimer();
      let palette = loadPalette();
      let customization = loadCustomization();
      let screenWakeLock: WakeLockSentinel | null = null;
      let wakeLockGeneration = 0;
      applyPalette(palette);
      applyCustomization(customization);
      let toastTimeout: number | null = null;
      let scannerStream: MediaStream | null = null;
      let scannerFrame: number | null = null;
      let scannerControls: ZXingControls | null = null;
      let scannerGeneration = 0;
      let zxingLoadPromise: Promise<ZXingBrowserApi> | null = null;
      let isbnLookupTimeout: number | null = null;
      let isbnLookupGeneration = 0;
      let bookSearchGeneration = 0;
      let bookSearchResults: BookSearchResult[] = [];
      let editingBookId: string | null = null;
      const localizedAuthorNameCache = new Map<string, Promise<string>>();

      function isBook(value: unknown): value is Book {
        if (typeof value !== "object" || value === null) return false;
        const book = value as Partial<Book>;
        return typeof book.id === "string" && typeof book.title === "string" &&
          typeof book.author === "string" && typeof book.isbn === "string" &&
          ["Pendiente", "Leyendo", "Terminado", "Deseado"].includes(book.status || "");
      }

      function isBookArray(value: unknown): value is Book[] {
        if (!Array.isArray(value)) return false;
        const ids = new Set<string>();
        return value.every((item: unknown) => {
          if (!isBook(item)) return false;
          const book = item;
          if (!book.id.trim() || !book.title.trim() || !book.author.trim() || ids.has(book.id)) return false;
          ids.add(book.id);
          if (book.coverUrl !== undefined && book.coverUrl !== null && typeof book.coverUrl !== "string") return false;
          if (book.series !== undefined && typeof book.series !== "string") return false;
          if (book.seriesNumber !== undefined && typeof book.seriesNumber !== "string") return false;
          if (book.authorLanguage !== undefined && typeof book.authorLanguage !== "string") return false;
          if (book.readingSeconds !== undefined && (!Number.isFinite(book.readingSeconds) || book.readingSeconds < 0)) return false;
          for (const count of [book.pagesRead, book.pageCount, book.currentPage, book.addedAt]) {
            if (count !== undefined && (!Number.isSafeInteger(count) || count < 0)) return false;
          }
          return book.pageCount === undefined || book.pageCount > 0;
        });
      }

      function isPalette(value: unknown): value is Palette {
        return value === "libreria" || value === "bosque" || value === "oceano";
      }

      function isFontStyle(value: unknown): value is FontStyle {
        return value === "modern" || value === "classic";
      }

      function isDensity(value: unknown): value is Density {
        return value === "comfortable" || value === "compact";
      }

      function isMotionPreference(value: unknown): value is MotionPreference {
        return value === "system" || value === "reduced";
      }

      function isContrastPreference(value: unknown): value is ContrastPreference {
        return value === "standard" || value === "high";
      }

      function isCornerStyle(value: unknown): value is CornerStyle {
        return value === "rounded" || value === "square";
      }

      function isThemePreference(value: unknown): value is ThemePreference {
        return value === "light" || value === "dark";
      }

      function isTimerState(value: unknown, candidateBooks: Book[]): value is TimerState {
        if (typeof value !== "object" || value === null) return false;
        const state = value as Partial<TimerState>;
        const book = candidateBooks.find(item => item.id === state.bookId);
        return typeof state.bookId === "string" && Boolean(book) &&
          typeof state.elapsedSeconds === "number" && Number.isFinite(state.elapsedSeconds) && state.elapsedSeconds >= 0 &&
          (state.startedAt === null || (typeof state.startedAt === "number" && Number.isFinite(state.startedAt) && state.startedAt >= 0)) &&
          typeof state.startPage === "number" && Number.isSafeInteger(state.startPage) && state.startPage > 0 &&
          (book?.pageCount === undefined || state.startPage <= book.pageCount);
      }

      function isAppBackup(value: unknown): value is AppBackup {
        if (typeof value !== "object" || value === null) return false;
        const backup = value as Record<string, unknown>;
        const backupBooks = backup.books;
        return backup.format === "entre-lineas-backup" &&
          (backup.version === 1 || backup.version === 2) &&
          typeof backup.exportedAt === "string" &&
          !Number.isNaN(Date.parse(backup.exportedAt)) &&
          isPalette(backup.palette) &&
          isBookArray(backupBooks) &&
          (backup.timer === null || isTimerState(backup.timer, backupBooks)) &&
          (backup.version === 1 ||
            (isFontStyle(backup.fontStyle) && isDensity(backup.density) && isMotionPreference(backup.motion))) &&
          (backup.contrast === undefined || isContrastPreference(backup.contrast)) &&
          (backup.cornerStyle === undefined || isCornerStyle(backup.cornerStyle)) &&
          (backup.keepScreenOn === undefined || typeof backup.keepScreenOn === "boolean") &&
          (backup.theme === undefined || isThemePreference(backup.theme));
      }

      function loadPalette(): Palette {
        try {
          const saved = localStorage.getItem(PALETTE_KEY);
          return isPalette(saved) ? saved : "libreria";
        } catch (error) {
          console.error("No se pudo recuperar la paleta de colores.", error);
          return "libreria";
        }
      }

      function loadCustomization(): Customization {
        try {
          const saved: unknown = JSON.parse(localStorage.getItem(CUSTOMIZATION_KEY) || "null");
          if (typeof saved !== "object" || saved === null) return { ...DEFAULT_CUSTOMIZATION };
          const values = saved as Partial<Customization>;
          return {
            fontStyle: isFontStyle(values.fontStyle) ? values.fontStyle : DEFAULT_CUSTOMIZATION.fontStyle,
            density: isDensity(values.density) ? values.density : DEFAULT_CUSTOMIZATION.density,
            motion: isMotionPreference(values.motion) ? values.motion : DEFAULT_CUSTOMIZATION.motion,
            contrast: isContrastPreference(values.contrast) ? values.contrast : DEFAULT_CUSTOMIZATION.contrast,
            cornerStyle: isCornerStyle(values.cornerStyle) ? values.cornerStyle : DEFAULT_CUSTOMIZATION.cornerStyle,
            keepScreenOn: typeof values.keepScreenOn === "boolean" ? values.keepScreenOn : DEFAULT_CUSTOMIZATION.keepScreenOn,
            theme: isThemePreference(values.theme) ? values.theme : DEFAULT_CUSTOMIZATION.theme
          };
        } catch (error) {
          console.error("No se pudieron recuperar las preferencias de apariencia.", error);
          return { ...DEFAULT_CUSTOMIZATION };
        }
      }

      function updateBrowserThemeColor(): void {
        const lightThemeColor = palette === "bosque" ? "#263f31" : palette === "oceano" ? "#213f55" : "#39251e";
        elements.themeColor.content = customization.theme === "dark" ? "#171613" : lightThemeColor;
      }

      function applyPalette(value: Palette): void {
        document.documentElement.dataset.palette = value;
        updateBrowserThemeColor();
        for (const input of elements.paletteOptions.querySelectorAll<HTMLInputElement>('input[name="palette"]')) {
          input.checked = input.value === value;
        }
      }

      function applyCustomization(value: Customization): void {
        const root = document.documentElement;
        root.dataset.fontStyle = value.fontStyle;
        root.dataset.density = value.density;
        root.dataset.motion = value.motion;
        root.dataset.contrast = value.contrast;
        root.dataset.cornerStyle = value.cornerStyle;
        root.dataset.theme = value.theme;
        elements.keepScreenOn.checked = value.keepScreenOn;
        elements.fontStyle.value = value.fontStyle;
        elements.density.value = value.density;
        elements.motion.value = value.motion;
        elements.contrast.value = value.contrast;
        elements.cornerStyle.value = value.cornerStyle;
        elements.theme.value = value.theme;
        updateBrowserThemeColor();
      }

      function saveCustomization(value: Customization): void {
        try {
          localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(value));
        } catch (error) {
          console.error("No se pudieron guardar las preferencias de apariencia.", error);
          applyCustomization(customization);
          setSettingsStatus("No se pudieron guardar las preferencias. Revisa el almacenamiento del navegador.", "error");
          return;
        }
        customization = value;
        applyCustomization(customization);
        setSettingsStatus("Preferencias de apariencia actualizadas.");
      }

      async function syncScreenWakeLock(): Promise<void> {
        const generation = ++wakeLockGeneration;
        if (!customization.keepScreenOn) {
          const currentLock = screenWakeLock;
          screenWakeLock = null;
          if (currentLock && !currentLock.released) {
            try {
              await currentLock.release();
            } catch (error) {
              console.error("No se pudo liberar el bloqueo de pantalla.", error);
              elements.wakeLockStatus.textContent = "No se pudo liberar el bloqueo de pantalla.";
              return;
            }
          }
          elements.wakeLockStatus.textContent = "La pantalla se apagará según la configuración del dispositivo.";
          return;
        }

        if (!window.isSecureContext || !("wakeLock" in navigator)) {
          elements.wakeLockStatus.textContent = "Este navegador o contexto no admite mantener la pantalla encendida.";
          return;
        }

        if (document.visibilityState !== "visible") {
          const currentLock = screenWakeLock;
          screenWakeLock = null;
          if (currentLock && !currentLock.released) {
            try {
              await currentLock.release();
            } catch (error) {
              console.error("No se pudo liberar el bloqueo al salir de la app.", error);
            }
          }
          elements.wakeLockStatus.textContent = "Se intentará mantenerla encendida al volver a la app.";
          return;
        }

        if (screenWakeLock && !screenWakeLock.released) {
          elements.wakeLockStatus.textContent = "La pantalla permanecerá encendida mientras Entre Líneas esté visible.";
          return;
        }

        try {
          const requestedLock = await navigator.wakeLock.request("screen");
          if (generation !== wakeLockGeneration || !customization.keepScreenOn || document.visibilityState !== "visible") {
            await requestedLock.release();
            return;
          }
          screenWakeLock = requestedLock;
          requestedLock.addEventListener("release", () => {
            if (screenWakeLock === requestedLock) screenWakeLock = null;
            if (customization.keepScreenOn) {
              elements.wakeLockStatus.textContent = document.visibilityState === "visible"
                ? "El sistema liberó el bloqueo de pantalla."
                : "Se intentará mantenerla encendida al volver a la app.";
            }
          }, { once: true });
          elements.wakeLockStatus.textContent = "La pantalla permanecerá encendida mientras Entre Líneas esté visible.";
        } catch (error) {
          console.warn("No se pudo mantener la pantalla encendida.", error);
          elements.wakeLockStatus.textContent = "El navegador o el sistema no permitió mantener la pantalla encendida.";
        }
      }

      function setupScreenWakeLock(): void {
        const supported = window.isSecureContext && "wakeLock" in navigator;
        elements.keepScreenOn.disabled = !supported;
        if (!supported) {
          elements.wakeLockStatus.textContent = "Esta opción requiere un navegador compatible y una conexión segura (HTTPS).";
          return;
        }

        elements.keepScreenOn.addEventListener("change", () => {
          const keepScreenOn = elements.keepScreenOn.checked;
          saveCustomization({ ...customization, keepScreenOn });
          if (customization.keepScreenOn !== keepScreenOn) return;
          void syncScreenWakeLock();
        });
        document.addEventListener("visibilitychange", () => {
          void syncScreenWakeLock();
        });
        void syncScreenWakeLock();
      }

      function setSettingsStatus(message: string, state = ""): void {
        elements.settingsStatus.textContent = message;
        elements.settingsStatus.dataset.state = state;
      }

      function loadBooks(): Book[] {
        try {
          const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          return Array.isArray(parsed) ? parsed.filter(isBook) : [];
        } catch (error) {
          console.error("No se pudo leer la biblioteca guardada.", error);
          return [];
        }
      }

      function loadTimer(): TimerState | null {
        try {
          const saved: unknown = JSON.parse(localStorage.getItem(TIMER_KEY) || "null");
          if (typeof saved !== "object" || saved === null) return null;
          const state = saved as Partial<TimerState>;
          if (typeof state.bookId !== "string") return null;
          const book = books.find(item => item.id === state.bookId);
          if (!book) return null;
          if (!Number.isFinite(state.elapsedSeconds) || (state.elapsedSeconds ?? -1) < 0) return null;
          if (state.startedAt !== null && !Number.isFinite(state.startedAt)) return null;
          return {
            bookId: state.bookId,
            elapsedSeconds: state.elapsedSeconds as number,
            startedAt: state.startedAt ?? null,
            startPage: typeof state.startPage === "number" && Number.isSafeInteger(state.startPage) && state.startPage > 0
              ? state.startPage
              : getNextPage(book)
          };
        } catch (error) {
          console.error("No se pudo recuperar el temporizador.", error);
          return null;
        }
      }

      function saveBooks() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        } catch (error) {
          console.error("No se pudo guardar la biblioteca.", error);
          showToast("No se pudieron guardar los cambios. Revisa el almacenamiento del navegador.");
        }
      }

      function saveTimer() {
        try {
          if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
          else localStorage.removeItem(TIMER_KEY);
        } catch (error) {
          console.error("No se pudo guardar el temporizador.", error);
          showToast("No se pudo guardar el temporizador.");
        }
      }

      function persistBackup(backup: AppBackup): boolean {
        const keys = [STORAGE_KEY, TIMER_KEY, PALETTE_KEY, CUSTOMIZATION_KEY];
        const previousValues = new Map<string, string | null>();
        try {
          for (const key of keys) previousValues.set(key, localStorage.getItem(key));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.books));
          if (backup.timer) localStorage.setItem(TIMER_KEY, JSON.stringify(backup.timer));
          else localStorage.removeItem(TIMER_KEY);
          localStorage.setItem(PALETTE_KEY, backup.palette);
          const importedCustomization: Customization = {
            fontStyle: backup.fontStyle ?? DEFAULT_CUSTOMIZATION.fontStyle,
            density: backup.density ?? DEFAULT_CUSTOMIZATION.density,
            motion: backup.motion ?? DEFAULT_CUSTOMIZATION.motion,
            contrast: backup.contrast ?? DEFAULT_CUSTOMIZATION.contrast,
            cornerStyle: backup.cornerStyle ?? DEFAULT_CUSTOMIZATION.cornerStyle,
            keepScreenOn: backup.keepScreenOn ?? DEFAULT_CUSTOMIZATION.keepScreenOn,
            theme: backup.theme ?? DEFAULT_CUSTOMIZATION.theme
          };
          localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(importedCustomization));
          return true;
        } catch (error) {
          console.error("No se pudo cargar el respaldo en el almacenamiento local.", error);
          let rollbackComplete = true;
          try {
            for (const key of keys) {
              const previousValue = previousValues.get(key);
              if (previousValue === undefined) continue;
              if (previousValue === null) localStorage.removeItem(key);
              else localStorage.setItem(key, previousValue);
            }
          } catch (rollbackError) {
            rollbackComplete = false;
            console.error("No se pudo restaurar el almacenamiento anterior después del error.", rollbackError);
          }
          setSettingsStatus(
            rollbackComplete
              ? "No pudimos guardar el respaldo; tus datos actuales siguen disponibles."
              : "Falló el guardado y la restauración automática. Revisa el almacenamiento antes de continuar.",
            "error"
          );
          return false;
        }
      }

      function downloadBackup(): void {
        try {
          const backup: AppBackup = {
            format: "entre-lineas-backup",
            version: 2,
            exportedAt: new Date().toISOString(),
            palette,
            books,
            timer,
            ...customization
          };
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `entre-lineas-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          setSettingsStatus("Respaldo descargado correctamente.");
        } catch (error) {
          console.error("No se pudo descargar el respaldo de la biblioteca.", error);
          setSettingsStatus("No pudimos descargar el respaldo. Inténtalo de nuevo.", "error");
        }
      }

      async function importBackup(file: File): Promise<void> {
        let parsed: unknown;
        try {
          parsed = JSON.parse(await file.text());
        } catch (error) {
          console.error("No se pudo leer el archivo de respaldo como JSON válido.", error);
          setSettingsStatus("El archivo no se pudo leer o no contiene JSON válido.", "error");
          return;
        }

        if (!isAppBackup(parsed)) {
          console.error("El archivo seleccionado no tiene un formato de respaldo compatible.");
          setSettingsStatus("El archivo no es un respaldo válido de Entre Líneas.", "error");
          return;
        }
        if (!window.confirm("Esto reemplazará la biblioteca, la sesión del temporizador y las preferencias actuales. ¿Quieres continuar?")) {
          setSettingsStatus("Importación cancelada; no se modificaron los datos.");
          return;
        }
        if (!persistBackup(parsed)) return;
        books = parsed.books;
        timer = parsed.timer;
        palette = parsed.palette;
        applyPalette(palette);
        customization = {
          fontStyle: parsed.fontStyle ?? DEFAULT_CUSTOMIZATION.fontStyle,
          density: parsed.density ?? DEFAULT_CUSTOMIZATION.density,
          motion: parsed.motion ?? DEFAULT_CUSTOMIZATION.motion,
          contrast: parsed.contrast ?? DEFAULT_CUSTOMIZATION.contrast,
          cornerStyle: parsed.cornerStyle ?? DEFAULT_CUSTOMIZATION.cornerStyle,
          keepScreenOn: parsed.keepScreenOn ?? DEFAULT_CUSTOMIZATION.keepScreenOn,
          theme: parsed.theme ?? DEFAULT_CUSTOMIZATION.theme
        };
        applyCustomization(customization);
        void syncScreenWakeLock();
        render();
        setSettingsStatus("Biblioteca y configuración restauradas correctamente.");
      }

      function validIsbn(value: string): boolean {
        const isbn = value.replace(/[\s-]/g, "").toUpperCase();
        if (/^\d{13}$/.test(isbn)) {
          let sum = 0;
          for (let index = 0; index < 12; index++) sum += Number(isbn[index]) * (index % 2 === 0 ? 1 : 3);
          return (10 - sum % 10) % 10 === Number(isbn[12]);
        }
        if (/^\d{9}[\dX]$/.test(isbn)) {
          let sum = 0;
          for (let index = 0; index < 10; index++) {
            const digit = isbn[index] === "X" ? 10 : Number(isbn[index]);
            sum += digit * (10 - index);
          }
          return sum % 11 === 0;
        }
        return false;
      }

      function normalizeIsbn(value: string): string {
        return value.replace(/[\s-]/g, "").toUpperCase();
      }

      function isbnVariants(isbn: string): Set<string> {
        const variants = new Set([isbn]);
        if (/^\d{9}[\dX]$/.test(isbn)) {
          const firstTwelve = `978${isbn.slice(0, 9)}`;
          let sum = 0;
          for (let index = 0; index < 12; index++) {
            sum += Number(firstTwelve[index]) * (index % 2 === 0 ? 1 : 3);
          }
          variants.add(`${firstTwelve}${(10 - sum % 10) % 10}`);
        } else if (/^978\d{10}$/.test(isbn)) {
          const firstNine = isbn.slice(3, 12);
          let sum = 0;
          for (let index = 0; index < 9; index++) sum += Number(firstNine[index]) * (10 - index);
          const remainder = sum % 11;
          variants.add(`${firstNine}${remainder === 0 ? "0" : remainder === 1 ? "X" : 11 - remainder}`);
        }
        return variants;
      }

      function secureCoverUrl(value: unknown): string | null {
        if (typeof value !== "string" || !value) return null;
        try {
          const url = new URL(value);
          if (url.protocol === "http:") url.protocol = "https:";
          return url.protocol === "https:" ? url.href : null;
        } catch {
          return null;
        }
      }

      function loadCoverImage(image: HTMLImageElement, coverUrl: string, onFailure: () => void): void {
        const cachedUrl = new URL(`${import.meta.env.BASE_URL}__cover`, window.location.origin);
        cachedUrl.searchParams.set("url", coverUrl);
        let triedOriginalUrl = false;
        image.addEventListener("error", () => {
          if (!triedOriginalUrl) {
            triedOriginalUrl = true;
            image.src = coverUrl;
            return;
          }
          onFailure();
        });
        image.src = cachedUrl.href;
      }

      async function fetchBookJson<T>(url: string | URL): Promise<T> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Catálogo respondió HTTP ${response.status}`);
        return await response.json() as T;
      }

      function hasNonLatinLetters(value: string): boolean {
        return [...value].some(character => /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character));
      }

      function countNonLatinLetters(value: string): number {
        return [...value].filter(character => /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character)).length;
      }

      async function localizeOpenLibraryAuthor(author: OpenLibraryAuthor): Promise<string> {
        const originalName = typeof author?.name === "string" ? author.name : "";
        if (!hasNonLatinLetters(originalName)) return originalName;
        const authorId = typeof author.url === "string" ? author.url.match(/\/authors\/(OL[A-Z0-9]+)/i)?.[1] : null;
        if (!authorId) return originalName;
        const cachedName = localizedAuthorNameCache.get(authorId);
        if (cachedName) return cachedName;

        const localizedNamePromise = (async () => {
          try {
            const authorRecord = await fetchBookJson<OpenLibraryAuthorRecord>(`https://openlibrary.org/authors/${authorId}.json`);
            const wikidataId = typeof authorRecord.remote_ids?.wikidata === "string"
              ? authorRecord.remote_ids.wikidata.match(/Q\d+/)?.[0]
              : null;
            if (wikidataId) {
              try {
                const url = new URL("https://www.wikidata.org/w/api.php");
                url.searchParams.set("action", "wbgetentities");
                url.searchParams.set("ids", wikidataId);
                url.searchParams.set("props", "labels");
                url.searchParams.set("languages", "es");
                url.searchParams.set("format", "json");
                url.searchParams.set("origin", "*");
                const data = await fetchBookJson<WikidataResponse>(url);
                const spanishName = data.entities?.[wikidataId]?.labels?.es?.value;
                if (typeof spanishName === "string" && !hasNonLatinLetters(spanishName)) return spanishName;
              } catch (error) {
                console.warn(`No se pudo consultar Wikidata para el autor ${authorId}.`, error);
              }
            }
            const alternatives = [
              authorRecord.personal_name,
              ...(Array.isArray(authorRecord.alternate_names) ? authorRecord.alternate_names : [])
            ];
            const alternative = alternatives.find(name => typeof name === "string" && !hasNonLatinLetters(name));
            return typeof alternative === "string" ? alternative.normalize("NFC") : originalName;
          } catch (error) {
            console.warn(`No se pudo localizar el nombre del autor ${authorId} en español.`, error);
            return originalName;
          }
        })();
        localizedAuthorNameCache.set(authorId, localizedNamePromise);
        return localizedNamePromise;
      }

      async function fetchOpenLibraryBook(isbn: string): Promise<BookMetadata | null> {
        const key = `ISBN:${isbn}`;
        const url = new URL("https://openlibrary.org/api/books");
        url.searchParams.set("bibkeys", key);
        url.searchParams.set("format", "json");
        url.searchParams.set("jscmd", "data");
        const data = await fetchBookJson<Record<string, OpenLibraryBook>>(url);
        const record = data[key];
        if (!record) return null;
        const authors = Array.isArray(record.authors)
          ? await Promise.all(record.authors.map(localizeOpenLibraryAuthor))
          : [];
        return {
          title: typeof record.title === "string" ? record.title.trim() : "",
          author: authors.filter(Boolean).join(", "),
          coverUrl: secureCoverUrl(record.cover?.medium || record.cover?.large || record.cover?.small),
          series: Array.isArray(record.series) ? record.series.filter(value => typeof value === "string").join(", ") : typeof record.series === "string" ? record.series : "",
          seriesNumber: typeof record.series_position === "string" || typeof record.series_position === "number" ? String(record.series_position) : "",
          pageCount: typeof record.number_of_pages === "number" &&
            Number.isSafeInteger(record.number_of_pages) && record.number_of_pages > 0
            ? record.number_of_pages
            : null
        };
      }

      async function fetchOpenLibrarySeries(isbn: string): Promise<{ series: string; seriesNumber: string } | null> {
        const baseUrl = "https://openlibrary.org";
        const edition = await fetchBookJson<OpenLibraryEdition>(`${baseUrl}/isbn/${encodeURIComponent(isbn)}.json`);
        const workKey = Array.isArray(edition.works) ? edition.works.find(work => typeof work?.key === "string")?.key : null;
        if (!workKey) return null;
        const work = await fetchBookJson<OpenLibraryWork>(new URL(`${workKey}.json`, baseUrl));
        const seriesEntry = Array.isArray(work.series) ? work.series.find(entry => typeof entry?.series?.key === "string") : null;
        const seriesKey = seriesEntry?.series?.key;
        if (seriesKey) {
          const seriesRecord = await fetchBookJson<{ name?: string; title?: string }>(new URL(`${seriesKey}.json`, baseUrl));
          return {
            series: typeof seriesRecord.name === "string" ? seriesRecord.name : typeof seriesRecord.title === "string" ? seriesRecord.title : "",
            seriesNumber: typeof seriesEntry.position === "string" || typeof seriesEntry.position === "number" ? String(seriesEntry.position) : ""
          };
        }
        const subject = Array.isArray(work.subjects) ? work.subjects.find(value => typeof value === "string" && value.toLowerCase().startsWith("series:")) : null;
        return subject ? { series: subject.slice("series:".length).replace(/_/g, " "), seriesNumber: "" } : null;
      }

      async function fetchGoogleBooksBook(isbn: string): Promise<(BookMetadata & { language: string }) | null> {
        const url = new URL("https://www.googleapis.com/books/v1/volumes");
        url.searchParams.set("q", `isbn:${isbn}`);
        url.searchParams.set("maxResults", "5");
        const data = await fetchBookJson<GoogleBooksResponse>(url);
        const variants = isbnVariants(isbn);
        const items = Array.isArray(data.items) ? data.items : [];
        const exactMatches = items.filter(item =>
          Array.isArray(item.volumeInfo?.industryIdentifiers) &&
          item.volumeInfo.industryIdentifiers.some(identifier =>
            typeof identifier.identifier === "string" && variants.has(normalizeIsbn(identifier.identifier))
          )
        );
        const volume = exactMatches.find(item => item.volumeInfo?.language === "es") ||
          exactMatches[0] ||
          items.find(item => !Array.isArray(item.volumeInfo?.industryIdentifiers) && item.volumeInfo?.language === "es") ||
          items.find(item => !Array.isArray(item.volumeInfo?.industryIdentifiers));
        if (!volume) return null;
        const info = volume.volumeInfo || {};
        const seriesInfo = info.seriesInfo || {};
        const volumeSeries = Array.isArray(seriesInfo.volumeSeries) ? seriesInfo.volumeSeries[0] : null;
        const series = typeof info.series === "string" ? info.series :
          Array.isArray(info.series) ? info.series.filter(value => typeof value === "string").join(", ") :
          typeof seriesInfo.shortSeriesBookTitle === "string" ? seriesInfo.shortSeriesBookTitle : "";
        return {
          title: typeof info.title === "string" ? info.title.trim() : "",
          author: Array.isArray(info.authors) ? info.authors.join(", ") : "",
          coverUrl: secureCoverUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
          language: typeof info.language === "string" ? info.language : "",
          series,
          pageCount: typeof info.pageCount === "number" && Number.isSafeInteger(info.pageCount) && info.pageCount > 0
            ? info.pageCount
            : null,
          seriesNumber: typeof seriesInfo.bookDisplayNumber === "string" || typeof seriesInfo.bookDisplayNumber === "number"
            ? String(seriesInfo.bookDisplayNumber)
            : typeof volumeSeries?.orderNumber === "number" ? String(volumeSeries.orderNumber) : ""
        };
      }

      async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
        const url = new URL("https://openlibrary.org/search.json");
        url.searchParams.set("q", query);
        url.searchParams.set("limit", "10");
        url.searchParams.set("fields", "title,author_name,author_key,isbn,cover_i,language,number_of_pages_median");
        const data = await fetchBookJson<OpenLibrarySearchResponse>(url);
        const results = await Promise.all((Array.isArray(data.docs) ? data.docs : []).map(async doc => {
          const title = typeof doc.title === "string" ? doc.title.trim() : "";
          const authorNames = Array.isArray(doc.author_name)
            ? doc.author_name.filter((name): name is string => typeof name === "string")
            : [];
          if (!title || authorNames.length === 0) return null;
          const authors = await Promise.all(authorNames.map((name, index) => {
            const authorKey = doc.author_key?.[index];
            if (typeof authorKey !== "string" || !/^OL[A-Z0-9]+$/i.test(authorKey)) return name;
            return localizeOpenLibraryAuthor({
              name,
              url: `https://openlibrary.org/authors/${authorKey}`
            });
          }));
          const author = authors.join(", ");
          const isbn = Array.isArray(doc.isbn)
            ? doc.isbn.map(normalizeIsbn).find(candidate => validIsbn(candidate)) || ""
            : "";
          return {
            title,
            author,
            isbn,
            coverUrl: typeof doc.cover_i === "number" ? secureCoverUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`) : null,
            series: "",
            seriesNumber: "",
            pageCount: typeof doc.number_of_pages_median === "number" &&
              Number.isSafeInteger(doc.number_of_pages_median) && doc.number_of_pages_median > 0
              ? doc.number_of_pages_median
              : null,
            language: Array.isArray(doc.language) ? doc.language.join(",") : "",
            source: "Open Library"
          } satisfies BookSearchResult;
        }));
        return results.filter((result): result is BookSearchResult => result !== null);
      }

      async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
        const url = new URL("https://www.googleapis.com/books/v1/volumes");
        url.searchParams.set("q", query);
        url.searchParams.set("maxResults", "10");
        url.searchParams.set("printType", "books");
        const data = await fetchBookJson<GoogleBooksResponse>(url);
        const results = await Promise.all((Array.isArray(data.items) ? data.items : []).map(async item => {
          const info = item.volumeInfo || {};
          const seriesInfo = info.seriesInfo || {};
          const volumeSeries = Array.isArray(seriesInfo.volumeSeries) ? seriesInfo.volumeSeries[0] : null;
          const title = typeof info.title === "string" ? info.title.trim() : "";
          let author = Array.isArray(info.authors) ? info.authors.join(", ") : "";
          if (!title || !author) return null;
          const isbn = Array.isArray(info.industryIdentifiers)
            ? info.industryIdentifiers
              .map(identifier => normalizeIsbn(identifier.identifier || ""))
              .find(candidate => validIsbn(candidate)) || ""
            : "";
          if (isbn && hasNonLatinLetters(author)) {
            try {
              const openLibrary = await fetchOpenLibraryBook(isbn);
              if (openLibrary?.author &&
                countNonLatinLetters(openLibrary.author) < countNonLatinLetters(author)) {
                author = openLibrary.author;
              }
            } catch (error) {
              console.warn(`No se pudo localizar el autor del ISBN ${isbn} en español.`, error);
            }
          }
          return {
            title,
            author,
            isbn,
            coverUrl: secureCoverUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
            series: typeof info.series === "string" ? info.series :
              Array.isArray(info.series) ? info.series.filter(value => typeof value === "string").join(", ") :
                typeof seriesInfo.shortSeriesBookTitle === "string" ? seriesInfo.shortSeriesBookTitle : "",
            seriesNumber: typeof seriesInfo.bookDisplayNumber === "string" || typeof seriesInfo.bookDisplayNumber === "number"
              ? String(seriesInfo.bookDisplayNumber)
              : typeof volumeSeries?.orderNumber === "number" ? String(volumeSeries.orderNumber) : "",
            pageCount: typeof info.pageCount === "number" && Number.isSafeInteger(info.pageCount) && info.pageCount > 0
              ? info.pageCount
              : null,
            language: typeof info.language === "string" ? info.language : "",
            source: "Google Books"
          } satisfies BookSearchResult;
        }));
        return results.filter((result): result is BookSearchResult => result !== null);
      }

      function isSpanishLanguage(language: string): boolean {
        return language.split(",").some(value => value.trim().toLocaleLowerCase("es").startsWith("es") || value.trim().toLocaleLowerCase("es") === "spa");
      }

      function bookSearchRelevance(query: string, result: BookSearchResult): number {
        const normalizedQuery = normalizeBookText(query);
        const title = normalizeBookText(result.title);
        const author = normalizeBookText(result.author);
        if (title === normalizedQuery) return 1000;
        const paddedQuery = ` ${normalizedQuery} `;
        if (` ${title} `.includes(paddedQuery)) return 900;
        if (` ${author} `.includes(paddedQuery)) return 800;

        const terms = normalizedQuery.split(" ").filter(Boolean);
        const titleTerms = new Set(title.split(" "));
        const authorTerms = new Set(author.split(" "));
        if (terms.length === 0 || !terms.every(term => titleTerms.has(term) || authorTerms.has(term))) return 0;
        const titleMatches = terms.filter(term => titleTerms.has(term)).length;
        return 500 + titleMatches * 10;
      }

      async function searchBookCatalogs(query: string): Promise<{ results: BookSearchResult[]; failures: string[] }> {
        const sources = await Promise.allSettled([searchGoogleBooks(query), searchOpenLibrary(query)]);
        const results: BookSearchResult[] = [];
        const failures: string[] = [];
        for (const [index, source] of sources.entries()) {
          if (source.status === "fulfilled") results.push(...source.value);
          else {
            const name = index === 0 ? "Google Books" : "Open Library";
            failures.push(name);
            console.warn(`No se pudo buscar en ${name}.`, source.reason);
          }
        }
        const relevantResults = results.filter(result => bookSearchRelevance(query, result) > 0);
        relevantResults.sort((left, right) =>
          bookSearchRelevance(query, right) - bookSearchRelevance(query, left) ||
          Number(isSpanishLanguage(right.language)) - Number(isSpanishLanguage(left.language)) ||
          countNonLatinLetters(left.author) - countNonLatinLetters(right.author)
        );
        const uniqueResults = new Map<string, BookSearchResult>();
        for (const result of relevantResults) {
          const key = `${normalizeBookText(result.title)}|${normalizeBookText(result.author)}`;
          const existing = uniqueResults.get(key);
          if (!existing) uniqueResults.set(key, result);
          else {
            uniqueResults.set(key, {
              ...existing,
              isbn: existing.isbn || result.isbn,
              coverUrl: existing.coverUrl || result.coverUrl,
              series: existing.series || result.series,
              seriesNumber: existing.seriesNumber || result.seriesNumber,
              pageCount: existing.pageCount || result.pageCount
            });
          }
        }
        return { results: [...uniqueResults.values()].slice(0, 10), failures };
      }

      function normalizeBookText(value: string): string {
        return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es")
          .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      }

      async function fetchBookMetadata(isbn: string): Promise<BookMetadata | null> {
        let openLibrary = null;
        let googleBooks = null;
        let lookupError = null;
        try {
          openLibrary = await fetchOpenLibraryBook(isbn);
        } catch (error) {
          lookupError = error;
          console.warn("No se pudo consultar Open Library.", error);
        }
        if (openLibrary && !openLibrary.series) {
          try {
            const seriesInfo = await fetchOpenLibrarySeries(isbn);
            if (seriesInfo) {
              openLibrary.series = seriesInfo.series;
              openLibrary.seriesNumber = seriesInfo.seriesNumber;
            }
          } catch (error) {
            console.warn("No se pudo consultar la información de la serie en Open Library.", error);
          }
        }
        if (!openLibrary?.title || !openLibrary.author || hasNonLatinLetters(openLibrary.author) || !openLibrary.coverUrl) {
          try {
            googleBooks = await fetchGoogleBooksBook(isbn);
          } catch (error) {
            lookupError = error;
            console.warn("No se pudo consultar Google Books.", error);
          }
        }
        if (!openLibrary && !googleBooks && lookupError) {
          throw new Error("No se pudo conectar con los catálogos de libros.");
        }
        if (!openLibrary && !googleBooks) return null;
        const googleAuthorIsMoreReadable = googleBooks?.author &&
          countNonLatinLetters(googleBooks.author) < countNonLatinLetters(openLibrary?.author || "");
        return {
          title: googleBooks?.language === "es" ? googleBooks.title || openLibrary?.title || "" : openLibrary?.title || googleBooks?.title || "",
          author: googleAuthorIsMoreReadable ? googleBooks?.author || "" : openLibrary?.author || googleBooks?.author || "",
          coverUrl: openLibrary?.coverUrl || googleBooks?.coverUrl || null,
          series: openLibrary?.series || googleBooks?.series || "",
          seriesNumber: openLibrary?.seriesNumber || googleBooks?.seriesNumber || "",
          pageCount: openLibrary?.pageCount || googleBooks?.pageCount || null
        };
      }

      async function localizeSavedAuthors() {
        const candidates = books.filter(book =>
          book.coverUrl && validIsbn(normalizeIsbn(book.isbn)) && !book.authorLanguage && hasNonLatinLetters(book.author)
        );
        if (candidates.length === 0) return;
        let changed = false;
        await Promise.all(candidates.map(async book => {
          try {
            const metadata = await fetchOpenLibraryBook(normalizeIsbn(book.isbn));
            if (!metadata?.author || countNonLatinLetters(metadata.author) >= countNonLatinLetters(book.author)) return;
            book.author = metadata.author;
            if (!hasNonLatinLetters(metadata.author)) book.authorLanguage = "es";
            changed = true;
          } catch (error) {
            console.warn(`No se pudo actualizar la autoría de ${book.title}.`, error);
          }
        }));
        if (changed) {
          saveBooks();
          render();
          showToast("Actualizamos el nombre del autor a su forma en español.");
        }
      }

      function setFormStatus(message: string, state = "") {
        elements.formStatus.textContent = message;
        elements.formStatus.dataset.state = state;
      }

      function scheduleIsbnLookup(value: string, delay = 550): void {
        if (isbnLookupTimeout !== null) {
          window.clearTimeout(isbnLookupTimeout);
          isbnLookupTimeout = null;
        }
        const generation = ++isbnLookupGeneration;
        const isbn = normalizeIsbn(value);
        elements.formError.textContent = "";
        setFormStatus("");
        if (!validIsbn(isbn)) return;
        isbnLookupTimeout = window.setTimeout(() => {
          isbnLookupTimeout = null;
          void lookupAndAddBook(isbn, generation);
        }, delay);
      }

      async function lookupAndAddBook(isbn: string, generation: number): Promise<void> {
        if (generation !== isbnLookupGeneration) return;
        if (books.some(book => book.isbn && isbnVariants(isbn).has(normalizeIsbn(book.isbn)))) {
          setFormStatus("Ese ISBN ya está en tu biblioteca.", "error");
          return;
        }
        setFormStatus("Buscando información del libro…");
        try {
          const metadata = await fetchBookMetadata(isbn);
          if (generation !== isbnLookupGeneration || normalizeIsbn(elements.isbn.value) !== isbn) return;
          if (!metadata || !metadata.title) {
            setFormStatus("No encontramos ese ISBN. Puedes completar los datos manualmente.");
            return;
          }
          elements.title.value = metadata.title.slice(0, 120);
          if (metadata.author) elements.author.value = metadata.author.slice(0, 80);
          if (!metadata.author) {
            setFormStatus("Encontramos el título, pero falta el autor. Complétalo para agregar el libro.");
            return;
          }
          const status = elements.status.value;
          if (!isBookStatus(status)) {
            setFormStatus("Selecciona un estado válido para el libro.", "error");
            return;
          }
          addBook({
            isbn,
            title: elements.title.value,
            author: elements.author.value,
            status,
            coverUrl: metadata.coverUrl,
            series: metadata.series,
            seriesNumber: metadata.seriesNumber,
            pageCount: metadata.pageCount || undefined,
            authorLanguage: hasNonLatinLetters(metadata.author) ? "" : "es"
          });
        } catch (error) {
          if (generation !== isbnLookupGeneration) return;
          console.error("No se pudo buscar el ISBN en los catálogos.", error);
          setFormStatus("No pudimos consultar los catálogos. Revisa tu conexión o agrega el libro manualmente.", "error");
        }
      }

      function stopScanner() {
        scannerGeneration++;
        if (scannerFrame !== null) {
          window.cancelAnimationFrame(scannerFrame);
          scannerFrame = null;
        }
        if (scannerControls) {
          scannerControls.stop();
          scannerControls = null;
        }
        if (scannerStream) {
          for (const track of scannerStream.getTracks()) track.stop();
          scannerStream = null;
        }
        elements.scannerVideo.srcObject = null;
      }

      function cameraErrorMessage(error: unknown): string {
        const name = error instanceof Error ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          return "No se concedió permiso para usar la cámara. Permítelo en el navegador e inténtalo de nuevo.";
        }
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          return "No encontramos una cámara disponible en este dispositivo.";
        }
        if (name === "NotReadableError" || name === "AbortError") {
          return "La cámara está ocupada por otra aplicación. Ciérrala e inténtalo de nuevo.";
        }
        if (name === "OverconstrainedError") {
          return "No se pudo usar una cámara compatible en este dispositivo.";
        }
        console.error("No se pudo iniciar el escáner de ISBN.", error);
        return "No se pudo iniciar la cámara. Comprueba los permisos e inténtalo de nuevo.";
      }

      function loadZXing(): Promise<ZXingBrowserApi> {
        if (window.ZXingBrowser) return Promise.resolve(window.ZXingBrowser);
        if (!zxingLoadPromise) {
          zxingLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = new URL("vendor/zxing-browser.min.js", document.baseURI).href;
            script.async = true;
            script.onload = () => {
              if (window.ZXingBrowser) resolve(window.ZXingBrowser);
              else {
                zxingLoadPromise = null;
                reject(new Error("No se encontró el lector ZXing."));
              }
            };
            script.onerror = () => {
              zxingLoadPromise = null;
              reject(new Error("No se pudo cargar vendor/zxing-browser.min.js."));
            };
            document.head.append(script);
          });
        }
        return zxingLoadPromise;
      }

      function handleScannedBarcode(rawValue: string, generation: number): boolean {
        if (generation !== scannerGeneration) return false;
        const isbn = rawValue.replace(/[\s-]/g, "").toUpperCase();
        if (!/^97[89]\d{10}$/.test(isbn) || !validIsbn(isbn)) {
          elements.scannerMessage.textContent = "Ese código no parece un ISBN. Enfoca el código de barras del libro.";
          return false;
        }
        elements.isbn.value = isbn;
        elements.formError.textContent = "";
        stopScanner();
        elements.scannerDialog.close();
        elements.isbn.focus();
        scheduleIsbnLookup(isbn, 0);
        showToast("ISBN escaneado. Buscando los datos del libro…");
        return true;
      }

      async function startZXingScan(generation: number): Promise<void> {
        const zxing = await loadZXing();
        if (generation !== scannerGeneration) return;
        if (typeof zxing.BrowserMultiFormatOneDReader !== "function") {
          throw new Error("El lector ZXing no expone el decodificador EAN.");
        }
        const reader = new zxing.BrowserMultiFormatOneDReader();
        scannerControls = await reader.decodeFromVideoElement(elements.scannerVideo, result => {
          if (result) handleScannedBarcode(result.getText(), generation);
        });
        if (generation !== scannerGeneration && scannerControls) {
          scannerControls.stop();
          scannerControls = null;
        }
      }

      async function scanFrame(detector: BarcodeDetectorInstance, generation: number): Promise<void> {
        if (!scannerStream || generation !== scannerGeneration) return;
        try {
          if (elements.scannerVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(elements.scannerVideo);
            if (generation !== scannerGeneration) return;
            for (const code of codes) {
              if (handleScannedBarcode(code.rawValue, generation)) return;
            }
          }
        } catch (error) {
          if (generation !== scannerGeneration) return;
          console.error("Falló la lectura del código de barras.", error);
          stopScanner();
          elements.scannerMessage.textContent = "No se pudo leer el código. Cierra el escáner e inténtalo de nuevo.";
          return;
        }
        if (scannerStream && generation === scannerGeneration) {
          scannerFrame = window.requestAnimationFrame(() => { void scanFrame(detector, generation); });
        }
      }

      async function openScanner(): Promise<void> {
        elements.scannerDialog.showModal();
        const generation = ++scannerGeneration;
        elements.scannerMessage.textContent = "Solicitando acceso a la cámara…";

        if (!window.isSecureContext) {
          elements.scannerMessage.textContent = "Safari solo permite usar la cámara desde HTTPS o localhost. No abras la app como archivo local (file://).";
          return;
        }
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
          elements.scannerMessage.textContent = "Safari no habilitó la cámara. Abre la app desde HTTPS o localhost y revisa los permisos del sitio.";
          return;
        }

        let cameraRequest;
        try {
          cameraRequest = navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
          });
        } catch (error) {
          elements.scannerMessage.textContent = cameraErrorMessage(error);
          return;
        }

        try {
          const stream = await cameraRequest;
          if (generation !== scannerGeneration) {
            for (const track of stream.getTracks()) track.stop();
            return;
          }
          scannerStream = stream;
          elements.scannerVideo.srcObject = scannerStream;
          await elements.scannerVideo.play();
          if (generation !== scannerGeneration) return;
          let detector = null;
          if (typeof window.BarcodeDetector === "function") {
            try {
              const formats = await window.BarcodeDetector.getSupportedFormats();
              if (generation !== scannerGeneration) return;
              if (formats.includes("ean_13")) detector = new window.BarcodeDetector({ formats: ["ean_13"] });
            } catch (error) {
              console.warn("BarcodeDetector no está disponible; se usará el lector alternativo.", error);
            }
          }
          if (generation !== scannerGeneration) return;
          if (detector) {
            elements.scannerMessage.textContent = "Centra el código de barras dentro del recuadro.";
            void scanFrame(detector, generation);
          } else {
            elements.scannerMessage.textContent = "Preparando lector de códigos…";
            await startZXingScan(generation);
            if (generation === scannerGeneration) {
              elements.scannerMessage.textContent = "Centra el código de barras dentro del recuadro.";
            }
          }
        } catch (error) {
          if (generation !== scannerGeneration) return;
          stopScanner();
          console.error("No se pudo iniciar el lector de códigos.", error);
          elements.scannerMessage.textContent = "No se pudo iniciar el lector. Comprueba que el servidor esté sirviendo vendor/zxing-browser.min.js.";
        }
      }

      function formatTime(totalSeconds: number): string {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const remainder = String(seconds % 60).padStart(2, "0");
        return `${hours}:${minutes}:${remainder}`;
      }

      function elapsedTime() {
        if (!timer) return 0;
        return timer.elapsedSeconds + (timer.startedAt === null ? 0 : Math.max(0, Math.floor((Date.now() - timer.startedAt) / 1000)));
      }

      function showToast(message: string): void {
        elements.toast.textContent = message;
        elements.toast.classList.add("visible");
        if (toastTimeout !== null) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => elements.toast.classList.remove("visible"), 2800);
      }

      function render() {
        renderStats();
        renderTimer();
        renderBooks();
        renderProgress();
        renderStore();
      }

      function renderStats() {
        getElement<HTMLElement>("stat-total").textContent = String(books.length);
        getElement<HTMLElement>("sidebar-book-count").textContent = String(books.length);
        elements.wishlistCount.textContent = String(books.filter(book => book.status === "Deseado").length);
        getElement<HTMLElement>("store-wishlist-count").textContent = String(books.filter(book => book.status === "Deseado").length);
        getElement<HTMLElement>("stat-reading").textContent = String(books.filter(book => book.status === "Leyendo").length);
        const totalSeconds = books.reduce((total, book) => total + getBookReadingSeconds(book), 0);
        const hours = totalSeconds / 3600;
        getElement<HTMLElement>("stat-hours").textContent = hours < 1 ? formatReadingMinutes(totalSeconds, true) : `${Number(hours.toFixed(1))}h`;
      }

      function getBookReadingSeconds(book: Book): number {
        const savedSeconds = Number(book.readingSeconds);
        const activeSeconds = timer?.bookId === book.id ? elapsedTime() : 0;
        return (Number.isFinite(savedSeconds) && savedSeconds > 0 ? savedSeconds : 0) + activeSeconds;
      }

      function getBookPagesRead(book: Book): number {
        return typeof book.pagesRead === "number" && Number.isSafeInteger(book.pagesRead) && book.pagesRead >= 0
          ? book.pagesRead
          : 0;
      }

      function getBookPageCount(book: Book): number | null {
        return typeof book.pageCount === "number" && Number.isSafeInteger(book.pageCount) && book.pageCount > 0
          ? book.pageCount
          : null;
      }

      function getNextPage(book: Book): number {
        const currentPage = typeof book.currentPage === "number" && Number.isSafeInteger(book.currentPage) && book.currentPage >= 0
          ? book.currentPage
          : getBookPagesRead(book);
        const nextPage = Math.max(1, currentPage + 1);
        const pageCount = getBookPageCount(book);
        return pageCount === null ? nextPage : Math.min(nextPage, pageCount);
      }

      function formatReadingHours(seconds: number): string {
        if (seconds < 3600) return formatReadingMinutes(seconds);
        return `${Number((seconds / 3600).toFixed(1))} h`;
      }

      function renderProgress(): void {
        const totalSeconds = books.reduce((total, book) => total + getBookReadingSeconds(book), 0);
        const totalPages = books.reduce((total, book) => total + getBookPagesRead(book), 0);
        const activeBooks = books.filter(book => getBookReadingSeconds(book) > 0 || getBookPagesRead(book) > 0).length;
        elements.progressHours.textContent = totalSeconds === 0 ? "0 min" : formatReadingHours(totalSeconds);
        elements.progressPages.textContent = totalPages.toLocaleString("es");
        elements.progressBooks.textContent = String(activeBooks);
        renderProgressChart(elements.hoursChart, "hours");
        renderProgressChart(elements.pagesChart, "pages");
      }

      function renderProgressChart(container: HTMLOListElement, metric: "hours" | "pages"): void {
        const values = books.map(book => ({
          book,
          value: metric === "hours" ? getBookReadingSeconds(book) : getBookPagesRead(book)
        })).filter(item => item.value > 0)
          .sort((left, right) => right.value - left.value)
          .slice(0, 8);
        container.replaceChildren();

        if (values.length === 0) {
          const empty = document.createElement("li");
          empty.className = "chart-empty";
          empty.textContent = metric === "hours"
            ? "Guarda una sesión de lectura y aquí aparecerán tus horas por libro."
            : "Actualiza las páginas leídas desde una tarjeta de tu biblioteca.";
          container.append(empty);
          return;
        }

        const maximum = values[0].value;
        for (const { book, value } of values) {
          const row = document.createElement("li");
          const label = document.createElement("div");
          label.className = "chart-row-label";
          const title = document.createElement("span");
          title.className = "chart-row-title";
          title.textContent = book.title;
          title.title = book.title;
          const amount = document.createElement("span");
          amount.className = "chart-row-value";
          amount.textContent = metric === "hours"
            ? formatReadingHours(value)
            : `${value.toLocaleString("es")} pág.`;
          label.append(title, amount);

          const track = document.createElement("div");
          track.className = "chart-track";
          track.setAttribute("aria-hidden", "true");
          const fill = document.createElement("span");
          fill.className = metric === "pages" ? "chart-fill chart-fill-pages" : "chart-fill";
          fill.style.width = `${Math.max(3, value / maximum * 100)}%`;
          track.append(fill);
          row.append(label, track);
          container.append(row);
        }
      }

      function formatReadingMinutes(seconds: number, compact = false): string {
        if (seconds <= 0) return compact ? "0m" : "Sin sesiones";
        const minutes = Math.floor(seconds / 60);
        if (minutes === 0) return compact ? "<1m" : "<1 min";
        return compact ? `${minutes}m` : `${minutes} min`;
      }

      interface StorePrice {
        amazon: number | null;
        mercadolibre: number | null;
      }

      function loadStorePrices(): Record<string, StorePrice> {
        try {
          const saved: unknown = JSON.parse(localStorage.getItem(STORE_PRICES_KEY) || "{}");
          if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return {};
          const result: Record<string, StorePrice> = {};
          for (const [bookId, value] of Object.entries(saved)) {
            if (typeof value !== "object" || value === null) continue;
            const price = value as Partial<StorePrice>;
            result[bookId] = {
              amazon: typeof price.amazon === "number" && Number.isFinite(price.amazon) && price.amazon >= 0 ? price.amazon : null,
              mercadolibre: typeof price.mercadolibre === "number" && Number.isFinite(price.mercadolibre) && price.mercadolibre >= 0 ? price.mercadolibre : null
            };
          }
          return result;
        } catch (error) {
          console.error("No se pudieron recuperar los precios guardados.", error);
          return {};
        }
      }

      function saveStorePrices(prices: Record<string, StorePrice>): void {
        try {
          localStorage.setItem(STORE_PRICES_KEY, JSON.stringify(prices));
        } catch (error) {
          console.error("No se pudieron guardar los precios.", error);
          showToast("No se pudieron guardar los precios. Revisa el almacenamiento del navegador.");
        }
      }

      const storePrices = loadStorePrices();

      function formatStorePrice(price: number): string {
        return price.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
      }

      function renderStore(): void {
        const wishlist = books.filter(book => book.status === "Deseado");
        elements.storeGrid.replaceChildren();

        if (wishlist.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.innerHTML = '<div class="empty-icon" aria-hidden="true">♡</div><h3>Tu lista de deseados está vacía</h3><p>Marca un libro como “Deseado” desde la biblioteca para compararlo aquí.</p>';
          elements.storeGrid.append(empty);
          return;
        }

        for (const book of wishlist) {
          const query = `${book.title} ${book.author}`.trim();
          const encodedQuery = encodeURIComponent(query);
          const prices = storePrices[book.id] || { amazon: null, mercadolibre: null };

          const card = document.createElement("article");
          card.className = "panel store-card";

          const cover = document.createElement("div");
          cover.className = "book-cover store-card-cover";
          cover.style.setProperty("--cover", coverColors[Math.abs(book.id.split("").reduce((total, character) => total + character.charCodeAt(0), 0)) % coverColors.length]);
          if (book.coverUrl) {
            const image = document.createElement("img");
            image.alt = "";
            image.loading = "lazy";
            loadCoverImage(image, book.coverUrl, () => {
              cover.replaceChildren(document.createTextNode(book.title.charAt(0).toLocaleUpperCase("es") || "•"));
            });
            cover.append(image);
          } else {
            cover.textContent = book.title.charAt(0).toLocaleUpperCase("es") || "•";
          }

          const info = document.createElement("div");
          info.className = "store-card-info";
          const title = document.createElement("h2");
          title.textContent = book.title;
          const author = document.createElement("p");
          author.className = "store-card-author";
          author.textContent = book.author;

          const links = document.createElement("div");
          links.className = "store-links";
          const amazon = document.createElement("a");
          amazon.className = "store-link amazon";
          amazon.href = `https://www.amazon.com.mx/s?k=${encodedQuery}`;
          amazon.target = "_blank";
          amazon.rel = "noopener noreferrer";
          amazon.textContent = "Buscar en Amazon ↗";
          const mercadoLibre = document.createElement("a");
          mercadoLibre.className = "store-link mercadolibre";
          mercadoLibre.href = `https://listado.mercadolibre.com.mx/${encodedQuery.replaceAll("%20", "-")}`;
          mercadoLibre.target = "_blank";
          mercadoLibre.rel = "noopener noreferrer";
          mercadoLibre.textContent = "Buscar en Mercado Libre ↗";
          links.append(amazon, mercadoLibre);

          const priceFields = document.createElement("div");
          priceFields.className = "store-prices";
          for (const [site, label] of [["amazon", "Amazon"], ["mercadolibre", "Mercado Libre"]] as const) {
            const field = document.createElement("div");
            field.className = "store-price-field";
            const inputLabel = document.createElement("label");
            const inputId = `store-price-${book.id}-${site}`;
            inputLabel.htmlFor = inputId;
            inputLabel.textContent = `${label} (MXN)`;
            const input = document.createElement("input");
            input.id = inputId;
            input.type = "number";
            input.min = "0";
            input.step = "0.01";
            input.inputMode = "decimal";
            input.value = prices[site] === null ? "" : String(prices[site]);
            input.dataset.storeBook = book.id;
            input.dataset.storeSite = site;
            input.setAttribute("aria-label", `Precio en ${label} para ${book.title}`);
            field.append(inputLabel, input);
            priceFields.append(field);
          }

          const best = document.createElement("div");
          best.className = "store-best-price";
          const comparison = document.createElement("span");
          const comparisonValue = document.createElement("strong");
          const validPrices = [
            ...(prices.amazon !== null ? [["Amazon", prices.amazon] as const] : []),
            ...(prices.mercadolibre !== null ? [["Mercado Libre", prices.mercadolibre] as const] : [])
          ];
          if (validPrices.length === 0) {
            comparison.textContent = "Sin precios registrados";
            comparisonValue.textContent = "";
          } else {
            validPrices.sort((left, right) => left[1] - right[1]);
            comparison.textContent = "Mejor precio";
            comparisonValue.textContent = `${validPrices[0][0]} · ${formatStorePrice(validPrices[0][1])}`;
          }
          best.append(comparison, comparisonValue);
          priceFields.append(best);

          info.append(title, author, links, priceFields);
          card.append(cover, info);
          elements.storeGrid.append(card);
        }
      }

      function renderTimer() {
        const previousValue = elements.timerBook.value;
        elements.timerBook.replaceChildren();
        const timerBooks = books.filter(book => book.status !== "Deseado" || book.id === timer?.bookId);
        if (timerBooks.length === 0) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = books.length === 0 ? "Agrega un libro para comenzar" : "Agrega un libro a tu biblioteca";
          elements.timerBook.append(option);
        } else {
          for (const book of timerBooks) {
            const option = document.createElement("option");
            option.value = book.id;
            option.textContent = `${book.title} — ${book.author}`;
            elements.timerBook.append(option);
          }
          elements.timerBook.value = timer?.bookId ||
            (timerBooks.some(book => book.id === previousValue) ? previousValue : timerBooks[0].id);
        }

        const activeTimer = timer;
        const activeBook = activeTimer ? books.find(book => book.id === activeTimer.bookId) : null;
        const chosenBook = books.find(book => book.id === elements.timerBook.value);
        const pageCount = chosenBook ? getBookPageCount(chosenBook) : null;
        elements.timerStartPage.value = String(activeTimer?.startPage ?? (chosenBook ? getNextPage(chosenBook) : 1));
        elements.timerStartPage.max = pageCount === null ? "" : String(pageCount);
        elements.timerStartPage.disabled = Boolean(timer) || !chosenBook;
        elements.timerDisplay.textContent = formatTime(elapsedTime());
        elements.timerBookTitle.textContent = activeBook ? activeBook.title : (chosenBook ? chosenBook.title : "Tu próxima historia te espera");
        elements.timerBook.disabled = Boolean(timer);
        elements.timerToggle.disabled = !timer && !chosenBook;
        elements.timerToggle.textContent = timer && timer.startedAt !== null ? "Pausar lectura" : "Iniciar lectura";
        elements.timerStatus.textContent = timer && timer.startedAt !== null ? "Sesión en curso" : timer ? "Sesión pausada" : "Listo cuando tú lo estés";
        elements.timerSave.hidden = !timer;
        elements.timerReset.hidden = !timer;
      }

      function renderBooks() {
        const query = elements.search.value.trim().toLocaleLowerCase("es");
        const status = elements.filter.value;
        elements.wishlistFilter.setAttribute("aria-pressed", String(status === "Deseado"));
        const visibleBooks = books.filter(book =>
          (!status || book.status === status) &&
          (!query || `${book.title} ${book.author} ${book.isbn} ${book.series || ""}`.toLocaleLowerCase("es").includes(query))
        );
        elements.grid.replaceChildren();

        if (visibleBooks.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          const hasFilters = Boolean(query || status);
          empty.innerHTML = `<div class="empty-icon" aria-hidden="true">${hasFilters ? "⌕" : "✳"}</div><h3>${hasFilters ? "No encontramos libros" : "Tu biblioteca empieza aquí"}</h3><p>${hasFilters ? "Prueba con otra búsqueda o cambia el filtro." : "Agrega tu primer libro y construye una colección a tu medida."}</p>`;
          elements.grid.append(empty);
          return;
        }

        for (const book of visibleBooks) {
          const card = document.createElement("article");
          card.className = "book-card";
          const cover = document.createElement("div");
          cover.className = "book-cover";
          cover.style.setProperty("--cover", coverColors[hash(book.id) % coverColors.length]);
          cover.setAttribute("aria-hidden", "true");
          const coverInitial = book.title.trim().charAt(0).toLocaleUpperCase("es");
          if (book.coverUrl) {
            const image = document.createElement("img");
            image.alt = "";
            image.loading = "lazy";
            loadCoverImage(image, book.coverUrl, () => {
              cover.replaceChildren();
              cover.textContent = coverInitial;
            });
            cover.append(image);
          } else {
            cover.textContent = coverInitial;
          }

          const info = document.createElement("div");
          info.className = "book-info";
          const title = document.createElement("h3");
          title.textContent = book.title;
          const author = document.createElement("p");
          author.className = "book-author";
          author.textContent = book.author;
          const series = book.series || book.seriesNumber ? document.createElement("p") : null;
          if (series) {
            series.className = "book-series";
            series.textContent = book.series
              ? book.seriesNumber ? `${book.series} · ${book.seriesNumber}` : book.series
              : `Vol. ${book.seriesNumber}`;
          }
          const isbn = book.isbn ? document.createElement("p") : null;
          if (isbn) {
            isbn.className = "book-isbn";
            isbn.textContent = `ISBN · ${book.isbn}`;
          }
          const meta = document.createElement("div");
          meta.className = "book-meta";
          const statusSelect = document.createElement("select");
          statusSelect.className = "status-select";
          statusSelect.setAttribute("aria-label", `Estado de ${book.title}`);
          statusSelect.dataset.action = "status";
          statusSelect.dataset.id = book.id;
          for (const value of ["Pendiente", "Leyendo", "Terminado", "Deseado"]) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            statusSelect.append(option);
          }
          statusSelect.value = book.status;
          const time = document.createElement("span");
          time.className = "book-time";
          time.textContent = `◷ ${formatReadingMinutes(Number(book.readingSeconds) || 0)}`;
          meta.append(statusSelect, time);
          info.append(title, author);
          if (series) info.append(series);
          if (isbn) info.append(isbn);
          info.append(meta);
          const progressAction = document.createElement("button");
          progressAction.className = "book-progress-action";
          progressAction.type = "button";
          progressAction.dataset.action = "progress";
          progressAction.dataset.id = book.id;
          progressAction.setAttribute("aria-label", `Actualizar páginas leídas de ${book.title}`);
          const pagesRead = getBookPagesRead(book);
          const pageCount = getBookPageCount(book);
          const progress = document.createElement("div");
          progress.className = "book-progress";
          if (pageCount === null) {
            progressAction.textContent = pagesRead > 0
              ? `${pagesRead.toLocaleString("es")} páginas leídas`
              : "＋ Registrar páginas";
            progress.append(progressAction);
          } else {
            const completedPages = Math.min(pagesRead, pageCount);
            const percentage = Math.round(completedPages / pageCount * 100);
            const progressLabel = document.createElement("div");
            progressLabel.className = "book-progress-label";
            progressAction.textContent = `${pagesRead.toLocaleString("es")} de ${pageCount.toLocaleString("es")} páginas`;
            const percent = document.createElement("span");
            percent.className = "book-progress-percent";
            percent.textContent = `${percentage}%`;
            progressLabel.append(progressAction, percent);

            const track = document.createElement("div");
            track.className = "book-progress-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", `Progreso de lectura de ${book.title}`);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", String(pageCount));
            track.setAttribute("aria-valuenow", String(completedPages));
            track.setAttribute("aria-valuetext", `${percentage}% · ${pagesRead} de ${pageCount} páginas`);
            const fill = document.createElement("span");
            fill.className = "book-progress-fill";
            fill.style.width = `${percentage}%`;
            track.append(fill);
            progress.append(progressLabel, track);
          }
          info.append(progress);

          const remove = document.createElement("button");
          remove.className = "delete-book";
          remove.type = "button";
          remove.textContent = "×";
          remove.setAttribute("aria-label", `Eliminar ${book.title}`);
          remove.dataset.action = "delete";
          remove.dataset.id = book.id;
          card.append(cover, info, remove);
          elements.grid.append(card);
        }
      }

      function setSidebarMenuOpen(isOpen: boolean, returnFocus = false): void {
        elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
        elements.menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
        elements.sidebar.classList.toggle("is-open", isOpen);
        elements.menuBackdrop.hidden = !isOpen;
        elements.pageShell.inert = isOpen;
        document.body.classList.toggle("menu-open", isOpen);
        if (returnFocus) elements.menuToggle.focus();
      }

      function setupSidebarMenu(): void {
        elements.menuToggle.addEventListener("click", () => {
          setSidebarMenuOpen(!elements.sidebar.classList.contains("is-open"));
          if (elements.sidebar.classList.contains("is-open")) elements.menuClose.focus();
        });
        elements.menuClose.addEventListener("click", () => setSidebarMenuOpen(false, true));
        elements.menuBackdrop.addEventListener("click", () => setSidebarMenuOpen(false, true));
        elements.sidebar.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {
          link.addEventListener("click", () => {
            if (elements.sidebar.classList.contains("is-open")) setSidebarMenuOpen(false, true);
          });
        });
        window.addEventListener("keydown", event => {
          if (!elements.sidebar.classList.contains("is-open")) return;
          if (event.key === "Escape") {
            event.preventDefault();
            setSidebarMenuOpen(false, true);
            return;
          }
          if (event.key !== "Tab") return;

          const focusable = Array.from(elements.sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
            .filter(element => !element.hidden && element.getClientRects().length > 0);
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || !elements.sidebar.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || !elements.sidebar.contains(document.activeElement))) {
            event.preventDefault();
            first.focus();
          }
        });
        window.addEventListener("resize", () => {
          if (window.innerWidth > 700 && elements.sidebar.classList.contains("is-open")) {
            setSidebarMenuOpen(false);
          }
        });
      }

      function updateSidebarNavigation(): void {
        if (elements.sidebar.classList.contains("is-open")) setSidebarMenuOpen(false, true);
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".sidebar-link"));
        const views = Array.from(document.querySelectorAll<HTMLElement>(".page-view"));
        const legacyRoutes: Record<string, string> = {
          "#welcome": "#home-view",
          "#library": "#library-view",
          "#progress": "#progress-view",
          "#timer": "#timer-view",
          "#add-book": "#add-book-view",
          "#store": "#store-view",
          "#settings": "#settings-view"
        };
        const hash = window.location.hash || "#home-view";
        const route = legacyRoutes[hash] || hash;
        const activeView = views.find(view => `#${view.id}` === route) || views[0];

        for (const view of views) {
          view.hidden = view !== activeView;
        }

        const activeLink = links.find(link => activeView && link.hash === `#${activeView.id}`) || links[0];
        for (const link of links) {
          if (link === activeLink) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
        window.scrollTo(0, 0);
      }

      function setupPwa(): void {
        const installButton = document.getElementById("install-app");
        const isProduction = import.meta.env.PROD;
        let deferredPrompt: BeforeInstallPromptEvent | null = null;
        elements.updateApp.hidden = !isProduction || !("serviceWorker" in navigator);

        if (installButton instanceof HTMLButtonElement) {
          installButton.hidden = !isProduction || window.matchMedia("(display-mode: standalone)").matches;
          if (isProduction) {
            window.addEventListener("beforeinstallprompt", event => {
              event.preventDefault();
              deferredPrompt = event as BeforeInstallPromptEvent;
            });
            installButton.addEventListener("click", async () => {
              if (!deferredPrompt) {
                showToast("Abre el menú del navegador y elige «Instalar aplicación». En Safari para Mac: Archivo → Añadir al Dock.");
                return;
              }

              const promptEvent = deferredPrompt;
              deferredPrompt = null;
              try {
                await promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                showToast(choice.outcome === "accepted" ? "Entre Líneas quedó instalada." : "Instalación cancelada. Puedes intentarlo de nuevo desde el navegador.");
              } catch (error) {
                console.error("No se pudo completar la instalación de Entre Líneas.", error);
                showToast("No pudimos iniciar la instalación. Inténtalo desde el menú del navegador.");
              }
            });
            window.addEventListener("appinstalled", () => {
              installButton.hidden = true;
              deferredPrompt = null;
              showToast("Entre Líneas quedó instalada.");
            });
          }
        }

        if (isProduction && "serviceWorker" in navigator) {
          let registration: ServiceWorkerRegistration | null = null;
          let hadController = Boolean(navigator.serviceWorker.controller);

          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (hadController) {
              window.location.reload();
            } else {
              hadController = true;
              renderBooks();
              renderCatalogSearchResults();
            }
          });

          const setUpdateAvailable = () => {
            elements.updateApp.textContent = "Actualizar ahora";
            elements.updateApp.disabled = false;
            setSettingsStatus("Hay una actualización lista. Tus datos guardados se conservarán.");
          };

          const watchInstallingWorker = (worker: ServiceWorker | null) => {
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable();
              } else if (worker.state === "redundant") {
                elements.updateApp.disabled = false;
                console.error("La actualización de la app no se pudo instalar.");
                setSettingsStatus("No se pudo instalar la actualización. Inténtalo de nuevo.", "error");
              }
            });
          };

          void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(activeRegistration => {
            registration = activeRegistration;
            registration.addEventListener("updatefound", () => watchInstallingWorker(registration?.installing ?? null));
            watchInstallingWorker(registration.installing);
            if (registration.waiting && navigator.serviceWorker.controller) setUpdateAvailable();
            if (navigator.serviceWorker.controller) {
              renderBooks();
              renderCatalogSearchResults();
            }
          }).catch(error => {
            console.error("No se pudo registrar el modo sin conexión.", error);
            showToast("No pudimos preparar el uso sin conexión.");
          });

          elements.updateApp.addEventListener("click", async () => {
            if (!registration) {
              setSettingsStatus("La app todavía se está preparando. Inténtalo de nuevo en un momento.", "error");
              return;
            }

            const waitingWorker = registration.waiting;
            if (waitingWorker) {
              elements.updateApp.disabled = true;
              setSettingsStatus("Actualizando la app. Tus datos guardados se conservarán.");
              try {
                waitingWorker.postMessage({ type: "SKIP_WAITING" });
              } catch (error) {
                console.error("No se pudo activar la actualización de la app.", error);
                elements.updateApp.disabled = false;
                setSettingsStatus("No se pudo iniciar la actualización. Inténtalo de nuevo.", "error");
              }
              return;
            }

            elements.updateApp.disabled = true;
            setSettingsStatus("Buscando actualizaciones…");
            try {
              await registration.update();
              if (registration.waiting) {
                setUpdateAvailable();
              } else if (registration.installing) {
                setSettingsStatus("Descargando la actualización…");
              } else {
                elements.updateApp.disabled = false;
                setSettingsStatus("Ya tienes la versión más reciente.");
              }
            } catch (error) {
              console.error("No se pudo buscar actualizaciones de la app.", error);
              elements.updateApp.disabled = false;
              setSettingsStatus("No se pudieron buscar actualizaciones. Revisa tu conexión e inténtalo de nuevo.", "error");
            }
          });
        }
      }

      function openProgressDialog(book: Book): void {
        editingBookId = book.id;
        elements.progressBookTitle.textContent = book.title;
        elements.pagesRead.value = String(getBookPagesRead(book));
        elements.pageCount.value = String(getBookPageCount(book) || "");
        elements.pagesRead.max = elements.pageCount.value;
        elements.progressFormError.textContent = "";
        elements.progressDialog.showModal();
        elements.pagesRead.focus();
      }

      function openSessionDialog(): void {
        const activeTimer = timer;
        if (!activeTimer) return;
        const book = books.find(item => item.id === activeTimer.bookId);
        if (!book) {
          console.error("No se encontró el libro de la sesión de lectura.", activeTimer.bookId);
          showToast("No se encontró el libro de esta sesión.");
          return;
        }
        elements.sessionBookTitle.textContent = book.title;
        elements.sessionStartPage.textContent = `Comenzaste en la página ${activeTimer.startPage}.`;
        elements.sessionEndPage.value = "";
        const pageCount = getBookPageCount(book);
        elements.sessionEndPage.max = pageCount === null ? "" : String(pageCount);
        elements.sessionFormError.textContent = "";
        elements.sessionDialog.showModal();
        elements.sessionEndPage.focus();
      }

      function hash(value: string): number {
        let result = 0;
        for (let index = 0; index < value.length; index++) result = (result * 31 + value.charCodeAt(index)) | 0;
        return Math.abs(result);
      }

      function isDuplicateBook(isbn: string, title: string, author: string): boolean {
        if (isbn) {
          const variants = isbnVariants(isbn);
          return books.some(book => book.isbn && variants.has(normalizeIsbn(book.isbn)));
        }
        const titleKey = normalizeBookText(title);
        const authorKey = normalizeBookText(author);
        return books.some(book =>
          normalizeBookText(book.title) === titleKey && normalizeBookText(book.author) === authorKey
        );
      }

      function amazonSearchUrl(query: string): string {
        const url = new URL("https://www.amazon.com/s");
        url.searchParams.set("k", query);
        return url.href;
      }

      function renderCatalogSearchResults(): void {
        elements.bookSearchResults.replaceChildren();
        bookSearchResults.forEach((result, index) => {
          const card = document.createElement("article");
          card.className = "catalog-result";
          const cover = document.createElement("div");
          cover.className = "catalog-result-cover";
          cover.setAttribute("aria-hidden", "true");
          cover.textContent = result.title.trim().charAt(0).toLocaleUpperCase("es");
          if (result.coverUrl) {
            const image = document.createElement("img");
            image.alt = "";
            image.loading = "lazy";
            loadCoverImage(image, result.coverUrl, () => {
              cover.replaceChildren();
              cover.textContent = result.title.trim().charAt(0).toLocaleUpperCase("es");
            });
            cover.replaceChildren(image);
          }

          const info = document.createElement("div");
          info.className = "catalog-result-info";
          const title = document.createElement("h3");
          title.textContent = result.title;
          const author = document.createElement("p");
          author.textContent = result.author;
          if (result.series || result.seriesNumber) {
            const series = document.createElement("p");
            series.textContent = `Serie · ${result.series
              ? result.seriesNumber ? `${result.series} · ${result.seriesNumber}` : result.series
              : result.seriesNumber}`;
            info.append(title, author, series);
          } else {
            info.append(title, author);
          }
          const detail = document.createElement("small");
          detail.textContent = [result.source, result.isbn ? `ISBN · ${result.isbn}` : "Sin ISBN"].join(" · ");
          info.append(detail);
          const amazonLink = document.createElement("a");
          amazonLink.className = "catalog-result-amazon";
          amazonLink.href = amazonSearchUrl(`${result.title} ${result.author}`);
          amazonLink.target = "_blank";
          amazonLink.rel = "noopener noreferrer";
          amazonLink.textContent = "Ver opciones en Amazon ↗";
          info.append(amazonLink);

          const actions = document.createElement("div");
          actions.className = "catalog-result-actions";
          const alreadyAdded = isDuplicateBook(result.isbn, result.title, result.author);
          for (const [status, label] of [["Pendiente", "Agregar como pendiente"], ["Deseado", "A Deseados"]] as const) {
            const button = document.createElement("button");
            button.className = status === "Pendiente" ? "button button-primary" : "button button-light";
            button.type = "button";
            button.dataset.searchResult = String(index);
            button.dataset.status = status;
            button.disabled = alreadyAdded;
            button.textContent = alreadyAdded ? "Ya agregado" : label;
            actions.append(button);
          }
          card.append(cover, info, actions);
          elements.bookSearchResults.append(card);
        });
      }

      async function searchCatalogs(query: string): Promise<void> {
        const generation = ++bookSearchGeneration;
        const searchButton = elements.bookSearchForm.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (searchButton) searchButton.disabled = true;
        elements.bookSearchStatus.textContent = "Buscando en Google Books y Open Library…";
        elements.bookSearchStatus.dataset.state = "";
        bookSearchResults = [];
        renderCatalogSearchResults();
        try {
          const response = await searchBookCatalogs(query);
          if (generation !== bookSearchGeneration) return;
          bookSearchResults = response.results;
          renderCatalogSearchResults();
          if (response.results.length > 0) {
            const partialMessage = response.failures.length > 0 ? " Algunos catálogos no respondieron." : "";
            elements.bookSearchStatus.textContent = `Encontramos ${response.results.length} ${response.results.length === 1 ? "resultado" : "resultados"}.${partialMessage}`;
          } else if (response.failures.length === 2) {
            elements.bookSearchStatus.textContent = "No pudimos consultar los catálogos. Revisa tu conexión e inténtalo de nuevo.";
            elements.bookSearchStatus.dataset.state = "error";
          } else if (response.failures.length > 0) {
            elements.bookSearchStatus.textContent = "No encontramos resultados. Un catálogo no respondió; puedes intentarlo de nuevo.";
          } else {
            elements.bookSearchStatus.textContent = "No encontramos libros. Prueba con otro título o autor.";
          }
        } finally {
          if (generation === bookSearchGeneration && searchButton) searchButton.disabled = false;
        }
      }

      function addBook({
        isbn,
        title,
        author,
        status,
        coverUrl = null,
        series = "",
        seriesNumber = "",
        authorLanguage = "",
        pageCount
      }: {
        isbn: string;
        title: string;
        author: string;
        status: BookStatus;
        coverUrl?: string | null;
        series?: string;
        seriesNumber?: string;
        authorLanguage?: string;
        pageCount?: number;
      }): Book {
        if (isbnLookupTimeout !== null) {
          window.clearTimeout(isbnLookupTimeout);
          isbnLookupTimeout = null;
        }
        isbnLookupGeneration++;
        const book = {
          id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          isbn,
          title,
          author,
          status,
          readingSeconds: 0,
          addedAt: Date.now(),
          coverUrl,
          series,
          seriesNumber,
          pageCount,
          pagesRead: 0,
          authorLanguage
        };
        books.unshift(book);
        saveBooks();
        elements.form.reset();
        elements.formError.textContent = "";
        setFormStatus("");
        render();
        elements.timerBook.value = book.id;
        renderTimer();
        showToast(`“${book.title}” se agregó a tu biblioteca.`);
        elements.isbn.focus();
        return book;
      }

      elements.isbn.addEventListener("input", () => scheduleIsbnLookup(elements.isbn.value));

      elements.bookSearchForm.addEventListener("submit", event => {
        event.preventDefault();
        const query = elements.bookSearchInput.value.trim();
        if (query.length < 2) {
          elements.bookSearchStatus.textContent = "Escribe al menos dos caracteres para buscar.";
          elements.bookSearchStatus.dataset.state = "error";
          elements.bookSearchInput.focus();
          return;
        }
        void searchCatalogs(query);
      });
      elements.bookSearchInput.addEventListener("input", () => {
        const query = elements.bookSearchInput.value.trim();
        elements.amazonSearchLink.hidden = query.length < 2;
        if (query.length >= 2) elements.amazonSearchLink.href = amazonSearchUrl(query);
      });

      elements.bookSearchResults.addEventListener("click", event => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest<HTMLButtonElement>("button[data-search-result]");
        if (!button) return;
        const index = Number(button.dataset.searchResult);
        const result = Number.isSafeInteger(index) ? bookSearchResults[index] : undefined;
        const status = button.dataset.status;
        if (!result || typeof status !== "string" || !isBookStatus(status)) return;
        if (isDuplicateBook(result.isbn, result.title, result.author)) {
          showToast(`“${result.title}” ya está en tu biblioteca.`);
          renderCatalogSearchResults();
          return;
        }
        addBook({
          isbn: result.isbn,
          title: result.title,
          author: result.author,
          status,
          coverUrl: result.coverUrl,
          series: result.series,
          seriesNumber: result.seriesNumber,
          pageCount: result.pageCount || undefined,
          authorLanguage: isSpanishLanguage(result.language) && !hasNonLatinLetters(result.author) ? "es" : ""
        });
        renderCatalogSearchResults();
      });

      elements.form.addEventListener("submit", event => {
        event.preventDefault();
        elements.formError.textContent = "";
        setFormStatus("");
        const isbn = normalizeIsbn(elements.isbn.value.trim());
        const title = elements.title.value.trim();
        const author = elements.author.value.trim();
        const status = elements.status.value;

        if (isbn && !validIsbn(isbn)) {
          elements.formError.textContent = "Ingresa un ISBN-10 o ISBN-13 válido.";
          elements.isbn.focus();
          return;
        }
        if (!title || !author) {
          elements.formError.textContent = "Completa el título y el autor para agregar el libro.";
          return;
        }
        if (!isBookStatus(status)) {
          elements.formError.textContent = "Selecciona un estado válido para el libro.";
          return;
        }
        if (isDuplicateBook(isbn, title, author)) {
          elements.formError.textContent = isbn
            ? "Ese ISBN ya está registrado en tu biblioteca."
            : "Ya registraste un libro con el mismo título y autor.";
          (isbn ? elements.isbn : elements.title).focus();
          return;
        }
        addBook({
          isbn,
          title,
          author,
          status
        });
      });

      elements.grid.addEventListener("change", event => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement) || target.dataset.action !== "status") return;
        const book = books.find(item => item.id === target.dataset.id);
        if (!book) return;
        if (!isBookStatus(target.value)) return;
        book.status = target.value;
        saveBooks();
        render();
      });

      elements.grid.addEventListener("click", event => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest<HTMLButtonElement>("button[data-action]");
        if (!button) return;
        const book = books.find(item => item.id === button.dataset.id);
        if (!book) return;
        if (button.dataset.action === "progress") {
          openProgressDialog(book);
          return;
        }
        if (button.dataset.action !== "delete" || !window.confirm(`¿Eliminar “${book.title}” de tu biblioteca?`)) return;
        books = books.filter(item => item.id !== book.id);
        if (timer?.bookId === book.id) {
          timer = null;
          saveTimer();
        }
        saveBooks();
        render();
        showToast("Libro eliminado de tu biblioteca.");
      });

      elements.pageCount.addEventListener("input", () => {
        elements.pagesRead.max = elements.pageCount.value;
        elements.progressFormError.textContent = "";
      });
      elements.pagesRead.addEventListener("input", () => {
        elements.progressFormError.textContent = "";
      });
      elements.progressForm.addEventListener("submit", event => {
        event.preventDefault();
        const book = books.find(item => item.id === editingBookId);
        const pagesReadValue = elements.pagesRead.value.trim();
        const pageCountValue = elements.pageCount.value.trim();
        const pagesRead = Number(pagesReadValue);
        const pageCount = pageCountValue ? Number(pageCountValue) : undefined;

        if (!book) {
          elements.progressFormError.textContent = "No encontramos este libro en tu biblioteca.";
          return;
        }
        if (!pagesReadValue || !Number.isSafeInteger(pagesRead) || pagesRead < 0) {
          elements.progressFormError.textContent = "Ingresa un número entero de páginas leídas igual o mayor que cero.";
          elements.pagesRead.focus();
          return;
        }
        if (pageCountValue && (!Number.isSafeInteger(pageCount) || (pageCount ?? 0) < 1)) {
          elements.progressFormError.textContent = "El total de páginas debe ser un número entero mayor que cero.";
          elements.pageCount.focus();
          return;
        }
        if (pageCount !== undefined && pagesRead > pageCount) {
          elements.progressFormError.textContent = "Las páginas leídas no pueden superar el total del libro.";
          elements.pagesRead.focus();
          return;
        }

        book.pagesRead = pagesRead;
        book.pageCount = pageCount;
        book.currentPage = pageCount === undefined ? pagesRead : Math.min(pagesRead, pageCount);
        saveBooks();
        elements.progressDialog.close();
        render();
        showToast(`Avance actualizado: ${pagesRead.toLocaleString("es")} páginas de “${book.title}”.`);
      });
      elements.progressClose.addEventListener("click", () => elements.progressDialog.close());
      elements.progressCancel.addEventListener("click", () => elements.progressDialog.close());
      elements.progressDialog.addEventListener("close", () => { editingBookId = null; });
      elements.sessionEndPage.addEventListener("input", () => {
        elements.sessionFormError.textContent = "";
      });

      elements.search.addEventListener("input", renderBooks);
      elements.filter.addEventListener("change", renderBooks);
      elements.paletteOptions.addEventListener("change", event => {
        if (!(event.target instanceof HTMLInputElement) || event.target.name !== "palette" || !isPalette(event.target.value)) return;
        try {
          localStorage.setItem(PALETTE_KEY, event.target.value);
        } catch (error) {
          console.error("No se pudo guardar la paleta seleccionada.", error);
          applyPalette(palette);
          setSettingsStatus("No se pudo guardar la paleta. Revisa el almacenamiento del navegador.", "error");
          return;
        }
        palette = event.target.value;
        applyPalette(palette);
        setSettingsStatus("Paleta actualizada.");
      });
      elements.fontStyle.addEventListener("change", () => {
        if (isFontStyle(elements.fontStyle.value)) {
          saveCustomization({ ...customization, fontStyle: elements.fontStyle.value });
        }
      });
      elements.density.addEventListener("change", () => {
        if (isDensity(elements.density.value)) {
          saveCustomization({ ...customization, density: elements.density.value });
        }
      });
      elements.motion.addEventListener("change", () => {
        if (isMotionPreference(elements.motion.value)) {
          saveCustomization({ ...customization, motion: elements.motion.value });
        }
      });
      elements.contrast.addEventListener("change", () => {
        if (isContrastPreference(elements.contrast.value)) {
          saveCustomization({ ...customization, contrast: elements.contrast.value });
        }
      });
      elements.cornerStyle.addEventListener("change", () => {
        if (isCornerStyle(elements.cornerStyle.value)) {
          saveCustomization({ ...customization, cornerStyle: elements.cornerStyle.value });
        }
      });
      elements.theme.addEventListener("change", () => {
        if (isThemePreference(elements.theme.value)) {
          saveCustomization({ ...customization, theme: elements.theme.value });
        }
      });
      elements.exportBackup.addEventListener("click", downloadBackup);
      elements.importBackup.addEventListener("click", () => elements.backupFile.click());
      elements.backupFile.addEventListener("change", () => {
        const file = elements.backupFile.files?.[0];
        if (!file) return;
        void importBackup(file)
          .catch(error => {
            console.error("Ocurrió un error al importar el respaldo.", error);
            setSettingsStatus("No pudimos completar la importación.", "error");
          })
          .finally(() => {
            elements.backupFile.value = "";
          });
      });
      elements.wishlistFilter.addEventListener("click", () => {
        elements.filter.value = elements.filter.value === "Deseado" ? "" : "Deseado";
        renderBooks();
      });
      elements.storeGrid.addEventListener("input", event => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        const bookId = input.dataset.storeBook;
        const site = input.dataset.storeSite;
        if (!bookId || (site !== "amazon" && site !== "mercadolibre")) return;
        const value = input.value.trim();
        const numericValue = value === "" ? null : Number(value);
        const current = storePrices[bookId] || { amazon: null, mercadolibre: null };
        if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0)) return;
        storePrices[bookId] = { ...current, [site]: numericValue };
        saveStorePrices(storePrices);
        const card = input.closest<HTMLElement>(".store-card");
        if (!card) return;
        const best = card.querySelector<HTMLElement>(".store-best-price");
        if (!best) return;
        const label = best.querySelector("span");
        const valueLabel = best.querySelector("strong");
        if (!label || !valueLabel) return;
        const updated = storePrices[bookId];
        const validPrices = [
          ...(updated.amazon !== null ? [["Amazon", updated.amazon] as const] : []),
          ...(updated.mercadolibre !== null ? [["Mercado Libre", updated.mercadolibre] as const] : [])
        ];
        if (validPrices.length === 0) {
          label.textContent = "Sin precios registrados";
          valueLabel.textContent = "";
        } else {
          validPrices.sort((left, right) => left[1] - right[1]);
          label.textContent = "Mejor precio";
          valueLabel.textContent = `${validPrices[0][0]} · ${formatStorePrice(validPrices[0][1])}`;
        }
      });
      elements.timerBook.addEventListener("change", renderTimer);
      elements.scanOpen.addEventListener("click", () => { void openScanner(); });
      elements.scanClose.addEventListener("click", () => elements.scannerDialog.close());
      elements.scanCancel.addEventListener("click", () => elements.scannerDialog.close());
      elements.scannerDialog.addEventListener("close", stopScanner);

      elements.timerToggle.addEventListener("click", () => {
        if (!timer) {
          const bookId = elements.timerBook.value;
          if (!bookId) return;
          const book = books.find(item => item.id === bookId);
          const startPage = Number(elements.timerStartPage.value);
          const pageCount = book ? getBookPageCount(book) : null;
          if (!Number.isSafeInteger(startPage) || startPage < 1 || (pageCount !== null && startPage > pageCount)) {
            elements.timerStatus.textContent = pageCount === null
              ? "Ingresa un número de página válido para comenzar."
              : `Elige una página entre 1 y ${pageCount}.`;
            elements.timerStartPage.focus();
            return;
          }
          timer = { bookId, elapsedSeconds: 0, startedAt: Date.now(), startPage };
          if (book && book.status === "Pendiente") book.status = "Leyendo";
          saveBooks();
        } else if (timer.startedAt !== null) {
          timer.elapsedSeconds = elapsedTime();
          timer.startedAt = null;
        } else {
          timer.startedAt = Date.now();
        }
        saveTimer();
        render();
      });

      elements.timerSave.addEventListener("click", () => {
        if (!timer) return;
        openSessionDialog();
      });

      elements.sessionForm.addEventListener("submit", event => {
        event.preventDefault();
        const activeTimer = timer;
        if (!activeTimer) return;
        const book = books.find(item => item.id === activeTimer.bookId);
        const endPageValue = elements.sessionEndPage.value.trim();
        const endPage = endPageValue ? Number(endPageValue) : null;
        if (!book) {
          elements.sessionFormError.textContent = "No encontramos el libro de esta sesión.";
          return;
        }
        if (endPageValue && (!Number.isSafeInteger(endPage) || (endPage ?? 0) < activeTimer.startPage)) {
          elements.sessionFormError.textContent = `La página final debe ser un número entero igual o mayor que ${activeTimer.startPage}.`;
          elements.sessionEndPage.focus();
          return;
        }
        const pageCount = getBookPageCount(book);
        if (endPage !== null && pageCount !== null && endPage > pageCount) {
          elements.sessionFormError.textContent = `La página final no puede superar el total del libro (${pageCount}).`;
          elements.sessionEndPage.focus();
          return;
        }

        const seconds = elapsedTime();
        if (seconds > 0) book.readingSeconds = (Number(book.readingSeconds) || 0) + seconds;
        let pagesReadThisSession = 0;
        if (endPage !== null) {
          pagesReadThisSession = endPage - activeTimer.startPage + 1;
          book.pagesRead = getBookPagesRead(book) + pagesReadThisSession;
          book.currentPage = endPage;
        }
        timer = null;
        elements.sessionDialog.close();
        saveBooks();
        saveTimer();
        render();
        const timeSummary = seconds > 0 ? formatReadingMinutes(seconds) : "0 min";
        const pagesSummary = pagesReadThisSession > 0 ? ` y ${pagesReadThisSession} páginas leídas` : "";
        showToast(`Sesión guardada: ${timeSummary}${pagesSummary}.`);
      });
      elements.sessionClose.addEventListener("click", () => elements.sessionDialog.close());
      elements.sessionCancel.addEventListener("click", () => elements.sessionDialog.close());

      elements.timerReset.addEventListener("click", () => {
        if (!timer || !window.confirm("¿Descartar esta sesión de lectura?")) return;
        timer = null;
        saveTimer();
        render();
        showToast("Sesión descartada.");
      });

      getElement<HTMLElement>("today").textContent = new Intl.DateTimeFormat("es", {
        weekday: "long", day: "numeric", month: "long"
      }).format(new Date());
      setupSidebarMenu();
      setupScreenWakeLock();
      updateSidebarNavigation();
      window.addEventListener("hashchange", updateSidebarNavigation);
      setupPwa();
      render();
      void localizeSavedAuthors();
      window.setInterval(() => {
        if (timer?.startedAt !== null && timer) {
          elements.timerDisplay.textContent = formatTime(elapsedTime());
          renderStats();
          renderProgress();
        }
      }, 1000);
})();

export {};
