import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import React, { act } from "react";

test("Quest Log opens with Trudy's Surprise, shows the ticks, and opens only ticked quest pages", async () => {
  const { window, document } = parseHTML(
    '<html><body><div id="root"></div></body></html>',
  );
  const saved = new Map<string, string>();
  Object.assign(globalThis, {
    window,
    document,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    Node: window.Node,
    MutationObserver: window.MutationObserver,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0),
    cancelAnimationFrame: clearTimeout,
    localStorage: {
      getItem: (key: string) => saved.get(key) || null,
      setItem: (key: string, value: string) => saved.set(key, value),
    },
  });
  const { createRoot } = await import("react-dom/client");
  const { createInitialState, restoreBackup, getState } =
    await import("../src/persistence/store");
  const { defaultNavigation } = await import("../src/core/navigation");
  const { activeDailies } = await import("../src/core/daily-favorites");
  const { Dailies } = await import("../src/features/Dailies");
  await restoreBackup({
    ...createInitialState(),
    legacy: {},
    navigation: { ...defaultNavigation, page: "dailies" as const },
  });
  const requests: { action: string; urls?: string[] }[] = [];
  let failOpen = true;
  (window as any).deskDesktop = {
    request: async (action: string, payload: { urls?: string[] }) => {
      requests.push({ action, ...payload });
      if (action === "openDailyPages" && failOpen)
        throw Error("The browser could not open these pages.");
    },
    channel: async () => {},
    onEvent: () => () => {},
  };
  const root = createRoot(document.getElementById("root")!);
  const click = async (label: string) => {
    const button = document.querySelector(
      `[aria-label="${label}"]`,
    ) as HTMLButtonElement;
    assert.ok(button, label);
    await act(async () => button.click());
  };
  const tick = async (label: string) => {
    const box = document.querySelector(
      `[aria-label="Tick ${label}"]`,
    ) as HTMLInputElement;
    assert.ok(box, label);
    // The test document does not flip a box on click the way a browser does.
    await act(async () => {
      box.checked = !box.checked;
      box.click();
    });
  };
  const opened = () =>
    requests.filter((r) => r.action === "openDailyPages").at(-1)!.urls;
  const visits = () =>
    JSON.parse(getState().legacy.nd_daily_visits_v1 ?? '{"opened":[]}')
      .opened as string[];
  const shown = () =>
    document.querySelector(".quest-shortcuts details")?.hasAttribute("open");
  try {
    await act(async () => root.render(React.createElement(Dailies)));
    const quest = activeDailies.find((d) => d.name === "Quest Log")!;
    const [questLog, trudy] = quest.links.map((l) => l.url);
    const page = (label: string) =>
      quest.shortcuts!.find((s) => s.label.startsWith(label))!.url;
    assert.equal(document.querySelectorAll(".quest-shortcuts a").length, 19);
    assert.equal(
      document.querySelectorAll(".quest-shortcuts input[type=checkbox]").length,
      19,
    );
    assert.ok(
      [...document.querySelectorAll(".daily-card strong")].some(
        (title) => title.textContent === "Trudy's Surprise",
      ),
      "Trudy's Surprise keeps its own card",
    );
    assert.match(document.body.textContent!, /Open ticked \(0\)/);
    assert.ok(!/Open all \(14\)/.test(document.body.textContent!));
    assert.equal(shown(), false);
    assert.equal(requests.length, 0, "rendering opens no pages");

    await click("Open the Quest Log and Trudy's Surprise");
    assert.deepEqual(opened(), [questLog, trudy]);
    assert.deepEqual(visits(), [], "failed opening marks nothing");
    assert.match(
      document.body.textContent!,
      /The browser could not open these pages/,
    );
    assert.equal(shown(), true, "the ticks show beside the Quest Log");

    failOpen = false;
    await click("Open the Quest Log and Trudy's Surprise");
    assert.deepEqual(visits(), [questLog, trudy]);
    assert.match(document.body.textContent!, /Opened 2 pages in your browser/);

    await tick("Spin the Wheel of Misfortune");
    await tick("Check out Popular NC Items · Visit NC Mall");
    await tick("Fight in the Battledome");
    await tick("Fight in the Battledome");
    assert.match(document.body.textContent!, /Open ticked \(2\)/);
    await click("Open the ticked quest pages");
    assert.deepEqual(opened(), [
      page("Check out Popular NC Items"),
      page("Spin the Wheel of Misfortune"),
    ]);
    assert.deepEqual(visits(), [
      questLog,
      trudy,
      page("Check out Popular NC Items"),
      page("Spin the Wheel of Misfortune"),
    ]);
    assert.match(document.body.textContent!, /Opened 2 pages in your browser/);
  } finally {
    await act(async () => root.unmount());
    delete (window as any).deskDesktop;
  }
});
