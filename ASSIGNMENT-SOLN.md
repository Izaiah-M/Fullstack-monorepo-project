# Filestage Assignment: Implementation Summary

Firstly, I want to extend a huge thank you for the opportunity to work on this assignment. 🙏 I had a great time working through it and diving deep into a product-style challenge like this was incredibly fun and rewarding. I can definitely see how exciting working at Filestage would be!

Below is a summary of the features I implemented, along with key enhancements and refactors I made throughout the project:

---

## ✅ Feature 1: Comment Replies
**Objective**: Allow project owners to reply to comments and have threaded conversations.

### Frontend
- **`File.jsx`**: Integrated comment threads, reply inputs, and nested UI structure.
- **`comments.js`**: Updated the hook to support `parentID`, enabling the backend to differentiate between normal comments and replies.

### Backend
- **`comment.service.js`**: Extended the `createComment` service to accept and handle `parentID`.
- **`comment.schema.js`**: Updated the schema to store and resolve replies.

---

## ✅ Feature 2: Real-Time Comment Updates
**Objective**: Enable live updates of comments on a file view.

### Frontend
- Created a custom hook `useLiveComments` to manage live comment streaming.
- Integrated socket headers into `backend.js` to fix the duplicate comment issue.
- Bonus: Clicking a dot (marker) on the image scrolls directly to the related comment.

### Backend
- **`comment.service.js`**: Added logic to prevent duplicate comments by managing socket responses.
- **`index.js`**: Enhanced socket event handling for real-time functionality.

---

## ✅ Feature 3: Lazy Loading Comments
**Objective**: Implement infinite scroll for comments to optimize performance.

### Frontend
- **`File.jsx`**: Integrated infinite scrolling logic into the comments section.
- **`Comments.jsx`**: Added a custom hook for paginated data fetching.

### Backend
- **`comment.schema.js`**, **`comment.service.js`**: Introduced pagination logic and query adjustments.

### Challenge + Solution
Pagination with threaded comments was complex due to potential misalignment between parents and children across pages. The solution involved fetching top-level comments first, then aggregating their replies, ensuring consistency in thread rendering.

---

## ✅ Feature 4: Global Search
**Objective**: Implement a unified search across projects, files, and comments.

### Frontend
- Created a global search component with debounced inputs for real-time feel.

### Backend
- Created a `search.module` for searching across collections.
- Added relevant DB indexes for efficient querying.

### Enhancements
- Introduced Redis caching to improve performance.
- Solved state management and race conditions for fast, smooth search UX.

---

## 💡 Bonus User Experience Enhancements
- Highlighted comment threads when clicking on a file dot marker.
- Ensured dot click scrolls to relevant comment.

---

## ✅ Refactoring

### Backend
- **Restructured to improve maintainability and scalability**:
  - `config/`: Socket, DB, Redis configs.
  - `models/`: All Mongoose models using ODM/repository pattern.
  - `modules/`: Separated features by folder: `auth`, `comments`, `projects`, `files` etc., each with `*.controller.js`, `*.service.js`, `*.routes.js`, and `*.schema.js` files.
  - `routes/`: Centralized route management via `index.js`.
  - `middleware/`: Middleware handling.
  - `utils/`: Helper utilities.
  - `index.js`: App entry point.

- **Other Enhancements**:
  - Wrapped DB ops in try/catch blocks for better error handling.
  - Introduced rotating logs for robust observability.

### Frontend
- **Structural Improvements**:
  - `api/`: API calls centralized.
  - `components/`: Structured by page context.
  - `hooks/`, `context/`, `pages/`: Organized for better dev experience.
  - Added ErrorBoundary in `components/common` to handle unexpected crashes.

---

## 🧪 Tests
- Added tests to validate all features listed above.
- Covered core user flows like commenting, replying, real-time updates, lazy loading, and searching.
