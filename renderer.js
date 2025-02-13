const { ipcRenderer } = require('electron');

async function loadProfiles() {
    const profiles = await ipcRenderer.invoke('get-profiles');
    const profilesList = document.getElementById('profilesList');
    profilesList.innerHTML = '';

    profiles.forEach((profile, index) => {
        const li = document.createElement('li');
        li.className = 'profile-item';

        li.innerHTML = `
            <div class="profile-info">
                <strong>${profile.name}</strong> -
                ${profile.channel} -
                ${profile.arguments}
            </div>
            <div class="profile-actions">
                <button onclick="moveProfile(${index}, ${index - 1})"
                        ${index === 0 ? 'disabled' : ''}
                        class="move-btn">↑</button>
                <button onclick="moveProfile(${index}, ${index + 1})"
                        ${index === profiles.length - 1 ? 'disabled' : ''}
                        class="move-btn">↓</button>
                <button onclick="removeProfile(${index})"
                        class="remove-btn">Remove</button>
            </div>
        `;

        profilesList.appendChild(li);
    });
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

async function removeProfile(index) {
    await ipcRenderer.invoke('remove-profile', index);
    loadProfiles();
}

async function moveProfile(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= (await ipcRenderer.invoke('get-profiles')).length) {
        return;
    }

    await ipcRenderer.invoke('move-profile', { fromIndex, toIndex });
    loadProfiles();
}

// Load profiles when the page loads
document.addEventListener('DOMContentLoaded', loadProfiles);