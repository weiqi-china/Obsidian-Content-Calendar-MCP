import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config.js";
import { parseFrontmatter } from "../../src/parser/frontmatter.js";
import { fixtureConfigPath } from "../helpers.js";

describe("parseFrontmatter", () => {
  it("maps configured frontmatter fields", async () => {
    const config = await loadConfig({ configPath: fixtureConfigPath });
    const parsed = parseFrontmatter(
      "---\ntitle: Hello\nstatus: 待发布\ntags: [a, b]\n---\n# Body title\n",
      "note.md",
      config,
    );
    expect(parsed.title).toBe("Hello");
    expect(parsed.mapped.status).toBe("待发布");
    expect(parsed.mapped.tags).toEqual(["a", "b"]);
  });
});
