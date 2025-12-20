/**
 * SEKA Security Utilities
 * Gestion sécurisée des erreurs et protection des données sensibles
 */

// Messages d'erreur génériques pour l'utilisateur final
export const ERROR_MESSAGES = {
  NETWORK: "Problème de connexion. Vérifiez votre connexion internet.",
  SERVER: "Le serveur est temporairement indisponible. Réessayez dans quelques instants.",
  AUTH: "Votre session a expiré. Veuillez vous reconnecter.",
  FORBIDDEN: "Vous n'avez pas les droits pour effectuer cette action.",
  NOT_FOUND: "La ressource demandée n'existe pas.",
  VALIDATION: "Certaines informations sont incorrectes. Vérifiez votre saisie.",
  RATE_LIMIT: "Trop de requêtes. Veuillez patienter quelques instants.",
  UNKNOWN: "Une erreur inattendue s'est produite.",
};

// Types d'erreurs
export type ErrorType = keyof typeof ERROR_MESSAGES;

interface SecureError {
  type: ErrorType;
  message: string;
  errorId?: string;
  retryable: boolean;
}

/**
 * Transforme une erreur technique en message utilisateur sécurisé
 * Ne révèle jamais les détails techniques en production
 */
export function getSecureErrorMessage(error: unknown): SecureError {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Axios error
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { error_id?: string; error?: string; message?: string };
      };
      code?: string;
    };
    
    const status = axiosError.response?.status;
    const errorId = axiosError.response?.data?.error_id;
    
    // Network errors
    if (axiosError.code === "ERR_NETWORK" || axiosError.code === "ECONNABORTED") {
      return {
        type: "NETWORK",
        message: ERROR_MESSAGES.NETWORK,
        retryable: true,
      };
    }
    
    // HTTP status codes
    switch (status) {
      case 401:
        return {
          type: "AUTH",
          message: ERROR_MESSAGES.AUTH,
          retryable: false,
        };
      case 403:
        return {
          type: "FORBIDDEN",
          message: ERROR_MESSAGES.FORBIDDEN,
          retryable: false,
        };
      case 404:
        return {
          type: "NOT_FOUND",
          message: ERROR_MESSAGES.NOT_FOUND,
          retryable: false,
        };
      case 422:
        return {
          type: "VALIDATION",
          message: ERROR_MESSAGES.VALIDATION,
          retryable: false,
        };
      case 429:
        return {
          type: "RATE_LIMIT",
          message: ERROR_MESSAGES.RATE_LIMIT,
          retryable: true,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: "SERVER",
          message: errorId 
            ? `${ERROR_MESSAGES.SERVER} (Ref: ${errorId})`
            : ERROR_MESSAGES.SERVER,
          errorId,
          retryable: true,
        };
      default:
        return {
          type: "UNKNOWN",
          message: isProduction 
            ? ERROR_MESSAGES.UNKNOWN 
            : axiosError.response?.data?.message || ERROR_MESSAGES.UNKNOWN,
          errorId,
          retryable: true,
        };
    }
  }
  
  // Generic error
  return {
    type: "UNKNOWN",
    message: isProduction ? ERROR_MESSAGES.UNKNOWN : String(error),
    retryable: true,
  };
}

/**
 * Désactive les logs console en production
 * Empêche l'affichage des URLs API et données sensibles
 */
export function initProductionSecurity(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  
  // Sauvegarder les fonctions originales pour les erreurs critiques
  const originalError = console.error;
  
  // Remplacer console.log et console.debug
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.trace = () => {};
  
  // Garder console.warn et console.error mais filtrer les données sensibles
  console.warn = (...args: unknown[]) => {
    const filtered = args.map(arg => filterSensitiveData(arg));
    originalError.apply(console, ["[WARN]", ...filtered]);
  };
  
  console.error = (...args: unknown[]) => {
    const filtered = args.map(arg => filterSensitiveData(arg));
    originalError.apply(console, ["[ERROR]", ...filtered]);
  };
  
  // Bloquer les outils de développement (optionnel - peut être contourné)
  // Détection basique des DevTools
  let devtoolsOpen = false;
  const threshold = 160;
  
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        // Log minimal - pas d'action bloquante
        originalError("[Security] DevTools detected");
      }
    } else {
      devtoolsOpen = false;
    }
  };
  
  // Vérifier périodiquement (discret)
  setInterval(checkDevTools, 1000);
}

/**
 * Filtre les données sensibles des logs
 */
function filterSensitiveData(data: unknown): unknown {
  if (typeof data === "string") {
    // Masquer les tokens
    let filtered = data.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
    // Masquer les URLs API complètes
    filtered = filtered.replace(/https?:\/\/api\.[^\/\s]+\/api\/v1\/[^\s]*/gi, "[API_CALL]");
    // Masquer les emails
    filtered = filtered.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
    return filtered;
  }
  
  if (typeof data === "object" && data !== null) {
    // Ne pas exposer les objets complexes
    return "[Object]";
  }
  
  return data;
}

/**
 * Headers de sécurité pour les requêtes API
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Requested-With": "XMLHttpRequest",
    "X-Content-Type-Options": "nosniff",
  };
}

/**
 * Vérifie si l'utilisateur est dans un environnement sécurisé (HTTPS)
 */
export function isSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext || window.location.protocol === "https:";
}

/**
 * Nettoie les données sensibles avant de les stocker
 */
export function sanitizeForStorage(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "token", "secret", "key", "credential"];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      delete sanitized[key];
    }
  }
  
  return sanitized;
}
