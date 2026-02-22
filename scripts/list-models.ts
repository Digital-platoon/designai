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

async function listModels() {
    const env = getEnvVars();
    const key = env.GOOGLE_AI_STUDIO_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log(`📡 Listing available Gemini models...`);

    try {
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.models) {
            console.log('✅ Found', data.models.length, 'models');
            console.log('All models:', data.models.map((m: any) => m.name));
        } else {
            console.log('❌ Error listing models:', JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error(`Error listing models: ${e.message}`);
    }
}

listModels();
