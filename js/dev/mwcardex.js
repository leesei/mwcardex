/*global gSpellDB sprintf*/
"use strict";

var
DEV = 1, // master switch for debug logs
LOG_LEVEL_DEBUG = 1,
LOG_LEVEL_VERBOSE = 0;

// timer for autosearch when user changed the search field
// got to be global so we can reset it
// TODO: one point of improvement could be in here: currently the change event is
// invoked even if a change does not occur (e.g. by pressing a modifier key or
// something)
var
searchTimer,
searchTimeout = 200;

var
FADE_MS_LONG = 300,  // for image, div fading in
FADE_MS_SHORT = 200;  // for spell list, div fading out

function dumpSpellDBEntry(id) {
	if (!LOG_LEVEL_DEBUG) {
		return;
	}

	var entry = gSpellDB[id];
	console.debug('"%s": [%s] type[%s] sch[%s] cost[%d]', id, entry.name, entry.type, entry.schools, entry.cost);
}

function dev_init() {
	// init our development environment
	var i, names,
	nullFunc = function() {
	};

	/*
	snippet adopted from:
		http://stackoverflow.com/questions/217957/how-to-print-debug-messages-in-the-google-chrome-javascript-console
	 */
	// create a noop console object if the browser doesn't provide one ...
	if (!window.console) {
		window.console = {};
	} else {
		// IE has a console that has a 'log' function but no 'debug'. to make console.debug work in IE,
		// we just map the function. (extend for info etc if needed)
		if (!window.console.debug && typeof window.console.log !== 'undefined') {
			window.console.debug = window.console.log;
		}
	}


	// ... and create all functions we expect the console to have (took from firebug).
	names = ["verbose", "log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
			"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

	if (!DEV) {
		for (i = 0; i < names.length; ++i) {
			window.console[names[i]] = nullFunc;
		}
		return;
	}

	for (i = 0; i < names.length; ++i) {
		if (!window.console[names[i]]) {
			window.console[names[i]] = nullFunc;
		}
	}

	/*
	// test console logging
	console.debug('debug');
	console.log('log');
	console.info('info');
	console.warn('warn');
	console.error('error');
	console.dir(this);
	*/

	// now apply my debugging level
	if (!LOG_LEVEL_DEBUG) {
		console.debug = nullFunc;
		console.dir = nullFunc;
	}
	if (!LOG_LEVEL_VERBOSE) {
		console.verbose = nullFunc;
	}
	else {
		console.verbose = console.log;
	}
}

function monitorAppCacheUpdate() {
	console.group('monitorAppCacheUpdate()');

	var cacheStatusValues = [], logEvent, cache;

	cacheStatusValues[0] = 'uncached';
	cacheStatusValues[1] = 'idle';
	cacheStatusValues[2] = 'checking';
	cacheStatusValues[3] = 'downloading';
	cacheStatusValues[4] = 'updateready';
	cacheStatusValues[5] = 'obsolete';

	logEvent = function(e) {
		var online, status, type, message;
		online = (navigator.onLine) ? 'yes' : 'no';
		status = cacheStatusValues[cache.status];
		type = e.type;
		message = 'online: ' + online;
		message += ', event: ' + type;
		message += ', status: ' + status;
		if (type == 'error' && navigator.onLine) {
			message += ' (prolly a syntax error in manifest)';
		}
		console.log(message);
	};


	cache = window.applicationCache;
	cache.addEventListener('cached', logEvent, false);
	cache.addEventListener('checking', logEvent, false);
	cache.addEventListener('downloading', logEvent, false);
	cache.addEventListener('error', logEvent, false);
	cache.addEventListener('noupdate', logEvent, false);
	cache.addEventListener('obsolete', logEvent, false);
	cache.addEventListener('progress', logEvent, false);
	cache.addEventListener('updateready', logEvent, false);
	cache.addEventListener(
		'updateready',
		function() {
			window.applicationCache.swapCache();
			console.log('swap cache has been called');
			window.location.reload();
		},
		false
	);

	console.groupEnd();
}

function init() {
	console.group('init()');

	var
	$siholder = $('#spell-img-holder'),
	$sfcheckbox = $('#school-filters input:checkbox'),
	$tfcheckbox = $('#type-filters input:checkbox');

	mageInfoInit();
	spellListInit();
	//schoolFilterInit();
	//typeFilterInit();

	$siholder
		.hide()  // hide first for fade in
		.on('load', function() {
			// fade in on load
			//console.debug('[%s] loaded', $(this).attr('src'));
			$(this).fadeIn(FADE_MS_LONG);
		});

	// search fields
		// search and incremental only works on Webkit, what a pity
		// use simple timer instead
	$('#name-filter, #tag-filter')
		.on('change', function() {
			filterSpells(this);
		})
		.on('keydown', function() {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(function() {
				filterSpells(this);
			}, searchTimeout);
		})
		// set clear button
		.next().on('click', function() {
			// clear text of search field
			$(this).prev().val('').change();
		});

	/*
	// event logger for text fields
	$('#name-filter, #tag-filter').on('search change blur focus focusin focusout', function(evt) {
		console.log("evt captured: %O", evt.type);
	});
	//*/

	// school-filters
	$('#school-filter-all')
		.on('click', function() {
			$sfcheckbox.prop('checked', true);
			filterSpells(this);
		});
	$('#school-filter-none')
		.on('click', function() {
			$sfcheckbox.prop('checked', false);
			filterSpells(this);
		});
	$sfcheckbox
		.prop('checked', true)  // select all by defualt
		.on('change', function() {
			filterSpells(this);
		});

	// type-filters
	$('#type-filter-all')
		.on('click', function() {
			$tfcheckbox.prop('checked', true);
			filterSpells(this);
		});
	$('#type-filter-none')
		.on('click', function() {
			$tfcheckbox.prop('checked', false);
			filterSpells(this);
		});
	$tfcheckbox
		.prop('checked', true)  // select all by defualt
		.on('change', function() {
			filterSpells(this);
		});

	console.groupEnd();
}

function mageInfoInit() {
	console.group('mageInfoInit()');

	// initialize mage select menu
	$('#mage-select')
		.on('change', function() {
			console.debug('render mage[%s] info', this.value);
			$('#mage-info-holder').html(
				'<img src="mages/'+this.value+'_1.jpg" /> '+
				'<img src="mages/'+this.value+'_2.jpg" />'
			);
		});

	console.groupEnd();
}

function spellListInit() {
	console.group('spellListInit()');

	var	$spells = [],
	// genrtate a spell entry (li element)
	genSpellEntry = function(id, entry) {
		var
		$badges, $spell_entry, school,
		$siholder = $('#spell-img-holder');

		// create badges div for this spell according to its tags
		$badges = $('<div>').css('float', 'right');
		for (school in entry.schools) {
			$badges.append('<img src="images/'+school+'.png" class="badge-icon">');
		}
		//.append('<img src="images/range.png" class="badge-icon"><img src="images/melee.png" height="30px">');

		$spell_entry =
			$(sprintf('<li id="%s" class="type-%s">', id, entry.type))
			.append(sprintf('<a href="#">%s</a>', entry.name))
			.append($badges)
			// to make li bound the badges (which is floating)
			.append($('<div>').addClass('expander'))
			.on('click', function(evt) {
				console.verbose('> spell %s clicked', id);
				evt.preventDefault();
				// only reload if the spell already shown is different
				if ($siholder.attr('src').indexOf(id) == -1)
				{
					$siholder.hide();
					$siholder.attr('src', sprintf('spells/%s.jpg', id));
				}
			});

		return $spell_entry;
	};

	// generate li nodes from DB entries
	// attach to local spells array, sort and insert to dom
	$.each(gSpellDB, function(id, entry) {
		console.verbose('%s: %O', id, entry);
		$spells.push(genSpellEntry(id, entry));
		// convert name in entry to lower case for later string comparison
		entry.name = entry.name.toLowerCase();
	});
	// sort spell list
	$spells.sort(function($e1, $e2) {
		var str1 = $e1.text(), str2 = $e2.text();
		if (str1 == str2)
			return 0;
		if (str1 > str2)
			return 1;
		if (str1 < str2)
			return -1;
	});
	$('#spell-list-holder').append($spells);

	$('#visible-spell-count').text($spells.length);

	console.groupEnd();
}

function schoolFilterInit() {
	console.group('schoolFilterInit()');
	console.groupEnd();
}

function typeFilterInit() {
	console.group('typeFilterInit()');
	console.groupEnd();
}

function filterSpells(input_ele) {
	console.group("filterSpells (triggerer: %O)", input_ele);

	// trash the current spell shown
	$('#spell-img-holder').slideUp(FADE_MS_SHORT);
		// these won't work on Chrome, pitty
		// .removeAttr('src'), .attr('src', '')

	console.time('> [total]');

	// detach the spells (li) from ul, do filtering (add '.hidden') and append
	// prevents reflow in the middle of filtering
	var
	$spells_visible, quit = false, length,
	$spells = $('#spell-list-holder>li').detach(), // NOTE: detached
	$sfcheckbox = $('#school-filters input:checkbox'),
	$sfchecked = $sfcheckbox.filter(':checked'),  // checked checkboxes
	schools_selected = {},  // dict for representing selected schools
	$tfcheckbox = $('#type-filters input:checkbox'),
	$tfchecked = $tfcheckbox.filter(':checked'),  // checked checkboxes
	types_selected = '',  // string for representing selected types
	name_filter = $.trim($('#name-filter').val()).toLowerCase(),
	tag_filter = $.trim($('#tag-filter').val()).toLowerCase();

	// show all spells
	$spells.removeClass('hidden');

	// school filtering, hide spells not of selected schools
	console.time('school-filter');
	if (!quit) {
		length = $sfchecked.length;
		if (length === 0) {
			console.info('> [school] none selected, quit');
			$spells.addClass('hidden');
			quit = true;
		}
		else if (length == $sfcheckbox.length) {
			console.info('> [school] all, skip filtering');
		}
		else {
			// build filter dict
			$sfchecked.each(function() {
				schools_selected[this.value] = true;
			});

			$spells_visible = $spells.filter(':not(".hidden")');
			console.log('> [school] filter[%O] on %d checked, %d visible',
				schools_selected, $sfchecked.length, $spells_visible.length);

			// filter out spell which does not have school in schools_selected
			$spells_visible
				.filter(function() {
					console.verbose('>> [school] #%s %O', this.id, gSpellDB[this.id].schools);
					for (var school in gSpellDB[this.id].schools) {
						if (school in schools_selected)
							return false;
					}
					return true;
				})
				.addClass('hidden');
		}
	}
	console.timeEnd('school-filter');

	// type filtering, hide spells not of selected types
	console.time('type-filter');
	if (!quit) {
		length = $tfchecked.length;
		if (length === 0) {
			console.info('> [type] none selected, quit');
			$spells.addClass('hidden');
			quit = true;
		}
		else if (length == $tfcheckbox.length) {
			console.info('> [type] all, skip filtering');
		}
		else {
			// build filter string
			$tfchecked.each(function() {
				types_selected += this.value;
			});

			$spells_visible = $spells.filter(':not(".hidden")');
			console.log('> [type] filter[%s] on %d checked, %d visible',
				types_selected, $tfchecked.length, $spells_visible.length);

			// filter out spell whose type is not in types_selected
			$spells_visible
				.filter(function() {
					return ($.inArray(gSpellDB[this.id].type, types_selected) == -1);
				})
				.addClass('hidden');
		}
	}
	console.timeEnd('type-filter');

	// name filter, hide spells not matching the input name
	console.time('name-filter');
	if (!quit) {
		if (name_filter.length) {
			$spells_visible = $spells.filter(':not(".hidden")');
			console.log('> [name] filter[%s], %d visible', name_filter, $spells_visible.length);

			$spells_visible
				.filter(function() {
					console.verbose('>> [name] "%s" in "%s" = %d',
						name_filter,
						gSpellDB[this.id].name,
						gSpellDB[this.id].name.indexOf(name_filter));
					return (gSpellDB[this.id].name.indexOf(name_filter) == -1);
				})
				.addClass('hidden');
		}
		else {
			console.info('> [name] skipped');
		}
	}
	console.timeEnd('name-filter');

	// tag filter, hide spells not matching the input attribute
	console.time('tag-filter');
	if (!quit) {
		if (tag_filter.length) {
			$spells_visible = $spells.filter(':not(".hidden")');
			console.log('> [tag] \'%s\', %d visible', tag_filter, $spells_visible.length);

			// TODO: split(tag_filter, ',') and loop
			/*
			$spells_visible
				.filter(function() {
					return ($.inArray(tag, gSpellDB[this.id].tags) == -1);
				})
				.addClass('hidden');
			*/
		}
		else {
			console.info('> [tag] skipped');
		}
	}
	console.timeEnd('tag-filter');

	$('#spell-list-holder').append($spells);
	console.timeEnd('> [total]');

	$spells_visible = $spells.filter(':not(".hidden")');
	console.info('filter done, %d visible', $spells_visible.length);
	$('#visible-spell-count').text($spells_visible.length);

	console.groupEnd();
}

$(document).ready(function() {
	// any code goes here
	dev_init();
	monitorAppCacheUpdate();
	init();
});