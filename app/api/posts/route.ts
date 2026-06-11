import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_PASSCODE = 'NAVIGATE_ADMIN';

const DEFAULT_ARTICLES = [
  {
    title: "Hawaii IEP Timelines: Enforcing HAR Chapter 60",
    category: "Legal Framework",
    date: "June 2026",
    excerpt: "Under Hawaii administrative rules, the Department of Education has strict timeline mandates for evaluations and IEP reviews. Learn how to identify and flag delays.",
    content: `Under Hawaii Administrative Rules (HAR) Chapter 60, parents have explicit procedural protections. 

Key Timelines to Monitor:
1. **Initial Evaluation Timeline:** Once you provide written consent for evaluation, the school has exactly 60 calendar days to complete all assessments and hold the eligibility determination meeting.
2. **Reevaluations:** Must occur at least once every three years, unless the parent and the school agree it is unnecessary. It cannot occur more than once a year unless agreed.
3. **IEP Development:** Once eligibility is established, the team must meet to formulate the IEP within 30 calendar days.
4. **IEP Annual Review:** The IEP must be reviewed and updated at least once every 12 months.

If a school fails to meet these dates, it constitutes a procedural violation of the Individuals with Disabilities Education Act (IDEA) and HAR Chapter 60. Keep a detailed log of all written request submissions to document compliance timelines.`
  },
  {
    title: "SMART IEP Goals: A Parent's Practical Guide",
    category: "Advocacy Guide",
    date: "May 2026",
    excerpt: "Make sure your child's annual IEP goals are Specific, Measurable, Achievable, Relevant, and Time-Bound. Use these checklist markers in your review.",
    content: `Ensure your child's educational targets are clear and enforceable. Avoid ambiguous phrasing like 'will improve reading skills.'

Use the SMART Framework:
*   **Specific:** Name the exact skill area (e.g., 'decoding multi-syllabic words' rather than 'reading').
*   **Measurable:** Establish how progress is evaluated (e.g., 'with 80% accuracy in 4 out of 5 trials').
*   **Achievable:** The goal must challenge the student but remain realistic given their present levels of performance (PLEP).
*   **Relevant:** Directly address needs identified in evaluation reports.
*   **Time-bound:** State the date by which the goal will be met (typically 1 year).

*Example Goal:* 'By June 2027, when given a grade-level list of 20 multi-syllabic words, the student will decode them with 85% accuracy in 3 consecutive weekly probes as measured by teacher-kept records.'`
  },
  {
    title: "Recording Meetings in Hawaii: Consent Regulations",
    category: "Procedural Rights",
    date: "April 2026",
    excerpt: "Hawaii operates under a 'one-party consent' rule for recording. Learn the best practices for recording your next IEP or 504 meeting to keep clean records.",
    content: `In Hawaii, under state wiretapping laws, recording audio is permissible if at least one party consents. Since you, the parent, consent to the recording, you have a legal right to record.

However, from an advocacy standpoint, best practices recommend:
1.  **Written Notification:** Inform the school team in writing 24-48 hours before the meeting that you intend to audio-record. This keeps relationships constructive.
2.  **Reciprocity:** If you record, the school will likely set up their own recording device. This ensures both parties have access to identical audio logs.
3.  **Meeting Minutes Integration:** Transcripts or recordings do not replace the official meeting notes. Use your recordings to verify that all verbal accommodations and service minutes agreed to are accurately reflected in the final written IEP document before signing.`
  }
];

export async function GET(req: NextRequest) {
  try {
    let posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Seed default articles if none exist in the database
    if (posts.length === 0) {
      await prisma.post.createMany({
        data: DEFAULT_ARTICLES
      });
      posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, excerpt, content, date, passcode } = body;
    
    // Check passcode authorization from headers or request body
    const passcodeHeader = req.headers.get('x-admin-passcode');
    if (passcode !== ADMIN_PASSCODE && passcodeHeader !== ADMIN_PASSCODE) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passcode' }, { status: 401 });
    }

    if (!title || !category || !excerpt || !content || !date) {
      return NextResponse.json({ error: 'Missing required fields (title, category, excerpt, content, date)' }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        category,
        excerpt,
        content,
        date
      }
    });

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post: ' + error.message }, { status: 500 });
  }
}
