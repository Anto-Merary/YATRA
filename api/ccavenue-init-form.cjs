/**
 * Express handler matching the official CCAvenue kit:
 * - Receives raw form POST (application/x-www-form-urlencoded)
 * - Encrypts body with ccavutil.encrypt(body, workingKey)
 * - Returns HTML that auto-submits to CCAvenue
 *
 * React POSTs a form here with all CCAvenue params; response is redirect HTML.
 */
const express = require("express");
const ccav = require("./lib/ccavutil.js");

const app = express();

// Raw body so we encrypt the exact string the browser sent (like the official kit)
app.use(express.raw({ type: "application/x-www-form-urlencoded" }));

app.post("*", (req, res) => {
    const workingKey = process.env.CCAVENUE_WORKING_KEY?.trim();
    const accessCode = process.env.CCAVENUE_ACCESS_CODE?.trim();
    if (!workingKey || !accessCode) {
        res.status(500).set("Content-Type", "text/plain").send("Server configuration error");
        return;
    }
    const body = req.body && Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
    if (!body || body.length < 10) {
        res.status(400).set("Content-Type", "text/plain").send("Missing form body");
        return;
    }
    const encRequest = ccav.encrypt(body, workingKey);
    const action =
        "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><form id="f" method="post" action="${action}"><input type="hidden" name="encRequest" value="${encRequest}"><input type="hidden" name="access_code" value="${accessCode}"></form><script>document.getElementById('f').submit();</script></body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
});

module.exports = app;
