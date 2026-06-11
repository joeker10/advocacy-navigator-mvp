import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_PASSCODE = 'NAVIGATE_ADMIN';

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
    fileContent: `THE SPECIAL EDUCATION NAVIGATOR: IEP MEETING CHECKLIST
For Hawaii Parents (HAR Chapter 60 Compliant)

Before the Meeting:
[ ] Request all draft evaluation reports and draft IEP documents at least 3 days prior.
[ ] Identify your child's core strengths, needs, and areas of concern.
[ ] Formulate a list of requested accommodations and related services.
[ ] If audio-recording the meeting, notify the principal/administration in writing 24 hours in advance.

During the Meeting:
[ ] Ensure the PLEP (Present Levels of Educational Performance) contains objective baseline data.
[ ] Verify that every need identified in the evaluations has a matching annual goal.
[ ] Check that accommodations are Specific (e.g. "frequent breaks every 20 minutes" rather than "as needed").
[ ] Review the Related Services matrix: Verify therapist session duration, frequency, and location (General vs Special Ed).
[ ] Ask the coordinator to document any rejected accommodations in the PWN (Prior Written Notice).

After the Meeting:
[ ] Review the official meeting notes for accuracy.
[ ] Review the draft IEP document before signing consent.
[ ] Keep a copy of the final, signed IEP in your physical records vault.`
  },
  {
    title: "HAR Chapter 60 Reference Sheet",
    description: "A quick-glance reference guide outlining the key state administrative codes governing special education in Hawaii.",
    fileName: "HAR_Chapter_60_Reference.txt",
    fileContent: `Hawaii Administrative Rules (HAR) Chapter 60 Reference Sheet
For Parents and Advocates

1. Zero-Reject Policy: Every child with a disability in the State of Hawaii is entitled to a free appropriate public education (FAPE).
2. Evaluation (HAR §8-60-36): Complete evaluations must occur within 60 days of written parent consent.
3. Parental Participation (HAR §8-60-45): Parents are equal partners in the IEP team. Meetings must be scheduled at mutually agreeable times.
4. Prior Written Notice (HAR §8-60-58): The school must give written explanation whenever they propose OR refuse to change the identification, evaluation, or educational placement of your child.`
  }
];

export async function GET(req: NextRequest) {
  try {
    let resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Seed default resources if none exist in the database
    if (resources.length === 0) {
      await prisma.resource.createMany({
        data: DEFAULT_RESOURCES
      });
      resources = await prisma.resource.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

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
