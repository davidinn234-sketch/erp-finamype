import express from 'express';
import path from 'node:path';
import app from './server/app';
const PORT = Number(process.env.PORT || 3000);
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const {createServer}=await import('vite');
    const vite=await createServer({server:{middlewareMode:true,hmr:{port:PORT+21678}},appType:'spa'});
    app.use(vite.middlewares);
  } else {
    const distPath=path.join(process.cwd(),'dist');
    app.use(express.static(distPath));
    app.get('*', (_req,res)=>res.sendFile(path.join(distPath,'index.html')));
  }
  app.listen(PORT,'0.0.0.0',()=>console.log('Fina Pyme disponible en http://localhost:'+PORT));
}
if (!process.env.VERCEL) startServer();
