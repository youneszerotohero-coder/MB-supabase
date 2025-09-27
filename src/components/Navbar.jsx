import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`fixed top-0 z-40 w-full border-b border-neutral-200/70 bg-white/80 backdrop-blur ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className={`mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Logo */}
        <div className="flex-shrink-0">
          <a href="/">
            <img 
              src="./public/images/MBlogo1.png" 
              alt="logo"
              className="h-8 w-auto sm:h-9" 
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden gap-6 md:flex lg:gap-8">
          <Link to="/products" className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 lg:text-base">
            {t('navbar.products')}
          </Link>
          <a href="#contact" className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 lg:text-base">
            {t('navbar.contact')}
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex lg:gap-4">
          <LanguageSwitcher />
          <button 
            aria-label={t('navbar.search')} 
            className="rounded-md p-2 transition-colors hover:bg-neutral-100 hover:opacity-80"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button 
            aria-label={t('navbar.search')} 
            className="rounded-md p-2 transition-colors hover:bg-neutral-100"
          >
            <Search className="h-5 w-5" />
          </button>
          <button 
            aria-label={t('navbar.menu')}
            onClick={toggleMobileMenu}
            className="rounded-md p-2 transition-colors hover:bg-neutral-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-neutral-200/70 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-4">
              <Link 
                to="/products" 
                className="text-base font-medium text-neutral-700 transition-colors hover:text-neutral-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navbar.products')}
              </Link>
              <a 
                href="#contact" 
                className="text-base font-medium text-neutral-700 transition-colors hover:text-neutral-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navbar.contact')}
              </a>
            </nav>
            
            {/* Mobile Action Buttons */}
            <div className="mt-6 flex items-center gap-4 border-t border-neutral-200/50 pt-4">
              <button 
                aria-label={t('navbar.account')} 
                className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <User className="h-4 w-4" />
                {t('navbar.account')}
              </button>
              <button 
                aria-label={t('navbar.cart')} 
                className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <ShoppingBag className="h-4 w-4" />
                {t('navbar.cart')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}