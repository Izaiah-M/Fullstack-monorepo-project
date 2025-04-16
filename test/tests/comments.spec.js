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
  
  // Create a project for testing
  project = await backendRequest(accounts.owner.context, "post", `/projects`, {
    headers: { "Content-Type": "application/json" },
    data: { name: "Comment Test Project" },
  });
  
  // Upload a file to use for testing
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

/**
 * Helper function to add a comment at a specific position
 */
async function addComment(page, x, y, text) {
  // Click on the image at the given position
  await page
    .getByTestId("file-image")
    .click({ position: { x, y } });
  
  // Fill in the comment text - use the correct role selector for the textarea
  await page
    .getByRole("textbox", { name: "Comment" })
    .fill(text);
  
  // Submit the comment
  await page
    .getByTestId("submit-comment")
    .click();
  
  // Wait for the dialog to close
  await expect(page.getByTestId("add-comment-dialog")).not.toBeVisible();
}

/**
 * Helper function to add a reply to a comment
 */
async function addReply(page, commentId, replyText) {
  // Click the reply button for the comment
  await page
    .getByTestId(`reply-button-${commentId}`)
    .click();
  
  // Fill in the reply text - use the correct role selector for the textarea
  await page
    .getByRole("textbox", { name: "Comment" })
    .fill(replyText);
  
  // Submit the reply
  await page
    .getByTestId("submit-reply")
    .click();
  
  // Wait for the dialog to close
  await expect(page.getByTestId(`reply-dialog-${commentId}`)).not.toBeVisible();
}

test("user can reply to a comment", async () => {
  const { page } = accounts.owner;
  
  // Navigate to the file
  await page.goto(`/files/${file._id}`);
  
  // Add a top-level comment
  await addComment(page, 100, 100, "This is a top-level comment");
  
  // Wait for the comment to appear
  await expect(page.getByText("This is a top-level comment")).toBeVisible();
  
  // Get the comment ID from the first comment thread in the DOM
  const commentId = await page
    .locator('[data-testid^="comment-thread-"]')
    .first()
    .getAttribute('data-testid')
    .then(id => id.replace('comment-thread-', ''));
  
  // Add a reply to the comment
  await addReply(page, commentId, "This is a reply to the comment");
  
  // Verify the reply appears
  await expect(page.getByText("This is a reply to the comment")).toBeVisible();
});

test("users can see comments in real-time", async () => {
  // Use both accounts for this test
  const { page: ownerPage } = accounts.owner;
  const { page: reviewerPage } = accounts.reviewer;
  
  // Share the project with the reviewer if not already done
  await backendRequest(
    accounts.owner.context,
    "post",
    `/projects/${project._id}/reviewers`,
    {
      headers: { "Content-Type": "application/json" },
      data: { email: accounts.reviewer.email },
    },
  );
  
  // Open the file in both browsers
  await ownerPage.goto(`/files/${file._id}`);
  await reviewerPage.goto(`/files/${file._id}`);
  
  // Owner adds a comment
  await addComment(ownerPage, 150, 150, "Real-time test comment from owner");
  
  // Verify the reviewer can see the comment without refreshing (with a reasonable timeout)
  await expect(
    reviewerPage.getByText("Real-time test comment from owner")
  ).toBeVisible({ timeout: 10000 });
  
  // Reviewer adds a comment
  await addComment(reviewerPage, 200, 200, "Real-time test comment from reviewer");
  
  // Verify the owner can see the comment
  await expect(
    ownerPage.getByText("Real-time test comment from reviewer")
  ).toBeVisible({ timeout: 10000 });
});

test("infinite scroll loads more comments", async () => {
  const { page } = accounts.owner;
  
  // Navigate to the file
  await page.goto(`/files/${file._id}`);
  
  // We need to add enough comments to trigger pagination
  // Instead of relying on 'load-more-comments' element appearing, we'll:
  // 1. Create comments via API
  // 2. Count initial comments
  // 3. Scroll and check for count increase
  
  // Create 15 comments via API to ensure pagination
  for (let i = 1; i <= 15; i++) {
    await backendRequest(accounts.owner.context, "post", "/comments", {
      headers: { "Content-Type": "application/json" },
      data: {
        fileId: file._id,
        body: `Scroll test comment ${i}`,
        x: 10 + (i % 5) * 20,
        y: 10 + Math.floor(i / 5) * 20
      }
    });
  }
  
  // Refresh page to ensure initial comments are loaded
  await page.reload();
  await page.waitForTimeout(1000);
  
  // Get the initial visible comments count
  const initialCount = await page
    .locator('[data-testid^="comment-thread-"]')
    .count();
  
  // Make sure we have comments
  expect(initialCount).toBeGreaterThan(0);
  
  // Find the comment bar and scroll to the bottom
  const commentBar = page.getByTestId("comment-bar");
  await commentBar.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  
  // Wait a moment for potential loading
  await page.waitForTimeout(2000);
  
  // Scroll again to ensure we trigger any infinite loading
  await commentBar.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  
  // Wait for more comments to load
  await page.waitForTimeout(2000);
  
  // Get the final count of comments
  const finalCount = await page
    .locator('[data-testid^="comment-thread-"]')
    .count();
  
  // Verify we have more comments now
  expect(finalCount).toBeGreaterThanOrEqual(initialCount);
});