import fs from 'fs';
import path from 'path';

const tunesDir = path.join(process.cwd(), 'src/content/tunes');

// Helper to escape special characters for regex if needed
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function migrate() {
    try {
        const files = fs.readdirSync(tunesDir).filter(file => file.endsWith('.mdx'));

        for (const file of files) {
            const filePath = path.join(tunesDir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Skip if already migrated
            if (content.includes('<LightGallery')) {
                console.log(`Skipping ${file} (already contains LightGallery)`);
                continue;
            }

            console.log(`Processing ${file}...`);

            const imgRegex = /<Img\s+src="([^"]+)"\s+alt="([^"]+)"\s*\/>/g;

            const sections = content.split(/^## /m);

            let newContent = sections[0]; // Header part (frontmatter etc)

            for (let i = 1; i < sections.length; i++) {
                let section = '## ' + sections[i];

                // Find all images in this section
                const matches = [...section.matchAll(imgRegex)];

                if (matches.length === 2) {
                    const [img1, img2] = matches;

                    // Construct LightGallery component
                    const lightGallery = `
<LightGallery
  layout={{
    imgs: [
      { src: "${img1[1]}", alt: "${img1[2]}" },
      { src: "${img2[1]}", alt: "${img2[2]}" }
    ]
  }}
/>`;

                    // Replace first image
                    section = section.replace(img1[0], lightGallery.trim());

                    // Replace second image
                    section = section.replace(img2[0], '');

                    console.log(`  Migrated section in ${file}`);
                } else if (matches.length > 0) {
                    console.log(`  Warning: Found ${matches.length} images in a section in ${file}, skipping section migration.`);
                }

                newContent += section;
            }

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent);
                console.log(`Updated ${file}`);
            }
        }
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
