'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../app/src/main/assets');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8'};
const port=Number(process.env.CURIER_PORT||4173);
const server=http.createServer((req,res)=>{let file;try{file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}file=path.resolve(root,'.'+(file==='/'?'/index.html':file));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);});});
server.listen(port,'127.0.0.1',()=>console.log(`Curier de cartier: http://127.0.0.1:${port}\nCtrl+C opreste previzualizarea.`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
