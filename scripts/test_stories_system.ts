import { getStories, getActiveStories, getStoryById, createStory, updateStory, deleteStory } from '../lib/services/stories';

async function main() {
  console.log('🧪 === BURSA KUMAŞ DÜNYASI HİKAYE (STORIES) SİSTEMİ TESTİ ===\n');

  // 1. Check existing seed stories
  const initialStories = getStories();
  console.log(`✅ 1. Toplam Kayıtlı Hikaye Sayısı: ${initialStories.length}`);
  initialStories.forEach((s, idx) => {
    console.log(`   - [${idx + 1}] "${s.title}" (${s.slides.length} slayt, Aktif: ${s.is_active})`);
  });

  if (initialStories.length === 0) {
    throw new Error('Seed stories bulunamadı!');
  }

  // 2. Check active stories
  const activeStories = getActiveStories();
  console.log(`\n✅ 2. Aktif Hikaye Sayısı: ${activeStories.length}`);
  if (activeStories.length !== initialStories.filter(s => s.is_active === 1).length) {
    throw new Error('Aktif hikaye filtreleme uyuşmuyor!');
  }

  // 3. Create a test story
  console.log('\n➕ 3. Yeni Hikaye Oluşturuluyor...');
  const newStory = createStory({
    title: 'Test Hikayesi (Özel Fırsat)',
    cover_image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
    order_index: 99,
    is_active: 1,
    slides: [
      {
        id: 'test-slide-1',
        image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        title: 'Bahar Kampanyası %30 İndirim',
        subtitle: 'Tüm duck bezi ve masa örtüsü kumaşlarında geçerli kupon kodu: BAHAR30',
        button_text: 'Fırsatı Yakala',
        button_link: '/kategori/duck-bezi-kumas',
        duration: 6
      },
      {
        id: 'test-slide-2',
        image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        title: 'Yeni Sezon Kadifeler Geldi',
        subtitle: 'İtalyan dokuma leke tutmaz premium serisi',
        button_text: 'Kadife Koleksiyonu',
        button_link: '/kategori/kadife-dosemelik-kumas',
        duration: 5
      }
    ]
  });
  console.log(`✅ Hikaye başarıyla oluşturuldu! ID: ${newStory.id}, Başlık: ${newStory.title}, Slayt Sayısı: ${newStory.slides.length}`);

  // 4. Update story
  console.log('\n✏️ 4. Hikaye Güncelleniyor...');
  const updatedStory = updateStory(newStory.id, {
    title: 'Test Hikayesi (GÜNCELLENDİ)',
    is_active: 0
  });
  if (!updatedStory || updatedStory.title !== 'Test Hikayesi (GÜNCELLENDİ)' || updatedStory.is_active !== 0) {
    throw new Error('Hikaye güncelleme başarısız!');
  }
  console.log(`✅ Hikaye güncellendi! Yeni Başlık: ${updatedStory.title}, Aktiflik: ${updatedStory.is_active}`);

  // 5. Verify active stories does not include the deactivated story
  const activeAfterUpdate = getActiveStories();
  if (activeAfterUpdate.some(s => s.id === newStory.id)) {
    throw new Error('Pasife alınan hikaye aktif listede görünmemeli!');
  }
  console.log(`✅ Pasif hikaye aktif listeden başarıyla filtrelendi.`);

  // 6. Delete story
  console.log('\n🗑️ 5. Test Hikayesi Siliniyor...');
  const isDeleted = deleteStory(newStory.id);
  if (!isDeleted) {
    throw new Error('Hikaye silinemedi!');
  }
  const storyAfterDelete = getStoryById(newStory.id);
  if (storyAfterDelete) {
    throw new Error('Silinen hikaye hala veritabanında mevcut!');
  }
  console.log(`✅ Hikaye başarıyla silindi ve veritabanı doğrulandı.`);

  console.log('\n🎉 TÜM HİKAYE SİSTEMİ TESTLERİ BAŞARIYLA TAMAMLANDI! 🚀');
}

main().catch((err) => {
  console.error('❌ Test Hatası:', err);
  process.exit(1);
});
