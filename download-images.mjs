import fs from 'fs';
import path from 'path';

const dir = './public/images';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const images = [
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', name: 'hero.jpg' },
  { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop', name: 'teacher.jpg' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop', name: 'event-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=600&auto=format&fit=crop', name: 'event-2.jpg' },
  { url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop', name: 'event-3.jpg' },
  { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop', name: 'tam-akademi.jpg' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop', name: 'gallery-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=600&auto=format&fit=crop', name: 'gallery-2.jpg' },
  { url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop', name: 'gallery-3.jpg' },
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop', name: 'gallery-4.jpg' },
  { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop', name: 'gallery-5.jpg' },
];

async function downloadAll() {
  for (const img of images) {
    try {
      console.log(`Downloading ${img.name}...`);
      const res = await fetch(img.url);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(path.join(dir, img.name), Buffer.from(buffer));
      console.log(`Successfully downloaded ${img.name}`);
    } catch (e) {
      console.error(`Failed to download ${img.name}:`, e.message);
    }
  }
  console.log('All downloads completed.');
}

downloadAll();
