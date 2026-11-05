// Sheets keeps offline downloads opt-in; the kit owns verification and atomic updates.
import{OfflineClient}from'../vendor/fragment-kit-v0.3.4/src/index.js';
const base=new URL('../',import.meta.url),workerURL=new URL('sw.js',base);
let watching=false;
export function watchOfflineUpdates(beforeReload=()=>{}){
 if(watching||!('serviceWorker'in navigator))return;watching=true;let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading||!navigator.serviceWorker.controller?.scriptURL.startsWith(workerURL.href))return;reloading=true;beforeReload();location.reload();});
}
export async function setupOffline({beforeReload,container,status}={}){
 watchOfflineUpdates(beforeReload);
 if(!container)return;
 const make=(id,label)=>{const button=document.createElement('button');button.id=id;button.textContent=label;container.append(button);return button;};
 const note=document.createElement('p');note.textContent='Download the editor, examples and vendored engines for offline use. Python, R and external services require a connection.';container.append(note);
 const enable=make('offline-enable','Download offline files'),repair=make('offline-repair','Repair offline copy'),update=make('offline-update','Update and reload'),remove=make('offline-remove','Remove offline files');
 let client;
 const refresh=result=>{status.textContent=result.ready?'Available offline':'Offline files incomplete';enable.textContent=result.ready?'Check for updates':'Download offline files';repair.hidden=false;remove.hidden=false;};
 client=new OfflineClient({url:workerURL.href,onStatus:refresh,onUpdate:()=>{update.hidden=false;status.textContent='Offline update ready';}});
 update.hidden=true;repair.hidden=true;remove.hidden=true;status.textContent='Offline files not downloaded';
 if(!('serviceWorker'in navigator)){enable.disabled=true;status.textContent='Offline storage is unavailable in this browser.';return;}
 enable.onclick=async()=>{enable.disabled=true;try{if(client.registration?.active){if(!(await client.status()).ready)await client.repair();else await client.registration.update();}else await client.init();}catch(error){status.textContent=error.message;}finally{enable.disabled=false;}};
 repair.onclick=()=>client.repair().catch(error=>{status.textContent=error.message;});
 update.onclick=()=>{beforeReload?.();client.activateUpdate();};
 remove.onclick=async()=>{remove.disabled=true;try{await client.registration?.unregister();await Promise.all((await caches.keys()).filter(name=>name.startsWith('sheets-offline-')||name.startsWith('sheets-offline:'+base.pathname+':')).map(name=>caches.delete(name)));client.registration=null;repair.hidden=remove.hidden=update.hidden=true;enable.textContent='Download offline files';status.textContent='Offline files removed from this browser.';}catch(error){status.textContent=error.message;}finally{remove.disabled=false;}};
 document.getElementById('offline-open').onclick=async()=>{document.getElementById('download-menu').open=false;if(client.registration?.active)await client.status();enable.focus();};
 try{
  const registration=await navigator.serviceWorker.getRegistration(base);
  if(registration?.scope===base.href){client.registration=registration;const observe=event=>{if(registration.waiting)client.onUpdate();else if(event?.target?.state==='redundant')status.textContent='Offline update failed verification. Installed copy kept.';};observe();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',observe));await client.status();}
 }catch(error){status.textContent=error.message;}
 return client;
}
