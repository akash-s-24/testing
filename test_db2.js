import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

fetch(`${url}/rest/v1/profiles?select=*`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(async r => {
    console.log("Profiles Status:", r.status);
    console.log("Profiles:", await r.text());
}).catch(console.error);

fetch(`${url}/rest/v1/auth.users?select=id`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(async r => {
    // it will fail for anon key, but we can try
}).catch(console.error);
