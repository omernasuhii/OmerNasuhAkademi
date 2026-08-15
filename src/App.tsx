import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { NotificationListener } from "./components/NotificationListener";
import { PageTitleUpdater } from "./components/layout/PageTitleUpdater";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { CookieConsent } from "./components/layout/CookieConsent";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import AuthAction from "./pages/AuthAction";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminBursluluk from "./pages/admin/AdminBursluluk";
import AdminInbox from "./pages/admin/AdminInbox";
import UserManagement from "./pages/admin/UserManagement";
import ServiceManagement from "./pages/admin/ServiceManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import AppointmentManagement from "./pages/admin/AppointmentManagement";
import AppointmentList from "./pages/admin/AppointmentList";
import ComingSoonAdmin from "./pages/admin/ComingSoonAdmin";
import AdminPaidSubscriptions from "./pages/admin/AdminPaidSubscriptions";
import AdminEventCategories from "./pages/admin/AdminEventCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminCarts from "./pages/admin/AdminCarts";
import AdminCoachApprovals from "./pages/admin/AdminCoachApprovals";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAutoDiscounts from "./pages/admin/AdminAutoDiscounts";
import ProductsManagement from "./pages/admin/ProductsManagement";
import CMSManagement from "./pages/admin/CMSManagement";
import ReferralSettings from "./pages/admin/ReferralSettings";
import FinancialStatus from "./pages/admin/FinancialStatus";
import StudentLayout from "./pages/students/StudentLayout";
import Summary from "./pages/students/Summary";
import CabaTest from "./pages/students/CabaTest";
import ExamMetronomeApp from "./pages/students/ExamMetronomeApp";
import Appointments from "./pages/students/Appointments";
import Store from "./pages/student/Store";
import Cart from "./pages/student/Cart";
import Wallet from "./pages/students/Wallet";
import CommunityProfile from "./pages/CommunityProfile";
import Profile from "./pages/students/Profile";
import ChannelRecommendations from "./pages/students/ChannelRecommendations";
import YksTopics from "./pages/students/YksTopics";
import QuestionAnalysis from "./pages/students/QuestionAnalysis";
import YksScoreCalculator from "./pages/students/YksScoreCalculator";
import PublicReportViewer from "./pages/PublicReportViewer";
import JobGuide from "./pages/students/JobGuide";
import YokAtlas from "./pages/students/YokAtlas";
import KykDorms from "./pages/students/KykDorms";
import EbaAcademicSupport from "./pages/students/EbaAcademicSupport";
import MebiPlatform from "./pages/students/MebiPlatform";
import OgmMaterial from "./pages/students/OgmMaterial";
import MebCurriculum from "./pages/students/MebCurriculum";
import Coaching from "./pages/student/Coaching";
import Exams from "./pages/student/Exams";
import ExamAnalysis from "./pages/student/ExamAnalysis";
import Analyses from "./pages/student/Analyses";
import OzAnaliz from "./pages/student/analyses/OzAnaliz";
import AbbaAnaliz from "./pages/student/analyses/AbbaAnaliz";
import AgMotAnaliz from "./pages/student/analyses/AgMotAnaliz";
import HiratAnaliz from "./pages/student/analyses/HiratAnaliz";
import AidYAnaliz from "./pages/student/analyses/AidYAnaliz";
import AdteAnaliz from "./pages/student/analyses/AdteAnaliz";
import AddeAnaliz from "./pages/student/analyses/AddeAnaliz";
import BavoAnaliz from "./pages/student/analyses/BavoAnaliz";
import AdtoAnaliz from "./pages/student/analyses/AdtoAnaliz";
import CdoeAnaliz from "./pages/student/analyses/CdoeAnaliz";
import CikolataAnaliz from "./pages/student/analyses/CikolataAnaliz";
import AmidModulu from "./pages/student/analyses/AmidModulu";
import ApeaAnaliz from "./pages/student/analyses/ApeaAnaliz";
import AsEqAnaliz from "./pages/student/analyses/AsEqAnaliz";
import AyceAnaliz from "./pages/student/analyses/AyceAnaliz";
import AtCmModulu from "./pages/student/analyses/AtCmModulu";
import ApksAnaliz from "./pages/student/analyses/ApksAnaliz";
import AIAssistant from "./pages/students/AIAssistant";
import TercihRobotu from "./pages/students/TercihRobotu";
import AbcteAnaliz from "./pages/student/analyses/AbcteAnaliz";
import Cz8Analiz from "./pages/student/analyses/Cz8Analiz";
import DartAnaliz from "./pages/student/analyses/DartAnaliz";
import DopaAnaliz from "./pages/student/analyses/DopaAnaliz";
import Gts36Analiz from "./pages/student/analyses/Gts36Analiz";
import ImOmAnaliz from "./pages/student/analyses/ImOmAnaliz";
import KeaAnaliz from "./pages/student/analyses/KeaAnaliz";
import KolbAnaliz from "./pages/student/analyses/KolbAnaliz";
import MukemmellikAnaliz from "./pages/student/analyses/MukemmellikAnaliz";
import OtiAnaliz from "./pages/student/analyses/OtiAnaliz";
import MercekAnaliz from "./pages/student/analyses/MercekAnaliz";
import VakAnaliz from "./pages/student/analyses/VakAnaliz";
import SpBeAnaliz from "./pages/student/analyses/SpBeAnaliz";
import ZsOdoAnaliz from "./pages/student/analyses/ZsOdoAnaliz";
import SiGozAnaliz from "./pages/student/analyses/SiGozAnaliz";
import SwDAnaliz from "./pages/student/analyses/SwDAnaliz";
import TLineAnaliz from "./pages/student/analyses/TLineAnaliz";
import Wd3DAnaliz from "./pages/student/analyses/Wd3DAnaliz";
import ToteAnaliz from "./pages/student/analyses/ToteAnaliz";
import VgfEAnaliz from "./pages/student/analyses/VgfEAnaliz";
import SocAAnaliz from "./pages/student/analyses/SocAAnaliz";
import PdarAnaliz from "./pages/student/analyses/PdarAnaliz";
import SsDkmAnaliz from "./pages/student/analyses/SsDkmAnaliz";
import Szp30Analiz from "./pages/student/analyses/Szp30Analiz";
import ZgZpAnaliz from "./pages/student/analyses/ZgZpAnaliz";
import KlsAnaliz from "./pages/student/analyses/KlsAnaliz";
import ScmAnaliz from "./pages/student/analyses/ScmAnaliz";
import SdSyeAnaliz from "./pages/student/analyses/SdSyeAnaliz";
import AnalysisDetail from "./pages/student/AnalysisDetail";
import About from "./pages/About";
import VisionMission from "./pages/VisionMission";
import Staff from "./pages/Staff";
import SuccessStories from "./pages/SuccessStories";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import ComingSoonStudent from "./pages/students/ComingSoonStudent";
import Subscription from "./pages/students/Subscription";
import GoogleDrive from "./pages/admin/GoogleDrive";
import ParentReports from "./pages/parents/ParentReports";
import ParentAppointments from "./pages/parents/ParentAppointments";
import AdminAcademicCalendar from "./pages/admin/AdminAcademicCalendar";
import ParentAcademicCalendar from "./pages/parents/ParentAcademicCalendar";
import CoachDashboard from "./pages/CoachDashboard";
import SchedulePage from "./pages/coach/SchedulePage";
import ParentLayout from "./pages/parents/ParentLayout";
import ParentDashboard from "./pages/parents/ParentDashboard";
import ParentProgram from "./pages/parents/ParentProgram";
import ParentGoals from "./pages/parents/ParentGoals";
import ParentExams from "./pages/parents/ParentExams";
import ParentPersonality from "./pages/parents/ParentPersonality";
import ParentAssistant from "./pages/parents/ParentAssistant";
import ParentSubscription from "./pages/parents/ParentSubscription";
import ParentWallet from "./pages/parents/ParentWallet";
import ProtectedRoute from "./lib/ProtectedRoute";

