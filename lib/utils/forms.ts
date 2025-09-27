import { AccountDto, Education, Experience, Language, Link, ParsedAccount, Project, Recommendation, Skill, Tool } from "@lib/types";
import { AutoParseableTextFormat } from "openai/lib/parser.mjs";
import { FieldErrors, FieldValues } from "react-hook-form";
import { z } from "zod";
import { ZodError } from "zod";

export function jsonSchema(
  name: string,
  schema: z.ZodType,
) {
  return {
    name,
    schema: z.toJSONSchema(schema, { target: "draft-7", }),
    type: "json_schema",
    strict: true,
    $brand: "auto-parseable-response-format",
    $parseRaw: (x) => x.match(/```json([\s\S]*?)```/)?.[1]?.trim(),
  } as AutoParseableTextFormat<z.infer<typeof schema>>;
}

export function parseValidationErrors(errors: Record<string, string[]>) {
  return Object.keys(errors).reduce(
    (accumulator, key) => ({ ...accumulator, [key]: { message: errors[key]?.[0] } }),
    {},
  );
}

export function getErrorMessage<T extends Record<string, unknown>>(error?: ZodError<T>) {
  if (error) {
    return z.prettifyError(error);
  }

  return 'Unknown error';
}

export const formatUrl = (url: string) => {
  return url.replace('http://', '').replace('https://', '').replace('www.', '');
};

export function getHostname(url: string) {
  // Create a URL object
  const parsedUrl = new URL(url);

  // Get the hostname, which includes subdomains (e.g., www.domain.com)
  const hostname = parsedUrl.hostname;

  // Extract the main domain name (e.g., domain.com)
  // Split by '.' and filter to get the last two parts for domain
  const domainParts = hostname.split('.').filter((part) => part.length > 0);
  const domainName = domainParts.slice(domainParts.length - 2, domainParts.length - 1).join('.');

  return domainName;
}

export const hasError = <T extends FieldValues>(errors: FieldErrors<T>, key: keyof T) => {
  if (!errors || !errors[key]) return false;

  return !!(errors?.[key]?.message || Object.keys(errors[key]).length);
};

export const transformToPartial = <T>(data: T): Partial<T> => {
  if (typeof data !== 'object') {
    return data as T;
  }

  const result = {} as Partial<T>;

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key as keyof T] = transformToPartial(value) as Partial<T>[keyof T];
      } else if (Array.isArray(value) && value.length > 0) {
        result[key as keyof T] = value.map((item) => transformToPartial(item)) as Partial<T>[keyof T];
      } else if (value === null || value === '') {
        delete result[key as keyof T];
      } else {
        result[key as keyof T] = value as Partial<T>[keyof T];
      }
    }
  }

  return result;
};

export const transformFromParsedToAccount = (parsed: ParsedAccount): AccountDto => {
  return {
    profile: {
      email: parsed.profile?.email || '',
      firstName: parsed.profile?.firstName || '',
      lastName: parsed.profile?.lastName || '',
      role: parsed.profile?.role || '',
      tagline: parsed.profile?.tagline || '',
      phone: parsed.profile?.phone || '',
      website: parsed.profile?.website || '',
    },
    experience: parsed.experience?.reduce<Experience[]>((accumulator, experience) => {
      if (experience.company && experience.jobTitle && experience.startDate) {
        return [...accumulator, {
          company: experience.company,
          jobTitle: experience.jobTitle,
          startDate: new Date(experience.startDate).toISOString(),
          endDate: experience.endDate ? new Date(experience.endDate).toISOString() : undefined,
          isPresent: experience.isPresent ? new Date(experience.isPresent).toISOString() : undefined,
          employmentType: experience.employmentType || undefined,
          locationType: experience.locationType || undefined,
          additionalDetails: experience.additionalDetails || undefined,
          achievements: experience.achievements || [],
          responsibilities: experience.responsibilities || [],
          keyContributions: experience.keyContributions || [],
        }];
      } else {
        return accumulator;
      }
    }, []),
    education: parsed.education?.reduce<Education[]>((accumulator, education) => {
      if (education.degreeType && education.name && education.startDate) {
        return [...accumulator, {
          name: education.name,
          degreeType: education.degreeType,
          startDate: new Date(education.startDate).toISOString(),
          endDate: education.endDate ? new Date(education.endDate).toISOString() : undefined,
          isPresent: education.isPresent ? new Date(education.isPresent).toISOString() : undefined,
          additionalDetails: education.additionalDetails || undefined,
        }];
      } else {
        return accumulator;
      }
    }, []),
    languages: parsed.languages?.reduce<Language[]>((accumulator, language) => {
      if (language.language && language.proficiency) {
        return [...accumulator, {
          language: language.language,
          proficiency: language.proficiency,
        }];
      } else {
        return accumulator;
      }
    }, []),
    links: parsed.links?.reduce<Link[]>((accumulator, link) => {
      if (link.value && link.type) {
        return [...accumulator, {
          value: link.value,
          type: link.type,
        }];
      } else {
        return accumulator;
      }
    }, []),
    tools: parsed.tools?.reduce<Tool[]>((accumulator, tool) => {
      if (tool.name) {
        return [...accumulator, {
          name: tool.name,
        }];
      } else {
        return accumulator;
      }
    }, []),
    skills: parsed.skills?.reduce<Skill[]>((accumulator, skill) => {
      if (skill.name) {
        return [...accumulator, {
          name: skill.name,
        }];
      } else {
        return accumulator;
      }
    }, []),
    projects: parsed.projects?.reduce<Project[]>((accumulator, project) => {
      if (project.name && project.url) {
        return [...accumulator, {
          name: project.name,
          url: project.url,
          additionalDetails: project.additionalDetails || '',
        }];
      } else {
        return accumulator;
      }
    }, []),
    recommendations: parsed.recommendations?.reduce<Recommendation[]>((accumulator, recommendation) => {
      if (recommendation.name && recommendation.url) {
        return [...accumulator, {
          name: recommendation.name,
          url: recommendation.url,
          additionalDetails: recommendation.additionalDetails || '',
        }];
      } else {
        return accumulator;
      }
    }, []),
  };
};
