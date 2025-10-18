// index.js
import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";
// 初始化客户端
const client = new ZhipuAI({
  apiKey: '4f3ba9f1d42d40d698ab85d093fea114.FfIgOm7Rr0Eobrna', // 请提前在环境变量里设置你的 API Key
});

async function main(content) {
   try{
     const response = await client.createCompletions({
      model: "glm-4", 
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      stream: false,
    });
   
   }
   catch(error){
    console.error('调用失败:', error);
   }
 
}
// 执行
main('西南石油大学是啥学校');
