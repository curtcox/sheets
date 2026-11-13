import {mountGalleryAi,aiCallback} from './ai-client.js';
import {config,type} from './fragment-config.js';
if(aiCallback()) await new Promise(()=>{});
function mountGallery(options){const gallery=mountOriginalGallery(options);queueMicrotask(()=>void mountGalleryAi({config,type,...options}).catch(error=>{const p=document.createElement('p');p.setAttribute('role','status');p.textContent=error.message;options.container.before(p);}));return gallery;}
import{watchOfflineUpdates}from'./offline.js';
import{mountGallery as mountOriginalGallery}from'../vendor/fragment-kit-v0.4.3/src/index.js';
import{catalog}from'./gallery-catalog.js';
watchOfflineUpdates();
const container=document.getElementById('gallery');
mountGallery({container,catalog:catalog.map(example=>({...example,cover:'gallery/covers/'+example.id+'.png'})),urlState:{build:doc=>({href:'index.html?example='+encodeURIComponent(catalog.find(example=>example.document===doc).id)})}});
container.querySelector('input').id='search';container.querySelector('select').id='filter';container.querySelector('select').setAttribute('aria-label','Filter by format');container.querySelector('[role=status]').id='gallery-status';container.querySelector('.fk-gallery-grid').id='cards';
const decorate=()=>{for(const card of container.querySelectorAll('.fk-gallery-card')){card.classList.add('card');card.querySelector('img')?.classList.add('card-cover');const link=card.querySelector('a');link.textContent='Load in editor ↗';link.setAttribute('aria-label','Load in editor');}};
new MutationObserver(decorate).observe(container.querySelector('#cards'),{childList:true});decorate();
