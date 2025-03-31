class VideoItem extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({
            mode: "open"
        });
        const style = document.createElement("style");
        style.textContent = `
            .video-item {
                display: flex;
                flex-direction: column;
                margin: 16px;
                border-radius: 12px;
                background-color: #1a1a1a;
                color: white;
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                width: 100%;
                max-width: 360px;
                cursor: pointer;
            }
            
            .video-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3);
            }
            
            .thumbnail-container {
                position: relative;
                width: 100%;
                aspect-ratio: 16/9;
                overflow: hidden;
            }
            
            .thumbnail {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            
            .video-item:hover .thumbnail {
                transform: scale(1.05);
            }
            
            .overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 60%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .video-item:hover .overlay {
                opacity: 1;
            }
            
            .play-button {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
                transition: all 0.3s ease;
                border: none;
                background: rgba(0, 0, 0, 0.6);
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            
            .play-button::before {
                content: '';
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 10px 0 10px 18px;
                border-color: transparent transparent transparent white;
                margin-left: 4px;
            }
            
            .video-item:hover .play-button {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .content {
                padding: 12px;
                text-align: left;
            }
            
            .name {
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #ffffff;
                line-height: 1.2;
            }
            
            .description {
                font-size: 14px;
                margin: 0 0 12px 0;
                color: #a0a0a0;
                line-height: 1.4;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 8px;
            }
            
            .action-button {
                padding: 8px 16px;
                border-radius: 6px;
                text-decoration: none;
                color: white;
                font-weight: 500;
                cursor: pointer;
                border: none;
                transition: background-color 0.2s ease, transform 0.2s ease;
            }
            
            .action-button:hover {
                transform: translateY(-2px);
            }
            
            .delete-modal {
                background-color: #303030;
            }
            
            .delete-modal:hover {
                background-color: #ff4444;
            }
            
            .delete {
                background-color: #ff4444;
            }
            
            .delete:hover {
                background-color: #ff2222;
            }
            
            .cancel {
                background-color: #303030;
            }
            
            .cancel:hover {
                background-color: #444444;
            }
            
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                backdrop-filter: blur(4px);
            }
            
            .modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #262626;
                padding: 32px;
                border-radius: 12px;
                text-align: center;
                color: white;
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
                min-width: 300px;
            }
            
            .modal-actions {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-top: 24px;
            }
            
            .duration {
                position: absolute;
                bottom: 8px;
                right: 8px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 2px 4px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
        `;

        const template = document.createElement("template");
        template.innerHTML = `
            <div class="video-item">
                <div class="thumbnail-container">
                    <img class="thumbnail" alt="thumbnail"/>
                    <div class="overlay"></div>
                    <div class="duration">1:50</div>
                    <button class="play-button"></button>
                </div>
                <div class="content">
                    <h3 class="name"></h3>
                    <p class="description"></p>
                    <div class="actions">
                        <button class="action-button delete-modal">Delete</button>
                    </div>
                </div>
            </div>
        `;

        const modalTemplate = document.createElement("template");
        modalTemplate.innerHTML = `
            <div class="modal" id="deleteConfirmModal">
                <div class="modal-content">
                    <p>Are you sure you want to delete this video?</p>
                    <h3 class="name"></h3>
                    <div class="modal-actions">
                        <button class="action-button cancel">Cancel</button>
                        <button class="action-button delete">Delete</button>
                    </div>
                </div>
            </div>
        `;

        this.shadow.appendChild(style);
        this.shadow.appendChild(template.content.cloneNode(true));
        this.shadow.appendChild(modalTemplate.content.cloneNode(true));
        this.initializeModal();
        this.initialize();
    }

    initialize() {
        this.shadowRoot.addEventListener("click", (e) => {
            const target = e.target;
            if (target.classList.contains("delete-modal")) {
                e.stopPropagation();
                return;
            }
            if (target.closest(".video-item")) {
                e.preventDefault();
                this.handlePlay();
            }
        });
    }

    initializeModal() {
        const modal = this.shadow.querySelector("#deleteConfirmModal");
        const cancelButton = modal.querySelector(".cancel");
        const deleteButton = modal.querySelector(".delete");
        const fileNameElement = modal.querySelector(".name");

        this.shadowRoot.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-modal")) {
                e.stopPropagation();
                const fileName = this.getAttribute("name") || "This video";
                fileNameElement.textContent = fileName;
                modal.style.display = "block";
            }
        });

        cancelButton.addEventListener("click", () => {
            modal.style.display = "none";
        });

        deleteButton.addEventListener("click", () => {
            modal.style.display = "none";
            this.handleDelete();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    handlePlay() {
        const videoId = this.getAttribute("video-id");
        window.location.href = `${window.ENV.API_URL}/watch?v=${videoId}`;
    }

    handleDelete() {
        const videoId = this.getAttribute("video-id");
        const deleteButton = this.shadowRoot.querySelector(".delete");

        deleteButton.textContent = "Deleting...";

        fetch(`${window.ENV.API_URL}/video/${videoId}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (response.ok) {
                    this.remove();
                } else {
                    deleteButton.textContent = "Error";
                }
            })
            .catch((error) => {
                deleteButton.textContent = "Error";
                console.error("Error deleting video:", error);
            });
    }

    static get observedAttributes() {
        return ["name", "description", "thumbnail", "video-id", "duration"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "thumbnail") {
            const element = this.shadow.querySelector(`.${name}`);
            if (element) element.src = newValue;
        } else if (name === "name" || name === "description") {
            const element = this.shadow.querySelector(`.${name}`);
            if (element) element.textContent = newValue;
        } else if (name === "duration") {
            const element = this.shadow.querySelector(`.duration`);
            if (element) element.textContent = newValue;
        }
    }

    disconnectedCallback() {
        this.shadowRoot.removeEventListener(
            "click",
            this.shadowRoot.lastEventCallback
        );
    }
}

customElements.define("video-item", VideoItem);