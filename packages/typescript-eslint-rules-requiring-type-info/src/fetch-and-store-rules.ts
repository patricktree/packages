import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "node:fs";

import { constants } from "#pkg/constants.js";

export async function fetchAndStoreRules() {
  const response = await axios.get<string>("https://typescript-eslint.io/rules/#extension-rules");
  const html = response.data;

  const dom = new JSDOM(html);
  const rulesTable = dom.window.document.querySelector("h2#rules ~ table tbody");
  if (!rulesTable) {
    throw new Error(`could not fetch rules`);
  }

  const allRules = [...rulesTable.children];
  const rulesRequiringTypeInfo = [];
  for (const tr of allRules) {
    const ruleRequiresTypeInfo = tr.querySelector('td[title="requires type information"]');
    if (ruleRequiresTypeInfo) {
      const ruleAnchor = tr.querySelector("td:first-child a");
      if (!ruleAnchor) {
        throw new Error(`found a rule but could not extract rule anchor`);
      }
      const nameOfRule = ruleAnchor.textContent.trim();
      if (!nameOfRule) {
        throw new Error(`found a rule but could not extract name of the rule`);
      }
      rulesRequiringTypeInfo.push(nameOfRule);
    }
  }

  await fs.promises.writeFile(constants.RULES_PATH, JSON.stringify(rulesRequiringTypeInfo), {
    encoding: "utf8",
  });
}
