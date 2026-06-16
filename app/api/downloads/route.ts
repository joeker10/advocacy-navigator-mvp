import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'NAVIGATE_ADMIN';

const DEFAULT_RESOURCES = [
  {
    title: "IEP Evaluation Request Template",
    description: "A formal written request template to initiate a special education eligibility evaluation under HAR Chapter 60.",
    fileName: "IEP_Evaluation_Request_Template.txt",
    fileContent: `To: [Principal Name]
School: [School Name]
Address: [School Address]

RE: Written Request for Special Education Evaluation / Section 54 eligibility
Student Name: [Child Name]
Date of Birth: [DOB]
Grade: [Grade]

Dear Principal,

I am writing to formally request a comprehensive educational evaluation for my child, [Child Name], to determine eligibility for special education services and related services under the Individuals with Disabilities Education Act (IDEA) and Hawaii Administrative Rules (HAR) Chapter 60.

I am requesting this evaluation because:
[List observations here, e.g. struggles with reading fluency, fine motor difficulties, speech delay, behavioral struggles]

I understand that under HAR Chapter 60, the Department of Education has exactly 60 calendar days from the date they receive my signed written consent to complete all evaluations and convene the eligibility determination meeting.

Please provide the Consent for Evaluation forms as soon as possible so we may proceed.

Sincerely,

_________________________________________
[Parent/Guardian Name]
Date: [Current Date]
Email: [Your Email]
Phone: [Your Phone]`
  },
  {
    title: "IEP Meeting Preparation Checklist",
    description: "Keep track of milestones before, during, and after your child's IEP meeting to ensure all legal provisions are enforced.",
    fileName: "IEP_Meeting_Checklist.txt",
    fileContent: `SPECIAL EDUCATION NAVIGATOR: COMPREHENSIVE IEP MEETING CHECKLIST
Statutory Standard: HAR Chapter 60 / Individuals with Disabilities Education Act (IDEA)

1. PREPARATION PHASE (14 to 30 Days Prior)
[ ] REVIEW PRIOR IEPs & EVALUATIONS: Gather your child's current IEP, most recent 3-year reevaluation reports, progress reports, and report cards. Compare progress metrics.
[ ] SUBMIT WRITTEN RECORD REQUEST (HAR §8-60-56 / §8-60-45): Request all draft evaluation reports, draft IEP draft matrices, and coordinator notes in writing. Schools must provide access to educational records without unnecessary delay. Aim to obtain these at least 3 to 5 calendar days before the IEP meeting.
[ ] DEFINE STRENGTHS, CONCERNS, AND VISION: Document your child's out-of-school strengths, hobbies, and social capabilities. Write down your academic, social, emotional, and independent living goals.
[ ] COLLECT OBJECTIVE DATA: Gather work samples, independent evaluations, private therapy reports (speech, occupational, behavioral), and medical documentation.
[ ] FORMULATE ACCOMMODATION REQUESTS: Create a detailed list of classroom accommodations, testing modifications, assistive technology (AT), and specialized transportation required.
[ ] ARRANGE ADVOCACY SUPPORT (HAR §8-60-45(a)(6)): Invite individuals with knowledge or special expertise regarding your child (e.g., an advocate, relative, therapist, or friend) in writing.
[ ] RECORDING NOTICE (24-Hour Notice Rule): If you plan to audio-record the meeting, submit written notice to the school principal and IEP coordinator at least 24 hours before the meeting start time.

2. ACTIVE IEP MEETING PHASE (At the Table)
[ ] TEAM COMPOSITION VERIFICATION (HAR §8-60-45): Ensure all required members are present: Parent/Guardian, General Education Teacher (if student participates in regular class environment), Special Education Teacher, Representative of the public agency (LEAC coordinator with power to commit funding/resources), and an individual qualified to interpret evaluations.
[ ] REVIEW PRESENT LEVELS (PLAAFP): Verify the Present Levels of Academic Achievement and Functional Performance contain specific, objective baseline data (standardized test scores, reading levels, behavioral tallies) rather than subjective teacher commentary.
[ ] ALIGN GOALS TO NEEDS: Check that every single academic, functional, or behavioral need identified in the evaluation reports has a matching, measurable Annual Goal.
[ ] CONSTRUCT SMART GOALS: Ensure each goal is Specific, Measurable, Action-oriented, Realistic, and Time-bound. Every goal must specify how progress will be measured and how frequently parents will receive progress reports.
[ ] SPECIFY ACCOMMODATIONS: Avoid vague qualifiers like "as needed" or "when necessary." Ensure accommodations are explicit: e.g., "Frequent breaks (5 minutes for every 20 minutes of instruction)," "Preferential seating in front row near teacher," or "Graphic organizers for writing assignments over 1 paragraph."
[ ] CONFIRM SERVICE GRID DETAILS (Related Services): Examine service frequencies, durations, and locations. Ensure services (Speech Therapy, Occupational Therapy, Counseling, etc.) are written as exact amounts (e.g., "30 minutes, 2 times per week") and clarify the setting: General Education (Inclusion) vs. Special Education (Pull-out).
[ ] REQUEST LEAST RESTRICTIVE ENVIRONMENT (LRE) JUSTIFICATION: If the school proposes placing your child in a separate setting for any portion of the day, verify that they provide a data-backed explanation of why education in the regular classroom with supplementary aids/services cannot be achieved.

3. POST-MEETING & COMPLIANCE PHASE
[ ] OBTAIN MEETING MINUTES: Request a copy of the official IEP meeting minutes/notes before leaving or immediately after. Review them for omissions or mischaracterizations of your statements. Submit written corrections for any inaccuracies.
[ ] PRIOR WRITTEN NOTICE (PWN) INGESTION (HAR §8-60-58): Request that any school refusals (e.g., refusal to grant an accommodation, service, or evaluation) be explicitly documented in the PWN. The PWN must explain: (1) what the school proposed or refused, (2) why, (3) what options were considered, and (4) what data/evaluations were used as the basis.
[ ] EXERCISE PARENTAL CONSENT RIGHTS: In Hawaii, you are not obligated to sign consent for initial placement or services on the spot. Take the complete IEP draft home to review carefully with your support network before signing.
[ ] ESTABLISH AN IEP STORAGE VAULT: Keep physical and digital binders of all draft versions, finalized signed copies, PWNs, meeting notices, and correspondence sorted chronologically.
[ ] MONITORING PROGRESS REPORTS: Track the school's periodic progress reports (typically sent alongside report cards). If progress is not being made toward annual goals, request an IEP team meeting to review and revise.`
  },
  {
    title: "HAR Chapter 60 Reference Sheet",
    description: "A quick-glance reference guide outlining the key state administrative codes governing special education in Hawaii.",
    fileName: "HAR_Chapter_60_Reference.txt",
    fileContent: `Hawaii Administrative Rules (HAR) Title 8, Department of Education, Chapter 60
PROVISION OF A FREE APPROPRIATE PUBLIC EDUCATION FOR A STUDENT WITH A DISABILITY

SECTION 1: FOUNDATION AND MANDATE
- HAR §8-60-1 & §8-60-3: Free Appropriate Public Education (FAPE)
  * Every child with a disability in the State of Hawaii, aged 3 through 21 (inclusive), is entitled to a free appropriate public education.
  * FAPE must be provided at public expense, under public supervision, and without charge. It must meet state educational standards and conform to an individualized education program (IEP) that meets federal and state specifications.
- HAR §8-60-19: Child Find Mandate
  * The Department of Education (DOE) has an active, continuous obligation to identify, locate, and evaluate all children residing in Hawaii who have disabilities and are in need of special education and related services, including children attending private schools, highly mobile children, and homeless children.

SECTION 2: EVALUATIONS AND TIMELINES
- HAR §8-60-36: Initial Evaluations and Timelines
  * CRITICAL TIMELINE: Once the school receives written, signed parent consent for an initial evaluation, the Department has exactly 60 CALENDAR DAYS to complete all assessments, compile evaluation reports, determine eligibility, and convene the eligibility/IEP meeting.
  * Exception: The timeline does not apply if the parent repeatedly fails or refuses to produce the child for evaluation, or if the student enrolls in another school district after the timeframe has begun.
- HAR §8-60-35: Reevaluations
  * Reevaluations must occur at least once every three years (triennial review) unless the parent and the school agree that a reevaluation is unnecessary.
  * Reevaluations may not occur more than once a year, unless the parent and the Department agree otherwise.
- HAR §8-60-56: Independent Educational Evaluation (IEE)
  * If a parent disagrees with an evaluation completed by the Department, they have the right to request an IEE at public expense.
  * Upon receiving this request, the school must, without unnecessary delay, either:
    1. Agree to pay for the independent evaluation at public expense.
    2. File a Due Process Complaint to request a hearing to prove that its own evaluation is appropriate.
  * If the final hearing decision is that the Department's evaluation is appropriate, the parent still has the right to an IEE, but not at public expense (the parent must pay).

SECTION 3: THE IEP TEAM AND PARENT PARTICIPATION
- HAR §8-60-45: IEP Team Composition
  * The school must ensure that the IEP team includes:
    1. The parent(s) or guardian of the student.
    2. At least one regular education teacher of the student (if the student is, or may be, participating in the regular education environment).
    3. At least one special education teacher or special education provider of the student.
    4. A representative of the public agency (LEAC) who is qualified to provide/supervise special education, is knowledgeable about the general education curriculum, and is authorized to commit agency resources (funding and staffing).
    5. An individual who can interpret the instructional implications of evaluation results (may be one of the teachers or school psychologist).
    6. At the discretion of the parent or the school, other individuals who have knowledge or special expertise regarding the student.
    7. Whenever appropriate, the student.
- HAR §8-60-46: Parent Participation
  * The Department must take steps to ensure that one or both parents are present at each IEP meeting or are afforded the opportunity to participate.
  * This includes: (1) notifying parents of the meeting early enough to ensure they will have an opportunity to attend, and (2) scheduling the meeting at a mutually agreed-on time and place.
  * If neither parent can attend, the school must use other methods to ensure parent participation, including individual or conference telephone calls.

SECTION 4: PROCEDURAL SAFEGUARDS AND PRIOR WRITTEN NOTICE
- HAR §8-60-58: Prior Written Notice (PWN)
  * The school must provide parents with written notice a reasonable time BEFORE the Department:
    1. Proposes to initiate or change the identification, evaluation, or educational placement of the student, or the provision of FAPE.
    2. Refuses to initiate or change the identification, evaluation, or educational placement of the student, or the provision of FAPE.
  * Content of PWN: The notice must be written in language understandable to the general public, and must contain:
    - A description of the action proposed or refused by the agency.
    - An explanation of why the agency proposes or refuses to take the action.
    - A description of each evaluation procedure, assessment, record, or report the agency used as a basis for the proposed or refused action.
    - A statement that the parents have protection under the procedural safeguards.
    - A description of other options that the IEP team considered and the reasons why those options were rejected.
    - A description of other factors that are relevant to the agency's proposal or refusal.
- HAR §8-60-72: "Stay-Put" (Student's Placement Pending Due Process)
  * During the pendency of any administrative (due process) or judicial proceeding, unless the State and the parents agree otherwise, the student must remain in the current educational placement. This protects the student from unilateral displacement or changes in services by the school while disputes are being resolved.`
  }
];

