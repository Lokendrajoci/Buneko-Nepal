import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Flower, Heart, Building2, Package, Palette, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: Flower,
    title: 'Custom Flower Orders',
    description:
      'Create your perfect arrangement with our bespoke flower service. Tell us your vision, and our artisans will bring it to life.',
    features: ['Personalized designs', 'Color matching', 'Size customization', 'Special occasion themes'],
  },
  {
    icon: Heart,
    title: 'Event & Wedding Decor',
    description:
      'Make your special day unforgettable with our stunning handcrafted floral decorations designed for weddings and events.',
    features: ['Venue decoration', 'Bridal bouquets', 'Centerpieces', 'Photo backdrops'],
  },
  {
    icon: Building2,
    title: 'Corporate Gifting',
    description:
      'Impress clients and employees with elegant floral arrangements. Perfect for offices, conferences, and corporate events.',
    features: ['Bulk orders', 'Branded packaging', 'Regular deliveries', 'Corporate discounts'],
  },
  {
    icon: Package,
    title: 'Bulk Orders',
    description:
      'Large-scale orders for retailers, event planners, and businesses. Enjoy competitive pricing and reliable delivery.',
    features: ['Wholesale pricing', 'Flexible quantities', 'Regular supply', 'Quality consistency'],
  },
  {
    icon: Palette,
    title: 'Home Decoration',
    description:
      'Transform your living space with beautiful handmade floral pieces that add warmth and elegance to any room.',
    features: ['Table arrangements', 'Wall decor', 'Seasonal themes', 'Long-lasting beauty'],
  },
  {
    icon: Calendar,
    title: 'Subscription Service',
    description:
      'Never run out of fresh floral beauty. Our subscription service delivers handcrafted arrangements to your door.',
    features: ['Weekly/monthly options', 'Flexible scheduling', 'Curated selections', 'Special member pricing'],
  },
];

const Services = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              What We Offer
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-6">
              Our Services
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From custom bouquets to grand wedding decorations, we offer a range of 
              services to meet all your floral needs with artisanal quality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-3xl p-8 shadow-soft card-hover"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Contact us today to discuss your requirements and let us create 
              something beautiful for you.
            </p>
            <Link to="/contact">
              <Button
                size="xl"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Contact Us Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
