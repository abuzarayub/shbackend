# SkillHub LMS Marketplace Manual Testing Guide

This guide will help you manually test the full SkillHub LMS Marketplace application, from signup to advanced features. Follow each step to ensure the app works as expected and matches the blueprint.

---

## 1. Signup & Login
- **Go to the signup page.**
- Register a new user (student or instructor) with a valid email and password.
- Confirm you receive a welcome email (if enabled).
- Log in with the new credentials.
- **Expected:** You are redirected to the correct dashboard (student/instructor/admin).

## 2. User Profiloe
- Navigate to your profile page.
- Update your profile details (name, avatar, etc.).
- **Expected:** Changes are saved and reflected immediately.

## 3. Student Dashboard
- View the dashboard after login.
- **Check:**
  - StatsGrid shows real stats (not dummy data).
  - Content In Progress and Completed Content show your real learning progress.
  - Certificates widget lists your earned certificates.
  - Achievements & Calendar show your real achievements and calendar events.
  - Study Reminders can be set, updated, and persist after reload.
- **Expected:** All widgets display real, personalized data.

## 4. My Learning / My Products
- Go to the My Learning or My Products page.
- **Check:**
  - All product cards (courses, events, bundles, subscriptions) show real data.
  - Progress bars, last activity, and actions (continue, view details) work.
- **Expected:** No dummy data. All actions reflect your real learning state.

## 5. Explore Page
- Visit the Explore page.
- **Check:**
  - Trending, Latest, and Recommended sections show real, cached data.
  - Clicking a card navigates to the correct details page.
- **Expected:** Fast load times (due to caching), real content.

## 6. Search
- Use the search bar to look for courses, events, or instructors.
- **Check:**
  - Results are fetched from the backend (Typesense).
  - Filtering and sorting work client-side.
- **Expected:** Large result sets, fast filtering, accurate results.

## 7. Product Details (Course/Event)
- Click into a course or event details page.
- **Check:**
  - Public data (description, outline, reviews) loads instantly (cached).
  - Personalized data (progress, follow status) loads if logged in.
- **Expected:** Hybrid data loading, no errors.

## 8. Enrollments & Progress
- Enroll in a course or event (if available).
- Complete some lessons or activities.
- **Check:**
  - Progress updates in real time or after a short delay.
  - Dashboard and My Learning reflect new progress.
- **Expected:** Event-driven updates, no duplicate enrollments.

## 9. Shopping Cart & Checkout
- Add products to your cart.
- Proceed to checkout.
- **Check:**
  - Cart syncs with backend and Zustand store.
  - Checkout links redirect to LearnWorlds or process free enrollments.
- **Expected:** Cart state is persistent, checkout works for all product types.

## 10. Certificates
- Complete a course that issues a certificate.
- **Check:**
  - Certificate appears in the Certificates widget.
  - Download or view certificate works.
- **Expected:** Real certificate data, no dummy entries.

## 11. Notifications
- Trigger actions that should generate notifications (enrollment, achievement, admin message).
- **Check:**
  - Notifications appear in the UI.
  - Mark as read works and persists.
- **Expected:** Real-time or near-real-time updates.

## 12. Admin Panel
- Log in as an admin.
- **Check:**
  - All admin tables (users, reviews, collections, transactions, etc.) show real data.
  - Actions (approve, reject, edit, delete) work and update the backend.
  - RBAC: Only authorized actions are available for your role.
- **Expected:** Secure, robust admin experience.

## 13. Settings
- Update platform or user settings.
- **Check:**
  - Changes persist and are reflected in the UI.
- **Expected:** No errors, settings are saved.

## 14. Webhooks & Background Jobs
- (If enabled) Trigger external events (e.g., via LearnWorlds or PayPal sandbox).
- **Check:**
  - Webhook events are processed once (idempotency).
  - Background jobs (badges, payouts, search sync) run as expected.
- **Expected:** No duplicate events, all jobs complete.

## 15. Accessibility & Internationalization
- Use keyboard navigation and screen readers on all pages.
- Switch languages (if i18n is enabled).
- **Expected:** All UI is accessible and translated.

---

## Special Notes
- **Event-Driven Features:** Some updates (progress, achievements, notifications) may be delayed by a few seconds due to background processing.
- **Caching:** Explore and public pages should load instantly due to Redis caching.
- **Error Handling:** All errors should be user-friendly and logged in the backend.

---

## Reporting Issues
- Note the page, action, and expected vs. actual result.
- Include screenshots or console errors if possible.
- Report issues to the dev team for fast resolution.

---

Happy testing! 🎉
