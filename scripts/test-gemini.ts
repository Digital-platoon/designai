import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const PROD_VARS_PATH = join(PROJECT_ROOT, '.prod.vars');

function getEnvVars() {
    if (!existsSync(PROD_VARS_PATH)) {
        throw new Error('.prod.vars not found');
    }
    const content = readFileSync(PROD_VARS_PATH, 'utf-8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            let value = valueParts.join('=').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            env[key.trim()] = value;
        }
    });
    return env;
}

async function testGemini() {
    const env = getEnvVars();
    const key = env.GOOGLE_AI_STUDIO_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    console.log(`📡 Testing Gemini API...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say hello' }] }]
            })
        });

        const data = await response.json() as any;
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (data.candidates) {
            console.log('✅ Gemini API is working!');
        } else {
            console.log('❌ Gemini API error.');
        }
    } catch (e: any) {
        console.error(`Error testing Gemini: ${e.message}`);
    }
}

testGemini();
