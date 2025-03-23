# HR Consultancy Mobile App - MVP Specification

## Overview
This document outlines the simplified Minimum Viable Product (MVP) for an HR consultancy web and mobile application. The goal is to create a streamlined job matching platform that efficiently connects job seekers with employers while maintaining a structured hiring process.

## User Roles
The MVP will include the following user types:

1. **Job Applicant** (Candidates looking for jobs)
2. **Employer** (Companies posting jobs and hiring candidates)
3. **Recruiter** (Responsible for filtering, rating, and aligning candidates)
4. **Admin** (Monitors overall platform performance)

## App Flow

### 1. Welcome Screen
- Displays a clean UI with a **"Get Started"** button.
- Clicking **"Get Started"** presents options: **Login** or **Sign Up**.

### 2. Job Applicant Flow
- **Signup/Login:** Users register or log in.
- **Profile Setup:**
  - Add personal details (Name, Email, Phone, Location, etc.).
  - Upload resume/CV.
  - Add projects and work experience (similar to LinkedIn Experience section).
  - Add skills and expertise areas.
- **Job Search:**
  - Search for jobs based on domain/keywords.
  - View job details (description, requirements, questionnaire).
  - Filter jobs by category, employment type, and experience level.
- **Application Process:**
  - Answer employer-specific questionnaires.
  - Submit the application via a **"Submit Application"** button.
  - Track application status (pending, shortlisted, rejected, hired).
- **Ratings Visibility:**
  - View star ratings assigned after qualification calls.

### 3. Employer Flow
- **Signup/Login:** Employers register or log in.
- **Company Profile Setup:**
  - Add company details (name, description, industry, size).
  - Upload company logo.
  - Add company location and contact information.
- **Job Posting:**
  - Create and post job listings with detailed information:
    - Job title and description
    - Required skills and experience level
    - Employment type (full-time, part-time, contract)
    - Salary range and benefits
    - Location and work arrangement
  - Define required experience levels (1-5 stars).
  - Set job status (active, closed, pending review).
- **Application Management:**
  - View all applications in a centralized dashboard.
  - Filter applications by status (pending, shortlisted, rejected, hired).
  - Search applications by candidate name or job title.
  - View detailed application statistics:
    - Total applications
    - Applications by status
    - Conversion rates
- **Candidate Review:**
  - View comprehensive candidate profiles:
    - Personal information and professional title
    - Skills and experience
    - Resume/CV download
    - Application status and timeline
  - Take actions on applications:
    - Shortlist promising candidates
    - Schedule interviews
    - Make hiring decisions
    - Reject unsuitable candidates
  - Review shortlisted candidates in a dedicated section
  - Track hiring pipeline and progress
- **Interview Management:**
  - Schedule and manage interviews with candidates
  - Add interview notes and feedback
  - Update application status based on interview outcomes

### 4. Recruiter Flow
- **Login:** Recruiters log in using credentials.
- **Candidate Filtering & Rating:**
  - Review applications submitted by job seekers.
  - Conduct a short qualification call and assign a star rating (1-5 based on skill level).
  - Align candidates with job postings based on employer requirements.
  - Schedule interviews between employers and candidates.
- **Application Processing:**
  - Review and evaluate candidate applications
  - Update application statuses
  - Add notes and recommendations
  - Coordinate with employers on candidate selection

### 5. Admin Flow
- **Admin Dashboard:**
  - Monitor all user activities.
  - View hiring statistics and insights.
  - Manage platform operations.
  - Track system performance and usage.

## Tech Stack
- **Frontend:** React Native with TypeScript, Expo, and Expo Router
- **Backend/Database:** Supabase
- **UI Framework:** React Native Paper

## Database Schema

### Tables

1. **users**
   - id: uuid (PK)
   - email: string (unique)
   - password_hash: string
   - role: enum ('applicant', 'employer', 'recruiter', 'admin')
   - created_at: timestamp
   - updated_at: timestamp

2. **applicant_profiles**
   - id: uuid (PK)
   - user_id: uuid (FK -> users.id)
   - full_name: string
   - phone: string
   - location: string
   - title: string
   - experience: text
   - skills: string[]
   - resume_url: string
   - created_at: timestamp
   - updated_at: timestamp

