import Bg from "../../components/bg"
import Navbar from "../../components/navbar"
import Footer from "../../components/Footer";
import UseCases from "../../components/UseCases";
import Features from "../../components/Features";
import HowItWorks from "../../components/HowItWorks";
import Hero from "../../components/Hero";
import CTA from "../../components/CTA";
import '../../components/variables.css';
import '../../components/global.css';

function HomePage() {
  return (
    <Bg>
      <Navbar />
     
      <Hero />
      

      <Features />
      <HowItWorks />
      <UseCases />
      <CTA />

      <Footer />
    </Bg>
  )
}

export default HomePage
