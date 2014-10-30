var webgl, sm, gui, clock, ui;

var baseURI = "https://soundcloud.com/hydeout-productions/luvsic-part6-remix";

function init() {


	webgl = new Webgl(window.innerWidth, window.innerHeight);
	ui = new UIManager();
	ui.toggleControlPanel();



	//gui = new dat.GUI();
	//gui.close();

	$(window).on('resize', resizeHandler);

	var clock = new THREE.Clock();

	sm = new SongManager(ui);
	sm.load(function () {
		animate();
		sm.loadAndUpdate(baseURI);
	});

	var form = document.getElementById('form');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
		var trackUrl = document.getElementById('input').value;
		sm.loadAndUpdate(trackUrl);
	});

}

function resizeHandler() {
	webgl.resize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	webgl.render(sm);
}

function onDocumentMouseDown(event) {
	webgl.onDocumentMouseDown(event)
}

$(document).ready(init);
$('.three').mousedown(onDocumentMouseDown);
$('#controlPanel').hover(function () {
	ui.toggleControlPanel();
});