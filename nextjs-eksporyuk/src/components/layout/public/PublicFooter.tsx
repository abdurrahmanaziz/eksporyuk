'use client'

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          
          {/* About Section */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4">Ekspor Yuk</h3>
            <p className="text-sm text-gray-400">
              Platform komunitas dan membership untuk belajar bisnis ekspor dari nol hingga mahir.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4">Navigasi</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Beranda</Link></li>
              <li><Link href="/join-partner" className="hover:text-blue-400 transition-colors">Join Affiliate</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
              <li><Link href="/#faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4">Kontak</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://wa.me/6285719125758" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Admin: 0857-1912-5758</a></li>
              <li><a href="mailto:rich@eksporyuk.com" className="hover:text-blue-400 transition-colors">rich@eksporyuk.com</a></li>
              <li>Sukabumi, Jawa Barat, Indonesia</li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4">Ikuti Kami</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Ekspor Yuk. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
