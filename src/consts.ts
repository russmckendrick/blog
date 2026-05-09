// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Russ McKendrick";
export const SITE_DESCRIPTION =
  "Russ.Cloud - The personal blog of Russ McKendrick";
export const SITE_LONG_DESCRIPTION =
  "The ramblings of a nerd about random things that interest me.";
export const SITE_KEYWORDS = [
  "Blog",
  "Technical",
  "Automation",
  "DevOps",
  "Cloud",
];
export const AUTHOR_NAME = "Russ McKendrick";
export const AUTHOR_EMAIL = "r@russ.email";
export const AUTHOR_GITHUB = "@russmckendrick";
export const AUTHOR_LOCATION = "Nottingham, UK";
export const AUTHOR_HOMEPAGE = "https://www.russ.cloud/about/";
// Programmatic author hub - Person schema lives here, used for `BlogPosting.author.url`
// in JSON-LD where a stable canonical author entity is preferable to the about page.
export const AUTHOR_PAGE = "https://www.russ.cloud/author/russ-mckendrick/";
export const AUTHOR_SLUG = "russ-mckendrick";

export const SOCIAL_LINKS = [
  { name: "github", url: "https://github.com/russmckendrick" },
  { name: "mastodon", url: "https://social.mckendrick.io/@russ" },
  { name: "twitter", url: "https://twitter.com/russmckendrick/" },
  { name: "linkedin", url: "https://www.linkedin.com/in/russmckendrick/" },
  { name: "amazon", url: "https://www.amazon.com/author/russmckendrick" },
  { name: "docker", url: "https://hub.docker.com/u/russmckendrick/" },
  { name: "instagram", url: "https://www.instagram.com/russmckendrick/" },
  { name: "medium", url: "https://russmckendrick.medium.com/" },
  { name: "instapaper", url: "https://www.instapaper.com/p/russmckendrick" },
  { name: "reddit", url: "https://www.reddit.com/user/russmckendrick/" },
  {
    name: "discogs",
    url: "https://www.discogs.com/user/russmck/collection?header=1",
  },
  { name: "applemusic", url: "https://music.apple.com/profile/russmckendrick" },
  { name: "spotify", url: "https://open.spotify.com/user/russmckendrick" },
  { name: "lastfm", url: "https://www.last.fm/user/RussMckendrick" },
];

export const NAVIGATION_ITEMS = [
  { name: "Search", url: "/search/", icon: "search" },
  { name: "Tags", url: "/tags/", icon: "tag" },
  { name: "Tunes", url: "/tunes/", icon: "headphones" },
  { name: "Reading", url: "/reading/", icon: "bookOpen" },
  { name: "About", url: "/about/", icon: "user" },
  { name: "Archives", url: "/archives/", icon: "archive" },
  {
    name: "Source",
    url: "https://github.com/russmckendrick/blog/",
    icon: "github",
    external: true,
  },
];

export const EDIT_POST = {
  url: "https://github.com/russmckendrick/blog/blob/main",
  text: "Suggest Changes",
  appendFilePath: true,
};

export const ERROR_404 = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist",
  heading: "Signal Lost",
  message: "The page you're searching for has vanished into the digital void",
  submessage: "It may have been deleted, moved, or never existed",
  buttonText: "Return Home",
};

export const AI_AUTHOR = {
  name: "AI Generated",
  avatar: "/images/avatars/anon.svg",
  avatarFallback: "/images/avatar-192x192.png",
};

// Tag metadata extracted from Hugo tag index files
// Provides consistent display names, emojis, descriptions, and colors for all tags
// `intro` is an optional 1-2 paragraph block rendered at the top of the tag page
// (purely additive - keep `description` short for meta tags).
export interface TagMetadata {
  title: string;
  description: string;
  colorLight: string;
  colorDark: string;
  intro?: string;
}

