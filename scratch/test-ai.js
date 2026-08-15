require('dotenv').config();
const aiService = require('../api/ai.service');

async function test() {
    console.log('Testing AI connection with key:', process.env.AI_API_KEY ? 'Present' : 'MISSING');
    try {
        const response = await aiService.chat('Hello, who created you?', []);
        console.log('AI Response:', response.content);
    } catch (err) {
        console.error('AI Error:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data));
        }
    }
}

test();
