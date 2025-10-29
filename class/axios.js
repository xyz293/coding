class axios {
  constructor(defaultConfig) {
    // 默认配置
    this.defaultConfig = { ...defaultConfig };
    // 拦截器对象：请求拦截器和响应拦截器
    this.interceptors = {
      request: {
        handlers: [],
        use(fulfilled, rejected) {
          this.handlers.push({ fulfilled, rejected });
        },
      },
      response: {
        handlers: [],
        use(fulfilled, rejected) {
          this.handlers.push({ fulfilled, rejected });
        },
      },
    };
  }

  // 请求方法
  request(config) {
    // 合并默认配置与请求配置
    let finalConfig = { ...this.defaultConfig, ...config };
    
    let promiseChain = Promise.resolve(finalConfig);
    this.interceptors.request.handlers.forEach(({ fulfilled, rejected }) => {
      promiseChain = promiseChain.then(fulfilled, rejected);
    });

    // 请求执行部分
    promiseChain = promiseChain.then((config) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = config.baseURL + config.url;

        xhr.open(config.method.toUpperCase(), url);

        xhr.onload = () => {
          const response = {
            data: xhr.responseText,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
          };
          try {
            response.data = JSON.parse(response.data); // 尝试解析 JSON 数据
            resolve(response); // 请求成功，返回解析后的数据
          } catch (error) {
            reject(error); 
          }
        };

        xhr.onerror = () => reject(new Error("请求失败"));

        // 设置请求头
        xhr.setRequestHeader("Content-Type", "application/json");

        // 发送请求
        if (config.method.toUpperCase() === "POST") {
          xhr.send(JSON.stringify(config.data)); // POST 请求发送数据
        } else {
          xhr.send(); // GET 请求无需数据
        }
      });
    });

    // 执行响应拦截器（按注册顺序执行）
    this.interceptors.response.handlers.forEach(({ fulfilled, rejected }) => {
      promiseChain = promiseChain.then(fulfilled, rejected);
    });

    // 返回最终的 Promise 对象
    return promiseChain;
  }
}

// 创建 axios 实例
const axiosInstance = new axios({ baseURL: "https://api.example.com" });

// 添加请求拦截器：设置 Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {}; // 确保 headers 存在
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// 添加响应拦截器：统一处理响应
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300) {
      return response; // 请求成功，直接返回响应数据
    }
    return Promise.reject(new Error("请求失败"));
  },
  (err) => {
    // 处理请求失败的情况（例如 401 错误）
    if (err.response && err.response.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// 使用 axios 实例发起请求
axiosInstance
  .request({
    url: "/user",
    method: "get",
  })
  .then((response) => {
    console.log("用户数据:", response.data);
  })
  .catch((error) => {
    console.error("请求错误:", error);
  });
