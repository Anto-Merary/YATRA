const crypto = require("crypto");
const https = require("https");

// 1. CREDENTIALS
const workingKey = "C153074CE9627C9EB2387A0471AF2BCD".trim();
const accessCode = "ATEP06NA73CI16PEIC".trim();
const merchantId = "2442144".trim();

// ---------------------------------------------------------
// OFFICIAL SDK LOGIC (ccavutil.js)
// ---------------------------------------------------------
function encryptSDK(plainText) {
    var m = crypto.createHash('md5');
    m.update(workingKey);
    var key = m.digest(); // Raw Buffer
    var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
}
// ---------------------------------------------------------

function extractError(html) {
    if (!html) return "No Data";
    const match = html.match(/<div class="opps-des">([\s\S]*?)<\/div>/);
    if (match && match[1]) {
        return match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    // Check for hidden comments or specific error codes
    if (html.includes("error")) {
        const errMatch = html.match(/error\s*[:=]\s*([^<"']*)/i);
        if (errMatch) return "Hidden Error: " + errMatch[1];
    }
    return html.substring(0, 100).replace(/\s+/g, ' ');
}

// Updated runTest
function runTest(testName, options = {}) {
    const {
        command = 'initiateTransaction',
        nakedMode = false // STRIP ALL BILLING DATA
    } = options;

    return new Promise((resolve) => {
        const orderId = String(Math.floor(1000000 + Math.random() * 9000000));

        // Base Params
        let paramList = [];
        paramList.push(`merchant_id=${merchantId}`);
        paramList.push(`order_id=${orderId}`);

        // LEGACY COMPATIBILITY: Always send TID if using initiatePayment
        if (command === 'initiatePayment') {
            paramList.push(`tid=${orderId}`);
        }

        paramList.push(`currency=INR`);
        paramList.push(`amount=1.00`);
        paramList.push(`redirect_url=https://www.rityatra.in`);
        paramList.push(`cancel_url=https://www.rityatra.in`);
        paramList.push(`language=EN`);

        // NAKED MODE: DO NOT ADD BILLING DETAILS
        // If this works, the crash was caused by invalid address/phone formatting.
        if (!nakedMode) {
            paramList.push(`billing_name=TestUser`);
            paramList.push(`billing_country=India`);
            paramList.push(`billing_tel=9876543210`);
            paramList.push(`billing_email=test@test.com`);
        } else {
            // Intentionally empty to test server stability
        }

        const rawParams = paramList.join('&');

        // USE OFFICIAL SDK ENCRYPTION
        const encRequest = encryptSDK(rawParams);

        // Standard Param Name
        let postData = `encRequest=${encRequest}&access_code=${accessCode}`;

        const requestOptions = {
            hostname: 'test.ccavenue.com',
            path: `/transaction/transaction.do?command=${command}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Referer': 'https://www.rityatra.in',
                'Origin': 'https://www.rityatra.in',
                'User-Agent': 'Mozilla/5.0 (Node.js Diagnostic)'
            }
        };

        console.log(`\n--- STARTING ${testName} ---`);
        console.log(`Order ID: ${orderId}`);
        console.log(`Command: ${command}`);
        if (nakedMode) console.log("(Sending ZERO billing data)");

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const errorText = extractError(data);

                if (data.includes("Invalid Parameter")) {
                    console.log(`❌ FAILED: Invalid Parameter (31002)`);
                } else if (data.includes("paymentOptions") || data.includes("billing_name")) {
                    console.log(`✅ SUCCESS! Payment Page Detected.`);
                    console.log(`>>> SOLUTION FOUND: ${testName}`);
                } else {
                    console.log(`⚠️ OOPS PAGE DETECTED. Error Text:`);
                    console.log(`"${errorText}"`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Request Error: ${e.message}`);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// MAIN RUNNER
async function runDiagnostics() {
    console.log("==========================================");
    console.log("    CCAVENUE NAKED PROTOCOL MODE          ");
    console.log("==========================================");

    // TEST 35: Naked Standard
    await runTest("TEST 35: 'initiateTransaction' (Naked)", { command: 'initiateTransaction', nakedMode: true });

    // TEST 36: Naked Legacy
    await runTest("TEST 36: 'initiatePayment' (Naked)", { command: 'initiatePayment', nakedMode: true });

    // TEST 37: Naked Mobile
    await runTest("TEST 37: 'mobileInitiateTransaction' (Naked)", { command: 'mobileInitiateTransaction', nakedMode: true });

    console.log("\n==========================================");
    console.log("If any test works: The crash is caused by your billing data format.");
    console.log("If ALL fail: The account is misconfigured on the bank side (Inactive).");
    console.log("==========================================");
}

runDiagnostics();