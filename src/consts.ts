// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Russ McKendrick';
export const SITE_DESCRIPTION = 'Russ.Cloud - The personal blog of Russ McKendrick';
export const SITE_LONG_DESCRIPTION = 'The ramblings of a nerd about random things that interest me.';
export const SITE_KEYWORDS = ['Blog', 'Technical', 'Automation', 'DevOps', 'Cloud'];
export const AUTHOR_NAME = 'Russ McKendrick';
export const AUTHOR_EMAIL = 'r@russ.email';
export const AUTHOR_GITHUB = '@russmckendrick';
export const AUTHOR_LOCATION = 'Nottingham, UK';
export const AUTHOR_HOMEPAGE = 'https://www.russ.cloud/about/';

export const AI_AUTHOR = {
  name: 'AI Generated',
  avatar: '/images/avatars/glitch.svg',
  avatarFallback: '/images/avatar-192x192.png'
};

export const SOCIAL_LINKS = [
  { name: 'github', url: 'https://github.com/russmckendrick' },
  { name: 'mastodon', url: 'https://social.mckendrick.io/@russ' },
  { name: 'twitter', url: 'https://twitter.com/russmckendrick/' },
  { name: 'linkedin', url: 'https://www.linkedin.com/in/russmckendrick/' },
  { name: 'amazon', url: 'https://www.amazon.com/author/russmckendrick' },
  { name: 'docker', url: 'https://hub.docker.com/u/russmckendrick/' },
  { name: 'instagram', url: 'https://www.instagram.com/russmckendrick/' },
  { name: 'medium', url: 'https://russmckendrick.medium.com/' },
  { name: 'instapaper', url: 'https://www.instapaper.com/p/russmckendrick' },
  { name: 'reddit', url: 'https://www.reddit.com/user/russmckendrick/' },
  { name: 'discogs', url: 'https://www.discogs.com/user/russmck/collection?header=1' },
  { name: 'applemusic', url: 'https://music.apple.com/profile/russmckendrick' },
  { name: 'spotify', url: 'https://open.spotify.com/user/russmckendrick' },
  { name: 'lastfm', url: 'https://www.last.fm/user/RussMckendrick' }
];

export const NAVIGATION_ITEMS = [
  { name: 'Search', url: '/search/', icon: 'search' },
  { name: 'Tags', url: '/tags/', icon: 'tag' },
  { name: 'Tunes', url: '/tunes/', icon: 'headphones' },
  { name: 'About', url: '/about/', icon: 'user' },
  { name: 'Archives', url: '/archives/', icon: 'archive' },
  { name: 'Source', url: 'https://github.com/russmckendrick/blog/', icon: 'github', external: true }
];

export const EDIT_POST = {
  url: 'https://github.com/russmckendrick/blog/blob/main',
  text: 'Suggest Changes',
  appendFilePath: true
};

export const ERROR_404 = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist',
  heading: 'Signal Lost',
  message: 'The page you\'re searching for has vanished into the digital void',
  submessage: 'It may have been deleted, moved, or never existed',
  buttonText: 'Return Home'
};

// Tag metadata extracted from Hugo tag index files
// Provides consistent display names, emojis, descriptions, and colors for all tags
export interface TagMetadata {
  title: string;
  description: string;
  colorLight: string;
  colorDark: string;
}

