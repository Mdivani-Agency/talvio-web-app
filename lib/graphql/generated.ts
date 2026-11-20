/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { GraphQLClient, type RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A high precision floating point value represented as a string */
  BigFloat: { input: string; output: string; }
  /** An arbitrary size integer represented as a string */
  BigInt: { input: string; output: string; }
  /** An opaque string using for tracking a position in results during pagination */
  Cursor: { input: string; output: string; }
  /** A date without time information */
  Date: { input: string; output: string; }
  /** A date and time */
  Datetime: { input: string; output: string; }
  /** A Javascript Object Notation value serialized as a string */
  JSON: { input: string; output: string; }
  /** Any type not handled by the type system */
  Opaque: { input: unknown; output: unknown; }
  /** A time without date information */
  Time: { input: unknown; output: unknown; }
  /** A universally unique identifier */
  UUID: { input: string; output: string; }
};

/** Boolean expression comparing fields on type "BigFloat" */
export type BigFloatFilter = {
  eq?: InputMaybe<Scalars['BigFloat']['input']>;
  gt?: InputMaybe<Scalars['BigFloat']['input']>;
  gte?: InputMaybe<Scalars['BigFloat']['input']>;
  in?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigFloat']['input']>;
  lte?: InputMaybe<Scalars['BigFloat']['input']>;
  neq?: InputMaybe<Scalars['BigFloat']['input']>;
};

/** Boolean expression comparing fields on type "BigFloatList" */
export type BigFloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
};

/** Boolean expression comparing fields on type "BigInt" */
export type BigIntFilter = {
  eq?: InputMaybe<Scalars['BigInt']['input']>;
  gt?: InputMaybe<Scalars['BigInt']['input']>;
  gte?: InputMaybe<Scalars['BigInt']['input']>;
  in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigInt']['input']>;
  lte?: InputMaybe<Scalars['BigInt']['input']>;
  neq?: InputMaybe<Scalars['BigInt']['input']>;
};

/** Boolean expression comparing fields on type "BigIntList" */
export type BigIntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

/** Boolean expression comparing fields on type "Boolean" */
export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Boolean expression comparing fields on type "BooleanList" */
export type BooleanListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  eq?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression comparing fields on type "Date" */
export type DateFilter = {
  eq?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  in?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
  neq?: InputMaybe<Scalars['Date']['input']>;
};

/** Boolean expression comparing fields on type "DateList" */
export type DateListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Date']['input']>>;
  contains?: InputMaybe<Array<Scalars['Date']['input']>>;
  eq?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Date']['input']>>;
};

/** Boolean expression comparing fields on type "Datetime" */
export type DatetimeFilter = {
  eq?: InputMaybe<Scalars['Datetime']['input']>;
  gt?: InputMaybe<Scalars['Datetime']['input']>;
  gte?: InputMaybe<Scalars['Datetime']['input']>;
  in?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Datetime']['input']>;
  lte?: InputMaybe<Scalars['Datetime']['input']>;
  neq?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Boolean expression comparing fields on type "DatetimeList" */
export type DatetimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  contains?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  eq?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Datetime']['input']>>;
};

export type FilterIs =
  | 'NOT_NULL'
  | 'NULL';

/** Boolean expression comparing fields on type "Float" */
export type FloatFilter = {
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  neq?: InputMaybe<Scalars['Float']['input']>;
};

/** Boolean expression comparing fields on type "FloatList" */
export type FloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Float']['input']>>;
  contains?: InputMaybe<Array<Scalars['Float']['input']>>;
  eq?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Float']['input']>>;
};

/** Boolean expression comparing fields on type "ID" */
export type IdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
};

/** Boolean expression comparing fields on type "Int" */
export type IntFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
};

/** Boolean expression comparing fields on type "IntList" */
export type IntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Int']['input']>>;
  contains?: InputMaybe<Array<Scalars['Int']['input']>>;
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** The root type for creating and mutating data */
export type Mutation = {
  __typename?: 'Mutation';
  apply_llm_proposal?: Maybe<Scalars['JSON']['output']>;
  claim_profile_improvement?: Maybe<Scalars['String']['output']>;
  confirm_profile_improvement?: Maybe<Scalars['Opaque']['output']>;
  /** Deletes zero or more records from the `contacts` collection */
  deleteFromcontactsCollection: ContactsDeleteResponse;
  /** Deletes zero or more records from the `educations` collection */
  deleteFromeducationsCollection: EducationsDeleteResponse;
  /** Deletes zero or more records from the `experiences` collection */
  deleteFromexperiencesCollection: ExperiencesDeleteResponse;
  /** Deletes zero or more records from the `headline_achievements` collection */
  deleteFromheadline_achievementsCollection: Headline_AchievementsDeleteResponse;
  /** Deletes zero or more records from the `job_application_notes` collection */
  deleteFromjob_application_notesCollection: Job_Application_NotesDeleteResponse;
  /** Deletes zero or more records from the `job_applications` collection */
  deleteFromjob_applicationsCollection: Job_ApplicationsDeleteResponse;
  /** Deletes zero or more records from the `languages` collection */
  deleteFromlanguagesCollection: LanguagesDeleteResponse;
  /** Deletes zero or more records from the `links` collection */
  deleteFromlinksCollection: LinksDeleteResponse;
  /** Deletes zero or more records from the `profiles` collection */
  deleteFromprofilesCollection: ProfilesDeleteResponse;
  /** Deletes zero or more records from the `projects` collection */
  deleteFromprojectsCollection: ProjectsDeleteResponse;
  /** Deletes zero or more records from the `recommendations` collection */
  deleteFromrecommendationsCollection: RecommendationsDeleteResponse;
  /** Deletes zero or more records from the `resumes` collection */
  deleteFromresumesCollection: ResumesDeleteResponse;
  /** Deletes zero or more records from the `skills` collection */
  deleteFromskillsCollection: SkillsDeleteResponse;
  /** Deletes zero or more records from the `tools` collection */
  deleteFromtoolsCollection: ToolsDeleteResponse;
  feedback_prompt_due?: Maybe<Scalars['String']['output']>;
  finalize_pdf?: Maybe<Scalars['String']['output']>;
  generate_pdf?: Maybe<Scalars['String']['output']>;
  /** Adds one or more `contacts` records to the collection */
  insertIntocontactsCollection?: Maybe<ContactsInsertResponse>;
  /** Adds one or more `educations` records to the collection */
  insertIntoeducationsCollection?: Maybe<EducationsInsertResponse>;
  /** Adds one or more `experiences` records to the collection */
  insertIntoexperiencesCollection?: Maybe<ExperiencesInsertResponse>;
  /** Adds one or more `headline_achievements` records to the collection */
  insertIntoheadline_achievementsCollection?: Maybe<Headline_AchievementsInsertResponse>;
  /** Adds one or more `job_application_notes` records to the collection */
  insertIntojob_application_notesCollection?: Maybe<Job_Application_NotesInsertResponse>;
  /** Adds one or more `job_applications` records to the collection */
  insertIntojob_applicationsCollection?: Maybe<Job_ApplicationsInsertResponse>;
  /** Adds one or more `languages` records to the collection */
  insertIntolanguagesCollection?: Maybe<LanguagesInsertResponse>;
  /** Adds one or more `links` records to the collection */
  insertIntolinksCollection?: Maybe<LinksInsertResponse>;
  /** Adds one or more `profiles` records to the collection */
  insertIntoprofilesCollection?: Maybe<ProfilesInsertResponse>;
  /** Adds one or more `projects` records to the collection */
  insertIntoprojectsCollection?: Maybe<ProjectsInsertResponse>;
  /** Adds one or more `recommendations` records to the collection */
  insertIntorecommendationsCollection?: Maybe<RecommendationsInsertResponse>;
  /** Adds one or more `resumes` records to the collection */
  insertIntoresumesCollection?: Maybe<ResumesInsertResponse>;
  /** Adds one or more `skills` records to the collection */
  insertIntoskillsCollection?: Maybe<SkillsInsertResponse>;
  /** Adds one or more `tools` records to the collection */
  insertIntotoolsCollection?: Maybe<ToolsInsertResponse>;
  mark_profile_improvement_used?: Maybe<Scalars['Opaque']['output']>;
  record_feedback_prompt?: Maybe<Scalars['String']['output']>;
  record_trustpilot_click?: Maybe<Scalars['Opaque']['output']>;
  release_profile_improvement?: Maybe<Scalars['Opaque']['output']>;
  release_resume_generation?: Maybe<Scalars['Opaque']['output']>;
  save_profile?: Maybe<Scalars['String']['output']>;
  submit_feedback?: Maybe<Scalars['String']['output']>;
  /** Updates zero or more records in the `contacts` collection */
  updatecontactsCollection: ContactsUpdateResponse;
  /** Updates zero or more records in the `educations` collection */
  updateeducationsCollection: EducationsUpdateResponse;
  /** Updates zero or more records in the `experiences` collection */
  updateexperiencesCollection: ExperiencesUpdateResponse;
  /** Updates zero or more records in the `headline_achievements` collection */
  updateheadline_achievementsCollection: Headline_AchievementsUpdateResponse;
  /** Updates zero or more records in the `job_application_notes` collection */
  updatejob_application_notesCollection: Job_Application_NotesUpdateResponse;
  /** Updates zero or more records in the `job_applications` collection */
  updatejob_applicationsCollection: Job_ApplicationsUpdateResponse;
  /** Updates zero or more records in the `languages` collection */
  updatelanguagesCollection: LanguagesUpdateResponse;
  /** Updates zero or more records in the `links` collection */
  updatelinksCollection: LinksUpdateResponse;
  /** Updates zero or more records in the `profiles` collection */
  updateprofilesCollection: ProfilesUpdateResponse;
  /** Updates zero or more records in the `projects` collection */
  updateprojectsCollection: ProjectsUpdateResponse;
  /** Updates zero or more records in the `recommendations` collection */
  updaterecommendationsCollection: RecommendationsUpdateResponse;
  /** Updates zero or more records in the `resumes` collection */
  updateresumesCollection: ResumesUpdateResponse;
  /** Updates zero or more records in the `skills` collection */
  updateskillsCollection: SkillsUpdateResponse;
  /** Updates zero or more records in the `tools` collection */
  updatetoolsCollection: ToolsUpdateResponse;
};

