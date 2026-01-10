'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface BrandingSettings {
  logoAffiliate: string | null;
  brandColor: string | null;
}

export function PublicHeader() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const brandColor = settings?.brandColor || '#2563eb'; // Default to a strong blue

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '#benefits', label: 'Keuntungan' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-10 h-10 bg-gray-700 rounded-md animate-pulse"></div>
          ) : settings?.logoAffiliate ? (
            <img src={settings.logoAffiliate} alt="Affiliate Logo" className="h-10 object-contain" />
          ) : (
             <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-lg">EY</div>
          )}
          <span className="text-xl font-bold hidden sm:inline">Ekspor Yuk</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/login" passHref>
            <Button style={{ backgroundColor: brandColor }} className="text-white font-semibold hover:opacity-90 transition-opacity">
              Login
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 pb-4">
          <nav className="flex flex-col items-center gap-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" passHref>
              <Button style={{ backgroundColor: brandColor }} className="text-white font-semibold w-full mt-2">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
