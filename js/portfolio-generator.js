class PortfolioGenerator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.imageCache = new Map(); // Cache for processed images
    }

    // Utility method to resize image
    async resizeImage(src) {
        // Check cache first
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";  // Handle CORS issues
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set desired dimensions
                canvas.width = 800;
                canvas.height = 600;
                
                // Calculate scaling
                const scale = Math.max(
                    canvas.width / img.width,
                    canvas.height / img.height
                );
                
                // Calculate new dimensions
                const newWidth = img.width * scale;
                const newHeight = img.height * scale;
                
                // Calculate positioning to center the image
                const x = (canvas.width - newWidth) / 2;
                const y = (canvas.height - newHeight) / 2;
                
                // Draw image with white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, x, y, newWidth, newHeight);
                
                // Convert to base64
                const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.85);
                this.imageCache.set(src, resizedImageUrl);
                resolve(resizedImageUrl);
            };
            
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                reject(error);
            };
            
            img.src = src;
        });
    }

    async generatePortfolioItem(item) {
        const resizedImage = await this.resizeImage(item.image);
        return `
            <div class="col-md-6 col-0-gutter">
                <div class="ot-portfolio-item">
                    <figure class="effect-bubba">
                        <img src="${resizedImage}" alt="img02" class="img-responsive" />
                        <figcaption>
                            <h2>${item.title}</h2>
                            <p>${item.description}</p>
                            <a href="#" data-toggle="modal" data-target="#${item.modalId}">View more</a>
                        </figcaption>
                    </figure>
                </div>
            </div>`;
    }

    async generateModal(item) {
        const resizedImage = await this.resizeImage(item.image);
        return `
            <div class="modal fade" id="${item.modalId}" tabindex="-1" role="dialog" aria-labelledby="${item.modalId}-label">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 class="modal-title" id="${item.modalId}-label">${item.title}</h4>
                        </div>
                        <div class="modal-body">
                            <img src="${item.image}" alt="img01" class="img-responsive" />
                            <div class="modal-works">
                                ${item.categories.map(category => `<span>${category}</span>`).join('')}
                            </div>
                            <p>${item.description}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    async generatePortfolio(data) {
        let portfolioHtml = '';
        let modalsHtml = '';

        // Generate portfolio items in rows of two
        for (let i = 0; i < data.items.length; i += 2) {
            portfolioHtml += '<div class="row row-0-gutter">';
            portfolioHtml += await this.generatePortfolioItem(data.items[i]);
            
            if (i + 1 < data.items.length) {
                portfolioHtml += await this.generatePortfolioItem(data.items[i + 1]);
            }
            
            portfolioHtml += '</div>';
        }

        // Generate modals
        for (const item of data.items) {
            modalsHtml += await this.generateModal(item);
        }

        // Add portfolio items and modals to the container
        this.container.innerHTML = portfolioHtml + modalsHtml;
    }

    // Method to load portfolio data from a JSON file
    async loadPortfolioData(jsonFilePath) {
        try {
            const response = await fetch(jsonFilePath);
            const data = await response.json();
            await this.generatePortfolio(data);
        } catch (error) {
            console.error('Error loading portfolio data:', error);
        }
    }
}

// Initialize the portfolio generator
document.addEventListener('DOMContentLoaded', () => {
    const portfolioGenerator = new PortfolioGenerator('portfolio-container');
    portfolioGenerator.loadPortfolioData('portfolio-configuration.json');
});