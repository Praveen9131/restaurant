import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { menuAPI, inquiryAPI } from '../../services/api';
import MenuCard from '../../components/customer/MenuCard';

const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const response = await menuAPI.getAll(); // Show all items including unavailable
        // Get first 6 items as featured
        setFeaturedItems(response.data.menu_items?.slice(0, 6) || []);
      } catch (error) {
        console.error('Error fetching featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  // Contact form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setFormError('');
    setFormSuccess(false);
    setFormLoading(true);

    try {
      const response = await inquiryAPI.create(formData);
      if (response.data.success) {
        setFormSuccess(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
        // Hide success message after 5 seconds
        setTimeout(() => {
          setFormSuccess(false);
        }, 5000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Chef Baking Video */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video - Desktop & Tablet Only */}
        <video 
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/Chef_Baking_Video_Prompt.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Background Image - Mobile Only (Better Performance) */}
        <div 
          className="md:hidden absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/hero-background.jpg')`
          }}
        ></div>
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/75 via-gray-800/65 to-gray-900/75"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Orange Banner */}
            <div className="inline-block bg-orange-500 text-white px-6 py-3 rounded-full text-sm font-display font-semibold mb-8 tracking-wide">
              Live Baking Experience Since 2019
            </div>
            
            {/* Main Heading */}
            <h1 className="font-display font-bold mb-8 leading-tight">
              <span className="block text-white mb-2">Artisan Baked</span>
              <span className="block text-orange-500">Fresh Daily</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-sans">
              Step into SeaSide Live Bake Studio and witness the artistry of traditional baking. 
              From handcrafted sourdough to decadent pastries, every creation tells a story of 
              passion, quality, and the finest ingredients.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link to="/menu" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105">
                Explore Our Menu
              </Link>
              <Link to="/contact" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-4 px-8 rounded-lg transition-all duration-300 text-lg">
                Order via WhatsApp
              </Link>
            </div>
            
            {/* Statistics Section */}
            <div className="border-t border-orange-500/30 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="relative">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-orange-500 mb-2 tracking-tight">500+</div>
                  <div className="text-white text-sm md:text-base font-display font-semibold tracking-wide uppercase">Happy Customers</div>
                  <div className="absolute -right-4 top-0 w-px h-full bg-orange-500/30 hidden md:block"></div>
                </div>
                <div className="relative">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-orange-500 mb-2 tracking-tight">50+</div>
                  <div className="text-white text-sm md:text-base font-display font-semibold tracking-wide uppercase">Artisan Products</div>
                  <div className="absolute -right-4 top-0 w-px h-full bg-orange-500/30 hidden md:block"></div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-orange-500 mb-2 tracking-tight">5+</div>
                  <div className="text-white text-sm md:text-base font-display font-semibold tracking-wide uppercase">Years Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Creations Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            {/* Orange Banner */}
            <div className="inline-block bg-orange-100 text-orange-800 px-6 py-2 rounded-full text-sm font-display font-semibold mb-6 tracking-wide uppercase">
              Featured Menu
            </div>
            
            {/* Main Heading */}
            <h2 className="font-display font-bold mb-6 leading-tight">
              <span className="block text-gray-800 mb-2">Our Signature</span>
              <span className="block text-orange-500 relative">
                Creations
                <div className="absolute bottom-2 left-0 w-full h-1 bg-orange-500/30 rounded-full"></div>
              </span>
            </h2>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-sans">
              Each product is a masterpiece, carefully crafted by our skilled bakers using time-honored 
              techniques and the finest locally sourced ingredients. Experience the perfect blend of 
              tradition and innovation.
            </p>
          </div>
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Signature Cakes */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative">
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Popular
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white border-2 border-amber-800 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Signature Cakes
                    </span>
                  </div>
                  {/* Professional Cake Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Artisan Breads */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-square bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center relative">
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      New
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white border-2 border-amber-800 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Artisan Breads
                    </span>
                  </div>
                  {/* Professional Bread Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cupcakes */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center relative">
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Popular
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white border-2 border-amber-800 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Cupcakes
                    </span>
                  </div>
                  {/* Professional Cupcake Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 3.84L10.5 9l1.5 1.16L13.5 9 12 5.84z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Special Orders */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                  <div className="absolute top-4 right-4">
                    <span className="bg-white border-2 border-amber-800 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Special Orders
                    </span>
                  </div>
                  {/* Professional Special Orders Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 2.5L9.5 9l2.5 1.93L14.5 9 12 4.5z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">Why Choose SeaSide Bake?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another bakery - we're your gateway to the finest live baking experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Lightning Fast</h3>
              <p className="text-gray-600 text-lg">Get your fresh-baked delights delivered in under 30 minutes</p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🌱</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Premium Quality</h3>
              <p className="text-gray-600 text-lg">Only the finest ingredients go into our live-baked creations</p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Free Delivery</h3>
              <p className="text-gray-600 text-lg">Free delivery on orders above ₹199 across the city</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-display font-semibold tracking-wide">
                  OUR STORY
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 leading-tight">
                  Where Tradition Meets <span className="text-orange-500">Culinary Innovation</span>
                </h2>
              </div>

              {/* Description */}
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed font-sans">
                  Founded in 2019, SeaSide Live Bake Studio emerged from a simple yet powerful vision: to bring 
                  the magic of traditional baking to the heart of Cuddalore. Our founder, a third-generation 
                  baker, wanted to create a space where customers could witness the artistry of baking in real-time.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed font-sans">
                  Today, we stand as a testament to the perfect fusion of heritage and innovation. Every loaf 
                  of bread, every decadent pastry, and every custom cake tells a story of passion, quality, 
                  and the unwavering commitment to excellence that defines our craft.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Baking Theater */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-gray-800 mb-2">Live Baking Theater</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">Watch master bakers craft your favorites in our open kitchen concept</p>
                    </div>
                  </div>
                </div>

                {/* Premium Ingredients */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-gray-800 mb-2">Premium Ingredients</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">Organic flour, fresh dairy, and locally sourced seasonal ingredients</p>
                    </div>
                  </div>
                </div>

                {/* Heritage Recipes */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-gray-800 mb-2">Heritage Recipes</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">Time-honored techniques passed down through generations of artisans</p>
                    </div>
                  </div>
                </div>

                {/* Award Recognition */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-gray-800 mb-2">Award Recognition</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">Tamil Nadu's Best Bakery 2023 - Excellence in taste and innovation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="pt-4">
                <Link to="/about" className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                  </svg>
                  Visit Our Live Baking Studio
                </Link>
              </div>
            </div>

            {/* Right Column - Image Display */}
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div 
                  className="aspect-[4/5] bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/hero-background.jpg')`
                  }}
                ></div>
                
                {/* Established Badge */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-display font-bold text-gray-800">2019 ESTABLISHED</span>
                </div>
                
                {/* Happy Families Badge */}
                <div className="absolute bottom-6 right-6 bg-orange-500 text-white rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-display font-bold">500+ HAPPY FAMILIES</span>
                </div>
              </div>

              {/* Small Cake Image Overlay */}
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden transform rotate-12 hover:rotate-6 transition-transform duration-300">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/logo.jpg')`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Featured Dishes</h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link to="/menu" className="btn-primary inline-block text-lg">
                  View Full Menu
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-display font-semibold tracking-wide">
                Customer Reviews
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800">
                What Our Customers Say
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-sans">
                Don't just take our word for it. Here's what our valued customers have to say about their 
                SeaSide Live Bake Studio experience.
              </p>
            </div>
          </div>

          {/* Customer Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Review 1 - Priya Sharma */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Priya Sharma</h3>
                  <p className="text-gray-600 text-sm">Cuddalore</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "The chocolate fudge cake from SeaSide Live Bake Studio made my daughter's birthday absolutely perfect! 
                The live baking experience is amazing to watch."
              </p>
            </div>

            {/* Review 2 - Rajesh Kumar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Rajesh Kumar</h3>
                  <p className="text-gray-600 text-sm">Pondicherry</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "I drive 30 minutes just for their French croissants. The quality and freshness is unmatched. 
                Best bakery in the region!"
              </p>
            </div>

            {/* Review 3 - Anita Devi */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Anita Devi</h3>
                  <p className="text-gray-600 text-sm">Cuddalore</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "Their artisan sourdough is incredible! The staff is so friendly and the WhatsApp ordering 
                makes it super convenient."
              </p>
            </div>

            {/* Review 4 - Suresh Babu */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Suresh Babu</h3>
                  <p className="text-gray-600 text-sm">Villupuram</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "Ordered a custom cake for our anniversary. The attention to detail and taste exceeded our 
                expectations. Highly recommended!"
              </p>
            </div>

            {/* Review 5 - Meera Krishnan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Meera Krishnan</h3>
                  <p className="text-gray-600 text-sm">Cuddalore</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "The live baking concept is so unique! My kids love watching the bakers work while we wait 
                for our order. Great family experience."
              </p>
            </div>

            {/* Review 6 - Vikram Patel */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-800">Vikram Patel</h3>
                  <p className="text-gray-600 text-sm">Chennai</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-sans">
                "Stumbled upon this gem during a visit to Cuddalore. The rainbow cupcakes are a work of art 
                and taste even better than they look!"
              </p>
            </div>
          </div>

          {/* Overall Rating Footer */}
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-orange-50 to-orange-100 rounded-full px-6 py-3 border border-orange-200">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
              </svg>
              <span className="text-lg font-display font-bold text-gray-800">
                4.9/5 average rating from 200+ reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-display font-semibold mb-6 tracking-wide">
                Get In Touch
              </div>
              <h2 className="font-display font-bold text-gray-800 mb-4">
                Contact Us
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-sans leading-relaxed">
                Have questions about our products or want to place a custom order? We'd love to hear from you!
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-6">
                {/* Visit Our Studio */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-gray-800">Visit Our Studio</h3>
                  </div>
                  <p className="text-gray-600 text-base font-sans leading-relaxed">
                    39, Main Road, Vannarapalayam,<br />
                    Cuddalore, Tamil Nadu 607001<br />
                    India
                  </p>
                </div>
                
                {/* Call Us */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => window.open('tel:9994592607', '_self')}>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">Call Us</h3>
                  </div>
                  <p className="text-gray-600 text-base font-sans font-medium group-hover:text-orange-500 transition-colors duration-300">9994592607</p>
                </div>
                
                {/* Opening Hours */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-gray-800">Opening Hours</h3>
                  </div>
                  <div className="text-gray-600 text-base font-sans space-y-1 leading-relaxed">
                    <p>Monday - Saturday: 6:00 AM - 10:00 PM</p>
                    <p>Sunday: 7:00 AM - 9:00 PM</p>
                  </div>
                </div>
                
                {/* WhatsApp Button */}
                <button 
                  onClick={() => {
                    const message = `Hello! I'm interested in your bakery products. Could you please provide more information?`;
                    const whatsappUrl = `https://wa.me/919994592607?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                  <span className="text-lg font-display font-semibold">Contact via WhatsApp</span>
                </button>
              </div>
              
              {/* Contact Form */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-display font-bold mb-6">Send us a Message</h3>
                
                {/* Success Message */}
                {formSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-medium">Message sent successfully! We'll get back to you soon.</span>
                  </div>
                )}

                {/* Error Message */}
                {formError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span className="font-medium">{formError}</span>
                  </div>
                )}
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Tell us about your inquiry, custom order, or any questions you have..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {formLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Map Section */}
            <div className="mt-16">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-gray-800">Our Location</h3>
                        <p className="text-gray-600 font-sans">39, Main Road, Vannarapalayam, Cuddalore, Tamil Nadu 607001, India</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('39, Main Road, Vannarapalayam, Cuddalore, Tamil Nadu 607001, India')}`, '_blank')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 3.84L10.5 9l1.5 1.16L13.5 9 12 5.84z"/>
                        </svg>
                        <span>Directions</span>
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=11.7456,79.7734`, '_blank')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                      >
                        View Map
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.1234567890123!2d79.7734!3d11.7456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a54c123456789ab%3A0x1234567890abcdef!2sVannarapalayam%2C%20Cuddalore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1234567890123`}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="SeaSide Live Bake Studio Location"
                    className="w-full"
                  ></iframe>
                  
                  {/* Map Overlay Info */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-gray-800 text-sm">SeaSide Live Bake Studio</h4>
                        <p className="text-gray-600 text-xs leading-relaxed">Vannarapalayam, Cuddalore</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-secondary-500 to-secondary-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Order?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the best food delivery service
          </p>
          <Link to="/menu" className="bg-white text-secondary-600 hover:bg-neutral-50 font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block">
            Order Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

