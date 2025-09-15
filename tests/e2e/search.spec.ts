import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search interface', async ({ page }) => {
    await expect(page.getByText('Descubra os Melhores Produtos')).toBeVisible();
    await expect(page.getByText('Busca por Texto')).toBeVisible();
    await expect(page.getByText('Busca por Imagem')).toBeVisible();
  });

  test('should perform text search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Digite o nome do produto...');
    await searchInput.fill('Air Fryer');
    
    const searchButton = page.getByRole('button', { name: 'Buscar' });
    await searchButton.click();
    
    // Aguardar redirecionamento para página de resultados
    await expect(page).toHaveURL(/\/search\/text/);
  });

  test('should navigate to image search', async ({ page }) => {
    const imageSearchButton = page.getByRole('button', { name: 'Fazer Upload de Imagem' });
    await imageSearchButton.click();
    
    // Aguardar redirecionamento para página de busca por imagem
    await expect(page).toHaveURL('/search/image');
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByText('Ações Rápidas')).toBeVisible();
    await expect(page.getByText('Acessórios Celular')).toBeVisible();
    await expect(page.getByText('Eletroportáteis')).toBeVisible();
  });

  test('should navigate to rankings from quick actions', async ({ page }) => {
    const acessoriosLink = page.getByRole('link', { name: 'Acessórios Celular' });
    await acessoriosLink.click();
    
    // Aguardar redirecionamento para página de rankings
    await expect(page).toHaveURL(/\/rankings\/acessorios-celular/);
  });
});

test.describe('Image Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search/image');
  });

  test('should display image search interface', async ({ page }) => {
    await expect(page.getByText('Busca por Imagem')).toBeVisible();
    await expect(page.getByText('Faça upload de uma imagem para encontrar produtos similares')).toBeVisible();
  });

  test('should show drag and drop area', async ({ page }) => {
    const dropzone = page.getByText('Arraste uma imagem aqui ou clique para selecionar');
    await expect(dropzone).toBeVisible();
  });

  test('should accept image file upload', async ({ page }) => {
    // Criar um arquivo de imagem simulado
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    
    // Verificar se o botão de busca aparece
    await expect(page.getByRole('button', { name: 'Buscar Produtos Similares' })).toBeVisible();
  });
});
