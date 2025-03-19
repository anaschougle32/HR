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
- **Job Search:**
  - Search for jobs based on domain/keywords.
  - View job details (description, requirements, questionnaire).
- **Application Process:**
  - Answer employer-specific questionnaires.
  - Submit the application via a **"Submit Application"** button.
- **Ratings Visibility:**
  - View star ratings assigned after qualification calls.

### 3. Employer Flow
- **Signup/Login:** Employers register or log in.
- **Company Profile Setup:**
  - Add company details.
  - Upload company logo.
- **Job Posting:**
  - Create and post job listings (similar to Upwork job postings).
  - Define required experience levels (1-5 stars).
- **Candidate Review:**
  - Review candidates aligned by the recruiter.
  - Schedule interviews based on provided ratings.
  - Discuss candidate details with the recruiter (without direct contact details for security and monetization purposes).

### 4. Recruiter Flow
- **Login:** Recruiters log in using credentials.
- **Candidate Filtering & Rating:**
  - Review applications submitted by job seekers.
  - Conduct a short qualification call and assign a star rating (1-5 based on skill level).
  - Align candidates with job postings based on employer requirements.
  - Schedule interviews between employers and candidates.

### 5. Admin Flow
- **Admin Dashboard:**
  - Monitor all user activities.
  - View hiring statistics and insights.
  - Manage platform operations.

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
   - status: enum ('active', 'closed')
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
   - status: enum ('pending', 'reviewed', 'shortlisted', 'rejected')
   - recruiter_rating: integer (1-5)
   - recruiter_notes: text
   - created_at: timestamp
   - updated_at: timestamp

8. **questionnaire_responses**
   - id: uuid (PK)
   - application_id: uuid (FK -> applications.id)
   - question_id: uuid (FK -> job_questionnaires.id)
   - answer: text
   - created_at: timestamp

## Project Structure

## Features Summary (MVP Scope)

### Core Features
✅ **Signup/Login** for job applicants and employers.
✅ **Profile creation** for job seekers (resume, experience, projects, etc.).
✅ **Job search & filtering** for applicants.
✅ **Job posting system** for employers.
✅ **Application submission** process with questionnaire completion.
✅ **Candidate rating system** (1-5 stars after qualification call).
✅ **Recruiter-based job matching** based on rating.
✅ **Admin dashboard** with monitoring and analytics.

### Features Excluded in MVP
❌ Direct contact details between employers and candidates (only recruiters facilitate the connection).
❌ Advanced AI-based job recommendations (manual search will be used instead).

## Conclusion
This MVP ensures a smooth and efficient hiring process with a minimal but effective feature set. Future iterations can introduce AI-driven recommendations, automated interview scheduling, and enhanced filtering mechanisms.