export const TAG_METADATA: Record<string, TagMetadata> = {
  "ai": {
    title: "AI 🤖",
    description: "All my posts about AI",
    colorLight: "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-600/10",
    colorDark: "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/20"
  },
  "ansible": {
    title: "Ansible 👨‍💻",
    description: "All my posts about Ansible",
    colorLight: "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10",
    colorDark: "dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-400/20"
  },
  "author": {
    title: "Author 📚",
    description: "All the posts about the books I have written.",
    colorLight: "bg-amber-50 text-amber-700 inset-ring inset-ring-amber-600/10",
    colorDark: "dark:bg-amber-400/10 dark:text-amber-400 dark:inset-ring-amber-400/20"
  },
  "automation": {
    title: "Automation 🤖",
    description: "All my posts about Automation",
    colorLight: "bg-indigo-50 text-indigo-700 inset-ring inset-ring-indigo-700/10",
    colorDark: "dark:bg-indigo-400/10 dark:text-indigo-400 dark:inset-ring-indigo-400/30"
  },
  "aws": {
    title: "AWS ☁️",
    description: "All my posts about Amazon Web Services",
    colorLight: "bg-orange-50 text-orange-700 inset-ring inset-ring-orange-600/10",
    colorDark: "dark:bg-orange-400/10 dark:text-orange-400 dark:inset-ring-orange-400/20"
  },
  "azure": {
    title: "Azure ☁️",
    description: "All my posts about Microsoft Azure",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10",
    colorDark: "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30"
  },
  "blog": {
    title: "Blog 🤷‍♂️",
    description: "Some general Posts",
    colorLight: "bg-gray-50 text-gray-600 inset-ring inset-ring-gray-500/10",
    colorDark: "dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20"
  },
  "book": {
    title: "Book 📚",
    description: "All the posts about the books I have written and am reading.",
    colorLight: "bg-emerald-50 text-emerald-700 inset-ring inset-ring-emerald-600/20",
    colorDark: "dark:bg-emerald-400/10 dark:text-emerald-400 dark:inset-ring-emerald-500/20"
  },
  "cloud": {
    title: "Cloud ⛅️",
    description: "All my posts about various Cloud technologies",
    colorLight: "bg-sky-50 text-sky-700 inset-ring inset-ring-sky-600/10",
    colorDark: "dark:bg-sky-400/10 dark:text-sky-400 dark:inset-ring-sky-400/20"
  },
  "code": {
    title: "Code 🐛",
    description: "All my posts about various bits of code and projects",
    colorLight: "bg-green-50 text-green-700 inset-ring inset-ring-green-600/20",
    colorDark: "dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20"
  },
  "conference": {
    title: "Conference 📢",
    description: "All my posts about attending conferences",
    colorLight: "bg-violet-50 text-violet-700 inset-ring inset-ring-violet-600/10",
    colorDark: "dark:bg-violet-400/10 dark:text-violet-400 dark:inset-ring-violet-400/20"
  },
  "containers": {
    title: "Containers 🐳",
    description: "All my posts about Containers, which don't necessarily fit into the Docker posts.",
    colorLight: "bg-cyan-50 text-cyan-700 inset-ring inset-ring-cyan-600/10",
    colorDark: "dark:bg-cyan-400/10 dark:text-cyan-400 dark:inset-ring-cyan-400/20"
  },
  "devops": {
    title: "DevOps 🦾",
    description: "All my posts about DevOps",
    colorLight: "bg-teal-50 text-teal-700 inset-ring inset-ring-teal-600/10",
    colorDark: "dark:bg-teal-400/10 dark:text-teal-400 dark:inset-ring-teal-400/20"
  },
  "docker": {
    title: "Docker 🐳",
    description: "All my posts about Docker",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10",
    colorDark: "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30"
  },
  "github": {
    title: "GitHub 👨‍💻",
    description: "All my posts about GitHub related services and technologies",
    colorLight: "bg-slate-50 text-slate-700 inset-ring inset-ring-slate-600/10",
    colorDark: "dark:bg-slate-400/10 dark:text-slate-400 dark:inset-ring-slate-400/20"
  },
  "infrastructure-as-code": {
    title: "Infrastructure as Code 🤖",
    description: "All my posts about Infrastructure as Code",
    colorLight: "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-700/10",
    colorDark: "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/30"
  },
  "kubernetes": {
    title: "Kubernetes 🐳",
    description: "All my posts about Kubernetes",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-600/10",
    colorDark: "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/20"
  },
  "life": {
    title: "Life 👨‍🏫",
    description: "Some general Posts",
    colorLight: "bg-pink-50 text-pink-700 inset-ring inset-ring-pink-700/10",
    colorDark: "dark:bg-pink-400/10 dark:text-pink-400 dark:inset-ring-pink-400/20"
  },
  "linux": {
    title: "Linux 🐧",
    description: "All my posts about various Linux technologies",
    colorLight: "bg-yellow-50 text-yellow-800 inset-ring inset-ring-yellow-600/20",
    colorDark: "dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20"
  },
  "listened": {
    title: "Listened 🎧",
    description: "What did I listen to in a week? For more information, see [here](https://www.russ.fm/)",
    colorLight: "bg-fuchsia-50 text-fuchsia-700 inset-ring inset-ring-fuchsia-600/10",
    colorDark: "dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:inset-ring-fuchsia-400/20"
  },
  "macos": {
    title: "macOS 🍏",
    description: "All my posts about various macOS technologies",
    colorLight: "bg-gray-50 text-gray-700 inset-ring inset-ring-gray-600/10",
    colorDark: "dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20"
  },
  "packer": {
    title: "Packer 📦",
    description: "All my posts about Packer",
    colorLight: "bg-amber-50 text-amber-700 inset-ring inset-ring-amber-600/10",
    colorDark: "dark:bg-amber-400/10 dark:text-amber-400 dark:inset-ring-amber-400/20"
  },
  "podman": {
    title: "Podman 🦭",
    description: "All my posts about Podman",
    colorLight: "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-600/10",
    colorDark: "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/20"
  },
  "python": {
    title: "Python 🐍",
    description: "All my posts about Python",
    colorLight: "bg-yellow-50 text-yellow-700 inset-ring inset-ring-yellow-600/10",
    colorDark: "dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20"
  },
  "security": {
    title: "Security 🔐",
    description: "All my posts about security",
    colorLight: "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10",
    colorDark: "dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-400/20"
  },
  "terraform": {
    title: "Terraform 👨‍💻",
    description: "All my posts about Terraform",
    colorLight: "bg-violet-50 text-violet-700 inset-ring inset-ring-violet-600/10",
    colorDark: "dark:bg-violet-400/10 dark:text-violet-400 dark:inset-ring-violet-400/20"
  },
  "tools": {
    title: "Tools 🧰",
    description: "All my posts about various tools",
    colorLight: "bg-orange-50 text-orange-700 inset-ring inset-ring-orange-600/10",
    colorDark: "dark:bg-orange-400/10 dark:text-orange-400 dark:inset-ring-orange-400/20"
  },
  "vinyl": {
    title: "Vinyl 🎧",
    description: "All my posts about Vinyl records I am listening to",
    colorLight: "bg-rose-50 text-rose-700 inset-ring inset-ring-rose-600/10",
    colorDark: "dark:bg-rose-400/10 dark:text-rose-400 dark:inset-ring-rose-400/20"
  },
  "web": {
    title: "Web 🌍",
    description: "All my posts about this and other web sites",
    colorLight: "bg-emerald-50 text-emerald-700 inset-ring inset-ring-emerald-600/10",
    colorDark: "dark:bg-emerald-400/10 dark:text-emerald-400 dark:inset-ring-emerald-400/20"
  }
};
