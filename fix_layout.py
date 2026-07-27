import re

with open('src/pages/students/StudentLayout.tsx', 'r') as f:
    content = f.read()

# We know where it starts: const menuSections = [
start_idx = content.find('const menuSections = [')
end_idx = content.find('];', start_idx) + 2

new_sections = """const menuSections = [
    {
      items: [
        { title: 'Özet', path: '', icon: LayoutDashboard },
        ...(!isCabaCompleted ? [{ title: 'ÇABA Testi', path: 'caba-testi', icon: Brain }] : [])
      ]
    },
    {
      title: 'Akademik & Eğitim',
      items: [
        { title: 'Randevu Sistemi', path: 'randevular', icon: Calendar },
        { title: 'Koçluk Sayfası', path: 'kocluk', icon: GraduationCap },
        { title: 'Online Eğitimler', path: 'online-egitimler', icon: Monitor },
        { title: 'Etkinlikler', path: 'etkinlikler', icon: Trophy },
      ]
    },
    {
      title: 'Araçlar & Analiz',
      items: [
        { title: 'Denemeler', path: 'denemeler', icon: PenTool },
        { title: 'Zaman Yönetimi', path: 'zaman-yonetimi', icon: Clock },
        { title: 'Yapay Zeka Asistan', path: 'ai-asistan', icon: Brain },
        { title: 'Kişilik Analizleri', path: 'analizler', icon: TrendingUp },
      ]
    },
    {
      title: 'YKS',
      items: [
        { title: 'Tercih Robotu', path: 'tercih-robotu', icon: Search },
      ]
    },
    {
      title: 'Hesap & Finans',
      items: [
        { title: 'Mağaza', path: 'magaza', icon: ShoppingBag },
        { title: 'Abonelikler', path: 'abonelik', icon: Star },
        { title: 'Profilim', path: 'profil', icon: User },
      ]
    }
  ];"""

# Handle case where end_idx might be wrong (if ]; is missing or far away)
# Actually, the original array ends just before `const isSidebarCollapsed` maybe?
# Let's use regex to be safe.
match = re.search(r'const menuSections = \[\s*\{[\s\S]*?\n\s*\];?', content)
if match:
    content = content[:match.start()] + new_sections + content[match.end():]
    with open('src/pages/students/StudentLayout.tsx', 'w') as f:
        f.write(content)
    print("Fixed via regex")
else:
    print("Regex match failed")
