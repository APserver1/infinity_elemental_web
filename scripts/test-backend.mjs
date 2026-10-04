import fs from 'node:fs';
import {createClient} from '@insforge/sdk';
const env=fs.readFileSync('.env.local','utf8');const anonKey=env.match(/VITE_INSFORGE_ANON_KEY=(.*)/)[1].trim();
const client=createClient({baseUrl:'https://insforge.cineasta.org',anonKey});
console.log('Public auth config:',JSON.stringify(await client.auth.getPublicAuthConfig()));
console.log('Published releases:',JSON.stringify(await client.database.from('ie_releases').select('*')));
const email=`ie-test-${Date.now()}@example.com`;const password='TestInfinity_92!';
const signup=await client.auth.signUp({email,password,name:'TestExplorer'});console.log('Registration:',JSON.stringify({error:signup.error,userId:signup.data?.user?.id,verification:signup.data?.requireEmailVerification,session:!!signup.data?.accessToken}));
fs.writeFileSync('.backend/test-user.json',JSON.stringify({email,password,id:signup.data?.user?.id,accessToken:signup.data?.accessToken}));
if(signup.data?.accessToken){const id=signup.data.user.id;
console.log('Profile create:',JSON.stringify(await client.database.from('ie_profiles').upsert({id,nickname:'test_'+Date.now(),display_name:'TestExplorer',bio:'Test'})));
console.log('Profile read:',JSON.stringify(await client.database.from('ie_profiles').select('*')));
console.log('Unauthorized publish:',JSON.stringify(await client.database.from('ie_releases').insert({title:'Denied',version:'test',summary:'test',author_id:id})));
console.log('Unauthorized upload:',JSON.stringify(await client.storage.from('ie-builds').upload(`${id}/denied.txt`,new Blob(['test'],{type:'text/plain'}))));
console.log('Bug attachment:',JSON.stringify(await client.storage.from('ie-bug-attachments').upload(`${id}/test.png`,new Blob([fs.readFileSync('public/images/meadow.png')],{type:'image/png'}))));
console.log('Bug report:',JSON.stringify(await client.database.from('ie_bug_reports').insert({user_id:id,title:'Test report',description:'Integration test of bug reports.',steps:'Open game and reproduce test.',platform:'Windows'})));
}
