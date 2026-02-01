/**
 * Vercel serverless handler for official-kit-style flow:
 * - Accepts POST with JSON body { fields: { name, value }[] } (ordered)
 * - Builds form body string, encrypts (same as ccavutil.js), returns HTML that auto-submits to CCAvenue
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createCipheriv } from "node:crypto";

const formEncode = (v: string): string =>
    encodeURIComponent(String(v)).replace(/%20/g, "+");

function encrypt(plainText: string, workingKey: string): string {
    const m = createHash("md5");
    m.update(workingKey, "utf8");
    const key = m.digest();
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    const cipher = createCipheriv("aes-128-cbc", key, iv);
    let encoded = cipher.update(plainText, "utf8", "hex");
    encoded += cipher.final("hex");
    return encoded;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).setHeader("Content-Type", "text/plain").send("Method not allowed");

    const workingKey = process.env.CCAVENUE_WORKING_KEY?.trim();
    const accessCode = process.env.CCAVENUE_ACCESS_CODE?.trim();
    if (!workingKey || !accessCode) {
        return res.status(500).setHeader("Content-Type", "text/plain").send("Server configuration error");
    }

    let body: { fields?: { name: string; value: string }[] } | undefined = req.body as typeof req.body;
    if (typeof req.body === "string") {
        try {
            body = JSON.parse(req.body) as typeof body;
        } catch {
            return res.status(400).setHeader("Content-Type", "text/plain").send("Invalid JSON body");
        }
    }
    const fields = body?.fields;
    if (!Array.isArray(fields) || fields.length < 5) {
        return res.status(400).setHeader("Content-Type", "text/plain").send("Missing or invalid fields");
    }

    try {
        const merchantData = fields
            .map((f) => `${String(f.name)}=${formEncode(String(f.value))}`)
            .join("&");

        const encRequest = encrypt(merchantData, workingKey);
        const action =
            "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><form id="f" method="post" action="${action}"><input type="hidden" name="encRequest" value="${encRequest}"><input type="hidden" name="access_code" value="${accessCode}"></form><script>document.getElementById('f').submit();</script></body></html>`;

        return res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
    } catch (err) {
        console.error("ccavenue-init-form error:", err);
        return res.status(500).setHeader("Content-Type", "text/plain").send("Encryption failed");
    }
}