/** The root type for creating and mutating data */
export type MutationApply_Llm_ProposalArgs = {
  p_request: Scalars['JSON']['input'];
};

/** The root type for creating and mutating data */
export type MutationClaim_Profile_ImprovementArgs = {
  p_client_request_id: Scalars['String']['input'];
};

/** The root type for creating and mutating data */
export type MutationConfirm_Profile_ImprovementArgs = {
  p_client_request_id: Scalars['String']['input'];
  p_job_id: Scalars['UUID']['input'];
};

/** The root type for creating and mutating data */
export type MutationDeleteFromcontactsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ContactsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromeducationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<EducationsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromexperiencesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ExperiencesFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromheadline_AchievementsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Headline_AchievementsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromjob_Application_NotesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Job_Application_NotesFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromjob_ApplicationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Job_ApplicationsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromlanguagesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<LanguagesFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromlinksCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<LinksFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromprojectsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProjectsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromrecommendationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<RecommendationsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromresumesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ResumesFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromskillsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<SkillsFilter>;
};

/** The root type for creating and mutating data */
export type MutationDeleteFromtoolsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ToolsFilter>;
};

/** The root type for creating and mutating data */
export type MutationFinalize_PdfArgs = {
  p_pdf_media_key: Scalars['String']['input'];
  p_pdf_url: Scalars['String']['input'];
  p_resume_id: Scalars['UUID']['input'];
};

/** The root type for creating and mutating data */
export type MutationGenerate_PdfArgs = {
  p_resume_id: Scalars['UUID']['input'];
};

/** The root type for creating and mutating data */
export type MutationInsertIntocontactsCollectionArgs = {
  objects: Array<ContactsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoeducationsCollectionArgs = {
  objects: Array<EducationsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoexperiencesCollectionArgs = {
  objects: Array<ExperiencesInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoheadline_AchievementsCollectionArgs = {
  objects: Array<Headline_AchievementsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntojob_Application_NotesCollectionArgs = {
  objects: Array<Job_Application_NotesInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntojob_ApplicationsCollectionArgs = {
  objects: Array<Job_ApplicationsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntolanguagesCollectionArgs = {
  objects: Array<LanguagesInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntolinksCollectionArgs = {
  objects: Array<LinksInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoprofilesCollectionArgs = {
  objects: Array<ProfilesInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoprojectsCollectionArgs = {
  objects: Array<ProjectsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntorecommendationsCollectionArgs = {
  objects: Array<RecommendationsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoresumesCollectionArgs = {
  objects: Array<ResumesInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntoskillsCollectionArgs = {
  objects: Array<SkillsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationInsertIntotoolsCollectionArgs = {
  objects: Array<ToolsInsertInput>;
};

/** The root type for creating and mutating data */
export type MutationMark_Profile_Improvement_UsedArgs = {
  p_job_id?: InputMaybe<Scalars['UUID']['input']>;
};

/** The root type for creating and mutating data */
export type MutationRelease_Profile_ImprovementArgs = {
  p_client_request_id: Scalars['String']['input'];
};

/** The root type for creating and mutating data */
export type MutationRelease_Resume_GenerationArgs = {
  p_resume_id: Scalars['UUID']['input'];
};

/** The root type for creating and mutating data */
export type MutationSave_ProfileArgs = {
  p_payload: Scalars['JSON']['input'];
};

/** The root type for creating and mutating data */
export type MutationSubmit_FeedbackArgs = {
  p_comment: Scalars['String']['input'];
  p_resume_id?: InputMaybe<Scalars['UUID']['input']>;
};

/** The root type for creating and mutating data */
export type MutationUpdatecontactsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ContactsFilter>;
  set: ContactsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateeducationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<EducationsFilter>;
  set: EducationsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateexperiencesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ExperiencesFilter>;
  set: ExperiencesUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateheadline_AchievementsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Headline_AchievementsFilter>;
  set: Headline_AchievementsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdatejob_Application_NotesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Job_Application_NotesFilter>;
  set: Job_Application_NotesUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdatejob_ApplicationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Job_ApplicationsFilter>;
  set: Job_ApplicationsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdatelanguagesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<LanguagesFilter>;
  set: LanguagesUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdatelinksCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<LinksFilter>;
  set: LinksUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
  set: ProfilesUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateprojectsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProjectsFilter>;
  set: ProjectsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdaterecommendationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<RecommendationsFilter>;
  set: RecommendationsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateresumesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ResumesFilter>;
  set: ResumesUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdateskillsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<SkillsFilter>;
  set: SkillsUpdateInput;
};

/** The root type for creating and mutating data */
export type MutationUpdatetoolsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ToolsFilter>;
  set: ToolsUpdateInput;
};

export type Node = {
  /** Retrieves a record by `ID` */
  nodeId: Scalars['ID']['output'];
};

/** Boolean expression comparing fields on type "Opaque" */
export type OpaqueFilter = {
  eq?: InputMaybe<Scalars['Opaque']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Defines a per-field sorting order */
export type OrderByDirection =
  /** Ascending order, nulls first */
  | 'AscNullsFirst'
  /** Ascending order, nulls last */
  | 'AscNullsLast'
  /** Descending order, nulls first */
  | 'DescNullsFirst'
  /** Descending order, nulls last */
  | 'DescNullsLast';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The root type for querying data */
export type Query = {
  __typename?: 'Query';
  /** Retrieve a record of type `contacts` by its primary key */
  contactsByPk?: Maybe<Contacts>;
  /** A pagable collection of type `contacts` */
  contactsCollection: ContactsConnection;
  /** Retrieve a record of type `educations` by its primary key */
  educationsByPk?: Maybe<Educations>;
  /** A pagable collection of type `educations` */
  educationsCollection: EducationsConnection;
  /** Retrieve a record of type `experiences` by its primary key */
  experiencesByPk?: Maybe<Experiences>;
  /** A pagable collection of type `experiences` */
  experiencesCollection: ExperiencesConnection;
  /** Retrieve a record of type `feedback_prompt_state` by its primary key */
  feedback_prompt_stateByPk?: Maybe<Feedback_Prompt_State>;
  /** A pagable collection of type `feedback_prompt_state` */
  feedback_prompt_stateCollection: Feedback_Prompt_StateConnection;
  /** Retrieve a record of type `headline_achievements` by its primary key */
  headline_achievementsByPk?: Maybe<Headline_Achievements>;
  /** A pagable collection of type `headline_achievements` */
  headline_achievementsCollection: Headline_AchievementsConnection;
  /** Retrieve a record of type `job_application_events` by its primary key */
  job_application_eventsByPk?: Maybe<Job_Application_Events>;
  /** A pagable collection of type `job_application_events` */
  job_application_eventsCollection: Job_Application_EventsConnection;
  /** Retrieve a record of type `job_application_notes` by its primary key */
  job_application_notesByPk?: Maybe<Job_Application_Notes>;
  /** A pagable collection of type `job_application_notes` */
  job_application_notesCollection: Job_Application_NotesConnection;
  /** Retrieve a record of type `job_applications` by its primary key */
  job_applicationsByPk?: Maybe<Job_Applications>;
  /** A pagable collection of type `job_applications` */
  job_applicationsCollection: Job_ApplicationsConnection;
  /** Retrieve a record of type `languages` by its primary key */
  languagesByPk?: Maybe<Languages>;
  /** A pagable collection of type `languages` */
  languagesCollection: LanguagesConnection;
  /** Retrieve a record of type `links` by its primary key */
  linksByPk?: Maybe<Links>;
  /** A pagable collection of type `links` */
  linksCollection: LinksConnection;
  /** Retrieve a record of type `llm_proposal_applications` by its primary key */
  llm_proposal_applicationsByPk?: Maybe<Llm_Proposal_Applications>;
  /** A pagable collection of type `llm_proposal_applications` */
  llm_proposal_applicationsCollection: Llm_Proposal_ApplicationsConnection;
  /** Retrieve a record by its `ID` */
  node?: Maybe<Node>;
  /** Retrieve a record of type `profile_ai_improvements` by its primary key */
  profile_ai_improvementsByPk?: Maybe<Profile_Ai_Improvements>;
  /** A pagable collection of type `profile_ai_improvements` */
  profile_ai_improvementsCollection: Profile_Ai_ImprovementsConnection;
  /** Retrieve a record of type `profiles` by its primary key */
  profilesByPk?: Maybe<Profiles>;
  /** A pagable collection of type `profiles` */
  profilesCollection: ProfilesConnection;
  /** Retrieve a record of type `projects` by its primary key */
  projectsByPk?: Maybe<Projects>;
  /** A pagable collection of type `projects` */
  projectsCollection: ProjectsConnection;
  /** Retrieve a record of type `recommendations` by its primary key */
  recommendationsByPk?: Maybe<Recommendations>;
  /** A pagable collection of type `recommendations` */
  recommendationsCollection: RecommendationsConnection;
  /** Retrieve a record of type `resumes` by its primary key */
  resumesByPk?: Maybe<Resumes>;
  /** A pagable collection of type `resumes` */
  resumesCollection: ResumesConnection;
  /** Retrieve a record of type `skills` by its primary key */
  skillsByPk?: Maybe<Skills>;
  /** A pagable collection of type `skills` */
  skillsCollection: SkillsConnection;
  /** Retrieve a record of type `tools` by its primary key */
  toolsByPk?: Maybe<Tools>;
  /** A pagable collection of type `tools` */
  toolsCollection: ToolsConnection;
  /** Retrieve a record of type `user_credits` by its primary key */
  user_creditsByPk?: Maybe<User_Credits>;
  /** A pagable collection of type `user_credits` */
  user_creditsCollection: User_CreditsConnection;
  /** Retrieve a record of type `user_feedback` by its primary key */
  user_feedbackByPk?: Maybe<User_Feedback>;
  /** A pagable collection of type `user_feedback` */
  user_feedbackCollection: User_FeedbackConnection;
};

/** The root type for querying data */
export type QueryContactsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryContactsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ContactsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ContactsOrderBy>>;
};

/** The root type for querying data */
export type QueryEducationsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryEducationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<EducationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<EducationsOrderBy>>;
};

/** The root type for querying data */
export type QueryExperiencesByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryExperiencesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ExperiencesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ExperiencesOrderBy>>;
};

/** The root type for querying data */
export type QueryFeedback_Prompt_StateByPkArgs = {
  user_id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryFeedback_Prompt_StateCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Feedback_Prompt_StateFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Feedback_Prompt_StateOrderBy>>;
};

/** The root type for querying data */
export type QueryHeadline_AchievementsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryHeadline_AchievementsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Headline_AchievementsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Headline_AchievementsOrderBy>>;
};

/** The root type for querying data */
export type QueryJob_Application_EventsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryJob_Application_EventsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_Application_EventsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_Application_EventsOrderBy>>;
};

/** The root type for querying data */
export type QueryJob_Application_NotesByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryJob_Application_NotesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_Application_NotesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_Application_NotesOrderBy>>;
};

/** The root type for querying data */
export type QueryJob_ApplicationsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryJob_ApplicationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_ApplicationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_ApplicationsOrderBy>>;
};

/** The root type for querying data */
export type QueryLanguagesByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryLanguagesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LanguagesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LanguagesOrderBy>>;
};

/** The root type for querying data */
export type QueryLinksByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryLinksCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LinksFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LinksOrderBy>>;
};

/** The root type for querying data */
export type QueryLlm_Proposal_ApplicationsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryLlm_Proposal_ApplicationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Llm_Proposal_ApplicationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Llm_Proposal_ApplicationsOrderBy>>;
};

/** The root type for querying data */
export type QueryNodeArgs = {
  nodeId: Scalars['ID']['input'];
};

/** The root type for querying data */
export type QueryProfile_Ai_ImprovementsByPkArgs = {
  user_id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryProfile_Ai_ImprovementsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Profile_Ai_ImprovementsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Profile_Ai_ImprovementsOrderBy>>;
};

/** The root type for querying data */
export type QueryProfilesByPkArgs = {
  user_id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};

/** The root type for querying data */
export type QueryProjectsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryProjectsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProjectsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProjectsOrderBy>>;
};

/** The root type for querying data */
export type QueryRecommendationsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryRecommendationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<RecommendationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<RecommendationsOrderBy>>;
};

