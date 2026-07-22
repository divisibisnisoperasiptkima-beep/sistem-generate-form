import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'playwright@test.com';
const TEST_PASSWORD = 'Test123456!';

test.describe('PDF Form Generator - Auth Flow', () => {

  test('sign-in form is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h2')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('toggle to sign-up form', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Sign Up').click();
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await page.getByText('Sign In').click();
    await expect(page.locator('h2')).toContainText('Sign In');
  });

  test('sign-in with valid credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('h1')).toContainText('My Templates', { timeout: 8000 });
    await expect(page.getByRole('button', { name: 'New Template' })).toBeVisible();
  });

  test('sign-in with invalid password shows error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 5000 });
  });

  test('sign-in with empty fields shows validation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('h2')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]:invalid')).toBeTruthy();
  });

  test('sign-up with already registered email shows error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Sign Up').click();
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Re-enter your password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.locator('text=already registered')).toBeVisible({ timeout: 5000 });
  });

  test('sign-up with mismatched passwords shows validation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Sign Up').click();
    await page.locator('input[type="email"]').fill('newuser@test.com');
    await page.getByPlaceholder('Min. 8 characters').fill('Test123456!');
    await page.getByPlaceholder('Re-enter your password').fill('DifferentPass1!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('sign-in then sign-out flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('h1')).toContainText('My Templates', { timeout: 8000 });

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.locator('h2')).toContainText('Sign In', { timeout: 5000 });
  });

  test('forgot password flow shows success message', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Forgot password?').click();
    await expect(page.locator('h2')).toContainText('Reset Password');
    await page.locator('input[type="email"]').fill('someone@test.com');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.locator('text=If an account exists')).toBeVisible({ timeout: 8000 });
  });

  test('forgot password back to sign in', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Forgot password?').click();
    await expect(page.locator('h2')).toContainText('Reset Password');

    await page.getByText('Back to Sign In').click();
    await expect(page.locator('h2')).toContainText('Sign In');
  });

  test('admin page redirects unauthenticated user', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.locator('h2')).toContainText('Sign In', { timeout: 5000 });
  });
});
