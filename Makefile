CSS_FILES=mycss.css offcanvas.css
JS_FILES=spell_database.js spell_subtypes.js spell_tags.js mwcardex.js offcanvas.js

CSS_TARGETS=$(patsubst %.css, %.min.css, $(addprefix css/, $(CSS_FILES)))
$(info CSS_TARGETS: $(CSS_TARGETS))

JS_TARGETS=$(patsubst %.js, %.min.js, $(addprefix js/, $(JS_FILES)))
$(info JS_TARGETS: $(JS_TARGETS))

stub:

release:
	@for f in $(CSS_FILES); do \
		lessc --yui-compress css/dev/$$f > css/$${f%.css}.min.css; \
	done;
	@for f in $(JS_FILES); do \
		uglifyjs --define RELEASE=1 js/dev/$$f -cm > js/$${f%.js}.min.js; \
	done;

clean:
	rm -f $(CSS_TARGETS)
	rm -f $(JS_TARGETS)

