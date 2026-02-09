const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendVars = {
    'FIREBASE_DATABASE_URL': 'https://air-tech-aviation---ota-default-rtdb.asia-southeast1.firebasedatabase.app/',
    'AMADEUS_CLIENT_ID': 'dDmtYASUiCScHkPrAQmygP8z5xAfWs3x',
    'AMADEUS_CLIENT_SECRET': 'crVvfhdjSdkN44xl'
};

function cleanAndAdd() {
    console.log('🧹 Cleaning and restoring Backend environment variables...\n');

    for (const [key, value] of Object.entries(backendVars)) {
        try {
            console.log(`📝 Processing ${key}...`);

            // Remove existing
            for (const env of ['production', 'preview', 'development']) {
                try {
                    execSync(`npx vercel env rm ${key} ${env} -y`, { stdio: 'ignore' });
                } catch (e) { }
            }

            // Write value to a temp file to ensure NO extra characters
            const tempFile = path.join(__dirname, `temp_${key}.txt`);
            fs.writeFileSync(tempFile, value.trim());

            // Add from file
            const cmd = `npx vercel env add ${key} production < ${tempFile}`;
            console.log(`Running: ${cmd}`);

            // Use cmd /c for redirection in windows or powershell equivalent
            // Actually, simpler to pipe in node:
            execSync(`npx vercel env add ${key} production`, { input: value.trim() });
            execSync(`npx vercel env add ${key} preview`, { input: value.trim() });
            execSync(`npx vercel env add ${key} development`, { input: value.trim() });

            fs.unlinkSync(tempFile);
            console.log(`✅ ${key} added successfully\n`);
        } catch (e) {
            console.error(`❌ Failed to add ${key}:`, e.message);
        }
    }
}

cleanAndAdd();
