var showSpell = function() {
	//console.time('show-spell');
	//$container = $('off-canvas-container').detach();
	$('body').removeClass("active-nav").toggleClass("active-spell");
	$('.menu-button').removeClass("active-button");
	$('.spell-button').toggleClass("active-button");
	//$container.appendTo($('body'));
	//console.timeEnd('show-spell');
};

var showMenu = function() {
	//console.time('show-menu');
	//$container = $('off-canvas-container').detach();
	$('body').removeClass("active-spell").toggleClass("active-nav");
	$('.spell-button').removeClass("active-button");
	$('.menu-button').toggleClass("active-button");
	//$container.appendTo($('body'));
	//console.timeEnd('show-menu');
};

// add/remove classes everytime the window resize event fires
$(window).resize(function() {
	var off_canvas_nav_display = $('.off-canvas-navigation').css('display');
	//var menu_button_display = $('.menu-button').css('display');
	//console.info(sprintf('resize() nav[%s] menu[%s]', off_canvas_nav_display, menu_button_display));
	if (off_canvas_nav_display === 'block') {
		$("body").removeClass("three-column").addClass("small-screen");
	}
	if (off_canvas_nav_display === 'none') {
		$("body").removeClass("active-spell active-nav small-screen")
			.addClass("three-column");
	}
});

$(document).ready(function() {
	// Toggle for nav menu
	$('.menu-button').click(function(e) {
		e.preventDefault();
		showMenu();
	});
	// Toggle for spell
	$('.spell-button').click(function(e) {
		e.preventDefault();
		showSpell();
	});
});