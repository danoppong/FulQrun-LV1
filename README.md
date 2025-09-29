# FulQrun - Sales Operations Platform

A comprehensive sales operations platform built with Next.js 14, TypeScript, and Supabase. FulQrun provides PEAK + MEDDPICC embedded sales operations with advanced analytics, lead management, and performance tracking.

## 🚀 Features

### Core Functionality
- **Dashboard & Analytics**: Real-time sales performance metrics and KPIs
- **Lead Management**: Advanced lead scoring and qualification system
- **Opportunity Tracking**: MEDDPICC methodology implementation
- **Contact Management**: Comprehensive contact and company database
- **Activity Tracking**: Sales activities and task management
- **Learning Modules**: Built-in sales training and certification system
- **Performance Metrics**: CSTPV (Clarity, Score, Teach, Problem, Value) tracking
- **Integration Hub**: Connect with external tools and services

### Security & Quality
- **Enterprise Security**: XSS protection, input validation, rate limiting
- **Role-Based Access**: Multi-level user permissions (Rep, Manager, Admin)
- **Data Protection**: GDPR compliant with comprehensive audit logging
- **Error Handling**: Robust error boundaries and recovery mechanisms
- **Type Safety**: Full TypeScript implementation with strict checking

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **DOMPurify** - HTML sanitization

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication & authorization
  - Real-time subscriptions
  - Row Level Security (RLS)

### Development
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/fulqrun-lv1.git
   cd fulqrun-lv1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   ```bash
   # Run the database migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Detailed system architecture
- **[Security Policy](./SECURITY.md)** - Security features and vulnerability reporting
- **[Changelog](./CHANGELOG.md)** - Version history and updates
- **[API Documentation](./docs/api/)** - API endpoint documentation

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## 🏗 Development

### Code Quality
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking enabled
- **Husky**: Pre-commit hooks for quality checks

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── forms/            # Form components
├── lib/                  # Core libraries
│   ├── auth-unified.ts   # Authentication service
│   ├── validation.ts     # Validation schemas
│   └── supabase.ts       # Database client
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── __tests__/            # Test files
```

## 🚀 Deployment

FulQrun is production-ready with comprehensive deployment options:

### Quick Deployment Options

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

#### Option 2: Docker
```bash
# Build and run with Docker
docker build -t fulqrun:latest .
docker run -p 3000:3000 fulqrun:latest
```

#### Option 3: Automated Script
```bash
# Run the deployment script
./scripts/deploy.sh
```

### Performance Optimizations
- ✅ **90%+ bundle size reduction** through dynamic imports
- ✅ **Code splitting** with vendor chunks (269kB shared)
- ✅ **Font optimization** with fallback fonts
- ✅ **Security headers** automatically applied
- ✅ **SWC minification** for faster builds

### Security Features
- ✅ **Content Security Policy** with Supabase integration
- ✅ **Strict Transport Security** (HSTS)
- ✅ **XSS Protection** and frame options
- ✅ **Permissions Policy** for enhanced privacy

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔒 Security

FulQrun implements enterprise-grade security measures:

- **Input Validation**: Comprehensive validation using Zod schemas
- **XSS Protection**: HTML sanitization with DOMPurify
- **Rate Limiting**: API protection against abuse
- **Authentication**: Secure session management
- **Authorization**: Role-based access control
- **Data Encryption**: End-to-end encryption for sensitive data

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Performance

FulQrun is optimized for performance:

- **Core Web Vitals**: Optimized for Google's performance metrics
- **Code Splitting**: Automatic code splitting for faster loading
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Caching**: Strategic caching at multiple levels
- **Bundle Optimization**: Tree shaking and minification

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive docs
- **Issues**: Report bugs via GitHub Issues
- **Security**: Report security issues to security@fulqrun.com
- **Discussions**: Join our GitHub Discussions

## 🗺 Roadmap

### Upcoming Features
- [ ] Advanced AI insights and recommendations
- [ ] Mobile application (React Native)
- [ ] Advanced reporting and analytics
- [ ] Third-party integrations (Salesforce, HubSpot)
- [ ] Advanced workflow automation
- [ ] Multi-language support

### Recent Updates
- ✅ XSS vulnerability fixes
- ✅ Input validation enhancement
- ✅ Authentication architecture consolidation
- ✅ Performance optimizations
- ✅ Comprehensive error handling

---

**Built with ❤️ by the FulQrun Team**

*For more information, visit [fulqrun.com](https://fulqrun.com)*
