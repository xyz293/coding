class Axios { // 类名首字母大写（规范，可选但推荐）
  constructor(config) {
    this.config = { ...config };
    this.inter = {
      request: {
        handler: [], // 修正：headler → handler
        use: (fulfilled, rejected) => {
          this.inter.request.handler.push({ fulfilled, rejected });
        }
      },
      response: {
        handler: [], // 修正：headler → handler
        use: (ful, reject) => {
          this.inter.response.handler.push({ ful, reject });
        }
      }
    };
  }

  request(config) {
    // 修正：声明 finalconfig（避免隐式全局变量）
    let finalconfig = { ...this.config, ...config };
    let promiseChain = Promise.resolve(finalconfig);

    // 执行请求拦截器（按顺序执行）
    this.inter.request.handler.forEach((item) => {
      // 修正：拦截器函数对应正确（fulfilled → item.fulfilled，rejected → item.rejected）
      promiseChain = promiseChain.then(item.fulfilled, item.rejected);
    });

    // 发起真实 XHR 请求
    promiseChain = promiseChain.then((finalconfig) => {
      return new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          // 修正：baseurl 拼接（避免 url 错误，注意协议+端口格式）
          const fullUrl = finalconfig.baseurl 
            ? `${finalconfig.baseurl}${finalconfig.url}` 
            : finalconfig.url;
          xhr.open(finalconfig.method || 'GET', fullUrl);

          // 设置超时（如果配置了 timeout）
          if (finalconfig.timeout) {
            xhr.timeout = finalconfig.timeout;
            xhr.ontimeout = () => {
              reject(new Error(`Timeout of ${finalconfig.timeout}ms exceeded`));
            };
          }

          // 修正：onload 是赋值语法（不是函数调用）
          xhr.onload = () => {
            try {
              const response = {
                data: xhr.responseText ? JSON.parse(xhr.responseText) : {}, // 兼容空响应
                status: xhr.status,
                statusText: xhr.statusText
              };
              if (response.status >= 200 && response.status < 300) {
                resolve(response);
              } else {
                reject(new Error(`Request failed with status code ${response.status}`));
              }
            } catch (err) {
              reject(new Error(`Parse response failed: ${err.message}`));
            }
          };

          // 处理网络错误
          xhr.onerror = () => {
            reject(new Error('Network request failed'));
          };

          // 发送请求（POST 需设置请求头，否则后端可能解析失败）
          if (finalconfig.method?.toUpperCase() === 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
            xhr.send(JSON.stringify(finalconfig.data || {}));
          } else {
            xhr.send();
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    // 执行响应拦截器（按顺序执行）
    this.inter.response.handler.forEach((item) => {
      promiseChain = promiseChain.then(item.ful, item.reject);
    });

    return promiseChain;
  }
}

// 1. 实例化（变量名：myaxios，正确拼写）
const myaxios = new Axios({
  baseurl: 'http://localhost:3000', // 修正：加协议 http://（否则请求会失败）
  timeout: 1000
});

// 2. 注册请求拦截器（修正：变量名 myaixos → myaxios）
myaxios.inter.request.use((config) => {
  console.log('请求拦截器执行：', config);
  return config; // 必须返回 config，否则后续拿不到配置
}, (err) => {
  return Promise.reject(err);
});

myaxios.inter.response.use((res) => {
  console.log('响应拦截器执行：', res);
  return res; // 必须返回 res，否则业务层拿不到数据
}, (err) => {
  console.error('响应错误拦截：', err);
  return Promise.reject(err);
});

myaxios.request({
  method: 'get',
  url: '/user/userinfo',
}).then((res) => {
  console.log('请求成功：', res.data);
}).catch((err) => {
  console.log('请求失败：', err.message);
});