/** The root type for querying data */
export type QueryResumesByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryResumesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ResumesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResumesOrderBy>>;
};

/** The root type for querying data */
export type QuerySkillsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QuerySkillsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<SkillsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<SkillsOrderBy>>;
};

/** The root type for querying data */
export type QueryToolsByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryToolsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ToolsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ToolsOrderBy>>;
};

/** The root type for querying data */
export type QueryUser_CreditsByPkArgs = {
  user_id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryUser_CreditsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_CreditsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_CreditsOrderBy>>;
};

/** The root type for querying data */
export type QueryUser_FeedbackByPkArgs = {
  id: Scalars['UUID']['input'];
};

/** The root type for querying data */
export type QueryUser_FeedbackCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_FeedbackFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_FeedbackOrderBy>>;
};

/** Boolean expression comparing fields on type "String" */
export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  iregex?: InputMaybe<Scalars['String']['input']>;
  is?: InputMaybe<FilterIs>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression comparing fields on type "StringList" */
export type StringListFilter = {
  containedBy?: InputMaybe<Array<Scalars['String']['input']>>;
  contains?: InputMaybe<Array<Scalars['String']['input']>>;
  eq?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Boolean expression comparing fields on type "Time" */
export type TimeFilter = {
  eq?: InputMaybe<Scalars['Time']['input']>;
  gt?: InputMaybe<Scalars['Time']['input']>;
  gte?: InputMaybe<Scalars['Time']['input']>;
  in?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Time']['input']>;
  lte?: InputMaybe<Scalars['Time']['input']>;
  neq?: InputMaybe<Scalars['Time']['input']>;
};

/** Boolean expression comparing fields on type "TimeList" */
export type TimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Time']['input']>>;
  contains?: InputMaybe<Array<Scalars['Time']['input']>>;
  eq?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Time']['input']>>;
};

/** Boolean expression comparing fields on type "UUID" */
export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Scalars['UUID']['input']>;
};

/** Boolean expression comparing fields on type "UUIDList" */
export type UuidListFilter = {
  containedBy?: InputMaybe<Array<Scalars['UUID']['input']>>;
  contains?: InputMaybe<Array<Scalars['UUID']['input']>>;
  eq?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type Contact_Kind =
  | 'email'
  | 'phone'
  | 'url';

/** Boolean expression comparing fields on type "contact_kind" */
export type Contact_KindFilter = {
  eq?: InputMaybe<Contact_Kind>;
  in?: InputMaybe<Array<Contact_Kind>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Contact_Kind>;
};

export type Contacts = Node & {
  __typename?: 'contacts';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  is_primary: Scalars['Boolean']['output'];
  kind: Contact_Kind;
  label?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
  value: Scalars['String']['output'];
};

export type ContactsConnection = {
  __typename?: 'contactsConnection';
  edges: Array<ContactsEdge>;
  pageInfo: PageInfo;
};

export type ContactsDeleteResponse = {
  __typename?: 'contactsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Contacts>;
};

export type ContactsEdge = {
  __typename?: 'contactsEdge';
  cursor: Scalars['String']['output'];
  node: Contacts;
};

export type ContactsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ContactsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  is_primary?: InputMaybe<BooleanFilter>;
  kind?: InputMaybe<Contact_KindFilter>;
  label?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ContactsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ContactsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<UuidFilter>;
  value?: InputMaybe<StringFilter>;
};

export type ContactsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<Contact_Kind>;
  label?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ContactsInsertResponse = {
  __typename?: 'contactsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Contacts>;
};

export type ContactsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_primary?: InputMaybe<OrderByDirection>;
  kind?: InputMaybe<OrderByDirection>;
  label?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  value?: InputMaybe<OrderByDirection>;
};

export type ContactsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<Contact_Kind>;
  label?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ContactsUpdateResponse = {
  __typename?: 'contactsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Contacts>;
};

