export async function openMore(page){if(!await page.locator('#fk-more-drawer').isVisible())await page.click('#more-toggle');}
