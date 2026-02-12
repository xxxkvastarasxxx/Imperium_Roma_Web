# 🏛️ Imperium Roma

**The Leading Platform for Roman Coin Authentication, Valuation & Collection Management**

[![Website](https://img.shields.io/badge/Website-imperiumroma.com-gold?style=for-the-badge)](https://imperiumroma.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

---

## 📖 Overview

Imperium Roma is a comprehensive web platform designed for ancient Roman coin collectors, numismatists, and enthusiasts worldwide. The platform provides professional authentication services, AI-powered coin identification, market valuation tools, and a sophisticated collection management system.

### 🎯 Mission

To democratize access to expert numismatic knowledge and provide collectors with professional-grade tools for identifying, authenticating, and managing ancient Roman coins.

---

## ✨ Key Features

### 🔍 **Coin Authentication & Identification**
- AI-powered coin recognition technology
- Expert verification services
- Certificate of authenticity issuance
- Instant certificate verification system

### 💰 **Market Valuation**
- Real-time market price analysis
- Historical price tracking
- Integration with major auction houses (CoinArchives, VCoins, Roma Numismatics, etc.)
- Comprehensive auction data aggregation

### 📚 **Domus - Collection Management**
- Personal digital collection dashboard
- 10,000+ catalogued Roman coins database
- Wishlist and tracking features
- Collection analytics and insights
- Export functionality

### 🌐 **Community & Resources**
- News feed with latest numismatic updates
- Educational resources and knowledge base
- Expert articles and research
- Community discussions

### 🎨 **Interactive Features**
- 3D coin model generator
- Animated UI elements with parallax effects
- Responsive carousel for featured auctions
- Dynamic content loading
- Mobile-optimized experience

---

## 🏗️ Project Structure

```
Imperium_Roma_Web/
├── index.html                 # Homepage
├── about/                     # About page
├── services/                  # Services page (authentication & valuation)
├── authenticity/              # Certificate verification page
├── contact/                   # Contact page
├── login/                     # Authentication pages
│   └── reset-password/
├── domus/                     # User dashboard (collection management)
│   ├── index.html            # Main dashboard
│   ├── collection/           # Collection view
│   ├── wishlist/             # Wishlist management
│   ├── settings/             # User settings
│   ├── create-profile/       # Profile creation
│   └── check-profile/        # Profile verification
├── policies/                  # Legal pages
│   ├── privacy_policy/
│   ├── terms_of_use/
│   └── delete_user_data/
├── assets/
│   ├── css/                  # Stylesheets
│   │   ├── style.css        # Global styles
│   │   ├── index.css        # Homepage styles
│   │   ├── about.css
│   │   ├── services.css
│   │   ├── contact.css
│   │   ├── authenticity.css
│   │   ├── login.css
│   │   └── create-profile.css
│   ├── js/                   # JavaScript modules
│   │   ├── carousel.js      # Auction carousel
│   │   ├── domus-tabs.js    # Tab navigation
│   │   ├── domus-features.js
│   │   ├── coin3d_generator.js
│   │   ├── drifting-objects.js
│   │   ├── parallax.js
│   │   ├── header.js
│   │   ├── hamburger.js
│   │   ├── news.js
│   │   ├── login.js
│   │   ├── create-profile.js
│   │   ├── check-profile.js
│   │   ├── supabaseClient.js
│   │   ├── market-avaluation.js
│   │   ├── export-logic.js
│   │   ├── form.js
│   │   ├── zoom.js
│   │   └── config.js
│   ├── data/                 # JSON data files
│   │   ├── auctionItems.json
│   │   ├── auction_data.json
│   │   ├── countries_list.json
│   │   └── site-content.xml
│   ├── images/               # Image assets
│   │   ├── general/         # General images
│   │   ├── icons/           # Icon files
│   │   ├── anicoins/        # Animated coin assets
│   │   ├── FeaturedCoinsOTD/ # Featured coins
│   │   ├── AuctionsMedia/   # Auction house logos
│   │   ├── services/
│   │   ├── team/
│   │   └── ai/
│   └── videos/               # Video assets
│       ├── intro.mp4
│       ├── intro1.mp4
│       ├── about.intro.mp4
│       ├── services.intro.mp4
│       └── auction.intro.mp4
├── config/
│   └── telegram.example.php  # Telegram integration template
├── send-telegram.php          # Contact form handler
├── robots.txt                 # SEO crawling rules
├── sitemap.xml               # SEO sitemap
└── .htaccess                 # Server configuration

```

---

## 🛠️ Technology Stack

### **Frontend**
- **HTML5** - Semantic markup with proper accessibility tags
- **CSS3** - Custom styles with CSS Grid, Flexbox, animations
- **Vanilla JavaScript (ES6+)** - Modular architecture with ES modules
- **Responsive Design** - Mobile-first approach with media queries

### **Backend & Database**
- **Supabase** - Backend-as-a-Service for authentication and database
- **PostgreSQL** - Relational database (via Supabase)
- **PHP** - Server-side scripting for contact forms and utilities

### **Third-Party Integrations**
- **Telegram API** - Contact form notifications
- **Google Fonts** - Typography (Cinzel, Lato, Roboto)
- **Video Streaming** - Native HTML5 video with autoplay

### **SEO & Performance**
- **Structured Data** - Schema.org markup (Organization, WebSite, SearchAction, BreadcrumbList, FAQPage, Service, ContactPage, AboutPage)
- **Open Graph & Twitter Cards** - Social media optimization
- **Sitemap & Robots.txt** - Search engine optimization
- **Semantic HTML** - `<main>`, `<header>`, `<footer>`, `<nav>`, `<article>` landmarks
- **Image Optimization** - Lazy loading, proper alt attributes, WebP support

---

## 🚀 Getting Started

### **Prerequisites**
- Web server (Apache/Nginx) or local development server
- PHP 7.4+ (for contact form functionality)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/xxxkvastarasxxx/Imperium_Roma_Web.git
   cd Imperium_Roma_Web
   ```

2. **Configure environment**
   
   Create `config/telegram.php` from the example template:
   ```bash
   cp config/telegram.example.php config/telegram.php
   ```
   
   Edit `config/telegram.php` and add your Telegram bot credentials:
   ```php
   <?php
   define('TELEGRAM_BOT_TOKEN', 'your-bot-token-here');
   define('TELEGRAM_CHAT_ID', 'your-chat-id-here');
   ```

3. **Update Supabase configuration**
   
   Edit `assets/js/config.js` with your Supabase credentials:
   ```javascript
   export const SUPABASE_URL = 'your-supabase-url';
   export const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

4. **Start development server**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```
   
   Using Node.js (with `http-server`):
   ```bash
   npx http-server -p 8000
   ```

5. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 📱 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| **Homepage** | `/` | Landing page with featured auctions, news, and Domus introduction |
| **About** | `/about/` | Company mission, team, and history |
| **Services** | `/services/` | Authentication, valuation, and identification services |
| **Authenticity** | `/authenticity/` | Certificate verification tool |
| **Contact** | `/contact/` | Contact form with Telegram integration |
| **Login** | `/login/` | User authentication |
| **Domus Dashboard** | `/domus/` | User collection management (requires login) |
| **Collection** | `/domus/collection/` | View and manage coin collection |
| **Wishlist** | `/domus/wishlist/` | Track desired coins |
| **Privacy Policy** | `/policies/privacy_policy/` | GDPR-compliant privacy policy |
| **Terms of Use** | `/policies/terms_of_use/` | Terms and conditions |

---

## 🎨 Design Features

### **Visual Elements**
- **Color Scheme**: Black (#000) background with gold (#ffcc00) accents
- **Typography**: Cinzel for headings, Lato/Roboto for body text
- **Animations**: Parallax scrolling, drifting objects, hover effects
- **Video Backgrounds**: Hero sections with looping video content

### **UI Components**
- **Split-Screen Layout** (Domus section): 5fr/7fr grid with sticky navigation
- **Carousel System**: Auto-advancing, responsive auction highlights
- **Tab Navigation**: Interactive panels with smooth transitions
- **Stats Cards**: Gold gradient backgrounds with hover effects
- **Trust Badges**: Icon-based feature highlights

### **Responsive Breakpoints**
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px
- **Small Mobile**: < 520px

---

## 🔐 Security Features

- Environment variable protection (`.gitignore` for sensitive configs)
- Example configuration files for easy setup
- HTTPS recommended for production
- SQL injection prevention (parameterized queries in Supabase)
- XSS protection through proper output encoding
- CSRF token implementation in forms
- Secure password reset flow

---

## 📊 SEO Optimization

### **Implemented**
✅ Semantic HTML5 structure with `<main>` landmarks  
✅ Comprehensive meta tags (description, keywords, robots)  
✅ Open Graph and Twitter Card markup  
✅ Structured Data (JSON-LD) on all pages  
✅ Canonical URLs  
✅ XML sitemap with proper priorities  
✅ robots.txt configuration  
✅ Hreflang tags for international targeting  
✅ Image alt attributes  
✅ Mobile-friendly responsive design  
✅ Fast loading times with optimized assets  

### **Performance Tips**
- Use WebP images where possible
- Enable gzip/brotli compression on server
- Implement browser caching via `.htaccess`
- Consider CDN for static assets
- Lazy load images below the fold

---

## 🤝 Contributing

This is a proprietary project. For inquiries about collaboration or partnerships, please contact us through the website's contact form.

---

## 📄 License

**Proprietary License** - All Rights Reserved

© 2026 Imperium Roma. This project and its contents are proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

---

## 📞 Contact & Support

- **Website**: [https://imperiumroma.com](https://imperiumroma.com)
- **Email**: Via contact form at [imperiumroma.com/contact](https://imperiumroma.com/contact/)
- **Response Time**: Within 24 hours

---

## 🏆 Acknowledgments

- Ancient coin data sourced from reputable numismatic databases
- Auction integrations with CoinArchives, VCoins, Roma Numismatics, NGC, PCGS, and Violity
- Community feedback from Roman coin collectors worldwide

---

## 📝 Development Notes

### **Browser Compatibility**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Known Issues**
- None currently reported

### **Roadmap**
- [ ] Advanced search filters
- [ ] Multi-language support (DE, FR, IT, ES)
- [ ] Mobile app development
- [ ] Blockchain-based certificate verification
- [ ] Marketplace integration
- [ ] Social features for collectors

---

## 🔄 Version History

- **v1.0.0** (2026) - Initial release with core features
  - Homepage with auction highlights and news
  - Authentication and valuation services pages
  - Domus collection management system
  - Certificate verification tool
  - Full SEO optimization
  - Mobile responsive design

---

**Built with ❤️ for numismatists and Roman history enthusiasts worldwide**

*"Every coin tells a story of empire, conquest, and legacy"*
