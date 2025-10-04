#!/usr/bin/env node

/**
 * Internal Link Analysis Script
 *
 * Analyzes internal linking patterns across blog posts to identify:
 * - Orphaned pages (0 internal links)
 * - Pages with low internal link count (< 3)
 *
 * This helps improve SEO by ensuring good internal link distribution.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert title to URL-friendly slug (copied from src/utils/url.ts)
 */
function createUrlFriendlySlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Configuration
const LOW_LINK_THRESHOLD = 3;

/**
 * Extract all markdown links from content
 */
function extractLinks(content) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    });
  }

  return links;
}

/**
 * Check if a URL is an internal blog post link
 */
function isInternalBlogLink(url) {
  // Match date-based URLs: /YYYY/MM/DD/slug/
  const datePattern = /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/;

  // Remove any anchors or query params
  const cleanUrl = url.split('#')[0].split('?')[0];

  return datePattern.test(cleanUrl);
}

/**
 * Generate URL for a post
 */
function getPostUrl(post) {
  const date = new Date(post.data.pubDate || post.data.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const slug = createUrlFriendlySlug(post.data.title);

  return `/${year}/${month}/${day}/${slug}/`;
}

/**
 * Read all markdown/mdx files from a directory
 */
async function readContentCollection(collectionPath, collectionName) {
  const posts = [];
  const files = await fs.readdir(collectionPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(collectionPath, file.name);

    if (file.isDirectory()) {
      // Check for index.md or index.mdx
      try {
        const indexMd = path.join(fullPath, 'index.md');
        const indexMdx = path.join(fullPath, 'index.mdx');
        let contentPath;

        if (await fs.access(indexMd).then(() => true).catch(() => false)) {
          contentPath = indexMd;
        } else if (await fs.access(indexMdx).then(() => true).catch(() => false)) {
          contentPath = indexMdx;
        }

        if (contentPath) {
          const content = await fs.readFile(contentPath, 'utf-8');
          const { data, content: body } = matter(content);
          posts.push({
            id: file.name,
            collection: collectionName,
            data,
            body
          });
        }
      } catch (err) {
        // Skip if no index file
      }
    } else if (file.name.endsWith('.md') || file.name.endsWith('.mdx')) {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { data, content: body } = matter(content);
      posts.push({
        id: file.name.replace(/\.(md|mdx)$/, ''),
        collection: collectionName,
        data,
        body
      });
    }
  }

  return posts;
}

/**
 * Main analysis function
 */
async function analyzeInternalLinks() {
  console.log('📊 Analyzing internal links across blog posts...\n');

  const projectRoot = path.resolve(__dirname, '..');
  const blogPath = path.join(projectRoot, 'src', 'content', 'blog');
  const tunesPath = path.join(projectRoot, 'src', 'content', 'tunes');

  // Get all blog posts
  const allPosts = await readContentCollection(blogPath, 'blog');
  const allTunes = await readContentCollection(tunesPath, 'tunes');

  // Filter out drafts
  const publishedPosts = allPosts.filter(post => !post.data.draft);
  const publishedTunes = allTunes.filter(post => !post.data.draft);

  // Combine all posts
  const allContent = [...publishedPosts, ...publishedTunes];

  console.log(`📝 Found ${publishedPosts.length} blog posts and ${publishedTunes.length} tunes\n`);

  // Build URL to post mapping
  const urlToPost = new Map();
  allContent.forEach(post => {
    const url = getPostUrl(post);
    urlToPost.set(url, post);
    // Also add without trailing slash
    urlToPost.set(url.slice(0, -1), post);
  });

  // Count incoming links for each post
  const linkCounts = new Map();
  allContent.forEach(post => {
    linkCounts.set(post.id, { count: 0, sources: [] });
  });

  // Analyze each post for internal links
  allContent.forEach(post => {
    const links = extractLinks(post.body);
    const internalLinks = links.filter(link => isInternalBlogLink(link.url));

    internalLinks.forEach(link => {
      const targetPost = urlToPost.get(link.url) || urlToPost.get(link.url + '/');
      if (targetPost) {
        const stats = linkCounts.get(targetPost.id);
        stats.count++;
        stats.sources.push({
          from: post.data.title,
          fromUrl: getPostUrl(post),
          linkText: link.text
        });
      }
    });
  });

  // Analyze results
  const orphanedPosts = [];
  const lowLinkPosts = [];

  allContent.forEach(post => {
    const stats = linkCounts.get(post.id);
    const url = getPostUrl(post);
    const pubDate = new Date(post.data.pubDate || post.data.date);
    const postInfo = {
      title: post.data.title,
      url,
      collection: post.collection,
      date: pubDate.toISOString().split('T')[0],
      linkCount: stats.count,
      sources: stats.sources
    };

    if (stats.count === 0) {
      orphanedPosts.push(postInfo);
    } else if (stats.count < LOW_LINK_THRESHOLD) {
      lowLinkPosts.push(postInfo);
    }
  });

  // Sort by date (newest first)
  orphanedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  lowLinkPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Report results
  console.log('🔍 ANALYSIS RESULTS\n');
  console.log('=' .repeat(80) + '\n');

  // Orphaned posts
  if (orphanedPosts.length > 0) {
    console.log(`❌ ORPHANED POSTS (${orphanedPosts.length} posts with 0 internal links):\n`);
    orphanedPosts.forEach((post, index) => {
      console.log(`${index + 1}. [${post.collection}] ${post.title}`);
      console.log(`   📅 ${post.date}`);
      console.log(`   🔗 ${post.url}`);
      console.log('');
    });
    console.log('');
  } else {
    console.log('✅ No orphaned posts found!\n\n');
  }

  // Low link count posts
  if (lowLinkPosts.length > 0) {
    console.log(`⚠️  LOW INTERNAL LINKS (${lowLinkPosts.length} posts with < ${LOW_LINK_THRESHOLD} internal links):\n`);
    lowLinkPosts.forEach((post, index) => {
      console.log(`${index + 1}. [${post.collection}] ${post.title} (${post.linkCount} link${post.linkCount !== 1 ? 's' : ''})`);
      console.log(`   📅 ${post.date}`);
      console.log(`   🔗 ${post.url}`);
      console.log(`   Linked from:`);
      post.sources.forEach(source => {
        console.log(`   - "${source.linkText}" in: ${source.from}`);
      });
      console.log('');
    });
    console.log('');
  } else {
    console.log(`✅ No posts with fewer than ${LOW_LINK_THRESHOLD} internal links!\n\n`);
  }

  // Summary statistics
  const totalPosts = allContent.length;
  const wellLinkedPosts = totalPosts - orphanedPosts.length - lowLinkPosts.length;
  const averageLinks = Array.from(linkCounts.values()).reduce((sum, stat) => sum + stat.count, 0) / totalPosts;

  console.log('=' .repeat(80));
  console.log('\n📈 SUMMARY STATISTICS\n');
  console.log(`Total posts: ${totalPosts}`);
  console.log(`Well-linked posts (≥${LOW_LINK_THRESHOLD} links): ${wellLinkedPosts} (${Math.round(wellLinkedPosts / totalPosts * 100)}%)`);
  console.log(`Posts with low links (<${LOW_LINK_THRESHOLD}): ${lowLinkPosts.length} (${Math.round(lowLinkPosts.length / totalPosts * 100)}%)`);
  console.log(`Orphaned posts (0 links): ${orphanedPosts.length} (${Math.round(orphanedPosts.length / totalPosts * 100)}%)`);
  console.log(`Average internal links per post: ${averageLinks.toFixed(2)}`);

  // Top linked posts
  const sortedByLinks = Array.from(linkCounts.entries())
    .map(([id, stats]) => {
      const post = allContent.find(p => p.id === id);
      return { id, post, ...stats };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('\n🏆 TOP 10 MOST LINKED POSTS\n');
  sortedByLinks.forEach((item, index) => {
    console.log(`${index + 1}. ${item.post.data.title} (${item.count} links)`);
    console.log(`   🔗 ${getPostUrl(item.post)}`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 RECOMMENDATIONS\n');

  if (orphanedPosts.length > 0) {
    console.log('• Consider adding links to orphaned posts from related articles');
    console.log('• Use the RelatedPosts component to automatically suggest connections');
  }

  if (lowLinkPosts.length > 0) {
    console.log('• Review posts with low link counts for opportunities to add contextual links');
    console.log('• Add "More posts about [tag]" links within articles');
  }

  if (orphanedPosts.length === 0 && lowLinkPosts.length === 0) {
    console.log('• Excellent internal linking! Keep up the good work.');
    console.log('• Continue to add contextual links when creating new content');
  }

  console.log('\n');
}

// Run analysis
analyzeInternalLinks().catch(console.error);
