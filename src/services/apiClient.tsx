import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, BASE_URL } from '../constants/apiConfig';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('userToken');
  }

  private getCacheKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  private async getCachedResponse(cacheKey: string): Promise<any | null> {
    const cached = cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  private setCachedResponse(cacheKey: string, data: any): void {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = false,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(url, params);
    
    // Check cache for GET requests
    if (useCache && options.method === 'GET') {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        return { data: cached, status: 200, ok: true };
      }
    }

    // Check for pending requests to avoid duplicates
    if (pendingRequests.has(cacheKey)) {
      const data = await pendingRequests.get(cacheKey);
      return { data, status: 200, ok: true };
    }

    // Add auth token if available
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestPromise = fetch(url, {
      ...options,
      headers,
    }).then(async (response) => {
      const text = await response.text();
      let data: T;
      
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        throw new Error(errorData?.error || errorData?.message || `HTTP ${response.status}`);
      }

      // Cache successful GET responses
      if (useCache && response.ok && options.method === 'GET') {
        this.setCachedResponse(cacheKey, data);
      }

      return data;
    });

    pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const data = await requestPromise;
      return { data, status: 200, ok: true };
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>, useCache: boolean = true): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    const response = await this.makeRequest<T>(url, { method: 'GET' }, useCache, params);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, { method: 'DELETE' });
    return response.data;
  }

  // Clear cache for specific endpoint or all cache
  clearCache(endpoint?: string): void {
    if (endpoint) {
      for (const key of cache.keys()) {
        if (key.startsWith(endpoint)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(BASE_URL);

// Helper functions for common API patterns
export const api = {
  get: <T,>(endpoint: string, params?: Record<string, any>, useCache?: boolean) => 
    apiClient.get<T>(endpoint, params, useCache),
  post: <T,>(endpoint: string, data?: any) => apiClient.post<T>(endpoint, data),
  put: <T,>(endpoint: string, data?: any) => apiClient.put<T>(endpoint, data),
  delete: <T,>(endpoint: string) => apiClient.delete<T>(endpoint),
  clearCache: (endpoint?: string) => apiClient.clearCache(endpoint),
};