import CoachScheduleManagement from "./pages/admin/CoachScheduleManagement";
import ExamCountdown from "./pages/ExamCountdown";
import TrialTracking from "./pages/TrialTracking";
import DeepAnalysis from "./pages/DeepAnalysis";
import PersonalityAnalysis from "./pages/PersonalityAnalysis";
import ExamMetronome from "./pages/ExamMetronome";
import ExamProcessTracking from "./pages/ExamProcessTracking";

import CoachLayout from "./pages/coach/CoachLayout";
import StudentSummary from "./pages/coach/StudentSummary";
import StudentAppointments from "./pages/coach/StudentAppointments";
import StudentProgram from "./pages/coach/StudentProgram";
import StudentExams from "./pages/coach/StudentExams";
import StudentProfile from "./pages/coach/StudentProfile";
import StudentGoals from "./pages/coach/StudentGoals";
import CoachPersonality from "./pages/coach/CoachPersonality";
import CoachDeepAnalysis from "./pages/coach/DeepAnalysis";
import StudentAIChats from "./pages/coach/StudentAIChats";
import { StudentProvider } from "./lib/StudentContext";
import PersonalCoachLayout from "./pages/coach/PersonalCoachLayout";
import CoachStudents from "./pages/coach/CoachStudents";
import CoachAppointments from "./pages/coach/CoachAppointments";
import CoachOverallAssessment from "./pages/coach/CoachOverallAssessment";
import CoachProfile from "./pages/coach/CoachProfile";
import CoachWallet from "./pages/coach/CoachWallet";
import AdminEvents from "./pages/admin/AdminEvents";
import StudentEvents from "./pages/student/StudentEvents";
import AdminPrograms from "./pages/admin/AdminPrograms";
import StudentOnlinePrograms from "./pages/student/StudentOnlinePrograms";
import CoachAssistant from "./pages/coach/CoachAssistant";
import StudentExamResults from "./pages/coach/StudentExamResults";

