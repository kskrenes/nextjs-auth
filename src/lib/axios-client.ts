import axios, { AxiosInstance } from 'axios';

export const axiosClient: AxiosInstance = axios.create();

// ── internal refresh-queue state ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
}

// ── call once from AuthProvider ───────────────────────────────────────────────
export function setupAuthInterceptor(onSignOut: () => void) {
  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      // Only handle 401s, and only once per request
      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      // Never retry the refresh endpoint itself — if that 401s, the session is gone
      if (original.url?.includes('/api/auth/refresh')) {
        onSignOut();
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(original))
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/auth/refresh'); // use plain axios, not the intercepted client
        processQueue(null);
        return axiosClient(original);           // retry the original request
      } catch (refreshError) {
        processQueue(refreshError);
        onSignOut();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}