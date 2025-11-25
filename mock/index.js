import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.get('/api1', (req, res) => {
     res.json({
        code: 0,
        msg: 'success',
        data: {
            name: '张三',
            age: 18,
        }
     })
});
app.get('/api2', (req, res) => {
    res.json({
        code: 0,
        msg: 'success',
        data: {
            name: '张三',
            age: 18,
        }
    })
})
app.post('/api3', (req, res) => {
       const {id} =req.body;
       if(id===1){
        res.json({
            code: 0,
            msg: 'success',
            data: {
                name: '张三',
                age: 18,
            }
        })
       }
})
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
