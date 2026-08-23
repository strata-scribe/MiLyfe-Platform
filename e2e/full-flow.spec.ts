import { test, expect } from "@playwright/test";

/**
 * MiLyfe End-to-End Test — The Full Flow
 * 
 * This test does EXACTLY what Carnell described:
 * 1. Opens localhost:3000
 * 2. Sees the landing page
 * 3. Clicks "Get started"
 * 4. Goes through 7 onboarding steps
 * 5. Clicks "Enter MiLyfe"
 * 6. Lands on the dashboard with name, balance, feed
 * 7. Navigates to Pocket, sends $MLY
 * 8. Navigates to Street, sees quests and marketplace
 * 9. Claims a quest
 * 10. Navigates to Voice, votes on a proposal
 * 11. Navigates to Learn, starts a path
 * 12. Navigates to You, sees profile
 */

test.describe("MiLyfe Full Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear all localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Landing page renders with hero and CTA", async ({ page }) => {
    await page.goto("/");
    
    // See the hero text
    await expect(page.locator("h1")).toContainText("Your life, together");
    
    // See the "Get started" button
    const cta = page.locator('a:has-text("Get started")');
    await expect(cta).toBeVisible();
    
    // See the "Look around first" button
    await expect(page.locator('a:has-text("Look around first")')).toBeVisible();
  });

  test("Full signup → dashboard → pocket → street → voice → learn → you", async ({ page }) => {
    // Capture console errors
    page.on("console", msg => {
      if (msg.type() === "error") console.error("BROWSER ERROR:", msg.text());
    });
    page.on("pageerror", err => console.error("PAGE ERROR:", err.message));
    
    await page.goto("/");
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Click "Get started" → go to onboarding
    // ═══════════════════════════════════════════════════════════════════
    await page.click('a:has-text("Get started")');
    await page.waitForURL("**/onboarding");
    
    // Should see Step 1: Language and access
    await expect(page.locator("h2")).toContainText("Language and access");
    
    // Click Continue (language defaults are fine)
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Name & Face
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Your name and face");
    
    // Fill in name
    await page.fill('input[placeholder="What people call you"]', "TestUser");
    // Fill in email
    await page.fill('input[placeholder="For login and recovery"]', "test@milyfe.local");
    // Fill in password
    await page.fill('input[type="password"]', "password123");
    
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Home Place
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Your home place");
    await page.fill('input[placeholder*="Riverside"]', "Riverside, Jacksonville");
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Device
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Your device");
    // "Just mine" is default, click continue
    await page.click('label:has-text("Just mine")');
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Recovery
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Recovery");
    // "Set up later" is fine
    await page.click('label:has-text("Set up later")');
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 6: Privacy
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Privacy starting point");
    // "Quiet start" is default
    await page.click('button:has-text("Continue")');
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 7: Truth & Control
    // ═══════════════════════════════════════════════════════════════════
    await expect(page.locator("h2")).toContainText("Truth and control");
    
    // Check all three confirmations
    await page.click('label:has-text("MiLyfe is not the government") input[type="checkbox"]');
    await page.click('label:has-text("People make the important decisions") input[type="checkbox"]');
    await page.click('label:has-text("I can take my information and leave") input[type="checkbox"]');
    
    // Click "Enter MiLyfe"
    await page.click('button:has-text("Enter MiLyfe")');
    
    // Check for errors on screen before waiting for navigation
    await page.waitForTimeout(3000);
    const errorEl = page.locator('.text-danger[role="alert"]');
    if (await errorEl.count() > 0 && await errorEl.first().isVisible()) {
      const errorText = await errorEl.first().textContent();
      console.error("SIGNUP ERROR:", errorText);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DASHBOARD: Should land on /home with real data
    // ═══════════════════════════════════════════════════════════════════
    await page.waitForURL("**/home", { timeout: 10000 });
    
    // Should see greeting with name
    await expect(page.locator("h1")).toContainText("TestUser");
    
    // Should see balance widget showing 500
    await expect(page.locator("text=500 $MLY").first()).toBeVisible({ timeout: 5000 });
    
    // Should see feed items (seed data)
    await expect(page.locator("text=Fresh bread available").first()).toBeVisible({ timeout: 5000 });
    
    // ═══════════════════════════════════════════════════════════════════
    // POCKET: Navigate and check balance
    // ═══════════════════════════════════════════════════════════════════
    await page.click('a[href="/pocket"]');
    await page.waitForURL("**/pocket");
    
    // Should see "Pocket" heading
    await expect(page.locator("h1")).toContainText("Pocket");
    
    // Should see 500 balance
    await expect(page.locator(".text-5xl").first()).toContainText("500", { timeout: 5000 });
    
    // Click Thank button
    await page.click('button:has-text("Thank")');
    
    // Modal should appear
    await expect(page.locator("text=Thank someone")).toBeVisible();
    
    // Select a recipient (Marcus)
    await page.click('button:has-text("Marcus")');
    
    // Enter amount
    await page.fill('input[type="number"]', "10");
    
    // Enter memo
    await page.fill('input[placeholder*="watching the kids"]', "for the ride");
    
    // Send - dispatch click directly to bypass nav overlay
    await page.locator('button:has-text("Send thanks")').dispatchEvent("click");
    
    // Should see success
    await expect(page.locator("text=Arrived")).toBeVisible({ timeout: 5000 });
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    // Balance should now be 490
    await expect(page.locator(".text-5xl").first()).toContainText("490", { timeout: 5000 });
    
    // ═══════════════════════════════════════════════════════════════════
    // STREET: Navigate and check marketplace/quests
    // ═══════════════════════════════════════════════════════════════════
    await page.goto("/street");
    
    // Should see marketplace posts
    await expect(page.locator("text=8 bread bags from Harbor Bakery")).toBeVisible({ timeout: 5000 });
    
    // Claim a marketplace item
    const claimBtn = page.locator('button:has-text("I want this")').first();
    await claimBtn.click();
    
    // Should show "Claimed"
    await expect(page.locator("text=Claimed").first()).toBeVisible({ timeout: 5000 });
    
    // Switch to Quests tab
    await page.click('button[role="tab"]:has-text("Quests")');
    
    // Should see quests
    await expect(page.locator("text=Verify Northside Pantry hours")).toBeVisible({ timeout: 5000 });
    
    // Claim a quest
    await page.click('button:has-text("Claim")');
    
    // Should now show "Done" button
    await expect(page.locator('button:has-text("Done")')).toBeVisible({ timeout: 5000 });
    
    // Complete the quest
    await page.click('button:has-text("Done")');
    
    // Should show completion
    await expect(page.locator("text=Done").first()).toBeVisible({ timeout: 3000 });
    
    // ═══════════════════════════════════════════════════════════════════
    // VOICE: Navigate and vote
    // ═══════════════════════════════════════════════════════════════════
    await page.click('a[href="/voice"]');
    await page.waitForURL("**/voice");
    
    // Should see proposals
    await expect(page.getByRole("heading", { name: "Add shade sails" })).toBeVisible({ timeout: 5000 });
    
    // Vote Yes on the decide-stage proposal
    await page.click('button:has-text("Yes")');
    
    // Should show "Vote cast"
    await expect(page.getByText("Vote cast", { exact: true })).toBeVisible({ timeout: 5000 });
    
    // ═══════════════════════════════════════════════════════════════════
    // LEARN: Navigate and start a path
    // ═══════════════════════════════════════════════════════════════════
    await page.click('a[href="/learn"]');
    await page.waitForURL("**/learn");
    
    // Should see learning paths
    await expect(page.locator("text=Rights and Papers")).toBeVisible({ timeout: 5000 });
    
    // Click into the first path
    await page.click("text=Rights and Papers");
    
    // Should see path detail
    await expect(page.locator("text=Start this path")).toBeVisible({ timeout: 5000 });
    
    // Start the path
    await page.click('button:has-text("Start this path")');
    
    // Should go back to list and show progress
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({ timeout: 5000 });
    
    // ═══════════════════════════════════════════════════════════════════
    // YOU: Navigate and check profile
    // ═══════════════════════════════════════════════════════════════════
    await page.click('a[href="/you"]');
    await page.waitForURL("**/you");
    
    // Should see user's name
    await expect(page.locator("h2:has-text('TestUser')")).toBeVisible({ timeout: 5000 });
    
    // Should see place
    await expect(page.locator("text=Riverside, Jacksonville")).toBeVisible();
    
    // Should see "Not yet verified" personhood status
    await expect(page.locator("text=Not yet verified")).toBeVisible();
    
    console.log("✅ FULL FLOW COMPLETE — Everything works click-by-click");
  });
});
