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
  BigFloat: { input: string; output: string; }
  BigInt: { input: string; output: string; }
  Cursor: { input: string; output: string; }
  Date: { input: string; output: string; }
  Datetime: { input: string; output: string; }
  JSON: { input: string; output: string; }
  Opaque: { input: unknown; output: unknown; }
  UUID: { input: string; output: string; }
};

export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DateFilter = {
  eq?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
};

export type DatetimeFilter = {
  eq?: InputMaybe<Scalars['Datetime']['input']>;
  gt?: InputMaybe<Scalars['Datetime']['input']>;
  gte?: InputMaybe<Scalars['Datetime']['input']>;
  lt?: InputMaybe<Scalars['Datetime']['input']>;
  lte?: InputMaybe<Scalars['Datetime']['input']>;
};

export type IntFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteFromresumesCollection?: Maybe<ResumesDeleteResponse>;
  generate_pdf?: Maybe<Scalars['String']['output']>;
  insertIntoresumesCollection?: Maybe<ResumesInsertResponse>;
  save_profile?: Maybe<Scalars['String']['output']>;
  updateresumesCollection?: Maybe<ResumesUpdateResponse>;
};

export type MutationDeleteFromresumesCollectionArgs = {
  atMost?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<ResumesFilter>;
};

export type MutationGenerate_PdfArgs = {
  p_resume_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type MutationInsertIntoresumesCollectionArgs = {
  objects: Array<ResumesInsertInput>;
};

export type MutationSave_ProfileArgs = {
  p_payload?: InputMaybe<Scalars['JSON']['input']>;
};

export type MutationUpdateresumesCollectionArgs = {
  atMost?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<ResumesFilter>;
  set: ResumesUpdateInput;
};

export type OrderByDirection =
  | 'AscNullsFirst'
  | 'AscNullsLast'
  | 'DescNullsFirst'
  | 'DescNullsLast';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  contactsCollection?: Maybe<ContactsConnection>;
  educationsCollection?: Maybe<EducationsConnection>;
  experiencesCollection?: Maybe<ExperiencesConnection>;
  languagesCollection?: Maybe<LanguagesConnection>;
  linksCollection?: Maybe<LinksConnection>;
  profilesCollection?: Maybe<ProfilesConnection>;
  projectsCollection?: Maybe<ProjectsConnection>;
  recommendationsCollection?: Maybe<RecommendationsConnection>;
  resumesCollection?: Maybe<ResumesConnection>;
  skillsCollection?: Maybe<SkillsConnection>;
  toolsCollection?: Maybe<ToolsConnection>;
  user_creditsCollection?: Maybe<User_CreditsConnection>;
};

export type QueryContactsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ContactsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ContactsOrderBy>>;
};

export type QueryEducationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<EducationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<EducationsOrderBy>>;
};

export type QueryExperiencesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ExperiencesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ExperiencesOrderBy>>;
};

export type QueryLanguagesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LanguagesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LanguagesOrderBy>>;
};

export type QueryLinksCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<LinksFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<LinksOrderBy>>;
};

export type QueryProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};

export type QueryProjectsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProjectsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProjectsOrderBy>>;
};

export type QueryRecommendationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<RecommendationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<RecommendationsOrderBy>>;
};

export type QueryResumesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ResumesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResumesOrderBy>>;
};

export type QuerySkillsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<SkillsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<SkillsOrderBy>>;
};

export type QueryToolsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ToolsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ToolsOrderBy>>;
};

export type QueryUser_CreditsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_CreditsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_CreditsOrderBy>>;
};

export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type Contact_Kind =
  | 'email'
  | 'phone'
  | 'url';

export type Contacts = {
  __typename?: 'contacts';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  is_primary: Scalars['Boolean']['output'];
  kind: Contact_Kind;
  label?: Maybe<Scalars['String']['output']>;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
  value: Scalars['String']['output'];
};

export type ContactsConnection = {
  __typename?: 'contactsConnection';
  edges: Array<ContactsEdge>;
  pageInfo: PageInfo;
};

export type ContactsEdge = {
  __typename?: 'contactsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Contacts>;
};