export const TAG_METADATA: Record<string, TagMetadata> = {
  ai: {
    title: "AI 🤖",
    description: "All my posts about AI",
    colorLight:
      "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-600/10",
    colorDark:
      "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/20",
  },
  ansible: {
    title: "Ansible 👨‍💻",
    description: "All my posts about Ansible",
    colorLight: "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10",
    colorDark:
      "dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-400/20",
    intro:
      "Walk-throughs and field notes on Ansible - playbooks, roles, dynamic inventories, and using it to drive provisioning across cloud and on-prem fleets. Most of these posts come from production-shaped problems I hit while writing or reviewing my Ansible books, so they lean towards 'here is what actually worked' rather than greenfield demos.",
  },
  author: {
    title: "Author 📚",
    description: "All the posts about the books I have written.",
    colorLight: "bg-amber-50 text-amber-700 inset-ring inset-ring-amber-600/10",
    colorDark:
      "dark:bg-amber-400/10 dark:text-amber-400 dark:inset-ring-amber-400/20",
  },
  automation: {
    title: "Automation 🤖",
    description: "All my posts about Automation",
    colorLight:
      "bg-indigo-50 text-indigo-700 inset-ring inset-ring-indigo-700/10",
    colorDark:
      "dark:bg-indigo-400/10 dark:text-indigo-400 dark:inset-ring-indigo-400/30",
  },
  aws: {
    title: "AWS ☁️",
    description: "All my posts about Amazon Web Services",
    colorLight:
      "bg-orange-50 text-orange-700 inset-ring inset-ring-orange-600/10",
    colorDark:
      "dark:bg-orange-400/10 dark:text-orange-400 dark:inset-ring-orange-400/20",
    intro:
      "AWS posts collected over years of running workloads on Amazon Web Services - EC2, ECS, EKS, IAM, S3, Lambda, networking, and the bits of CDK and CloudFormation that show up alongside them. Expect a mix of hands-on tutorials, deeper architecture notes, and post-mortems where things did not go to plan.",
  },
  azure: {
    title: "Azure ☁️",
    description: "All my posts about Microsoft Azure",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10",
    colorDark:
      "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30",
    intro:
      "Microsoft Azure posts spanning AKS, App Service, networking, identity, Bicep and ARM templates, and a fair amount of Terraform-on-Azure. A lot of it lines up with my Azure books - so the focus is on getting useful things running end-to-end rather than feature-by-feature reference reading.",
  },
  blog: {
    title: "Blog 🤷‍♂️",
    description: "Some general Posts",
    colorLight: "bg-gray-50 text-gray-700 inset-ring inset-ring-gray-500/10",
    colorDark:
      "dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20",
  },
  book: {
    title: "Book 📚",
    description: "All the posts about the books I have written and am reading.",
    colorLight:
      "bg-emerald-50 text-emerald-700 inset-ring inset-ring-emerald-600/20",
    colorDark:
      "dark:bg-emerald-400/10 dark:text-emerald-400 dark:inset-ring-emerald-500/20",
  },
  cloud: {
    title: "Cloud ⛅️",
    description: "All my posts about various Cloud technologies",
    colorLight: "bg-sky-50 text-sky-700 inset-ring inset-ring-sky-600/10",
    colorDark:
      "dark:bg-sky-400/10 dark:text-sky-400 dark:inset-ring-sky-400/20",
  },
  code: {
    title: "Code 🐛",
    description: "All my posts about various bits of code and projects",
    colorLight: "bg-green-50 text-green-700 inset-ring inset-ring-green-600/20",
    colorDark:
      "dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20",
  },
  conference: {
    title: "Conference 📢",
    description: "All my posts about attending conferences",
    colorLight:
      "bg-violet-50 text-violet-700 inset-ring inset-ring-violet-600/10",
    colorDark:
      "dark:bg-violet-400/10 dark:text-violet-400 dark:inset-ring-violet-400/20",
  },
  containers: {
    title: "Containers 🐳",
    description:
      "All my posts about Containers, which don't necessarily fit into the Docker posts.",
    colorLight: "bg-cyan-50 text-cyan-700 inset-ring inset-ring-cyan-600/10",
    colorDark:
      "dark:bg-cyan-400/10 dark:text-cyan-400 dark:inset-ring-cyan-400/20",
  },
  devops: {
    title: "DevOps 🦾",
    description: "All my posts about DevOps",
    colorLight: "bg-teal-50 text-teal-700 inset-ring inset-ring-teal-600/10",
    colorDark:
      "dark:bg-teal-400/10 dark:text-teal-400 dark:inset-ring-teal-400/20",
    intro:
      "DevOps posts covering the practices and tooling that hold modern software delivery together - pipelines, containers, infrastructure as code, observability, and the cultural side that decides whether any of it actually lands. Drawn from a couple of decades of running and shipping platforms, with the warts.",
  },
  docker: {
    title: "Docker 🐳",
    description: "All my posts about Docker",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10",
    colorDark:
      "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/30",
    intro:
      "Docker tutorials, image-building patterns, Compose recipes, and the operational details that come with running containers in anger. Several of these posts started life as research for the Docker books I have written, then grew up as the ecosystem changed.",
  },
  github: {
    title: "GitHub 👨‍💻",
    description: "All my posts about GitHub related services and technologies",
    colorLight: "bg-slate-50 text-slate-700 inset-ring inset-ring-slate-600/10",
    colorDark:
      "dark:bg-slate-400/10 dark:text-slate-400 dark:inset-ring-slate-400/20",
  },
  "infrastructure-as-code": {
    title: "Infrastructure as Code 🤖",
    description: "All my posts about Infrastructure as Code",
    colorLight:
      "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-700/10",
    colorDark:
      "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/30",
    intro:
      "Infrastructure-as-Code posts - choosing a tool, structuring modules, dealing with state, integrating with CI, and the team patterns that decide whether an IaC effort sticks. Covers Terraform, Bicep, ARM, Pulumi, and Ansible flavours of the same problem.",
  },
  kubernetes: {
    title: "Kubernetes 🐳",
    description: "All my posts about Kubernetes",
    colorLight: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-600/10",
    colorDark:
      "dark:bg-blue-400/10 dark:text-blue-400 dark:inset-ring-blue-400/20",
    intro:
      "Kubernetes posts ranging from getting a cluster up the first time to the hard bits - networking, storage, ingress, autoscaling, and the failure modes you only meet at 2am. Mostly grounded in real workloads on AKS, EKS, and self-managed clusters.",
  },
  life: {
    title: "Life 👨‍🏫",
    description: "Some general Posts",
    colorLight: "bg-pink-50 text-pink-700 inset-ring inset-ring-pink-700/10",
    colorDark:
      "dark:bg-pink-400/10 dark:text-pink-400 dark:inset-ring-pink-400/20",
  },
  linux: {
    title: "Linux 🐧",
    description: "All my posts about various Linux technologies",
    colorLight:
      "bg-yellow-50 text-yellow-800 inset-ring inset-ring-yellow-600/20",
    colorDark:
      "dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20",
    intro:
      "Linux posts covering distributions, init systems, networking, hardening, packaging, and the small day-to-day tools that make a sysadmin's life less painful. Two-plus decades of running Linux in production, distilled into things I actually use.",
  },
  listened: {
    title: "Listened 🎧",
    description:
      "What did I listen to in a week? For more information, see [here](https://www.russ.fm/)",
    colorLight:
      "bg-fuchsia-50 text-fuchsia-700 inset-ring inset-ring-fuchsia-600/10",
    colorDark:
      "dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:inset-ring-fuchsia-400/20",
  },
  macos: {
    title: "macOS 🍏",
    description: "All my posts about various macOS technologies",
    colorLight: "bg-gray-50 text-gray-700 inset-ring inset-ring-gray-600/10",
    colorDark:
      "dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20",
  },
  packer: {
    title: "Packer 📦",
    description: "All my posts about Packer",
    colorLight: "bg-amber-50 text-amber-700 inset-ring inset-ring-amber-600/10",
    colorDark:
      "dark:bg-amber-400/10 dark:text-amber-400 dark:inset-ring-amber-400/20",
  },
  podman: {
    title: "Podman 🦭",
    description: "All my posts about Podman",
    colorLight:
      "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-600/10",
    colorDark:
      "dark:bg-purple-400/10 dark:text-purple-400 dark:inset-ring-purple-400/20",
  },
  python: {
    title: "Python 🐍",
    description: "All my posts about Python",
    colorLight:
      "bg-yellow-50 text-yellow-700 inset-ring inset-ring-yellow-600/10",
    colorDark:
      "dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20",
    intro:
      "Python posts - automation scripts, small CLIs, glue code that talks to clouds and APIs, and the occasional larger project. Skewed toward operations and platform work rather than data science.",
  },
  security: {
    title: "Security 🔐",
    description: "All my posts about security",
    colorLight: "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10",
    colorDark:
      "dark:bg-red-400/10 dark:text-red-400 dark:inset-ring-red-400/20",
    intro:
      "Practical security posts - hardening, secrets handling, audit trails, network segmentation, and reviewing infrastructure for the obvious mistakes before someone else does. No FUD, no checklists for their own sake.",
  },
  terraform: {
    title: "Terraform 👨‍💻",
    description: "All my posts about Terraform",
    colorLight:
      "bg-violet-50 text-violet-700 inset-ring inset-ring-violet-600/10",
    colorDark:
      "dark:bg-violet-400/10 dark:text-violet-400 dark:inset-ring-violet-400/20",
    intro:
      "Terraform posts on writing modules that survive contact with reality - workspace patterns, remote state, providers across AWS and Azure, drift, and the messy middle of moving an organisation onto infrastructure as code. Heavily informed by writing the Terraform book and reviewing other people's terror-form.",
  },
  tools: {
    title: "Tools 🧰",
    description: "All my posts about various tools",
    colorLight:
      "bg-orange-50 text-orange-700 inset-ring inset-ring-orange-600/10",
    colorDark:
      "dark:bg-orange-400/10 dark:text-orange-400 dark:inset-ring-orange-400/20",
  },
  vinyl: {
    title: "Vinyl 🎧",
    description: "All my posts about Vinyl records I am listening to",
    colorLight: "bg-rose-50 text-rose-700 inset-ring inset-ring-rose-600/10",
    colorDark:
      "dark:bg-rose-400/10 dark:text-rose-400 dark:inset-ring-rose-400/20",
  },
  web: {
    title: "Web 🌍",
    description: "All my posts about this and other web sites",
    colorLight:
      "bg-emerald-50 text-emerald-700 inset-ring inset-ring-emerald-600/10",
    colorDark:
      "dark:bg-emerald-400/10 dark:text-emerald-400 dark:inset-ring-emerald-400/20",
  },
  yearend: {
    title: "Year End 🎉",
    description: "All the posts about my year in listening to vinyl",
    colorLight: "bg-rose-50 text-rose-700 inset-ring inset-ring-rose-600/10",
    colorDark:
      "dark:bg-rose-400/10 dark:text-rose-400 dark:inset-ring-rose-400/20",
  },
};

