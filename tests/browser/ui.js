export async function openMore(page){if(!await page.locator('#fk-more-drawer').isVisible())await page.click('#more-toggle');}
export async function closeMore(page){if(await page.locator("#fk-more-drawer").isVisible())await page.click("#fk-more-drawer .fk-close");}
