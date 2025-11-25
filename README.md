// Final Project - COP 5818
// Team 7
// Henry Gibson-Garcia – henry.gibson@ucf.edu
// Katherine Mendez Zambrano – ka523884@ucf.edu

# EmotiSpend 💸😊
*Track your spending and your feelings 🎭*

## Project Overview
EmotiSpend is a personal finance and behavioral FinTech prototype designed to help users understand the emotional patterns behind their spending habits. Unlike traditional budgeting apps that only categorize transactions by merchant or item, EmotiSpend captures the emotions felt at the time of purchase and visualizes them alongside spending categories. This approach gives users a deeper view of their financial behavior and encourages more intentional decision‑making.

## Features
- **User Authentication**: Secure sign up, sign in, and sign out using Supabase email/password authentication.
- **Expense Logging**: Add expenses with amount, category, valence (good/bad), emotion, intensity, and optional notes.
- **Emotion Intensity Slider**: Real‑time emoji feedback to reflect the strength of the emotion.
- **Dashboard Visualization**: Interactive pie charts showing spending by category and by emotion, built with Chart.js.
- **Transactions Table**: Sortable and filterable table of all past expenses, with edit functionality.
- **Playful UI**: Vibrant geometric background, emoji‑enhanced labels, and responsive design.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Visualization**: Chart.js
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)

## System Architecture
1. **User Interface** → Expense form captures spending and emotion data.
2. **Authentication Layer** → Supabase verifies user identity.
3. **Database Layer** → Expense data stored in PostgreSQL tables.
4. **Visualization Layer** → Chart.js renders updated charts and legends.

*(See architecture diagram in report/presentation for details.)*

## Code Structure
- `index.html` → App structure (login, expense form, dashboard)
- `style.css` → UI design and layout
- `app.js` → Authentication, expense submission, chart rendering, and logic
- `emotispendApi.js` → Helper functions for Supabase API calls

## Team Responsibilities
- **Henry**: Supabase database setup, programming foundation, API connections, helper functions.
- **Kathy**: User interface development, HTML/CSS/JS updates, design enhancements.
- **Both**: Integration of components, debugging, finalization, report writing, presentation slides, and video narration.

## Use of AI Tools
AI tools were used during development for brainstorming ideas and debugging issues with authentication and chart logic. These tools supported the workflow, but all final code and writing were completed by the team.

## How to Run
1. Clone the repository:
   ```bash
   git clone https://github.com/kmendez2707/EmotiSpend.git

