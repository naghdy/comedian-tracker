import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clarityTagUrl, loadClarity } from "./clarity";

function fakeDoc() {
  const added: { async: boolean; src: string }[] = [];
  const doc = {
    createElement: () => ({ async: false, src: "" }),
    querySelector: (sel: string) => added.find((s) => sel.includes(`"${s.src}"`)) ?? null,
    head: { appendChild: (el: { async: boolean; src: string }) => added.push(el) },
  };
  return { doc: doc as unknown as Document, added };
}

describe("clarity", () => {
  it("builds the tag URL from a plain project ID", () => {
    assert.equal(clarityTagUrl("abc123xyz9"), "https://www.clarity.ms/tag/abc123xyz9");
    assert.equal(clarityTagUrl("  abc123xyz9 "), "https://www.clarity.ms/tag/abc123xyz9");
  });

  it("ignores empty or odd IDs", () => {
    for (const id of [undefined, "", "   ", "abc/../x", "a b", "<script>", "x".repeat(40)]) {
      assert.equal(clarityTagUrl(id), null);
    }
  });

  it("adds nothing without an ID", () => {
    const { doc, added } = fakeDoc();
    const win: { clarity?: unknown } = {};
    assert.equal(loadClarity("", doc, win), false);
    assert.equal(added.length, 0);
    assert.equal(win.clarity, undefined);
  });

  it("adds one async tag and queues calls until it loads", () => {
    const { doc, added } = fakeDoc();
    const win: { clarity?: ((...a: unknown[]) => void) & { q?: unknown[][] } } = {};
    assert.equal(loadClarity("abc123xyz9", doc, win), true);
    assert.equal(loadClarity("abc123xyz9", doc, win), true);
    assert.equal(added.length, 1);
    assert.deepEqual(added[0], { async: true, src: "https://www.clarity.ms/tag/abc123xyz9" });
    win.clarity!("set", "page", "home");
    assert.deepEqual(win.clarity!.q, [["set", "page", "home"]]);
  });
});