import StudentDataEntry from "./pages/coach/StudentDataEntry";
import StudentWallet from "./pages/coach/StudentWallet";

import CommunityLayout from "./pages/community/CommunityLayout";
import CommunityFeed from "./pages/community/CommunityFeed";
import ComingSoonCommunity from "./pages/community/ComingSoonCommunity";
import { CartProvider } from "./lib/CartContext";
import { CurriculumProvider } from "./lib/CurriculumContext";

import CompleteRegistration from "./pages/CompleteRegistration";
import CoachPendingApproval from "./pages/CoachPendingApproval";
import Verification from "./pages/Verification";
import VerifyWhatsappLink from "./pages/VerifyWhatsappLink";

import SystemSettings from "./pages/admin/SystemSettings";

import AdminResources from "./pages/admin/AdminResources";
import AdminTopics from "./pages/admin/AdminTopics";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminAcademicExams from "./pages/admin/AdminAcademicExams";
import AdminStudentGoals from "./pages/admin/AdminStudentGoals";
import AdminCurriculum from "./pages/admin/AdminCurriculum";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden relative flex flex-col">
      {/* Mesh Gradient Backgrounds */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col flex-1">
        <CurriculumProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">
              <NotificationListener />
              <PageTitleUpdater />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
              <Route path="/kullanim-kosullari" element={<TermsOfService />} />
              <Route path="/auth-action" element={<AuthAction />} />
              <Route path="/giris" element={<Login />} />
              <Route path="/sifremi-unuttum" element={<ForgotPassword />} />
              <Route path="/sinav-geri-sayimi" element={<ExamCountdown />} />
              <Route path="/deneme-takibi" element={<TrialTracking />} />
              <Route path="/derin-deneme-analizi" element={<DeepAnalysis />} />
              <Route
                path="/kisilik-analizleri"
                element={<PersonalityAnalysis />}
              />
              <Route path="/zaman-yonetimi" element={<ExamMetronome />} />
              <Route
                path="/sinav-surec-takibi"
                element={<ExamProcessTracking />}
              />
              <Route path="/hakkimizda" element={<About />} />
              <Route path="/vizyon-misyon" element={<VisionMission />} />
              <Route path="/egitim-kadromuz" element={<Staff />} />
              <Route path="/basarilarimiz" element={<SuccessStories />} />
              <Route path="/sss" element={<FAQ />} />
              <Route path="/iletisim" element={<Contact />} />
              <Route path="/kayit" element={<Register />} />
              <Route path="/koc-basvuru" element={<Register />} />
              <Route path="/kayit-tamamla" element={<CompleteRegistration />} />
              <Route
                path="/koc-onay-bekliyor"
                element={
                  <ProtectedRoute>
                    <CoachPendingApproval />
                  </ProtectedRoute>
                }
              />
              <Route path="/dogrulama" element={<Verification />} />
              <Route path="/v" element={<VerifyWhatsappLink />} />
              <Route path="/rapor/:reportId" element={<PublicReportViewer />} />
              <Route path="/rapor/*" element={<PublicReportViewer />} />
              <Route path="/pdf/:reportId" element={<PublicReportViewer />} />
              <Route path="/pdf/*" element={<PublicReportViewer />} />
              <Route path="/api/reports/pdf/:reportId" element={<PublicReportViewer />} />
              <Route path="/api/reports/pdf/*" element={<PublicReportViewer />} />
              <Route
                path="/kanal-onerileri"
                element={<ChannelRecommendations />}
              />
              <Route path="/yks-konulari" element={<YksTopics />} />
              <Route path="/soru-dagilimi" element={<QuestionAnalysis />} />
              <Route
                path="/yks-puan-hesaplama"
                element={<YksScoreCalculator />}
              />
              <Route path="/meslek-rehberi" element={<JobGuide />} />
              <Route path="/yok-atlas" element={<YokAtlas />} />
              <Route path="/tercih-robotu" element={<TercihRobotu />} />
              <Route
                path="/eba-akademik-destek"
                element={<EbaAcademicSupport />}
              />
              <Route path="/mebi" element={<MebiPlatform />} />
              <Route path="/ogm-materyal" element={<OgmMaterial />} />
              <Route path="/meb-mufredat" element={<MebCurriculum />} />
              <Route path="/kyk-yurtlari" element={<KykDorms />} />
              <Route
                path="/profil"
                element={
                  <ProtectedRoute>
                    <CommunityProfile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Admin */}
              <Route
                path="/panel/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="duyurular" element={<AdminAnnouncements />} />
                <Route path="kullanicilar" element={<UserManagement />} />
                <Route path="hizmetler" element={<ServiceManagement />} />
                <Route path="odalar" element={<RoomManagement />} />
                <Route path="randevular" element={<AppointmentManagement />} />

                {/* Coming Soon Admin Routes */}
                <Route path="gelen-kutusu" element={<AdminInbox />} />
                <Route path="randevu-listesi" element={<AppointmentList />} />
                <Route
                  path="calisma-programi"
                  element={<CoachScheduleManagement />}
                />
                <Route path="randevu-analizi" element={<ComingSoonAdmin />} />
                <Route
                  path="etkinlikler"
                  element={<AdminEvents filterStatus="published" />}
                />
                <Route
                  path="etkinlikler/taslak"
                  element={<AdminEvents filterStatus="draft" />}
                />
                <Route
                  path="etkinlikler/kategoriler"
                  element={<AdminEventCategories />}
                />
                <Route
                  path="etkinlikler/kategori/:categoryId"
                  element={<AdminEvents />}
                />
                <Route path="siparisler" element={<AdminOrders />} />
                <Route path="abonelikler" element={<AdminSubscriptions />} />
                <Route path="mali-durum" element={<FinancialStatus />} />
                <Route path="satis-analizleri" element={<ComingSoonAdmin />} />
                <Route path="sepetler" element={<AdminCarts />} />
                <Route path="kuponlar" element={<AdminCoupons />} />
                <Route path="indirimler" element={<AdminAutoDiscounts />} />
                <Route path="urunler" element={<ProductsManagement />} />
                <Route path="stok" element={<ComingSoonAdmin />} />
                <Route path="urun-kategorileri" element={<ComingSoonAdmin />} />
                <Route
                  path="ucretli-abonelikler"
                  element={<AdminPaidSubscriptions />}
                />
                <Route path="koc-onaylari" element={<AdminCoachApprovals />} />
                <Route path="bursluluk" element={<AdminBursluluk />} />
                <Route
                  path="masa-rezervasyonlari"
                  element={<ComingSoonAdmin />}
                />
                <Route path="programlar" element={<AdminPrograms />} />
                <Route
                  path="program-kategorileri"
                  element={<ComingSoonAdmin />}
                />
                <Route path="blog" element={<ComingSoonAdmin />} />
                <Route path="yazarlar" element={<ComingSoonAdmin />} />
                <Route path="yorumlar" element={<ComingSoonAdmin />} />
                <Route path="videolar" element={<ComingSoonAdmin />} />
                <Route path="dosyalar" element={<GoogleDrive />} />
                <Route path="crm/kisiler" element={<ComingSoonAdmin />} />
                <Route path="crm/formlar" element={<ComingSoonAdmin />} />
                <Route path="crm/toplantilar" element={<ComingSoonAdmin />} />
                <Route path="crm/takip" element={<ComingSoonAdmin />} />
                <Route path="crm/sadakat" element={<ComingSoonAdmin />} />
                <Route path="referans" element={<ReferralSettings />} />
                <Route path="analizler" element={<ComingSoonAdmin />} />
                <Route path="otomasyonlar" element={<ComingSoonAdmin />} />
                <Route path="ayarlar" element={<SystemSettings />} />
                <Route path="sistem-ayarlari" element={<SystemSettings />} />
                <Route path="cms" element={<CMSManagement />} />

                {/* Akademik Araçlar */}
                <Route path="kaynaklar" element={<AdminResources />} />
                <Route path="konular" element={<AdminTopics />} />
                <Route path="sorular" element={<AdminQuestions />} />
                <Route path="akademik-denemeler" element={<AdminAcademicExams />} />
                <Route path="ogrenci-hedefleri" element={<AdminStudentGoals />} />
                <Route path="mufredat" element={<AdminCurriculum />} />
                <Route path="akademik-takvim" element={<AdminAcademicCalendar />} />
              </Route>

              {/* Protected Routes - Students */}
              <Route
                path="/panel/ogrenci"
                element={
                  <ProtectedRoute allowedRoles={["student", "admin"]}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Summary />} />
                <Route path="caba-testi" element={<CabaTest />} />

                {/* Akademik & Eğitim */}
                <Route path="randevular" element={<Appointments />} />
                <Route path="kocluk" element={<Coaching />} />
                <Route
                  path="online-egitimler"
                  element={<StudentOnlinePrograms />}
                />
                <Route path="videolar" element={<ComingSoonStudent />} />
                <Route path="etkinlikler" element={<StudentEvents />} />

                {/* Araçlar & Analiz */}
                <Route path="denemeler" element={<Exams />} />
                <Route
                  path="denemeler/:examId/analiz"
                  element={<ExamAnalysis />}
                />
                <Route path="zaman-yonetimi" element={<ExamMetronomeApp />} />
                <Route path="ai-asistan" element={<AIAssistant />} />
                <Route path="analizler" element={<Analyses />} />
                <Route path="analizler/oz-af" element={<OzAnaliz />} />
                <Route path="analizler/abba" element={<AbbaAnaliz />} />
                <Route path="analizler/ag-mot" element={<AgMotAnaliz />} />
                <Route path="analizler/hirat" element={<HiratAnaliz />} />
                <Route path="analizler/aid-y" element={<AidYAnaliz />} />
                <Route path="analizler/adte-20" element={<AdteAnaliz />} />
                <Route path="analizler/adde" element={<AddeAnaliz />} />
                <Route path="analizler/b-avo" element={<BavoAnaliz />} />
                <Route path="analizler/adt-o" element={<AdtoAnaliz />} />
                <Route path="analizler/cdo-e" element={<CdoeAnaliz />} />
                <Route path="analizler/c-mod" element={<CikolataAnaliz />} />
                <Route path="analizler/amid" element={<AmidModulu />} />
                <Route path="analizler/apea-3d" element={<ApeaAnaliz />} />
                <Route path="analizler/apk-s" element={<ApksAnaliz />} />
                <Route path="analizler/ab-cte" element={<AbcteAnaliz />} />
                <Route path="analizler/aseq" element={<AsEqAnaliz />} />
                <Route path="analizler/ayce" element={<AyceAnaliz />} />
                <Route path="analizler/at-cm" element={<AtCmModulu />} />
                <Route path="analizler/cz-8" element={<Cz8Analiz />} />
                <Route path="analizler/dart" element={<DartAnaliz />} />
                <Route path="analizler/dopa" element={<DopaAnaliz />} />
                <Route path="analizler/gts-36" element={<Gts36Analiz />} />
                <Route path="analizler/im-om" element={<ImOmAnaliz />} />
                <Route path="analizler/k-e-a" element={<KeaAnaliz />} />
                <Route path="analizler/kolb" element={<KolbAnaliz />} />
                <Route
                  path="analizler/mukemmellik"
                  element={<MukemmellikAnaliz />}
                />
                <Route path="analizler/oti" element={<OtiAnaliz />} />
                <Route path="analizler/mercek" element={<MercekAnaliz />} />
                <Route path="analizler/vak-s" element={<VakAnaliz />} />
                <Route path="analizler/sp-be" element={<SpBeAnaliz />} />
                <Route path="analizler/zs-odo" element={<ZsOdoAnaliz />} />
                <Route path="analizler/si-goz" element={<SiGozAnaliz />} />
                <Route path="analizler/sw-d" element={<SwDAnaliz />} />
                <Route path="analizler/t-line" element={<TLineAnaliz />} />
                <Route path="analizler/wd-3d" element={<Wd3DAnaliz />} />
                <Route path="analizler/tote" element={<ToteAnaliz />} />
                <Route path="analizler/vgf-e" element={<VgfEAnaliz />} />
                <Route path="analizler/soc-a" element={<SocAAnaliz />} />
                <Route path="analizler/pdar" element={<PdarAnaliz />} />
                <Route path="analizler/ss-dkm" element={<SsDkmAnaliz />} />
                <Route path="analizler/szp-30" element={<Szp30Analiz />} />
                <Route path="analizler/zg-zp" element={<ZgZpAnaliz />} />
                <Route path="analizler/kls" element={<KlsAnaliz />} />
                <Route path="analizler/scm" element={<ScmAnaliz />} />
                <Route path="analizler/sd-sye" element={<SdSyeAnaliz />} />
                <Route
                  path="analizler/sonuc/:resultId"
                  element={<AnalysisDetail />}
                />
                <Route
                  path="masa-rezervasyonu"
                  element={<ComingSoonStudent />}
                />

                {/* Hesap & Finans */}
                <Route path="magaza" element={<Store />} />
                <Route path="sepet" element={<Cart />} />
                <Route path="cuzdan" element={<Wallet />} />
                <Route path="abonelik" element={<Subscription />} />
                <Route path="profil" element={<Profile />} />
              </Route>

              {/* Protected Routes - Coach */}
              <Route
                path="/panel/koc"
                element={
                  <ProtectedRoute allowedRoles={["coach", "admin"]}>
                    <StudentProvider>
                      <Outlet />
                    </StudentProvider>
                  </ProtectedRoute>
                }
              >
                <Route element={<PersonalCoachLayout />}>
                  <Route index element={<CoachDashboard />} />
                  <Route path="ogrenciler" element={<CoachStudents />} />
                  <Route path="asistan" element={<CoachAssistant />} />
                  <Route path="randevular" element={<CoachAppointments />} />
                  <Route path="musaitlik" element={<SchedulePage />} />
                  <Route
                    path="degerlendirme"
                    element={<CoachOverallAssessment />}
                  />
                  <Route path="profil" element={<CoachProfile />} />
                  <Route path="cuzdan" element={<CoachWallet />} />
                </Route>

                {/* Nested Student Management Layout */}
                <Route path="ogrenci" element={<CoachLayout />}>
                  <Route index element={<StudentSummary />} />
                  <Route path="randevular" element={<StudentAppointments />} />
                  <Route path="program" element={<StudentProgram />} />
                  <Route path="veri-girisi" element={<StudentDataEntry />} />
                  <Route path="sonuclar" element={<StudentExamResults />} />
                  <Route path="analizler" element={<StudentExams />} />
                  <Route path="derin-analiz" element={<CoachDeepAnalysis />} />
                  <Route path="ai-sohbetleri" element={<StudentAIChats />} />
                  <Route path="profil" element={<StudentProfile />} />
                  <Route path="kisilik-analizi" element={<CoachPersonality />} />
                  <Route path="hedefler" element={<StudentGoals />} />
                  <Route path="cuzdan" element={<StudentWallet />} />
                </Route>
              </Route>

              {/* Protected Routes - Parent */}
              <Route
                path="/panel/veli"
                element={
                  <ProtectedRoute allowedRoles={["parent", "admin"]}>
                    <StudentProvider>
                      <ParentLayout />
                    </StudentProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<ParentDashboard />} />

                {/* Akademik & Eğitim */}
                <Route path="randevular" element={<ParentAppointments />} />
                <Route path="program" element={<ParentProgram />} />
                <Route path="hedefler" element={<ParentGoals />} />
                <Route path="akademik-takvim" element={<ParentAcademicCalendar />} />

                {/* Gelişim & Analiz */}
                <Route path="deneme-sonuclari" element={<ParentExams />} />
                <Route path="kisilik-analizi" element={<ParentPersonality />} />
                <Route path="asistan" element={<ParentAssistant />} />
                <Route path="raporlar" element={<ParentReports />} />

                {/* Kurumsal & Finans */}
                <Route path="abonelikler" element={<ParentSubscription />} />
                <Route path="cuzdan" element={<ParentWallet />} />
              </Route>

              {/* Topluluk Routes */}
              <Route
                path="/topluluk"
                element={
                  <ProtectedRoute>
                    <CommunityLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CommunityFeed />} />
                <Route path="blog" element={<ComingSoonCommunity />} />
                <Route path="gruplar" element={<ComingSoonCommunity />} />
                <Route path="forum" element={<ComingSoonCommunity />} />
                <Route path="dosyalar" element={<ComingSoonCommunity />} />
                <Route path="sampiyonlar" element={<ComingSoonCommunity />} />
                <Route path="denemeler" element={<ComingSoonCommunity />} />
                <Route path="profil" element={<ComingSoonCommunity />} />
              </Route>

              <Route
                path="/panel/koc/veri-girisi"
                element={
                  <Navigate to="/panel/koc/ogrenci/veri-girisi" replace />
                }
              />
            </Routes>
          </main>
            <Footer />
            <CookieConsent />
          </CartProvider>
        </CurriculumProvider>
      </div>
    </div>
  );
}
