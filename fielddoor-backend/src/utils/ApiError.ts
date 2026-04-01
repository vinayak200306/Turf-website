export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(statusCode: number, message: string, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
