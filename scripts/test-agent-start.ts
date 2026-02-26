
import axios from 'axios';

const BASE_URL = 'https://designai.dev';
const EMAIL = 'wordtoimageai@gmail.com';
const PASSWORD = 'TestPass1234!@#$';

async function testAgentStart() {
    try {
        console.log('--- Phase 1: Authentication ---');

        // 1. Get CSRF Token
        console.log('Fetching CSRF token...');
        const csrfRes = await axios.get(`${BASE_URL}/api/auth/csrf-token`, {
            withCredentials: true
        });
        const csrfToken = csrfRes.data.data.token;
        const cookies = csrfRes.headers['set-cookie'];

        console.log('CSRF Token obtained.');

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        }, {
            headers: {
                'X-CSRF-Token': csrfToken,
                'Cookie': cookies?.join('; ')
            },
            withCredentials: true
        });

        const authCookies = loginRes.headers['set-cookie'];
        console.log('Login successful.');

        // --- Phase 2: Start Agent ---
        console.log('\n--- Phase 2: Starting Agent ---');

        // 3. Get fresh CSRF for the POST (optional but good practice)
        const csrfRes2 = await axios.get(`${BASE_URL}/api/auth/csrf-token`, {
            headers: {
                'Cookie': authCookies?.join('; ')
            },
            withCredentials: true
        });
        const freshCsrf = csrfRes2.data.data.token;
        const finalCookies = [
            ...(authCookies || []),
            ...(csrfRes2.headers['set-cookie'] || [])
        ];

        console.log('Calling /api/agent...');
        const agentRes = await axios.post(`${BASE_URL}/api/agent`, {
            query: 'Create a simple landing page for a coffee shop',
            language: 'typescript',
            frameworks: ['react', 'vite'],
            selectedTemplate: 'auto'
        }, {
            headers: {
                'X-CSRF-Token': freshCsrf,
                'Cookie': finalCookies.join('; ')
            }
        });

        console.log('Response Status:', agentRes.status);
        console.log('Response Body:', agentRes.data);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error Status:', error.response?.status);
            console.error('Error Body:', error.response?.data);
        } else {
            console.error('Error:', error);
        }
    }
}

testAgentStart();
