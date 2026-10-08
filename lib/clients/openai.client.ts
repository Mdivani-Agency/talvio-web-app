import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { parsedAccountSchema } from '@lib/schema/parsed.schema';
import { FeedbackQuestions, ParsedAccount } from '@lib/types';
import { jsonSchema } from '@lib/utils/forms';

const apiKey = process.env.OPENAI_API_KEY || 'TEST_KEY';

function openAIClient(scenario?: string | null) {
  const baseURL = process.env.OPENAI_BASE_URL;
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    ...(baseURL && scenario ? { defaultHeaders: { 'x-e2e-scenario': scenario } } : {}),
  });
}

const openai = openAIClient();

export const questionSchema = z.array(
  z.object({
    question: z.string(),
    example: z.string().nullable(),
  }),
);

export const questionResponseSchema = z.object({
  questions: questionSchema,
});

export const parseResume = async (resume: string, qaPairs: string) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: getResumeParsePrompt(resume, qaPairs) }],
  });

  return completion.choices[0].message.content?.match(/```json([\s\S]*?)```/)?.[1]?.trim();
};

export const textToStructuredResume = async (text: string, scenario?: string | null) => {
  try {
    const format = jsonSchema('account', parsedAccountSchema);
    const client = scenario ? openAIClient(scenario) : openai;

    const response = await client.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: `
            You are a resume parser. Your task is to extract the information and format text. Do not include explanations, only formatted data.
            **Important:** Dates should be in ISO8601 format. example: 2025-01-01T00:00:00.000Z
            **Important:** Do not hallucinate values, if the field is missing set it to null, if date is missing set it to null. isPresent field is also a date string set it to current date if end date is missing.
            `,
        },
        {
          role: 'user',
          content: `**Important:** Ensure all URL links are prefixed with https:// and have following format: https://example.com/johndoe. phone number should be in international format or if missing set it to empty string. ${text}`,
        },
      ],
      text: {
        format,
      },
    });

    return response.output_text;
  } catch (error) {
    console.error('parse resume error', error);
    throw error;
  }
};

export const getResumeQuestions = async (resume: string): Promise<FeedbackQuestions> => {
  const completion = await openai.responses.parse({
    model: 'gpt-4o',
    input: [
      {
        role: 'system',
        content: getResumeQuestionsPrompt(),
      },
      {
        role: 'user',
        content: `Resume Data: ${resume}`,
      },
    ],
    text: {
      format: jsonSchema('data', questionResponseSchema),
    },
  });

  if (completion.output_text) {
    return JSON.parse(completion.output_text).questions as FeedbackQuestions;
  }

  return [];
};

export const tailorAccount = async (account: string, qaPairs: string): Promise<ParsedAccount | null> => {
  const completion = await openai.responses.parse({
    model: 'gpt-4o',
    input: [
      {
        role: 'system',
        content: getAccountImprovementPrompt(),
      },
      {
        role: 'user',
        content: `### Input:
User Responses: ${qaPairs}
Original Account Data: ${account}`,
      },
    ],
    text: {
      format: jsonSchema('account', parsedAccountSchema),
    },
  });

  if (completion.output_text) {
    return JSON.parse(completion.output_text) as ParsedAccount;
  }

  return null;
};

function getResumeQuestionsPrompt() {
  // Compose a prompt for OpenAI
  return `You are a highly experienced resume reviewer and interviewer. Your task is to help the user enhance their profile data by asking **up to 5 targeted, precise questions** that uncover **additional, valuable details** not already present or obvious in their existing resume info. Focus on any **gaps, achievements, tools, or contextual info** that can make their resume stand out.

**Avoid asking about basic or already provided info** like role, certifications, or skills unless you are prompting for **specific details or impact**.

**Your questions should:**
- Be highly specific and pointed, prompting for details not typically listed (e.g., impact, scope, projects, leadership roles, awards, quantifiable achievements).
- Require minimal effort but yield rich, resume-enhancing info.
- Avoid restating information you already have.
- Invite examples, results, or context to deepen the profile's quality.

**Questions should look like:**
[
  { question: "What was a major impact or achievement you delivered in your latest role?", example: "Led the migration of legacy systems which reduced downtime by 30%" },
  { question: "Can you specify particular tools, frameworks, or methodologies you used for your key projects?", example: "React, Docker, Agile" },
  { question: "Describe a challenge you faced in your recent work and how you overcame it.", example: "Improved data processing speed by optimizing database queries" },
  { question: "What leadership or mentorship roles did you take on during this period?", example: "Mentored 5 junior developers, led weekly knowledge sharing sessions" },
  { question: "What are the most relevant or recent projects you've contributed to, and what was your role in them?", example: "Developed onboarding platform that increased new employee productivity" }
]

**Your questions should be formatted as an array as shown above.**`;
}

function getAccountImprovementPrompt() {
  return `
You are a expert resume editor and enhancer. Your task is to analyze the existing resume data and the user's recent responses to previously asked questions to generate a comprehensive, polished account JSON object.

**Goals:**
- Fill in gaps, clarify, and enrich sections like experience, education, projects, skills, tools, languages, etc.
- Ensure each section only includes entries with complete essential fields.
- Use existing bullet points and descriptions; enhance them where appropriate.
- write short summary for the account, between 200 and 300 characters.
- Determine user seniority ('entry', 'mid', 'senior') based on experience; default to "entry" if missing.
- For all links, prepend https:// if missing.
- add dates in ISO8601 format, example: 2025-01-01T00:00:00.000Z

**Important:**
- For experience, include all achievements, responsibilities and key contributions, enhancing or tailor existing ones, do not ignore them.

**Output:**
Return the final resume as a JSON object adhering to the above structure, with max 10 items per skills and tools, prioritized for relevance.
  `;
}

