// API Client with automatic token refresh queue and event dispatching for visualization

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  // Báo cho UI biết token đã thay đổi
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:token-changed', { detail: token }));
  }
};

const processQueue = (token: string) => {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
};

const rejectQueue = () => {
  refreshQueue = [];
};

const dispatchLog = (message: string, type: 'info' | 'success' | 'warn' | 'error') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:log', { detail: { message, type, time: new Date().toLocaleTimeString() } }));
  }
};

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  _retry?: boolean; // Cờ đánh dấu request đã được thử lại để tránh lặp vô hạn
}

export async function apiClient(url: string, options: RequestOptions = {}): Promise<Response> {
  const method = options.method || 'GET';
  const headers = { ...options.headers };

  // Đính kèm Access Token nếu có trong bộ nhớ (memory)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Mặc định set content-type là application/json nếu chưa có và có body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  dispatchLog(`🚀 Đang gọi: ${method} ${url}`, 'info');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  dispatchLog(`📥 Kết quả: ${method} ${url} -> Status ${response.status}`, response.ok ? 'success' : 'error');

  // Spring Security trả về 403 Forbidden khi Token hết hạn/không hợp lệ
  const isAuthError = response.status === 401 || response.status === 403;

  // Nếu gặp lỗi xác thực và không phải là các request login/logout/refresh, đồng thời chưa thử lại lần nào
  if (isAuthError && 
      !url.includes('/api/auth/refresh') && 
      !url.includes('/api/auth/login') && 
      !url.includes('/api/auth/logout') && 
      !options._retry) {
    dispatchLog(`⚠️ Lỗi ${response.status}! Access Token đã hết hạn hoặc không hợp lệ (Spring Security trả về ${response.status}).`, 'warn');

    if (isRefreshing) {
      dispatchLog(`⏳ Đang chạy refresh token ngầm, đưa request này vào hàng đợi...`, 'info');
      // Nếu đang trong quá trình refresh token, đưa request này vào hàng đợi (Queue)
      return new Promise<Response>((resolve, reject) => {
        refreshQueue.push((newToken) => {
          dispatchLog(`🔄 Lấy request trong hàng đợi ra chạy lại với token mới...`, 'info');
          headers['Authorization'] = `Bearer ${newToken}`;
          
          const retryOptions = { ...options, headers, _retry: true };
          fetch(url, retryOptions)
            .then((res) => {
              dispatchLog(`📥 Kết quả (chạy lại): ${method} ${url} -> Status ${res.status}`, res.ok ? 'success' : 'error');
              resolve(res);
            })
            .catch(reject);
        });
      });
    }

    // Bắt đầu quá trình refresh token
    isRefreshing = true;
    dispatchLog(`🔄 Khởi chạy luồng Refresh Token (Gửi HttpOnly cookie tự động)`, 'warn');

    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (refreshResponse.ok) {
        const apiRes = await refreshResponse.json();
        
        if (apiRes.success && apiRes.data?.token) {
          const newToken = apiRes.data.token;
          
          dispatchLog(`✅ Refresh Token thành công! Đã nhận được Access Token mới.`, 'success');
          
          // Lưu token mới vào memory
          setAccessToken(newToken);
          
          // Giải phóng hàng đợi các request đang chờ
          processQueue(newToken);
          
          // Thực hiện lại request hiện tại kèm cờ _retry = true
          headers['Authorization'] = `Bearer ${newToken}`;
          dispatchLog(`🔁 Thực hiện lại request bị lỗi ban đầu...`, 'info');
          
          const retryOptions = { ...options, headers, _retry: true };
          return await fetch(url, retryOptions);
        } else {
          throw new Error(apiRes.message || 'Lỗi không xác định khi làm mới token');
        }
      } else {
        dispatchLog(`❌ Refresh Token thất bại (Cookie hết hạn hoặc không hợp lệ).`, 'error');
        // Nếu refresh thất bại (Refresh token hết hạn), thực hiện logout
        setAccessToken(null);
        rejectQueue();
        
        // Kích hoạt sự kiện logout để React Context cập nhật UI
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
        
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    } catch (error) {
      setAccessToken(null);
      rejectQueue();
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
