# 🍰 SeaSide Live Bake Studio - Restaurant Website

<div align="center">

![SeaSide Live Bake Studio](https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/logo.jpg)

**A modern, full-featured restaurant website with customer ordering system and admin management panel**

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

[🚀 Live Demo](https://seasidelbs.com) | [📖 Documentation](./deployment.md) | [🐛 Report Bug](mailto:admin@seasidelbs.com)

</div>

---

## 🎯 Overview

SeaSide Live Bake Studio is a comprehensive restaurant management system featuring a beautiful customer-facing website and a powerful admin panel. Built with modern web technologies, it provides seamless ordering experience and efficient restaurant management.

### ✨ Key Features

- 🏠 **Stunning Homepage** with video background and responsive design
- 🔍 **Smart Search** functionality across menu items
- 🛒 **Complete E-commerce** with cart, checkout, and order tracking
- 📱 **Mobile-First** responsive design
- 🔐 **Secure Authentication** for customers and admins
- 📊 **Admin Dashboard** with comprehensive management tools
- 🍽️ **Menu Management** with image uploads and categories
- 💬 **Customer Inquiry** management system
- 📦 **Order Management** with status tracking and printing
- 🎨 **Modern UI/UX** with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/restaurant-website.git
   cd restaurant-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## 🏗️ Project Structure

```
restaurant-website/
├── 📁 public/
│   ├── 📁 media/                 # Static assets (images, videos)
│   └── 📄 favicon.ico
├── 📁 src/
│   ├── 📁 components/            # Reusable React components
│   │   ├── 📁 admin/            # Admin-specific components
│   │   ├── 📁 common/           # Shared components
│   │   └── 📁 customer/         # Customer-facing components
│   ├── 📁 context/              # React Context providers
│   │   ├── 📄 AuthContext.jsx   # Authentication state
│   │   ├── 📄 CartContext.jsx   # Shopping cart state
│   │   └── 📄 NotificationContext.jsx # Toast notifications
│   ├── 📁 pages/                # Page components
│   │   ├── 📁 admin/            # Admin panel pages
│   │   └── 📁 customer/         # Customer pages
│   ├── 📁 services/             # API service layer
│   │   └── 📄 api.js            # Axios configuration & API calls
│   ├── 📁 utils/                # Utility functions
│   ├── 📄 App.jsx               # Main App component
│   └── 📄 main.jsx              # Application entry point
├── 📄 package.json              # Dependencies and scripts
├── 📄 vite.config.js            # Vite configuration
├── 📄 tailwind.config.js        # Tailwind CSS configuration
├── 📄 env.example               # Environment variables template
├── 📄 deployment.md             # Deployment guide
└── 📄 README.md                 # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **⚛️ React 19.1.1** - UI library
- **⚡ Vite 7.1.7** - Build tool and dev server
- **🎨 Tailwind CSS 3.4.17** - Utility-first CSS framework
- **🛣️ React Router DOM 7.9.4** - Client-side routing
- **📡 Axios 1.12.2** - HTTP client

### Development Tools
- **🔍 ESLint** - Code linting
- **🎯 TypeScript** - Type checking
- **📦 PostCSS** - CSS processing
- **🔧 Autoprefixer** - CSS vendor prefixes

---

## 📱 Features Breakdown

### 🏠 Customer Features

#### Homepage
- **Video Background** - Engaging chef baking video
- **Hero Section** - Compelling call-to-action
- **Featured Items** - Highlighted menu items
- **About Preview** - Restaurant introduction
- **Contact Info** - Easy access to contact details

#### Menu System
- **Category Filtering** - Browse by food categories
- **Smart Search** - Search by name, description, or category
- **Detailed View** - High-quality images and descriptions
- **Price Display** - Clear pricing in Indian Rupees
- **Add to Cart** - One-click ordering

#### Shopping Cart
- **Real-time Updates** - Instant cart updates
- **Quantity Management** - Increase/decrease quantities
- **Item Removal** - Easy item removal
- **Price Calculation** - Automatic total calculation
- **Persistent Storage** - Cart saved across sessions

#### Order Management
- **Checkout Process** - Streamlined ordering
- **Order Tracking** - Real-time order status
- **Order History** - Past order records
- **Print Receipts** - Printable order details

#### User Authentication
- **Secure Signup** - Comprehensive validation
- **Login System** - Email/username login
- **Profile Management** - User profile editing
- **Password Security** - Strong password requirements

### 🔧 Admin Features

#### Dashboard
- **Statistics Overview** - Key metrics and KPIs
- **Recent Orders** - Latest order information
- **Quick Actions** - Fast access to common tasks
- **System Status** - Health monitoring

#### Order Management
- **Order List** - All orders with filtering
- **Status Updates** - Change order status
- **Order Details** - Complete order information
- **Print Functionality** - Print order receipts
- **Search & Filter** - Find specific orders

#### Menu Management
- **Add Items** - Create new menu items
- **Edit Items** - Modify existing items
- **Delete Items** - Remove items
- **Image Upload** - Server-side image hosting
- **Category Management** - Organize menu items

#### Customer Inquiries
- **Inquiry List** - View all customer inquiries
- **Status Management** - Update inquiry status
- **Response Tracking** - Track customer communications
- **Contact Information** - Customer details

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=https://api.seasidelbs.com

# Application Info
VITE_APP_NAME=SeaSide Live Bake Studio
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Contact Information
VITE_CONTACT_PHONE=+91 9994592607
VITE_CONTACT_EMAIL=admin@seasidelbs.com
VITE_CONTACT_ADDRESS=39, Main Road, Vannarapalayam, Cuddalore, Tamil Nadu 607001, India

# Social Media
VITE_INSTAGRAM_URL=https://www.instagram.com/seaside_live_bake_studio?igsh=MW9ycnRyY3QxeTAwMg==

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### API Configuration

The application connects to a REST API backend. Update the API base URL in your environment variables or directly in `src/services/api.js`.

**API Endpoints:**
- **Authentication:** `/login/`, `/signup/`, `/logout/`
- **Menu:** `/menu/`, `/menu/categories/`
- **Orders:** `/orders/`, `/orders/create/`
- **Admin:** `/admin/orders/`, `/admin/menu/`
- **File Upload:** `/upload/`

---

## 📦 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production
```bash
npm run build:prod   # Build for production with optimizations
npm run preview:prod # Preview production build
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors automatically
```

### Maintenance
```bash
npm run clean        # Remove dist directory
npm run rebuild      # Clean and rebuild
```

---

## 🎨 Styling & Theming

### Design System
- **Primary Color:** Orange (#FC8019)
- **Secondary Colors:** Gray scale palette
- **Typography:** Poppins, Inter fonts
- **Spacing:** Tailwind's spacing scale
- **Breakpoints:** Mobile-first responsive design

### Custom Components
- **SeaSideLogo** - Brand logo component
- **ProfileIcon** - User profile dropdown
- **NotificationToast** - Toast notifications
- **LoadingSpinner** - Loading states
- **ErrorBoundary** - Error handling

---

## 🔒 Security Features

### Authentication
- **JWT Tokens** - Secure session management
- **Password Hashing** - Bcrypt password security
- **Input Validation** - Comprehensive form validation
- **CSRF Protection** - Cross-site request forgery prevention

### Data Protection
- **HTTPS Only** - Secure data transmission
- **Input Sanitization** - XSS prevention
- **API Security** - Secure API endpoints
- **Error Handling** - Secure error messages

---

## 📊 Performance Optimizations

### Build Optimizations
- **Code Splitting** - Automatic code splitting
- **Tree Shaking** - Remove unused code
- **Minification** - Compress JavaScript and CSS
- **Asset Optimization** - Optimize images and fonts

### Runtime Optimizations
- **Lazy Loading** - Load components on demand
- **Memoization** - React.memo for performance
- **CDN Assets** - Serve assets from CDN
- **Caching** - Browser caching strategies

---

## 🚀 Deployment

### Production Build
```bash
npm run build:prod
```

### Deployment Options
- **Vercel** - Zero-config deployment
- **Netlify** - Static site hosting
- **AWS S3 + CloudFront** - Scalable hosting
- **VPS/Server** - Custom server deployment

For detailed deployment instructions, see [deployment.md](./deployment.md).

---

## 📱 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile Safari** 14+
- **Chrome Mobile** 90+

---

## 🧪 Testing

### Manual Testing
- ✅ User authentication flows
- ✅ Menu browsing and search
- ✅ Shopping cart functionality
- ✅ Order placement and tracking
- ✅ Admin panel operations
- ✅ Mobile responsiveness

### Automated Testing
- ✅ API endpoint testing
- ✅ Component unit testing
- ✅ Integration testing
- ✅ Performance testing

---

## 📈 Analytics & Monitoring

### Performance Metrics
- **Core Web Vitals** - LCP, FID, CLS
- **Bundle Size** - JavaScript and CSS sizes
- **Load Times** - Page load performance
- **Error Rates** - Application error tracking

### User Analytics
- **Page Views** - Traffic analysis
- **User Behavior** - Interaction tracking
- **Conversion Rates** - Order completion rates
- **Device Analytics** - Mobile vs desktop usage

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- Follow ESLint configuration
- Use meaningful commit messages
- Write descriptive comments
- Maintain test coverage

---

## 📞 Support & Contact

### Technical Support
- **Email:** admin@seasidelbs.com
- **Phone:** +91 9994592607
- **Address:** 39, Main Road, Vannarapalayam, Cuddalore, Tamil Nadu 607001, India

### Business Hours
- **Monday - Saturday:** 9:00 AM - 9:00 PM
- **Sunday:** 10:00 AM - 8:00 PM

### Social Media
- **Instagram:** [@seaside_live_bake_studio](https://www.instagram.com/seaside_live_bake_studio?igsh=MW9ycnRyY3QxeTAwMg==)

---

## 📄 License

This project is proprietary software owned by **SeaSide Live Bake Studio**. All rights reserved.

### Usage Rights
- ✅ Internal use by SeaSide Live Bake Studio
- ❌ Redistribution prohibited
- ❌ Commercial use by third parties prohibited
- ❌ Modification without permission prohibited

---

## 🙏 Acknowledgments

### Credits
- **Images:** Pexels, Unsplash photographers
- **Icons:** React Icons library
- **Fonts:** Google Fonts (Poppins, Inter)
- **UI Inspiration:** Modern restaurant websites

### Special Thanks
- **Development Team** - For building this amazing platform
- **Design Team** - For creating beautiful UI/UX
- **Testing Team** - For ensuring quality and reliability
- **SeaSide Live Bake Studio** - For the vision and requirements

---

## 📋 Changelog

### Version 1.0.0 (January 2025)
- 🎉 Initial release
- ✨ Complete customer ordering system
- 🔧 Full admin management panel
- 📱 Mobile-responsive design
- 🔒 Secure authentication system
- 🚀 Production-ready deployment

---

<div align="center">

**Built with ❤️ for SeaSide Live Bake Studio**

*Delivering delicious experiences through technology*

[🍰 Order Now](https://seasidelbs.com) | [📧 Contact Us](mailto:admin@seasidelbs.com) | [📱 Follow Us](https://www.instagram.com/seaside_live_bake_studio?igsh=MW9ycnRyY3QxeTAwMg==)

</div>