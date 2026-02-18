
        // Sample Data
        let candidates = [
            {
                id: 1,
                name: "Sarah Johnson",
                email: "sarah.j@email.com",
                phone: "+91 98765 43210",
                role: "Senior Developer",
                source: "LinkedIn",
                status: "Interview",
                experience: 5,
                skills: ["JavaScript", "React", "Node.js", "MongoDB"],
                rating: 4.5,
                appliedDate: "2025-02-01",
                notes: "Strong technical background, excellent problem-solving skills",
                timeline: [
                    { stage: "Application Received", date: "2025-02-01", status: "completed", notes: "Applied via LinkedIn" },
                    { stage: "Initial Screening", date: "2025-02-02", status: "completed", notes: "Phone screening completed - strong candidate", interviewer: "Priya Joshi" },
                    { stage: "Technical Round 1", date: "2025-02-04", status: "completed", notes: "Excellent coding skills, solved problems efficiently", interviewer: "Rahul Mehta", rating: 4.5, meetLink: "https://meet.google.com/abc-defg-hij" },
                    { stage: "Technical Round 2", date: "2025-02-06", status: "current", notes: "Scheduled for system design discussion", interviewer: "Amit Verma", meetLink: "https://meet.google.com/xyz-abcd-efg" }
                ],
                emails: [
                    { type: "Interview Invitation", subject: "Interview Invitation - Senior Developer", sentDate: "2025-02-03", status: "opened", openedDate: "2025-02-03" },
                    { type: "Status Update", subject: "Update on your application", sentDate: "2025-02-05", status: "replied", repliedDate: "2025-02-05" }
                ]
            },
            {
                id: 2,
                name: "Raj Kumar",
                email: "raj.k@email.com",
                phone: "+91 98765 43211",
                role: "DevOps Engineer",
                source: "Naukri",
                status: "Final Round",
                experience: 7,
                skills: ["AWS", "Docker", "Kubernetes", "Jenkins"],
                rating: 4.3,
                appliedDate: "2025-01-28",
                notes: "Extensive cloud experience, good cultural fit",
                timeline: [
                    { stage: "Application Received", date: "2025-01-28", status: "completed" },
                    { stage: "Initial Screening", date: "2025-01-29", status: "completed", interviewer: "HR Team" },
                    { stage: "Technical Round", date: "2025-01-31", status: "completed", interviewer: "Tech Lead", rating: 4.3 },
                    { stage: "Manager Round", date: "2025-02-03", status: "completed", interviewer: "Engineering Manager", rating: 4.5 },
                    { stage: "Final Round (Krishna)", date: "2025-02-08", status: "current", notes: "CTC discussion and cultural fit" }
                ],
                emails: [
                    { type: "Interview Invitation", sentDate: "2025-01-30", status: "opened" },
                    { type: "Final Round Invitation", sentDate: "2025-02-06", status: "opened" }
                ]
            },
            {
                id: 3,
                name: "Priya Sharma",
                email: "priya.s@email.com",
                phone: "+91 98765 43212",
                role: "UI/UX Designer",
                source: "LinkedIn",
                status: "New",
                experience: 3,
                skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
                rating: null,
                appliedDate: "2025-02-06",
                notes: "Portfolio looks promising",
                timeline: [
                    { stage: "Application Received", date: "2025-02-06", status: "completed" }
                ],
                emails: []
            },
            {
                id: 4,
                name: "Amit Patel",
                email: "amit.p@email.com",
                phone: "+91 98765 43213",
                role: "Senior Developer",
                source: "Referral",
                status: "Selected",
                experience: 6,
                skills: ["Python", "Django", "PostgreSQL", "Redis"],
                rating: 4.7,
                appliedDate: "2025-01-20",
                notes: "Referred by team member, excellent technical skills",
                timeline: [
                    { stage: "Application Received", date: "2025-01-20", status: "completed" },
                    { stage: "Technical Round", date: "2025-01-22", status: "completed", rating: 4.8 },
                    { stage: "Final Round (Rohit)", date: "2025-01-24", status: "completed", rating: 4.7 },
                    { stage: "Offer Extended", date: "2025-01-25", status: "completed" },
                    { stage: "Offer Accepted", date: "2025-01-26", status: "completed" }
                ],
                emails: [
                    { type: "Interview Invitation", sentDate: "2025-01-21", status: "opened" },
                    { type: "Selection & Offer", sentDate: "2025-01-25", status: "replied", subject: "Offer Letter - Senior Developer" }
                ]
            },
            {
                id: 5,
                name: "Neha Gupta",
                email: "neha.g@email.com",
                phone: "+91 98765 43214",
                role: "Project Manager",
                source: "Career Page",
                status: "Screening",
                experience: 8,
                skills: ["Agile", "Scrum", "JIRA", "Team Management"],
                rating: null,
                appliedDate: "2025-02-03",
                notes: "Strong leadership experience",
                timeline: [
                    { stage: "Application Received", date: "2025-02-03", status: "completed" },
                    { stage: "Initial Screening", date: "2025-02-05", status: "current", interviewer: "HR Team" }
                ],
                emails: [
                    { type: "Interview Invitation", sentDate: "2025-02-04", status: "sent" }
                ]
            },
            {
                id: 6,
                name: "Vikram Singh",
                email: "vikram.s@email.com",
                phone: "+91 98765 43215",
                role: "DevOps Engineer",
                source: "LinkedIn",
                status: "Selected",
                experience: 5,
                skills: ["GCP", "Terraform", "Ansible", "CI/CD"],
                rating: 4.6,
                appliedDate: "2025-01-25",
                notes: "Ready to join immediately",
                timeline: [
                    { stage: "Application Received", date: "2025-01-25", status: "completed" },
                    { stage: "Technical Rounds", date: "2025-01-27", status: "completed", rating: 4.6 },
                    { stage: "Final Round (Krishna)", date: "2025-01-29", status: "completed", rating: 4.7 },
                    { stage: "Selected", date: "2025-01-30", status: "completed" }
                ],
                emails: [
                    { type: "Selection & Offer", sentDate: "2025-01-30", status: "replied" }
                ]
            },
            {
                id: 7,
                name: "Anjali Reddy",
                email: "anjali.r@email.com",
                phone: "+91 98765 43216",
                role: "UI/UX Designer",
                source: "Naukri",
                status: "Interview",
                experience: 4,
                skills: ["Sketch", "InVision", "CSS", "HTML"],
                rating: 4.2,
                appliedDate: "2025-01-30",
                notes: "Creative thinking, good attention to detail",
                timeline: [
                    { stage: "Application Received", date: "2025-01-30", status: "completed" },
                    { stage: "Portfolio Review", date: "2025-02-01", status: "completed", rating: 4.0 },
                    { stage: "Design Challenge", date: "2025-02-04", status: "current" }
                ],
                emails: []
            },
            {
                id: 8,
                name: "Karthik Iyer",
                email: "karthik.i@email.com",
                phone: "+91 98765 43217",
                role: "Senior Developer",
                source: "Career Page",
                status: "Selected",
                experience: 7,
                skills: ["Java", "Spring Boot", "Microservices", "Kafka"],
                rating: 4.8,
                appliedDate: "2025-01-18",
                notes: "Exceptional technical knowledge",
                timeline: [
                    { stage: "Application Received", date: "2025-01-18", status: "completed" },
                    { stage: "Technical Rounds", date: "2025-01-20", status: "completed", rating: 4.9 },
                    { stage: "Final Round (Rohit)", date: "2025-01-22", status: "completed", rating: 4.8 },
                    { stage: "Offer Extended", date: "2025-01-23", status: "completed" }
                ],
                emails: [
                    { type: "Selection & Offer", sentDate: "2025-01-23", status: "replied" }
                ]
            }
        ];

        // Bulk upload storage
        let uploadedFiles = [];
        let screeningResults = [];
        let currentViewingCandidate = null;
        let currentViewingJobId = null;
        let activeScreeningJobId = null;
        let screeningPollTimer = null;
        let backendJobs = [];
        let backendCandidatesCache = [];
        const API_BASE_URL = (() => {
            const host = window.location.hostname;
            const isLocal = host === 'localhost' || host === '127.0.0.1';
            return isLocal ? 'http://127.0.0.1:8000' : `${window.location.origin}/api`;
        })();

        // Email Templates
        const emailTemplates = {
            rejection: {
                subject: "Application Status - {{role}} Position at Dutient",
                body: `Dear {{name}},

Thank you for taking the time to apply for the {{role}} position at Dutient and for your interest in joining our team.

After careful consideration of your application and comparing it with our current requirements, we have decided to move forward with other candidates whose qualifications more closely align with our immediate needs for this role.

We truly appreciate the time and effort you invested in the application process. Your skills and experience are impressive, and we encourage you to apply for future openings at Dutient that match your profile.

We will keep your resume on file and may reach out if a suitable opportunity arises in the future.

We wish you the very best in your job search and future career endeavors.

Best regards,
The Dutient Hiring Team`
            },
            selection: {
                subject: "Congratulations! Offer Letter - {{role}} Position at Dutient",
                body: `Dear {{name}},

Congratulations! We are delighted to extend an offer for the position of {{role}} at Dutient.

We were very impressed with your skills, experience, and the enthusiasm you demonstrated throughout the interview process. We believe you will be a valuable addition to our team.

**Offer Details:**
- Position: {{role}}
- CTC: ₹{{ctc}} per annum
- Start Date: {{startDate}}
- Reporting To: {{reportingManager}}

Please find the detailed offer letter attached to this email. We request you to review the terms and conditions and confirm your acceptance by {{acceptanceDeadline}}.

If you have any questions or need clarification on any aspect of the offer, please don't hesitate to reach out.

We're excited about the possibility of you joining the Dutient team and look forward to your positive response.

Best regards,
{{senderName}}
Dutient`
            },
            'interview-invite': {
                subject: "Interview Invitation - {{role}} Position at Dutient",
                body: `Dear {{name}},

Thank you for your interest in the {{role}} position at Dutient. We were impressed with your profile and would like to invite you for an interview.

**Interview Details:**
- Round: {{round}}
- Date: {{date}}
- Time: {{time}}
- Duration: {{duration}}
- Mode: {{mode}}
- Interviewer(s): {{interviewers}}

{{#if meetingLink}}
Meeting Link: {{meetingLink}}
{{/if}}

{{#if location}}
Location: {{location}}
{{/if}}

Please confirm your availability for the scheduled interview. If you need to reschedule, please let us know at least 24 hours in advance.

We look forward to speaking with you!

Best regards,
The Dutient Hiring Team`
            },
            'status-update': {
                subject: "Application Status Update - {{role}} Position",
                body: `Dear {{name}},

We wanted to provide you with an update on your application for the {{role}} position at Dutient.

{{statusMessage}}

We appreciate your patience throughout this process and will keep you informed of any developments.

If you have any questions, please feel free to reach out to us.

Best regards,
The Dutient Hiring Team`
            },
            'final-round': {
                subject: "Final Round Interview - {{role}} Position at Dutient",
                body: `Dear {{name}},

Congratulations on successfully completing the previous interview rounds! We would like to invite you for the final round of interview for the {{role}} position.

**Final Round Details:**
- Date: {{date}}
- Time: {{time}}
- Duration: Approximately 45-60 minutes
- Interviewer: Krishna/Rohit (Co-founders)
- Mode: {{mode}}

This round will focus on:
- Role clarity and expectations
- Compensation discussion and CTC negotiation
- Cultural fit and company values alignment
- Long-term career goals

Please come prepared with any questions you may have about the role, team, or company.

Looking forward to our conversation!

Best regards,
The Dutient Hiring Team`
            }
        };

