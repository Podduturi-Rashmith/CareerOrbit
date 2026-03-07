import { AlignmentType, Document, Packer, Paragraph, TabStopType, TextRun } from 'docx';
import type { JobRoleCategory } from '@/lib/jobs/types';
import type { Student } from '@/lib/mock-data';

interface ResumeDocInput {
  studentName: string;
  studentEmail: string;
  roleCategory: JobRoleCategory;
  targetRoleTitle: string;
  companyName: string;
  major?: string;
  graduationYear?: string | number;
  jobDescription: string;
  baseResume?: Student['baseResume'];
}

const MIN_SUMMARY_POINTS = 12;
const MIN_EXPERIENCE_POINTS = 12;
const RESUME_FONT = 'Times New Roman';
const PAGE_TEXT_WIDTH_TWIPS = 10800; // 8.5in page width - 0.5in left/right margins

const ROLE_KIT: Record<JobRoleCategory, {
  title: string;
  summaryBullets: string[];
  skills: Record<string, string[]>;
  experience: Array<{ company: string; period: string; role: string; bullets: string[] }>;
}> = {
  'software-engineer': {
    title: 'Software Engineer',
    summaryBullets: [
      'Built backend services and REST APIs with reliable data workflows and strong system observability.',
      'Designed scalable features with performance-first database patterns and production-ready code quality.',
      'Collaborated with product and cross-functional teams to deliver robust releases on tight timelines.',
    ],
    skills: {
      'Programming Languages': ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Java'],
      'Web & API Frameworks': ['Node.js', 'Express.js', 'FastAPI', 'REST APIs'],
      'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'GitHub Actions'],
      'Databases & Caching': ['PostgreSQL', 'MySQL', 'Redis', 'MongoDB'],
      'Monitoring & Testing': ['CloudWatch', 'ELK', 'Jest', 'PyTest'],
    },
    experience: [
      {
        company: 'Product Engineering Team',
        period: 'Recent',
        role: 'Software Engineer',
        bullets: [
          'Developed scalable APIs and backend modules for role-based workflows and data-heavy operations.',
          'Refactored service boundaries to improve maintainability and deployment reliability.',
          'Implemented CI/CD checks and automated tests to reduce regressions and improve release confidence.',
        ],
      },
      {
        company: 'Platform Integration Team',
        period: 'Previous',
        role: 'Backend Engineer',
        bullets: [
          'Integrated third-party services with secure authentication and robust failure handling.',
          'Optimized SQL queries and warehouse access patterns for faster reporting and analytics.',
        ],
      },
    ],
  },
  'data-analyst': {
    title: 'Data Analyst',
    summaryBullets: [
      'Analyzed business and product data using SQL and Python to deliver measurable insights.',
      'Built dashboards and recurring reports to support leadership decisions and operational planning.',
      'Improved data quality and consistency across ETL workflows and analytics datasets.',
    ],
    skills: {
      'Programming Languages': ['Python', 'SQL', 'R'],
      'Analytics & BI': ['Tableau', 'Power BI', 'Looker Studio', 'Excel'],
      'Data Engineering': ['ETL Pipelines', 'Data Validation', 'Data Modeling'],
      'Databases': ['PostgreSQL', 'MySQL', 'Redshift', 'BigQuery'],
      'Statistics & Experimentation': ['A/B Testing', 'Hypothesis Testing', 'Forecasting'],
    },
    experience: [
      {
        company: 'Business Intelligence Team',
        period: 'Recent',
        role: 'Data Analyst',
        bullets: [
          'Created SQL-based KPI pipelines and dashboards for growth, retention, and conversion tracking.',
          'Delivered weekly analytics briefs with actionable recommendations for product and operations teams.',
          'Partnered with engineering to improve data freshness, consistency, and reporting accuracy.',
        ],
      },
      {
        company: 'Analytics Operations',
        period: 'Previous',
        role: 'Junior Data Analyst',
        bullets: [
          'Automated recurring reports and reduced manual analysis cycles using Python scripts.',
          'Validated source data quality and documented metric definitions for reliable stakeholder alignment.',
        ],
      },
    ],
  },
  'java-developer': {
    title: 'Java Developer',
    summaryBullets: [
      'Designed Java backend services with clean architecture, security best practices, and fault tolerance.',
      'Built Spring Boot microservices for high-throughput workflows and distributed integrations.',
      'Improved reliability through structured logging, observability, and test-driven development.',
    ],
    skills: {
      'Programming Languages': ['Java', 'SQL', 'Bash', 'JavaScript'],
      'Frameworks': ['Spring Boot', 'Spring Security', 'Hibernate', 'Maven'],
      'Architecture': ['Microservices', 'Event-driven Design', 'REST APIs'],
      'Databases': ['PostgreSQL', 'MySQL', 'Redis'],
      'DevOps': ['Docker', 'Jenkins', 'GitHub Actions', 'Kubernetes'],
    },
    experience: [
      {
        company: 'Core Platform Team',
        period: 'Recent',
        role: 'Java Developer',
        bullets: [
          'Implemented Spring Boot services for transactional workflows with robust authorization layers.',
          'Developed asynchronous integration handlers for third-party APIs and event streams.',
          'Improved API latency and throughput through query optimization and caching strategies.',
        ],
      },
    ],
  },
  aiml: {
    title: 'AI/ML Engineer',
    summaryBullets: [
      'Built machine learning pipelines from data preparation to model deployment and monitoring.',
      'Applied NLP and predictive modeling techniques to solve business-critical workflow problems.',
      'Collaborated with product and engineering teams to productionize AI features at scale.',
    ],
    skills: {
      'Programming Languages': ['Python', 'SQL', 'JavaScript'],
      'ML Frameworks': ['PyTorch', 'TensorFlow', 'Scikit-learn', 'XGBoost'],
      'MLOps': ['Model Versioning', 'Experiment Tracking', 'Inference Monitoring'],
      'Data Platforms': ['Spark', 'Pandas', 'AWS S3', 'Redshift'],
      'Deployment': ['FastAPI', 'Docker', 'Kubernetes', 'AWS SageMaker'],
    },
    experience: [
      {
        company: 'Applied AI Team',
        period: 'Recent',
        role: 'AI/ML Engineer',
        bullets: [
          'Trained and evaluated models for classification and ranking tasks using reproducible pipelines.',
          'Deployed inference services with API-first architecture and observability instrumentation.',
          'Improved model quality through feature engineering and experiment-driven iteration.',
        ],
      },
    ],
  },
  other: {
    title: 'Software Professional',
    summaryBullets: [
      'Strong foundation in software delivery, cross-functional collaboration, and problem solving.',
      'Experience building scalable systems with reliable testing and deployment practices.',
      'Comfortable adapting quickly to new domains, tools, and business requirements.',
    ],
    skills: {
      'Programming': ['Python', 'TypeScript', 'SQL'],
      'Platforms': ['Cloud Services', 'REST APIs', 'Databases'],
      'Engineering Practices': ['CI/CD', 'Code Review', 'Testing'],
    },
    experience: [
      {
        company: 'Engineering Team',
        period: 'Recent',
        role: 'Software Engineer',
        bullets: [
          'Delivered feature work across backend and integration systems with production stability in mind.',
          'Worked closely with stakeholders to convert business requirements into reliable technical plans.',
        ],
      },
    ],
  },
};

