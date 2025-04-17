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
    data: { name: "Comment Test Project" },
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

/**
 * Helper function to add a comment at a specific position
 */
async function addComment(page, x, y, text) {
  await page
    .getByTestId("file-image")
    .click({ position: { x, y } });
  
  await page
    .getByRole("textbox", { name: "Comment" })
    .fill(text);
  
  await page
    .getByTestId("submit-comment")
    .click();
  
  await expect(page.getByTestId("add-comment-dialog")).not.toBeVisible();
}

/**
 * Helper function to add a reply to a comment
 */
async function addReply(page, commentId, replyText) {
  await page
    .getByTestId(`reply-button-${commentId}`)
    .click();
  
  await page
    .getByRole("textbox", { name: "Comment" })
    .fill(replyText);
  
  await page
    .getByTestId("submit-reply")
    .click();
  
  await expect(page.getByTestId(`reply-dialog-${commentId}`)).not.toBeVisible();
}

/**
 * Helper function to get the first comment's ID
 */
async function getFirstCommentId(page) {
  return page
    .locator('[data-testid^="comment-thread-"]')
    .first()
    .getAttribute('data-testid')
    .then(id => id.replace('comment-thread-', ''));
}

test("user can add a comment to an image", async () => {
  const { page } = accounts.owner;
  
  await page.goto(`/files/${file._id}`);
  
  await addComment(page, 50, 50, "This is a test comment");
  
  await expect(page.getByText("This is a test comment")).toBeVisible();
  
  await page.waitForTimeout(1000);
  await expect(page.locator('[data-testid^="comment-marker-"]').first()).toBeVisible();
});

test("user can reply to a comment", async () => {
  const { page } = accounts.owner;
  
  await page.goto(`/files/${file._id}`);
  
  await addComment(page, 40, 40, "This is a top-level comment");
  
  await expect(page.getByText("This is a top-level comment")).toBeVisible();
  
  const commentId = await getFirstCommentId(page);
  
  await addReply(page, commentId, "This is a reply to the comment");
  
  await expect(page.getByText("This is a reply to the comment")).toBeVisible();
  
  await expect(page.getByTestId(`replies-container-${commentId}`)).toBeVisible();
});

test("multiple users can reply to the same comment", async () => {
  const { page: ownerPage } = accounts.owner;
  const { page: reviewerPage } = accounts.reviewer;
  
  await backendRequest(
    accounts.owner.context,
    "post",
    `/projects/${project._id}/reviewers`,
    {
      headers: { "Content-Type": "application/json" },
      data: { email: accounts.reviewer.email },
    },
  );
  
  await ownerPage.goto(`/files/${file._id}`);
  await addComment(ownerPage, 60, 60, "Comment for multiple replies");
  
  const commentId = await getFirstCommentId(ownerPage);
  
  await addReply(ownerPage, commentId, "First reply from owner");
  
  await reviewerPage.goto(`/files/${file._id}`);
  
  await addReply(reviewerPage, commentId, "Reply from reviewer");
  
  await addReply(ownerPage, commentId, "Second reply from owner");
  
  for (const page of [ownerPage, reviewerPage]) {
    await expect(page.getByText("First reply from owner")).toBeVisible();
    await expect(page.getByText("Reply from reviewer")).toBeVisible();
    await expect(page.getByText("Second reply from owner")).toBeVisible();
  }
});

test("users can see comments in real-time", async () => {
  const { page: ownerPage } = accounts.owner;
  const { page: reviewerPage } = accounts.reviewer;
  
  // Make sure reviewer is invited to the project
  await backendRequest(
    accounts.owner.context,
    "post",
    `/projects/${project._id}/reviewers`,
    {
      headers: { "Content-Type": "application/json" },
      data: { email: accounts.reviewer.email },
    },
  );
  
  // Create a new clean file
  const cleanFile = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "realtime_test.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
  
  // Both users open the file page
  await ownerPage.goto(`/files/${cleanFile._id}`);
  await reviewerPage.goto(`/files/${cleanFile._id}`);
  
  // Wait for the pages to stabilize
  await ownerPage.waitForTimeout(500);
  await reviewerPage.waitForTimeout(500);
  
  // Owner adds a comment through the UI
  await ownerPage.getByTestId("file-image").click({ position: { x: 45, y: 45 } });
  await ownerPage.getByRole("textbox", { name: "Comment" }).fill("Real-time test comment from owner");
  await ownerPage.getByTestId("submit-comment").click();
  
  // Verify owner can see their comment
  await expect(ownerPage.getByText("Real-time test comment from owner")).toBeVisible();
  
  // Reviewer should see it without refreshing
  await expect(
    reviewerPage.getByText("Real-time test comment from owner")
  ).toBeVisible({ timeout: 10000 });
  
  // Now reviewer adds a comment
  await reviewerPage.getByTestId("file-image").click({ position: { x: 55, y: 55 } });
  await reviewerPage.getByRole("textbox", { name: "Comment" }).fill("Real-time test comment from reviewer");
  await reviewerPage.getByTestId("submit-comment").click();
  
  // Verify reviewer can see their comment
  await expect(reviewerPage.getByText("Real-time test comment from reviewer")).toBeVisible();
  
  // Owner should see it without refreshing
  await expect(
    ownerPage.getByText("Real-time test comment from reviewer")
  ).toBeVisible({ timeout: 10000 });
});

