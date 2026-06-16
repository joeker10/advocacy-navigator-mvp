import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'NAVIGATE_ADMIN';

const DEFAULT_ARTICLES = [
  {
    title: "Hawaii IEP Timelines: Enforcing HAR Chapter 60",
    category: "Legal Framework",
    date: "June 2026",
    excerpt: "Under Hawaii administrative rules, the Department of Education has strict timeline mandates for evaluations and IEP reviews. Learn how to identify and flag delays.",
    content: `Under Hawaii Administrative Rules (HAR) Title 8, Chapter 60, parents and students with disabilities are afforded critical procedural safeguards. Among the most important of these safeguards are strict timelines that govern the entire special education process. In special education advocacy, timelines are not mere guidelines; they are legally binding mandates. When a school district fails to meet these timelines, it constitutes a procedural violation of the Individuals with Disabilities Education Act (IDEA) and HAR Chapter 60, which can result in a denial of a Free Appropriate Public Education (FAPE) if it impedes the parent's opportunity to participate in the decision-making process.

**1. The Initial Referral and Consent Timeline**
The timeline begins when a parent, teacher, or advocate submits a written request for a special education evaluation to the school principal or coordinator. Upon receiving this request, the school team must convene to decide whether an evaluation is warranted. If the school proposes to evaluate, they must provide the parent with a Prior Written Notice (PWN) and request written, signed parental consent for the evaluation.

**2. The 60-Calendar-Day Evaluation Timeline (HAR §8-60-36)**
Once the school receives the signed written consent for evaluation from the parent, the clock starts. Under HAR §8-60-36, the Department of Education (DOE) has exactly 60 calendar days to:
- Complete all standardized assessments and specialty evaluations (e.g., psychological, speech-language, occupational therapy, behavioral).
- Compile all evaluation reports.
- Hold the eligibility determination meeting with the IEP team (which includes the parents) to decide whether the child qualifies for services.

*Crucial Advocacy Note:* Hawaii law uses "calendar days," not "school days." The 60-day limit includes weekends, holidays, and summer breaks. The only legal exceptions that pause this timeline are:
- If the parent repeatedly fails or refuses to produce the child for the evaluation.
- If the student transfers to another school district after the evaluation timeframe has begun, and the new school is making sufficient progress to ensure prompt completion.

**3. The 30-Day IEP Development Timeline**
Once a child is determined eligible for special education and related services, the IEP team has exactly 30 calendar days to meet and develop the initial Individualized Education Program (IEP). Services must be implemented "as soon as possible" following the meeting, typically within 10 school days.

**4. The 12-Month IEP Annual Review Timeline**
Every IEP must be reviewed and updated at least once every 12 months. This is a strict deadline. The school must send meeting notices early enough to ensure parents have the opportunity to participate and schedule the meeting at a mutually agreed-upon time and place.

**5. The 3-Year Reevaluation Timeline (Triennial)**
A reevaluation must occur at least once every three years to determine if the student continues to have a disability and to assess their ongoing educational needs, unless the parent and the school team agree in writing that a reevaluation is unnecessary.

**Advocacy Actions for Parents:**
- **Create a Paper Trail:** Always submit evaluation requests, meeting requests, and consents in writing. Use email or get a stamped, dated receipt for physical documents.
- **Calculate Deadlines Immediately:** The day after the school receives your signed consent is Day 1. Count forward 60 days on a calendar and note this date.
- **Write a Notice of Delay:** If the school has not scheduled the eligibility meeting by Day 50, send a polite written reminder to the coordinator and principal.
- **Escalate Procedural Failures:** If the 60-day timeline is breached, write a formal letter to the Complex Area Superintendent. If the delay significantly impacts your child's education, you have the right to file a State Written Complaint or request Due Process.`
  },
  {
    title: "SMART IEP Goals: A Parent's Practical Guide",
    category: "Advocacy Guide",
    date: "May 2026",
    excerpt: "Make sure your child's annual IEP goals are Specific, Measurable, Achievable, Relevant, and Time-Bound. Use these checklist markers in your review.",
    content: `An Individualized Education Program (IEP) is only as strong as its annual goals. Goals define what skills your child will work on over the next 12 months, how progress will be measured, and how the school will be held accountable. Under HAR Chapter 60, IEP goals must address the child's academic and functional needs resulting from the disability to enable the child to progress in the general education curriculum. To ensure goals are enforceable and high-quality, advocates recommend using the SMART framework.

**1. The Foundation: Present Levels (PLAAFP)**
You cannot write a SMART goal without a baseline. The IEP team must first write the Present Levels of Academic Achievement and Functional Performance (PLAAFP). The PLAAFP must contain objective, measurable data—such as reading levels, math test scores, or behavioral tallies—identifying exactly where your child is currently performing. The annual goal must start from this baseline.

**2. Breaking Down the SMART Framework:**

- **S - Specific:** The goal must target a specific skill or behavior. Vague statements like "will improve reading skills" are not specific. Instead, target the sub-skill: "will decode two-syllable words with consonant-vowel-consonant silent-e patterns" or "will write a three-sentence paragraph with correct capitalization."
- **M - Measurable:** You must be able to count or observe the skill. Avoid words like "understand," "appreciate," or "know," which cannot be measured. Use measurable verbs: "will read," "will write," "will compute," or "will transition." The goal must state the measurement method: "as measured by teacher-kept data logs, weekly spelling spelling probes, or bi-weekly reading assessments."
- **A - Action-oriented:** The goal must describe what the student will do. E.g., "The student will independently initiate a transition..." rather than "The student will be transitioned..."
- **R - Realistic and Relevant:** The goal must be challenging enough to close the achievement gap, but realistic enough for the child to achieve within one school year. It must directly align with the deficits identified in your child's evaluations.
- **T - Time-Bound:** The goal must state when it will be completed (typically 12 months from the IEP date) and include progress-monitoring intervals (e.g., "progress reports will be provided to parents quarterly matching report card intervals").

**SMART Goal Template for Parents:**
"By [Date], when given [Specific Accommodations/Support], [Student Name] will [Measurable Action/Skill] from a baseline of [Current Level] to [Target Mastery Level] with [Accuracy Rate/Frequency] across [Number of Trials] as measured by [Evaluation Tool/Method]."

**Concrete Examples Across Domains:**

*   **Reading Comprehension Goal:**
    "By June 2027, when given a grade-level informational passage and a graphic organizer, the student will identify the main idea and list three supporting details with 85% accuracy in 4 out of 5 consecutive weekly probes, as measured by teacher-compiled data sheets."
*   **Math Calculation Goal:**
    "By May 2027, when given a worksheet of 20 double-digit addition problems requiring regrouping, the student will compute the answers with 90% accuracy across 3 consecutive weekly math probes, as measured by student work portfolios."
*   **Speech and Language Goal:**
    "By April 2027, during structured conversation with peers, the student will independently produce the /l/ and /r/ phonemes in all word positions with 80% accuracy across 3 consecutive speech therapy sessions, as measured by therapist logs."
*   **Behavioral / Self-Regulation Goal:**
    "By March 2027, when transitioning between activities, the student will follow visual schedules and transition to the next task with no more than 1 verbal prompt within 3 minutes, in 4 out of 5 daily transitions across 2 consecutive weeks, as measured by classroom behavioral charts."`
  },
  {
    title: "Recording Meetings in Hawaii: Consent Regulations",
    category: "Procedural Rights",
    date: "April 2026",
    excerpt: "Hawaii operates under a 'one-party consent' rule for recording. Learn the best practices for recording your next IEP or 504 meeting to keep clean records.",
    content: `Navigating an IEP or 504 meeting can be an overwhelming experience for parents. In the heat of discussion, agreements are made, disagreements are aired, and critical details can easily be missed or misremembered. Audio-recording these meetings is one of the most effective strategies parents can use to preserve a complete, objective record of what transpired. However, to maintain a constructive relationship with the school team, it is essential to understand the legal framework and professional strategies surrounding recording in Hawaii.

**1. The Legal Framework: Hawaii One-Party Consent**
Hawaii is a "one-party consent" state under Hawaii Revised Statutes (HRS) §803-42. This law dictates that it is legally permissible to record an oral conversation as long as at least one party to the conversation consents. Because you, the parent, are a party to the meeting and consent to the recording, you have a legal right to record. You do not require the permission of the school staff or principal to make the recording under state wiretapping laws.

**2. Board of Education and School Policies**
While state law permits recording, the Hawaii Department of Education (DOE) and individual school administrations maintain policies to balance parental rights with staff expectations of workplace privacy. Standard school board guidelines generally request that parents provide advance notification if they intend to record a meeting.
- **Notice of Intent:** Best practices for parent advocates recommend sending a written notice of intent to record to the school principal and IEP coordinator at least 24 to 48 hours before the scheduled meeting.
- **Notice Template:** "Dear IEP Coordinator, I am writing to notify you that I will be audio-recording our upcoming IEP meeting on [Date] to ensure my personal records are accurate and to help me review the team's educational recommendations at home. Thank you."

**3. The School's Response: Reciprocal Recording**
Once you notify the school of your intent to record, the school team will almost always arrange to set up their own recording device. This is standard practice and should not be viewed as adversarial. Reciprocal recording ensures that both you and the school have access to an identical, untampered audio file, which protects the integrity of the record for both sides.

**4. Advocacy Benefits of Audio-Recording:**
- **Accurate Transcripts & Minutes:** Official IEP meeting notes are often summarized and may omit key comments, parent concerns, or verbal agreements. Having an audio record allows you to compare the school's written notes against the actual audio and submit written amendments for any discrepancies.
- **Prior Written Notice (PWN) Enforcement:** Under HAR §8-60-58, the school must document any refused accommodations or services in writing. If a coordinator verbally refuses a service at the table but fails to document it in the PWN, your audio recording is concrete proof of the refusal.
- **Reduces Cognitive Load:** Knowing the meeting is recorded allows you to actively participate, ask questions, and listen to the team's ideas, rather than stressing over taking perfect, fast-paced notes.
- **Sharing with Experts:** You can share the audio file with private advocates, therapists, or attorneys who could not attend the meeting, giving them raw context on how school decisions were made.`
  }
];

