import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = "http://127.0.0.1:3000";
const outDir = "test-results/visual-polish-after";

async function enter(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("talsu.savedReports.v1", "[]");
  });
  await page.goto(baseURL);
  await page.getByRole("button", { name: "비회원으로 바로 둘러보기" }).click();
  await page.waitForSelector("[data-testid='route-preset-carousel']");
}

async function shot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}` });
}

async function routeAi(page, delay = 0) {
  await page.route("**/api/chat", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        textAnswer: "**선택 전략 근거**\n\n현재 선택된 경로의 도착 여유, 탑승 가능성, 생존칸, 복구전략을 같은 맥락에서 설명합니다.",
      }),
    });
  });
}

async function captureMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 } });
  await routeAi(page, 600);
  await enter(page);
  await shot(page, "visual-map-default-320.png");
  await page.getByTestId("route-preset-boarding").click();
  await page.waitForSelector("[data-testid='strategic-report-sheet']");
  await shot(page, "visual-strategic-report-320.png");
  await page.close();

  const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await routeAi(page390, 600);
  await enter(page390);
  await page390.getByTestId("route-preset-carousel").screenshot({ path: `${outDir}/visual-route-carousel-390.png` });
  await page390.getByTestId("route-preset-boarding").click();
  await page390.waitForSelector("[data-testid='strategic-report-sheet']");
  await shot(page390, "visual-strategic-report-390.png");
  await page390.getByTestId("evidence-toggle-button").click();
  await shot(page390, "visual-evidence-expanded-390.png");
  await page390.getByTestId("ai-evidence-question-button").click();
  await page390.waitForSelector("[data-testid='ai-message-skeleton']");
  await shot(page390, "visual-ai-evidence-loading-390.png");
  await page390.getByText("선택 전략 근거").waitFor();
  await shot(page390, "visual-ai-evidence-answer-390.png");
  await page390.getByTestId("ai-close-button").click();
  await enter(page390);
  await page390.getByTestId("route-preset-recovery").click();
  await page390.getByTestId("save-report-button").click();
  await page390.getByRole("button", { name: "리포트 닫기" }).last().click();
  await page390.getByRole("button", { name: "기록" }).click();
  await page390.locator("[data-testid^='archive-map-restore-button-']").first().click();
  await page390.waitForSelector("[data-testid='snapshot-badge']");
  await shot(page390, "visual-restored-snapshot-390.png");
  await page390.close();
}

async function captureDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await routeAi(page);
  await enter(page);
  await shot(page, "desktop-1280-map-default.png");
  await page.getByTestId("route-preset-carousel").screenshot({ path: `${outDir}/desktop-1280-route-carousel.png` });
  await page.getByTestId("route-preset-boarding").click();
  await page.waitForSelector("[data-testid='strategic-report-sheet']");
  await shot(page, "desktop-1280-strategic-report.png");
  await page.getByTestId("evidence-toggle-button").click();
  await shot(page, "desktop-1280-evidence-expanded.png");
  await page.getByTestId("ai-evidence-question-button").click();
  await page.getByText("선택 전략 근거").waitFor();
  await shot(page, "desktop-1280-ai-evidence-answer.png");
  await enter(page);
  await page.getByTestId("route-preset-recovery").click();
  await page.getByTestId("save-report-button").click();
  await page.getByRole("button", { name: "리포트 닫기" }).last().click();
  await page.getByRole("button", { name: "기록" }).click();
  await page.locator("[data-testid^='archive-report-card-']").first().waitFor();
  await shot(page, "desktop-1280-archive-list.png");
  await page.locator("[data-testid^='archive-map-restore-button-']").first().click();
  await page.waitForSelector("[data-testid='snapshot-badge']");
  await shot(page, "desktop-1280-restored-snapshot.png");
  await page.close();
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await captureMobile(browser);
  await captureDesktop(browser);
} finally {
  await browser.close();
}
