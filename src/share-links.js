import{writeURL}from'./fragment-config.js';
export const buildShareLink=(url,snapshot)=>writeURL(url,snapshot);
export{ShareClient,ShareError}from'../vendor/fragment-kit-v0.4.3/src/index.js';

import { ShareClient as KitShareClient } from '../vendor/fragment-kit-v0.4.3/src/index.js';
const shortLinks = new Map();
export const knownShortLink = href => shortLinks.get(href) || null;
export class SheetShareClient extends KitShareClient {
  async shorten(links) {
    const result = await super.shorten(links);
    if (result?.shortened) {
      shortLinks.set(links.href || links.long, result.url);
      if (shortLinks.size > 20) shortLinks.delete(shortLinks.keys().next().value);
    }
    return result;
  }
}