// Avatars to exclude from random selection (e.g., special purpose avatars)
// Add any avatar filenames here that you don't want to appear in random selection
export const EXCLUDED_AVATARS = [
  "anon.svg",
  "glitch.svg",
  "ai.svg",
  "jobs.svg",
  "arms-folded-02.svg",
  "dark-mode.svg",
  "hipster.svg",
  "matrix.svg",
  "laptop-01.svg",
  "noir.svg",
  "record-02.svg",
];

// Default avatar mappings for tags
// Used when no avatar is specified in post frontmatter
export const TAG_AVATAR_MAP: Record<string, string> = {
  ai: "ai-coffee.svg",
  ansible: "ansible.svg",
  author: "book.svg",
  automation: "devops.svg",
  aws: "cloud.svg",
  azure: "azure.svg",
  blog: "coffee-02.svg",
  book: "book.svg",
  cloud: "cloud.svg",
  code: "terminal.svg",
  conference: "speaker.svg",
  containers: "docker.svg",
  devops: "devops.svg",
  docker: "docker.svg",
  github: "github.svg",
  "infrastructure-as-code": "founder.svg",
  kubernetes: "docker.svg",
  life: "watch.svg",
  linux: "linux.svg",
  listened: "headphones.svg",
  macos: "laptop-02.svg",
  packer: "hoodie-down.svg",
  podman: "docker.svg",
  python: "python.svg",
  security: "hacker.svg",
  terraform: "terminal.svg",
  tools: "cables.svg",
  vinyl: "record-01.svg",
  web: "keyboard.svg",
};

