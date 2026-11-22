// Serveur Node.js. Ne pas inclure ce fichier dans une balise <script>.
const http = require('node:http');
const {readFile} = require('node:fs/promises');
const path = require('node:path');
const E = process.env;
async function json(url, token){
  const res=await fetch(url,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(8000)});
  if(!res.ok) throw Error('API indisponible'); return res.json();
}
async function counter(enabled, load){
  if(!enabled) return 'off';
  try{const raw=await load(); if(!/^\d+$/.test(String(raw))) return null;
    const n=Number(raw); return Number.isSafeInteger(n)?n:null;
  }catch{return null;}
}
async function collect(){
  const [youtube,tiktok,instagram]=await Promise.all([
    counter(E.YOUTUBE_API_KEY,async()=>{
      const u=new URL('https://www.googleapis.com/youtube/v3/channels');
      u.search=new URLSearchParams({part:'statistics',forHandle:'@lucas_fpv28',key:E.YOUTUBE_API_KEY});
      const s=(await json(u)).items?.[0]?.statistics; return s?.hiddenSubscriberCount?null:s?.subscriberCount;
    }),
    counter(E.TIKTOK_ACCESS_TOKEN,async()=>{
      const d=await json('https://open.tiktokapis.com/v2/user/info/?fields=follower_count',E.TIKTOK_ACCESS_TOKEN);
      return d.data?.user?.follower_count;
    }),
    counter(E.IG_ACCESS_TOKEN && E.IG_USER_ID && E.IG_API_VERSION,async()=>{
      if(!/^v\d+\.\d+$/.test(E.IG_API_VERSION)||!/^\d+$/.test(E.IG_USER_ID))return null;
      const d=await json(`https://graph.instagram.com/${E.IG_API_VERSION}/${E.IG_USER_ID}?fields=followers_count`,E.IG_ACCESS_TOKEN);
      return d.followers_count;
    })
  ]);
  return {at:Date.now(),stats:{youtube,tiktok,instagram}};
}
let cache,pending;
async function stats(){
  if(cache && Date.now()-cache.at<300000)return cache;
  if(!pending)pending=collect().then(d=>(cache=d)).finally(()=>{pending=null});
  return pending;
}
http.createServer(async(req,res)=>{
  try{
    const route=req.url.split('?')[0];
    if(route==='/api/stats'){
      const body=JSON.stringify(await stats());res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(body);
    }
    const file=route==='/'||route==='/index.html'?'index.html':route==='/style.css'?'style.css':null;
    if(!file){res.writeHead(404);return res.end('Introuvable');}
    const body=await readFile(path.join(__dirname,file));res.writeHead(200,{'Content-Type':(file.endsWith('css')?'text/css':'text/html')+'; charset=utf-8'});res.end(body);
  }catch{res.writeHead(500);res.end('Service indisponible');}
}).listen(Number(E.PORT)||3000,()=>console.log('Lucas FPV : serveur prêt.'));
