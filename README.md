# VaxCare Africa

An offline-first vaccination management system built for healthcare workers in Africa. This application provides comprehensive patient and immunization tracking with FHIR-compliant data structures and offline-first capabilities.

## Features

- **Offline-First**: Works without internet connection using IndexedDB
- **FHIR-Compliant**: Uses standard healthcare data formats
- **Patient Management**: Register and manage patient records
- **Immunization Tracking**: Record and track vaccination history
- **Role-Based Access**: Support for clinicians and administrators
- **PWA Support**: Installable as a mobile app
- **Dark Mode**: Toggle between light and dark themes
- **Data Sync**: Mock synchronization with server (ready for backend integration)

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **ShadCN UI** for components
- **RxDB** with IndexedDB for offline storage
- **Zustand** for state management
- **FHIR R4** compliant schemas

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vaxcare-client
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

The application includes mock authentication for testing:

- **Admin**: `admin` / `admin123`
- **Clinician**: `clinician` / `clinician123`
- **Nurse**: `nurse` / `nurse123`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── patients/          # Patient management
│   └── sync/              # Data synchronization
├── components/            # React components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # ShadCN UI components
├── db/                    # Database configuration
│   ├── database.ts        # RxDB setup
│   └── schemas.ts         # FHIR schemas
├── hooks/                 # Custom React hooks
│   ├── useDatabase.ts    # Database hook
│   ├── usePatients.ts    # Patient operations
│   └── useImmunizations.ts # Immunization operations
└── store/                 # Zustand stores
    ├── auth.ts           # Authentication state
    └── app.ts            # App state
```

## FHIR Compliance

The application uses FHIR R4 compliant schemas for:

- **Patient**: Demographics and contact information
- **Immunization**: Vaccination records with vaccine codes
- **Practitioner**: Healthcare worker information
- **Organization**: Facility information

## Offline Capabilities

- **IndexedDB Storage**: All data stored locally
- **Service Worker**: Caches app for offline use
- **Sync Preparation**: Ready for server synchronization
- **Conflict Resolution**: Prepared for data merging

## Development

### Adding New Features

1. **New Pages**: Add to `src/app/`
2. **Components**: Add to `src/components/`
3. **Database Operations**: Extend hooks in `src/hooks/`
4. **State Management**: Update stores in `src/store/`

### Database Schema

The application uses FHIR-compliant schemas that can be easily synchronized with:
- PostgreSQL databases
- FHIR REST APIs
- Healthcare data warehouses

### Building for Production

```bash
npm run build
npm start
```

## Deployment

The application is a PWA and can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Future Enhancements

- **Real Backend Integration**: Replace mock sync with actual API calls
- **Advanced Analytics**: Vaccination coverage reports
- **Barcode Scanning**: Vaccine lot number scanning
- **Offline Maps**: Location-based features
- **Multi-language Support**: Local language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.