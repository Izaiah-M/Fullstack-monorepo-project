import {
    createTestAccounts,
    removeTestAccounts,
    backendRequest,
  } from "../utils";
  import path from "path";
  import fs from "fs";
  import { test, expect } from "@playwright/test";
  
  let accounts;
  let projects = [];
  let files = [];
  let comments = [];
  
  test.beforeAll(async ({ browser }) => {
    accounts = await createTestAccounts(browser);
    
    projects[0] = await backendRequest(accounts.owner.context, "post", `/projects`, {
      headers: { "Content-Type": "application/json" },
      data: { name: "Project for search testing", description: "This is a searchable project" },
    });
    
    projects[1] = await backendRequest(accounts.owner.context, "post", `/projects`, {
      headers: { "Content-Type": "application/json" },
      data: { name: "Second project" },
    });
    
    files[0] = await backendRequest(accounts.owner.context, "post", "/files", {
      multipart: {
        projectId: projects[0]._id,
        file: {
          name: "search-test-image.jpg",
          mimeType: "image/jpeg",
          buffer: fs.readFileSync(
            path.join(process.cwd(), "sample-files/image.jpg"),
          ),
        },
      },
    });
    
    files[1] = await backendRequest(accounts.owner.context, "post", "/files", {
      multipart: {
        projectId: projects[1]._id,
        file: {
          name: "regular-image.jpg",
          mimeType: "image/jpeg",
          buffer: fs.readFileSync(
            path.join(process.cwd(), "sample-files/image.jpg"),
          ),
        },
      },
    });
    
    comments[0] = await backendRequest(accounts.owner.context, "post", "/comments", {
      headers: { "Content-Type": "application/json" },
      data: {
        fileId: files[0]._id,
        body: "This comment contains search keyword",
        x: 50,
        y: 50
      }
    });
    
    comments[1] = await backendRequest(accounts.owner.context, "post", "/comments", {
      headers: { "Content-Type": "application/json" },
      data: {
        fileId: files[1]._id,
        body: "Just a regular comment",
        x: 50,
        y: 50
      }
    });
  });
  
  test.afterAll(() => removeTestAccounts(accounts));
  
  test("global search functionality", async () => {
    const { page } = accounts.owner;
    
    await page.goto("/projects");
    
    await page
      .getByPlaceholder("Search projects, files & comments...")
      .fill("search");
    
    await page.waitForTimeout(1000);
    
    await page.getByRole("button").filter({ hasText: "Project for search testing" }).first().click();
    
    await expect(page.locator("h1")).toContainText("Project for search testing");
    
    await page.goto("/projects");
    
    await page
      .getByPlaceholder("Search projects, files & comments...")
      .fill("search");
    
    await page.waitForTimeout(1000);
    
    await page.getByRole("button").filter({ hasText: "search-test-image" }).first().click();
    
    await expect(page.getByRole("banner")).toContainText("search-test-image.jpg");
    
    await page.goto("/projects");
    
    await page
      .getByPlaceholder("Search projects, files & comments...")
      .fill("search");
    
    await page.waitForTimeout(1000);
    
    await page.getByRole("button").filter({ hasText: "This comment contains search keyword" }).first().click();
    
    await expect(page.getByRole("banner")).toContainText("search-test-image.jpg");
  });
 
  test("search with no results", async () => {
    const { page } = accounts.owner;
    
    await page.goto("/projects");
    
    const randomSearchTerm = `nonexistent${Math.random().toString(36).substring(2, 8)}`;
    
    await page
      .getByPlaceholder("Search projects, files & comments...")
      .fill(randomSearchTerm);
    
    await page.waitForTimeout(2000);
    
    await expect(page.getByTestId("search-results-dropdown")).toBeVisible({ timeout: 5000 });
    
    await expect(page.getByTestId("no-results-message")).toBeVisible({ timeout: 5000 });
    
    const messageText = await page.getByTestId("no-results-message").textContent();
    expect(messageText.includes(randomSearchTerm)).toBe(true);
  });
 
  test("search functionality is available", async () => {
    // We just verify the search box exists and is functional
    const { page } = accounts.owner;
    
    // Navigate to projects page
    await page.goto("/projects");
    
    // Verify search box is present
    await expect(page.getByPlaceholder("Search projects, files & comments...")).toBeVisible();
    
    // Verify we can type in it
    await page
      .getByPlaceholder("Search projects, files & comments...")
      .fill("test");
    
    // Verify the input accepted our text
    await expect(page.getByPlaceholder("Search projects, files & comments...")).toHaveValue("test");
  });