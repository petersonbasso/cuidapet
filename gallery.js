/**
 * Google Photos Public Album Fetcher & Renderer
 * 
 * This script fetches photos from a public Google Photos album via a CORS proxy
 * and renders them into a dynamic grid with a specific "mosaic" layout.
 */

const GOOGLE_PHOTOS_ALBUM_URL = 'https://photos.app.goo.gl/Qc4y7t5ha15qC4Q5A'; // Placeholder Album (Cute Pets)

async function fetchGooglePhotos(albumUrl) {
    try {
        console.log('Fetching photos from:', albumUrl);
        // Use allorigins.win as a CORS proxy to fetch the raw HTML of the album page
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(albumUrl)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch album: ${response.status}`);
        }

        const html = await response.text();

        // Regex to extract image URLs from the Google Photos generic JSON structure.
        // We look for patterns that start with "https://lh3.googleusercontent.com/" followed by dimensions/flags.
        // The pattern typically appears in a list of [url, width, height].
        const regex = /\["(https:\/\/lh3\.googleusercontent\.com\/[^"]+)",(\d+),(\d+)\]/g;

        let match;
        const photos = [];
        const seenUrls = new Set(); // To avoid duplicates if the regex matches multiple times

        while ((match = regex.exec(html)) !== null) {
            const url = match[1];
            const width = parseInt(match[2], 10);
            const height = parseInt(match[3], 10);

            // Filter out thumbnails or small icons (arbitrary threshold of 300px)
            if (width > 300 && height > 300) {
                if (!seenUrls.has(url)) {
                    photos.push({
                        url: url,
                        width: width,
                        height: height
                    });
                    seenUrls.add(url);
                }
            }

            // Limit to 6 photos for this specific design (1 Big, 4 Small, 1 Wide)
            if (photos.length >= 6) {
                break;
            }
        }

        console.log(`Found ${photos.length} valid photos`);
        return photos;

    } catch (error) {
        console.error('Error fetching Google Photos:', error);
        return [];
    }
}

function renderGallery(photos) {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    // Clear existing content (loaders or placeholders)
    container.innerHTML = '';

    if (photos.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 col-span-full">Não foi possível carregar as fotos no momento.</p>';
        return;
    }

    // Define layout pattern for up to 6 images
    // Pattern: Big(2x2), Small, Small, Small, Small, Wide(2x1)

    photos.forEach((photo, index) => {
        const div = document.createElement('div');
        const img = document.createElement('img');

        // Base classes for all items
        let classes = 'relative group overflow-hidden rounded-3xl shadow-md cursor-pointer bg-gray-100';

        // Conditional classes based on position
        if (index === 0) {
            // #1: Big Item (Column 1-2, Row 1-2)
            classes += ' col-span-2 row-span-2';
        } else if (index === 5) {
            // #6: Wide Item (Column 1-2 or 3-4 depending on flow, but let's force a 2-span if possible)
            // In a 4-column grid:
            // Row 1: Big(2), Small(1), Small(1)
            // Row 2: Big(2-cont), Small(1), Small(1)
            // Row 3: Wide(2) ... overflow
            classes += ' col-span-2';
        } else {
            // #2, #3, #4, #5: Small Items
            classes += ''; // Default 1x1
        }

        div.className = classes;

        // Image Setup
        img.src = photo.url;
        img.alt = 'Foto da Galeria CuidaPet';
        img.className = 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110';
        img.loading = 'lazy'; // Performance

        // Optional: Add Overlay for the first and last item (as per original design)
        if (index === 0 || index === 5) {
            // Add caption overlay
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6';

            const p1 = document.createElement('p');
            p1.className = 'text-white font-bold text-xl translate-y-4 group-hover:translate-y-0 transition-transform';
            p1.textContent = 'Paciente CuidaPet'; // Generic caption

            const p2 = document.createElement('p');
            p2.className = 'text-brand-light text-sm translate-y-4 group-hover:translate-y-0 transition-transform delay-75';
            p2.textContent = 'Atendimento Domiciliar'; // Generic sub-caption

            overlay.appendChild(p1);
            overlay.appendChild(p2);
            div.appendChild(overlay);
        }

        div.appendChild(img);
        container.appendChild(div);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const galleryContainer = document.getElementById('gallery-grid');
    if (galleryContainer) {
        const photos = await fetchGooglePhotos(GOOGLE_PHOTOS_ALBUM_URL);
        renderGallery(photos);
    }
});
