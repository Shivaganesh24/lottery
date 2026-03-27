# **App Name**: FairwayFortune

## Core Features:

- User Account & Authentication: Secure signup and login functionalities with JWT-based authentication for session management.
- Subscription Management: Handle monthly/yearly subscription plans (mocked payment for MVP) and manage user subscription status (`isSubscribed` flag).
- Golf Score Input System: Allow users to easily input their last 5 Stableford golf scores (1-45), with the system automatically managing the replacement of the oldest score.
- Monthly Draw Participation: Automatically enter subscribed users into monthly prize draws based on their submitted golf scores.
- User Dashboard Overview: A clean dashboard displaying the user's latest scores, current subscription status, and participation history in draws.
- Basic Admin Draw Management: An administrative interface to manually trigger monthly draws and view a list of potential winners identified by the draw logic.
- AI Prize & Charity Content Tool: An administrative tool to generate engaging and creative descriptions for prizes and charity initiatives using generative AI, assisting with content creation.

## Style Guidelines:

- Primary color: A sophisticated, muted blue-green (#5295A9) to convey modernity and calm professionalism, without typical golf imagery.
- Background color: A very light, almost off-white hue with a subtle hint of the primary blue-green (#ECF3F5) to ensure a clean and crisp dashboard appearance.
- Accent color: A vibrant, fresh green (#50CCA3) that provides a harmonious contrast to the primary color, used for calls-to-action and important highlights, evoking growth and reward.
- Headline and body text font: 'Inter', a modern sans-serif typeface, selected for its excellent readability, neutrality, and clean appearance, suitable for displaying data and UI elements consistently.
- Use modern, minimalist line-art icons that complement the clean dashboard design, avoiding overly traditional or literal golf imagery.
- Implement a clean, responsive grid-based layout for the user dashboard and forms, ensuring optimal usability and readability across various device sizes.
- Incorporate subtle and smooth transitions for state changes and data updates on the dashboard to enhance user experience without being distracting.