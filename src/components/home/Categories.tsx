import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flower, Home, Gift } from 'lucide-react';

const categories = [
  {
    name: 'Bouquets',
    description: 'Beautiful handcrafted flower arrangements for every occasion',
    icon: Flower,
    color: 'bg-rose/10 text-rose',
  },
  {
    name: 'Home Decor',
    description: 'Elegant floral pieces to beautify your living spaces',
    icon: Home,
    color: 'bg-accent/10 text-accent',
  },
  {
    name: 'Gifts',
    description: 'Thoughtful floral gifts that express love and care',
    icon: Gift,
    color: 'bg-gold/10 text-gold',
  },
];

export const Categories = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Browse
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Shop by Category
          </h2>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to="/services" className="block group">
                <div className="bg-card rounded-3xl p-8 shadow-soft card-hover text-center">
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${category.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <category.icon className="h-10 w-10" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
