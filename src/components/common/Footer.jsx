import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white hover:text-orange-500 transition-colors duration-300 cursor-pointer">
              <span>Sea</span><span>Side</span> Live Bake Studio
            </h3>
            <p className="text-gray-300">
              Fresh • Live • Delicious. Your favorite restaurant delivering delicious meals right to your doorstep.
              Fresh ingredients, authentic flavors, and exceptional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white hover:text-orange-500 transition-colors duration-300 cursor-pointer">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-primary transition">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-primary transition">
                  About
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-300 hover:text-primary transition">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-primary transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-primary transition">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white hover:text-orange-500 transition-colors duration-300 cursor-pointer">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>📞 +91 9994592607</li>
              <li>✉️ admin@seasidelbs.com</li>
              <li>📍 Cuddalore, Tamil Nadu</li>
              <li className="pt-2">
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-primary transition">Facebook</a>
                  <a href="https://www.instagram.com/seaside_live_bake_studio?igsh=MW9ycnRyY3QxeTAwMg==" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Instagram</a>
                  <a href="#" className="hover:text-primary transition">Twitter</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p className="text-white hover:text-orange-500 transition-colors duration-300 cursor-pointer">&copy; {new Date().getFullYear()} <span className="font-bold">Sea</span><span className="font-bold">Side</span> Live Bake Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

