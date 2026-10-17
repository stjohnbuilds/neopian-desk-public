import { validPriorityItems } from "../core/trade-estimates";
import { validEstimates } from "../core/trade-estimates";
import { validAvatarFavorites } from "../core/avatar-daily-favorites";
import { validDailyFavorites } from "../core/daily-favorites";
import { validScoreTries } from "../core/high-score-tries";
import { validShortcuts } from "../core/shortcuts";
import { accounting } from "../core/accounting";
import { validProfitView } from "../core/profit-view";
import { validTradingSales } from "../core/trading-sales";

// Legacy keys remain lossless in backups, but active screens only accept their
// documented shape. Unknown groups remain portable without being interpreted.
type Row = Record<string, unknown>;
const object = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string";
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(text);
const rows = (v: unknown, check: (r: Row) => boolean) =>
  Array.isArray(v) && v.every((r) => object(r) && check(r));
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const date = (v: unknown) => text(v) && accounting.validDate(v);
const checklists = new Set([
  "nd_avatar_catalogue",
  "nd_game_scores",
  "nd_avatar_dates",
  "nd_time_locked",
  "nd_wheels",
  "nd_luck",
  "nd_luck_games",
  "nd_species",
]);
export function validateLegacy(key: string, value: unknown) {
  let valid = true;
  if (checklists.has(key)) valid = strings(value);
  else
    switch (key) {
      case "nd_daily_favorites_v1":
        valid = validDailyFavorites(value);
        break;
      case "nd_avatar_daily_favorites":
        valid = validAvatarFavorites(value);
        break;
      case "nd_trading_sales_v1":
        valid = validTradingSales(value);
        break;
      case "nd_profit_view":
        valid = validProfitView(value);
        break;
      case "nd_priority_items":
        valid = validPriorityItems(value);
        break;
      case "nd_trade_estimates":
        valid = validEstimates(value);
        break;
      case "nd_account_notes":
        valid = text(value) && value.length <= 20000;
        break;
      case "nd_high_score_tries":
        valid = validScoreTries(value);
        break;
      case "nd_avatar_import":
        valid =
          object(value) &&
          value.version === 1 &&
          rows(
            value.entries,
            (r) =>
              text(r.code) &&
              /^[a-zA-Z0-9_-]+$/.test(r.code) &&
              text(r.name) &&
              r.name.length <= 200 &&
              ["standard", "secret"].includes(String(r.kind)),
          );
        break;
      case "nd_avatar_attempts":
        valid = object(value) && Object.values(value).every(date);
        break;
      case "nd_header_shortcuts":
        valid = validShortcuts(value);
        break;
      case "nd_shop_profit_v1":
        valid = accounting.validLedger(value);
        break;
      case "nd_daily_visits_v1":
        valid = object(value) && date(value.day) && strings(value.opened);
        break;
      case "nd_concerts":
        valid =
          object(value) && strings(value.tickets) && strings(value.avatars);
        break;
      case "nd_avatar_tasks":
        valid =
          object(value) &&
          Object.values(value).every(
            (v) => object(v) && typeof v.done === "boolean" && text(v.tried),
          );
        break;
      case "nd_goals":
        valid =
          object(value) &&
          Object.values(value).every(
            (v) => typeof v === "boolean" || text(v) || finite(v),
          );
        break;
      case "nd_pet_birthdays":
        valid = object(value) && Object.values(value).every(date);
        break;
      case "nd_items_v2":
        valid = rows(
          value,
          (r) =>
            text(r.n) &&
            ["F", "U"].includes(String(r.l)) &&
            finite(r.q) &&
            Number.isSafeInteger(r.q) &&
            r.q > 0,
        );
        break;
      case "nd_dreams":
        valid = rows(
          value,
          (r) =>
            text(r.n) &&
            strings(r.items) &&
            (r.link == null || text(r.link)) &&
            (r.u == null || text(r.u)),
        );
        break;
      case "nd_scripts":
        valid = rows(value, (r) =>
          ["id", "name", "code", "notes", "url", "status"].every((k) =>
            text(r[k]),
          ),
        );
        break;
      case "nd_calendar":
        valid =
          object(value) &&
          rows(
            value.events,
            (r) =>
              text(r.id) &&
              text(r.title) &&
              text(r.body) &&
              date(r.date) &&
              typeof r.annual === "boolean",
          );
        break;
      case "nd_reminders":
        valid =
          object(value) &&
          object(value.preferences) &&
          text(value.magmaTime) &&
          text(value.magmaKind) &&
          rows(
            value.timers,
            (r) =>
              text(r.id) && text(r.title) && text(r.url) && finite(r.dueAt),
          ) &&
          rows(
            value.petpets,
            (r) =>
              text(r.id) &&
              text(r.pet) &&
              text(r.avatar) &&
              date(r.attachedOn) &&
              typeof r.done === "boolean" &&
              typeof r.estimated === "boolean",
          );
        break;
    }
  if (!valid) throw Error(`Invalid saved data in ${key}. Nothing imported.`);
}
