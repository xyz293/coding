const express = require('express');
const app = express();
const port = 3000;
const path =require('path');
const fs =require('fs');
const multiparty = require('multiparty');   //进行解析multipart/form-data格式的请求体
const uploadDir =path.resolve(__dirname,'file');
app.post('/upload',(req,res)=>{
  const form =new multiparty.Form();
  form.parse(req,(err,fiedls,file)=>{
    if(err){
      res.json({error:{
        message:'上传失败',
        code:404
      }});
    }
    else {
      const filehash =fiedls['fileHash'][0];
      const chunkhash = fiedls['chunkHash'][0];
      const filedir =path.resolve(uploadDir,filehash);
      if(!fs.existsSync(filedir)){
        fs.mkdirSync(filedir);
      }
      const chunkfile =path.resolve(filedir,chunkhash);
      if (!fs.existsSync(chunkfile)) {
    fs.renameSync(file['file'][0].path, chunkfile); // 保存分片
}
      res.json({
        message:'上传成功',
        code:200
      })
    }
  })
})
app.post('/merge',async (req,res)=>{
     const {fileHash,filename} = req.body;
     const chunkdir =path.resolve(uploadDir,fileHash);
     const finalFile =path.resolve(uploadDir,filename);
     const file = await fs.readdir(chunkdir); //读取文件夹下所有分片文件名
     if(fs.existsSync(finalFile)){
         res.json({
          message:'上传成功',
          code:200
        })
     }
     file.sort((a,b)=>{
       return a.split('.')[0]-b.split('.')[0];
     })
     const writeStream = fs.createWriteStream(finalFile);
      for (const chunk of file) {  //这里的chunk是分片文件名
    const chunkPath = path.resolve(chunkdir, chunk);

    await new Promise((resolve) => {
      const readStream = fs.createReadStream(chunkPath);
      readStream.pipe(writeStream, { end: false });
      readStream.on('end', () => {
        fs.unlinkSync(chunkPath); // 删除分片
        resolve();
      });
    });
  }

      writeStream.end(); // 写入完成
})
app.listen(port,()=>{
  console.log(`Example app listening at http://localhost:${port}`)
})
