############################################################################
# Copyright 2009 Benjamin Kellermann                                       #
#                                                                          #
# This file is part of dudle.                                              #
#                                                                          #
# Dudle is free software: you can redistribute it and/or modify it under   #
# the terms of the GNU Affero General Public License as published by       #
# the Free Software Foundation, either version 3 of the License, or        #
# (at your option) any later version.                                      #
#                                                                          #
# Dudle is distributed in the hope that it will be useful, but WITHOUT ANY #
# WARRANTY; without even the implied warranty of MERCHANTABILITY or        #
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     #
# License for more details.                                                #
#                                                                          #
# You should have received a copy of the GNU Affero General Public License #
# along with dudle.  If not, see <http://www.gnu.org/licenses/>.           #
############################################################################

DOMAIN=dudle_dc-net

locale: $(foreach p,$(wildcard locale/*/$(DOMAIN).po), $(addsuffix .mo,$(basename $p)))
locale/$(DOMAIN).pot: *.js
	rm -f $@
	xgettext -L Python *.js -o $@

%.mo: %.po
	rmsgfmt $*.po -o $*.mo

locale/%/$(DOMAIN).po: locale/$(DOMAIN).pot
	msgmerge $@ $? >/tmp/$(DOMAIN)_$*_tmp.po
	if [ "`msgcomm -u /tmp/$(DOMAIN)_$*_tmp.po $@`" ];then\
		mv /tmp/$(DOMAIN)_$*_tmp.po $@;\
	else\
		touch $@;\
	fi
	if [ "`potool -fnt $@ -s`" != "0" -o "`potool -ff $@ -s`" != "0" ];then\
		poedit $@;\
	fi

check: $(foreach p,$(wildcard *.js), $p.check)
%.js.check: %.js
	echo -n "/*jslint cap: true, newcap: false, regexp: false, strict: true, browser: true, nomen: false, plusplus: false */" > /tmp/$*.js
	echo -n "/*global alert, confirm, window, localStorage, Ajax, Element, Hash, $$, $$" >> /tmp/$*.js
	echo -n "$$, $$" >> /tmp/$*.js
	echo -n "H, $$" >> /tmp/$*.js
	echo -n "A, $$" >> /tmp/$*.js
	echo -n "F, _, printf, Autocompleter, BigInteger, SecureRandom, SHA256_hash, AES_Init, AES_Done, AES_ExpandKey, AES_Decrypt */" >> /tmp/$*.js
	cat $*.js >> /tmp/$*.js
	rhino lib/jslint.js /tmp/$*.js

compressed: $(foreach p,$(wildcard *.js), compressed/$p)
compressed/%.js: %.js.check %.js
	cat $*.js |ruby lib/jsmin.rb > $@

watch:
	while true; do\
		FILE=`inotifywait -e close_write --format="%w%f" --exclude '(/[^\\.]*\$$|\\.swp\$$|qt_temp\\..*)' . 2>/dev/null`;\
		EXT=`echo $$FILE|sed -e 's/^.*\.\([^.]*\)$$/\1/g'`;\
		FILEBASENAME=`basename $$FILE .$$EXT`;\
		case $$EXT in\
		js)\
			make compressed/$$FILEBASENAME.$$EXT;\
			;;\
		*)\
			echo "$$FILE was modified and I don't know what to do!";\
			continue;\
			;;\
		esac;\
	done

