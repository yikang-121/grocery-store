"use client";
import React from "react";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaTruck, FaLeaf, FaUsers, FaAward } from "react-icons/fa";

export default function AboutPage() {
  return (
    <main className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About VGrocery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted partner for fresh, high-quality groceries delivered right to your doorstep. 
            We're committed to bringing you the best local and imported products with exceptional service.
          </p>
        </div>

                 {/* Store Information Grid */}
         <div id="location" className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Store Details */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Store Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Main Store Location</h3>
                  <p className="text-gray-600">
                    123 Fresh Market Street<br />
                    Kuala Lumpur, 50000<br />
                    Malaysia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FaPhone className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Number</h3>
                  <p className="text-gray-600">+60 3-1234 5678</p>
                  <p className="text-gray-600">+60 12-345 6789 (WhatsApp)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FaEnvelope className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Email Address</h3>
                  <p className="text-gray-600">info@vgrocery.com</p>
                  <p className="text-gray-600">support@vgrocery.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FaClock className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Operating Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 8:00 AM - 10:00 PM<br />
                    Saturday - Sunday: 9:00 AM - 9:00 PM<br />
                    <span className="text-green-600 font-medium">Online orders: 24/7</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map/Image Placeholder */}
          <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
            <div className="text-center">
              <FaMapMarkerAlt className="text-green-600 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h3>
              <p className="text-gray-600 mb-4">Find our store location</p>
              <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">
                View on Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* Company Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose VGrocery?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <FaLeaf className="text-green-600 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fresh & Quality</h3>
              <p className="text-gray-600">
                We source only the freshest produce and highest quality products from trusted suppliers. 
                Every item is carefully selected to meet our strict quality standards.
              </p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <FaTruck className="text-blue-600 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
              <p className="text-gray-600">
                Same-day delivery available for orders placed before 2 PM. 
                Free delivery for orders above RM50. Your groceries delivered fresh and on time.
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <FaUsers className="text-purple-600 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer First</h3>
              <p className="text-gray-600">
                Exceptional customer service is our priority. Our friendly team is always ready to help 
                with your orders and ensure your complete satisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Company Story */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                Founded in 2020, VGrocery started with a simple mission: to make fresh, quality groceries 
                accessible to everyone in Kuala Lumpur. What began as a small local store has grown into 
                a trusted name in online grocery shopping.
              </p>
              <p className="text-gray-700 mb-4">
                We believe that everyone deserves access to fresh, healthy food without the hassle of 
                visiting multiple stores. Our commitment to quality, convenience, and customer service 
                has made us a favorite among families and individuals alike.
              </p>
              <p className="text-gray-700">
                Today, we serve thousands of customers across the Klang Valley, delivering not just groceries, 
                but peace of mind knowing that every product meets our high standards.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <FaAward className="text-green-600 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Award Winning Service</h3>
                <p className="text-gray-600">Recognized for excellence in customer service and product quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Areas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Delivery Areas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Kuala Lumpur</h3>
              <p className="text-gray-600 text-sm">Free delivery for orders above RM30</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Petaling Jaya</h3>
              <p className="text-gray-600 text-sm">Free delivery for orders above RM40</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Subang Jaya</h3>
              <p className="text-gray-600 text-sm">Free delivery for orders above RM45</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Shah Alam</h3>
              <p className="text-gray-600 text-sm">Free delivery for orders above RM50</p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-green-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
          <p className="text-green-100 mb-6">
            Our customer service team is here to help you with any questions about our products, 
            delivery, or services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-6 py-3 rounded font-semibold hover:bg-gray-100 transition">
              Contact Us
            </button>
            <button className="border border-white text-white px-6 py-3 rounded font-semibold hover:bg-green-700 transition">
              View FAQ
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
