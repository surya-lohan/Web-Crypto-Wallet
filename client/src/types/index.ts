export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any[];
  status?: number;
}

export * from './auth';
export * from './wallet';
export * from './crypto';