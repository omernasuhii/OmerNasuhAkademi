const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

if (!content.includes('import { useAuth } from')) {
    content = content.replace(
        "import { auth } from '../../lib/firebase';",
        "import { auth } from '../../lib/firebase';\nimport { useAuth } from '../../lib/AuthContext';"
    );
}

if (!content.includes('const { userData } = useAuth();')) {
    content = content.replace(
        "export default function Coaching() {",
        "export default function Coaching() {\n  const { userData } = useAuth();"
    );
}

// Now replace the optgroups in the extra task modal
const newOptGroups = `
                     <optgroup label="TYT">
                        <option value="Türkçe">Türkçe</option>
                        <option value="Matematik (TYT)">Matematik (TYT)</option>
                        <option value="Geometri (TYT)">Geometri (TYT)</option>
                        <option value="Fizik (TYT)">Fizik (TYT)</option>
                        <option value="Kimya (TYT)">Kimya (TYT)</option>
                        <option value="Biyoloji (TYT)">Biyoloji (TYT)</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Din Kültürü">Din Kültürü</option>
                        <option value="Paragraf">Paragraf</option>
                        <option value="Problem">Problem</option>
                     </optgroup>
                     {userData?.grade === '9. Sınıf' && (
                       <optgroup label="9. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (9. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (9. Sınıf)">Tarih</option>
                          <option value="Coğrafya (9. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (9. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (9. Sınıf)">Matematik</option>
                          <option value="Fizik (9. Sınıf)">Fizik</option>
                          <option value="Kimya (9. Sınıf)">Kimya</option>
                          <option value="Biyoloji (9. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
                     {userData?.grade === '10. Sınıf' && (
                       <optgroup label="10. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (10. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (10. Sınıf)">Tarih</option>
                          <option value="Coğrafya (10. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (10. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (10. Sınıf)">Matematik</option>
                          <option value="Fizik (10. Sınıf)">Fizik</option>
                          <option value="Kimya (10. Sınıf)">Kimya</option>
                          <option value="Biyoloji (10. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
                     {userData?.grade === '11. Sınıf' && (
                       <optgroup label="11. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (11. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (11. Sınıf)">Tarih</option>
                          <option value="Coğrafya (11. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (11. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (11. Sınıf)">Matematik</option>
                          <option value="Fizik (11. Sınıf)">Fizik</option>
                          <option value="Kimya (11. Sınıf)">Kimya</option>
                          <option value="Biyoloji (11. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
`;

content = content.replace(/<optgroup label="TYT">[\s\S]*?<optgroup label="AYT">/, newOptGroups + '                     <optgroup label="AYT">');

const denemeGroupNew = `
                     <optgroup label="Denemeler">
                        <option value="TYT Genel">TYT Genel</option>
                        <option value="AYT Genel">AYT Genel</option>
                        {userData?.grade === '9. Sınıf' && <option value="9. Sınıf Genel Denemesi">9. Sınıf Genel Denemesi</option>}
                        {userData?.grade === '10. Sınıf' && <option value="10. Sınıf Genel Denemesi">10. Sınıf Genel Denemesi</option>}
                        {userData?.grade === '11. Sınıf' && <option value="11. Sınıf Genel Denemesi">11. Sınıf Genel Denemesi</option>}
                        <option value="TYT Matematik Denemesi">TYT Matematik Denemesi</option>
                        <option value="TYT Türkçe Denemesi">TYT Türkçe Denemesi</option>
`;

content = content.replace(/<optgroup label="Denemeler">\s*<option value="TYT Genel">TYT Genel<\/option>\s*<option value="AYT Genel">AYT Genel<\/option>\s*<option value="TYT Matematik Denemesi">TYT Matematik Denemesi<\/option>\s*<option value="TYT Türkçe Denemesi">TYT Türkçe Denemesi<\/option>/, denemeGroupNew);

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