export async function GET(req: NextRequest) {
  try {
    // Sync/update any legacy test post in the database to be the new PWN article
    const testPost = await prisma.post.findFirst({
      where: { title: "Test Post Title" }
    });
    if (testPost) {
      await prisma.post.update({
        where: { id: testPost.id },
        data: {
          title: "Prior Written Notice (PWN): The Parent's Legal Shield",
          category: "Procedural Rights",
          date: "June 2026",
          excerpt: "Prior Written Notice (PWN) is one of the most powerful procedural safeguards in special education. Learn why it is critical and view concrete examples of proposals and refusals under HAR Chapter 60.",
          content: `Under the Individuals with Disabilities Education Act (IDEA) and Hawaii Administrative Rules (HAR) §8-60-58, Prior Written Notice (PWN) is a fundamental procedural safeguard designed to ensure parents are fully informed partners in their child's educational planning. The school must provide a PWN to parents a reasonable time before proposing or refusing to initiate or change the identification, evaluation, or educational placement of a student, or the provision of a Free Appropriate Public Education (FAPE). 

Many parents mistakenly believe that decisions are finalized only when an IEP is signed. In reality, the PWN is the official legal record of the school's decisions. It acts as an advocate's shield, capturing the "why" behind every proposal or refusal. A legally compliant PWN must contain: a description of the action proposed or refused; an explanation of why the action was taken; a description of each evaluation, assessment, or record used as a basis; a statement of procedural safeguards; and descriptions of other options considered and why they were rejected.

**Why is PWN so critical?**
Without a PWN, parents cannot effectively challenge school decisions in mediation or due process. It forces the school to base their decisions on objective data and prevents them from unilaterally changing services or placements without prior notification. If a school representative verbally promises or denies a service during an IEP meeting, it is not legally binding until it is written into a PWN.

**Example 1: PWN for a Proposal (Initiating Services)**
*   **Action Proposed:** The Department proposes to initiate twice-weekly occupational therapy (OT) services for 30 minutes per session in the general education setting.
*   **Reason for Proposal:** The student's recent fine motor evaluation dated May 14, 2026, indicated significant deficits in bilateral coordination and handwriting speed, impacting their ability to complete grade-level written assignments.
*   **Data Used:** Occupational Therapy Evaluation Report (dated 5/14/2026), classroom work samples, and teacher observation logs.
*   **Options Rejected:** Weekly 30-minute OT session. This was rejected because the evaluation data indicates the student requires more frequent, intensive direct instruction to meet their IEP handwriting goals.

**Example 2: PWN for a Refusal (Denying an Accommodation)**
*   **Action Refused:** The Department refuses the parent's request to provide a dedicated 1-on-1 full-time educational assistant (EA) for behavioral support.
*   **Reason for Refusal:** The school team's Functional Behavioral Assessment (FBA) conducted from April 1 to April 30, 2026, demonstrates that the student's behaviors can be successfully managed in the general classroom using the existing Behavior Intervention Plan (BIP), which includes sensory breaks and visual schedules. Providing an EA would unnecessarily restrict the student's independence and peer interaction.
*   **Data Used:** FBA data sheets, behavior log entries, and counselor reports.
*   **Options Rejected:** Granting a part-time EA. This was rejected because data shows that consistent implementation of the BIP by the regular education staff is sufficient, and adding an additional adult facilitator would lead to prompt dependency.`
        }
      });
    }

    // Sync default articles to ensure any updates in the codebase are written to the database
    for (const defArt of DEFAULT_ARTICLES) {
      const existing = await prisma.post.findFirst({
        where: { title: defArt.title }
      });
      if (existing) {
        await prisma.post.update({
          where: { id: existing.id },
          data: {
            category: defArt.category,
            excerpt: defArt.excerpt,
            content: defArt.content,
            date: defArt.date
          }
        });
      } else {
        await prisma.post.create({
          data: defArt
        });
      }
    }

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });

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

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // Check passcode authorization from headers
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (passcodeHeader !== ADMIN_PASSCODE) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing article ID parameter" }, { status: 400 });
    }

    await prisma.post.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Article deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post: " + error.message }, { status: 500 });
  }
}
