const { ipcRenderer } = require('electron');

let selectedProfileIndex = -1;
let originalProfile = null;  // Store original profile data

async function loadProfiles() {
    const profiles = await ipcRenderer.invoke('get-profiles');
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = '';

    profiles.forEach((profile, index) => {
        const li = document.createElement('li');
        li.className = 'profile-item';
        if (index === selectedProfileIndex) {
            li.className += ' selected';
        }

        li.innerHTML = `
            <div class="profile-info">
                <strong>${profile.name}</strong> -
                ${profile.browser} ${profile.channel} -
                ${profile.arguments}
            </div>
        `;

        li.onclick = () => selectProfile(index);
        li.ondblclick = () => launchConfiguration(profile);
        profilesList.appendChild(li);
    });

    updateButtonStates();
}

function selectProfile(index) {
    selectedProfileIndex = index;

    ipcRenderer.invoke('get-profiles').then(allProfiles => {
        if (index >= 0 && index < allProfiles.length) {
            const profile = allProfiles[index];
            originalProfile = { ...profile };
            document.getElementById('profileName').value = profile.name;
            document.getElementById('browser').value = profile.browser;
            document.getElementById('channel').value = profile.channel;
            document.getElementById('arguments').value = profile.arguments;
        }
    });

    loadProfiles();
}

function checkFormChanges() {
    if (!originalProfile || selectedProfileIndex === -1) return false;

    const currentName = document.getElementById('profileName').value;
    const currentBrowser = document.getElementById('browser').value;
    const currentChannel = document.getElementById('channel').value;
    const currentArguments = document.getElementById('arguments').value;

    return currentName !== originalProfile.name ||
           currentBrowser !== originalProfile.browser ||
           currentChannel !== originalProfile.channel ||
           currentArguments !== originalProfile.arguments;
}

function updateButtonStates() {
    const profiles = document.querySelectorAll('.profile-item');
    const moveUpBtn = document.querySelector('button[onclick="moveProfileUp()"]');
    const moveDownBtn = document.querySelector('button[onclick="moveProfileDown()"]');
    const removeBtn = document.querySelector('button[onclick="removeProfile()"]');
    const saveBtn = document.querySelector('button[onclick="saveProfile()"]');

    const isSelected = selectedProfileIndex !== -1;
    const isFirst = selectedProfileIndex === 0;
    const isLast = selectedProfileIndex === profiles.length - 1;
    const hasChanges = checkFormChanges();

    moveUpBtn.disabled = !isSelected || isFirst;
    moveDownBtn.disabled = !isSelected || isLast;
    removeBtn.disabled = !isSelected;
    saveBtn.disabled = !isSelected || !hasChanges;
}

// Add event listeners to form fields to check for changes
function addFormChangeListeners() {
    const fields = ['profileName', 'browser', 'channel', 'arguments'];
    fields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', updateButtonStates);
    });
}

async function saveProfile() {
    if (selectedProfileIndex === -1 || !checkFormChanges()) return;

    const name = document.getElementById('profileName').value;
    const browser = document.getElementById('browser').value;
    const channel = document.getElementById('channel').value;
    const arguments = document.getElementById('arguments').value;

    if (!name) {
        alert('Please enter a configuration name');
        return;
    }

    // Update existing profile
    const profiles = await ipcRenderer.invoke('get-profiles');
    profiles[selectedProfileIndex] = { name, browser, channel, arguments };
    await ipcRenderer.invoke('update-profiles', profiles);

    // Update originalProfile to match the new saved state
    originalProfile = { name, browser, channel, arguments };

    // Reload profiles to show updated data
    loadProfiles();
}

// Modify addProfile to only handle new profiles
async function addProfile() {
    const name = document.getElementById('profileName').value;
    const browser = document.getElementById('browser').value;
    const channel = document.getElementById('channel').value;
    const arguments = document.getElementById('arguments').value;

    if (!name) {
        alert('Please enter a configuration name');
        return;
    }

    const profile = { name, browser, channel, arguments };
    await ipcRenderer.invoke('save-profile', profile);

    // Clear form
    document.getElementById('profileName').value = '';
    document.getElementById('browser').value = 'Edge';
    document.getElementById('channel').value = 'Stable';
    document.getElementById('arguments').value = '';

    loadProfiles();
}

async function removeProfile() {
    if (selectedProfileIndex === -1) return;

    await ipcRenderer.invoke('remove-profile', selectedProfileIndex);
    selectedProfileIndex = -1;
    loadProfiles();
}

async function moveProfileUp() {
    if (selectedProfileIndex <= 0) return;

    await ipcRenderer.invoke('move-profile', {
        fromIndex: selectedProfileIndex,
        toIndex: selectedProfileIndex - 1
    });
    selectedProfileIndex--;
    loadProfiles();
}

async function moveProfileDown() {
    const profiles = document.querySelectorAll('.profile-item');
    if (selectedProfileIndex === -1 || selectedProfileIndex >= profiles.length - 1) return;

    await ipcRenderer.invoke('move-profile', {
        fromIndex: selectedProfileIndex,
        toIndex: selectedProfileIndex + 1
    });
    selectedProfileIndex++;
    loadProfiles();
}

// Add this function to handle double-click
async function launchConfiguration(profile) {
    try {
        await ipcRenderer.invoke('launch-edge', profile);
    } catch (error) {
        alert(`Failed to launch Edge: ${error.message}`);
    }
}

// Add browser change handler
document.getElementById('browser').addEventListener('change', () => {
    updateButtonStates();
});

// Load profiles when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();
    addFormChangeListeners();
});