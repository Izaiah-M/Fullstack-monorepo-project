import path from "path";
import fs from "fs";
import {
  createTestAccounts,
  removeTestAccounts,
  backendRequest,
} from "../utils";
import { test, expect } from "@playwright/test";

let accounts;

let project;
let file;

test.beforeAll(async ({ browser }) => {
  accounts = await createTestAccounts(browser);
  project = await backendRequest(accounts.owner.context, "post", `/projects`, {
    headers: { "Content-Type": "application/json" },
    data: { name: "First Project" },
  });
  file = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "image.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
});

test.afterAll(() => removeTestAccounts(accounts));

test("open file as owner", async function () {
  await accounts.owner.page.goto(`/files/${file._id}`);
  await expect(accounts.owner.page.getByRole("banner")).toContainText(
    "image.jpg",
  );
  await expect(
    accounts.owner.page.getByRole("img", { name: "Click to leave a comment" }),
  ).toBeVisible();
});

test("leave comment as owner", async function () {
  const { page } = accounts.owner;
  
  await page.goto(`/files/${file._id}`);
  
  await page.waitForTimeout(500);
  
  await page
    .getByTestId("file-image")
    .click({ position: { x: 100, y: 100 } });
  
  await page
    .getByRole("textbox", { name: "Comment" })
    .fill("Comment from owner");
  
  await page.getByTestId("submit-comment").click();
  await expect(page.getByTestId("add-comment-dialog")).not.toBeVisible();
  
  await expect(page.getByText("Comment from owner")).toBeVisible();
});

test("open file as reviewer without invite", async function () {
  const { page } = accounts.reviewer;
  await page.goto(`/files/${file._id}`);
  
  // Look for the Alert component with error message
  await expect(page.locator('[data-testid="file-error"]')).toBeVisible();
  
  // Check for the error AlertTitle (contains "Failed to load file")
  await expect(page.locator('.MuiAlertTitle-root')).toBeVisible();
  
  // Check for error details
  await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
  
  // Check for action button
  await expect(page.locator('[data-testid="error-action-button"]')).toBeVisible();
});

test("open file as reviewer with invite", async function () {
  await backendRequest(
    accounts.owner.context,
    "post",
    `/projects/${project._id}/reviewers`,
    {
      headers: { "Content-Type": "application/json" },
      data: { email: accounts.reviewer.email },
    },
  );

  const { page } = accounts.reviewer;
  
  await page.goto(`/files/${file._id}`);
  await page.waitForTimeout(1000);  
  
  await expect(page.getByRole("banner")).toContainText("image.jpg");
  
  await expect(
    page.getByRole("img", {
      name: "Click to leave a comment",
    }),
  ).toBeVisible();
  
  await expect(page.getByText("Comment from owner")).toBeVisible();
});

test("leave comment as reviewer", async function () {
  const { page } = accounts.reviewer;
  
  await page.goto(`/files/${file._id}`);
  await page.waitForTimeout(500); 
  
  await page.getByTestId("file-image").click({ position: { x: 200, y: 200 } });
  
  await page.getByRole("textbox", { name: "Comment" }).fill("Comment from reviewer");
  
  await page.getByTestId("submit-comment").click();
  
  await expect(page.getByTestId("add-comment-dialog")).not.toBeVisible();
  
  await page.waitForTimeout(500);
  
  await expect(page.getByText("Comment from reviewer")).toBeVisible();
});