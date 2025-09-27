import { Star, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#F8F5F0] text-neutral-800" id="contact">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif font-bold text-[#C8B28D] mb-4">
              Mouad Boutique
            </h3>
            <p className="text-neutral-700 mb-6 leading-relaxed">
              Crafting timeless elegance through premium handbags that complement your lifestyle and express your unique style.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="p-2 rounded-full border border-neutral-300 hover:bg-[#C8B28D] hover:text-white transition"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full border border-neutral-300 hover:bg-[#C8B28D] hover:text-white transition"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full border border-neutral-300 hover:bg-[#C8B28D] hover:text-white transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:ml-12">
            <h4 className="font-serif text-lg font-semibold text-[#C8B28D] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#shop" className="hover:text-[#C8B28D] transition">
                  Shop
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-[#C8B28D] transition">
                  Collections
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#C8B28D] transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#C8B28D] transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#C8B28D] transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#C8B28D] mb-4">
              Customer Service
            </h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#C8B28D] transition">Shipping Info</a></li>
              <li><a href="#" className="hover:text-[#C8B28D] transition">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-[#C8B28D] transition">Size Guide</a></li>
              <li><a href="#" className="hover:text-[#C8B28D] transition">Care Instructions</a></li>
              <li><a href="#" className="hover:text-[#C8B28D] transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-[#C8B28D] mb-4">
              Get in Touch
            </h4>
            <div className="space-y-4 text-neutral-700">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#C8B28D]" />
                <span>hello@mouadboutique.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#C8B28D]" />
                <span>06 97 13 37 15</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-[#C8B28D]" />
                <span>alger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-300 mt-12 pt-8 text-center">
          <p className="text-sm text-neutral-600">
            ©2025 Mouad Boutique. All rights reserved. |{" "}
            <a href="#" className="hover:text-[#C8B28D] transition">Terms of Service</a> |{" "}
            <a href="#" className="hover:text-[#C8B28D] transition">Privacy Policy</a>
          </p>
        </div>
      </section>
    </footer>
  );
}
