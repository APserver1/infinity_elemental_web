import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://localhost:5173');await page.waitForTimeout(2500);await fs.mkdir('.backend/screenshots',{recursive:true});await page.screenshot({path:'.backend/screenshots/home-desktop.png',fullPage:true});
await page.getByRole('button',{name:'Abrir menú'}).click();await page.getByRole('link',{name:'Galería',exact:true}).click();await page.getByRole('button',{name:/Un nuevo horizonte/}).click();await page.getByRole('button',{name:'Cerrar imagen'}).click();
await page.goto('http://localhost:5173/descargas');await page.waitForTimeout(2000);console.log('Downloads:',(await page.locator('main').innerText()).slice(0,1200));
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173');await page.waitForTimeout(500);await page.screenshot({path:'.backend/screenshots/home-mobile.png',fullPage:true});console.log('Mobile overflow:',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));console.log('Browser errors:',errors);await browser.close();
