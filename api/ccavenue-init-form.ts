/**
 * Vercel serverless handler for official-kit-style flow:
 * - Accepts POST with JSON body { fields: { name, value }[] } (ordered)
 * - Builds form body string, encrypts with ccavutil.encrypt, returns HTML that auto-submits to CCAvenue
 *
 * Uses same encryption as official kit; avoids .cjs so Vercel deploys this as a function.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const formEncode = (v: string): string =>
    encodeURIComponent(String(v)).replace(/%20/g, "+");

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).setHeader("Content-Type", "text/plain").send("Method not allowed");

    const workingKey = process.env.CCAVENUE_WORKING_KEY?.trim();
    const accessCode = process.env.CCAVENUE_ACCESS_CODE?.trim();
    if (!workingKey || !accessCode) {
        return res.status(500).setHeader("Content-Type", "text/plain").send("Server configuration error");
    }

    const body = req.body as { fields?: { name: string; value: string }[] } | undefined;
    const fields = body?.fields;
    if (!Array.isArray(fields) || fields.length < 5) {
        return res.status(400).setHeader("Content-Type", "text/plain").send("Missing or invalid fields");
    }

    const merchantData = fields
        .map((f) => `${String(f.name)}=${formEncode(String(f.value))}`)
        .join("&");

    const ccav = require("./lib/ccavutil.js");
    const encRequest = ccav.encrypt(merchantData, workingKey);
    const action =
        "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><form id="f" method="post" action="${action}"><input type="hidden" name="encRequest" value="${encRequest}"><input type="hidden" name="access_code" value="${accessCode}"></form><script>document.getElementById('f').submit();</script></body></html>`;

    return res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}