export type ContactsFilter = {
  id?: InputMaybe<UuidFilter>;
  kind?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ContactsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Educations = {
  __typename?: 'educations';
  additional_details?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  degree_type: Scalars['String']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  end_date?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  is_present: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
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

export type EducationsEdge = {
  __typename?: 'educationsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Educations>;
};

export type EducationsFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type EducationsOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
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

export type Experiences = {
  __typename?: 'experiences';
  achievements: Array<Scalars['String']['output']>;
  additional_details?: Maybe<Scalars['String']['output']>;
  company: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  employment_type?: Maybe<Employment_Type>;
  end_date?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  is_present: Scalars['Boolean']['output'];
  job_title: Scalars['String']['output'];
  key_contributions: Array<Scalars['String']['output']>;
  location_type?: Maybe<Location_Type>;
  responsibilities: Array<Scalars['String']['output']>;
  sort_order: Scalars['Int']['output'];
  start_date: Scalars['Date']['output'];
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ExperiencesConnection = {
  __typename?: 'experiencesConnection';
  edges: Array<ExperiencesEdge>;
  pageInfo: PageInfo;
};

export type ExperiencesEdge = {
  __typename?: 'experiencesEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Experiences>;
};

export type ExperiencesFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ExperiencesOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
  start_date?: InputMaybe<OrderByDirection>;
};

export type Language_Proficiency =
  | 'beginner'
  | 'fluent'
  | 'intermediate'
  | 'native';

export type Languages = {
  __typename?: 'languages';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  language: Scalars['String']['output'];
  proficiency: Language_Proficiency;
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type LanguagesConnection = {
  __typename?: 'languagesConnection';
  edges: Array<LanguagesEdge>;
  pageInfo: PageInfo;
};

export type LanguagesEdge = {
  __typename?: 'languagesEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Languages>;
};

export type LanguagesFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type LanguagesOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Links = {
  __typename?: 'links';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
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

export type LinksEdge = {
  __typename?: 'linksEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Links>;
};

export type LinksFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type LinksOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Location_Type =
  | 'hybrid'
  | 'office'
  | 'remote';

export type Profiles = {
  __typename?: 'profiles';
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  first_name: Scalars['String']['output'];
  last_name: Scalars['String']['output'];
  role: Scalars['String']['output'];
  seniority: Seniority_Level;
  tagline?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ProfilesConnection = {
  __typename?: 'profilesConnection';
  edges: Array<ProfilesEdge>;
  pageInfo: PageInfo;
};

export type ProfilesEdge = {
  __typename?: 'profilesEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Profiles>;
};

export type ProfilesFilter = {
  first_name?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ProfilesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Projects = {
  __typename?: 'projects';
  additional_details: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
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

export type ProjectsEdge = {
  __typename?: 'projectsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Projects>;
};

export type ProjectsFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ProjectsOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Recommendations = {
  __typename?: 'recommendations';
  additional_details: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
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

export type RecommendationsEdge = {
  __typename?: 'recommendationsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Recommendations>;
};

export type RecommendationsFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type RecommendationsOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Resume_Font_Size =
  | 'lg'
  | 'md'
  | 'sm';

export type Resume_Type =
  | 'general'
  | 'job_specific';

export type Resume_TypeFilter = {
  eq?: InputMaybe<Resume_Type>;
  in?: InputMaybe<Array<Resume_Type>>;
};

export type Resumes = {
  __typename?: 'resumes';
  color: Scalars['String']['output'];
  content: Scalars['JSON']['output'];
  created_at: Scalars['Datetime']['output'];
  font_family?: Maybe<Scalars['String']['output']>;
  font_size: Resume_Font_Size;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  pdf_media_key?: Maybe<Scalars['String']['output']>;
  pdf_url?: Maybe<Scalars['String']['output']>;
  template_key: Scalars['String']['output'];
  type: Resume_Type;
  updated_at: Scalars['Datetime']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ResumesConnection = {
  __typename?: 'resumesConnection';
  edges: Array<ResumesEdge>;
  pageInfo: PageInfo;
};

export type ResumesDeleteResponse = {
  __typename?: 'resumesDeleteResponse';
  affectedCount: Scalars['Int']['output'];
  records: Array<Resumes>;
};

export type ResumesEdge = {
  __typename?: 'resumesEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Resumes>;
};

export type ResumesFilter = {
  id?: InputMaybe<UuidFilter>;
  type?: InputMaybe<Resume_TypeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ResumesInsertInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['JSON']['input']>;
  font_family?: InputMaybe<Scalars['String']['input']>;
  font_size?: InputMaybe<Resume_Font_Size>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pdf_media_key?: InputMaybe<Scalars['String']['input']>;
  pdf_url?: InputMaybe<Scalars['String']['input']>;
  template_key?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Resume_Type>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ResumesInsertResponse = {
  __typename?: 'resumesInsertResponse';
  affectedCount: Scalars['Int']['output'];
  records: Array<Resumes>;
};

export type ResumesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type ResumesUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['JSON']['input']>;
  font_family?: InputMaybe<Scalars['String']['input']>;
  font_size?: InputMaybe<Resume_Font_Size>;
  name?: InputMaybe<Scalars['String']['input']>;
  pdf_media_key?: InputMaybe<Scalars['String']['input']>;
  pdf_url?: InputMaybe<Scalars['String']['input']>;
  template_key?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Resume_Type>;
};

export type ResumesUpdateResponse = {
  __typename?: 'resumesUpdateResponse';
  affectedCount: Scalars['Int']['output'];
  records: Array<Resumes>;
};

export type Seniority_Level =
  | 'entry'
  | 'mid'
  | 'senior';

export type Skills = {
  __typename?: 'skills';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type SkillsConnection = {
  __typename?: 'skillsConnection';
  edges: Array<SkillsEdge>;
  pageInfo: PageInfo;
};

export type SkillsEdge = {
  __typename?: 'skillsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Skills>;
};

export type SkillsFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type SkillsOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type Tools = {
  __typename?: 'tools';
  created_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  sort_order: Scalars['Int']['output'];
  user_id: Scalars['UUID']['output'];
};

export type ToolsConnection = {
  __typename?: 'toolsConnection';
  edges: Array<ToolsEdge>;
  pageInfo: PageInfo;
};

export type ToolsEdge = {
  __typename?: 'toolsEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Tools>;
};

export type ToolsFilter = {
  id?: InputMaybe<UuidFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ToolsOrderBy = {
  sort_order?: InputMaybe<OrderByDirection>;
};

export type User_Credits = {
  __typename?: 'user_credits';
  balance: Scalars['Int']['output'];
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
  node?: Maybe<User_Credits>;
};

export type User_CreditsFilter = {
  user_id?: InputMaybe<UuidFilter>;
};

export type User_CreditsOrderBy = {
  updated_at?: InputMaybe<OrderByDirection>;
};

export type CreditsQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type CreditsQuery = { user_creditsCollection: { edges: Array<{ node: { balance: number } | null }> } | null };

export type ProfileFieldsFragment = { user_id: string, first_name: string, last_name: string, role: string, tagline: string | null, seniority: Seniority_Level, city: string | null, country: string | null, created_at: string, updated_at: string };

export type ProfileByUserQueryVariables = Exact<{
  userId: string;
}>;

export type ProfileByUserQuery = { profilesCollection: { edges: Array<{ node: { user_id: string, first_name: string, last_name: string, role: string, tagline: string | null, seniority: Seniority_Level, city: string | null, country: string | null, created_at: string, updated_at: string } | null }> } | null, contactsCollection: { edges: Array<{ node: { id: string, kind: Contact_Kind, value: string, label: string | null, is_primary: boolean, sort_order: number } | null }> } | null, experiencesCollection: { edges: Array<{ node: { id: string, company: string, job_title: string, employment_type: Employment_Type | null, location_type: Location_Type | null, start_date: string, end_date: string | null, is_present: boolean, achievements: Array<string>, responsibilities: Array<string>, key_contributions: Array<string>, additional_details: string | null, sort_order: number } | null }> } | null, educationsCollection: { edges: Array<{ node: { id: string, name: string, degree_type: string, start_date: string, end_date: string | null, is_present: boolean, additional_details: string | null, sort_order: number } | null }> } | null, projectsCollection: { edges: Array<{ node: { id: string, name: string, url: string | null, additional_details: string, sort_order: number } | null }> } | null, recommendationsCollection: { edges: Array<{ node: { id: string, name: string, url: string, additional_details: string, sort_order: number } | null }> } | null, skillsCollection: { edges: Array<{ node: { id: string, name: string, sort_order: number } | null }> } | null, toolsCollection: { edges: Array<{ node: { id: string, name: string, sort_order: number } | null }> } | null, linksCollection: { edges: Array<{ node: { id: string, type: string, value: string, sort_order: number } | null }> } | null, languagesCollection: { edges: Array<{ node: { id: string, language: string, proficiency: Language_Proficiency, sort_order: number } | null }> } | null };

export type ListResumeFragment = { id: string, user_id: string, name: string, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, created_at: string, updated_at: string };

export type ResumesByUserQueryVariables = Exact<{
  userId: string;
  type?: Resume_Type | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;

export type ResumesByUserQuery = { resumesCollection: { edges: Array<{ node: { id: string, user_id: string, name: string, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, created_at: string, updated_at: string } | null }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } | null };

export type ResumeByIdQueryVariables = Exact<{
  id: string;
}>;

export type ResumeByIdQuery = { resumesCollection: { edges: Array<{ node: { content: string, id: string, user_id: string, name: string, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, created_at: string, updated_at: string } | null }> } | null };

export type InsertResumeMutationVariables = Exact<{
  objects: Array<ResumesInsertInput> | ResumesInsertInput;
}>;

export type InsertResumeMutation = { insertIntoresumesCollection: { affectedCount: number, records: Array<{ content: string, id: string, user_id: string, name: string, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, created_at: string, updated_at: string }> } | null };

export type UpdateResumeMutationVariables = Exact<{
  id: string;
  set: ResumesUpdateInput;
  atMost?: number | null | undefined;
}>;

export type UpdateResumeMutation = { updateresumesCollection: { affectedCount: number, records: Array<{ content: string, id: string, user_id: string, name: string, type: Resume_Type, template_key: string, color: string, font_size: Resume_Font_Size, font_family: string | null, pdf_url: string | null, pdf_media_key: string | null, created_at: string, updated_at: string }> } | null };

export type DeleteResumeMutationVariables = Exact<{
  id: string;
  atMost?: number | null | undefined;
}>;

export type DeleteResumeMutation = { deleteFromresumesCollection: { affectedCount: number, records: Array<{ id: string }> } | null };

export type Generate_PdfMutationVariables = Exact<{
  p_resume_id?: string | null | undefined;
}>;

export type Generate_PdfMutation = { generate_pdf: string | null };

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;

export type HealthQuery = { __typename: 'Query' };

export type ProfilesCollectionQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type ProfilesCollectionQuery = { profilesCollection: { edges: Array<{ node: { user_id: string } | null }> } | null };

export type ResumesCollectionQueryVariables = Exact<{
  first?: number | null | undefined;
}>;

export type ResumesCollectionQuery = { resumesCollection: { edges: Array<{ node: { id: string } | null }> } | null };

export type Save_ProfileMutationVariables = Exact<{
  p_payload?: string | null | undefined;
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
  created_at
  updated_at
}
    `;
export const ListResumeFragmentDoc = gql`
    fragment ListResume on resumes {
  id
  user_id
  name
  type
  template_key
  color
  font_size
  font_family
  pdf_url
  pdf_media_key
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
    mutation UpdateResume($id: UUID!, $set: resumesUpdateInput!, $atMost: Int) {
  updateresumesCollection(set: $set, filter: {id: {eq: $id}}, atMost: $atMost) {
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
export const Generate_PdfDocument = gql`
    mutation Generate_Pdf($p_resume_id: UUID) {
  generate_pdf(p_resume_id: $p_resume_id)
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
    mutation Save_Profile($p_payload: JSON) {
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
    Generate_Pdf(variables?: Generate_PdfMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Generate_PdfMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Generate_PdfMutation>({ document: Generate_PdfDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Generate_Pdf', 'mutation', variables);
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
    Save_Profile(variables?: Save_ProfileMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Save_ProfileMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Save_ProfileMutation>({ document: Save_ProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Save_Profile', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;