function getResumeParsePrompt(resume: string, qaParis: string) {
  return `
You are a skilled resume editor tasked with enhancing the candidate's resume using their recent answers. Analyze the information from the user's responses with the existing resume data provided. The goal is to fill in gaps, enhance content, and ensure the resume presents the candidate's skills and experience effectively.

### Instructions:
- Incorporate answers to address gaps or improve sections from the resume.
- Maintain consistency in tone and style throughout the document.
- Ensure all sections are coherent and logically organized.
- Experience description should be in tiptap format and broken down into bullet points where applicable.
- Based on resume rewrite tagline if it missing or too short, rewrite it to be more descriptive and engaging, between 100 and 200 characters.
- Format the output as a JSON object representing the comprehensive updated resume.
- Each experience description should have at least 3 bullet points, 5 ideally for most recent one or one that is most relevant to the current role.

**Important:** For each section that is array, for example experience, education, projects, skills, tools, languages, etc., if the **company** or **jobTitle** fields are missing or empty, **omit** the entire experience object. The same applies for other sections with required fields. If a required field such is missing in the input, do not include that field in the output.

**Important:** add https:// to the extracted links if missing, description fields on experience, education, projects, recommendations should be in tiptap format.


**Output:**
determine user seniority (entry, mid, senior) based on the experience, if it is missing or empty, set it to "entry"

Provide the updated resume data in JSON format, example:

{
  "bio": "Passionate about building scalable and efficient systems",
  "seniority": "Senior",
  "experience": [
    {
      "company": "Google",
      "jobTitle": "Software Engineer",
      "employmentType": "full-time",
      "locationType": "remote",
      "description": ${tiptapFormat[1]},
      "startDate": "2020-01-01T08:53:06.286Z",
      "endDate": "2022-12-31T08:00:00.000Z"
    },
{
    "company": "Talvio",
    "jobTitle": "Senior Software Engineer",
    "employmentType": "contract",
    "locationType": "hybrid",
    "description": ${tiptapFormat[0]},
    "startDate": "2025-02-12T08:53:06.286Z",
    "isPresent": "2025-02-12T08:53:06.286Z"
  }
  ],
  "education": [
    {
      "name": "University of California, Los Angeles",
      "degreeType": "Bachelor of Science in Computer Science",
      "additionalDetails": { type: "doc", content: [{"type": "paragraph", "content": [{"type": "text", "text": "GPA: 3.8"}]}]},
      "startDate": "2018-09-01T08:53:06.286Z",
      "endDate": "2022-06-15T08:00:00.000Z"
    },
    {
      "name": "University of New York",
      "degreeType": "Master of Science in Computer Science",
      "additionalDetails": { type: "doc", content: [{"type": "paragraph", "content": [{"type": "text", "text": "GPA: 3.8"}]}]},
      "startDate": "2018-09-01T08:53:06.286Z",
      "isPresent": "2022-06-15T08:00:00.000Z"
    }
  ],
  "recommendations": [
    {
      "name": "John Doe",
      "url": "https://www.linkedin.com/in/johndoe",
      "description": { type: "doc", content: [{"type": "paragraph", "content": [{"type": "text", "text": "John is a great colleague and a valuable asset to any team."}]}]}
    }
  ],
  "projects": [
    {
      "name": "Project 1",
      "url": "https://www.project1.com",
      "description": { type: "doc", content: [{"type": "paragraph", "content": [{"type": "text", "text": "Project 1 is a web application that allows users to manage their projects."}]}]}
    }
  ],
  "skills": [
    { "name": "React" },
    { "name": "Node.js" },
    { "name": "TypeScript" }
  ],
  "tools": [
    { "name": "Figma" },
    { "name": "Adobe Photoshop" }
  ],
  "languages": [
    { "language": "English", "proficiency": "native" },
    { "language": "Spanish", "proficiency": "fluent" },
    { "language": "French", "proficiency": "intermediate" },
    { "language": "German", "proficiency": "beginner" }
  ],
}

**Important:**
- use tiptap format for the description field on experience, education, projects, recommendations, prioritise writing experience description in bullet points.
- isPresent field should be a date string in the format YYYY-MM-DD representing the current date.
- Format the output as a JSON object representing the comprehensive updated resume.
- Do not ignore existing experience and bullet points, analyze them and include them in output if they are relevant to the current role, but you can enhance them.
- Based on the final resume data and role rewrite the skills and tools with most relevant data, max 10 item for each.

**Input:**
User Responses: ${qaParis}
Original Resume Data: ${resume}
  `;
}

const tiptapFormat = [
  `{
        "type": "doc",
        "content": [
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Developed a comprehensive mobile application with React Native, improving user engagement for the customer base."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Implemented back-end services using Node.js on AWS, ensuring scalable and efficient performance."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Integrated video tutorial content to enhance user experience and increase satisfaction and retention."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Built a social networking component for users to upload media, comment, and connect, fostering community engagement."
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }`,
  `{
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Developed a comprehensive mobile application with React Native, improving user engagement for the customer base."
                    }
                ]
            }
        ]
    }`,
];

export { openai };
