import { CURRICULUM as DEFAULT_CURRICULUM } from '../constants/curriculum';
import { SUBTOPICS as DEFAULT_SUBTOPICS } from '../constants/subtopics';

/**
 * Müfredat konularını normalize edilmiş ders adına ve kitap tipine göre döndürür.
 */
export function getCurriculumTopicsForBook(
  book: { subject?: string; type?: string; coveredTopics?: string[]; resourceType?: string; totalExamCount?: number; totalTopics?: number } | null | undefined,
  customCurriculum?: Record<string, string[]> | null
): string[] {
  if (!book) return [];

  // Deneme Sınavı Paketi: Konular yerine Deneme 1, Deneme 2, ..., Deneme N
  if (book.resourceType === 'deneme') {
    if (Array.isArray(book.coveredTopics) && book.coveredTopics.length > 0) {
      return book.coveredTopics;
    }
    const count = Number(book.totalExamCount || book.totalTopics || 10);
    return Array.from({ length: count }, (_, i) => `Deneme ${i + 1}`);
  }

  if (!book.subject) return [];

  // 0. Fasikül veya özel kapsam seçimi varsa (coveredTopics tanımlanmışsa) doğrudan o konuları döndür
  if (Array.isArray(book.coveredTopics) && book.coveredTopics.length > 0) {
    return book.coveredTopics;
  }

  const curr = (customCurriculum && typeof customCurriculum === 'object') ? customCurriculum : DEFAULT_CURRICULUM;
  const rawSubject = (book.subject || '').trim();
  if (!rawSubject) return [];

  // 1. Doğrudan tam eşleşme
  if (Array.isArray(curr[rawSubject]) && curr[rawSubject].length > 0) {
    return curr[rawSubject];
  }

  // 2. Parantez içi temizlenmiş anahtar (örn: "Matematik (TYT)" -> "Matematik", "Fizik (AYT)" -> "Fizik" veya "AYT Fizik")
  const cleanSubject = rawSubject.replace(/^(TYT|AYT)\s*/i, '').replace(/\s*\((TYT|AYT)\)/i, '').trim();

  // AYT önceliği
  const isAyt = (book.type || '').toUpperCase() === 'AYT' || rawSubject.toUpperCase().includes('AYT');
  if (isAyt) {
    const aytKey = `AYT ${cleanSubject}`;
    if (Array.isArray(curr[aytKey]) && curr[aytKey].length > 0) {
      return curr[aytKey];
    }
  }

  if (Array.isArray(curr[cleanSubject]) && curr[cleanSubject].length > 0) {
    return curr[cleanSubject];
  }

  // 3. Büyük/küçük harf duyarsız arama
  const lowerSubject = rawSubject.toLowerCase();
  for (const [key, topics] of Object.entries(curr)) {
    if (key && key.toLowerCase() === lowerSubject && Array.isArray(topics) && topics.length > 0) {
      return topics;
    }
  }

  return [];
}

/**
 * Kitabın tamamlanma oranını (%0 - %100 arasında güvenli tam sayı) hesaplar.
 * Asla 100'ü geçemez (Math.min(100, ...)) ve negatif olamaz.
 */
export function calculateBookProgress(
  book: any,
  completedTopics: string[] = [],
  customCurriculum?: Record<string, string[]> | null,
  customSubtopics?: Record<string, string[]> | null
): number {
  if (!book) return 0;

  const validCompletedTopics = Array.isArray(completedTopics) ? completedTopics : [];
  const isYoutube = book.resourceType === 'youtube' || (Array.isArray(book.videos) && book.videos.length > 0);

  // 1. YouTube Kaynakları
  if (isYoutube) {
    const vids = Array.isArray(book.videos) ? book.videos : [];
    if (vids.length === 0) return 0;

    const doneCount = vids.filter((v: any) => {
      const title = typeof v === 'string' ? v : v?.title;
      const vidId = typeof v === 'object' ? v?.videoId : undefined;
      return (title && validCompletedTopics.includes(title)) || (vidId && validCompletedTopics.includes(vidId));
    }).length;

    return Math.min(100, Math.max(0, Math.round((doneCount / vids.length) * 100)));
  }

  // 2. Deneme Sınavı Paketleri
  if (book.resourceType === 'deneme') {
    const curriculumTopics = getCurriculumTopicsForBook(book, customCurriculum) || [];
    const totalCount = Number(book.totalExamCount || book.totalTopics || (curriculumTopics.length > 0 ? curriculumTopics.length : 10));
    if (totalCount <= 0) return 0;
    const doneCount = validCompletedTopics.length;
    return Math.min(100, Math.max(0, Math.round((doneCount / totalCount) * 100)));
  }

  // 3. Fiziksel Kitaplar / Soru & Konu Kitapları
  const curr = (customCurriculum && typeof customCurriculum === 'object') ? customCurriculum : DEFAULT_CURRICULUM;
  const subsMap = (customSubtopics && typeof customSubtopics === 'object') ? customSubtopics : DEFAULT_SUBTOPICS;
  const curriculumTopics = getCurriculumTopicsForBook(book, curr) || [];

  if (curriculumTopics.length === 0) {
    if (book.totalTopics && Number(book.totalTopics) > 0) {
      return Math.min(100, Math.max(0, Math.round((validCompletedTopics.length / Number(book.totalTopics)) * 100)));
    }
    // Konu listesi bilinmiyorsa ve completedTopics doluysa en fazla 100
    return Math.min(100, Math.max(0, validCompletedTopics.length > 0 ? 100 : 0));
  }

  let totalWeight = 0;
  curriculumTopics.forEach((topic: string) => {
    const subs = Array.isArray(subsMap?.[topic]) ? subsMap[topic] : [];
    if (subs.length > 0) {
      const doneSubs = subs.filter((s: string) => validCompletedTopics.includes(s)).length;
      if (validCompletedTopics.includes(topic) || doneSubs >= subs.length) {
        totalWeight += 1;
      } else {
        totalWeight += Math.min(1, doneSubs / (subs.length || 1));
      }
    } else {
      if (validCompletedTopics.includes(topic)) {
        totalWeight += 1;
      }
    }
  });

  const rawPercent = Math.round((totalWeight / (curriculumTopics.length || 1)) * 100);
  return Math.min(100, Math.max(0, rawPercent));
}

/**
 * Güvenli yüzde değeri döndürür (0 - 100 aralığında garanti altına alınmış tam sayı).
 */
export function getSafePercentage(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}
