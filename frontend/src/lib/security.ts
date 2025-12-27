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

export type ErrorType = keyof typeof ERROR_MESSAGES;

interface SecureError {
  type: ErrorType;
  message: string;
  errorId?: string;
  retryable: boolean;
}

export function getSecureErrorMessage(error: unknown): SecureError {
  const isProduction = process.env.NODE_ENV === "production";
  
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
    
    if (axiosError.code === "ERR_NETWORK" || axiosError.code === "ECONNABORTED") {
      return {
        type: "NETWORK",
        message: ERROR_MESSAGES.NETWORK,
        retryable: true,
      };
    }
    
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
  
  return {
    type: "UNKNOWN",
    message: isProduction ? ERROR_MESSAGES.UNKNOWN : String(error),
    retryable: true,
  };
}

export function initProductionSecurity(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  
  const originalError = console.error;
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.trace = () => {};
  
  console.warn = (...args: unknown[]) => {
    const filtered = args.map(arg => filterSensitiveData(arg));
    originalError.apply(console, ["[WARN]", ...filtered]);
  };
  
  console.error = (...args: unknown[]) => {
    const filtered = args.map(arg => filterSensitiveData(arg));
    originalError.apply(console, ["[ERROR]", ...filtered]);
  };
  
  let devtoolsOpen = false;
  const threshold = 160;
  
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
      }
    } else {
      devtoolsOpen = false;
    }
  };
  
  setInterval(checkDevTools, 1000);
}

function filterSensitiveData(data: unknown): unknown {
  if (typeof data === "string") {
    let filtered = data.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
    filtered = filtered.replace(/https?:\/\/api\.[^\/\s]+\/api\/v1\/[^\s]*/gi, "[API_CALL]");
    filtered = filtered.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
    return filtered;
  }
  
  if (typeof data === "object" && data !== null) {
    return "[Object]";
  }
  
  return data;
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Requested-With": "XMLHttpRequest",
    "X-Content-Type-Options": "nosniff",
  };
}

export function isSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext || window.location.protocol === "https:";
}

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
