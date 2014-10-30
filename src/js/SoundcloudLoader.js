/**
 * Makes a request to the Soundcloud API and returns the JSON data.
 */
var SoundcloudLoader = function (player, UI) {
    var self = this;
    var client_id = "15b0abc3b73c0a64fd45d2ef8fdbd06c"; // to get an ID go to http://developers.soundcloud.com/
    this.sound = {};
    this.streamUrl = "";
    this.errorMessage = "";
    this.player = player;
    this.UI = UI;

    /**
     * Loads the JSON stream data object from the URL of the track (as given in the location bar of the browser when browsing Soundcloud),
     * and on success it calls the callback passed to it (for example, used to then send the stream_url to the audiosource object).
     * @param track_url
     * @param callback
     */
    this.loadStream = function (track_url, successCallback, errorCallback) {
        SC.initialize({
            client_id: client_id
        });
        SC.get('/resolve', {
            url: track_url
        }, function (sound) {
            if (sound.errors) {
                self.errorMessage = "";
                for (var i = 0; i < sound.errors.length; i++) {
                    self.errorMessage += sound.errors[i].error_message + '<br>';
                }
                self.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
                errorCallback();
            } else {

                if (sound.kind == "playlist") {
                    self.sound = sound;
                    self.streamPlaylistIndex = 0;
                    self.streamUrl = function () {
                        return sound.tracks[self.streamPlaylistIndex].stream_url + '?client_id=' + client_id;
                    }
                    successCallback();
                } else {
                    self.sound = sound;
                    self.streamUrl = function () {
                        return sound.stream_url + '?client_id=' + client_id;
                    };
                    successCallback();
                }
            }
        });
    };


    this.directStream = function (direction) {
        if (direction == 'toggle') {
            if (this.player.paused) {
                this.player.play();
            } else {
                this.player.pause();
            }
        } else if (this.sound.kind == "playlist") {
            if (direction == 'coasting') {
                this.streamPlaylistIndex++;
            } else if (direction == 'forward') {
                if (this.streamPlaylistIndex >= this.sound.track_count - 1) this.streamPlaylistIndex = 0;
                else this.streamPlaylistIndex++;
            } else {
                if (this.streamPlaylistIndex <= 0) this.streamPlaylistIndex = this.sound.track_count - 1;
                else this.streamPlaylistIndex--;
            }
            if (this.streamPlaylistIndex >= 0 && this.streamPlaylistIndex <= this.sound.track_count - 1) {
                this.player.setAttribute('src', this.streamUrl());
                this.UI.update(this);
                this.player.play();
            }
        }
    }


};