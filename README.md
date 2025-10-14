# Dance 4 You 💃🕺

A modern dance event platform built with Next.js, featuring event listings, user authentication, and real-time chat functionality.

## 🚀 Features

- **Event Management**: Create, browse, and manage dance events
- **User Authentication**: Secure login with Stack Auth
- **Real-time Chat**: Connect with other dancers
- **Location-based Search**: Find events near you
- **Mobile-responsive Design**: Works perfectly on all devices
- **File Upload**: Poster upload with cloud storage support
- **Multiple Event Categories**: Drop-in classes, regular classes, workshops, and battles

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Stack Auth
- **Styling**: Tailwind CSS
- **File Storage**: Vercel Blob (production) / Local storage (development)
- **Maps**: Leaflet with React Leaflet
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dance-4-you
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Set up Vercel Blob Storage**
   - Go to [Vercel Dashboard > Storage](https://vercel.com/dashboard/stores)
   - Create a new Blob store
   - Copy the `BLOB_READ_WRITE_TOKEN`
   - Add it to your Vercel environment variables

### Environment Variables for Production

```env
# Database (Neon PostgreSQL)
DATABASE_URL=your_neon_database_url
DIRECT_URL=your_neon_direct_url

# Authentication (Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
JWT_SECRET=your_jwt_secret

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

## 🔧 File Upload Configuration

The app uses a hybrid file upload system:

- **Development**: Files are stored locally in `public/uploads/`
- **Production**: Files are stored in Vercel Blob storage

This ensures:
- ✅ Fast development experience
- ✅ Scalable production deployment
- ✅ No file loss on serverless platforms
- ✅ CDN-backed file delivery

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── events/        # Event pages
│   ├── submit-event/  # Event submission
│   └── ...
├── components/        # Reusable components
├── lib/              # Utilities and configurations
└── utils/            # Helper functions

prisma/
├── schema.prisma     # Database schema
└── seed.js          # Database seeding

public/
├── uploads/         # Local file storage (dev only)
└── ...             # Static assets
```

## 🎯 Key Features Explained

### Event Categories
- **Drop-in Classes**: Single session classes
- **Regular Classes**: Recurring weekly classes
- **Workshops**: Special learning sessions
- **Battle Competitions**: Dance competitions

### File Upload System
- Supports JPEG, PNG, WebP formats
- 10MB file size limit
- Automatic aspect ratio validation
- Cloud storage for production scalability

### Location Features
- GPS-based event discovery
- Distance calculation
- Interactive maps
- City-based filtering

## 🚀 Recent Updates

### File Upload Fix for Production ✅
- **Issue**: File uploads were failing in production due to read-only filesystem
- **Solution**: Implemented Vercel Blob storage for production deployments
- **Benefits**: 
  - Reliable file storage in production
  - CDN-backed file delivery
  - Maintains local storage for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-username/dance-4-you/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🎉 Acknowledgments

- Built with ❤️ for the dance community
- Powered by modern web technologies
- Designed for dancers, by dancers
