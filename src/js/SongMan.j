'use strict';

var context;

var SongMan = (function () {
    var SoundCloudAudioSource = function (player) {
        var self = this;
        var analyser;
        var audioCtx = new(window.AudioContext || window.webkitAudioContext);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        var source = audioCtx.createMediaElementSource(player);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        var sampleAudioStream = function () {
            analyser.getByteFrequencyData(self.streamData);
            // calculate an overall volume value
            var total = 0;
            for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
                total += self.streamData[i];
            }
            self.volume = total;
        };
        setInterval(sampleAudioStream, 20);
        // public properties and methods
        this.volume = 0;
        this.streamData = new Uint8Array(128);
        this.playStream = function (streamUrl) {
            // get the input stream from the audio element
            player.addEventListener('ended', function () {
                self.directStream('coasting');
            });
            player.setAttribute('src', streamUrl);
            player.play();
        }
    };


    /**
     * Makes a request to the Soundcloud API and returns the JSON data.
     */
    var SoundcloudLoader = function (player, uiUpdater) {
        var self = this;
        var client_id = "15b0abc3b73c0a64fd45d2ef8fdbd06c"; // to get an ID go to http://developers.soundcloud.com/
        this.sound = {};
        this.streamUrl = "";
        this.errorMessage = "";
        this.player = player;
        this.uiUpdater = uiUpdater;

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
                    //this.uiUpdater.update(this);
                    this.player.play();
                }
            }
        }
    };



    function init() {

        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext();

        } catch (e) {
            window.alert('Web Audio API is not supported in this browser');
        }


        //var visualizer = new Visualizer();
        var player = document.getElementById('player');

        //var uiUpdater = new UiUpdater();
        var loader = new SoundcloudLoader(player, null);

        var audioSource = new SoundCloudAudioSource(player);
        var form = document.getElementById('form');
        var loadAndUpdate = function (trackUrl) {
            loader.loadStream(trackUrl,
                function () {

                    console.log('ok');
                    //uiUpdater.clearInfoPanel();
                    audioSource.playStream(loader.streamUrl());
                    //uiUpdater.update(loader);
                    //setTimeout(uiUpdater.toggleControlPanel, 3000); // auto-hide the control panel
                },
                function () {
                    console.log('error');
                    //uiUpdater.displayMessage("Error", loader.errorMessage);
                });
        };

        /*visualizer.init({
            containerId: 'visualizer',
            audioSource: audioSource
        });*/

        // on load, check to see if there is a track token in the URL, and if so, load that automatically
        //if (window.location.hash) {
        //var trackUrl = 'https://soundcloud.com/' + window.location.hash.substr(1);
        var trackUrl = "https://soundcloud.com/njsmusic/njs-make-a-stand-over-another";
        loadAndUpdate(trackUrl);
        //}

        window.addEventListener("keydown", keyControls, false);

        function keyControls(e) {
            switch (e.keyCode) {
            case 32:
                // spacebar pressed
                loader.directStream('toggle');
                break;
            case 37:
                // left key pressed
                loader.directStream('backward');
                break;
            case 39:
                // right key pressed
                loader.directStream('forwar
                    d');
                break;
            }
        }
    };



    window.addEventListener('load', this.init, false);

    return SongMan;

})();