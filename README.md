# FairwayFortune | Golf Charity Subscription Platform

This is a full-stack Next.js application built with Firebase (Auth & Firestore), Tailwind CSS, ShadCN UI, and Genkit for AI-powered content generation.

## Repository Setup

To connect this project to your remote repository, run the following commands in your terminal:

```bash
git remote add origin https://github.com/workspaceshiva/workplace-assignment.git
git branch -M main
git push -u origin main
```

## Core Features

- **Authentication**: Secure login and signup with role-based access control (User/Admin).
- **Subscription System**: Monthly/Yearly pro plans required for core feature access.
- **Score Management**: Users can log their last 5 Stableford scores (range 1-45).
- **Monthly Draw Engine**: Automated prize draw system with 3, 4, and 5-match prize tiers.
- **Charity Integration**: 10% of every subscription is donated to a user-selected charity.
- **Admin Control Center**:
    - **User Management**: Edit profiles and override scores.
    - **Draw Management**: Simulate and publish monthly results.
    - **Charity CRUD**: Manage the foundation registry.
    - **Winner Verification**: Verify proof and manage payouts.
    - **Analytics**: Real-time tracking of users, prize pools, and impact.
- **AI Copilot**: Genkit-powered marketing copy generator for prizes and charities.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **Backend/Database**: Firebase Authentication, Cloud Firestore.
- **AI**: Google Genkit with Gemini 2.5 Flash.
- **Icons**: Lucide React.
