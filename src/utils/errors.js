// Arquivo: src/utils/errors.js

/**
 * Classe de erro personalizada para incluir um status HTTP.
 * Facilita o tratamento de erros no middleware global.
 */
export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name; // Garante que o nome da classe seja correto
    this.status = status;
    // Captura o stack trace (opcional, mas útil para debug)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    message: err.message || 'Erro interno do servidor.',
    errors: err.errors || null
  });
}
