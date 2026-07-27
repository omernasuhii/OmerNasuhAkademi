const fs = require('fs');

const path = 'src/pages/CommunityProfile.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      setError("Profil fotoğrafı çok büyük. (Maksimum 200KB)");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateDoc(doc(db, 'users', user!.uid), {
          photoURL: base64
        });
        setLoading(false);
      };
    } catch (err) {
      console.error(err);
      setError("Fotoğraf yüklenemedi.");
      setLoading(false);
    }
  };`;

const replacementContent = `  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      let finalBase64 = "";

      if (file.size > 200 * 1024) {
        // Otomatik küçültme
        finalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              let width = img.width;
              let height = img.height;
              const maxDimension = 500; // Profil için yeterli

              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = Math.round((height * maxDimension) / width);
                  width = maxDimension;
                } else {
                  width = Math.round((width * maxDimension) / height);
                  height = maxDimension;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject("Canvas ctx error");
              
              ctx.drawImage(img, 0, 0, width, height);
              
              let quality = 0.9;
              let dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              const getB64Size = (b64: string) => b64.length * (3/4) - (b64.indexOf('=') > 0 ? (b64.length - b64.indexOf('=')) : 0);

              while (getB64Size(dataUrl) > 200 * 1024 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
              }
              resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
        });
      } else {
        finalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }

      await updateDoc(doc(db, 'users', user!.uid), {
        photoURL: finalBase64
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Fotoğraf yüklenemedi veya küçültülemedi.");
      setLoading(false);
    }
  };`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully replaced");
} else {
  console.log("Target not found");
}

