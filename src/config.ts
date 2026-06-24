import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const config = {
  openai: {
    apiKey: optional('OPENAI_API_KEY'),
    baseUrl: optional('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    textModel: optional('OPENAI_TEXT_MODEL', 'gpt-4o'),
    imageModel: optional('OPENAI_IMAGE_MODEL', 'gpt-image-1'),
  },
  github: {
    token: optional('GITHUB_TOKEN'),
  },
  linkedin: {
    accessToken: optional('LINKEDIN_ACCESS_TOKEN'),
    authorUrn: optional('LINKEDIN_AUTHOR_URN'),
    enabled: Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN),
  },
  blog: {
    baseUrl: optional('BLOG_BASE_URL', 'http://localhost:1313'),
    dir: 'blog',
  },
  sources: {
    sapCommunityRss:
      'https://community.sap.com/khhcw49343/rss/Community?interaction.style=blog',
    dotabap: 'https://generated.dotabap.org/generated.json',
    bestOfUi5:
      'https://raw.githubusercontent.com/ui5-community/bestofui5-data/live-data/data/data.json',
  },
  /** Target audience keywords used for relevance filtering. */
  audienceTopics: [
    'ui5',
    'sapui5',
    'openui5',
    'fiori',
    'fiori elements',
    'rap',
    'restful application programming',
    'btp',
    'business technology platform',
    'abap',
    'abap cloud',
    'cap',
    'cloud application programming',
    'cds',
    'odata',
    'hana',
    's/4hana',
    's4hana',
    'cloud foundry',
    'kyma',
    'destination service',
    'sap build',
    'fiori launchpad',
    'annotations',
    'eslint',
    'workzone',
  ],
  /** require() so it throws early when keys are missing for AI steps */
  requireOpenAI(): { apiKey: string } {
    return { apiKey: required('OPENAI_API_KEY') };
  },
} as const;

export type AppConfig = typeof config;
