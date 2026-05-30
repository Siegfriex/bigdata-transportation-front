import { expect, type Locator, type Page, test } from "@playwright/test";

async function openGuestMap(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("talsu.savedReports.v1", "[]");
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "비회원으로 바로 둘러보기" })).toBeVisible();
  await page.getByRole("button", { name: "비회원으로 바로 둘러보기" }).click();
  await expect(page.getByTestId("route-preset-carousel")).toBeVisible();
  await expect(page.getByRole("button", { name: "지도" })).toBeVisible();
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

test.describe("탈수있나 P0 decision flow", () => {
  test("첫 진입, 프리셋 드래그, 선택 후 지도 위 리포트 sheet가 같은 context로 열린다", async ({ page }, testInfo) => {
    await openGuestMap(page);

    const carousel = page.getByTestId("route-preset-carousel");
    await expect(page.getByTestId("route-preset-carriage")).toBeVisible();

    await dragHorizontally(page, carousel, 120);
    await expect(page.getByTestId("report-detail-overlay")).toHaveCount(0);

    await page.getByTestId("route-preset-carriage").click();
    await expect(page.getByTestId("report-detail-overlay")).toBeVisible();
    await expect(page.getByText("실시간 전략 리포트")).toBeVisible();
    await expect(page.getByText(/염창역\s*→\s*여의도역/)).toBeVisible();
    await expect(page.getByTestId("route-preset-carriage")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("active-route-path")).toBeVisible();

    const sheetBox = await page.getByTestId("report-detail-overlay").boundingBox();
    const navBox = await page.getByTestId("bottom-navigation").boundingBox();
    expect(sheetBox?.y ?? 0).toBeLessThan(navBox?.y ?? Number.POSITIVE_INFINITY);

    await expect(page).toHaveScreenshot(`${testInfo.project.name}-preset-report-sheet.png`, {
      fullPage: false,
      animations: "disabled",
    });
  });

  test("전략 후보 선택 시 제목, 수치, active 상태가 동기화되고 sheet 내부 스크롤이 유지된다", async ({ page }, testInfo) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-carriage").click();
    await expect(page.getByTestId("strategy-card-plan_a")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("strategy-card-plan_b").click();
    await expect(page.getByTestId("strategy-card-plan_b")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "비용최소: 따릉이 전술 우회" })).toBeVisible();
    await expect(page.getByText("지연 위험")).toBeVisible();
    await expect(page.getByText("혼잡 압력")).toBeVisible();
    await expect(page.getByText("근거 신뢰")).toBeVisible();

    const scroller = page.getByTestId("report-detail-overlay").locator(".overflow-y-auto").last();
    await scroller.evaluate((element) => element.scrollTo({ top: 480 }));
    await expect(page.getByText("이동 타임라인")).toBeVisible();

    await dragHorizontally(page, page.getByText("전략 후보").locator("xpath=ancestor::section").locator(".overflow-x-auto"), 90);
    await expect(page.getByTestId("report-detail-overlay")).toBeVisible();

    await expect(page).toHaveScreenshot(`${testInfo.project.name}-strategy-sync.png`, {
      fullPage: false,
      animations: "disabled",
    });
  });

  test("전략 저장은 기록 탭으로 이동하지 않고 현재 지도와 리포트 맥락을 유지하며 중복 저장을 막는다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-carriage").click();

    await page.getByRole("button", { name: /전략 저장/ }).click();
    await expect(page.getByText("통근 리포트가 보관함에 영구 저장되었습니다.")).toBeVisible();
    await expect(page.getByTestId("report-detail-overlay")).toBeVisible();
    await expect(page.getByRole("button", { name: "지도" })).toHaveClass(/text-\[#0A84FF\]/);

    await page.getByRole("button", { name: /전략 저장/ }).click();
    await expect(page.getByText("이미 보관함에 물리 장착된 리포트입니다.")).toBeVisible();

    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.getByText("보관된 최신 안전 리포트")).toBeVisible();
    await expect(page.getByText(/지하철 최적 생존 칸 추천: 염창역 ↔ 여의도역/)).toHaveCount(1);
  });

  test("AI 근거 질문은 리포트를 닫고 AI sheet를 열며 loading feedback을 보여준다", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "현재 선택 전략은 혼잡 압력과 도착 여유를 함께 기준으로 산출됐습니다.",
        }),
      });
    });
    await openGuestMap(page);
    await page.getByTestId("route-preset-carriage").click();

    await page.getByRole("button", { name: /AI 근거 질문/ }).click();
    await expect(page.getByTestId("report-detail-overlay")).toHaveCount(0);
    await expect(page.getByText("Gemini route engine")).toBeVisible();
    await expect(page.getByText("데이터 근거 확인 중")).toBeVisible();
    await expect(page.getByText("혼잡도, 환승 시간, 대체 경로를 함께 대조합니다.")).toBeVisible();
  });

  test("저장 리포트 복원은 지도 탭으로 돌아오고 저장 snapshot의 경로와 report type을 복원한다", async ({ page }) => {
    await openGuestMap(page);
    await page.getByTestId("route-preset-recovery").click();
    await page.getByTestId("strategy-card-plan_b").click();
    await page.getByRole("button", { name: /전략 저장/ }).click();

    await page.getByRole("button", { name: "리포트 닫기" }).last().click();
    await page.getByRole("button", { name: "기록" }).click();
    await expect(page.getByText(/심야 교통 단축 복구: 홍대입구역 ↔ 남양주시/)).toBeVisible();
    await page.getByText("지도 이동").first().click();

    await expect(page.getByRole("button", { name: "지도" })).toHaveClass(/text-\[#0A84FF\]/);
    await expect(page.getByTestId("route-preset-recovery")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("report-detail-overlay")).toBeVisible();
    await expect(page.getByTestId("strategy-card-plan_b")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "심야 생존: 24h 안심쉘터 + 첫차 연계 대치" })).toBeVisible();
  });
});
