/****************************************************************************
 * Copyright 2009,2010,2011 Benjamin Kellermann                             *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";

if (typeof(Poll) == "undefined") {
	var Poll = {};
} else {
	alert("Somebody captured the Namespace Poll!!!");	
}

var gt = new Gettext({ 'domain' : 'dudle' });
function _(msgid) { 
	return gt.gettext(msgid); 
}
function printf(msg, replaceary) {
	return Gettext.strargs(msg, replaceary); 
}


/* returns firefox, ie, opera, safari, chrome, unknown */
function gfBrowserName() {
	var agent, i, browsers;
	agent = navigator.userAgent.toLowerCase();
	browsers =  ["chrome", "epiphany", "opera", "safari", "firefox", "ie"];
	for	(i = 0; i < browsers.length; i++) {
		if (agent.indexOf(browsers[i]) > -1) {
			return browsers[i];
		}
	}
	return "unknown";
}
