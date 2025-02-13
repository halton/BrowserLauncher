const { ipcRenderer } = require('electron');

let selectedProfileIndex = -1;

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
                ${profile.channel} -
                ${profile.arguments}
            </div>
        `;

        li.onclick = () => selectProfile(index);
        profilesList.appendChild(li);
    });

    updateButtonStates();
}

function selectProfile(index) {
    selectedProfileIndex = index;
    loadProfiles();
}

function updateButtonStates() {
    const profiles = document.querySelectorAll('.profile-item');
    const moveUpBtn = document.querySelector('button[onclick="moveProfileUp()"]');
    const moveDownBtn = document.querySelector('button[onclick="moveProfileDown()"]');
    const removeBtn = document.querySelector('button[onclick="removeProfile()"]');

    const isSelected = selectedProfileIndex !== -1;
    const isFirst = selectedProfileIndex === 0;
    const isLast = selectedProfileIndex === profiles.length - 1;

    moveUpBtn.disabled = !isSelected || isFirst;
    moveDownBtn.disabled = !isSelected || isLast;
    removeBtn.disabled = !isSelected;
}

async function addProfile() {
    const name = document.getElementById('profileName').value;
    const channel = document.getElementById('channel').value;
    const arguments = document.getElementById('arguments').value;

    if (!name) {
        alert('Please enter a profile name');
        return;
    }

    const profile = { name, channel, arguments };
    await ipcRenderer.invoke('save-profile', profile);

    // Clear form
    document.getElementById('profileName').value = '';
    document.getElementById('arguments').value = '';

    // Reload profiles
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

// Load profiles when the page loads
document.addEventListener('DOMContentLoaded', loadProfiles);