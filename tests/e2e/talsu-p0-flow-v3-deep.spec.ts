import { expect, type Locator, type Page, test } from "@playwright/test";

const bannedCopy = /반갑습니다|챗봇입니다|귀하의 상황을 관측 중입니다|문의하고 싶으신|브리핑 종료|AI 전략 브리핑 종료|^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
const rawInternalValues = /plan_[a-z]\b|dyn_[a-z]\b|\bboarding\b|\bcarriage\b|\bdeadline\b|\brecovery\b|savedReportId|rep-\d+/;

async function openGuestMap(page: Page, options: { corruptStorage?: boolean } = {}) {
  await page.addInitScript(({ corruptStorage }) => {
    window.localStorage.clear();
    if (corruptStorage) {
      window.localStorage.setItem("talsu.savedReports.v1", "{broken-json");
      window.localStorage.setItem("talsu.preferences.v1", "null");
      window.localStorage.setItem("talsu.onboarding.v1", "invalid");
    } else {
      window.localStorage.setItem("talsu.savedReports.v1", "[]");
    }
  }, options);
  await page.goto("/");
  await page.getByRole("button", { name: "비회원으로 바로 둘러보기" }).click();
  await expect(page.getByTestId("route-preset-carousel")).toBeVisible();
}

async function openReport(page: Page, preset: "boarding" | "carriage" | "recovery" = "boarding") {
  await openGuestMap(page);
  await page.getByTestId(`route-preset-${preset}`).click();
  await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
}

async function dragHorizontally(page: Page, target: Locator, distance: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error("Target is not visible for drag");
  const startX = box.x + box.width * 0.72;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - distance, y, { steps: 8 });
  await page.mouse.up();
}

async function clickAiEvidence(page: Page) {
  await page.getByTestId("ai-evidence-question-button").click();
  await expect(page.getByTestId("ai-chat-overlay")).toBeVisible();
}

function aiStatus(page: Page) {
  return page.getByTestId("ai-chat-overlay").getByRole("status");
}

