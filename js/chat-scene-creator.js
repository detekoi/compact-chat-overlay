document.addEventListener('DOMContentLoaded', () => {
        // Main Chat Scene Creator class
        class ChatSceneCreator {
            constructor() {
                this.instances = {}; // Stores instance data { id: { name, config, ... } }
                this.instanceOrder = []; // Stores the ordered list of instance IDs [id1, id2, ...]
                this.currentInstanceId = null;
                this.draggedItemId = null; // To keep track of the item being dragged
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
                // Removed: maxMessages, showTimestamps, defaultChannel
                this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
                
                // Preview section removed
                
                // OBS setup
                this.instanceUrlConfig = document.getElementById('instanceUrlConfig');
                this.instanceUrlSetup = document.getElementById('instanceUrlSetup');
                this.copyUrlBtnConfig = document.getElementById('copyUrlBtnConfig');
                this.copyUrlBtnSetup = document.getElementById('copyUrlBtnSetup');
                
                // Modal elements
                this.instanceModal = document.getElementById('instanceModal');
                this.modalTitle = document.getElementById('modalTitle');
                this.modalInstanceName = document.getElementById('modalInstanceName');
                this.modalCancelBtn = document.getElementById('modalCancelBtn');
                this.modalCreateBtn = document.getElementById('modalCreateBtn');
            }
            
            // Load instances from localStorage
            loadInstances() {
                // Load the instance data
                const instanceRegistry = localStorage.getItem('twitch-chat-overlay-instances');
                if (instanceRegistry) {
                    try {
                        this.instances = JSON.parse(instanceRegistry);
                    } catch (error) {
                        console.error('Error loading instances:', error);
                        this.showNotification('Error', 'Failed to load saved instance data.', 'error');
                        this.instances = {};
                    }
                }
                
                // Load the instance order
                const savedOrder = localStorage.getItem('twitch-chat-overlay-instanceOrder');
                if (savedOrder) {
                    try {
                        this.instanceOrder = JSON.parse(savedOrder);
                        // Validate order: ensure all ordered IDs exist in instances and vice-versa
                        const instanceIds = Object.keys(this.instances);
                        this.instanceOrder = this.instanceOrder.filter(id => instanceIds.includes(id));
                        instanceIds.forEach(id => {
                            if (!this.instanceOrder.includes(id)) {
                                this.instanceOrder.push(id); // Add missing instances to the end
                            }
                        });
                        
                    } catch (error) {
                        console.error('Error loading instance order:', error);
                        this.showNotification('Error', 'Failed to load instance order. Resetting order.', 'warning');
                        // If order is corrupt, generate from instances
                        this.instanceOrder = Object.keys(this.instances);
                    }
                } else {
                    // If no order saved, generate from instances
                    this.instanceOrder = Object.keys(this.instances);
                }
                
                // Initial render and selection
                this.renderInstanceList();
                
                if (this.instanceOrder.length > 0) {
                    // Select the first instance based on the loaded order
                    const firstInstanceId = this.instanceOrder[0];
                    if (this.instances[firstInstanceId]) {
                        this.selectInstance(firstInstanceId);
                    } else {
                        // Handle case where the first ordered ID might be invalid (though validation should prevent this)
                        this.showEmptyState();
                    }
                } else {
                    this.showEmptyState();
                    // Automatically open the create instance modal if no instances exist
                    this.showCreateInstanceModal();
                }
            }
            // Save instances and their order to localStorage
            saveInstances() {
                try {
                    localStorage.setItem('twitch-chat-overlay-instances', JSON.stringify(this.instances));
                    localStorage.setItem('twitch-chat-overlay-instanceOrder', JSON.stringify(this.instanceOrder));
                } catch (error) {
                    console.error('Error saving instances or order:', error);
                    this.showNotification('Error', 'Failed to save data. LocalStorage may be full.', 'error');
                }
            }
            
            // Render the instance list
            renderInstanceList() {
                this.instanceList.innerHTML = ''; // Clear existing list
                
                // Render based on the instanceOrder array
                this.instanceOrder.forEach(instanceId => {
                    const instance = this.instances[instanceId];
                    if (!instance) {
                        console.warn(`Instance data missing for ordered ID: ${instanceId}. Skipping render.`);
                        return; // Skip if data is somehow missing
                    }
                    
                    const instanceItem = document.createElement('div');
                    instanceItem.className = `instance-item ${instanceId === this.currentInstanceId ? 'active' : ''}`;
                    instanceItem.dataset.id = instanceId;
                    instanceItem.draggable = true; // Make the item draggable
                    
                    instanceItem.innerHTML = `
                        <div class="instance-details" style="pointer-events: none;"> <!-- Prevent details from interfering with drag -->
                            <div class="instance-name">${instance.name}</div>
                            <div class="instance-meta">ID: ${instanceId}</div>
                        </div>
                    `;
                    
                    // Click event to select the instance
                    instanceItem.addEventListener('click', () => {
                        this.selectInstance(instanceId);
                    });
                    
                    // Drag and Drop Event Listeners for each item
                    instanceItem.addEventListener('dragstart', this.handleDragStart.bind(this));
                    instanceItem.addEventListener('dragend', this.handleDragEnd.bind(this));
                    
                    this.instanceList.appendChild(instanceItem);
                });
                
                // Add dragover listeners to the container (needed for drop)
                this.instanceList.addEventListener('dragover', this.handleDragOver.bind(this));
                this.instanceList.addEventListener('dragenter', this.handleDragEnter.bind(this));
                this.instanceList.addEventListener('dragleave', this.handleDragLeave.bind(this));
                this.instanceList.addEventListener('drop', this.handleDrop.bind(this));
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
                this.copyUrlBtnConfig.addEventListener('click', () => this.copyInstanceUrl());
                this.copyUrlBtnSetup.addEventListener('click', () => this.copyInstanceUrl());
                
                // Form input events
                this.setupFormEvents();
                
                // Accordion sections
                document.querySelectorAll('.accordion .accordion-header').forEach(header => {
                    // Remove previous listener if any to prevent duplicates after re-render
                    const newHeader = header.cloneNode(true);
                    header.parentNode.replaceChild(newHeader, header);
                    
                    newHeader.addEventListener('click', () => {
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
                let name = this.modalInstanceName.value.trim();
                
                // If no name is provided, generate a default one like "Scene N"
                if (!name) {
                    let sceneCounter = 1;
                    let defaultName = `Scene ${sceneCounter}`;
                    // Check if an instance with the default name already exists
                    while (Object.values(this.instances).some(instance => instance.name === defaultName)) {
                        sceneCounter++;
                        defaultName = `Scene ${sceneCounter}`;
                    }
                    name = defaultName; // Use the generated name
                }
                
                // Generate ID from name (use the potentially generated name)
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
                
                // Save the instance and update order
                this.instances[id] = newInstance;
                this.instanceOrder.push(id); // Add new instance to the end of the order
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
                // Removed: maxMessages, showTimestamps, lastChannel
                return {}; // Return an empty object or adjust if other defaults are needed later
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
                
                // Removed population for: maxMessages, showTimestamps, defaultChannel
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
                
                // Config object is now simpler, only containing what's necessary
                // If other settings are added later, they would go here.
                const updatedConfig = {}; // Currently empty as no settings are saved
                
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
                
                // Save the new instance and update order
                this.instances[newId] = newInstance;
                // Add the duplicated instance right after the original in the order
                const originalIndex = this.instanceOrder.indexOf(this.currentInstanceId);
                if (originalIndex > -1) {
                    this.instanceOrder.splice(originalIndex + 1, 0, newId);
                } else {
                    this.instanceOrder.push(newId); // Fallback: add to end
                }
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
                    
                    // Remove from our registry and order
                    const deletedId = this.currentInstanceId;
                    delete this.instances[deletedId];
                    this.instanceOrder = this.instanceOrder.filter(id => id !== deletedId);
                    this.saveInstances();
                    
                    // Update UI
                    this.currentInstanceId = null; // Deselect
                    this.renderInstanceList(); // Re-render the list
                    
                    // Select another instance or show empty state
                    if (this.instanceOrder.length > 0) {
                        // Try to select the next item, or the previous if it was the last
                        let newIndex = this.instanceOrder.findIndex(id => id === deletedId); // Find where it *was*
                        if (newIndex >= this.instanceOrder.length) { // If it was last
                            newIndex = this.instanceOrder.length - 1;
                        }
                        if (newIndex < 0) newIndex = 0; // Fallback to first
                        
                        this.selectInstance(this.instanceOrder[newIndex]);
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
                                
                                // Import the instance but sanitize the config
                                const instance = importedInstances[id];
                                this.instances[id] = {
                                    name: instance.name || `Imported Scene ${id}`, // Ensure name exists
                                    createdAt: instance.createdAt || new Date().toISOString(),
                                    lastModified: instance.lastModified || new Date().toISOString(),
                                    config: {} // Keep config empty as per previous logic
                                };
                                
                                // Add to order if it wasn't skipped and isn't already there
                                if (!this.instanceOrder.includes(id)) {
                                    this.instanceOrder.push(id);
                                }
                                importCount++;
                            });
                            
                            // Save and update UI
                            this.saveInstances(); // Saves both instances and the potentially updated order
                            this.renderInstanceList(); // Re-render with new order/items
                            
                            if (importCount > 0) {
                                // If we were in empty state or no instance selected, select the first imported one
                                if (!this.currentInstanceId && this.instanceOrder.length > 0) {
                                    // Find the first ID from the imported set that exists in our final order
                                    const firstImportedIdInOrder = this.instanceOrder.find(orderedId => importedInstances[orderedId]);
                                    if (firstImportedIdInOrder) {
                                        this.selectInstance(firstImportedIdInOrder);
                                    } else if (this.instanceOrder.length > 0) {
                                        // Fallback: select the very first item in the list
                                        this.selectInstance(this.instanceOrder[0]);
                                    }
                                }
                                
                                this.showNotification('Success', `${importCount} instance(s) imported/updated.${skipCount ? ` ${skipCount} skipped.` : ''}`, 'success');
                            } else if (skipCount > 0) {
                                this.showNotification('Info', `Import finished. ${skipCount} instance(s) skipped.`, 'info');
                            } else {
                                this.showNotification('Info', 'No new instances were imported.', 'info');
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
                
                // Update both URL displays
                this.instanceUrlConfig.textContent = instanceUrl;
                this.instanceUrlSetup.textContent = instanceUrl;
            }
            
            // Copy instance URL to clipboard
            copyInstanceUrl() {
                // Use either URL display since they contain the same content
                const url = this.instanceUrlConfig.textContent;
                
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
            
            // --- Drag and Drop Handlers ---
            
            handleDragStart(e) {
                this.draggedItemId = e.target.dataset.id;
                e.dataTransfer.effectAllowed = 'move';
                // Optionally add data to transfer (though not strictly needed if using this.draggedItemId)
                e.dataTransfer.setData('text/plain', this.draggedItemId);
                
                // Add styling to the dragged item
                setTimeout(() => { // Timeout ensures style applies after drag starts
                    e.target.classList.add('dragging');
                }, 0);
            }
            
            handleDragEnd(e) {
                // Clean up styling
                e.target.classList.remove('dragging');
                // Remove any lingering drag-over styles from potential targets
                this.instanceList.querySelectorAll('.instance-item.drag-over').forEach(item => {
                    item.classList.remove('drag-over');
                });
                this.draggedItemId = null; // Clear dragged item ID
            }
            
            handleDragOver(e) {
                e.preventDefault(); // Necessary to allow dropping
                e.dataTransfer.dropEffect = 'move';
                
                const targetItem = e.target.closest('.instance-item');
                if (targetItem && targetItem.dataset.id !== this.draggedItemId) {
                    // Remove previous drag-over class
                    this.instanceList.querySelectorAll('.instance-item.drag-over').forEach(item => {
                        if (item !== targetItem) {
                            item.classList.remove('drag-over');
                        }
                    });
                    // Add class to current target
                    targetItem.classList.add('drag-over');
                }
            }
            
            handleDragEnter(e) {
                e.preventDefault();
                const targetItem = e.target.closest('.instance-item');
                if (targetItem && targetItem.dataset.id !== this.draggedItemId) {
                    // Could add temporary highlight on enter if desired
                }
            }
            
            handleDragLeave(e) {
                const targetItem = e.target.closest('.instance-item');
                // Only remove drag-over if leaving the item itself, not just child elements
                if (targetItem && !targetItem.contains(e.relatedTarget)) {
                    targetItem.classList.remove('drag-over');
                }
                // If leaving the list container entirely
                if (e.target === this.instanceList && !this.instanceList.contains(e.relatedTarget)) {
                     this.instanceList.querySelectorAll('.instance-item.drag-over').forEach(item => {
                        item.classList.remove('drag-over');
                    });
                }
            }
            
            handleDrop(e) {
                e.preventDefault(); // Prevent default drop behavior (like opening link)
                
                const targetItem = e.target.closest('.instance-item');
                const droppedOnId = targetItem ? targetItem.dataset.id : null;
                
                // Remove visual cues
                if (targetItem) targetItem.classList.remove('drag-over');
                this.instanceList.querySelectorAll('.instance-item.dragging').forEach(item => {
                    item.classList.remove('dragging');
                });
                
                if (!this.draggedItemId || this.draggedItemId === droppedOnId) {
                    // Dropped on itself or invalid drag, do nothing
                    this.draggedItemId = null;
                    return;
                }
                
                // Find original index of dragged item
                const originalIndex = this.instanceOrder.indexOf(this.draggedItemId);
                if (originalIndex === -1) {
                    console.error("Dragged item ID not found in order array!");
                    this.draggedItemId = null;
                    return; // Should not happen
                }
                
                // Remove item from its original position
                this.instanceOrder.splice(originalIndex, 1);
                
                // Find index of the item it was dropped on
                const targetIndex = droppedOnId ? this.instanceOrder.indexOf(droppedOnId) : -1;
                
                if (targetIndex > -1) {
                    // Insert before the target item
                    this.instanceOrder.splice(targetIndex, 0, this.draggedItemId);
                } else {
                    // If dropped on the container but not on an item, add to the end
                    this.instanceOrder.push(this.draggedItemId);
                }
                
                // Save the new order and re-render the list
                this.saveInstances();
                this.renderInstanceList(); // Re-render maintains selection if possible
                
                // Ensure the currently selected item remains visually selected after re-render
                if (this.currentInstanceId) {
                    const selectedElement = this.instanceList.querySelector(`.instance-item[data-id="${this.currentInstanceId}"]`);
                    if (selectedElement) {
                        selectedElement.classList.add('active');
                    }
                }
                
                this.draggedItemId = null; // Clear dragged item ID
                this.showNotification('Success', 'Chat scene order updated.', 'success');
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
                // Removed logic for browser settings accordion toggle
            });
        }
});
