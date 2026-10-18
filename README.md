# SkillWatch AI 🚀
### AI-Powered Training Centre Monitoring & Infrastructure Compliance Platform

<p align="center">
  <strong>Smart India Hackathon 2026 | Problem Statement: SIH26245</strong>
</p>

SkillWatch AI is a technology-driven platform designed to improve training centre monitoring, attendance management, infrastructure inspections, and compliance tracking. The project aims to help stakeholders monitor training centre operations through a centralized, intuitive, and data-driven interface.

Developed for the **Smart India Hackathon 2026 college-level internal hackathon**, SkillWatch AI secured **5th place** in the event.

---

## 🏆 Achievement

**5th Place — College-Level Internal Hackathon**

Our team presented SkillWatch AI as part of our college's internal hackathon for Smart India Hackathon 2026. The experience strengthened our technical implementation, teamwork, and problem-solving approach while motivating us to continue improving the solution.

---

## 🎯 Problem Statement

Training centres require effective ways to monitor attendance, assess infrastructure, track inspections, and maintain compliance records. Manual processes can make monitoring time-consuming and make it difficult to identify issues quickly.

SkillWatch AI aims to address these challenges through a centralized digital platform that supports monitoring, reporting, and data-driven decision-making.

---

## 💡 Our Solution

SkillWatch AI is designed to support training centre administrators and authorized stakeholders through features such as:

- **Dashboard & Monitoring:** Centralized access to relevant training centre information.
- **Attendance Management:** Support for attendance tracking and monitoring workflows.
- **Infrastructure Inspections:** Digital inspection and compliance tracking.
- **Anomaly Detection:** Rule-based detection of potential irregularities where implemented.
- **Data Management:** Structured storage and retrieval of application data.
- **Access Control:** Role-based access and authentication where configured.

*Feature availability depends on the current implementation and deployment configuration.*

---

## ✨ Key Objectives

- Improve visibility into training centre operations.
- Simplify attendance and inspection workflows.
- Support infrastructure compliance monitoring.
- Identify potential irregularities for further review.
- Provide a scalable foundation for future enhancements.
- Deliver a user-friendly experience for authorized users.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface development |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Supabase | Backend services and database integration |
| PostgreSQL | Relational database through Supabase |
| Git & GitHub | Version control and collaboration |
| Vercel | Web application deployment, if configured |

---

## 🏗️ Project Architecture

The application follows a modern web application architecture:

1. **Frontend:** React and TypeScript provide the user interface.
2. **Backend Services:** Supabase provides configured backend capabilities.
3. **Database:** PostgreSQL stores application data according to the implemented schema.
4. **Authentication & Authorization:** Configured authentication and database security policies control access where implemented.
5. **Deployment:** Vercel can host the frontend for public or authorized access, depending on deployment settings.

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following:

- Node.js — a current supported LTS version
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tgnaneshwar007-cell/skillwatch-ai.git
cd skillwatch-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file based on the example provided in the repository.

For example, if the project uses `.env.example`:

```bash
cp .env.example .env.local
```

On Windows, you can also create `.env.local` manually by copying `.env.example`.

Add the appropriate values from your Supabase project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Use the exact variable names expected by the application.

**Security:** Never commit `.env.local`, private API keys, database passwords, or Supabase secret/service-role keys to GitHub. Frontend environment variables prefixed with `VITE_` are exposed to the browser, so they must never contain private secrets. Configure Row Level Security (RLS) and appropriate database permissions.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

### 5. Build for production

```bash
npm run build
```

To preview the production build locally, run:

```bash
npm run preview
```

---

## ⚙️ Environment Configuration

Before running the application, ensure that:

- The Supabase project URL is correct.
- The publishable key is configured correctly.
- Required database tables and policies have been set up.
- Any additional environment variables required by the code are configured.
- Private credentials remain outside version control.

Do not publish real environment values in screenshots, documentation, issue reports, or public commits.

---

## 🔐 Security Considerations

Security is an important part of a monitoring platform.

- Use environment variables for configuration.
- Never expose private backend credentials in frontend code.
- Enable and verify Row Level Security for relevant Supabase tables.
- Apply least-privilege access policies.
- Validate user input and authorization on trusted backend or database layers.
- Review deployment access settings before sharing the application publicly.

---

## 📂 Repository Structure

The project follows a typical React and Vite structure. Exact folders may vary depending on the current implementation.

```text
skillwatch-ai/
├── public/             # Static public assets
├── src/                # Application source code
├── .env.example        # Environment variable template
├── .gitignore          # Files excluded from Git
├── package.json        # Dependencies and scripts
├── package-lock.json   # Locked npm dependency versions
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

---

## 🌐 Live Demo

**Live Application:** https://skillwatch-ai.vercel.app/login

**Source Code:** [GitHub Repository](https://github.com/tgnaneshwar007-cell/skillwatch-ai)

If the application requires authentication or is not publicly deployed, update this section with the appropriate access instructions instead.

---

## 🗺️ Future Improvements

Potential future enhancements include:

- Advanced analytics and reporting.
- Improved monitoring dashboards.
- More comprehensive inspection workflows.
- Notifications for important compliance issues.
- Enhanced accessibility and responsive design.
- Expanded testing, monitoring, and security validation.
- Additional integrations based on stakeholder requirements.

---

## 👥 Team & Acknowledgements

Developed collaboratively for the Smart India Hackathon 2026 college-level internal hackathon.

We thank our college, mentors, organizers, and fellow participants for providing an opportunity to innovate, collaborate, and solve real-world problems through technology.

---

## 📌 Project Status

**Current Status:** College-level hackathon project under continued development.

**Achievement:** 5th Place — College-Level Internal Hackathon.

Progression to subsequent SIH stages is subject to the official selection process.

---

## 📄 License

No license has been specified yet. Unless a license is added, others generally do not receive permission to reuse, distribute, or modify the project's copyrighted code beyond rights granted by applicable law.

---

<p align="center">
  <strong>SkillWatch AI — Building smarter, more transparent training centre monitoring.</strong>
</p>
