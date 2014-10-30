/**
 * Class to update the UI when a new sound is loaded
 * @constructor
 */
var UIManager = function () {
	var controlPanel = document.getElementById('controlPanel');
	var trackInfoPanel = document.getElementById('trackInfoPanel');
	var infoImage = document.getElementById('infoImage');
	var infoArtist = document.getElementById('infoArtist');
	var infoTrack = document.getElementById('infoTrack');
	var messageBox = document.getElementById('messageBox');

	this.clearInfoPanel = function () {
		// first clear the current contents
		infoArtist.innerHTML = "";
		infoTrack.innerHTML = "";
		trackInfoPanel.className = 'hidden';
	};
	this.update = function (loader) {
		// update the track and artist into in the controlPanel
		var artistLink = document.createElement('a');
		artistLink.setAttribute('href', loader.sound.user.permalink_url);
		artistLink.innerHTML = loader.sound.user.username;
		var trackLink = document.createElement('a');
		trackLink.setAttribute('href', loader.sound.permalink_url);

		if (loader.sound.kind == "playlist") {
			trackLink.innerHTML = "<p>" + loader.sound.tracks[loader.streamPlaylistIndex].title + "</p>" + "<p>" + loader.sound.title + "</p>";
		} else {
			trackLink.innerHTML = loader.sound.title;
		}

		var image = loader.sound.artwork_url ? loader.sound.artwork_url : loader.sound.user.avatar_url; // if no track artwork exists, use the user's avatar.
		infoImage.setAttribute('src', image);

		infoArtist.innerHTML = '';
		infoArtist.appendChild(artistLink);

		infoTrack.innerHTML = '';
		infoTrack.appendChild(trackLink);

		// display the track info panel
		trackInfoPanel.className = '';

		// add a hash to the URL so it can be shared or saved
		var trackToken = loader.sound.permalink_url.substr(22);
		window.location = '#' + trackToken;
	};
	this.toggleControlPanel = function () {
		if (controlPanel.className.indexOf('hidden') === 0) {
			controlPanel.className = '';
		} else {
			controlPanel.className = 'hidden';
		}
	};
	this.displayMessage = function (title, message) {
		messageBox.innerHTML = ''; // reset the contents

		var titleElement = document.createElement('h3');
		titleElement.innerHTML = title;

		var messageElement = document.createElement('p');
		messageElement.innerHTML = message;

		var closeButton = document.createElement('a');
		closeButton.setAttribute('href', '#');
		closeButton.innerHTML = 'close';
		closeButton.addEventListener('click', function (e) {
			e.preventDefault();
			messageBox.className = 'hidden';
		});

		messageBox.className = '';
		// stick them into the container div
		messageBox.appendChild(titleElement);
		messageBox.appendChild(messageElement);
		messageBox.appendChild(closeButton);
	};
};