export async function GET(req: NextRequest) {
  try {
    // Sync default resources to ensure any updates in the codebase are written to the database
    for (const defRes of DEFAULT_RESOURCES) {
      const existing = await prisma.resource.findFirst({
        where: { fileName: defRes.fileName }
      });
      if (existing) {
        await prisma.resource.update({
          where: { id: existing.id },
          data: {
            title: defRes.title,
            description: defRes.description,
            fileContent: defRes.fileContent
          }
        });
      } else {
        await prisma.resource.create({
          data: defRes
        });
      }
    }

    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, resources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, fileName, fileContent, passcode } = body;

    // Check passcode authorization from headers or request body
    const passcodeHeader = req.headers.get('x-admin-passcode');
    if (passcode !== ADMIN_PASSCODE && passcodeHeader !== ADMIN_PASSCODE) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin passcode' }, { status: 401 });
    }

    if (!title || !description || !fileName || !fileContent) {
      return NextResponse.json({ error: 'Missing required fields (title, description, fileName, fileContent)' }, { status: 400 });
    }

    const newResource = await prisma.resource.create({
      data: {
        title,
        description,
        fileName,
        fileContent
      }
    });

    return NextResponse.json({ success: true, resource: newResource }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource: ' + error.message }, { status: 500 });
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
      return NextResponse.json({ error: "Missing resource ID parameter" }, { status: 400 });
    }

    await prisma.resource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Resource deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    return NextResponse.json({ error: "Failed to delete resource: " + error.message }, { status: 500 });
  }
}
