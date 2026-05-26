import Hero from '../components/home/Hero';
import AboutTeacher from '../components/home/AboutTeacher';
import AIAssistantSection from '../components/home/AIAssistantSection';
import ActivitiesOverview from '../components/home/ActivitiesOverview';
import Services from '../components/home/Services';
import Programs from '../components/home/Programs';
import Community from '../components/home/Community';
import Events from '../components/home/Events';
import Pricing from '../components/home/Pricing';
import GiftCard from '../components/home/GiftCard';

export default function Home() {
  return (
    <>
      <Hero />
      <AboutTeacher />
      <AIAssistantSection />
      <Services />
      <ActivitiesOverview />
      <Programs />
      <Community />
      <Events />
      <Pricing />
      <GiftCard />
    </>
  );
}
