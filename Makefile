# Configuration #
# ============= #
BUILD_DIR = build
SRC_DIR = src
STATIC_DIR = static
SCRIPTS_DIR = $(SRC_DIR)/scripts

# Static dependencies #
# =================== #
STATIC_FILES = $(wildcard ${STATIC_DIR}/*.html) \
			   $(wildcard ${STATIC_DIR}/styles/*.css) \
			   $(wildcard ${STATIC_DIR}/config/*.json)

# Script dependencies #
# =================== #
MAIN_SCRIPT = main
SCRIPTS = $(wildcard ${SCRIPTS_DIR}/*.ts)

# Rules #
# ===== #
${BUILD_DIR}/release: ${STATIC_FILES} ${BUILD_DIR}/bundle.min.js
	rm -rf $@
	cp -R ${STATIC_DIR}/. $@
	cp ${BUILD_DIR}/bundle.min.js $@/bundle.js

${BUILD_DIR}/debug: ${STATIC_FILES} ${BUILD_DIR}/bundle.js
	rm -rf $@
	cp -R ${STATIC_DIR}/. $@
	cp ${BUILD_DIR}/bundle.js $@/bundle.js

${BUILD_DIR}/bundle.min.js: ${BUILD_DIR}/bundle.js
	npx uglifyjs --compress --mangle -o $@ -- $^

${BUILD_DIR}/bundle.js: ${BUILD_DIR}/javascript ${BUILD_DIR}/lint
	npx rollup --config --input $</${MAIN_SCRIPT}.js --file $@

${BUILD_DIR}/javascript: ${SCRIPTS}
	rm -rf $@
	npx tsc --outDir $@

${BUILD_DIR}/lint: ${SCRIPTS}
	rm -f $@
	npx eslint ${SCRIPTS_DIR} --max-warnings 0
	mkdir -p ${BUILD_DIR}
	touch $@

.PHONY: clean
clean:
	rm -rf ${BUILD_DIR}