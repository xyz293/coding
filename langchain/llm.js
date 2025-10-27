import ZhipuAI from "zhipuai-sdk-nodejs-v4";

const client = new ZhipuAI({
  apiKey: '0697ef5958ad41399d2b9e3eaa1b9b2c.fRPLQxIfKEnEfXYr',
});

async function main() {
  const response = await client.chat({
    model: "glm-4-flash",
    messages: [
      { role: "user", content: "你好，介绍一下你自己" }
    ],
  });

  console.log(response.data);
}

main();
