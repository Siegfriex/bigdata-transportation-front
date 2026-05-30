import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createSavedReport, isDuplicateSavedReport } from "../src/features/save-report";
import { createAiChatResponse } from "../src/features/send-ai-chat/server/chatResponder";
import { getRoutePlans } from "../src/entities/route-plan";
import { getDefaultPreferences } from "../src/entities/user-preferences";

const repoRoot = process.cwd();

function readRelative(filePath: string) {
  return readFileSync(path.join(repoRoot, filePath), "utf8");
}

function listFiles(dirPath: string): string[] {
  const absoluteDirPath = path.join(repoRoot, dirPath);
  if (!existsSync(absoluteDirPath)) return [];

  return readdirSync(absoluteDirPath).flatMap((entry) => {
    const absoluteEntryPath = path.join(absoluteDirPath, entry);
    const relativeEntryPath = path.join(dirPath, entry);
    if (statSync(absoluteEntryPath).isDirectory()) {
      return listFiles(relativeEntryPath);
    }
    return relativeEntryPath;
  });
}

function assertAppHostBoundary() {
  const appSource = readRelative("src/App.tsx");
  const lineCount = appSource.trimEnd().split("\n").length;

  assert(lineCount <= 150, `src/App.tsx should stay under 150 lines, found ${lineCount}`);
  assert(appSource.includes("<AppRouter {...app.routerProps} />"), "App.tsx should host AppRouter");
  assert(!appSource.includes("activeTab ==="), "App.tsx should not branch on activeTab directly");
}

function assertPageCompositionBoundary() {
  const pageFiles = listFiles("src/pages");
  const forbiddenPathPattern = /\/(ui|model|api|mock|lib|config)\//;
  const forbiddenSourcePattern = /\b(fetch|localStorage|sessionStorage)\b|STORAGE_KEYS|validateAiChat|postJson/;

  assert(pageFiles.some((file) => file.endsWith("map-page/index.tsx")), "Map page entry is missing");
  assert(pageFiles.some((file) => file.endsWith("archive-page/index.tsx")), "Archive page entry is missing");
  assert(pageFiles.some((file) => file.endsWith("settings-page/index.tsx")), "Settings page entry is missing");

  for (const file of pageFiles) {
    assert(!forbiddenPathPattern.test(file), `page layer contains forbidden path: ${file}`);
    assert(!forbiddenSourcePattern.test(readRelative(file)), `page layer contains forbidden implementation detail: ${file}`);
  }
}

function assertRouteAndReportContracts() {
  const preferences = getDefaultPreferences();
  const plans = getRoutePlans("염창역", "여의도역", {
    useBike: preferences.useBike,
    maxTaxiFee: preferences.maxTaxiFee,
  });

  assert(plans.length >= 3, "염창역 -> 여의도역 should provide multiple route plans");
  assert.equal(plans[0].id, "route:염창역->여의도역:plan-a");

  const savedReport = createSavedReport({
    selectedPlan: plans[0],
    selectedReportType: "deadline",
    startStation: "염창역",
    endStation: "여의도역",
    now: new Date("2026-05-30T00:00:00.000Z"),
  });

  assert.equal(savedReport.date, "2026-05-30");
  assert.equal(savedReport.type, "deadline");
  assert.equal(savedReport.from, "염창역");
  assert.equal(savedReport.to, "여의도역");
  assert(isDuplicateSavedReport([savedReport], { from: "염창역", to: "여의도역", type: "deadline" }));
}

async function assertAiChatFallbackContract() {
  const response = await createAiChatResponse(
    {
      message: "9시까지 도착 가능해?",
      context: {
        startStation: "염창역",
        endStation: "여의도역",
        deadlineTime: "09:00",
        preferences: getDefaultPreferences(),
      },
    },
    { GEMINI_API_KEY: "" } as NodeJS.ProcessEnv
  );

  assert.equal(response.suggestedReportType, "deadline");
  assert.equal(response.startStation, "염창역");
  assert.equal(response.endStation, "여의도역");
  assert.equal(response.routeIndex, 0);
  assert(response.textAnswer.length > 0, "AI fallback should return textAnswer");

  await assert.rejects(
    () => createAiChatResponse({ context: {} }, { GEMINI_API_KEY: "" } as NodeJS.ProcessEnv),
    /message is required/
  );
}

async function main() {
  assertAppHostBoundary();
  assertPageCompositionBoundary();
  assertRouteAndReportContracts();
  await assertAiChatFallbackContract();
  console.log("Phase 7 smoke checks passed");
}

void main();
