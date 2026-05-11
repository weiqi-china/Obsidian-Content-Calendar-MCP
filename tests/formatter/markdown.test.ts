import { describe, expect, it } from "vitest";
import { formatItemsMarkdown } from "../../src/formatter/markdown.js";
import type { ContentItem } from "../../src/types.js";

describe("formatItemsMarkdown", () => {
  it("groups items by platform", () => {
    const item: ContentItem = {
      filename: "note.md",
      path: "/tmp/note.md",
      relative_path: "note.md",
      platform: "小红书",
      account: "账号",
      product: "产品",
      direction: "方向",
      title: "标题",
      publish_date: "2026-05-12",
      status: "pending",
      tags: [],
      frontmatter: {},
      warnings: [],
      mtime: new Date().toISOString(),
    };
    const markdown = formatItemsMarkdown("Title", [item]);
    expect(markdown).toContain("## 小红书");
    expect(markdown).toContain("标题");
  });
});
