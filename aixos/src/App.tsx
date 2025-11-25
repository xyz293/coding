      
import { getapi } from './api/get';
import { useEffect } from 'react';
function App() {
    const show = async()=>{
        const res = await getapi();
        console.log(res);
    }
    useEffect(()=>{
        show();
    },[])
  return (
    <>
      <button onClick={show}>show</button>
    </>
  )
}

export default App
