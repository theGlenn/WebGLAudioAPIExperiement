WebGL & AudioAPI Experiment
===================

Three.js starter kit made for Three.js Workshop.  
It uses Three.js, Greensock and Jquery as depencies.  
I also added a few Three.js extra classes from the examples for post-processing.  


This is a 3D visualizer experiement made with [ThreeJS](https://github.com/mrdoob/three.js/).
The app procedurally generate a terrain reacting to the music inpute with the Audio API and SoundCloud

Thanks to [michaelbromley](https://github.com/michaelbromley/soundcloud-visualizer) for his SoundCloudLoader.

Demo
----

[Here is demo](http://experiments.crma.ninja/repos/glenn-sonna/#bernardo-guerra/hiromi-uehara-dan-ando-no-para)
Feel free to critique and to fork I intend to Improve myself.

You can play your own song by going to [SoundCloud](https://soundcloud.com) find the music or playlist you want and copy/paste the url  into the input of the visualizer, hit enter or press the play button then enjoy !

If you have some cool song making nice visual interaction with the app send it to me !

Controls
----
spacebar = play/pause
-> (right arrow key) = next track in the playlist
<- (left arrow key) = previous track in the playlist


Version
----

1.0

## Requirements

- [Node and npm](http://nodejs.org)

Dependencies
-----------

* [threejs](https://github.com/mrdoob/three.js/) - JavaScript 3D library
* [gulp](http://gulpjs.com/) - The streaming build system


Installation
--------------

1. Clone the repository : `git clone git@github.com:theGlenn/WebGLAudioAPIExperiement`
2. Install the application : `npm i`
3. Then install the libraries :  `bower install`
4. Then launch gulp to build : `gulp`
5. You can use the `index.html`, personally I recomend you to run `http-server` command with node to run it from your browser at `http://localhost:8080`
