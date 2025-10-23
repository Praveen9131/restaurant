const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Sebastian Coman Photography */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/about-hero.jpg')`
          }}
        ></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-gray-900/70"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Orange Banner */}
            <div className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-display font-semibold mb-8 tracking-wide">
              Our Story
            </div>
            
            {/* Main Heading */}
            <h1 className="font-display font-bold mb-8 leading-tight text-white">
              <span className="block mb-2">About SeaSide</span>
              <span className="block text-orange-500">Live Bake Studio</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-sans">
              Discover the passion, tradition, and artistry behind every creation at SeaSide Live Bake Studio. 
              Where fresh ingredients meet skilled craftsmanship to deliver unforgettable culinary experiences.
            </p>
            
            {/* Scroll Indicator */}
            <div className="animate-bounce">
              <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Our Story Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12">

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                  🍰
                </div>
                <h2 className="text-3xl font-display font-bold mb-2 text-gray-800">Our Story</h2>
                <p className="text-orange-500 font-medium">Fresh • Live • Delicious</p>
              </div>

              <div className="text-center mb-8">
                <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                  Welcome to SeaSide Live Bake Studio, where we bring you the freshest, most delicious food made with love and care. 
                  Located in the beautiful coastal town of Cuddalore, Tamil Nadu, we are passionate about delivering exceptional 
                  culinary experiences right to your doorstep.
                </p>
              </div>
            </div>

            {/* Mission & Vision Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 3.84L10.5 9l1.5 1.16L13.5 9 12 5.84z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">Our Mission</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To provide our customers with the finest quality food, made fresh daily using premium ingredients. 
                  We are committed to delivering not just meals, but memorable experiences that bring families together 
                  around the table.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">Our Vision</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To become the most trusted and beloved bakery in Tamil Nadu, known for our commitment to quality, 
                  innovation, and the art of traditional baking. We envision a community where every celebration 
                  is made sweeter with our creations.
                </p>
              </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-12 border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">Why Choose SeaSide Bake?</h3>
                <p className="text-lg text-gray-600">Experience the difference that passion and quality make</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 3.84L10.5 9l1.5 1.16L13.5 9 12 5.84z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-display font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors duration-300">Fresh Ingredients</h4>
                  <p className="text-gray-600 leading-relaxed">Sourced daily from local suppliers and premium markets</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-display font-bold text-gray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300">Expert Bakers</h4>
                  <p className="text-gray-600 leading-relaxed">Traditional recipes with modern culinary techniques</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2zm0 3.84L10.5 9l1.5 1.16L13.5 9 12 5.84z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-display font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">Fast Delivery</h4>
                  <p className="text-gray-600 leading-relaxed">Reliable service delivered fresh to your doorstep</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
                <h3 className="text-3xl font-display font-bold mb-4">Ready to Experience Excellence?</h3>
                <p className="text-lg mb-8 opacity-90">
                  Join us on this culinary journey and taste the difference that fresh ingredients and skilled craftsmanship make!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/menu" className="bg-white text-orange-600 hover:bg-gray-50 font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Browse Our Menu
                  </a>
                  <a href="/contact" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold py-3 px-8 rounded-xl transition-all duration-300">
                    Get In Touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
