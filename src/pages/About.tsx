import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Heart, Leaf, Users, Target, Eye } from 'lucide-react';

import heroFlowers3 from '@/assets/hero-flowers-3.jpg';

const About = () => {
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
              Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-6">
              About Buneko Nepal
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We are passionate about bringing the beauty of handcrafted flowers 
              to homes and events across Nepal and beyond, while supporting local 
              artisan communities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={heroFlowers3}
                alt="Artisan crafting flowers"
                className="rounded-3xl shadow-elevated w-full h-[500px] object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Our Journey
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                The Story of Buneko Nepal
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Buneko Nepal was born from a simple yet profound idea: to celebrate 
                  the rich tradition of Nepali craftsmanship while creating sustainable 
                  livelihoods for local artisans.
                </p>
                <p>
                  Our founder, inspired by the intricate handmade flower arrangements 
                  found in Nepali temples and homes, envisioned a brand that could share 
                  this beauty with the world while staying true to its roots.
                </p>
                <p>
                  Today, we work with over 50 skilled artisans across Nepal, each bringing 
                  their unique touch to every creation. Our flowers are not just decorations; 
                  they are stories of tradition, love, and community.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-3xl p-8 shadow-soft"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To bring the beauty and artistry of handmade Nepali flowers to every 
                home and celebration, while creating sustainable livelihoods for local 
                artisans and preserving traditional craftsmanship.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card rounded-3xl p-8 shadow-soft"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Our Vision
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To become Nepal's most trusted name in handcrafted floral artistry, 
                recognized globally for our commitment to quality, sustainability, 
                and community empowerment.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              What Drives Us
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Our Core Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Artisan Support',
                description:
                  'We work directly with local artisans, ensuring fair wages and sustainable employment opportunities.',
              },
              {
                icon: Leaf,
                title: 'Sustainability',
                description:
                  'Our materials are eco-friendly and sourced responsibly, minimizing our environmental impact.',
              },
              {
                icon: Users,
                title: 'Community',
                description:
                  'We believe in building strong relationships with our artisans, customers, and partners.',
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
