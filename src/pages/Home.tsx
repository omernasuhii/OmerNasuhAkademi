import Hero from '../components/home/Hero';
import AboutTeacher from '../components/home/AboutTeacher';
import AIAssistantSection from '../components/home/AIAssistantSection';
import ActivitiesOverview from '../components/home/ActivitiesOverview';
import Services from '../components/home/Services';
import CoachSection from '../components/home/CoachSection';
import Programs from '../components/home/Programs';
import Community from '../components/home/Community';
import Pricing from '../components/home/Pricing';

export default function Home() {
  return (
    <>
      <Hero />
      <AboutTeacher />
      <AIAssistantSection />
      <Services />
      <CoachSection />
      <ActivitiesOverview />
      <Programs />
      <Community />
      <Pricing />
    </>
  );
}
