import { motion } from "framer-motion";
import {Star} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "../../../public/images/heroImage.jpg";
import ProductCard from "../../components/productCard";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORIES = [
  {
    title: "Totes",
    image:
      "https://i.pinimg.com/1200x/6d/bc/7c/6dbc7cd5456d94c6e94ecec9d332ed66.jpg",
  },
  {
    title: "Crossbody",
    image:
      "https://i.pinimg.com/1200x/1a/b8/c4/1ab8c4c19820f0df6f1f64c652ac73d6.jpg",
  },
  {
    title: "Backpacks",
    image:
      "https://i.pinimg.com/1200x/28/72/26/2872264b27a803bdcf7444abc454bce0.jpg",
  },
  {
    title: "Clutches",
    image:
      "https://i.pinimg.com/1200x/11/4a/00/114a00d9ec89994a20cfcbc0233f1116.jpg",
  },
];

const PRODUCTS = [
  {
    id: 1,
    name: "Capri Leather Tote",
    price: 189.0,
    image:
      "https://i.pinimg.com/736x/63/2f/da/632fdade106f8b33cce0e935981e60c6.jpg",
  },
  {
    id: 2,
    name: "Soho Crossbody Mini",
    price: 129.0,
    image:
      "https://i.pinimg.com/1200x/72/ac/f8/72acf804eafc84f86d73c409a0bf7478.jpg",
  },
  {
    id: 3,
    name: "Montreux Daypack",
    price: 159.0,
    image:
      "https://i.pinimg.com/1200x/3e/82/8f/3e828f5d730c60e48ba7ac580ebcbf74.jpg",
  },
  {
    id: 4,
    name: "Aurora Evening Clutch",
    price: 149.0,
    image:
      "https://i.pinimg.com/736x/fb/8e/bb/fb8ebb6ccd2b9dbed481ff497758ebe8.jpg",
  },
];

const TESTIMONIALS = [
  {
    name: "Salma K.",
    quote:
      "The quality is unmatched — my Mouad tote is my daily essential.",
    rating: 5,
  },
  {
    name: "Amine R.",
    quote:
      "Elegant and practical. I get compliments everywhere I go.",
    rating: 5,
  },
  {
    name: "Lina B.",
    quote: "Worth every cent. True luxury that lasts.",
    rating: 5,
  },
];

export default function MouadBoutiqueLanding() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`mt-10 min-h-screen bg-white text-neutral-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto grid min-h-[70vh] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-center font-serif text-5xl font-bold text-[#C8B28D] sm:text-6xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 text-center text-neutral-700 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button className="rounded-2xl bg-[#C8B28D] px-6 py-3 text-sm font-medium text-white hover:bg-[#B89E72]">
                {t('home.shopNow')}
              </Button>
              <Button variant="outline" className="rounded-2xl border border-[#C8B28D] px-6 py-3 text-sm font-medium text-[#C8B28D] hover:bg-[#F8F5F0]">
                {t('home.exploreCategories')}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            <div className="relative mx-auto aspect-[5/5] w-4/5 overflow-hidden rounded-3xl shadow-2xl md:w-[80%]">
              <img
                src={heroImage}
                alt="Mouad Boutique premium leather bag"
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>
      {/* categories */}
      <section id="categories" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{t('home.shopByCategory')}</h2>
            <p className="mt-3 text-neutral-600">{t('home.categoryDescription')}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat, i) => (
              <motion.a
                key={cat.title}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-neutral-200/70"
              >
                <img src={cat.image} alt={cat.title} className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-neutral-900 backdrop-blur">
                  {cat.title}
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
      {/* bestsellers */}
      <section id="bestsellers" className="bg-neutral-50 py-16 ">
        <div className="mx-auto max-w-7xl px-6 lg:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{t('home.bestsellers')}</h2>
            <p className="mt-3 text-neutral-600">{t('home.bestsellersDescription')}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <ProductCard image={p.image} name={p.name} price={p.price} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{t('home.testimonials')}</h2>
            <p className="mt-3 text-neutral-600">{t('home.testimonialsDescription')}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-3xl border border-neutral-200/70 p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-[#C8B28D] text-[#C8B28D]" />
                  ))}
                </div>
                <p className="text-neutral-700">“{t.quote}”</p>
                <p className="mt-4 text-sm font-medium text-neutral-900">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}