function heading(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text: `${text}:`, bold: true, size: 24, font: RESUME_FONT, color: '000000' })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: RESUME_FONT, color: '000000' })],
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
}

function roleFromCategory(role: JobRoleCategory) {
  return ROLE_KIT[role] || ROLE_KIT.other;
}

function expandBullets(baseBullets: string[], minCount: number, generator: (index: number) => string) {
  const output = [...baseBullets];
  while (output.length < minCount) {
    output.push(generator(output.length));
  }
  return output;
}

function roleFocusLine(role: JobRoleCategory) {
  switch (role) {
    case 'data-analyst':
      return 'analytics reporting, SQL data validation, KPI governance, and stakeholder-ready dashboards';
    case 'java-developer':
      return 'Java microservices, Spring Boot API architecture, secure integrations, and reliability engineering';
    case 'aiml':
      return 'ML model lifecycle, experimentation quality, inference performance, and production monitoring';
    case 'software-engineer':
      return 'backend systems, scalable APIs, cloud reliability, and performance-first engineering practices';
    default:
      return 'engineering execution, delivery quality, maintainability, and cross-team collaboration';
  }
}

export async function generateResumeDocxBuffer(input: ResumeDocInput): Promise<Buffer> {
  const kit = roleFromCategory(input.roleCategory);
  const focus = roleFocusLine(input.roleCategory);
  const jobDescriptionSnippet = input.jobDescription.slice(0, 260) + (input.jobDescription.length > 260 ? '...' : '');

  const sourceSummary = input.baseResume?.summaryBullets?.length ? input.baseResume.summaryBullets : kit.summaryBullets;

  const summaryBullets = expandBullets(sourceSummary, MIN_SUMMARY_POINTS, (index) => {
    const templates = [
      `Delivered complex initiatives aligned with ${focus}, converting ambiguous requirements into production-ready technical outcomes with measurable business value.`,
      `Collaborated with product managers, analytics teams, and engineering stakeholders to prioritize roadmap execution and maintain transparent communication across delivery cycles.`,
      `Improved system quality by implementing review checklists, robust test coverage, and observability instrumentation that reduced regressions and operational risk.`,
      `Optimized data and service workflows for scalability, security, and reliability, ensuring faster response times and stable performance during peak usage windows.`,
      `Contributed to architectural planning sessions, documenting tradeoffs and implementation strategies to support long-term maintainability and predictable release execution.`,
      `Mentored peers through code reviews, technical documentation, and design discussions, improving consistency of engineering standards and implementation quality.`,
    ];
    return templates[index % templates.length];
  });

  const mergedSkills = { ...kit.skills, ...(input.baseResume?.technicalSkills || {}) };

  const skillsParagraphs = Object.entries(mergedSkills).map(([group, values]) =>
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${group} - `, bold: true, font: RESUME_FONT, color: '000000' }),
        new TextRun({ text: values.join(', '), font: RESUME_FONT, color: '000000' }),
      ],
    })
  );

  const sourceExperience = input.baseResume?.experience?.length ? input.baseResume.experience : kit.experience;

  const experienceParagraphs = sourceExperience.flatMap((exp) => {
    const expandedExperienceBullets = expandBullets(exp.bullets, MIN_EXPERIENCE_POINTS, (index) => {
      const templates = [
        `Owned end-to-end delivery of initiatives focused on ${focus}, from requirement breakdown through implementation, testing, rollout, and post-release tuning.`,
        `Improved cross-system data accuracy and reliability by standardizing validation logic, reconciliation checks, and monitoring alerts across critical workflows.`,
        `Partnered with internal stakeholders to translate business expectations into technical designs, ensuring solution quality, traceability, and timeline predictability.`,
        `Strengthened security and compliance posture through structured access controls, audit-friendly logging, and disciplined handling of sensitive workflow data.`,
        `Refined deployment and release engineering processes with automated checks, rollback readiness, and production diagnostics that reduced downtime risk.`,
        `Enhanced maintainability by refactoring shared modules, documenting design rationale, and introducing reusable patterns for faster development velocity.`,
      ];
      return templates[index % templates.length];
    });

    const header = new Paragraph({
      spacing: { before: 200, after: 80 },
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: PAGE_TEXT_WIDTH_TWIPS,
        },
      ],
      children: [
        new TextRun({ text: exp.company, bold: true, font: RESUME_FONT, color: '000000' }),
        new TextRun({ text: '\t', font: RESUME_FONT, color: '000000' }),
        new TextRun({ text: exp.period, font: RESUME_FONT, color: '000000' }),
      ],
    });

    const role = new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: exp.role, font: RESUME_FONT, color: '000000' })],
    });

    const bullets = expandedExperienceBullets.map((line) => bullet(line));
    return [header, role, ...bullets];
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: RESUME_FONT,
            color: '000000',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: input.studentName, bold: true, size: 32, font: RESUME_FONT, color: '000000' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({ text: `Email: ${input.studentEmail}`, font: RESUME_FONT, color: '000000' }),
              new TextRun({ text: '   |   ', font: RESUME_FONT, color: '000000' }),
              new TextRun({ text: `Mobile: Available on request`, font: RESUME_FONT, color: '000000' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `${input.baseResume?.headline || kit.title}  |  Target Job: ${input.targetRoleTitle || kit.title}`,
                bold: true,
                font: RESUME_FONT,
                color: '000000',
              }),
            ],
          }),

          heading('PROFESSIONAL SUMMARY'),
          ...summaryBullets.map((line) => bullet(line)),
          bullet(`Tailored for ${input.companyName}: ${jobDescriptionSnippet}`),

          heading('PROFESSIONAL EXPERIENCE'),
          ...experienceParagraphs,

          heading('EDUCATIONAL DETAILS'),
          bullet(`Major: ${input.major || 'Information Systems / Related Field'}`),
          bullet(`Graduation Year: ${input.graduationYear || 'N/A'}`),

          heading('TECHNICAL SKILLS'),
          ...skillsParagraphs,
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export function makeResumeFilename(studentName: string, roleCategory: JobRoleCategory, company: string) {
  const normalizedName = studentName.replace(/\s+/g, '_');
  const normalizedRole = roleCategory.replace(/[^a-z0-9]+/gi, '_');
  const normalizedCompany = company.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${normalizedName}_${normalizedRole}_${normalizedCompany}.docx`;
}
