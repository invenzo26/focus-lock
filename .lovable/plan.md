

# Comprehensive Feature Prompt + Android File Summary

## Ready-to-Use Prompt for Lovable

Copy and paste this prompt into Lovable to implement all features:

---

**PROMPT TO COPY:**

```text
Add the following features to my FocusLock app. The entire UI must be mobile-first and responsive (optimized for 360-414px width). Use the existing dark theme with purple gradients. Use Framer Motion for animations.

FEATURE 1: LEADERBOARD PAGE (/leaderboard)
- Create a "leaderboards" table in the database with columns: user_id, total_focus_hours, current_streak, rank
- Show top users ranked by total focus hours
- Show current user's rank highlighted
- Add tabs: "Daily", "Weekly", "All Time"
- Add crown/medal icons for top 3
- Add this page to the bottom navigation bar

FEATURE 2: ACHIEVEMENTS & BADGES SYSTEM
- Create an "achievements" table: id, name, description, icon, requirement_type, requirement_value
- Create a "user_achievements" table: user_id, achievement_id, unlocked_at
- Seed achievements like: "First Focus" (1 session), "Marathon" (2hr session), "Streak Master" (7 day streak), "Centurion" (100 sessions), "Night Owl" (session after 10pm), "Early Bird" (session before 7am)
- Show achievements grid on profile page with locked/unlocked states
- Show toast notification when achievement is unlocked
- Check for new achievements after each completed session

FEATURE 3: FOCUS SCHEDULING (/schedule)
- Create a "scheduled_sessions" table: id, user_id, days_of_week (array), start_time, end_time, blocked_apps (array), is_active
- Let users create recurring focus schedules (e.g., Mon-Fri 9am-5pm)
- Show schedule as a weekly calendar view
- Auto-start focus sessions at scheduled times using background checks
- Add this page to bottom navigation or as a tab on the focus page

FEATURE 4: ANALYTICS DASHBOARD (/analytics)  
- Show daily/weekly/monthly focus time charts using Recharts
- Add a heatmap calendar showing focus days (like GitHub contributions)
- Show stats: average session length, most blocked app, best focus day, total time saved
- Pull data from focus_sessions table
- Add this as a tab or separate page accessible from dashboard

FEATURE 5: FOCUS SOUNDS
- Add an ambient sound player on the focus session page
- Include sound options: Rain, Lo-Fi, White Noise, Forest, Ocean
- Use royalty-free audio URLs or generate simple oscillator tones
- Show play/pause button and volume slider
- Sound should continue playing during active focus session
- Store user's preferred sound in their profile

FEATURE 6: REWARDS STORE (/store)
- Create a "store_items" table: id, name, description, price_coins, category, icon
- Create a "user_purchases" table: user_id, item_id, purchased_at
- Seed items like: custom themes, badge frames, streak shields, extra break tokens
- Show store grid with coin prices
- Deduct from wallet_balance on purchase
- Add to bottom nav or profile page

FEATURE 7: ENHANCED PROFILE PAGE
- Show user avatar (initials-based)
- Show full name, email, member since date
- Show wallet balance prominently
- Show focus stats: total hours, sessions completed, current streak, best streak
- Show achievements section (from Feature 2)
- Add settings section: notification preferences, sound preferences, theme toggle
- Add logout button with confirmation dialog
- Add "Export My Data" button

IMPORTANT CONSTRAINTS:
- ALL pages must be mobile-responsive (max-width approach, cards stack vertically)
- Bottom navigation must be visible on all authenticated pages
- Use existing Supabase/Lovable Cloud connection for all database operations
- Use existing auth system
- All new pages need proper routing in App.tsx
- Use shadcn/ui components and Tailwind CSS
- Animate page transitions with Framer Motion
- Keep the existing focus timer, app blocking, and permission system unchanged
```

---

## Android Native Files Reference

Below are the current Android files you need in Android Studio. These have NOT changed from the last working version — no new native code is needed for the features above (they are all UI/database features).

### Files you should have in Android Studio:

| File Path | Purpose |
|-----------|---------|
| `android/app/src/main/java/com/focuslock/app/MainActivity.java` | Registers AppBlockerPlugin |
| `android/app/src/main/java/com/focuslock/app/AppBlockerPlugin.java` | Capacitor bridge (start/stop blocking, permissions) |
| `android/app/src/main/java/com/focuslock/app/AppBlockerAccessibilityService.java` | Monitors foreground apps, triggers lock screen |
| `android/app/src/main/java/com/focuslock/app/AppBlockerService.java` | Foreground service for persistent blocking |
| `android/app/src/main/java/com/focuslock/app/LockScreenActivity.java` | Native block screen UI |
| `android/app/src/main/AndroidManifest.xml` | Permissions + service declarations |
| `android/app/src/main/res/xml/accessibility_service_config.xml` | Accessibility service config |

All seven features above are **web-layer only** (React + database). No Android native changes are required. After implementing in Lovable, just `git pull` and run `npx cap sync` in your local project.

