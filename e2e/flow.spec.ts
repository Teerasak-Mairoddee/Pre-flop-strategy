import { expect, test } from '@playwright/test';

test('pick a spot and a hand, get advice', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('result')).toContainText('Tap your two cards');

  // Button, folded to me, A K suited: open.
  await page.locator('[data-rank="A"]').click();
  await page.locator('[data-rank="K"]').click();
  await page.getByRole('radio', { name: 'Suited' }).click();
  await expect(page.getByTestId('move')).toHaveText('RAISE');
  await expect(page.getByTestId('result')).toContainText('Raise to 2.5 big blinds');

  // UTG with 7 2 offsuit, picked from the chart: fold.
  await page.getByTestId('seat').getByRole('radio', { name: 'UTG' }).click();
  await page.getByRole('gridcell', { name: /^72o/ }).click();
  await expect(page.getByTestId('move')).toHaveText('FOLD');

  // Big blind facing a button open with K 9 offsuit: call.
  await page.getByTestId('seat').getByRole('radio', { name: 'BB' }).click();
  await page.getByTestId('situation').getByRole('radio', { name: 'Facing a raise' }).click();
  await expect(page.getByTestId('result')).toContainText('Who opened the pot?');
  await page.getByTestId('villain').getByRole('radio', { name: 'BTN' }).click();
  await page.getByRole('gridcell', { name: /^K9o/ }).click();
  await expect(page.getByTestId('move')).toHaveText('CALL');
});

test('explains the selected seat', async ({ page }) => {
  await page.goto('./');
  const about = page.getByTestId('seat-about');
  await expect(about).toContainText('Button');
  await page.getByTestId('seat').getByRole('radio', { name: 'UTG' }).click();
  await about.locator('summary').click();
  await expect(about).toContainText('Under the gun');
  await expect(about).toContainText('First to act');
});

test('table size limits the seats', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('seat').getByRole('radio')).toHaveCount(6);
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('players').getByRole('radio', { name: '4' }).click();
  await expect(page.getByTestId('game-summary')).toHaveText('4 players · 100 BB');
  await expect(page.getByTestId('seat').getByRole('radio')).toHaveText(['CO', 'BTN', 'SB', 'BB']);

  // The big blind can only face raises from seats that are dealt in.
  await page.getByTestId('seat').getByRole('radio', { name: 'BB' }).click();
  await page.getByTestId('situation').getByRole('radio', { name: 'Facing a raise' }).click();
  await expect(page.getByTestId('villain').getByRole('radio')).toHaveText(['CO', 'BTN', 'SB']);

  // The choice survives a reload.
  await page.reload();
  await expect(page.getByTestId('game-summary')).toHaveText('4 players · 100 BB');
});
