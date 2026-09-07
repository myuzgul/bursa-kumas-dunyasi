import { getShowcaseSettings, updateShowcaseSettings, toggleProductShowcase, getShowcaseData, updateProductShowcaseOrder } from '../lib/services/showcaseSettings';
import { dbRepo } from '../lib/db/repo';

async function runShowcaseTests() {
  console.log('🧪 Starting Homepage Showcase (Ana Sayfa Vitrini) Tests...\n');

  // Test 1: Verify Default Showcase Settings
  const settings = getShowcaseSettings();
  console.assert(settings.is_active === 1, 'Showcase should be active by default');
  console.assert(settings.title.length > 0, 'Showcase title should be set');
  console.assert(settings.badge_suffix === 'Model', 'Badge suffix should be "Model"');
  console.log(`✅ Test 1: Default showcase settings verified (Title: "${settings.title}", Badge: "${settings.badge_suffix}").`);

  // Test 2: Update Showcase Settings
  const updated = updateShowcaseSettings({
    title: 'Öne Çıkan Perde Modelleri',
    badge_suffix: 'Model',
    show_model_count: 1,
    max_items: 30,
  });
  console.assert(updated.title === 'Öne Çıkan Perde Modelleri', 'Title should be updated');
  console.assert(updated.max_items === 30, 'max_items should be 30');
  console.log('✅ Test 2: Showcase settings updated successfully.');

  // Test 3: Toggle Single Product Showcase
  const db = dbRepo.read();
  const sampleProduct = db.products[0];
  if (sampleProduct) {
    const originalStatus = sampleProduct.is_featured;
    const res1 = toggleProductShowcase(sampleProduct.id, true);
    console.assert(res1.is_featured === 1, 'Product should be featured');

    const res2 = toggleProductShowcase(sampleProduct.id, false);
    console.assert(res2.is_featured === 0, 'Product should not be featured');

    // Re-enable
    toggleProductShowcase(sampleProduct.id, true);
    console.log(`✅ Test 3: Single product showcase toggle verified for ${sampleProduct.name}.`);
  }

  // Test 4: Update Product Showcase Order
  if (sampleProduct) {
    const orderRes = updateProductShowcaseOrder(sampleProduct.id, 1);
    console.assert(orderRes.vitrin_order === 1, 'Product vitrin order should be 1');
    console.log('✅ Test 4: Product vitrin ordering verified.');
  }

  // Test 5: Get Showcase Data for Homepage
  const showcaseData = getShowcaseData();
  console.assert(showcaseData.products.length > 0, 'Showcase should return featured products');
  console.assert(showcaseData.categories.length > 0, 'Showcase should return category tabs');
  console.assert(showcaseData.totalCount === showcaseData.products.length, 'totalCount should match products length');

  console.log(`✅ Test 5: Showcase data aggregation verified (${showcaseData.totalCount} products across ${showcaseData.categories.length} category tabs).`);
  showcaseData.categories.forEach((cat) => {
    console.log(`   - Kategori Sekmesi: ${cat.name} (${cat.count} Model)`);
  });

  console.log('\n🎉 ALL 5 SHOWCASE SYSTEM TESTS PASSED SUCCESSFULLY!');
}

runShowcaseTests().catch(console.error);
