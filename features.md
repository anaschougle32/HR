# JobHR System Features

## User Types and Features

### 1. Applicant
- **Profile Management**
  - Create and edit personal profile
  - Upload and manage resume
  - Add/edit work experience
  - Manage skills and qualifications
  - Update personal information

- **Job Search & Applications**
  - Browse all active job listings
  - Search jobs with filters (category, type, experience level)
  - View detailed job descriptions
  - Apply to jobs
  - Track application status
  - View application history
  - Receive notifications for application updates

### 2. Employer
- **Profile Management**
  - Create and edit company profile
  - Update company information
  - Manage company details (size, industry, location)

- **Job Management**
  - Post new job listings
  - Edit existing job posts
  - Close or delete job listings
  - View all company job posts
  - Track job applications
  - View job statistics

- **Application Management**
  - View all applications for posted jobs
  - Review candidate profiles
  - Update application statuses
  - Download candidate resumes
  - Schedule interviews
  - View application statistics

- **Dashboard**
  - View total jobs posted
  - Track application statistics
  - Monitor shortlisted candidates
  - View recent activities

### 3. Recruiter
- **Profile Management**
  - Create and edit recruiter profile
  - Set permissions and access levels

- **Job Management**
  - Review and approve job posts
  - Access to all jobs in the system
  - Post new jobs
  - Edit existing jobs
  - Close job listings

- **Application Management**
  - View all applications
  - Review candidate profiles
  - Update application statuses
  - Schedule interviews
  - Download candidate resumes
  - Add notes to applications

- **Dashboard**
  - View total jobs under review
  - Track application statistics
  - Monitor pending reviews
  - View recent activities

## System Flows

### 1. Authentication Flow
1. User signs up with email and password
2. User selects role (Applicant/Employer/Recruiter)
3. Email verification required
4. Profile creation based on role
5. Access granted to role-specific features

### 2. Job Posting Flow
1. Employer/Recruiter creates new job post
2. Job details added (title, description, requirements, etc.)
3. Job post submitted for review (if posted by employer)
4. Recruiter reviews and approves/rejects job
5. Job becomes visible to applicants when approved

### 3. Application Flow
1. Applicant views job listing
2. Applicant submits application
3. Application status set to 'pending'
4. Employer/Recruiter reviews application
5. Status updated (shortlisted/rejected)
6. Applicant notified of status changes
7. Interview scheduling if shortlisted

### 4. Interview Process Flow
1. Employer/Recruiter schedules interview
2. System sends notifications to all parties
3. Interview details recorded
4. Application status updated
5. Notes and feedback can be added

### 5. Notification System
- Application status changes
- Interview schedules
- Job post status updates
- New applications
- Profile updates
- System announcements

### 6. Data Access Controls
- Employers: Access only to their company's data
- Recruiters: Global access to all jobs and applications
- Applicants: Access to their own data and public job listings
- Role-based security policies
- Data privacy protection

## Technical Features

### 1. Database
- Supabase PostgreSQL database
- Row Level Security (RLS) policies
- Real-time subscriptions
- Secure data access

### 2. Authentication
- Email/Password authentication
- Role-based access control
- Session management
- Secure token handling

### 3. Storage
- Resume file storage
- Company logo storage
- Secure file access
- Public/private file handling

### 4. UI/UX
- React Native Paper components
- Responsive design
- Modern interface
- Consistent styling
- Loading states
- Error handling
- Form validation 