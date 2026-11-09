import{test}from'@playwright/test';
test.setTimeout(120000);
test.beforeEach(async({page},info)=>{
 if(info.title.startsWith('atomic install')){
 page.on('pageerror',error=>console.log('Sheets offline page error: '+error.message));
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())console.log('Sheets offline navigation: '+new URL(frame.url()).pathname);});await page.goto('./?run=0');await page.locator('body[data-ready="true"]').waitFor();await page.click('#more-toggle');const reload=page.waitForEvent('domcontentloaded');await page.click('#offline-enable');await reload;await page.locator('body[data-ready="true"]').waitFor();}
});
test.afterEach(async({page},info)=>{
 if(info.title.startsWith('atomic install')&&info.status!==info.expectedStatus)console.log('Sheets offline diagnostics: '+JSON.stringify(await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return{url:location.pathname,scope:reg?.scope,controller:navigator.serviceWorker.controller?.scriptURL,status:document.getElementById('offline-status')?.textContent,ready:document.body.dataset.ready};})));
});
export default{
 ready:'body[data-ready="true"]',editor:'#editor',status:'#hashbin-status',draftKey:'sheets:draft',more:'#more-toggle',share:'#share',qr:'#qr',tabs:['Code','Preview'],example:'gfm-basic',cachePrefix:'sheets-offline-',offlineAsset:'src/fragment-ui.css',kitURL:'./vendor/fragment-kit-v0.3.5/src/index.js',
 isWrittenURL:href=>{const url=new URL(href);return url.hash.length>1||url.searchParams.has('compressed');},
 getSource:page=>page.evaluate(()=>SheetsOnline.getSource()),getDocument:page=>page.evaluate(()=>SheetsOnline.snapshot()),edit:(page,src)=>page.evaluate(src=>SheetsOnline.editor.setValue(src,-1),src),
 openMore:async page=>{if(!await page.locator('#fk-more-drawer').isVisible())await page.click('#more-toggle');},
 configureHashBin:async(context,clientId)=>context.route('**/',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/name="hashbin-client-id"\s+content="[^"]*"/,'name="hashbin-client-id" content="'+clientId+'"')});}),
 build:(page,doc,canonical=false)=>page.evaluate(async({doc,canonical})=>{const{urlState,config}=await import('./src/fragment-config.js');return urlState.build(doc,canonical?{url:config.canonicalOrigin}:{}).href;},{doc,canonical})
};