// Cloudflare Image Transformation Presets
// Single source of truth for all image quality and size settings
export const CF_IMAGE_PRESETS = {
  // Default quality for all images
  default: {
    quality: 60,
  },

  // Hero images for blog posts
  hero: {
    quality: 60,
    format: "avif" as const,
    fit: "cover" as const,
    widths: [640, 720, 1024, 1536, 2048],
  },

  // PostCard thumbnails (vertical layout, priority/high quality for LCP)
  thumbnailPriority: {
    quality: 38,
    format: "auto" as const,
    fit: "cover" as const,
    widths: [400, 600, 800, 1200], // Mobile-first: smaller widths for better mobile LCP
  },

  // PostCard thumbnails (vertical layout)
  thumbnail: {
    quality: 25,
    format: "avif" as const,
    fit: "cover" as const,
    widths: [256, 320, 400, 600, 800, 1200], // Mobile-first: smaller widths
  },

  // Post card thumbnails (horizontal layout)
  thumbnailHorizontal: {
    quality: 25,
    format: "avif" as const,
    fit: "cover" as const,
    widths: [256, 320, 384, 512],
  },

  // Gallery/lightbox images (high quality)
  gallery: {
    quality: 60,
    format: "avif" as const,
    fit: "scale-down" as const,
    widths: [1024, 1536, 2048, 2560],
  },

  // Avatar images
  avatar: {
    quality: 60,
    format: "auto" as const,
    fit: "cover" as const,
    widths: [40, 48, 80, 96, 160, 192],
  },

  // LQIP (Low Quality Image Placeholder) - tiny blurred preview
  lqip: {
    quality: 20,
    width: 32,
    format: "avif" as const,
    fit: "cover" as const,
  },

  // Link preview OG images
  linkPreview: {
    quality: 60,
    format: "avif" as const,
    fit: "cover" as const,
    widths: [300, 600, 800, 1200],
  },

  // Favicon fallback for link previews
  favicon: {
    quality: 85,
    format: "auto" as const,
    fit: "contain" as const,
    widths: [64, 96, 128],
  },
};
