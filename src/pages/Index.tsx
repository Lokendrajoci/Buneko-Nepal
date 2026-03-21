import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { WhyBuneko } from '@/components/home/WhyBuneko';
import { Categories } from '@/components/home/Categories';
import { Testimonials } from '@/components/home/Testimonials';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroCarousel />
      <FeaturedProducts />
      <WhyBuneko />
      <Categories />
      <Testimonials />
      <CTASection />
    </Layout>
  );
};

export default Index;