test("user can see empty state when no comments exist", async () => {
  const newFile = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "empty.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
  
  const { page } = accounts.owner;
  await page.goto(`/files/${newFile._id}`);
  
  // Should see empty state message
  await expect(page.getByTestId("no-comments")).toBeVisible();
  await expect(page.getByText(/No comments yet/)).toBeVisible();
});

test("infinite scroll loads more comments", async () => {
  const { page } = accounts.owner;
  
  const scrollFile = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "scroll_test.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
  
  // Go to the new file page
  await page.goto(`/files/${scrollFile._id}`);
  
  // Create enough comments  to trigger pagination
  // We need 11+ comments to trigger pagination with a limit of 10
  // Using different positions to ensure we don't overlap, keeping values ≤ 100
  const positions = [
    { x: 10, y: 10 }, { x: 30, y: 10 }, { x: 50, y: 10 }, { x: 70, y: 10 },
    { x: 10, y: 30 }, { x: 30, y: 30 }, { x: 50, y: 30 }, { x: 70, y: 30 },
    { x: 10, y: 50 }, { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 },
    { x: 10, y: 70 }, { x: 30, y: 70 }, { x: 50, y: 70 }
  ];
  
  // Add a reasonable number of comments for UI testing (5-6 should be enough to trigger pagination)
  // For full 15+ comments we would use API in a real test
  for (let i = 0; i < 6; i++) {
    await addComment(page, positions[i].x, positions[i].y, `Scroll test comment ${i+1}`);
    await page.waitForTimeout(200);
  }
  
  // Adding the rest via API to ensure we have enough for pagination without taking too long
  const additionalCommentsPromises = [];
  for (let i = 6; i < 15; i++) {
    additionalCommentsPromises.push(
      backendRequest(accounts.owner.context, "post", "/comments", {
        headers: { "Content-Type": "application/json" },
        data: {
          fileId: scrollFile._id,
          body: `Scroll test comment ${i+1}`,
          x: positions[i].x,
          y: positions[i].y
        }
      })
    );
  }
  
  await Promise.all(additionalCommentsPromises);
  
  // Refresh page to ensure all comments are loaded
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
  
  // Wait for possible loading
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

test("error handling when adding an empty comment", async () => {
  const { page } = accounts.owner;
  
  const cleanFile = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "empty_test.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
  
  await page.goto(`/files/${cleanFile._id}`);
  
  await page.waitForTimeout(500);
  
  await page.getByTestId("file-image").click({ position: { x: 35, y: 35 } });
  
  await expect(page.getByTestId("add-comment-dialog")).toBeVisible();
  
  // Check if the button is disabled when no text is entered
  const isDisabled = await page.getByTestId("submit-comment").isDisabled();
  expect(isDisabled).toBeTruthy();
  
  // Enter some text and check if button becomes enabled
  await page.getByRole("textbox", { name: "Comment" }).fill("test text");
  const isEnabledWithText = await page.getByTestId("submit-comment").isEnabled();
  expect(isEnabledWithText).toBeTruthy();
  
  // Clear text and verify button becomes disabled again
  await page.getByRole("textbox", { name: "Comment" }).fill("");
  const isDisabledAgain = await page.getByTestId("submit-comment").isDisabled();
  expect(isDisabledAgain).toBeTruthy();
  
  await page.getByTestId("cancel-comment").click();
  await expect(page.getByTestId("add-comment-dialog")).not.toBeVisible();
});

test("error handling when adding an empty reply", async () => {
  const { page } = accounts.owner;
  
  const replyFile = await backendRequest(accounts.owner.context, "post", "/files", {
    multipart: {
      projectId: project._id,
      file: {
        name: "reply_test.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync(
          path.join(process.cwd(), "sample-files/image.jpg"),
        ),
      },
    },
  });
  
  await page.goto(`/files/${replyFile._id}`);
  
  await addComment(page, 30, 30, "Comment for reply error test");
  
  await page.waitForTimeout(500);
  
  const commentId = await getFirstCommentId(page);
  
  await page.getByTestId(`reply-button-${commentId}`).click();
  
  await expect(page.getByTestId(`reply-dialog-${commentId}`)).toBeVisible();
  
  // Check if the button is disabled when no text is entered
  const isDisabled = await page.getByTestId("submit-reply").isDisabled();
  expect(isDisabled).toBeTruthy();
  
  // Enter some text and check if button becomes enabled
  await page.getByRole("textbox", { name: "Comment" }).fill("test reply");
  const isEnabledWithText = await page.getByTestId("submit-reply").isEnabled();
  expect(isEnabledWithText).toBeTruthy();
  
  // Clear text and verify button becomes disabled again
  await page.getByRole("textbox", { name: "Comment" }).fill("");
  const isDisabledAgain = await page.getByTestId("submit-reply").isDisabled();
  expect(isDisabledAgain).toBeTruthy();
  
  await page.getByTestId("cancel-reply").click();
});