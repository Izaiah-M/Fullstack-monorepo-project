# Filestage Assignment: Implementation Summary

Firstly, I want to extend a huge thank you for the opportunity to work on this assignment. 🙏 I had a great time working through it and diving deep into a product-style challenge like this was incredibly fun and rewarding. I can definitely see how exciting working at Filestage would be!

Below is a summary of the features I implemented, along with key enhancements and refactors I made throughout the project:

## ✅ 1. Comment Replies  
**What it enables**: Project owners and reviewers can have structured, conversational threads under each comment — making discussions more organized and easier to follow.

- **Nested replies** are rendered visually with indents for clarity.
- Users can seamlessly add a reply directly below any comment.
- Replies are grouped under their parent comments for easier reading.

## ✅ 2. Real-Time Comment Updates  
**What it enables**: Comments appear instantly across all connected clients — no refresh needed.

- Uses **Socket.IO** to broadcast new comments and replies live.
- Clicking a dot marker scrolls directly to the associated comment, enhancing navigation. (This was added just to enhance UX, though it was not a requirement)
- Optimized to avoid duplicate comments when receiving socket messages.

## ✅ 3. Lazy Loading (Infinite Scroll) for Comments  
**What it enables**: Smooth performance when viewing files with many comments.

- Users can scroll naturally through large comment threads without long initial load times.
- Top-level comments are paginated, and their replies are aggregated efficiently.
- Built to ensure no misalignment between parent and child comments across pages.

## ✅ 4. Global Search Across Projects, Files, and Comments  
**What it enables**: Users can quickly find any project, file, or comment from a single search bar.

- Real-time feel via **debounced inputs** and optimized queries.
- **Backend search module** scans multiple collections and returns relevant matches.
- **Redis caching** improves response speed and reduces DB load.
- Results are clickable and lead directly to their respective locations.

## ✅ 5. Server Side logging  
**What it enables**: Easier debugging and monitoring.

- **Request logging** implemented at the middleware level.
- All logs are written to both **console** and a **rotating file log**, with logs rotated once daily at midnight.
- Helpful for auditing and troubleshooting in production environments.

## Additional UX Enhancements  
- Clicking on a marker **highlights the relevant comment thread** (as mentioned earlier).  
- **ErrorBoundary** added to gracefully handle unexpected UI crashes.


## Testing  
All major features are fully tested:

- Includes tests for **replying to comments, real-time updates, infinite scroll, and global search**.
- Ensures **core user workflows are reliable**.

### Running Tests  
To run tests locally, change to the test folder and run the following commands:

```bash
npm install
npm test
```

## CI/CD  
A GitHub Actions workflow is included under `.github/workflows/` to:

- Automatically install dependencies.
- Run tests on every push or PR.
- Provide feedback on test status before deployment.


## Architecture & Maintainability Improvements

### Backend Structure
- Modularized into domains: `auth`, `comments`, `projects`, `files`, etc.
- Each module contains its own `controller`, `service`, `routes`, and `schema`.
- Centralized:
  - **Socket config**, **DB config**, **Redis config** in `/config`
  - **Error middleware** and a **global DB error handler**
  - **Helper utilities** in `/utils`
  - **App bootstrap** in `index.js`

### Frontend Structure
- Under source you'll find: **hooks**, **context**, **pages**, **components** — and under **components** each **page** has a dedicated **components folder**, making code in pages cleaner and more maintainable.
- All API interactions are centralized in `/api`.

---

## Future Considerations

### User Experience
- Improve UI feedback for error states (e.g. failed socket connections, search failures).
- Add skeleton loaders and retry logic for all async operations.

### Backend & DevOps
- Extend **Redis caching** to frequently accessed project/file endpoints.
- Implement **rate limiting**.
- Add **API versioning** for long-term scalability.

---

## Running the App

The app runs exactly as described in the original instructions:

```bash
docker compose up --build --watch
```

This will start the frontend, backend, and database containers using Docker.
