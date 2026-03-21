import { motion } from 'framer-motion';
import { Heart, Leaf, Users, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Handmade with Love',
    description:
      'Each flower is carefully crafted by hand, ensuring unique and beautiful pieces.',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly',
    description:
      'We use sustainable materials and eco-friendly practices in all our creations.',
  },
  {
    icon: Users,
    title: 'Local Artisans',
    description:
      'Supporting Nepali communities by working directly with skilled local craftspeople.',
  },
  {
    icon: Sparkles,
    title: 'Premium Quality',
    description:
      'Long-lasting beauty with meticulous attention to detail in every arrangement.',
  },
];

export const WhyBuneko = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Why Choose Us
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Why Buneko Nepal?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We bring together traditional Nepali craftsmanship with modern design 
            to create extraordinary floral experiences.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
