const http = require("node:http");
const { timingSafeEqual, randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { atomicFile } = require("./storage.cjs");
class BrowserBridge {
  constructor(storage, domain, publish, port = 47831) {
    this.storage = storage;
    this.domain = domain;
    this.publish = publish;
    this.port = port;
    this.ready = false;
    this.error = "";
    this.server = null;
  }
  status() {
    return {
      ready: this.ready,
      port: this.ready ? this.port : null,
      error: this.error,
      account: this.storage.state.profile.account,
    };
  }
  async setEnabled(enabled) {
    if (enabled) await this.start();
    else this.stop();
  }
  async start() {
    if (this.server) return;
    if (!this.storage.state.profile.account)
      throw Error("Save your Neopets username in Settings first.");
    const file = path.join(this.storage.directory, "pairing-key");
    try {
      this.key = (await fs.readFile(file, "utf8")).trim();
      if (!/^[a-f0-9]{64}$/.test(this.key))
        throw Error("The saved pairing key is invalid.");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      this.key = randomBytes(32).toString("hex");
      await atomicFile(file, this.key);
    }
    this.server = http.createServer((req, res) => this.handle(req, res));
    this.server.requestTimeout = 10000;
    this.server.headersTimeout = 10000;
    this.server.maxHeadersCount = 25;
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(this.port, "127.0.0.1", resolve);
    }).catch((e) => {
      this.server.close();
      this.server = null;
      this.error =
        "Browser connection could not start. Another copy may be using its port.";
      this.publish("desk-browser-state", this.status());
      throw Error(this.error);
    });
    this.port = this.server.address().port;
    this.ready = true;
    this.error = "";
    this.publish("desk-browser-state", this.status());
  }
  async handle(req, res) {
    const server = this.server;
    const reply = (code, data) => {
      if (res.writableEnded) return;
      res.writeHead(code, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      if (req.headers.host !== "127.0.0.1:" + this.port)
        return reply(403, { error: "Invalid host" });
      const auth = Buffer.from(String(req.headers.authorization || ""));
      const expected = Buffer.from("Bearer " + this.key);
      if (auth.length !== expected.length || !timingSafeEqual(auth, expected))
        return reply(401, { error: "Pair this script again." });
      if (req.method === "GET" && req.url === "/v1/profile")
        return reply(200, { account: this.storage.state.profile.account });
      if (req.method === "GET" && req.url === "/v1/stamps")
        return reply(200, { albums: this.storage.state.native.browser.albums });
      const kind =
        /^\/v1\/(purchases|trading-sales|sales-history|stamps|events|training)$/.exec(
          req.url || "",
        )?.[1];
      if (req.method !== "POST" || !kind)
        return reply(404, { error: "Unknown route" });
      if (
        !String(req.headers["content-type"] || "").startsWith(
          "application/json",
        )
      )
        return reply(415, { error: "JSON required" });
      const parts = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 1000000)
          return reply(413, { error: "Observation too large" });
        parts.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(parts).toString("utf8"));
      const state = await this.storage.commit((old) => {
        if (!this.ready || this.server !== server)
          throw Error("Browser connection is off. Retry after turning it on.");
        return this.domain.observe(old, kind, data);
      });
      this.publish("desk-state", state);
      reply(200, { ok: true });
    } catch (e) {
      reply(400, { error: e.message });
    }
  }
  stop() {
    this.server?.close();
    this.server?.closeAllConnections();
    this.server = null;
    this.ready = false;
    this.error = "";
    this.publish("desk-browser-state", this.status());
  }
}
module.exports = { BrowserBridge };