test.describe("탈수있나 v3 deep QA", () => {
  test("P0-V3-01 AI delayed response shows skeleton and status text", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ textAnswer: "현재 전략 근거를 기준으로 도착 여유와 탑승 가능성을 설명합니다." }),
      });
    });

    await openReport(page);
    await clickAiEvidence(page);
    await expect(page.getByTestId("ai-message-skeleton")).toBeVisible();
    await expect(page.getByText("데이터 근거 확인 중")).toBeVisible();
    await expect(page.getByTestId("ai-context-summary")).toContainText("현재 전략 기준");
    await expect(page.getByTestId("ai-message-skeleton")).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByText("현재 전략 근거를 기준으로")).toBeVisible();
  });

  test("P0-V3-02 AI timeout shows fallback warning without losing report context", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/api/chat", async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({ status: 504, contentType: "application/json", body: JSON.stringify({ error: "upstream timeout" }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ textAnswer: "재시도 후 현재 전략 기준 설명을 복구했습니다." }),
      });
    });

    await openReport(page);
    await clickAiEvidence(page);
    await expect(aiStatus(page)).toContainText("로컬 안전 플랜");
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
    await expect(page.getByTestId("ai-context-summary")).toContainText("사당역 → 강남역");
    await page.getByRole("button", { name: "다시 시도" }).click();
    await expect(page.getByText("재시도 후 현재 전략 기준 설명")).toBeVisible();
  });

  test("P0-V3-03 AI invalid schema falls back safely", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ foo: "bar", textAnswer: null, suggestedReportType: "unknown_type" }),
      });
    });

    await openReport(page);
    await clickAiEvidence(page);
    await expect(aiStatus(page)).toContainText("로컬 안전 플랜");
    await expect(page.locator("body")).not.toContainText('"foo"');
    await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  });

  test("P0-V3-04 repeated AI evidence clicks do not duplicate overlay or messages", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/chat", async (route) => {
      requests += 1;
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ textAnswer: "중복 없이 한 번만 응답합니다." }) });
    });

    await openReport(page);
    await page.getByTestId("ai-evidence-question-button").click({ clickCount: 5 });
    await expect(page.getByTestId("ai-chat-overlay")).toHaveCount(1);
    await expect(page.getByTestId("ai-message-skeleton")).toHaveCount(1);
    await expect(page.getByText("중복 없이 한 번만 응답합니다.")).toHaveCount(1, { timeout: 5_000 });
    expect(requests).toBe(1);
  });

  test("P0-V3-05 AI context does not expose raw ids or enum values", async ({ page }) => {
    await openReport(page);
    await clickAiEvidence(page);
    const context = await page.getByTestId("ai-context-summary").innerText();
    expect(context).not.toMatch(rawInternalValues);
    await expect(page.getByTestId("ai-context-summary")).toContainText("탑승가능성 리포트");
  });

  test("P0-V3-06 strategy carousel handles first and last boundary swipe", async ({ page }) => {
    await openReport(page, "carriage");
    const carousel = page.getByTestId("strategy-candidate-carousel");
    await carousel.evaluate((el) => { el.scrollLeft = 0; });
    await dragHorizontally(page, carousel, -160);
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await carousel.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
    await dragHorizontally(page, carousel, 220);
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
  });

  test("P0-V3-07 drag threshold distinguishes tap from drag", async ({ page }) => {
    await openReport(page, "carriage");
    const planB = page.getByTestId("strategy-candidate-card-plan_b");
    await planB.click();
    await expect(planB).toHaveAttribute("aria-pressed", "true");

    const planA = page.getByTestId("strategy-candidate-card-plan_a");
    const box = await planA.boundingBox();
    if (!box) throw new Error("plan A not visible");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(planB).toHaveAttribute("aria-pressed", "true");
  });

  test("P0-V3-08 strategy selection syncs summary evidence map and AI context", async ({ page }) => {
    await openReport(page, "carriage");
    const beforePath = await page.getByTestId("active-route-path").getAttribute("d");
    await page.getByTestId("strategy-candidate-card-plan_b").click();
    await expect(page.getByRole("heading", { name: "비용최소: 따릉이 전술 우회" })).toBeVisible();
    await expect(page.getByTestId("metric-deadline-success")).toContainText("08:59");
    await expect(page.getByTestId("active-route-path")).not.toHaveAttribute("d", beforePath ?? "");
    await page.getByTestId("evidence-toggle-button").click();
    await expect(page.getByTestId("evidence-detail-section")).toContainText("한강 자전거");
    await clickAiEvidence(page);
    await expect(page.getByTestId("ai-context-summary")).toContainText("따릉이 전술 우회");
  });

  test("P0-V3-09 save in-flight survives tab change", async ({ page }) => {
    await openReport(page, "recovery");
    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await expect(page.getByTestId("save-report-toast")).toContainText("전략리포트를 저장했습니다.");
    await expect(page.getByRole("button", { name: "지도" })).toHaveClass(/text-\[#0A84FF\]/);
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.locator("[data-testid^='archive-report-card-']").first()).toBeVisible();
  });

  test("P0-V3-10 save failure supports retry without context loss", async ({ page }) => {
    await openReport(page, "boarding");
    await page.evaluate(() => {
      const original = window.localStorage.setItem.bind(window.localStorage);
      let failOnce = true;
      window.localStorage.setItem = (key, value) => {
        if (key === "talsu.savedReports.v1" && failOnce) {
          failOnce = false;
          throw new Error("quota");
        }
        original(key, value);
      };
    });
    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("save-report-toast")).toContainText(/저장했습니다|이미 저장된/);
  });

  test("P0-V3-11 duplicate save remains idempotent", async ({ page }) => {
    await openReport(page, "boarding");
    await page.getByTestId("save-report-button").click();
    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("save-report-toast")).toContainText("이미 저장된 전략리포트입니다.");
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.locator("[data-testid^='archive-report-card-']")).toHaveCount(1);
  });

  test("P0-V3-12 restored snapshot switches to live preview when new route is selected", async ({ page }) => {
    await openReport(page, "recovery");
    await page.getByTestId("save-report-button").click();
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await page.locator("[data-testid^='archive-map-restore-button-']").first().click();
    await expect(page.getByTestId("snapshot-badge")).toContainText("저장 시점 기준");
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByTestId("route-preset-boarding").click();
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await expect(page.getByTestId("snapshot-badge")).toHaveCount(0);
    await expect(page.getByText("사당역 → 강남역")).toBeVisible();
  });

  test("P0-V3-13 restored snapshot strategy change is explicitly handled", async ({ page }) => {
    await openReport(page, "recovery");
    await page.getByTestId("save-report-button").click();
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await page.locator("[data-testid^='archive-map-restore-button-']").first().click();
    await page.getByTestId("strategy-candidate-card-plan_b").click();
    await expect(page.getByTestId("strategy-candidate-card-plan_b")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("snapshot-badge")).toHaveCount(0);
  });

  test("P0-V3-14 deleted saved report cannot be restored", async ({ page }) => {
    await openReport(page, "boarding");
    await page.getByTestId("save-report-button").click();
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.locator("[data-testid^='archive-report-card-']")).toHaveCount(1);
    await page.getByRole("button", { name: "모두 지우기" }).click();
    await expect(page.locator("[data-testid^='archive-report-card-']")).toHaveCount(0);
    await page.goBack();
    await expect(page.locator("[data-testid^='archive-report-card-']")).toHaveCount(0);
  });

  test("P0-V3-15 corrupted localStorage does not crash app", async ({ page }) => {
    await openGuestMap(page, { corruptStorage: true });
    await expect(page.getByTestId("route-preset-carousel")).toBeVisible();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.getByText("보관된 최신 안전 리포트")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/undefined|null/);
    await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  });

  test("P0-V3-16 mobile AI input remains visible with keyboard and safe area", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openReport(page, "boarding");
    await clickAiEvidence(page);
    const input = page.getByPlaceholder("지각 예방에 관해 무엇이든 물어보세요...");
    await input.focus();
    await expect(input).toBeVisible();
    await expect(page.getByRole("button", { name: "메시지 전송" })).toBeVisible();
  });

  test("P0-V3-17 keyboard navigation and focus restore work", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-boarding").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await page.getByTestId("evidence-toggle-button").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("evidence-detail-section")).toBeVisible();
    await page.getByTestId("ai-evidence-question-button").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ai-chat-overlay")).toBeVisible();
  });

  test("P0-V3-18 long interaction soak has no console or page errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await openGuestMap(page);

    for (let i = 0; i < 3; i += 1) {
      await page.getByTestId(i % 2 === 0 ? "route-preset-boarding" : "route-preset-carriage").click();
      await page.getByTestId("strategy-candidate-card-plan_b").click();
      await page.getByTestId("evidence-toggle-button").click();
      await page.getByTestId("evidence-toggle-button").click();
      await page.getByTestId("save-report-button").click();
      await expect(page.getByTestId("strategic-report-sheet")).toHaveCount(1);
      await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await expect(page.getByTestId("strategic-report-sheet")).toHaveCount(0);
  });

  test("AI copy avoids banned phrases in fallback states", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "failed" }) });
    });
    await openReport(page, "boarding");
    await clickAiEvidence(page);
    await expect(aiStatus(page)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(bannedCopy);
  });

  test("API heuristic response avoids banned copy and raw labels", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        message: "9시까지 도착 가능해?",
        context: {
          startStation: "사당역",
          endStation: "강남역",
          deadlineTime: "09:00",
          preferences: {
            home: "염창역",
            work: "여의도역",
            crowdSensitivity: "normal",
            maxTaxiFee: 15000,
            walkLimitMin: 15,
            useBike: true,
            aiStyle: "brief",
            favoriteRoutes: [],
          },
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.textAnswer).not.toMatch(bannedCopy);
    expect(body.textAnswer).not.toMatch(/Plan [A-Z]|plan_[a-z]\b|savedReportId/);
  });

  test("screen reader semantics expose report, carousel, loading and toast meaning", async ({ page }) => {
    await openReport(page, "boarding");
    await expect(page.getByRole("dialog", { name: "전략리포트" })).toBeVisible();
    await expect(page.getByTestId("strategy-candidate-carousel")).toHaveAttribute("aria-label", "전략 후보");
    await expect(page.getByTestId("evidence-toggle-button")).toHaveAttribute("aria-expanded", "false");
    await page.getByTestId("save-report-button").click();
    await expect(page.getByRole("status")).toContainText("전략리포트를 저장했습니다.");
  });
});
