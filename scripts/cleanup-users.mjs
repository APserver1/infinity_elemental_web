const headers={Authorization:`Bearer ${process.env.INSFORGE_API_KEY}`,'Content-Type':'application/json'};
const r=await fetch('https://insforge.cineasta.org/api/auth/users?limit=100&search=ie-test-',{headers});const data=await r.json();if(!r.ok)throw Error(`List failed: ${r.status}`);
const ids=data.data.filter(u=>/^ie-test-.*@example\.com$/.test(u.email)).map(u=>u.id);
if(ids.length){const deleted=await fetch('https://insforge.cineasta.org/api/auth/users',{method:'DELETE',headers,body:JSON.stringify({userIds:ids})});console.log('Test account cleanup:',deleted.status,await deleted.text());}else console.log('No test accounts remain.');
