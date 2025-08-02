import { z } from 'zod';

export const DegreeTypeEnum = z.enum([
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate Degree',
  'Professional Degree',
  'Certificate',
  'Diploma',
  'High School Diploma',
  'Trade School Certificate',
  'MBA', // Master of Business Administration
  'MFA', // Master of Fine Arts
  'MEd', // Master of Education
  'MSW', // Master of Social Work
  'PhD', // Doctor of Philosophy
  'JD', // Juris Doctor
  'MD', // Doctor of Medicine
  'EDD', // Doctor of Education
]);

export const employmentTypeEnum = z.enum([
  'full-time',
  'part-time',
  'contract',
  'self-employed',
  'volunteer',
  'internship',
  'apprenticeship',
  'seasonal',
]);

export const locationTypeEnum = z.enum(['remote', 'hybrid', 'office']);

export const LanguageProficiency = z.enum(['beginner', 'intermediate', 'fluent', 'native']);

export const SeniorityEnum = z.enum(['entry', 'mid', 'senior']);

export const TemplateKeyEnum = z.enum([
  'entry-level-modern',
  'entry-level-ember',
  'entry-level-mint',
  'entry-level-talvio',
  'mid-level-modern',
  'mid-level-ember',
  'mid-level-mint',
  'mid-level-talvio',
  'senior-level-modern',
  'senior-level-ember',
  'senior-level-mint',
  'senior-level-talvio',
]);
