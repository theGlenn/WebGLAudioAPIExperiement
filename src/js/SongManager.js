'use strict';

var SongManager = (function () {

  var BEAT_MIN = 0.15; //a volume less than this is no beat
  var beatTime = 0;
  var beatHoldTime = 40;
  var beatDecayRate = 0.97;

  function SongManager(ui) {
    // body...
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.allValues = [];
    this.beatCutOff = 0;
    this.audioNodeSettedUp = false;
    this.UI = ui;

  }

  SongManager.prototype.load = function (fun) {  
    this.audio = window.audio = document.getElementById('player');  

    window.songman = this;

    console.log("loading...", window.audio);

    window.audio.addEventListener('canplaythrough', function () {
      if (!window.songman.sourceNode) {
        window.songman.setupAudioNodes();
        fun.call();
      }

    }, false);

  };

  SongManager.prototype.loadAndUpdate = function (trackUrl) {
    var $$ = this;
    this.loader.loadStream(trackUrl,
      function () {
        //uiUpdater.clearInfoPanel();
        //console.log($$.source);
        $$.playStream($$.loader.streamUrl());
        $$.UI.update($$.loader);
        setTimeout($$.UI.toggleControlPanel, 3000); // auto-hide the control panel
      },
      function () {
        //$$.UI.displayMessage("Error", loader.errorMessage);
      });
  };


  SongManager.prototype.render = function () {  
    // update data in frequencyData
         
    //this.analyser.getByteFrequencyData(this.frequencyData);     
    // render frame based on values in frequencyData
    //console.log(this.frequencyData);
  }


  SongManager.prototype.setupAudioNodes = function () {

    this.volume = 0;
    this.streamData = new Uint8Array(128);

    this.analyser = (this.analyser || this.context.createAnalyser());

    // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
    // frequencyBinCount tells you how many values you'll receive from the analyser

    this.analyser.smoothingTimeConstant = 0.8;
    //this.analyser.fftSize = 512;
    this.analyser.fftSize = 1024;
    //songman.analyser.fftSize = 256;

    this.loader = new SoundcloudLoader(this.audio, this.UI);
    this.audiosource = new SoundCloudAudioSource(this.audio, this);

    console.log(this.loader);

    //setInterval(this.sampleAudioStream, 20);

    //if (!this.sourceNode)
    this.sourceNode = this.context.createMediaElementSource(window.audio);
    this.sourceNode.connect(this.analyser);
    this.sourceNode.connect(this.context.destination);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);   

    console.log("loaded !");
    this.audioNodeSettedUp = true;
    window.audio.play();

  }


  SongManager.prototype.playStream = function (streamUrl) {
    var $$ = this;
    // get the input stream from the audio element
    window.audio.addEventListener('ended', function () {
      $$.loader.directStream('coasting');
    });
    window.audio.setAttribute('src', streamUrl);
    window.audio.play();
  }


  SongManager.prototype.sampleAudioStream = function () {
    this.analyser.getByteFrequencyData(this.streamData);
    // calculate an overall volume value
    var total = 0;
    for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
      total += this.streamData[i];
    }
    this.volume = total;
  };


  SongManager.prototype.getSoundDataAverage = function (array) {
    this.analyser.smoothingTimeConstant = 0.1;
    this.analyser.getByteFrequencyData(array);
    var average = 0;
    for (var i = 0, lgth = array.length; i < lgth; ++i) {
      average += array[i];
    }

    var fixedAverage = (average / lgth) == 0 ? 1 : (average / lgth);

    return fixedAverage;
  };



  /**
   * Calculates the average amplitude of each frequency
   * @param array - array containing the amplitude of each frequency
   * @returns the average amplitude of all frequency
   */
  SongManager.prototype.getAverageVolume = function (array) {
    var values = 0;
    var average;
    var length = array.length;
    //console.log(length);
    // sum the frequency amplitudes
    for (var i = 0; i < length; i++) {
      values += array[i];
    }
    // then mean it
    average = values / length;
    return average;
  }



  /**
   * Calculate the intensity from the average of the 100 last sound values
   */
  SongManager.prototype.getSoundDataIntensity = function (arr) {
    var fixedAverage = this.getSoundDataAverage(arr);
    var i = 0;
    var totalSongAverage = 0;


    if (arr.length > 20) {
      this.allValues.shift();
      this.allValues.push(fixedAverage);
    } else {
      this.allValues.push(fixedAverage);
    }

    for (i = 0; i < this.allValues.length; i++) {
      totalSongAverage += this.allValues[i];
    };

    return (totalSongAverage / this.allValues.length).toFixed();
  };


  SongManager.prototype.getMicInput = function () {

    stopSound();
    //x-browser
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia) {

      navigator.getUserMedia(

        {
          audio: true
        },

        function (stream) {

          //reinit here or get an echo on the mic
          this.sourceNode = audioContext.createBufferSource();
          this.analyser = audioContext.createAnalyser();
          this.analyser.fftSize = 1024;
          this.analyser.smoothingTimeConstant = 0.3;

          this.microphone = audioContext.createMediaStreamSource(stream);
          this.microphone.connect(this.analyser);
          isPlayingAudio = true;
          // console.log("here");
        },

        // errorCallback
        function (err) {
          alert("The following error occured: " + err);
        }
      );

    } else {
      alert("Could not getUserMedia");
    }
  }

  SongManager.prototype.stopSound = function () {
    //isPlayingAudio = false;
    if (this.sourceNode) {
      this.sourceNode.stop(0);
      this.sourceNode.disconnect();
    }
  }


  SongManager.prototype.doBeat = function (array, onBeat) {

    var level = this.getSoundDataAverage(array);
    // body...
    //BEAT DETECTION
    //console.log('beatMan', level, this.beatCutOff);
    if (level > this.beatCutOff && level > BEAT_MIN) {

      onBeat();
      this.beatCutOff = level * 1.1;
      beatTime = 0;
    } else {
      if (beatTime <= beatHoldTime) {
        beatTime++;
      } else {
        this.beatCutOff *= beatDecayRate;
        this.beatCutOff = Math.max(this.beatCutOff, BEAT_MIN);
      }
    }
  }



  SongManager.prototype.loadSong = function (url) {
    var audio = this.audio;
    if (audio) audio.remove();
    if (this.sourceNode) this.sourceNode.disconnect();
    //cancelAnimationFrame(audioAnimation);
    audio = new Audio();
    audio.src = url;
    audio.addEventListener("canplay", function (e) {
      setupAudioNodes();
    }, false);
  }

  return SongManager;

})();