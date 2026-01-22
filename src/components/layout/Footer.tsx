import React from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaStore } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <FaStore size={24} className="text-black" />
              <span className="font-bold text-2xl text-black tracking-tight">
                VGROCERY
              </span>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-md">
              Premium quality groceries delivered to your door. Smart inventory management for the freshest products.
            </p>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                <strong className="text-black">Address:</strong><br />
                D-1-5, Sunway Nexis, No. 1, Jalan PJU 5/1,<br />
                Kota Damansara, 47810 Petaling Jaya,<br />
                Selangor
              </p>
              <p className="text-gray-600">
                <strong className="text-black">Tel:</strong> +603 6143 1366
              </p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-black p-3 border border-gray-300 rounded-full hover:border-black transition-all duration-300">
                <FaFacebookF size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-black p-3 border border-gray-300 rounded-full hover:border-black transition-all duration-300">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-black p-3 border border-gray-300 rounded-full hover:border-black transition-all duration-300">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-black p-3 border border-gray-300 rounded-full hover:border-black transition-all duration-300">
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Our Supermarket */}
          <div>
            <h3 className="font-bold text-lg text-black mb-6 uppercase tracking-wide">
              Our Supermarket
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  What's In Store
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-bold text-lg text-black mb-6 uppercase tracking-wide">
              Help
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about#location" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Locate Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors duration-200 uppercase text-sm tracking-wide">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm text-center md:text-left">
              Copyright © 2024. VGrocery Sdn. Bhd. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-gray-500 hover:text-black transition-colors duration-200 uppercase tracking-wide">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-500 hover:text-black transition-colors duration-200 uppercase tracking-wide">
                Terms & Conditions
              </Link>
              <Link href="#" className="text-gray-500 hover:text-black transition-colors duration-200 uppercase tracking-wide">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 