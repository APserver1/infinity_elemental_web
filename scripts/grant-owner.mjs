import fs from 'node:fs/promises';
await fs.mkdir('.backend',{recursive:true});
await fs.writeFile('.backend/grant-owner.json',JSON.stringify({query:"INSERT INTO public.ie_admins(user_id) SELECT id FROM auth.users WHERE lower(email)='a.pvovapaypal@gmail.com' ON CONFLICT DO NOTHING; SELECT p.id,p.nickname FROM public.ie_profiles p JOIN public.ie_admins a ON a.user_id=p.id JOIN auth.users u ON u.id=p.id WHERE lower(u.email)='a.pvovapaypal@gmail.com';"}));
console.log('Owner grant prepared. Run the MCP run-raw-sql tool with .backend/grant-owner.json after confirming the owner registered.');
