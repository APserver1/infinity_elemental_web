import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs/promises";
const client = new Client({ name: "infinity-setup", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["node_modules/@insforge/mcp/dist/index.js"],
  env: {
    ...process.env,
    API_KEY: process.env.INSFORGE_API_KEY,
    API_BASE_URL: "https://insforge.cineasta.org",
  },
});
await client.connect(transport);
const action = process.argv[2] || "list";
if (action === "list")
  console.log(JSON.stringify(await client.listTools(), null, 2));
else {
  const file = process.argv[3];
  const raw = file ? await fs.readFile(file, "utf8") : null;
  const args = raw
    ? file.endsWith(".sql")
      ? { query: raw.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, "") }
      : JSON.parse(raw)
    : {};
  const result = await client.callTool({ name: action, arguments: args });
  if (process.env.OUTPUT_FILE)
    await fs.writeFile(
      process.env.OUTPUT_FILE,
      JSON.stringify(result, null, 2),
    );
  else console.log(JSON.stringify(result, null, 2));
}
await client.close();
