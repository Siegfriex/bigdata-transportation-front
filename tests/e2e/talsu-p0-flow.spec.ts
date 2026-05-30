import { expect, type Locator, type Page, test } from "@playwright/test";

async function openGuestMap(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("talsu.savedReports.v1", "[]");
  });
  await page.goto("/");
  await page.getByRole("button", { name: "비회원으로 바로 둘러보기" }).click();
  await expect(page.getByTestId("route-preset-carousel")).toBeVisible();
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

test.describe("탈수있나 v2 strategic report flow", () => {
  test("경로 카드 선택 후 full integrated strategic report가 기본 노출된다", async ({ page }) => {
    await openGuestMap(page);

    await page.getByTestId("route-preset-boarding").click();
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await expect(page.getByTestId("strategic-report-summary-grid")).toBeVisible();
    await expect(page.getByTestId("metric-deadline-success")).toBeVisible();
    await expect(page.getByTestId("metric-boarding-risk")).toBeVisible();
    await expect(page.getByTestId("metric-car-survival")).toBeVisible();
    await expect(page.getByTestId("metric-recovery-plan")).toBeVisible();
    await expect(page.getByText("AI 전략 브리핑 종료")).toHaveCount(0);
  });

  test("근거보기 CTA는 상세 evidence section을 열고 닫는다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-boarding").click();

    const evidenceToggle = page.getByTestId("evidence-toggle-button");
    await expect(evidenceToggle).toHaveAttribute("aria-expanded", "false");
    await evidenceToggle.click();
    await expect(evidenceToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("evidence-detail-section")).toBeVisible();
    await expect(page.getByTestId("evidence-detail-section").locator("div")).toHaveCount(4);
    await evidenceToggle.click();
    await expect(page.getByTestId("evidence-detail-section")).toHaveCount(0);
  });

  test("전략 후보 carousel은 drag와 click을 모두 지원한다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-carriage").click();

    const carousel = page.getByTestId("strategy-candidate-carousel");
    await dragHorizontally(page, carousel, 100);
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();

    await page.getByTestId("strategy-candidate-card-plan_b").click();
    await expect(page.getByTestId("strategy-candidate-card-plan_b")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "비용최소: 따릉이 전술 우회" })).toBeVisible();
  });

  test("AI 근거 질문은 현재 전략 context의 chat overlay를 열고 브리핑 종료 modal로 튀지 않는다", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "선택 전략은 도착 여유, 탑승 가능성, 혼잡 압력, 복구 대안을 함께 기준으로 산출됐습니다.",
        }),
      });
    });

    await openGuestMap(page);
    await page.getByTestId("route-preset-boarding").click();
    await page.getByTestId("ai-evidence-question-button").click();

    await expect(page.getByTestId("report-detail-overlay")).toHaveCount(0);
    await expect(page.getByTestId("ai-context-summary")).toBeVisible();
    await expect(page.getByText("현재 전략 기준")).toBeVisible();
    await expect(page.getByText("AI 전략 브리핑 종료")).toHaveCount(0);
    await expect(page.getByTestId("ai-message-skeleton")).toBeVisible();
    await expect(page.getByTestId("tactical-route-carousel")).toBeVisible();
  });

  test("전략 저장은 pure persistence action이고 기록에서 snapshot을 복원한다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-recovery").click();
    await page.getByTestId("strategy-candidate-card-plan_b").click();

    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("save-report-toast")).toContainText("전략리포트를 저장했습니다.");
    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();

    await page.getByTestId("save-report-button").click();
    await expect(page.getByTestId("save-report-toast")).toContainText("이미 저장된 전략리포트입니다.");

    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    const reportCard = page.locator("[data-testid^='archive-report-card-']").first();
    await expect(reportCard).toBeVisible();
    await reportCard.click();

    await expect(page.getByTestId("strategic-report-sheet")).toBeVisible();
    await expect(page.getByTestId("snapshot-badge")).toContainText("저장 시점 기준");
    await expect(page.getByTestId("strategy-candidate-card-plan_b")).toHaveAttribute("aria-pressed", "true");
  });

  test("복원된 리포트에서 AI 질문은 saved snapshot context를 유지한다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-recovery").click();
    await page.getByTestId("strategy-candidate-card-plan_b").click();
    await page.getByTestId("save-report-button").click();
    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await page.locator("[data-testid^='archive-map-restore-button-']").first().click();

    await expect(page.getByTestId("snapshot-badge")).toContainText("저장 시점 기준");
    await page.getByTestId("ai-evidence-question-button").click();
    await expect(page.getByTestId("ai-context-summary")).toContainText("저장 리포트 기준");
    await expect(page.getByTestId("ai-context-summary")).toContainText("저장 시점 기준");
    await expect(page.getByText("AI 전략 브리핑 종료")).toHaveCount(0);
  });
});
