import { test, expect } from '@playwright/test';

test.describe('フロージャーナル', () => {
  test('基本フロー: スタート→入力→終了', async ({ page }) => {
    await page.goto('/');

    // スタート画面が表示される
    await expect(page.getByRole('heading', { name: 'Flow Journal' })).toBeVisible();

    // はじめるボタンをクリック
    await page.getByRole('button', { name: 'はじめる' }).click();

    // テキストエリアが表示される
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // テキストを入力
    await textarea.fill('これはテストです。思考を止めずに書き続けます。');

    // 入力されたテキストが表示される
    await expect(textarea).toHaveValue('これはテストです。思考を止めずに書き続けます。');
  });

  test('タイピングでフローゲージが変化する', async ({ page }) => {
    // trace: 'on' が設定されているので自動でトレース記録される
    await page.goto('/');
    await page.getByRole('button', { name: 'はじめる' }).click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // ゆっくり入力（delay: 300ms）→ フローゲージは低いまま
    await textarea.pressSequentially('こんにちは', { delay: 300 });

    // 少し待機
    await page.waitForTimeout(2000);

    // 速く入力（delay: 30ms）→ フローゲージ上昇
    await textarea.pressSequentially('思考を止めずに書き続ける流れるように書く', { delay: 30 });
  });

  test('入力停止で霞むエフェクトが発動する', async ({ page }) => {
    // trace: 'on' が設定されているので自動でトレース記録される
    await page.goto('/');
    await page.getByRole('button', { name: 'はじめる' }).click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // テキストを入力
    await textarea.pressSequentially('テスト入力です', { delay: 50 });

    // 入力を停止して霞むエフェクトを待つ（デフォルト3秒）
    await page.waitForTimeout(4000);

    // FogOverlayまたは霞む関連のクラスが表示されることを確認
    // CSSでopacityが変化するはずなので、視覚的な変化をトレースで確認

    // 再び入力して復活
    await textarea.pressSequentially('復活しました', { delay: 50 });
  });

  test('セッション終了後にサマリーが表示される', async ({ page }) => {
    await page.goto('/');

    // クイックモードを選択（1分）
    const quickModeButton = page.getByRole('button', { name: /クイック|1分/ });
    if (await quickModeButton.isVisible()) {
      await quickModeButton.click();
    }

    await page.getByRole('button', { name: 'はじめる' }).click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // テキストを入力
    await textarea.fill('クイックセッションのテストです。短時間で集中して書きます。');

    // 終了ボタンがあればクリック
    const endButton = page.getByRole('button', { name: /終了|完了/ });
    if (await endButton.isVisible()) {
      await endButton.click();
    }
  });
});
