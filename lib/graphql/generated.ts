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
  JSON: { input: unknown; output: unknown; }
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
  generate_pdf?: Maybe<Scalars['String']['output']>;
  save_profile?: Maybe<Scalars['String']['output']>;
};


export type MutationGenerate_PdfArgs = {
  p_resume_id?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationSave_ProfileArgs = {
  p_payload?: InputMaybe<Scalars['JSON']['input']>;
};

export enum OrderByDirection {
  AscNullsFirst = 'AscNullsFirst',
  AscNullsLast = 'AscNullsLast',
  DescNullsFirst = 'DescNullsFirst',
  DescNullsLast = 'DescNullsLast'
}

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

export enum Contact_Kind {
  Email = 'email',
  Phone = 'phone',
  Url = 'url'
}

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

export enum Employment_Type {
  Apprenticeship = 'apprenticeship',
  Contract = 'contract',
  FullTime = 'full_time',
  Internship = 'internship',
  PartTime = 'part_time',
  Seasonal = 'seasonal',
  SelfEmployed = 'self_employed',
  Volunteer = 'volunteer'
}

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

export enum Language_Proficiency {
  Beginner = 'beginner',
  Fluent = 'fluent',
  Intermediate = 'intermediate',
  Native = 'native'
}

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

export enum Location_Type {
  Hybrid = 'hybrid',
  Office = 'office',
  Remote = 'remote'
}

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

export enum Resume_Font_Size {
  Lg = 'lg',
  Md = 'md',
  Sm = 'sm'
}

export enum Resume_Type {
  General = 'general',
  JobSpecific = 'job_specific'
}

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

export type ResumesEdge = {
  __typename?: 'resumesEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Resumes>;
};

export type ResumesFilter = {
  id?: InputMaybe<UuidFilter>;
  type?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type ResumesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export enum Seniority_Level {
  Entry = 'entry',
  Mid = 'mid',
  Senior = 'senior'
}

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
  p_payload?: unknown;
}>;


export type Save_ProfileMutation = { save_profile: string | null };

export type Generate_PdfMutationVariables = Exact<{
  p_resume_id?: string | null | undefined;
}>;


export type Generate_PdfMutation = { generate_pdf: string | null };


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
export const Generate_PdfDocument = gql`
    mutation Generate_Pdf($p_resume_id: UUID) {
  generate_pdf(p_resume_id: $p_resume_id)
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
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
    },
    Generate_Pdf(variables?: Generate_PdfMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Generate_PdfMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Generate_PdfMutation>({ document: Generate_PdfDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Generate_Pdf', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;