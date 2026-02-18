export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}
