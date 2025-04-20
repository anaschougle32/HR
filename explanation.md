# JobHR Project Explanation

## Project Overview

JobHR is a comprehensive job recruitment platform built with React Native and Expo, designed to connect job seekers, employers, and recruiters. The application features role-based access control, allowing different user types to access specific functionalities relevant to their needs.

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (Authentication, Database, Storage)
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State Management**: React Context API

## Core Files and Directories

### Root Configuration Files

#### tsconfig.json
This file configures TypeScript compiler options for the project, specifying how TypeScript should compile the code to JavaScript. It includes settings for module resolution, target ECMAScript version, and type checking strictness.

#### package.json
Contains project metadata and dependencies. It lists all npm packages required by the application, including React Native, Expo, Supabase client, and other UI libraries. It also defines scripts for running, building, and testing the application.

#### theme.ts
Defines the global theme for the application, including colors, typography, spacing, and other design tokens. This ensures consistent styling across the entire application.

#### .env
Contains environment variables such as API keys and Supabase URLs. These sensitive values are kept separate from the codebase for security reasons.

### App Directory

The `app` directory uses Expo Router's file-based routing system, where each file represents a route in the application.

#### app/index.tsx
The main entry point of the application. This is the first screen users see when opening the app, likely containing a splash screen or initial navigation options.

#### app/_layout.tsx
The root layout component that wraps all screens in the application. It typically includes global UI elements like navigation containers, status bars, and context providers.

#### app/notifications.tsx
Displays user notifications, showing alerts about application status, new job postings, or messages from employers/recruiters.

#### app/theme.ts
Contains theme configurations specific to the app routing, possibly extending the root theme with route-specific styling.

### Authentication Screens

#### app/(auth)/login.tsx
The login screen where users enter credentials to access their accounts. It handles authentication through Supabase and redirects users based on their roles.

#### app/(auth)/signup.tsx
Registration screen for new users. Collects basic information and creates a new user account in Supabase.

#### app/(auth)/role-select.tsx
Allows new users to select their role (job seeker, employer, or recruiter), which determines their access rights and UI flow.

#### app/(auth)/verify-email.tsx
Email verification screen that confirms user email addresses, enhancing security and reducing spam accounts.

#### app/(auth)/_layout.tsx
Layout component specific to authentication screens, possibly showing a simplified header/footer or background design.

### Job Seeker Screens

#### app/(app)/index.tsx
The main dashboard for job seekers, likely showing recommended jobs, application status, and quick actions.

#### app/(app)/applications.tsx
Displays all job applications submitted by the user, including their status (pending, reviewed, rejected, etc.).

#### app/(app)/profile.tsx
Profile management screen for job seekers to update their personal information, work experience, education, and skills.

#### app/(app)/jobs/index.tsx
Lists available job postings that match the user's profile and preferences.

#### app/(app)/jobs/[id].tsx
Detailed view of a specific job posting, showing requirements, responsibilities, and application options. The `[id]` is a dynamic parameter representing the job's unique identifier.

### Employer Screens

#### app/employer/index.tsx
Main dashboard for employers, showing analytics about job postings, applications, and hiring progress.

#### app/employer/jobs/index.tsx
Lists all jobs posted by the employer, with options to filter by status, date, or other criteria.

#### app/employer/jobs/post.tsx
Form for creating new job postings, including fields for job title, description, requirements, and compensation.

#### app/employer/jobs/manage.tsx
Interface for managing existing job postings, allowing employers to edit, pause, or close positions.

#### app/employer/applications/index.tsx
Lists all applications received for the employer's job postings, with filtering and sorting options.

#### app/employer/applications/shortlisted.tsx
Shows applications that have been shortlisted for further consideration.

#### app/employer/candidates/index.tsx
Displays potential candidates based on profile matches, even if they haven't applied directly.

#### app/employer/recruiters/index.tsx
Lists recruiters associated with the employer's account.

#### app/employer/recruiters/invite.tsx
Interface for inviting new recruiters to help manage job postings and applications.

### Recruiter Screens

#### app/recruiter/index.tsx
Dashboard for recruiters showing assigned jobs and pending tasks.

#### app/recruiter/profile.tsx
Profile management for recruiters to update their information and specializations.

#### app/recruiter/applications/index.tsx
Lists applications assigned to the recruiter for review.

#### app/recruiter/jobs/new.tsx
Interface for creating new job postings on behalf of employers.

#### app/recruiter/jobs/review.tsx
Screen for reviewing and approving job postings before they go live.

### Components

#### components/LoadingScreen.tsx
A reusable loading indicator component shown during data fetching or processing operations.

#### components/NotificationButton.tsx
Button component for accessing notifications, possibly showing an unread count badge.

### Contexts

#### contexts/AuthContext.tsx
React Context provider that manages authentication state throughout the application. It handles user login, logout, and role-based access control.

#### contexts/NotificationsContext.tsx
Context provider for managing notification state, including fetching, marking as read, and displaying notifications.

### Services

#### lib/supabase.ts and services/supabase.ts
Configuration and utility functions for interacting with Supabase services, including authentication, database queries, and storage operations.

### Database Migrations

The `supabase/migrations` directory contains SQL files that define the database schema:

#### 20240318000000_add_notifications.sql
Creates the notifications table and related functions.

#### 20240320000000_add_applicant_profiles_policies.sql
Defines access policies for applicant profiles, controlling who can view or edit this data.

#### 20240320000001_add_employer_profiles_policies.sql
Sets up access policies for employer profiles.

#### 20240324000000_create_interviews_table.sql
Creates the interviews table for scheduling and tracking candidate interviews.

#### 20240325000000_add_recruiter_profiles.sql
Adds the recruiter profiles table and related functionality.

### Utility Functions

#### utils/auth.ts
Helper functions for authentication operations, possibly including token management, session handling, and user role verification.

## Key Features

1. **Multi-role Support**: Different interfaces and permissions for job seekers, employers, and recruiters
2. **Job Posting Management**: Create, edit, and manage job listings
3. **Application Tracking**: Track application status from submission to decision
4. **Recruiter Collaboration**: Employers can invite recruiters to help manage hiring
5. **Notifications**: Real-time updates about application status and new opportunities
6. **Profile Management**: Comprehensive profile editing for all user types

## Database Structure

The application uses several key tables in Supabase:

1. **Users**: Authentication and basic user information
2. **Applicant_Profiles**: Extended information for job seekers
3. **Employer_Profiles**: Company information for employers
4. **Recruiter_Profiles**: Information about recruiters
5. **Jobs**: Job posting details
6. **Applications**: Job applications linking applicants to jobs
7. **Notifications**: System notifications for users
8. **Interviews**: Scheduled interviews between employers and candidates

## Authentication Flow

1. User registers or logs in via the auth screens
2. Upon successful authentication, the user is redirected based on their role
3. The AuthContext maintains the user's session throughout the app
4. Role-based access control restricts users to appropriate screens and actions

## Data Flow

1. UI components trigger actions (e.g., submitting an application)
2. These actions call Supabase service functions
3. Data is updated in the database and reflected in the UI
4. Notifications are generated for relevant users
5. Real-time subscriptions update the UI when data changes

This comprehensive architecture allows for a seamless experience across different user roles while maintaining security and data integrity.