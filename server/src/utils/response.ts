import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
  error?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: unknown
) => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
};
