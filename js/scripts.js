// Load and parse YAML configuration
async function loadConfig() {
    try {
        const response = await fetch('../portfolio-config.yml');
        const yamlText = await response.text();
        return jsyaml.load(yamlText); // Using js-yaml library
    } catch (error) {
        console.error('Error loading configuration:', error);
        return null;
    }
}

// Generate filter buttons with multiple selection support
function generateFilterButtons(config) {
    const filterContainer = document.querySelector('.filter-container');
    filterContainer.innerHTML = ''; // Clear existing buttons
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.setAttribute('data-filter', 'all');
    allButton.textContent = 'All';
    filterContainer.appendChild(allButton);
    
    // Add category buttons
    config.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-filter', category.id);
        button.setAttribute('title', category.description);
        button.textContent = category.label;
        filterContainer.appendChild(button);
    });
}

// Generate gallery items with enforced dimensions
function generateGalleryItems(config) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = ''; // Clear existing items
    
    config.items.forEach(item => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        if (item.featured) galleryItem.classList.add('featured');

        galleryItem.style.width = item.featured ? 
            `${config.settings.masonry.columnWidth * 2}px` : 
            `${config.settings.masonry.columnWidth}px`;
        
        // Add all categories as data attributes
        galleryItem.setAttribute('data-categories', item.categories.join(' '));
        
        // Set dimensions based on configuration or defaults
        const width = item.dimensions?.width || config.settings.defaultImageWidth;
        const height = item.dimensions?.height || config.settings.defaultImageHeight;
        
        // Create container to enforce aspect ratio
        const aspectRatioContainer = document.createElement('div');
        aspectRatioContainer.style.position = 'relative';
        aspectRatioContainer.style.width = '100%';
        aspectRatioContainer.style.paddingBottom = `${(height / width) * 100}%`;
        
        if (item.type === 'video') {
            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'absolute';
            videoContainer.style.top = '0';
            videoContainer.style.left = '0';
            videoContainer.style.width = '100%';
            videoContainer.style.height = '100%';
            
            const video = document.createElement('video');
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.controls = true;
            
            const source = document.createElement('source');
            source.src = `portfolio/${item.filename}`;
            source.type = `video/${item.filename.split('.').pop()}`;
            
            video.appendChild(source);
            videoContainer.appendChild(video);
            aspectRatioContainer.appendChild(videoContainer);
        } else {
            const link = document.createElement('a');
            link.href = `portfolio/${item.filename}`;
            link.setAttribute('data-lightbox', 'gallery');
            link.setAttribute('data-title', item.title);
            link.style.position = 'absolute';
            link.style.top = '0';
            link.style.left = '0';
            link.style.width = '100%';
            link.style.height = '100%';
            
            const img = document.createElement('img');
            img.src = `portfolio/${item.filename}`;
            img.alt = item.title;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.loading = 'lazy';
            
            // Add error handling for images
            img.onerror = function() {
                console.error(`Failed to load image: ${item.filename}`);
                this.src = 'placeholder.jpg'; // Add a placeholder image
            };
            
            link.appendChild(img);
            aspectRatioContainer.appendChild(link);
        }
        
        galleryItem.appendChild(aspectRatioContainer);
        gallery.appendChild(galleryItem);
    });
    
    // Add CSS to enforce dimensions
    const style = document.createElement('style');
    style.textContent = `
        .gallery-item {
            width: ${config.settings.masonry.columnWidth}px;
            margin-bottom: ${config.settings.masonry.gutter}px;
        }
        
        .gallery-item.featured {
            width: ${config.settings.masonry.columnWidth * 2}px;
        }
        
        @media (max-width: 768px) {
            .gallery-item,
            .gallery-item.featured {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize filters with multiple selection support
function initializeFilters() {
    const activeFilters = new Set(['all']);
    
    document.querySelector('.filter-container').addEventListener('click', function(e) {
        if (!e.target.classList.contains('filter-btn')) return;
        
        const filter = e.target.getAttribute('data-filter');
        
        // Handle "All" button
        if (filter === 'all') {
            activeFilters.clear();
            activeFilters.add('all');
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
            });
        } else {
            // Remove "All" from active filters
            activeFilters.delete('all');
            document.querySelector('[data-filter="all"]').classList.remove('active');
            
            // Toggle the clicked filter
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
                e.target.classList.remove('active');
                
                // If no filters are active, activate "All"
                if (activeFilters.size === 0) {
                    activeFilters.add('all');
                    document.querySelector('[data-filter="all"]').classList.add('active');
                }
            } else {
                activeFilters.add(filter);
                e.target.classList.add('active');
            }
        }
        
        // Filter gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            const itemCategories = item.getAttribute('data-categories').split(' ');
            const visible = activeFilters.has('all') || 
                          itemCategories.some(cat => activeFilters.has(cat));
            item.style.display = visible ? 'block' : 'none';
        });
        
        // Update masonry layout
        if (window.msnry) {
            window.msnry.layout();
        }
    });
}

// Initialize masonry layout with responsive handling
function initializeMasonryLayout(config) {
    if (!config.settings.masonry.enabled) return;
    
    const gallery = document.querySelector('.gallery');
    
    // Initialize Masonry after all images are loaded
    imagesLoaded(gallery, function() {
        window.msnry = new Masonry(gallery, {
            itemSelector: '.gallery-item',
            columnWidth: '.gallery-item',  // Use the item itself as column width
            gutter: config.settings.masonry.gutter,
            percentPosition: false,  // Changed to false for exact centering
            transitionDuration: '0.3s',
            fitWidth: true,  // This is important for centering
            initLayout: true
        });
        
        // Initial layout
        window.msnry.layout();
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.msnry) {
                    window.msnry.layout();
                }
            }, 250);
        });
    });
}

// Initialize gallery
document.addEventListener('DOMContentLoaded', async function() {
    const config = await loadConfig();
    if (!config) return;
    
    generateFilterButtons(config);
    generateGalleryItems(config);
    initializeFilters();
    
    if (config.settings.lightboxEnabled) {
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': 'Image %1 of %2',
            'fitImagesInViewport': true
        });
    }
    
    initializeMasonryLayout(config);
});