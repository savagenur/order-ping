import AboutNavbar from '../components/about/AboutNavbar';
import HeroSection from '../components/about/HeroSection';
import ProblemSection from '../components/about/ProblemSection';
import SolutionSection from '../components/about/SolutionSection';
import PortlandSection from '../components/about/PortlandSection';
import FinalCTA from '../components/about/FinalCTA';

export default function About() {
  const scrollToContact = () => {
    const element = document.getElementById('final-cta');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      <AboutNavbar scrollToContact={scrollToContact} />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <PortlandSection />
      <FinalCTA />
    </div>
  );
}
