import { ErrorDTO, ErrorDTOToJSON } from "@dto/ErrorDTO";
import { createAppError } from "@services/errorService";
import { Request, Response, NextFunction } from "express";


const STANDARD_ERRORS: {
  [status: number]: { name: string; defaultMessage: string };
} = {
  400: { name: "BadRequest", defaultMessage: "Invalid input data" },
  401: { name: "UnauthorizedError", defaultMessage: "Unauthorized: Invalid token format" },
  403: { name: "InsufficientRightsError", defaultMessage: "Forbidden: Insufficient rights" },
  404: { name: "NotFoundError", defaultMessage: "Entity not found" },
  409: { name: "ConflictError", defaultMessage: "Entity already exists" },
};


export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {


  const status: number = typeof err.status === "number"
    ? err.status
    : typeof err.code === "number"
    ? err.code
    : 500;


  if (STANDARD_ERRORS[status]) {
    const { name, defaultMessage } = STANDARD_ERRORS[status];

    const message: string = err.message || defaultMessage;

    const details: any = err.details || err.errors || undefined;

    const appError: ErrorDTO = {
      code: status,
      name,
      message,
      ...(details ? { details } : {}),
    };

    console.error(`[${status}] ${name}: ${message}`, {
      details,
      stack: err.stack,
    });

    res.status(status).json(ErrorDTOToJSON(appError));
    return;
  }

  const appError: ErrorDTO = createAppError(err);

  console.error(`[${appError.code}] ${appError.name}: ${appError.message}`, {
    original: err,
    stack: err.stack,
  });

  res.status(appError.code).json(ErrorDTOToJSON(appError));
}
