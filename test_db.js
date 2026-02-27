import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

fetch(`${url}/rest/v1/posts?select=id&limit=1`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Response:", await r.text());
}).catch(console.error);