3. **work_experiences**
   - id: uuid (PK)
   - applicant_id: uuid (FK -> applicant_profiles.id)
   - company: string
   - position: string
   - start_date: date
   - end_date: date
   - description: text
   - created_at: timestamp

4. **employer_profiles**
   - id: uuid (PK)
   - user_id: uuid (FK -> users.id)
   - company_name: string
   - logo_url: string
   - description: text
   - industry: string
   - company_size: string
   - website: string
   - location: string
   - created_at: timestamp
   - updated_at: timestamp

5. **jobs**
   - id: uuid (PK)
   - employer_id: uuid (FK -> employer_profiles.id)
   - title: string
   - description: text
   - requirements: text
   - experience_level: integer (1-5)
   - employment_type: enum ('full-time', 'part-time', 'contract', 'internship')
   - category: string
   - salary_min: integer
   - salary_max: integer
   - location: string
   - status: enum ('pending_review', 'active', 'rejected', 'closed')
   - applications_count: integer
   - created_at: timestamp
   - updated_at: timestamp

6. **job_questionnaires**
   - id: uuid (PK)
   - job_id: uuid (FK -> jobs.id)
   - question: text
   - created_at: timestamp

7. **applications**
   - id: uuid (PK)
   - job_id: uuid (FK -> jobs.id)
   - applicant_id: uuid (FK -> applicant_profiles.id)
   - status: enum ('pending', 'shortlisted', 'rejected', 'hired', 'interview_scheduled')
   - recruiter_rating: integer (1-5)
   - recruiter_notes: text
   - interview_date: timestamp
   - interview_notes: text
   - created_at: timestamp
   - updated_at: timestamp

8. **questionnaire_responses**
   - id: uuid (PK)
   - application_id: uuid (FK -> applications.id)
   - question_id: uuid (FK -> job_questionnaires.id)
   - answer: text
   - created_at: timestamp

9. **notifications**
   - id: uuid (PK)
   - user_id: uuid (FK -> users.id)
   - title: string
   - message: text
   - type: enum ('interview_scheduled', 'application_status', 'job_status', 'general')
   - related_entity_type: enum ('job', 'application', 'interview')
   - related_entity_id: uuid
   - read: boolean
   - created_at: timestamp
   - updated_at: timestamp

10. **interviews**
    - id: uuid (PK)
    - application_id: uuid (FK -> applications.id)
    - scheduled_at: timestamp
    - location: text
    - meeting_link: text
    - notes: text
    - status: enum ('scheduled', 'completed', 'cancelled', 'rescheduled')
    - created_at: timestamp
    - updated_at: timestamp

## Features Summary (MVP Scope)

### Core Features
✅ **Authentication & Authorization**
  - Signup/Login for all user types
  - Role-based access control
  - Secure password management

✅ **Profile Management**
  - Detailed user profiles for applicants and employers
  - Resume upload and management
  - Company profile customization

✅ **Job Management**
  - Comprehensive job posting system
  - Job search with advanced filters
  - Application tracking and statistics

✅ **Application Processing**
  - Streamlined application submission
  - Status tracking and updates
  - Interview scheduling and management

✅ **Candidate Management**
  - Detailed candidate profiles
  - Skills and experience tracking
  - Application history and status

✅ **Notification System**
  - Real-time status updates
  - Interview reminders
  - Application progress notifications

✅ **Analytics & Reporting**
  - Application statistics
  - Hiring pipeline metrics
  - User activity tracking

### Features Excluded in MVP
❌ Direct contact details between employers and candidates
❌ Advanced AI-based job recommendations
❌ Integrated video interviewing
❌ Automated resume parsing
❌ Advanced analytics and reporting
❌ Custom assessment tools

## Conclusion
This MVP provides a comprehensive platform for efficient job matching and hiring processes. The system emphasizes user experience with clean interfaces, clear workflows, and essential features for all user roles. Future iterations will focus on automation, advanced matching algorithms, and enhanced collaboration tools.
