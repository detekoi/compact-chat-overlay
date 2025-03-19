document.addEventListener('DOMContentLoaded', () => {
        // Main Chat Scene Creator class
        class ChatSceneCreator {
            constructor() {
                this.instances = {};
                this.currentInstanceId = null;
                this.initializeDOM();
                this.loadInstances();
                this.setupEventListeners();
            }
            
            // Initialize DOM references
            initializeDOM() {
                // Instance list panel
                this.instanceList = document.getElementById('instanceList');
                this.createInstanceBtn = document.getElementById('createInstanceBtn');
                this.importBtn = document.getElementById('importBtn');
                this.exportAllBtn = document.getElementById('exportAllBtn');
                
                // Workspace panel
                this.workspaceTitle = document.getElementById('workspaceTitle');
                this.workspaceActions = document.getElementById('workspaceActions');
                this.configLayout = document.getElementById('configLayout');
                this.emptyState = document.getElementById('emptyState');
                this.emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
                this.obsSetup = document.getElementById('obsSetup');
                
                // Instance actions
                this.duplicateBtn = document.getElementById('duplicateBtn');
                this.deleteBtn = document.getElementById('deleteBtn');
                this.exportBtn = document.getElementById('exportBtn');
                
                // Form elements
                this.instanceName = document.getElementById('instanceName');
                this.instanceId = document.getElementById('instanceId');
                this.maxMessages = document.getElementById('maxMessages');
                this.showTimestamps = document.getElementById('showTimestamps');
                this.defaultChannel = document.getElementById('defaultChannel');
                this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
                
                // Preview section removed
                
                // OBS setup
                this.instanceUrl = document.getElementById('instanceUrl');
                this.copyUrlBtn = document.getElementById('copyUrlBtn');
                
                // Modal elements
                this.instanceModal = document.getElementById('instanceModal');
                this.modalTitle = document.getElementById('modalTitle');
                this.modalInstanceName = document.getElementById('modalInstanceName');
                this.modalCancelBtn = document.getElementById('modalCancelBtn');
                this.modalCreateBtn = document.getElementById('modalCreateBtn');
            }
            
            // Load instances from localStorage
            loadInstances() {
                // Get all keys from localStorage
                const instanceRegistry = localStorage.getItem('twitch-chat-overlay-instances');
                
                if (instanceRegistry) {
                    try {
                        this.instances = JSON.parse(instanceRegistry);
                        this.renderInstanceList();
                        
                        // If there are instances, show empty state or load the first one
                        if (Object.keys(this.instances).length > 0) {
                            const firstInstanceId = Object.keys(this.instances)[0];
                            this.selectInstance(firstInstanceId);
                        } else {
                            this.showEmptyState();
                        }
                    } catch (error) {
                        console.error('Error loading instances:', error);
                        this.showNotification('Error', 'Failed to load saved instances.', 'error');
                        this.instances = {};
                        this.showEmptyState();
                    }
                } else {
                    this.showEmptyState();
                    // Automatically open the create instance modal if no instances exist
                    this.showCreateInstanceModal();
                }
            }
            
            // Save instances to localStorage
            saveInstances() {
                try {
                    localStorage.setItem('twitch-chat-overlay-instances', JSON.stringify(this.instances));
                } catch (error) {
                    console.error('Error saving instances:', error);
                    this.showNotification('Error', 'Failed to save instances. LocalStorage may be full.', 'error');
                }
            }
            
            // Render the instance list
            renderInstanceList() {
                this.instanceList.innerHTML = '';
                
                Object.keys(this.instances).forEach(instanceId => {
                    const instance = this.instances[instanceId];
                    const instanceItem = document.createElement('div');
                    instanceItem.className = `instance-item ${instanceId === this.currentInstanceId ? 'active' : ''}`;
                    instanceItem.dataset.id = instanceId;
                    
                    instanceItem.innerHTML = `
                        <div class="instance-details">
                            <div class="instance-name">${instance.name}</div>
                            <div class="instance-meta">ID: ${instanceId}</div>
                        </div>
                    `;
                    
                    instanceItem.addEventListener('click', () => {
                        this.selectInstance(instanceId);
                    });
                    
                    this.instanceList.appendChild(instanceItem);
                });
            }
            
            // Methods for thumbnail rendering removed, since we now use a generic chat icon
            
            // Show empty state when no chat scenes are available
            showEmptyState() {
                this.emptyState.style.display = 'block';
                this.configLayout.style.display = 'none';
                this.workspaceActions.style.display = 'none';
                this.workspaceTitle.textContent = 'Create Your First Chat Scene';
            }
            
            // Setup all event listeners
            setupEventListeners() {
                // Instance creation and management
                this.createInstanceBtn.addEventListener('click', () => this.showCreateInstanceModal());
                this.emptyStateCreateBtn.addEventListener('click', () => this.showCreateInstanceModal());
                this.duplicateBtn.addEventListener('click', () => this.duplicateInstance());
                this.deleteBtn.addEventListener('click', () => this.deleteInstance());
                this.exportBtn.addEventListener('click', () => this.exportInstance(this.currentInstanceId));
                this.exportAllBtn.addEventListener('click', () => this.exportAllInstances());
                this.importBtn.addEventListener('click', () => this.importInstances());
                
                // Modal events
                this.modalCancelBtn.addEventListener('click', () => this.hideModal());
                this.modalCreateBtn.addEventListener('click', () => this.createInstance());
                
                // Modal keyboard events
                this.modalInstanceName.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.createInstance();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.hideModal();
                    }
                });
                
                // Global escape key for modal
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.instanceModal.style.display === 'flex') {
                        e.preventDefault();
                        this.hideModal();
                    }
                });
                
                // Settings form events
                this.saveSettingsBtn.addEventListener('click', () => this.saveCurrentInstance());
                
                // Preview button removed
                
                // OBS setup
                this.copyUrlBtn.addEventListener('click', () => this.copyInstanceUrl());
                
                // Form input events
                this.setupFormEvents();
                
                // Accordion sections
                document.querySelectorAll('.accordion-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const accordion = header.parentElement;
                        accordion.classList.toggle('active');
                    });
                });
            }
            
            // Setup form input events
            setupFormEvents() {
                // No form events needed for our simplified interface
            }
            
            // Show the create chat scene modal
            showCreateInstanceModal() {
                this.modalTitle.textContent = 'Create New Chat Scene';
                this.modalInstanceName.value = '';
                this.modalCreateBtn.textContent = 'Create';
                this.instanceModal.style.display = 'flex';
                
                // Focus the name input
                setTimeout(() => this.modalInstanceName.focus(), 100);
            }
            
            // Hide the modal
            hideModal() {
                this.instanceModal.style.display = 'none';
            }
            
            // Create a new chat scene
            createInstance() {
                const name = this.modalInstanceName.value.trim();
                
                if (!name) {
                    this.showNotification('Error', 'Please enter a name for your chat scene.', 'error');
                    return;
                }
                
                // Generate ID from name
                let id = this.generateInstanceId(name);
                
                // Make sure ID is URL-friendly
                id = id.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                
                // Check if ID already exists and generate a unique one if needed
                let counter = 1;
                let originalId = id;
                while (this.instances[id]) {
                    id = `${originalId}-${counter}`;
                    counter++;
                }
                
                // Create the new instance with default settings
                const newInstance = {
                    name: name,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    config: this.getDefaultConfig()
                };
                
                // Save the instance
                this.instances[id] = newInstance;
                this.saveInstances();
                
                // Update the UI
                this.hideModal();
                this.renderInstanceList();
                this.selectInstance(id);
                this.showNotification('Success', `Chat scene '${name}' created successfully.`, 'success');
            }
            
            // Generate a unique instance ID from a name
            generateInstanceId(name) {
                // Convert name to lowercase and replace non-alphanumeric chars with dashes
                let id = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                
                // Check if this ID exists already
                let counter = 1;
                let uniqueId = id;
                
                while (this.instances[uniqueId]) {
                    uniqueId = `${id}-${counter}`;
                    counter++;
                }
                
                return uniqueId;
            }
            
            // Get default configuration for new instances
            getDefaultConfig() {
                return {
                    maxMessages: 50,
                    showTimestamps: true,
                    lastChannel: ''
                };
            }
            
            // Select and load an instance
            selectInstance(instanceId) {
                if (!this.instances[instanceId]) {
                    this.showNotification('Error', 'Instance not found.', 'error');
                    return;
                }
                
                this.currentInstanceId = instanceId;
                const instance = this.instances[instanceId];
                
                // Update UI state
                this.emptyState.style.display = 'none';
                this.configLayout.style.display = 'grid';
                this.workspaceActions.style.display = 'flex';
                this.workspaceTitle.textContent = instance.name;
                
                // Update instance list selection
                document.querySelectorAll('.instance-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.id === instanceId);
                });
                
                // Populate form with instance values
                this.populateForm(instance);
                
                // Generate and display instance URL
                this.updateInstanceUrl();
            }
            
            // Populate the form with instance values
            populateForm(instance) {
                const config = instance.config || this.getDefaultConfig();
                
                this.instanceName.value = instance.name;
                this.instanceId.value = this.currentInstanceId;
                
                // Basic settings
                this.maxMessages.value = config.maxMessages || 50;
                this.showTimestamps.checked = config.showTimestamps !== undefined ? config.showTimestamps : true;
                
                // Default channel
                this.defaultChannel.value = config.lastChannel || '';
            }
            
            // Save the current instance
            saveCurrentInstance() {
                if (!this.currentInstanceId || !this.instances[this.currentInstanceId]) {
                    this.showNotification('Error', 'No chat scene selected.', 'error');
                    return;
                }
                
                const instance = this.instances[this.currentInstanceId];
                
                // Update basic information
                instance.name = this.instanceName.value.trim();
                instance.lastModified = new Date().toISOString();
                
                // Create a new simplified config object with only the relevant properties
                const updatedConfig = {
                    maxMessages: parseInt(this.maxMessages.value),
                    showTimestamps: this.showTimestamps.checked,
                    lastChannel: this.defaultChannel.value.trim()
                };
                
                // Update the instance config
                instance.config = updatedConfig;
                
                // Save to localStorage
                this.saveInstances();
                
                // Also save to instance-specific storage for the overlay to use
                this.saveToInstanceStorage();
                
                // Update UI
                this.workspaceTitle.textContent = instance.name;
                this.renderInstanceList();
                this.updateInstanceUrl();
                
                this.showNotification('Success', 'Chat scene saved successfully.', 'success');
            }
            
            // Save to instance-specific localStorage key
            saveToInstanceStorage() {
                const config = this.instances[this.currentInstanceId].config;
                localStorage.setItem(`twitch-chat-overlay-config-${this.currentInstanceId}`, JSON.stringify(config));
            }
            
            // Duplicate the current instance
            duplicateInstance() {
                if (!this.currentInstanceId) {
                    this.showNotification('Error', 'No instance selected to duplicate.', 'error');
                    return;
                }
                
                const sourceInstance = this.instances[this.currentInstanceId];
                const newName = `${sourceInstance.name} (Copy)`;
                const newId = this.generateInstanceId(newName);
                
                // Create a deep copy of the instance
                const newInstance = {
                    name: newName,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    config: JSON.parse(JSON.stringify(sourceInstance.config))
                };
                
                // Save the new instance
                this.instances[newId] = newInstance;
                this.saveInstances();
                
                // Update UI
                this.renderInstanceList();
                this.selectInstance(newId);
                
                this.showNotification('Success', `Instance '${sourceInstance.name}' duplicated as '${newName}'.`, 'success');
            }
            
            // Delete the current instance
            deleteInstance() {
                if (!this.currentInstanceId) {
                    this.showNotification('Error', 'No instance selected to delete.', 'error');
                    return;
                }
                
                const instance = this.instances[this.currentInstanceId];
                
                if (confirm(`Are you sure you want to delete the instance "${instance.name}"? This cannot be undone.`)) {
                    // Also remove from instance-specific storage
                    localStorage.removeItem(`twitch-chat-overlay-config-${this.currentInstanceId}`);
                    
                    // Remove from our registry
                    delete this.instances[this.currentInstanceId];
                    this.saveInstances();
                    
                    // Update UI
                    this.currentInstanceId = null;
                    this.renderInstanceList();
                    
                    // Select another instance or show empty state
                    const remainingIds = Object.keys(this.instances);
                    if (remainingIds.length > 0) {
                        this.selectInstance(remainingIds[0]);
                    } else {
                        this.showEmptyState();
                    }
                    
                    this.showNotification('Success', `Instance '${instance.name}' deleted.`, 'success');
                }
            }
            
            // Export a single instance
            exportInstance(instanceId) {
                if (!instanceId || !this.instances[instanceId]) {
                    this.showNotification('Error', 'Instance not found.', 'error');
                    return;
                }
                
                const instance = this.instances[instanceId];
                const exportData = {
                    version: '1.0',
                    type: 'single',
                    timestamp: new Date().toISOString(),
                    data: {
                        [instanceId]: instance
                    }
                };
                
                this.downloadJson(exportData, `twitch-overlay-${instanceId}.json`);
                this.showNotification('Success', `Instance '${instance.name}' exported.`, 'success');
            }
            
            // Export all instances
            exportAllInstances() {
                const exportData = {
                    version: '1.0',
                    type: 'collection',
                    timestamp: new Date().toISOString(),
                    data: this.instances
                };
                
                this.downloadJson(exportData, 'twitch-overlay-instances.json');
                this.showNotification('Success', 'All instances exported.', 'success');
            }
            
            // Helper to download JSON data
            downloadJson(data, filename) {
                const dataStr = JSON.stringify(data, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                const exportLink = document.createElement('a');
                exportLink.setAttribute('href', dataUri);
                exportLink.setAttribute('download', filename);
                exportLink.style.display = 'none';
                
                document.body.appendChild(exportLink);
                exportLink.click();
                document.body.removeChild(exportLink);
            }
            
            // Import instances from file
            importInstances() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importData = JSON.parse(e.target.result);
                            
                            // Validate import data
                            if (!importData.version || !importData.type || !importData.data) {
                                throw new Error('Invalid import file format.');
                            }
                            
                            // Process the imported data
                            const importedInstances = importData.data;
                            let importCount = 0;
                            let skipCount = 0;
                            
                            // For each imported instance
                            Object.keys(importedInstances).forEach(id => {
                                // Check if it already exists
                                if (this.instances[id]) {
                                    // Ask if user wants to overwrite
                                    const overwrite = confirm(`An instance with ID '${id}' already exists. Overwrite?`);
                                    if (!overwrite) {
                                        skipCount++;
                                        return;
                                    }
                                }
                                
                                // Import the instance but sanitize the config to only include relevant properties
                                const instance = importedInstances[id];
                                
                                // Create a clean version with only the properties we need
                                this.instances[id] = {
                                    name: instance.name,
                                    createdAt: instance.createdAt || new Date().toISOString(),
                                    lastModified: instance.lastModified || new Date().toISOString(),
                                    config: {
                                        maxMessages: instance.config.maxMessages || 50,
                                        showTimestamps: instance.config.showTimestamps !== undefined ? 
                                            instance.config.showTimestamps : true,
                                        lastChannel: instance.config.lastChannel || ''
                                    }
                                };
                                importCount++;
                            });
                            
                            // Save and update UI
                            this.saveInstances();
                            this.renderInstanceList();
                            
                            if (importCount > 0) {
                                // If we were in empty state, select the first imported instance
                                if (!this.currentInstanceId) {
                                    const firstId = Object.keys(importedInstances)[0];
                                    if (this.instances[firstId]) {
                                        this.selectInstance(firstId);
                                    }
                                }
                                
                                this.showNotification('Success', `${importCount} instance(s) imported successfully.${skipCount ? ` ${skipCount} skipped.` : ''}`, 'success');
                            } else {
                                this.showNotification('Info', 'No instances were imported.', 'info');
                            }
                            
                        } catch (error) {
                            console.error('Import error:', error);
                            this.showNotification('Error', 'Failed to import instances. Invalid file format.', 'error');
                        }
                    };
                    
                    reader.readAsText(file);
                });
                
                input.click();
            }
            
            // Update the instance URL display
            updateInstanceUrl() {
                if (!this.currentInstanceId) return;
                
                // Get base path to chat.html
                const basePath = window.location.href.replace(/\/[^\/]*$/, '/chat.html');
                const instanceUrl = `${basePath}?scene=${this.currentInstanceId}`;
                
                this.instanceUrl.textContent = instanceUrl;
            }
            
            // Copy instance URL to clipboard
            copyInstanceUrl() {
                const url = this.instanceUrl.textContent;
                
                navigator.clipboard.writeText(url)
                    .then(() => {
                        this.showNotification('Success', 'URL copied to clipboard.', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy URL:', err);
                        this.showNotification('Error', 'Failed to copy URL. Please try selecting and copying manually.', 'error');
                    });
            }
            
            // Show notification
            showNotification(title, message, type) {
                const container = document.getElementById('notification-container');
                
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                
                notification.innerHTML = `
                    <div class="notification-content">
                        <div class="notification-title">${title}</div>
                        <div class="notification-message">${message}</div>
                    </div>
                    <button class="notification-close">&times;</button>
                `;
                
                // Add close button event
                const closeBtn = notification.querySelector('.notification-close');
                closeBtn.addEventListener('click', () => {
                    this.removeNotification(notification);
                });
                
                // Add to container
                container.appendChild(notification);
                
                // Auto remove after delay
                setTimeout(() => {
                    this.removeNotification(notification);
                }, 5000);
            }
            
            // Remove notification with animation
            removeNotification(notification) {
                notification.classList.add('hiding');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }
        
        // Initialize the Chat Scene Creator
        const manager = new ChatSceneCreator();
        
        // Add style to animate message transitions
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Toggle OBS Setup Instructions
        const toggleObsSetupBtn = document.getElementById('toggleObsSetupBtn');
        const obsSetup = document.getElementById('obsSetup');
        
        toggleObsSetupBtn.addEventListener('click', () => {
            const isVisible = obsSetup.style.display !== 'none';
            
            obsSetup.style.display = isVisible ? 'none' : 'block';
            toggleObsSetupBtn.textContent = isVisible ? 
                'Show OBS Setup Instructions' : 
                'Hide OBS Setup Instructions';
        });
        
        // Toggle Browser Settings Accordion
        const browserSettingsHeader = document.querySelector('#browserSettingsAccordion .accordion-header');
        const browserSettingsContent = document.querySelector('#browserSettingsAccordion .accordion-content');
        const browserSettingsIcon = document.querySelector('#browserSettingsAccordion .accordion-icon');
        
        if (browserSettingsHeader && browserSettingsContent) {
            browserSettingsHeader.addEventListener('click', () => {
                const isVisible = browserSettingsContent.style.display !== 'none';
                browserSettingsContent.style.display = isVisible ? 'none' : 'block';
                browserSettingsIcon.textContent = isVisible ? '▼' : '▲';
            });
        }
});