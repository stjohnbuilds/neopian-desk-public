const fs = require("node:fs/promises");
const path = require("node:path");
const { atomicFile } = require("./storage.cjs");
class Reminders {
  constructor(directory, Notification, publish, open) {
    this.directory = directory;
    this.Notification = Notification;
    this.publish = publish;
    this.open = open;
    this.enabled = false;
    this.rows = [];
    this.fired = {};
  }
  async start() {
    try {
      const old = JSON.parse(
        await fs.readFile(
          path.join(this.directory, "notifications.json"),
          "utf8",
        ),
      );
      this.enabled = old.enabled === true;
      this.fired = old.fired || {};
    } catch (e) {
      if (e.code !== "ENOENT")
        this.error = "Notification settings could not be read.";
    }
    this.timer = setInterval(
      () =>
        void this.tick().catch((e) => {
          this.error = e.message;
          this.status();
        }),
      15000,
    );
    this.status();
  }
  status() {
    const state = {
      enabled: this.enabled,
      permission: this.Notification.isSupported() ? "allowed" : "denied",
      scheduledCount: this.rows.length,
      error: this.error,
    };
    this.publish("desk-notification-state", state);
    return state;
  }
  async save() {
    await atomicFile(
      path.join(this.directory, "notifications.json"),
      JSON.stringify({ enabled: this.enabled, fired: this.fired }),
    );
  }
  async action(body) {
    if (body.action === "enable") {
      this.enabled = body.enabled === true;
      await this.save();
    } else if (body.action === "sync") {
      if (!Array.isArray(body.reminders) || body.reminders.length > 2000)
        throw Error("Invalid reminders.");
      this.rows = body.reminders;
      await this.tick();
    } else if (body.action === "test")
      this.show({
        title: "Neopian Desk test",
        body: "Notifications are ready.",
        url: "neopian-desk://calendar",
      });
    else if (body.action !== "status") throw Error("Unknown reminder action.");
    return this.status();
  }
  show(row) {
    const notification = new this.Notification({
      title: row.title,
      body: row.body || "Your timer is ready.",
    });
    notification.on("click", () => this.open(row.url));
    notification.on("failed", (_e, error) => {
      this.error = error;
      this.status();
    });
    notification.show();
    this.publish("desk-reminder-fired", { title: row.title });
  }
  async tick(now = new Date()) {
    if (!this.enabled) return;
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    for (const row of this.rows) {
      if (
        typeof row.id !== "string" ||
        typeof row.title !== "string" ||
        row.title.length > 300
      )
        continue;
      let due = false;
      let token = `${row.id}:${date}`;
      if (row.kind === "once") {
        due =
          Number.isFinite(row.dueAt) &&
          now.getTime() >= row.dueAt &&
          now.getTime() - row.dueAt < (row.windowMinutes || 10) * 60000;
        token = `${row.id}:${row.dueAt}`;
      } else if (["daily", "annual"].includes(row.kind)) {
        const minute = +parts.hour * 60 + +parts.minute;
        const target = row.hour * 60 + row.minute;
        due =
          minute >= target &&
          minute < target + (row.windowMinutes || 1) &&
          (row.kind === "daily" ||
            (+parts.month === row.month && +parts.day === row.day));
      }
      if (
        row.skipHibernation === true &&
        (+parts.month === 12 || (+parts.month === 1 && +parts.day <= 3))
      )
        due = false;
      if (due && !this.fired[token]) {
        this.fired[token] = Date.now();
        await this.save();
        this.show(row);
      }
    }
    for (const [key, at] of Object.entries(this.fired))
      if (Date.now() - at > 370 * 86400000) delete this.fired[key];
  }
  stop() {
    clearInterval(this.timer);
  }
}
module.exports = { Reminders };