export type Educations = Node & {
  __typename?: 'educations';
  additional_details?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  degree_type: Scalars['String']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  end_date?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  is_present: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  start_date: Scalars['Date']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type EducationsConnection = {
  __typename?: 'educationsConnection';
  edges: Array<EducationsEdge>;
  pageInfo: PageInfo;
};

export type EducationsDeleteResponse = {
  __typename?: 'educationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Educations>;
};

export type EducationsEdge = {
  __typename?: 'educationsEdge';
  cursor: Scalars['String']['output'];
  node: Educations;
};

export type EducationsFilter = {
  additional_details?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<EducationsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  degree_type?: InputMaybe<StringFilter>;
  end_date?: InputMaybe<DateFilter>;
  id?: InputMaybe<UuidFilter>;
  is_present?: InputMaybe<BooleanFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<EducationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<EducationsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  start_date?: InputMaybe<DateFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type EducationsInsertInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  degree_type?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_present?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type EducationsInsertResponse = {
  __typename?: 'educationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Educations>;
};

export type EducationsOrderBy = {
  additional_details?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  degree_type?: InputMaybe<OrderByDirection>;
  end_date?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_present?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  start_date?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type EducationsUpdateInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  degree_type?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_present?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type EducationsUpdateResponse = {
  __typename?: 'educationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Educations>;
};

export type Employment_Type =
  | 'apprenticeship'
  | 'contract'
  | 'full_time'
  | 'internship'
  | 'part_time'
  | 'seasonal'
  | 'self_employed'
  | 'volunteer';

/** Boolean expression comparing fields on type "employment_type" */
export type Employment_TypeFilter = {
  eq?: InputMaybe<Employment_Type>;
  in?: InputMaybe<Array<Employment_Type>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Employment_Type>;
};

export type Experiences = Node & {
  __typename?: 'experiences';
  achievements: Array<Maybe<Scalars['String']['output']>>;
  additional_details?: Maybe<Scalars['String']['output']>;
  company: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  employment_type?: Maybe<Employment_Type>;
  end_date?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  is_present: Scalars['Boolean']['output'];
  job_title: Scalars['String']['output'];
  key_contributions: Array<Maybe<Scalars['String']['output']>>;
  location_type?: Maybe<Location_Type>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  responsibilities: Array<Maybe<Scalars['String']['output']>>;
  sort_order: Scalars['Int']['output'];
  stack: Array<Maybe<Scalars['String']['output']>>;
  start_date: Scalars['Date']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ExperiencesConnection = {
  __typename?: 'experiencesConnection';
  edges: Array<ExperiencesEdge>;
  pageInfo: PageInfo;
};

export type ExperiencesDeleteResponse = {
  __typename?: 'experiencesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Experiences>;
};

export type ExperiencesEdge = {
  __typename?: 'experiencesEdge';
  cursor: Scalars['String']['output'];
  node: Experiences;
};

export type ExperiencesFilter = {
  achievements?: InputMaybe<StringListFilter>;
  additional_details?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ExperiencesFilter>>;
  company?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  employment_type?: InputMaybe<Employment_TypeFilter>;
  end_date?: InputMaybe<DateFilter>;
  id?: InputMaybe<UuidFilter>;
  is_present?: InputMaybe<BooleanFilter>;
  job_title?: InputMaybe<StringFilter>;
  key_contributions?: InputMaybe<StringListFilter>;
  location_type?: InputMaybe<Location_TypeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ExperiencesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ExperiencesFilter>>;
  responsibilities?: InputMaybe<StringListFilter>;
  sort_order?: InputMaybe<IntFilter>;
  stack?: InputMaybe<StringListFilter>;
  start_date?: InputMaybe<DateFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ExperiencesInsertInput = {
  achievements?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  additional_details?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  employment_type?: InputMaybe<Employment_Type>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_present?: InputMaybe<Scalars['Boolean']['input']>;
  job_title?: InputMaybe<Scalars['String']['input']>;
  key_contributions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  location_type?: InputMaybe<Location_Type>;
  responsibilities?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  stack?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ExperiencesInsertResponse = {
  __typename?: 'experiencesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Experiences>;
};

export type ExperiencesOrderBy = {
  additional_details?: InputMaybe<OrderByDirection>;
  company?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  employment_type?: InputMaybe<OrderByDirection>;
  end_date?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_present?: InputMaybe<OrderByDirection>;
  job_title?: InputMaybe<OrderByDirection>;
  location_type?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  start_date?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type ExperiencesUpdateInput = {
  achievements?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  additional_details?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  employment_type?: InputMaybe<Employment_Type>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_present?: InputMaybe<Scalars['Boolean']['input']>;
  job_title?: InputMaybe<Scalars['String']['input']>;
  key_contributions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  location_type?: InputMaybe<Location_Type>;
  responsibilities?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  stack?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ExperiencesUpdateResponse = {
  __typename?: 'experiencesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Experiences>;
};

export type Feedback_Prompt_State = Node & {
  __typename?: 'feedback_prompt_state';
  created_at: Scalars['Datetime']['output'];
  last_prompted_at?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  prompts_shown: Scalars['Int']['output'];
  trustpilot_clicked_at?: Maybe<Scalars['Datetime']['output']>;
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type Feedback_Prompt_StateConnection = {
  __typename?: 'feedback_prompt_stateConnection';
  edges: Array<Feedback_Prompt_StateEdge>;
  pageInfo: PageInfo;
};

export type Feedback_Prompt_StateEdge = {
  __typename?: 'feedback_prompt_stateEdge';
  cursor: Scalars['String']['output'];
  node: Feedback_Prompt_State;
};

export type Feedback_Prompt_StateFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Feedback_Prompt_StateFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  last_prompted_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Feedback_Prompt_StateFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Feedback_Prompt_StateFilter>>;
  prompts_shown?: InputMaybe<IntFilter>;
  trustpilot_clicked_at?: InputMaybe<DatetimeFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Feedback_Prompt_StateOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  last_prompted_at?: InputMaybe<OrderByDirection>;
  prompts_shown?: InputMaybe<OrderByDirection>;
  trustpilot_clicked_at?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Headline_Achievements = Node & {
  __typename?: 'headline_achievements';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  label: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
  value: Scalars['String']['output'];
};

export type Headline_AchievementsConnection = {
  __typename?: 'headline_achievementsConnection';
  edges: Array<Headline_AchievementsEdge>;
  pageInfo: PageInfo;
};

export type Headline_AchievementsDeleteResponse = {
  __typename?: 'headline_achievementsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Headline_Achievements>;
};

export type Headline_AchievementsEdge = {
  __typename?: 'headline_achievementsEdge';
  cursor: Scalars['String']['output'];
  node: Headline_Achievements;
};

export type Headline_AchievementsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Headline_AchievementsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  label?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Headline_AchievementsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Headline_AchievementsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<UuidFilter>;
  value?: InputMaybe<StringFilter>;
};

export type Headline_AchievementsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type Headline_AchievementsInsertResponse = {
  __typename?: 'headline_achievementsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Headline_Achievements>;
};

export type Headline_AchievementsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  label?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  value?: InputMaybe<OrderByDirection>;
};

export type Headline_AchievementsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type Headline_AchievementsUpdateResponse = {
  __typename?: 'headline_achievementsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Headline_Achievements>;
};

export type Job_Application_Events = Node & {
  __typename?: 'job_application_events';
  application_id: Scalars['UUID']['output'];
  created_at: Scalars['Datetime']['output'];
  from_stage?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  job_applications?: Maybe<Job_Applications>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  to_stage: Scalars['String']['output'];
  user_id: Scalars['UUID']['output'];
};

export type Job_Application_EventsConnection = {
  __typename?: 'job_application_eventsConnection';
  edges: Array<Job_Application_EventsEdge>;
  pageInfo: PageInfo;
};

export type Job_Application_EventsEdge = {
  __typename?: 'job_application_eventsEdge';
  cursor: Scalars['String']['output'];
  node: Job_Application_Events;
};

export type Job_Application_EventsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Job_Application_EventsFilter>>;
  application_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  from_stage?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Job_Application_EventsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Job_Application_EventsFilter>>;
  to_stage?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Job_Application_EventsOrderBy = {
  application_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  from_stage?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  to_stage?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Job_Application_Notes = Node & {
  __typename?: 'job_application_notes';
  application_id: Scalars['UUID']['output'];
  content: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  job_applications?: Maybe<Job_Applications>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type Job_Application_NotesConnection = {
  __typename?: 'job_application_notesConnection';
  edges: Array<Job_Application_NotesEdge>;
  pageInfo: PageInfo;
};

export type Job_Application_NotesDeleteResponse = {
  __typename?: 'job_application_notesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Application_Notes>;
};

export type Job_Application_NotesEdge = {
  __typename?: 'job_application_notesEdge';
  cursor: Scalars['String']['output'];
  node: Job_Application_Notes;
};

export type Job_Application_NotesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Job_Application_NotesFilter>>;
  application_id?: InputMaybe<UuidFilter>;
  content?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Job_Application_NotesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Job_Application_NotesFilter>>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Job_Application_NotesInsertInput = {
  application_id?: InputMaybe<Scalars['UUID']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Job_Application_NotesInsertResponse = {
  __typename?: 'job_application_notesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Application_Notes>;
};

export type Job_Application_NotesOrderBy = {
  application_id?: InputMaybe<OrderByDirection>;
  content?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Job_Application_NotesUpdateInput = {
  application_id?: InputMaybe<Scalars['UUID']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Job_Application_NotesUpdateResponse = {
  __typename?: 'job_application_notesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Application_Notes>;
};

export type Job_Applications = Node & {
  __typename?: 'job_applications';
  applied_on?: Maybe<Scalars['Date']['output']>;
  company: Scalars['String']['output'];
  contact?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  job_application_eventsCollection?: Maybe<Job_Application_EventsConnection>;
  job_application_notesCollection?: Maybe<Job_Application_NotesConnection>;
  labels: Scalars['JSON']['output'];
  links: Scalars['JSON']['output'];
  location?: Maybe<Scalars['String']['output']>;
  next_step?: Maybe<Scalars['String']['output']>;
  next_step_on?: Maybe<Scalars['Date']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  position: Scalars['String']['output'];
  resume_id?: Maybe<Scalars['UUID']['output']>;
  resumes?: Maybe<Resumes>;
  salary?: Maybe<Scalars['String']['output']>;
  sort_order: Scalars['Float']['output'];
  stage: Scalars['String']['output'];
  stage_changed_at: Scalars['Datetime']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type Job_ApplicationsJob_Application_EventsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_Application_EventsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_Application_EventsOrderBy>>;
};

export type Job_ApplicationsJob_Application_NotesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_Application_NotesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_Application_NotesOrderBy>>;
};

export type Job_ApplicationsConnection = {
  __typename?: 'job_applicationsConnection';
  edges: Array<Job_ApplicationsEdge>;
  pageInfo: PageInfo;
};

export type Job_ApplicationsDeleteResponse = {
  __typename?: 'job_applicationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Applications>;
};

export type Job_ApplicationsEdge = {
  __typename?: 'job_applicationsEdge';
  cursor: Scalars['String']['output'];
  node: Job_Applications;
};

export type Job_ApplicationsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Job_ApplicationsFilter>>;
  applied_on?: InputMaybe<DateFilter>;
  company?: InputMaybe<StringFilter>;
  contact?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  location?: InputMaybe<StringFilter>;
  next_step?: InputMaybe<StringFilter>;
  next_step_on?: InputMaybe<DateFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Job_ApplicationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Job_ApplicationsFilter>>;
  position?: InputMaybe<StringFilter>;
  resume_id?: InputMaybe<UuidFilter>;
  salary?: InputMaybe<StringFilter>;
  sort_order?: InputMaybe<FloatFilter>;
  stage?: InputMaybe<StringFilter>;
  stage_changed_at?: InputMaybe<DatetimeFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Job_ApplicationsInsertInput = {
  applied_on?: InputMaybe<Scalars['Date']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  labels?: InputMaybe<Scalars['JSON']['input']>;
  links?: InputMaybe<Scalars['JSON']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  next_step?: InputMaybe<Scalars['String']['input']>;
  next_step_on?: InputMaybe<Scalars['Date']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  resume_id?: InputMaybe<Scalars['UUID']['input']>;
  salary?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Float']['input']>;
  stage?: InputMaybe<Scalars['String']['input']>;
  stage_changed_at?: InputMaybe<Scalars['Datetime']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Job_ApplicationsInsertResponse = {
  __typename?: 'job_applicationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Applications>;
};

export type Job_ApplicationsOrderBy = {
  applied_on?: InputMaybe<OrderByDirection>;
  company?: InputMaybe<OrderByDirection>;
  contact?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  location?: InputMaybe<OrderByDirection>;
  next_step?: InputMaybe<OrderByDirection>;
  next_step_on?: InputMaybe<OrderByDirection>;
  position?: InputMaybe<OrderByDirection>;
  resume_id?: InputMaybe<OrderByDirection>;
  salary?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  stage?: InputMaybe<OrderByDirection>;
  stage_changed_at?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Job_ApplicationsUpdateInput = {
  applied_on?: InputMaybe<Scalars['Date']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  labels?: InputMaybe<Scalars['JSON']['input']>;
  links?: InputMaybe<Scalars['JSON']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  next_step?: InputMaybe<Scalars['String']['input']>;
  next_step_on?: InputMaybe<Scalars['Date']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  resume_id?: InputMaybe<Scalars['UUID']['input']>;
  salary?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Float']['input']>;
  stage?: InputMaybe<Scalars['String']['input']>;
  stage_changed_at?: InputMaybe<Scalars['Datetime']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Job_ApplicationsUpdateResponse = {
  __typename?: 'job_applicationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Job_Applications>;
};

export type Language_Proficiency =
  | 'beginner'
  | 'fluent'
  | 'intermediate'
  | 'native';

/** Boolean expression comparing fields on type "language_proficiency" */
export type Language_ProficiencyFilter = {
  eq?: InputMaybe<Language_Proficiency>;
  in?: InputMaybe<Array<Language_Proficiency>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Language_Proficiency>;
};

export type Languages = Node & {
  __typename?: 'languages';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  language: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  proficiency: Language_Proficiency;
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type LanguagesConnection = {
  __typename?: 'languagesConnection';
  edges: Array<LanguagesEdge>;
  pageInfo: PageInfo;
};

export type LanguagesDeleteResponse = {
  __typename?: 'languagesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Languages>;
};

export type LanguagesEdge = {
  __typename?: 'languagesEdge';
  cursor: Scalars['String']['output'];
  node: Languages;
};

export type LanguagesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<LanguagesFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  language?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<LanguagesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<LanguagesFilter>>;
  proficiency?: InputMaybe<Language_ProficiencyFilter>;
  sort_order?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type LanguagesInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  proficiency?: InputMaybe<Language_Proficiency>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type LanguagesInsertResponse = {
  __typename?: 'languagesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Languages>;
};

export type LanguagesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  language?: InputMaybe<OrderByDirection>;
  proficiency?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type LanguagesUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  proficiency?: InputMaybe<Language_Proficiency>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type LanguagesUpdateResponse = {
  __typename?: 'languagesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Languages>;
};

export type Links = Node & {
  __typename?: 'links';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  user_id: Scalars['UUID']['output'];
  value: Scalars['String']['output'];
};

export type LinksConnection = {
  __typename?: 'linksConnection';
  edges: Array<LinksEdge>;
  pageInfo: PageInfo;
};

export type LinksDeleteResponse = {
  __typename?: 'linksDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Links>;
};

export type LinksEdge = {
  __typename?: 'linksEdge';
  cursor: Scalars['String']['output'];
  node: Links;
};

export type LinksFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<LinksFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<LinksFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<LinksFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  type?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
  value?: InputMaybe<StringFilter>;
};

export type LinksInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type LinksInsertResponse = {
  __typename?: 'linksInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Links>;
};

export type LinksOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  type?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  value?: InputMaybe<OrderByDirection>;
};

export type LinksUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type LinksUpdateResponse = {
  __typename?: 'linksUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Links>;
};

export type Llm_Proposal_Applications = Node & {
  __typename?: 'llm_proposal_applications';
  accepted_omission_ids: Array<Maybe<Scalars['String']['output']>>;
  applied_change_ids: Array<Maybe<Scalars['String']['output']>>;
  base_revision?: Maybe<Scalars['Datetime']['output']>;
  confirmed_claim_ids: Array<Maybe<Scalars['String']['output']>>;
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  idempotency_key: Scalars['String']['output'];
  job_id?: Maybe<Scalars['UUID']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  operation: Scalars['String']['output'];
  proposal_id: Scalars['UUID']['output'];
  resulting_revision: Scalars['Datetime']['output'];
  resume_id?: Maybe<Scalars['UUID']['output']>;
  resumes?: Maybe<Resumes>;
  session_id?: Maybe<Scalars['UUID']['output']>;
  source: Scalars['JSON']['output'];
  target: Scalars['JSON']['output'];
  user_id: Scalars['UUID']['output'];
};

export type Llm_Proposal_ApplicationsConnection = {
  __typename?: 'llm_proposal_applicationsConnection';
  edges: Array<Llm_Proposal_ApplicationsEdge>;
  pageInfo: PageInfo;
};

export type Llm_Proposal_ApplicationsEdge = {
  __typename?: 'llm_proposal_applicationsEdge';
  cursor: Scalars['String']['output'];
  node: Llm_Proposal_Applications;
};

export type Llm_Proposal_ApplicationsFilter = {
  accepted_omission_ids?: InputMaybe<StringListFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Llm_Proposal_ApplicationsFilter>>;
  applied_change_ids?: InputMaybe<StringListFilter>;
  base_revision?: InputMaybe<DatetimeFilter>;
  confirmed_claim_ids?: InputMaybe<StringListFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  idempotency_key?: InputMaybe<StringFilter>;
  job_id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Llm_Proposal_ApplicationsFilter>;
  operation?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Llm_Proposal_ApplicationsFilter>>;
  proposal_id?: InputMaybe<UuidFilter>;
  resulting_revision?: InputMaybe<DatetimeFilter>;
  resume_id?: InputMaybe<UuidFilter>;
  session_id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Llm_Proposal_ApplicationsOrderBy = {
  base_revision?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  idempotency_key?: InputMaybe<OrderByDirection>;
  job_id?: InputMaybe<OrderByDirection>;
  operation?: InputMaybe<OrderByDirection>;
  proposal_id?: InputMaybe<OrderByDirection>;
  resulting_revision?: InputMaybe<OrderByDirection>;
  resume_id?: InputMaybe<OrderByDirection>;
  session_id?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Location_Type =
  | 'hybrid'
  | 'office'
  | 'remote';

/** Boolean expression comparing fields on type "location_type" */
export type Location_TypeFilter = {
  eq?: InputMaybe<Location_Type>;
  in?: InputMaybe<Array<Location_Type>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Location_Type>;
};

export type Profile_Ai_Improvements = Node & {
  __typename?: 'profile_ai_improvements';
  applied_at?: Maybe<Scalars['Datetime']['output']>;
  claimed_at: Scalars['Datetime']['output'];
  client_request_id: Scalars['String']['output'];
  job_id?: Maybe<Scalars['UUID']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  updated_at: Scalars['Datetime']['output'];
  used_at?: Maybe<Scalars['Datetime']['output']>;
  user_id: Scalars['UUID']['output'];
};

export type Profile_Ai_ImprovementsConnection = {
  __typename?: 'profile_ai_improvementsConnection';
  edges: Array<Profile_Ai_ImprovementsEdge>;
  pageInfo: PageInfo;
};

export type Profile_Ai_ImprovementsEdge = {
  __typename?: 'profile_ai_improvementsEdge';
  cursor: Scalars['String']['output'];
  node: Profile_Ai_Improvements;
};

export type Profile_Ai_ImprovementsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Profile_Ai_ImprovementsFilter>>;
  applied_at?: InputMaybe<DatetimeFilter>;
  claimed_at?: InputMaybe<DatetimeFilter>;
  client_request_id?: InputMaybe<StringFilter>;
  job_id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Profile_Ai_ImprovementsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Profile_Ai_ImprovementsFilter>>;
  updated_at?: InputMaybe<DatetimeFilter>;
  used_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Profile_Ai_ImprovementsOrderBy = {
  applied_at?: InputMaybe<OrderByDirection>;
  claimed_at?: InputMaybe<OrderByDirection>;
  client_request_id?: InputMaybe<OrderByDirection>;
  job_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  used_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Profiles = Node & {
  __typename?: 'profiles';
  city?: Maybe<Scalars['String']['output']>;
  contactsCollection?: Maybe<ContactsConnection>;
  country?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  educationsCollection?: Maybe<EducationsConnection>;
  experiencesCollection?: Maybe<ExperiencesConnection>;
  first_name: Scalars['String']['output'];
  group_skills: Scalars['Boolean']['output'];
  headline_achievementsCollection?: Maybe<Headline_AchievementsConnection>;
  languagesCollection?: Maybe<LanguagesConnection>;
  last_name: Scalars['String']['output'];
  linksCollection?: Maybe<LinksConnection>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  projectsCollection?: Maybe<ProjectsConnection>;
  recommendationsCollection?: Maybe<RecommendationsConnection>;
  role: Scalars['String']['output'];
  seniority: Seniority_Level;
  skills?: Maybe<Skills>;
  tagline?: Maybe<Scalars['String']['output']>;
  tools?: Maybe<Tools>;
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ProfilesContactsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ContactsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ContactsOrderBy>>;
};

export type ProfilesEducationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<EducationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<EducationsOrderBy>>;
};

export type ProfilesExperiencesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ExperiencesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ExperiencesOrderBy>>;
};

export type ProfilesHeadline_AchievementsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Headline_AchievementsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Headline_AchievementsOrderBy>>;
};

export type ProfilesLanguagesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LanguagesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LanguagesOrderBy>>;
};

export type ProfilesLinksCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LinksFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LinksOrderBy>>;
};

export type ProfilesProjectsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProjectsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProjectsOrderBy>>;
};

export type ProfilesRecommendationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<RecommendationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<RecommendationsOrderBy>>;
};

export type ProfilesConnection = {
  __typename?: 'profilesConnection';
  edges: Array<ProfilesEdge>;
  pageInfo: PageInfo;
};

export type ProfilesDeleteResponse = {
  __typename?: 'profilesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesEdge = {
  __typename?: 'profilesEdge';
  cursor: Scalars['String']['output'];
  node: Profiles;
};

export type ProfilesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ProfilesFilter>>;
  city?: InputMaybe<StringFilter>;
  country?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  first_name?: InputMaybe<StringFilter>;
  group_skills?: InputMaybe<BooleanFilter>;
  last_name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ProfilesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ProfilesFilter>>;
  role?: InputMaybe<StringFilter>;
  seniority?: InputMaybe<Seniority_LevelFilter>;
  tagline?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ProfilesInsertInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  group_skills?: InputMaybe<Scalars['Boolean']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  seniority?: InputMaybe<Seniority_Level>;
  tagline?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ProfilesInsertResponse = {
  __typename?: 'profilesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesOrderBy = {
  city?: InputMaybe<OrderByDirection>;
  country?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  first_name?: InputMaybe<OrderByDirection>;
  group_skills?: InputMaybe<OrderByDirection>;
  last_name?: InputMaybe<OrderByDirection>;
  role?: InputMaybe<OrderByDirection>;
  seniority?: InputMaybe<OrderByDirection>;
  tagline?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type ProfilesUpdateInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  group_skills?: InputMaybe<Scalars['Boolean']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  seniority?: InputMaybe<Seniority_Level>;
  tagline?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ProfilesUpdateResponse = {
  __typename?: 'profilesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type Projects = Node & {
  __typename?: 'projects';
  additional_details: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  updated_at: Scalars['Datetime']['output'];
  url?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['UUID']['output'];
};

export type ProjectsConnection = {
  __typename?: 'projectsConnection';
  edges: Array<ProjectsEdge>;
  pageInfo: PageInfo;
};

export type ProjectsDeleteResponse = {
  __typename?: 'projectsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Projects>;
};

export type ProjectsEdge = {
  __typename?: 'projectsEdge';
  cursor: Scalars['String']['output'];
  node: Projects;
};

export type ProjectsFilter = {
  additional_details?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ProjectsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ProjectsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ProjectsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  url?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ProjectsInsertInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ProjectsInsertResponse = {
  __typename?: 'projectsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Projects>;
};

export type ProjectsOrderBy = {
  additional_details?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  url?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type ProjectsUpdateInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ProjectsUpdateResponse = {
  __typename?: 'projectsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Projects>;
};

export type Recommendations = Node & {
  __typename?: 'recommendations';
  additional_details: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  updated_at: Scalars['Datetime']['output'];
  url: Scalars['String']['output'];
  user_id: Scalars['UUID']['output'];
};

export type RecommendationsConnection = {
  __typename?: 'recommendationsConnection';
  edges: Array<RecommendationsEdge>;
  pageInfo: PageInfo;
};

export type RecommendationsDeleteResponse = {
  __typename?: 'recommendationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Recommendations>;
};

export type RecommendationsEdge = {
  __typename?: 'recommendationsEdge';
  cursor: Scalars['String']['output'];
  node: Recommendations;
};

export type RecommendationsFilter = {
  additional_details?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<RecommendationsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<RecommendationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<RecommendationsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  url?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type RecommendationsInsertInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type RecommendationsInsertResponse = {
  __typename?: 'recommendationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Recommendations>;
};

export type RecommendationsOrderBy = {
  additional_details?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  url?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type RecommendationsUpdateInput = {
  additional_details?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type RecommendationsUpdateResponse = {
  __typename?: 'recommendationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Recommendations>;
};

export type Resume_Font_Size =
  | 'lg'
  | 'md'
  | 'sm';

/** Boolean expression comparing fields on type "resume_font_size" */
export type Resume_Font_SizeFilter = {
  eq?: InputMaybe<Resume_Font_Size>;
  in?: InputMaybe<Array<Resume_Font_Size>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Resume_Font_Size>;
};

export type Resume_Type =
  | 'general'
  | 'job_specific';

/** Boolean expression comparing fields on type "resume_type" */
export type Resume_TypeFilter = {
  eq?: InputMaybe<Resume_Type>;
  in?: InputMaybe<Array<Resume_Type>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Resume_Type>;
};

export type Resumes = Node & {
  __typename?: 'resumes';
  client_draft_id?: Maybe<Scalars['UUID']['output']>;
  color: Scalars['String']['output'];
  content: Scalars['JSON']['output'];
  created_at: Scalars['Datetime']['output'];
  font_family?: Maybe<Scalars['String']['output']>;
  font_size: Resume_Font_Size;
  generation_updated_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  job_applicationsCollection?: Maybe<Job_ApplicationsConnection>;
  label?: Maybe<Scalars['String']['output']>;
  llm_proposal_applicationsCollection?: Maybe<Llm_Proposal_ApplicationsConnection>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  pdf_media_key?: Maybe<Scalars['String']['output']>;
  pdf_url?: Maybe<Scalars['String']['output']>;
  resumes?: Maybe<Resumes>;
  resumesCollection?: Maybe<ResumesConnection>;
  source_resume_id?: Maybe<Scalars['UUID']['output']>;
  template_key: Scalars['String']['output'];
  type: Resume_Type;
  updated_at: Scalars['Datetime']['output'];
  user_feedbackCollection?: Maybe<User_FeedbackConnection>;
  user_id: Scalars['UUID']['output'];
};

export type ResumesJob_ApplicationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Job_ApplicationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Job_ApplicationsOrderBy>>;
};

export type ResumesLlm_Proposal_ApplicationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Llm_Proposal_ApplicationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Llm_Proposal_ApplicationsOrderBy>>;
};

export type ResumesResumesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ResumesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResumesOrderBy>>;
};

export type ResumesUser_FeedbackCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_FeedbackFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_FeedbackOrderBy>>;
};

export type ResumesConnection = {
  __typename?: 'resumesConnection';
  edges: Array<ResumesEdge>;
  pageInfo: PageInfo;
};

export type ResumesDeleteResponse = {
  __typename?: 'resumesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resumes>;
};

export type ResumesEdge = {
  __typename?: 'resumesEdge';
  cursor: Scalars['String']['output'];
  node: Resumes;
};

export type ResumesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ResumesFilter>>;
  client_draft_id?: InputMaybe<UuidFilter>;
  color?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  font_family?: InputMaybe<StringFilter>;
  font_size?: InputMaybe<Resume_Font_SizeFilter>;
  generation_updated_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  label?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ResumesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ResumesFilter>>;
  pdf_media_key?: InputMaybe<StringFilter>;
  pdf_url?: InputMaybe<StringFilter>;
  source_resume_id?: InputMaybe<UuidFilter>;
  template_key?: InputMaybe<StringFilter>;
  type?: InputMaybe<Resume_TypeFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ResumesInsertInput = {
  client_draft_id?: InputMaybe<Scalars['UUID']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['JSON']['input']>;
  font_family?: InputMaybe<Scalars['String']['input']>;
  font_size?: InputMaybe<Resume_Font_Size>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  source_resume_id?: InputMaybe<Scalars['UUID']['input']>;
  template_key?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Resume_Type>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ResumesInsertResponse = {
  __typename?: 'resumesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resumes>;
};

export type ResumesOrderBy = {
  client_draft_id?: InputMaybe<OrderByDirection>;
  color?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  font_family?: InputMaybe<OrderByDirection>;
  font_size?: InputMaybe<OrderByDirection>;
  generation_updated_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  label?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  pdf_media_key?: InputMaybe<OrderByDirection>;
  pdf_url?: InputMaybe<OrderByDirection>;
  source_resume_id?: InputMaybe<OrderByDirection>;
  template_key?: InputMaybe<OrderByDirection>;
  type?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type ResumesUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['JSON']['input']>;
  font_family?: InputMaybe<Scalars['String']['input']>;
  font_size?: InputMaybe<Resume_Font_Size>;
  label?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  template_key?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Resume_Type>;
};

export type ResumesUpdateResponse = {
  __typename?: 'resumesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resumes>;
};

export type Seniority_Level =
  | 'entry'
  | 'mid'
  | 'senior';

/** Boolean expression comparing fields on type "seniority_level" */
export type Seniority_LevelFilter = {
  eq?: InputMaybe<Seniority_Level>;
  in?: InputMaybe<Array<Seniority_Level>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Seniority_Level>;
};

export type Skills = Node & {
  __typename?: 'skills';
  created_at: Scalars['Datetime']['output'];
  group_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type SkillsConnection = {
  __typename?: 'skillsConnection';
  edges: Array<SkillsEdge>;
  pageInfo: PageInfo;
};

export type SkillsDeleteResponse = {
  __typename?: 'skillsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Skills>;
};

export type SkillsEdge = {
  __typename?: 'skillsEdge';
  cursor: Scalars['String']['output'];
  node: Skills;
};

export type SkillsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<SkillsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  group_name?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<SkillsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<SkillsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type SkillsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  group_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type SkillsInsertResponse = {
  __typename?: 'skillsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Skills>;
};

export type SkillsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  group_name?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type SkillsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  group_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type SkillsUpdateResponse = {
  __typename?: 'skillsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Skills>;
};

export type Tools = Node & {
  __typename?: 'tools';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ToolsConnection = {
  __typename?: 'toolsConnection';
  edges: Array<ToolsEdge>;
  pageInfo: PageInfo;
};

export type ToolsDeleteResponse = {
  __typename?: 'toolsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tools>;
};

export type ToolsEdge = {
  __typename?: 'toolsEdge';
  cursor: Scalars['String']['output'];
  node: Tools;
};

export type ToolsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ToolsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ToolsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ToolsFilter>>;
  sort_order?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ToolsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ToolsInsertResponse = {
  __typename?: 'toolsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tools>;
};

export type ToolsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type ToolsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sort_order?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ToolsUpdateResponse = {
  __typename?: 'toolsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tools>;
};

export type User_Credits = Node & {
  __typename?: 'user_credits';
  balance: Scalars['Int']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type User_CreditsConnection = {
  __typename?: 'user_creditsConnection';
  edges: Array<User_CreditsEdge>;
  pageInfo: PageInfo;
};

export type User_CreditsEdge = {
  __typename?: 'user_creditsEdge';
  cursor: Scalars['String']['output'];
  node: User_Credits;
};

export type User_CreditsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_CreditsFilter>>;
  balance?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_CreditsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_CreditsFilter>>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type User_CreditsOrderBy = {
  balance?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type User_Feedback = Node & {
  __typename?: 'user_feedback';
  comment: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  resume_id?: Maybe<Scalars['UUID']['output']>;
  resumes?: Maybe<Resumes>;
  user_id: Scalars['UUID']['output'];
};

export type User_FeedbackConnection = {
  __typename?: 'user_feedbackConnection';
  edges: Array<User_FeedbackEdge>;
  pageInfo: PageInfo;
};

export type User_FeedbackEdge = {
  __typename?: 'user_feedbackEdge';
  cursor: Scalars['String']['output'];
  node: User_Feedback;
};

export type User_FeedbackFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_FeedbackFilter>>;
  comment?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_FeedbackFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_FeedbackFilter>>;
  resume_id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type User_FeedbackOrderBy = {
  comment?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  resume_id?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

/** Boolean expression comparing fields on type "Datetime" */
export type CreditsQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type CreditsQuery = { user_creditsCollection: { edges: Array<{ node: { balance: number } }> } };

export type ClaimProfileImprovementMutationVariables = Exact<{
  p_client_request_id: string;
}>;

export type ClaimProfileImprovementMutation = { claim_profile_improvement: string | null };

export type ConfirmProfileImprovementMutationVariables = Exact<{
  p_client_request_id: string;
  p_job_id: string;
}>;

export type ConfirmProfileImprovementMutation = { confirm_profile_improvement: unknown };

export type ReleaseProfileImprovementMutationVariables = Exact<{
  p_client_request_id: string;
}>;

export type ReleaseProfileImprovementMutation = { release_profile_improvement: unknown };

export type MarkProfileImprovementUsedMutationVariables = Exact<{
  p_job_id?: string | null | undefined;
}>;

export type MarkProfileImprovementUsedMutation = { mark_profile_improvement_used: unknown };

export type ProfileImprovementRequestQueryVariables = Exact<{ [key: string]: never; }>;

export type ProfileImprovementRequestQuery = { profile_ai_improvementsCollection: { edges: Array<{ node: { client_request_id: string, used_at: string | null } }> } };

export type ProfileImprovementQueryVariables = Exact<{ [key: string]: never; }>;

export type ProfileImprovementQuery = { profile_ai_improvementsCollection: { edges: Array<{ node: { used_at: string | null, applied_at: string | null } }> } };

export type ProfileFieldsFragment = { user_id: string, first_name: string, last_name: string, role: string, tagline: string | null, seniority: Seniority_Level, city: string | null, country: string | null, group_skills: boolean, created_at: string, updated_at: string };

export type ProfileByUserQueryVariables = Exact<{
  userId: string;
}>;

export type ProfileByUserQuery = { profilesCollection: { edges: Array<{ node: { user_id: string, first_name: string, last_name: string, role: string, tagline: string | null, seniority: Seniority_Level, city: string | null, country: string | null, group_skills: boolean, created_at: string, updated_at: string } }> }, contactsCollection: { edges: Array<{ node: { id: string, kind: Contact_Kind, value: string, label: string | null, is_primary: boolean, sort_order: number } }> }, experiencesCollection: { edges: Array<{ node: { id: string, company: string, job_title: string, employment_type: Employment_Type | null, location_type: Location_Type | null, start_date: string, end_date: string | null, is_present: boolean, achievements: Array<string | null>, responsibilities: Array<string | null>, key_contributions: Array<string | null>, stack: Array<string | null>, additional_details: string | null, sort_order: number } }> }, educationsCollection: { edges: Array<{ node: { id: string, name: string, degree_type: string, start_date: string, end_date: string | null, is_present: boolean, additional_details: string | null, sort_order: number } }> }, projectsCollection: { edges: Array<{ node: { id: string, name: string, url: string | null, additional_details: string, sort_order: number } }> }, recommendationsCollection: { edges: Array<{ node: { id: string, name: string, url: string, additional_details: string, sort_order: number } }> }, skillsCollection: { edges: Array<{ node: { id: string, name: string, group_name: string | null, sort_order: number } }> }, toolsCollection: { edges: Array<{ node: { id: string, name: string, sort_order: number } }> }, linksCollection: { edges: Array<{ node: { id: string, type: string, value: string, sort_order: number } }> }, languagesCollection: { edges: Array<{ node: { id: string, language: string, proficiency: Language_Proficiency, sort_order: number } }> }, headline_achievementsCollection: { edges: Array<{ node: { id: string, value: string, label: string, sort_order: number } }> } };

export type ListResumeFragment = { id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string };

export type ResumesByUserQueryVariables = Exact<{
  userId: string;
  type?: Resume_Type | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;

export type ResumesByUserQuery = { resumesCollection: { edges: Array<{ node: { id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type ResumeByIdQueryVariables = Exact<{
  id: string;
}>;

export type ResumeByIdQuery = { resumesCollection: { edges: Array<{ node: { content: string, id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string } }> } };

export type InsertResumeMutationVariables = Exact<{
  objects: Array<ResumesInsertInput> | ResumesInsertInput;
}>;

export type InsertResumeMutation = { insertIntoresumesCollection: { affectedCount: number, records: Array<{ content: string, id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string }> } | null };

export type UpdateResumeMutationVariables = Exact<{
  filter: ResumesFilter;
  set: ResumesUpdateInput;
  atMost?: number | null | undefined;
}>;

export type UpdateResumeMutation = { updateresumesCollection: { affectedCount: number, records: Array<{ content: string, id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string }> } };

export type DeleteResumeMutationVariables = Exact<{
  id: string;
  atMost?: number | null | undefined;
}>;

export type DeleteResumeMutation = { deleteFromresumesCollection: { affectedCount: number, records: Array<{ id: string }> } };

export type ResumeByClientDraftQueryVariables = Exact<{
  userId: string;
  clientDraftId: string;
}>;

export type ResumeByClientDraftQuery = { resumesCollection: { edges: Array<{ node: { content: string, id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string } }> } };

export type ResumesBySourceQueryVariables = Exact<{
  sourceId: string;
  first?: number | null | undefined;
}>;

export type ResumesBySourceQuery = { resumesCollection: { edges: Array<{ node: { content: string, id: string, user_id: string, name: string, label: string | null, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, source_resume_id: string | null, created_at: string, updated_at: string } }> } };

export type Apply_Llm_ProposalMutationVariables = Exact<{
  p_request: string;
}>;

export type Apply_Llm_ProposalMutation = { apply_llm_proposal: string | null };

export type Feedback_Prompt_DueMutationVariables = Exact<{ [key: string]: never; }>;

export type Feedback_Prompt_DueMutation = { feedback_prompt_due: string | null };

export type Record_Feedback_PromptMutationVariables = Exact<{ [key: string]: never; }>;

export type Record_Feedback_PromptMutation = { record_feedback_prompt: string | null };

export type Submit_FeedbackMutationVariables = Exact<{
  p_comment: string;
  p_resume_id?: string | null | undefined;
}>;

export type Submit_FeedbackMutation = { submit_feedback: string | null };

export type Record_Trustpilot_ClickMutationVariables = Exact<{ [key: string]: never; }>;

export type Record_Trustpilot_ClickMutation = { record_trustpilot_click: unknown };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;

export type HealthQuery = { __typename: 'Query' };

export type ProfilesCollectionQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type ProfilesCollectionQuery = { profilesCollection: { edges: Array<{ node: { user_id: string } }> } };

export type ResumesCollectionQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type ResumesCollectionQuery = { resumesCollection: { edges: Array<{ node: { id: string } }> } };

export type Save_ProfileMutationVariables = Exact<{
  p_payload: string;
}>;

export type Save_ProfileMutation = { save_profile: string | null };

export const ProfileFieldsFragmentDoc = gql`
    fragment ProfileFields on profiles {
  user_id
  first_name
  last_name
  role
  tagline
  seniority
  city
  country
  group_skills
  created_at
  updated_at
}
    `;
export const ListResumeFragmentDoc = gql`
    fragment ListResume on resumes {
  id
  user_id
  name
  label
  type
  template_key
  color
  font_size
  font_family
  pdf_url
  pdf_media_key
  source_resume_id
  created_at
  updated_at
}
    `;
export const CreditsDocument = gql`
    query Credits($first: Int) {
  user_creditsCollection(first: $first) {
    edges {
      node {
        balance
      }
    }
  }
}
    `;
export const ClaimProfileImprovementDocument = gql`
    mutation ClaimProfileImprovement($p_client_request_id: String!) {
  claim_profile_improvement(p_client_request_id: $p_client_request_id)
}
    `;
export const ConfirmProfileImprovementDocument = gql`
    mutation ConfirmProfileImprovement($p_client_request_id: String!, $p_job_id: UUID!) {
  confirm_profile_improvement(
    p_client_request_id: $p_client_request_id
    p_job_id: $p_job_id
  )
}
    `;
export const ReleaseProfileImprovementDocument = gql`
    mutation ReleaseProfileImprovement($p_client_request_id: String!) {
  release_profile_improvement(p_client_request_id: $p_client_request_id)
}
    `;
export const MarkProfileImprovementUsedDocument = gql`
    mutation MarkProfileImprovementUsed($p_job_id: UUID) {
  mark_profile_improvement_used(p_job_id: $p_job_id)
}
    `;
export const ProfileImprovementRequestDocument = gql`
    query ProfileImprovementRequest {
  profile_ai_improvementsCollection(first: 1) {
    edges {
      node {
        client_request_id
        used_at
      }
    }
  }
}
    `;
export const ProfileImprovementDocument = gql`
    query ProfileImprovement {
  profile_ai_improvementsCollection(first: 1) {
    edges {
      node {
        used_at
        applied_at
      }
    }
  }
}
    `;
export const ProfileByUserDocument = gql`
    query ProfileByUser($userId: UUID!) {
  profilesCollection(filter: {user_id: {eq: $userId}}, first: 1) {
    edges {
      node {
        ...ProfileFields
      }
    }
  }
  contactsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        kind
        value
        label
        is_primary
        sort_order
      }
    }
  }
  experiencesCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        company
        job_title
        employment_type
        location_type
        start_date
        end_date
        is_present
        achievements
        responsibilities
        key_contributions
        stack
        additional_details
        sort_order
      }
    }
  }
  educationsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        name
        degree_type
        start_date
        end_date
        is_present
        additional_details
        sort_order
      }
    }
  }
  projectsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        name
        url
        additional_details
        sort_order
      }
    }
  }
  recommendationsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        name
        url
        additional_details
        sort_order
      }
    }
  }
  skillsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        name
        group_name
        sort_order
      }
    }
  }
  toolsCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        name
        sort_order
      }
    }
  }
  linksCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        type
        value
        sort_order
      }
    }
  }
  languagesCollection(
    filter: {user_id: {eq: $userId}}
    first: 200
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        language
        proficiency
        sort_order
      }
    }
  }
  headline_achievementsCollection(
    filter: {user_id: {eq: $userId}}
    first: 3
    orderBy: [{sort_order: AscNullsLast}]
  ) {
    edges {
      node {
        id
        value
        label
        sort_order
      }
    }
  }
}
    ${ProfileFieldsFragmentDoc}`;
export const ResumesByUserDocument = gql`
    query ResumesByUser($userId: UUID!, $type: resume_type, $first: Int, $after: Cursor) {
  resumesCollection(
    filter: {user_id: {eq: $userId}, type: {eq: $type}}
    orderBy: [{updated_at: DescNullsLast}]
    first: $first
    after: $after
  ) {
    edges {
      node {
        ...ListResume
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const ResumeByIdDocument = gql`
    query ResumeById($id: UUID!) {
  resumesCollection(filter: {id: {eq: $id}}, first: 1) {
    edges {
      node {
        ...ListResume
        content
      }
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const InsertResumeDocument = gql`
    mutation InsertResume($objects: [resumesInsertInput!]!) {
  insertIntoresumesCollection(objects: $objects) {
    affectedCount
    records {
      ...ListResume
      content
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const UpdateResumeDocument = gql`
    mutation UpdateResume($filter: resumesFilter!, $set: resumesUpdateInput!, $atMost: Int) {
  updateresumesCollection(set: $set, filter: $filter, atMost: $atMost) {
    affectedCount
    records {
      ...ListResume
      content
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const DeleteResumeDocument = gql`
    mutation DeleteResume($id: UUID!, $atMost: Int) {
  deleteFromresumesCollection(filter: {id: {eq: $id}}, atMost: $atMost) {
    affectedCount
    records {
      id
    }
  }
}
    `;
export const ResumeByClientDraftDocument = gql`
    query ResumeByClientDraft($userId: UUID!, $clientDraftId: UUID!) {
  resumesCollection(
    filter: {user_id: {eq: $userId}, client_draft_id: {eq: $clientDraftId}}
    first: 1
  ) {
    edges {
      node {
        ...ListResume
        content
      }
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const ResumesBySourceDocument = gql`
    query ResumesBySource($sourceId: UUID!, $first: Int) {
  resumesCollection(
    filter: {source_resume_id: {eq: $sourceId}, pdf_url: {is: NULL}}
    orderBy: [{updated_at: DescNullsLast}]
    first: $first
  ) {
    edges {
      node {
        ...ListResume
        content
      }
    }
  }
}
    ${ListResumeFragmentDoc}`;
export const Apply_Llm_ProposalDocument = gql`
    mutation Apply_Llm_Proposal($p_request: JSON!) {
  apply_llm_proposal(p_request: $p_request)
}
    `;
export const Feedback_Prompt_DueDocument = gql`
    mutation Feedback_Prompt_Due {
  feedback_prompt_due
}
    `;
export const Record_Feedback_PromptDocument = gql`
    mutation Record_Feedback_Prompt {
  record_feedback_prompt
}
    `;
export const Submit_FeedbackDocument = gql`
    mutation Submit_Feedback($p_comment: String!, $p_resume_id: UUID) {
  submit_feedback(p_comment: $p_comment, p_resume_id: $p_resume_id)
}
    `;
export const Record_Trustpilot_ClickDocument = gql`
    mutation Record_Trustpilot_Click {
  record_trustpilot_click
}
    `;
export const HealthDocument = gql`
    query Health {
  __typename
}
    `;
export const ProfilesCollectionDocument = gql`
    query ProfilesCollection($first: Int) {
  profilesCollection(first: $first) {
    edges {
      node {
        user_id
      }
    }
  }
}
    `;
export const ResumesCollectionDocument = gql`
    query ResumesCollection($first: Int) {
  resumesCollection(first: $first) {
    edges {
      node {
        id
      }
    }
  }
}
    `;
export const Save_ProfileDocument = gql`
    mutation Save_Profile($p_payload: JSON!) {
  save_profile(p_payload: $p_payload)
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Credits(variables?: CreditsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreditsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreditsQuery>({ document: CreditsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Credits', 'query', variables);
    },
    ClaimProfileImprovement(variables: ClaimProfileImprovementMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ClaimProfileImprovementMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ClaimProfileImprovementMutation>({ document: ClaimProfileImprovementDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ClaimProfileImprovement', 'mutation', variables);
    },
    ConfirmProfileImprovement(variables: ConfirmProfileImprovementMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ConfirmProfileImprovementMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ConfirmProfileImprovementMutation>({ document: ConfirmProfileImprovementDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ConfirmProfileImprovement', 'mutation', variables);
    },
    ReleaseProfileImprovement(variables: ReleaseProfileImprovementMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ReleaseProfileImprovementMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ReleaseProfileImprovementMutation>({ document: ReleaseProfileImprovementDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ReleaseProfileImprovement', 'mutation', variables);
    },
    MarkProfileImprovementUsed(variables?: MarkProfileImprovementUsedMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MarkProfileImprovementUsedMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<MarkProfileImprovementUsedMutation>({ document: MarkProfileImprovementUsedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MarkProfileImprovementUsed', 'mutation', variables);
    },
    ProfileImprovementRequest(variables?: ProfileImprovementRequestQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ProfileImprovementRequestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ProfileImprovementRequestQuery>({ document: ProfileImprovementRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ProfileImprovementRequest', 'query', variables);
    },
    ProfileImprovement(variables?: ProfileImprovementQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ProfileImprovementQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ProfileImprovementQuery>({ document: ProfileImprovementDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ProfileImprovement', 'query', variables);
    },
    ProfileByUser(variables: ProfileByUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ProfileByUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ProfileByUserQuery>({ document: ProfileByUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ProfileByUser', 'query', variables);
    },
    ResumesByUser(variables: ResumesByUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumesByUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumesByUserQuery>({ document: ResumesByUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ResumesByUser', 'query', variables);
    },
    ResumeById(variables: ResumeByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumeByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumeByIdQuery>({ document: ResumeByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ResumeById', 'query', variables);
    },
    InsertResume(variables: InsertResumeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<InsertResumeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<InsertResumeMutation>({ document: InsertResumeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'InsertResume', 'mutation', variables);
    },
    UpdateResume(variables: UpdateResumeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateResumeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateResumeMutation>({ document: UpdateResumeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateResume', 'mutation', variables);
    },
    DeleteResume(variables: DeleteResumeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteResumeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteResumeMutation>({ document: DeleteResumeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteResume', 'mutation', variables);
    },
    ResumeByClientDraft(variables: ResumeByClientDraftQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumeByClientDraftQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumeByClientDraftQuery>({ document: ResumeByClientDraftDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ResumeByClientDraft', 'query', variables);
    },
    ResumesBySource(variables: ResumesBySourceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumesBySourceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumesBySourceQuery>({ document: ResumesBySourceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ResumesBySource', 'query', variables);
    },
    Apply_Llm_Proposal(variables: Apply_Llm_ProposalMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Apply_Llm_ProposalMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Apply_Llm_ProposalMutation>({ document: Apply_Llm_ProposalDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Apply_Llm_Proposal', 'mutation', variables);
    },
    Feedback_Prompt_Due(variables?: Feedback_Prompt_DueMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Feedback_Prompt_DueMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Feedback_Prompt_DueMutation>({ document: Feedback_Prompt_DueDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Feedback_Prompt_Due', 'mutation', variables);
    },
    Record_Feedback_Prompt(variables?: Record_Feedback_PromptMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Record_Feedback_PromptMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Record_Feedback_PromptMutation>({ document: Record_Feedback_PromptDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Record_Feedback_Prompt', 'mutation', variables);
    },
    Submit_Feedback(variables: Submit_FeedbackMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Submit_FeedbackMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Submit_FeedbackMutation>({ document: Submit_FeedbackDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Submit_Feedback', 'mutation', variables);
    },
    Record_Trustpilot_Click(variables?: Record_Trustpilot_ClickMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Record_Trustpilot_ClickMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Record_Trustpilot_ClickMutation>({ document: Record_Trustpilot_ClickDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Record_Trustpilot_Click', 'mutation', variables);
    },
    Health(variables?: HealthQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<HealthQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<HealthQuery>({ document: HealthDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Health', 'query', variables);
    },
    ProfilesCollection(variables?: ProfilesCollectionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ProfilesCollectionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ProfilesCollectionQuery>({ document: ProfilesCollectionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ProfilesCollection', 'query', variables);
    },
    ResumesCollection(variables?: ResumesCollectionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ResumesCollectionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResumesCollectionQuery>({ document: ResumesCollectionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ResumesCollection', 'query', variables);
    },
    Save_Profile(variables: Save_ProfileMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Save_ProfileMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Save_ProfileMutation>({ document: Save_ProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Save_Profile', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;