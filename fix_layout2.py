import re

with open('src/pages/students/StudentLayout.tsx', 'r') as f:
    content = f.read()

# I will find "const menuSections = [" and the end of the array which is followed by 
# `        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 scrollbar-thin">`
# Let's check where the nav starts.
nav_start = content.find('<nav className="flex-1 overflow-y-auto')

if nav_start != -1:
    # Now find the first const menuSections = [
    menu_start = content.find('const menuSections = [')
    
    # We replace everything between menu_start and nav_start - some characters
    # But let's just find the closing bracket before nav_start
    close_idx = content.rfind('];', menu_start, nav_start)
    if close_idx == -1:
        # Maybe it's just ]
        close_idx = content.rfind(']', menu_start, nav_start)
    
    if close_idx != -1:
        # Replace
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
        # I need to see what's between close_idx and nav_start
        # usually just some spaces.
        # But wait, earlier I broke the file so there is garbage. I will just find the start of `<nav` and replace everything from `const menuSections = [` to `<nav` with the array and `<nav`
        
        content = content[:menu_start] + new_sections + '\n\n        ' + content[nav_start:]
        with open('src/pages/students/StudentLayout.tsx', 'w') as f:
            f.write(content)
        print("Fixed completely")
    else:
        print("Could not find ]")
else:
    print("Could not find nav")
