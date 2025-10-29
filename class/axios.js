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

    // 请求队列，用于存储待处理的请求
    this.requestQueue = [];
    this.isRequestInProgress = false; // 标记当前是否有请求正在进行
  }

  // 请求方法
  request(config) {
    let finalConfig = { ...this.defaultConfig, ...config };

    let promiseChain = Promise.resolve(finalConfig);
    this.interceptors.request.handlers.forEach(({ fulfilled, rejected }) => {
      promiseChain = promiseChain.then(fulfilled, rejected);
    });

    // 请求执行部分
    promiseChain = promiseChain.then((config) => {
      return new Promise((resolve, reject) => {
        // 将当前请求和 resolve, reject 放入队列中
        this.addToQueue(config, resolve, reject);
      });
    });

    // 执行响应拦截器（按注册顺序执行）
    this.interceptors.response.handlers.forEach(({ fulfilled, rejected }) => {
      promiseChain = promiseChain.then(fulfilled, rejected);
    });

    // 返回最终的 Promise 对象
    return promiseChain;
  }

  // 将请求加入队列
  addToQueue(config, resolve, reject) {
    // 如果当前没有请求正在进行，直接执行请求
    if (!this.isRequestInProgress) {
      this.isRequestInProgress = true;
      this.executeRequest(config, resolve, reject);
    } else {
      // 如果有请求在进行中，将当前请求加入队列
      this.requestQueue.push({ config, resolve, reject });
    }
  }

  // 执行请求
  executeRequest(config, resolve, reject) {
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
      } finally {
        // 执行完当前请求后，继续队列中的下一个请求
        this.processNextRequest();
      }
    };

    xhr.onerror = () => {
      reject(new Error("请求失败"));
      this.processNextRequest(); // 请求失败也需要继续下一个请求
    };

    // 设置请求头
    xhr.setRequestHeader("Content-Type", "application/json");

    // 发送请求
    if (config.method.toUpperCase() === "POST") {
      xhr.send(JSON.stringify(config.data)); 
    } else {
      xhr.send(); // GET 请求无需数据
    }
  }

  // 处理队列中的下一个请求
  processNextRequest() {
    if (this.requestQueue.length > 0) {
      // 从队列中取出下一个请求
      const nextRequest = this.requestQueue.shift();
      // 执行下一个请求
      this.executeRequest(nextRequest.config, nextRequest.resolve, nextRequest.reject);
    } else {
      // 如果队列为空，说明所有请求都已完成
      this.isRequestInProgress = false;
    }
  }
}

// 创建 axios 实例
const axiosInstance = new axios({ baseURL: "https://api.example.com" });

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

axiosInstance
  .request({
    url: "/user/2",
    method: "get",
  })
  .then((response) => {
    console.log("用户数据2:", response.data);
  })
  .catch((error) => {
    console.error("请求错误2:", error);
  });
